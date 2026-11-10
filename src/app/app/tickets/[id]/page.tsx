import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { getTicket } from "@/lib/tickets";
import { requireMember } from "@/lib/session";
import { Redactions, Topic, Urgency } from "@/components/badges";
import { ViewToggle } from "@/components/view-toggle";

export const metadata: Metadata = { title: "Ticket" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await requireMember(`/app/tickets/${id}`);
  // Scoped to the caller's workspace: another team's ticket is indistinguishable from a missing one.
  const t = await getTicket(db, m.workspaceId, id);
  if (!t) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Link href="/app" className="btn-quiet -ml-3 px-3"><ArrowLeft aria-hidden className="size-4" />Inbox</Link>
      <h1 className="serif mt-4 text-4xl text-balance">{t.subject}</h1>
      <p className="mt-2 text-sm text-muted">{t.customerEmail} · via {t.source} · {t.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</p>
      <div className="mt-3 flex flex-wrap gap-1.5"><Urgency u={t.urgency} /><Topic t={t.topic} /><Redactions r={t.redactions} /></div>
      <div className="mt-8"><ViewToggle original={t.body} redacted={t.bodyRedacted} /></div>
      <section aria-labelledby="draft" className="card mt-8 border-dashed p-6">
        <h2 id="draft" className="font-semibold">Draft reply</h2>
        <p className="mt-2 text-sm text-muted">Cited drafting arrives in milestone 4, once the policy library (milestone 2) is in. Sorting above is rules-based today; AI sorting with measured accuracy arrives in milestone 3.</p>
      </section>
    </main>
  );
}
