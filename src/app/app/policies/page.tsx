import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { canPublish, listPolicies } from "@/lib/policies";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Policies" };

export default async function Policies() {
  const m = await requireMember("/app/policies");
  const rows = await listPolicies(db, m.workspaceId);
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-4xl">Policies</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">The only things a draft may say. Each paragraph is a citable passage; publishing creates a new version and the old wording is kept.</p>
        </div>
        {canPublish(m) && <Link href="/app/policies/new" className="btn-primary">New policy</Link>}
      </div>
      <ul className="card mt-8 divide-y divide-line overflow-hidden">
        {rows.map((p) => (
          <li key={p.id}>
            <Link href={`/app/policies/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sunk/60">
              <span className="font-medium">{p.title}</span>
              <span className="flex shrink-0 gap-2"><span className="chip border-line text-muted">v{p.version}</span><span className="chip border-accent/30 bg-accent-soft text-accent">{p.passages} passages</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
