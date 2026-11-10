import { auth } from "@/auth";
import { db } from "@/db";
import { isSameOrigin, json, rateLimit } from "@/lib/http";
import { createTicket, ticketInput } from "@/lib/tickets";
import { membershipFor } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/** Log a ticket by hand (e.g. from a phone call). The workspace comes from the session, never the body. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Cross-site request blocked." }, { status: 403 });
  const session = await auth();
  if (!session?.user?.id) return json({ error: "Sign in first." }, { status: 401 });
  if (!rateLimit(`ticket:${session.user.id}`, 30, 60_000).ok) return json({ error: "Too many requests." }, { status: 429 });
  const m = await membershipFor(db, session.user.id);
  if (!m) return json({ error: "No workspace." }, { status: 403 });
  const parsed = ticketInput.omit({ externalId: true }).strict().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Check the email, subject and message." }, { status: 400 });
  const r = await createTicket(db, { workspaceId: m.workspaceId, source: "form", actorId: session.user.id, ...parsed.data });
  return json({ id: r.id }, { status: 201 });
}
