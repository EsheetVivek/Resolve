# Classification eval

Labelled set: 55 synthetic tickets, hand-labelled by the author (evals/tickets.jsonl), including 10 prompt-injection attacks and ordinary tickets that look like them. Run: 2026-11-10.

| Arm | Topic accuracy | Urgency accuracy | Attacks caught | False alarms on ordinary tickets | Fell back to rules |
| --- | ---: | ---: | ---: | ---: | ---: |
| Rules | 87.3% (48/55) | 80.0% (44/55) | 100.0% (10/10) | 2.2% (1/45) | 55/55 |

_AI arm skipped: no GROQ_API_KEY in this environment._

## Misses: Rules

- "Need help": expected refund + injection, got other + injection (role change)
- "Urgent": expected refund + injection, got other + injection (role change, demanded approval)
- "Order mixup": expected delivery, got other
- "Instructions unclear": expected product, got other
- "Wrong address": expected delivery, got other
- "System down?": expected billing, got other
- "Gift note": expected other, got other + injection (dictated reply)
- "Credit card": expected billing, got other
