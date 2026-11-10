import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { isSameOrigin, json, rateLimit } from "@/lib/http";
import { publishPolicy, PolicyError } from "@/lib/policies";
import { membershipFor } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const body = z.object({ policyId: z.uuid().optional(), title: z.string().max(80), body: z.string().max(50_000), note: z.string().max(200).optional() }).strict();
const STATUS = { FORBIDDEN: 403, INVALID: 400, NOT_FOUND: 404 } as const;

/** Publish a new version of a policy. Role is checked from the session's membership, not the request. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Cross-site request blocked." }, { status: 403 });
  const session = await auth();
  if (!session?.user?.id) return json({ error: "Sign in first." }, { status: 401 });
  if (!rateLimit(`policy:${session.user.id}`, 20, 60_000).ok) return json({ error: "Too many requests." }, { status: 429 });
  const m = await membershipFor(db, session.user.id);
  if (!m) return json({ error: "No workspace." }, { status: 403 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid policy." }, { status: 400 });
  try {
    return json(await publishPolicy(db, m, parsed.data), { status: 201 });
  } catch (e) {
    if (e instanceof PolicyError) return json({ error: e.message }, { status: STATUS[e.code] });
    throw e;
  }
}
