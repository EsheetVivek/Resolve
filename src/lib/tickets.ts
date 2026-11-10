import { and, asc, desc, eq, gt, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db";
import { auditLog, tickets } from "@/db/schema";
import { decryptField, encryptField, lookupHash } from "@/lib/crypto";
import { classifyText, type Llm } from "@/lib/classify";
import { complete } from "@/lib/ai";
import { redact } from "@/lib/redact";

export const ticketInput = z.object({
  email: z.email().max(254),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
  externalId: z.string().trim().min(1).max(200).optional(),
}).strict();

/** The model, through the budgeted, PII-guarded adapter. Null means "rules only". */
export function workspaceLlm(db: DB, workspaceId: string): Llm {
  return async (system, data, task) => {
    const out = await complete(db, { workspaceId, system, data, task, json: true, maxTokens: 600 });
    return { text: out.text, model: out.model };
  };
}

/**
 * Stores a ticket: the raw body and email encrypted, a redacted copy for models, AI classification
 * (rules if AI is off, over budget or wrong), injection flags, and a link to an open duplicate from the
 * same customer. Webhook deliveries with the same externalId are idempotent.
 */
export async function createTicket(db: DB, input: { workspaceId: string; source: "form" | "webhook"; email: string; subject: string; body: string; externalId?: string; actorId?: string; ai?: boolean }) {
  if (input.externalId) {
    const [seen] = await db.select({ id: tickets.id }).from(tickets).where(and(eq(tickets.workspaceId, input.workspaceId), eq(tickets.externalId, input.externalId)));
    if (seen) return { id: seen.id, duplicate: true };
  }
  const subject = redact(input.subject);
  const body = redact(input.body);
  const c = await classifyText(input.ai === false ? null : workspaceLlm(db, input.workspaceId), subject.text, body.text);
  const counts: Record<string, number> = { ...subject.counts };
  for (const [k, v] of Object.entries(body.counts)) counts[k] = (counts[k] ?? 0) + (v ?? 0);
  const customerHash = lookupHash(input.email);
  const [dupe] = await db.select({ id: tickets.id }).from(tickets).where(and(
    eq(tickets.workspaceId, input.workspaceId), eq(tickets.customerHash, customerHash), eq(tickets.topic, c.topic),
    notInArray(tickets.status, ["answered", "closed"]), gt(tickets.createdAt, new Date(Date.now() - 14 * 86_400_000)),
  )).orderBy(asc(tickets.createdAt)).limit(1);

  const [row] = await db.insert(tickets).values({
    workspaceId: input.workspaceId, source: input.source, externalId: input.externalId ?? null,
    customerEmailEnc: encryptField(input.email), customerHash, subject: subject.text, bodyEnc: encryptField(input.body),
    bodyRedacted: body.text, redactions: counts, status: "triaged", topic: c.topic, urgency: c.urgency,
    classifiedBy: c.by, classifyModel: c.model, injectionFlags: c.injection, duplicateOf: dupe?.id ?? null,
  }).onConflictDoNothing({ target: [tickets.workspaceId, tickets.externalId] }).returning({ id: tickets.id });
  if (!row) {
    const [dup] = await db.select({ id: tickets.id }).from(tickets).where(and(eq(tickets.workspaceId, input.workspaceId), eq(tickets.externalId, input.externalId!)));
    return { id: dup.id, duplicate: true };
  }
  await db.insert(auditLog).values({ workspaceId: input.workspaceId, actorId: input.actorId ?? null, action: `ticket.created.${input.source}`, target: `ticket:${row.id}`,
    meta: { redactions: counts, classifiedBy: c.by, injection: c.injection, duplicateOf: dupe?.id ?? null } });
  return { id: row.id, duplicate: false };
}

const URGENCY_ORDER = sql`case ${tickets.urgency} when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end`;

/** Inbox for one workspace, most urgent first. */
export async function listTickets(db: DB, workspaceId: string) {
  return db.select({ id: tickets.id, subject: tickets.subject, topic: tickets.topic, urgency: tickets.urgency, status: tickets.status, createdAt: tickets.createdAt, redactions: tickets.redactions, injectionFlags: tickets.injectionFlags, duplicateOf: tickets.duplicateOf, classifiedBy: tickets.classifiedBy })
    .from(tickets).where(eq(tickets.workspaceId, workspaceId)).orderBy(URGENCY_ORDER, desc(tickets.createdAt)).limit(200);
}

/** One ticket, only if it belongs to the caller's workspace. Decrypts for the agent's eyes only. */
export async function getTicket(db: DB, workspaceId: string, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [t] = await db.select().from(tickets).where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId)));
  if (!t) return null;
  return { ...t, customerEmail: decryptField(t.customerEmailEnc), body: decryptField(t.bodyEnc) };
}
