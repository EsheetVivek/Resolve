import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db";
import { auditLog, tickets } from "@/db/schema";
import { decryptField, encryptField } from "@/lib/crypto";
import { redact } from "@/lib/redact";
import { triage } from "@/lib/triage";

export const ticketInput = z.object({
  email: z.email().max(254),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
  externalId: z.string().trim().min(1).max(200).optional(),
}).strict();

/**
 * Stores a ticket: the raw body and email encrypted, a redacted copy for models, rules-based triage.
 * Webhook deliveries with the same externalId are idempotent (retries don't duplicate tickets).
 */
export async function createTicket(db: DB, input: { workspaceId: string; source: "form" | "webhook"; email: string; subject: string; body: string; externalId?: string; actorId?: string }) {
  const subject = redact(input.subject);
  const body = redact(input.body);
  const t = triage(subject.text, body.text);
  const counts: Record<string, number> = { ...subject.counts };
  for (const [k, v] of Object.entries(body.counts)) counts[k] = (counts[k] ?? 0) + (v ?? 0);
  const [row] = await db.insert(tickets).values({
    workspaceId: input.workspaceId, source: input.source, externalId: input.externalId ?? null,
    customerEmailEnc: encryptField(input.email), subject: subject.text, bodyEnc: encryptField(input.body),
    bodyRedacted: body.text, redactions: counts, status: "triaged", topic: t.topic, urgency: t.urgency,
  }).onConflictDoNothing({ target: [tickets.workspaceId, tickets.externalId] }).returning({ id: tickets.id });
  if (!row) {
    const [dup] = await db.select({ id: tickets.id }).from(tickets).where(and(eq(tickets.workspaceId, input.workspaceId), eq(tickets.externalId, input.externalId!)));
    return { id: dup.id, duplicate: true };
  }
  await db.insert(auditLog).values({ workspaceId: input.workspaceId, actorId: input.actorId ?? null, action: `ticket.created.${input.source}`, target: `ticket:${row.id}`, meta: { redactions: counts } });
  return { id: row.id, duplicate: false };
}

const URGENCY_ORDER = sql`case ${tickets.urgency} when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end`;

/** Inbox for one workspace, most urgent first. */
export async function listTickets(db: DB, workspaceId: string) {
  return db.select({ id: tickets.id, subject: tickets.subject, topic: tickets.topic, urgency: tickets.urgency, status: tickets.status, createdAt: tickets.createdAt, redactions: tickets.redactions })
    .from(tickets).where(eq(tickets.workspaceId, workspaceId)).orderBy(URGENCY_ORDER, desc(tickets.createdAt)).limit(200);
}

/** One ticket, only if it belongs to the caller's workspace. Decrypts for the agent's eyes only. */
export async function getTicket(db: DB, workspaceId: string, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [t] = await db.select().from(tickets).where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId)));
  if (!t) return null;
  return { ...t, customerEmail: decryptField(t.customerEmailEnc), body: decryptField(t.bodyEnc) };
}
