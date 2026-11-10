"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { splitPolicy } from "@/lib/passages";

/** Markdown editor with a live preview of the citable passages the text will produce. */
export function PolicyEditor({ policyId, initialTitle = "", initialBody = "" }: { policyId?: string; initialTitle?: string; initialBody?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const preview = useMemo(() => (title.trim() ? splitPolicy(title.trim(), body) : []), [title, body]);

  async function publish() {
    setBusy(true); setErr("");
    const r = await fetch("/api/policies", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ policyId, title, body, note: note || undefined }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { router.push(`/app/policies/${d.policyId}`); router.refresh(); } else { setErr(d.error ?? "Couldn't publish."); setBusy(false); }
  }
  const field = "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-ink";
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block"><span className="text-sm font-medium">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} readOnly={!!policyId} className={`${field} ${policyId ? "text-muted" : ""}`} placeholder="e.g. Refunds" /></label>
        <label className="block"><span className="text-sm font-medium">Policy text</span>
          <span className="block text-xs text-muted">Use “## 1. Heading” for sections. Each paragraph or bullet becomes one citable passage.</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={18} className={`${field} font-mono text-sm`} />
        </label>
        <label className="block"><span className="text-sm font-medium">What changed (optional)</span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={field} /></label>
        {err && <p role="alert" className="rounded-xl bg-red-soft px-4 py-3 text-sm text-red">{err}</p>}
        <button onClick={publish} disabled={busy || !preview.length} className="btn-primary">{busy ? "Publishing…" : policyId ? "Publish new version" : "Publish policy"}</button>
      </div>
      <div>
        <p className="k">Preview · {preview.length} citable passages</p>
        <ol className="mt-3 space-y-2">
          {preview.map((p) => (
            <li key={p.label} className="card p-3 text-sm"><span className="chip border-accent/30 bg-accent-soft text-accent">{p.label}</span><p className="mt-2 leading-relaxed">{p.text}</p></li>
          ))}
        </ol>
      </div>
    </div>
  );
}
