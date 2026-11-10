import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { canPublish, getPolicy } from "@/lib/policies";
import { requireMember } from "@/lib/session";
import { PolicyEditor } from "@/components/policy-editor";

export const metadata: Metadata = { title: "Policy" };
const when = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export default async function PolicyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const m = await requireMember(`/app/policies/${id}`);
  const p = /^[0-9a-f-]{36}$/.test(id) ? await getPolicy(db, m.workspaceId, id) : null;
  if (!p || !p.current) notFound();
  const editable = canPublish(m);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Link href="/app/policies" className="btn-quiet -ml-3 px-3"><ArrowLeft aria-hidden className="size-4" />Policies</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-4xl">{p.title}</h1>
          <p className="mt-1 text-sm text-muted">Version {p.current.version} · published {when(p.current.publishedAt)} IST{p.current.note ? ` · ${p.current.note}` : ""}</p>
        </div>
        {editable && !edit && <Link href={`/app/policies/${id}?edit=1`} className="btn-secondary">Edit and publish a new version</Link>}
      </div>
      {editable && edit ? (
        <div className="mt-8"><PolicyEditor policyId={p.id} initialTitle={p.title} initialBody={p.current.body} /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
          <ol className="space-y-2">
            {p.passages.map((x) => (
              <li key={x.id} className="card p-4"><span className="chip border-accent/30 bg-accent-soft text-accent">{x.label}</span><span className="ml-2 text-xs text-muted">{x.heading}</span><p className="mt-2 leading-relaxed">{x.text}</p></li>
            ))}
          </ol>
          <aside>
            <p className="k">Version history</p>
            <ol className="mt-3 space-y-3 border-l border-line pl-4 text-sm">
              {p.versions.map((v) => (
                <li key={v.id}><p className="font-medium">v{v.version}</p><p className="text-xs text-muted">{when(v.publishedAt)} IST{v.note ? ` · ${v.note}` : ""}</p></li>
              ))}
            </ol>
            {!editable && <p className="mt-6 text-xs text-muted">Only leads and admins can change policy.</p>}
          </aside>
        </div>
      )}
    </main>
  );
}
