import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { listTickets } from "@/lib/tickets";
import { requireMember } from "@/lib/session";
import { Redactions, Topic, Urgency } from "@/components/badges";

export const metadata: Metadata = { title: "Inbox" };

const rel = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

export default async function Inbox() {
  const m = await requireMember();
  const rows = await listTickets(db, m.workspaceId);
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-4xl">Inbox</h1>
          <p className="mt-1 text-sm text-muted">Most urgent first. Personal details are hidden from the AI on arrival.</p>
        </div>
        <Link href="/app/new" className="btn-primary">Log a ticket</Link>
      </div>
      {rows.length === 0 ? (
        <p className="card mt-8 p-8 text-muted">No tickets yet. Log one, or connect your helpdesk from Workspace.</p>
      ) : (
        <ul className="card mt-8 divide-y divide-line overflow-hidden">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/app/tickets/${t.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-sunk/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.subject}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5"><Urgency u={t.urgency} /><Topic t={t.topic} /><Redactions r={t.redactions} /></div>
                </div>
                <p className="shrink-0 font-mono text-xs text-muted">{rel(t.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
