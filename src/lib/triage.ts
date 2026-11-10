/**
 * Rules-based triage: the non-AI path. Used when AI is unavailable (budget, outage) and as the
 * baseline the AI classifier must beat in evals (milestone 3).
 */
export type Urgency = "low" | "normal" | "high" | "urgent";
export const TOPICS = ["refund", "delivery", "billing", "account", "product", "other"] as const;
export type Topic = (typeof TOPICS)[number];

const TOPIC_WORDS: Record<Exclude<Topic, "other">, RegExp> = {
  refund: /\b(refund|money back|return(ed)?|reimburse|chargeback|cancel(led)? (my )?order)\b/i,
  delivery: /\b(deliver(y|ed)?|shipping|shipment|courier|tracking|not (yet )?(arrived|received)|late)\b/i,
  billing: /\b(invoice|bill(ed|ing)?|charged twice|double charge|payment failed|gst|receipt)\b/i,
  account: /\b(log ?in|password|account|otp|locked|sign ?in|2fa|email change)\b/i,
  product: /\b(broken|defect(ive)?|damaged|not working|size|quality|wrong item)\b/i,
};

export function triage(subject: string, body: string): { topic: Topic; urgency: Urgency } {
  const text = `${subject}\n${body}`;
  const topic = (Object.keys(TOPIC_WORDS) as Exclude<Topic, "other">[]).find((t) => TOPIC_WORDS[t].test(text)) ?? "other";
  let urgency: Urgency = "normal";
  if (/\b(urgent|asap|immediately|legal|lawyer|consumer court|fraud|scam|police)\b/i.test(text)) urgency = "urgent";
  else if (/\b(charged twice|double charge|still (not|haven'?t)|third time|again|angry|unacceptable)\b/i.test(text)) urgency = "high";
  else if (/\b(just (a )?question|curious|whenever|no rush)\b/i.test(text)) urgency = "low";
  return { topic, urgency };
}
