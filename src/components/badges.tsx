import { cn } from "@/lib/utils";

const URG: Record<string, string> = {
  urgent: "border-red/30 bg-red-soft text-red",
  high: "border-amber/40 bg-amber-soft text-amber",
  normal: "border-line bg-sunk text-muted",
  low: "border-line bg-card text-muted",
};
export function Urgency({ u }: { u: string | null }) {
  return <span className={cn("chip", URG[u ?? "normal"])}>{u ?? "normal"}</span>;
}
export function Topic({ t }: { t: string | null }) {
  return <span className="chip border-line bg-card text-ink">{t ?? "other"}</span>;
}
export function Redactions({ r }: { r: Record<string, number> }) {
  const n = Object.values(r).reduce((a, b) => a + b, 0);
  if (!n) return null;
  return <span className="chip border-accent/30 bg-accent-soft text-accent" title={Object.entries(r).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(", ")}>{n} hidden from AI</span>;
}

export function Injection({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return <span className="chip border-red/30 bg-red-soft text-red" title={flags.join(", ")}>instructions to AI</span>;
}
export function Duplicate({ of }: { of: string | null }) {
  if (!of) return null;
  return <span className="chip border-line bg-sunk text-muted">possible duplicate</span>;
}
