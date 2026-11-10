import Link from "next/link";
import { ArrowRight, BadgeCheck, FileLock2, Gauge, Lock, ScanSearch, ShieldAlert, Users } from "lucide-react";
import { DraftDemo } from "@/components/draft-demo";
import { Logo, REPO } from "@/components/brand";

const STEPS = [
  { t: "Redact", d: "Emails, phone numbers, cards, PAN and Aadhaar-shaped numbers are replaced before any model sees the ticket." },
  { t: "Sort", d: "Topic and urgency, with a rules-based fallback when the AI budget runs out." },
  { t: "Draft with sources", d: "Only passages from your current policy version are offered as sources, each with an ID." },
  { t: "Verify in code", d: "Any sentence without a real citation is cut. Refunds, credits, deadlines and exceptions are flagged." },
  { t: "A person decides", d: "Commitments go to someone whose authority covers the amount. Every decision is logged." },
];

const GUARANTEES = [
  { icon: BadgeCheck, t: "Only what policy says", d: "Every sentence that reaches a customer cites a passage of the policy in force. Uncited sentences are removed by code, not by asking the model nicely." },
  { icon: Users, t: "No promise without authority", d: "An agent who may approve refunds up to ₹2,000 can't approve ₹5,000, even by calling the API directly." },
  { icon: ShieldAlert, t: "Tickets can't steer it", d: "Ticket text is passed to the model as quoted data. The model has no tools and no write access, and its output is checked before anyone sees it." },
  { icon: FileLock2, t: "PII stays home", d: "Raw messages are encrypted at rest. The model only ever receives the redacted copy, and the client refuses anything that still looks like personal data." },
  { icon: Lock, t: "Teams stay separate", d: "Every query is scoped to the signed-in member's workspace. Another team's ticket ID returns 404." },
  { icon: Gauge, t: "Capped AI spend", d: "Each workspace has a daily AI budget. When it runs out, the inbox keeps working with rules and manual replies." },
];

export default function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <a href="#how" className="btn-quiet hidden sm:inline-flex">How it works</a>
          <a href="#guarantees" className="btn-quiet hidden sm:inline-flex">Guarantees</a>
          <Link href="/app" className="btn-primary">Open the inbox</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="k">AI support drafts · human approval</p>
          <h1 className="serif mt-4 text-5xl leading-[1.02] text-balance sm:text-7xl">Replies that only say what your policy <em>says</em>.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Resolve drafts answers to support tickets from your own policy, cites every sentence, and sends any refund, discount or exception to a person who&apos;s allowed to approve it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="btn-primary px-6">Try it with sample tickets<ArrowRight aria-hidden className="size-4" /></Link>
            <a href={REPO} className="btn-secondary px-6">Read the design</a>
          </div>
          <p className="mt-10 max-w-md border-l-2 border-amber pl-4 text-sm leading-relaxed text-muted">
            In 2024 a tribunal made Air Canada pay for a refund rule its chatbot invented, and rejected the idea that the bot was responsible for its own words.{" "}
            <a className="link" href="https://www.cbsnews.com/news/aircanada-chatbot-discount-customer">CBS News</a>
          </p>
        </div>
        <DraftDemo />
      </section>

      <section id="how" aria-labelledby="how-t" className="border-y border-line bg-sunk/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="how-t" className="serif text-4xl sm:text-5xl">How a ticket moves</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.t} className="card p-5">
                <span className="serif text-3xl text-accent">{i + 1}</span>
                <h3 className="mt-2 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="guarantees" aria-labelledby="g-t" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 id="g-t" className="serif text-4xl sm:text-5xl">What&apos;s guaranteed, and how</h2>
        <p className="mt-3 max-w-2xl text-muted">Each guarantee is enforced by code, the database or a person, so a model that misbehaves can&apos;t break it. Each one gets an automated test as the build progresses.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUARANTEES.map(({ icon: Icon, t, d }) => (
            <li key={t} className="card p-6">
              <Icon aria-hidden className="size-5 text-accent" />
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
          <p>Resolve is a portfolio project by Esheet Vivek. Built in public: <a className="link" href={REPO}>code, design and test results</a>.</p>
          <p className="flex items-center gap-1.5"><ScanSearch aria-hidden className="size-4" />Milestone 1 of 8</p>
        </div>
      </footer>
    </main>
  );
}
