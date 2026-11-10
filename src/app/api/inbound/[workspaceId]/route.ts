import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { decryptField, verifyWebhook } from "@/lib/crypto";
import { clientIp, json, rateLimit } from "@/lib/http";
import { createTicket, ticketInput } from "@/lib/tickets";

export const dynamic = "force-dynamic";

/**
 * Inbound tickets from a helpdesk, form tool or mail forwarder. Authenticated by an HMAC signature over
 * the raw body with a per-workspace secret; a bad signature and an unknown workspace look the same (401)
 * so workspace IDs can't be probed. `externalId` makes retries idempotent.
 */
export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  if (!rateLimit(`inbound-ip:${clientIp(req)}`, 120, 60_000).ok) return json({ error: "Too many requests." }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 20_000) return json({ error: "Payload too large." }, { status: 413 });

  const [ws] = z.uuid().safeParse(workspaceId).success
    ? await db.select({ id: workspaces.id, secret: workspaces.inboundSecretEnc }).from(workspaces).where(eq(workspaces.id, workspaceId))
    : [];
  if (!ws || !verifyWebhook(decryptField(ws.secret), raw, req.headers.get("x-resolve-signature"))) {
    return json({ error: "Invalid signature." }, { status: 401 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = ticketInput.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid ticket." }, { status: 400 });

  const r = await createTicket(db, { workspaceId: ws.id, source: "webhook", ...parsed.data });
  return json({ id: r.id, duplicate: r.duplicate }, { status: r.duplicate ? 200 : 201 });
}
