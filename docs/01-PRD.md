# Resolve — Product Requirements (v0.1)

**Owner:** Esheet Vivek · **Date:** 2026-11-10 · **Status:** Milestone 1 in progress

## 1. Problem

Support teams want AI to draft replies so customers wait less. The risk is not a bad sentence; it's a
**promise**. In February 2024 a Canadian tribunal made Air Canada pay a passenger after its website
chatbot invented a bereavement-refund rule, and rejected the argument that the chatbot was responsible
for its own words ([CBS News](https://www.cbsnews.com/news/aircanada-chatbot-discount-customer)).
Customers (and attackers) also write tickets that try to steer the model: prompt injection is LLM01 in
the OWASP Top 10 for LLM Applications 2025 ([HackerOne summary](https://www.hackerone.com/ai/owasp-top-10-llms-2025)).

Resolve drafts replies that **can only say what approved policy says**, and **can't commit the company to
anything** (money, deadlines, exceptions) without a person who is allowed to make that commitment.

## 2. Users

| User | Needs |
| --- | --- |
| Agent | A sorted inbox, a draft they can trust, one click to approve, edit or reject |
| Team lead | Sets policy, sets each agent's authority (e.g. refunds up to ₹2,000), reviews overrides |
| Customer | A fast, correct answer, and no promise that gets taken back |
| Admin | Workspace members, roles, AI budget, audit |

## 3. Goals (measurable)

| # | Goal | Proven by |
| --- | --- | --- |
| G1 | Every sentence in a draft is backed by a cited passage of the policy version in force; uncited sentences are removed | Citation-coverage eval: 100% of shipped sentences cite a passage |
| G2 | No commitment (refund, discount, credit, deadline, exception, legal statement) is sent without approval by someone whose authority covers it | Commitment eval set: 100% caught; authorization tests bypassing the UI |
| G3 | Ticket text can't change the system's behaviour | Prompt-injection red-team set: 0 approved commitments, 0 policy leaks |
| G4 | Customer PII never reaches the model | Redaction tests on emails, phones, cards, Aadhaar-like and PAN-like numbers |
| G5 | Workspaces never see each other's tickets | Cross-tenant attack suite: all 404 |
| G6 | AI spend is capped per workspace per day; when the cap is hit the product still works (manual drafting) | Cap tests + fallback path |
| G7 | Faster first response than writing from scratch | Time-to-first-response in user tests (published as measured) |

## 4. Scope v1

In: sign-in (Google/GitHub), workspaces + roles + authority limits, inbox (web form + signed inbound
webhook), PII redaction, policy library with versions, classification (topic, urgency), duplicate
linking, cited drafting, commitment detection + routing, approve/edit/reject with reasons, audit log,
AI daily caps with non-AI fallback, eval suite in CI, attack suite in CI, load test.

Out (v1): sending real email (drafts are copied or sent through a test mailbox), multiple languages,
voice/chat channels, fine-tuned models.

## 5. Market check (to run alongside the build)

10 conversations with support leads (start-ups, D2C brands, SaaS): how they handle refunds and policy
answers today, whether they let AI reply, and who signs off. Notes go in `docs/research/`.
