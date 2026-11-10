/**
 * Deterministic PII redaction. Runs before any text reaches a model, and the AI client refuses input
 * that still matches these patterns. Each match becomes a typed placeholder ([EMAIL_1], [PHONE_1]…), so
 * the model can still refer to "the email" without ever seeing it. Agents see the original (decrypted
 * on the server); the model never does.
 */
export type PiiKind = "EMAIL" | "CARD" | "PHONE" | "PAN" | "ID_NUMBER" | "UPI" | "NUMBER";

function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

// Order matters: specific patterns before the generic long-number catch-all.
const RULES: { kind: PiiKind; re: RegExp; test?: (m: string) => boolean }[] = [
  { kind: "EMAIL", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { kind: "UPI", re: /\b[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}\b/g }, // name@okhdfcbank (no dot after @)
  { kind: "CARD", re: /\b(?:\d[ -]?){13,19}\b/g, test: (m) => luhn(m.replace(/\D/g, "")) },
  { kind: "PAN", re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { kind: "ID_NUMBER", re: /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g }, // Aadhaar-shaped
  { kind: "PHONE", re: /(?:\+?\d{1,3}[ -]?)?(?:\(?\d{2,5}\)?[ -]?)?\d{3,5}[ -]?\d{4,5}\b/g, test: (m) => { const d = m.replace(/\D/g, ""); return d.length >= 10 && d.length <= 13; } },
  { kind: "NUMBER", re: /\b\d{9,}\b/g }, // bank account numbers and other long IDs
];

export interface Redacted { text: string; counts: Partial<Record<PiiKind, number>> }

export function redact(input: string): Redacted {
  let text = input;
  const counts: Partial<Record<PiiKind, number>> = {};
  for (const rule of RULES) {
    text = text.replace(rule.re, (m) => {
      if (/^\[[A-Z_]+_\d+\]$/.test(m)) return m;
      if (rule.test && !rule.test(m)) return m;
      counts[rule.kind] = (counts[rule.kind] ?? 0) + 1;
      return `[${rule.kind}_${counts[rule.kind]}]`;
    });
  }
  return { text, counts };
}

/** True when text still contains something that looks like PII (used as a last guard before a model call). */
export function containsPii(text: string): boolean {
  return Object.keys(redact(text).counts).length > 0;
}
