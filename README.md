# Resolve

AI support drafts that only say what your policy says, and can't commit the company to a refund,
discount or exception without a person who's allowed to approve it.

- **Why:** in 2024 a tribunal made Air Canada pay for a refund rule its chatbot invented. Prompt
  injection is the top risk in OWASP's LLM Top 10. Prompts alone don't fix either; structure does.
- **How:** redact PII → sort → draft only from cited policy passages → verify every sentence in code →
  route commitments to someone with enough authority → log every decision.

Docs: [PRD](docs/01-PRD.md) · [System design](docs/02-SYSTEM-DESIGN.md) · [Threat model](docs/03-THREAT-MODEL.md)

## Status

| Milestone | State |
| --- | --- |
| 1. Skeleton: auth, workspaces, inbox, PII redaction, signed webhook, AI adapter with daily cap, CI | Done |
| 2. Policy library: immutable versions, one-statement passages, workspace-scoped search | Done |
| 3. AI sorting, injection detection, duplicate linking, labelled eval in CI | Done ([report](evals/report.md)) |
| 4. Cited drafting + commitment detection + approval with authority | Next |
| 5. Dashboard (SLA, acceptance, cost) | |
| 6. Security suite + OWASP ZAP | |
| 7. Load test | |
| 8. Case study | |

Milestone 3 (5 more tests, 37 total, plus the eval): the model proposes topic, urgency and whether a
ticket tries to instruct the AI; code validates the answer and falls back to rules on any error. The
injection flag is rules OR model, so the model can add a flag but never clear one. A customer's open
tickets on the same topic are linked by a keyed hash of their email (never decrypted for matching).
Eval: 55 hand-labelled synthetic tickets incl. 10 attacks and look-alikes; rules baseline 87.3% topic,
100% attacks caught, 1 false alarm in 45. The AI arm runs in CI when the Groq key secret is present.

Milestone 2 (11 more tests, 32 total): policies split into one-statement passages with stable labels
("Billing §2.2"), published versions are immutable (old drafts can always show what they cited),
only leads/admins publish, search covers only current versions inside the caller's workspace,
concurrent publishes get distinct versions, and first-visit setup is race-safe (advisory locks).

Milestone 1 tests (21): PII redaction (emails, phones, cards with Luhn check, PAN, Aadhaar-shaped,
UPI IDs, account numbers), webhook signatures and replay window, field encryption, injection quoting,
rules triage, encrypted storage, cross-workspace isolation, idempotent webhooks, the PII guard before
any model call, and the daily AI budget holding exactly under 40 concurrent calls.

## Stack ($0)

Next.js 16, TypeScript, Tailwind v4, Postgres (Neon via Vercel Storage), Drizzle, Auth.js (Google /
GitHub, database sessions), Groq free tier behind one adapter, Vitest, GitHub Actions, Vercel.

## Run locally

```
cp .env.example .env.local   # fill in values
npm install && npm run db:migrate && npm run dev
```
