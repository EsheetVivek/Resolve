import { and, desc, eq, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { auditLog, passages, policies, policyVersions } from "@/db/schema";
import { slugify, splitPolicy } from "@/lib/passages";
import { SAMPLE_POLICIES } from "@/lib/sample-policies";
import type { Member } from "@/lib/workspace";

export class PolicyError extends Error {
  constructor(public code: "FORBIDDEN" | "INVALID" | "NOT_FOUND", message: string) { super(message); }
}

/** Only leads and admins change policy: what the AI may say is a decision for people with authority. */
export const canPublish = (m: Pick<Member, "role">) => m.role === "lead" || m.role === "admin";

/**
 * Publishes a new immutable version of a policy (creating the policy if needed) and its passages.
 * Older versions stay, so past drafts can always show the exact wording they cited.
 */
export async function publishPolicy(db: DB, m: Pick<Member, "workspaceId" | "role" | "userId">, input: { title: string; body: string; note?: string; policyId?: string }) {
  if (!canPublish(m)) throw new PolicyError("FORBIDDEN", "Only leads and admins can publish policy.");
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || title.length > 80 || !body || body.length > 50_000) throw new PolicyError("INVALID", "A policy needs a title (up to 80 characters) and some text.");
  const parts = splitPolicy(title, body);
  if (!parts.length) throw new PolicyError("INVALID", "The policy has no text to cite.");

  return db.transaction(async (tx) => {
    let policyId = input.policyId;
    if (policyId) {
      const [p] = await tx.select({ id: policies.id }).from(policies).where(and(eq(policies.id, policyId), eq(policies.workspaceId, m.workspaceId))).for("update");
      if (!p) throw new PolicyError("NOT_FOUND", "Policy not found.");
      await tx.update(policies).set({ title }).where(eq(policies.id, policyId));
    } else {
      const [p] = await tx.insert(policies).values({ workspaceId: m.workspaceId, slug: slugify(title), title })
        .onConflictDoUpdate({ target: [policies.workspaceId, policies.slug], set: { title } }).returning({ id: policies.id });
      policyId = p.id;
      await tx.execute(sql`select 1 from ${policies} where id = ${policyId} for update`);
    }
    const [{ next }] = await tx.select({ next: sql<number>`coalesce(max(${policyVersions.version}), 0) + 1` }).from(policyVersions).where(eq(policyVersions.policyId, policyId));
    const [v] = await tx.insert(policyVersions).values({ policyId, workspaceId: m.workspaceId, version: Number(next), body, note: input.note?.trim() || null, publishedBy: m.userId }).returning();
    await tx.insert(passages).values(parts.map((p) => ({ versionId: v.id, workspaceId: m.workspaceId, ...p })));
    await tx.insert(auditLog).values({ workspaceId: m.workspaceId, actorId: m.userId, action: "policy.published", target: `policy:${policyId}`, meta: { version: v.version, passages: parts.length } });
    return { policyId, versionId: v.id, version: v.version, passages: parts.length };
  });
}

/** New workspaces (and older ones with no policy yet) get the starter policies. */
export async function ensureSamplePolicies(db: DB, m: Pick<Member, "workspaceId" | "userId">) {
  const [any] = await db.select({ id: policies.id }).from(policies).where(eq(policies.workspaceId, m.workspaceId)).limit(1);
  if (any) return;
  // Two requests (e.g. two tabs) can arrive together on first visit. A per-workspace advisory lock
  // makes the check-then-seed atomic, so the starter policies are published exactly once.
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"seed:" + m.workspaceId}))`);
    const [again] = await tx.select({ id: policies.id }).from(policies).where(eq(policies.workspaceId, m.workspaceId)).limit(1);
    if (again) return;
    for (const p of SAMPLE_POLICIES) await publishPolicy(tx as unknown as DB, { ...m, role: "admin" }, { ...p, note: "Starter policy" });
  });
}

const CURRENT = (workspaceId: string) => sql`
  select distinct on (policy_id) id, policy_id, version from ${policyVersions}
  where workspace_id = ${workspaceId} order by policy_id, version desc`;

export async function listPolicies(db: DB, workspaceId: string) {
  return db.execute<{ id: string; title: string; slug: string; version: number; published_at: Date; passages: number }>(sql`
    with cur as (${CURRENT(workspaceId)})
    select p.id, p.title, p.slug, cur.version, v.published_at,
      (select count(*)::int from ${passages} x where x.version_id = cur.id) as passages
    from ${policies} p join cur on cur.policy_id = p.id join ${policyVersions} v on v.id = cur.id
    where p.workspace_id = ${workspaceId} order by p.title`);
}

export async function getPolicy(db: DB, workspaceId: string, id: string) {
  const [p] = await db.select().from(policies).where(and(eq(policies.id, id), eq(policies.workspaceId, workspaceId)));
  if (!p) return null;
  const versions = await db.select().from(policyVersions).where(eq(policyVersions.policyId, id)).orderBy(desc(policyVersions.version));
  const current = versions[0];
  const parts = current ? await db.select().from(passages).where(eq(passages.versionId, current.id)).orderBy(passages.ord) : [];
  return { ...p, versions, current, passages: parts };
}

export type Hit = { id: string; label: string; heading: string; text: string; version: number; rank: number };

/**
 * Finds the passages of the workspace's CURRENT policy versions most relevant to a question
 * (Postgres full-text search, any-word match, ranked). These are the only sources a draft may cite.
 */
export async function searchPassages(db: DB, workspaceId: string, query: string, limit = 6): Promise<Hit[]> {
  const words = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])].slice(0, 30);
  if (!words.length) return [];
  const tsq = words.join(" | ");
  return db.execute<Hit>(sql`
    with cur as (${CURRENT(workspaceId)}), q as (select to_tsquery('english', ${tsq}) as q)
    select x.id, x.label, x.heading, x.text, cur.version,
      ts_rank_cd(to_tsvector('english', x.heading || ' ' || x.text), q.q) as rank
    from ${passages} x join cur on cur.id = x.version_id, q
    where x.workspace_id = ${workspaceId} and to_tsvector('english', x.heading || ' ' || x.text) @@ q.q
    order by rank desc, x.ord limit ${limit}`);
}
