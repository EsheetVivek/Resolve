import { and, asc, eq, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { auditLog, memberships, workspaces } from "@/db/schema";
import { encryptField, newSecret } from "@/lib/crypto";
import { createTicket } from "@/lib/tickets";
import { SAMPLE_TICKETS } from "@/lib/samples";
import { ensureSamplePolicies } from "@/lib/policies";

export interface Member { workspaceId: string; workspaceName: string; role: "agent" | "lead" | "admin"; authorityCents: number; userId: string }

/** The caller's workspace membership. The workspace always comes from here, never from the request. */
export async function membershipFor(db: DB, userId: string): Promise<Member | null> {
  const [m] = await db.select({ workspaceId: memberships.workspaceId, workspaceName: workspaces.name, role: memberships.role, authorityCents: memberships.authorityCents })
    .from(memberships).innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(eq(memberships.userId, userId)).orderBy(asc(workspaces.createdAt)).limit(1);
  return m ? { ...m, userId } : null;
}

/**
 * First sign-in: give the user their own workspace (as admin, authority ₹5,000) with sample tickets so
 * there's something to try. Idempotent per user.
 */
export async function ensureWorkspace(db: DB, user: { id: string; name?: string | null }): Promise<Member> {
  const existing = await membershipFor(db, user.id);
  if (existing) {
    // Workspaces created before the policy library get the starter policies once.
    if (existing.role === "admin") await ensureSamplePolicies(db, existing);
    return existing;
  }
  const name = `${(user.name ?? "My").split(" ")[0]}'s support team`;
  const ws = await db.transaction(async (tx) => {
    // Concurrent first requests from the same user must create exactly one workspace.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"ws:" + user.id}))`);
    const [taken] = await tx.select({ id: memberships.workspaceId }).from(memberships).where(eq(memberships.userId, user.id)).limit(1);
    if (taken) return null;
    const [w] = await tx.insert(workspaces).values({ name, inboundSecretEnc: encryptField(newSecret()) }).returning();
    await tx.insert(memberships).values({ workspaceId: w.id, userId: user.id, role: "admin", authorityCents: 500_000 });
    await tx.insert(auditLog).values({ workspaceId: w.id, actorId: user.id, action: "workspace.created", target: `workspace:${w.id}` });
    return w;
  });
  if (!ws) return (await membershipFor(db, user.id))!;
  for (const t of SAMPLE_TICKETS) await createTicket(db, { workspaceId: ws.id, source: "form", ...t });
  await ensureSamplePolicies(db, { workspaceId: ws.id, userId: user.id });
  return (await membershipFor(db, user.id))!;
}

export async function isMember(db: DB, userId: string, workspaceId: string) {
  const [m] = await db.select({ u: memberships.userId }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.workspaceId, workspaceId)));
  return !!m;
}
