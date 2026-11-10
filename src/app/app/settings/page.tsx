import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage, workspaces } from "@/db/schema";
import { decryptField } from "@/lib/crypto";
import { requireMember } from "@/lib/session";
import { and } from "drizzle-orm";

export const metadata: Metadata = { title: "Workspace" };

export default async function Settings() {
  const m = await requireMember("/app/settings");
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, m.workspaceId));
  const today = new Date().toISOString().slice(0, 10);
  const [usage] = await db.select().from(aiUsage).where(and(eq(aiUsage.workspaceId, m.workspaceId), eq(aiUsage.day, today)));
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const url = `${origin}/api/inbound/${m.workspaceId}`;
  const isAdmin = m.role === "admin";
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="serif text-4xl">Workspace</h1>
      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><dt className="k">Your role</dt><dd className="mt-1 font-medium">{m.role}</dd></div>
        <div className="card p-4"><dt className="k">You can approve up to</dt><dd className="mt-1 font-medium">₹{(m.authorityCents / 100).toLocaleString("en-IN")}</dd></div>
        <div className="card p-4"><dt className="k">AI calls today</dt><dd className="mt-1 font-medium">{usage?.calls ?? 0} of {ws.aiDailyCalls}</dd></div>
      </dl>

      <section aria-labelledby="inbound" className="mt-10">
        <h2 id="inbound" className="serif text-3xl">Connect a helpdesk or form</h2>
        <p className="mt-2 text-sm text-muted">POST JSON to this address, signed with your workspace secret. Unsigned or stale requests (older than 5 minutes) are rejected; re-sending the same <code>externalId</code> never creates a duplicate.</p>
        <pre className="card mt-4 overflow-x-auto p-4 font-mono text-xs leading-relaxed">{`POST ${url}
x-resolve-signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>

{"email":"customer@example.com","subject":"…","body":"…","externalId":"helpdesk-123"}`}</pre>
        {isAdmin ? (
          <details className="card mt-4 p-4">
            <summary className="cursor-pointer text-sm font-medium">Show signing secret (admins only)</summary>
            <code className="mt-3 block break-all font-mono text-xs">{decryptField(ws.inboundSecretEnc)}</code>
          </details>
        ) : <p className="mt-4 text-sm text-muted">Ask an admin for the signing secret.</p>}
      </section>
    </main>
  );
}
