"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewTicketForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.get("email"), subject: f.get("subject"), body: f.get("body") }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) router.push(`/app/tickets/${d.id}`); else { setErr(d.error ?? "Couldn't save the ticket."); setBusy(false); }
  }
  const field = "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-ink";
  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block"><span className="text-sm font-medium">Customer email</span><input name="email" type="email" required maxLength={254} className={field} placeholder="name@example.com" /></label>
      <label className="block"><span className="text-sm font-medium">Subject</span><input name="subject" required maxLength={200} className={field} /></label>
      <label className="block"><span className="text-sm font-medium">Message</span><textarea name="body" required maxLength={10000} rows={7} className={field} /></label>
      {err && <p role="alert" className="rounded-xl bg-red-soft px-4 py-3 text-sm text-red">{err}</p>}
      <button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save ticket"}</button>
    </form>
  );
}
