# Resolve — System design (v0.1)

## Principle

The model is a **drafting tool inside a controlled pipeline**, never the decision-maker. Every guarantee
in the PRD is enforced by code, the database or a person, so a model that misbehaves can't break it.

## Pipeline for one ticket

```
inbound (form / signed webhook)
  → store raw body encrypted (AES-256-GCM)           ← only the redacted copy is ever sent to a model
  → redact PII  (deterministic, tested)
  → classify     (AI: topic, urgency)  ── fallback: rules
  → link duplicates (similar open tickets)
  → retrieve policy passages for the current policy version
  → draft        (AI, with passages as numbered sources; ticket passed as quoted data)
  → verify       (code): split into sentences; drop any sentence without a valid citation;
                 detect commitments (amounts, refunds, discounts, credits, deadlines, exceptions, legal)
  → route        commitments → required authority level
  → human        approve / edit / reject (authority checked on the server, reason required for edits
                 that add a commitment)
  → log          everything in the audit log, with the policy version and model used
```

## Why each guarantee holds without trusting the model

| Guarantee | Mechanism |
| --- | --- |
| Only policy is stated | A sentence survives only if it cites a passage ID that exists in the policy version retrieved for this ticket. Citations are checked by code, not by the model. |
| No unapproved commitment | A deterministic detector (patterns + amounts) plus the model's own flagging; either one routes the draft. The server refuses approval unless `membership.authority ≥ required`. |
| Prompt injection can't act | The model has no tools and no write access; its output is data that goes through verification. Ticket text is wrapped as quoted content. |
| PII never leaves | Redaction runs before any model call; the model client refuses input that still matches PII patterns. |
| Tenant isolation | Every query is scoped by `workspace_id` from the session's membership, never from the request. |
| Spend cap | `ai_usage(workspace, day)` is incremented atomically before a call; over the cap → no call, manual path. |

## Data model (v1)

`users / accounts / sessions` (Auth.js) · `workspaces` · `memberships (user, workspace, role, authority_cents)` ·
`tickets (workspace, customer_email_enc, subject, body_enc, body_redacted, status, topic, urgency, duplicate_of)` ·
`policies (workspace, slug, version, title, body, published_at)` · `drafts (ticket, policy_version, text, citations, commitments, required_authority, status, model, tokens)` ·
`decisions (draft, user, decision, reason, at)` · `ai_usage (workspace, day, calls, tokens)` · `audit_log`.

## AI provider

Groq free tier (30 requests/min, 1,000/day per account) through one adapter (`src/lib/ai`). Swappable;
a non-AI path exists for every step. Budget per workspace per day in `AI_DAILY_CALLS`.

## Milestones

1. Skeleton: auth, workspaces, inbox, redaction, AI adapter with caps, CI, deploy
2. Policy library + retrieval
3. Classification + duplicate linking + evals
4. Cited drafting + commitment detection + approval with authority
5. Dashboard: SLA timers, acceptance rate, cost
6. Security suite (cross-tenant, injection, authority bypass) + ZAP
7. Load test (inbound burst)
8. Case study
