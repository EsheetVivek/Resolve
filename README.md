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
| 2. Policy library + retrieval | Next |
| 3. AI sorting + duplicate linking + evals | |
| 4. Cited drafting + commitment detection + approval with authority | |
| 5. Dashboard (SLA, acceptance, cost) | |
| 6. Security suite + OWASP ZAP | |
| 7. Load test | |
| 8. Case study | |

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
