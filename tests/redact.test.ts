import { describe, it, expect } from "vitest";
import { containsPii, redact } from "@/lib/redact";

describe("PII redaction", () => {
  it("removes emails, phones, cards, PAN, Aadhaar-shaped IDs, UPI IDs and long account numbers", () => {
    const r = redact(
      "I'm priya.s@example.com, call +91 98765 43210 or 9876543210. Card 4111 1111 1111 1111. " +
      "PAN ABCDE1234F, Aadhaar 2345 6789 0123, UPI priya@okhdfcbank, account 123456789012345.",
    );
    for (const leaked of ["priya.s@example.com", "98765 43210", "9876543210", "4111 1111 1111 1111", "ABCDE1234F", "2345 6789 0123", "priya@okhdfcbank", "123456789012345"]) {
      expect(r.text).not.toContain(leaked);
    }
    expect(r.counts.EMAIL).toBe(1);
    expect(r.counts.CARD).toBe(1);
    expect(r.counts.PAN).toBe(1);
    expect(containsPii(r.text)).toBe(false);
  });

  it("keeps ordinary text, order references, prices and dates intact", () => {
    const t = "Order #A-10293 placed on 3 Nov for ₹1,499 hasn't arrived. Size M, qty 2.";
    expect(redact(t).text).toBe(t);
  });

  it("numbers repeated placeholders so the model can tell them apart", () => {
    expect(redact("a@x.io and b@y.io").text).toBe("[EMAIL_1] and [EMAIL_2]");
  });

  it("does not treat a non-Luhn 16-digit number as a card, but still hides it", () => {
    const r = redact("ref 1234567812345678");
    expect(r.counts.CARD).toBeUndefined();
    expect(r.text).not.toContain("1234567812345678");
  });
});
