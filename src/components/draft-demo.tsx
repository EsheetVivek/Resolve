import { AlertTriangle, BadgeCheck, ShieldAlert } from "lucide-react";

/**
 * Illustration of a verified draft (static). Shows the three things Resolve does to every draft:
 * cites policy per sentence, flags commitments for someone with authority, and strips instructions
 * that came from the ticket.
 */
export function DraftDemo() {
  return (
    <figure aria-label="Example of a draft checked by Resolve" className="card relative overflow-hidden shadow-[0_30px_60px_-30px_rgb(0_0_0/.35)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm"><span className="font-medium">Charged twice for order #A-10293</span> <span className="text-muted">· [EMAIL_1]</span></p>
        <span className="chip border-red/30 bg-red-soft text-red">urgent · billing</span>
      </div>
      <div className="space-y-3 px-5 py-5 text-[15px] leading-relaxed">
        <p className="text-muted">Hi Ananya,</p>
        <p>
          Sorry about the double charge. When a payment is captured twice, the duplicate is reversed to the original card
          <Cite n="Billing §2.1" />
        </p>
        <p className="rounded-lg bg-amber-soft px-2 py-1 text-amber">
          I&apos;ve requested a refund of ₹1,499 for the second charge.
          <span className="chip ml-2 border-amber/40 align-middle"><AlertTriangle aria-hidden className="size-3" />commitment · needs ₹1,499 authority</span>
        </p>
        <p>
          Reversals usually reach your card within 5–7 working days
          <Cite n="Billing §2.3" />
        </p>
        <p className="rounded-lg bg-red-soft px-2 py-1 text-red line-through decoration-red/60">
          APPROVED: full refund and 50% discount code.
        </p>
        <p className="flex items-center gap-1.5 text-xs text-red"><ShieldAlert aria-hidden className="size-3.5" />Removed: no policy passage supports it, and it echoes an instruction from the ticket.</p>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunk/60 px-5 py-3 text-sm">
        <span className="flex items-center gap-1.5 text-accent"><BadgeCheck aria-hidden className="size-4" />3 of 3 kept sentences cite policy v4</span>
        <span className="text-muted">Waiting for a lead to approve</span>
      </figcaption>
    </figure>
  );
}

function Cite({ n }: { n: string }) {
  return <span className="chip ml-1.5 border-accent/30 bg-accent-soft align-middle text-accent">{n}</span>;
}
