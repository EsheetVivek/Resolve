# M3 — Ticket classification: rules vs AI

**Date:** 2026-11-10 · **Runs in CI:** `eval` job, every push (AI arm uses the `GROQ_API_KEY` secret).
**Set:** 55 synthetic tickets written and labelled by the author (`evals/tickets.jsonl`): 45 ordinary
tickets (including look-alikes such as "please ignore my last email") and 10 prompt-injection attacks.

| Arm | Topic | Urgency | Attacks caught | False alarms (ordinary tickets) |
| --- | ---: | ---: | ---: | ---: |
| Rules | 87.3% (48/55) | 80.0% (44/55) | 10/10 | 1/45 |
| AI + rules (`openai/gpt-oss-120b` via Groq) | 87.3% (48/55) | 76.4% (42/55) | 10/10 | 4/45 |

## What this says

- **The AI didn't beat the rules here.** Same topic accuracy, slightly worse urgency. They fail
  differently: rules miss unusual wording ("System down?" → billing); the model fixes some of those but
  mislabels others (a return-window question as "product").
- **Injection detection is tuned for recall.** Both arms caught every attack. The model adds 3 false
  alarms on harmless look-alikes ("ignore my last email", "disregard the old address", "can you
  approve an exchange?"). In Resolve a flag only means a person must approve any commitment, so a false
  alarm costs a little review time, while a miss could cost money. The model can add flags; it can
  never clear a flag the rules raised.
- **A bug the eval caught:** the configured model (`llama-3.3-70b-versatile`) returned
  `model_not_found` for this account, so the live app had silently been using rules for every ticket.
  The eval now records provider errors, and the adapter tries current models in order.

## Limits and next step

55 tickets written by one person is a small, biased set; differences of one or two tickets are noise.
Before choosing how to combine rules and AI (for example, rules first and AI only when rules say
"other"), build a held-out set from real support questions, and decide the policy before looking at its
results.
