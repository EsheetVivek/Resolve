import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { getTicket } from "@/lib/tickets";
import { searchPassages } from "@/lib/policies";
import { requireMember } from "@/lib/session";
import { Injection, Redactions, Topic, Urgency } from "@/components/badges";
import { ShieldAlert } from "lucide-react";
import { ViewToggle } from "@/components/view-toggle";

export const metadata: Metadata = { title: "Ticket" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await requireMember(`/app/tickets/${id}`);
  // Scoped to the caller's workspace: another team's ticket is indistinguishable from a missing one.
  const t = await getTicket(db, m.workspaceId, id);
  if (!t) notFound();
  const sources = await searchPassages(db, m.workspaceId, `${t.subject} ${t.bodyRedacted}`, 4);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Link href="/app" className="btn-quiet -ml-3 px-3"><ArrowLeft aria-hidden className="size-4" />Inbox</Link>
      <h1 className="serif mt-4 text-4xl text-balance">{t.subject}</h1>
      <p className="mt-2 text-sm text-muted">{t.customerEmail} · via {t.source} · {t.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5"><Urgency u={t.urgency} /><Topic t={t.topic} /><Injection flags={t.injectionFlags} /><Redactions r={t.redactions} />
        <span className="text-xs text-muted">sorted by {t.classifiedBy === "ai" ? `AI (${t.classifyModel})` : "rules"}</span></div>
      {t.injectionFlags.length > 0 && (
        <p role="note" className="mt-5 flex gap-3 rounded-2xl border border-red/30 bg-red-soft p-4 text-sm text-red">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>This message contains text aimed at the AI ({t.injectionFlags.join(", ")}). It&apos;s treated as data only, and any draft for this ticket can&apos;t make a commitment without a person approving it.</span>
        </p>
      )}
      {t.duplicateOf && <p className="mt-3 text-sm text-muted">Same customer has an open ticket on this topic: <Link className="link" href={`/app/tickets/${t.duplicateOf}`}>see the earlier ticket</Link>.</p>}
      <div className="mt-8"><ViewToggle original={t.body} redacted={t.bodyRedacted} /></div>
      <section aria-labelledby="sources" className="mt-8">
        <h2 id="sources" className="font-semibold">Policy a draft could cite</h2>
        <p className="mt-1 text-sm text-muted">Found in your current policies. A draft (milestone 4) may only say what these passages say, and must cite them.</p>
        {sources.length ? (
          <ol className="mt-4 space-y-2">
            {sources.map((s) => (
              <li key={s.id} className="card p-4 text-sm"><span className="chip border-accent/30 bg-accent-soft text-accent">{s.label}</span><span className="ml-2 text-xs text-muted">v{s.version}</span><p className="mt-2 leading-relaxed">{s.text}</p></li>
            ))}
          </ol>
        ) : <p className="card mt-4 p-4 text-sm text-muted">No policy covers this yet, so a draft would have nothing to cite and the agent writes the reply. Add a policy to change that.</p>}
      </section>
    </main>
  );
}
