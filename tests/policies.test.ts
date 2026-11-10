import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getPolicy, listPolicies, publishPolicy, searchPassages, PolicyError } from "@/lib/policies";
import { ensureWorkspace } from "@/lib/workspace";
import { SAMPLE_POLICIES } from "@/lib/sample-policies";

process.env.FIELD_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
const url = process.env.DATABASE_URL;

(url ? describe : describe.skip)("policy library", () => {
  const client = postgres(url ?? "", { max: 10, ssl: false, onnotice: () => {} });
  const db = drizzle(client, { schema }) as unknown as typeof import("@/db").db;
  let A = "", B = "";
  const admin = () => ({ workspaceId: A, role: "admin" as const, userId: "p-a" });

  beforeAll(async () => {
    await db.insert(schema.users).values([{ id: "p-a", name: "Pia", email: "a@p.test" }, { id: "p-b", name: "Ben", email: "b@p.test" }]).onConflictDoNothing();
    A = (await ensureWorkspace(db, { id: "p-a", name: "Pia" })).workspaceId;
    B = (await ensureWorkspace(db, { id: "p-b", name: "Ben" })).workspaceId;
  });
  afterAll(async () => {
    await db.execute(sql`delete from workspaces where id in (${A}, ${B})`);
    await db.execute(sql`delete from users where email like '%@p.test'`);
    await client.end();
  });

  it("new workspaces start with the starter policies at version 1", async () => {
    const list = await listPolicies(db, A);
    expect(list.map((p) => p.title).sort()).toEqual(SAMPLE_POLICIES.map((p) => p.title).sort());
    expect(list.every((p) => p.version === 1 && p.passages > 0)).toBe(true);
  });

  it("first-visit seeding is published exactly once, even when requests race", async () => {
    await db.insert(schema.users).values({ id: "p-c", name: "Cy", email: "c@p.test" }).onConflictDoNothing();
    const ws = await Promise.all([1, 2, 3, 4].map(() => ensureWorkspace(db, { id: "p-c", name: "Cy" })));
    expect(new Set(ws.map((w) => w.workspaceId)).size).toBe(1); // one workspace, not four
    const list = await listPolicies(db, ws[0].workspaceId);
    expect(list.length).toBe(SAMPLE_POLICIES.length);
    expect(list.every((p) => p.version === 1)).toBe(true);
    await db.execute(sql`delete from workspaces where id = ${ws[0].workspaceId}`);
  });

  it("only leads and admins can publish", async () => {
    await expect(publishPolicy(db, { workspaceId: A, role: "agent", userId: "p-a" }, { title: "Billing", body: "## 1. X\nY" }))
      .rejects.toBeInstanceOf(PolicyError);
  });

  it("finds the right passage for a customer's question", async () => {
    const hits = await searchPassages(db, A, "I was charged twice for my order, when do I get the money back?");
    expect(hits[0].label).toMatch(/^Billing §2\./);
  });

  it("a new version replaces the old one in search, but the old wording is kept", async () => {
    const billing = (await listPolicies(db, A)).find((p) => p.title === "Billing")!;
    const r = await publishPolicy(db, admin(), { policyId: billing.id, title: "Billing", body: "## 2. Duplicate charges\nDuplicate charges are reversed within 3 working days.", note: "Faster reversals" });
    expect(r.version).toBe(2);
    const hits = await searchPassages(db, A, "duplicate charge reversed");
    expect(hits.some((h) => h.text.includes("3 working days"))).toBe(true);
    expect(hits.some((h) => h.text.includes("5–7 working days"))).toBe(false);
    const p = await getPolicy(db, A, billing.id);
    expect(p?.versions.map((v) => v.version)).toEqual([2, 1]);
    expect(p?.versions[1].body).toContain("5–7 working days");
  });

  it("never searches or opens another workspace's policies", async () => {
    await publishPolicy(db, { workspaceId: B, role: "admin", userId: "p-b" }, { title: "Secret", body: "## 1. Zebra\nZebra discount is 90 percent." });
    const hits = await searchPassages(db, A, "zebra discount");
    expect(hits.some((h) => /zebra/i.test(h.text))).toBe(false); // A may match its own "discount" text, never B's
    expect(await searchPassages(db, A, "zebra")).toEqual([]);
    const theirs = (await listPolicies(db, B)).find((p) => p.title === "Secret")!;
    expect(await getPolicy(db, A, theirs.id)).toBeNull();
    await expect(publishPolicy(db, admin(), { policyId: theirs.id, title: "Secret", body: "## 1. X\nY" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("concurrent publishes get distinct version numbers", async () => {
    const delivery = (await listPolicies(db, A)).find((p) => p.title === "Delivery")!;
    const rs = await Promise.all([1, 2, 3].map((i) => publishPolicy(db, admin(), { policyId: delivery.id, title: "Delivery", body: `## 1. Timelines\nVersion text ${i}.` })));
    expect(rs.map((r) => r.version).sort()).toEqual([2, 3, 4]);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.policyVersions).where(eq(schema.policyVersions.policyId, delivery.id));
    expect(n).toBe(4);
  });
});
