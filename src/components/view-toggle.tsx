"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Switch between what the agent sees (original) and what the AI is allowed to see (redacted). */
export function ViewToggle({ original, redacted }: { original: string; redacted: string }) {
  const [ai, setAi] = useState(false);
  return (
    <div>
      <div role="tablist" aria-label="Message view" className="inline-flex rounded-full border border-line bg-sunk p-1 text-sm">
        <button role="tab" aria-selected={!ai} onClick={() => setAi(false)} className={`flex min-h-9 items-center gap-1.5 rounded-full px-3 ${!ai ? "bg-card shadow-sm" : "text-muted"}`}><Eye aria-hidden className="size-4" />Customer&apos;s message</button>
        <button role="tab" aria-selected={ai} onClick={() => setAi(true)} className={`flex min-h-9 items-center gap-1.5 rounded-full px-3 ${ai ? "bg-card shadow-sm" : "text-muted"}`}><EyeOff aria-hidden className="size-4" />What the AI sees</button>
      </div>
      <p role="tabpanel" className={`mt-4 whitespace-pre-wrap rounded-2xl border p-5 leading-relaxed ${ai ? "border-accent/30 bg-accent-soft/40 font-mono text-sm" : "border-line bg-card"}`}>{ai ? redacted : original}</p>
    </div>
  );
}
