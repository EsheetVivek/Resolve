import { describe, it, expect } from "vitest";
import { slugify, splitPolicy } from "@/lib/passages";

describe("policy splitting", () => {
  const body = `Intro line before any heading.

## 1. Duplicate charges
If a payment is captured twice, the duplicate is reversed to the original method.
Agents never promise a date for the reversal.

Reversals usually take 5–7 working days.

## 2. Refund limits
- Agents may approve refunds up to ₹2,000.
- Leads may approve up to ₹10,000.
1. Anything above needs the finance team.`;

  it("makes one citable passage per line or list item, labelled by section and order", () => {
    const p = splitPolicy("Billing", body);
    expect(p.map((x) => x.label)).toEqual(["Billing §0.1", "Billing §1.1", "Billing §1.2", "Billing §1.3", "Billing §2.1", "Billing §2.2", "Billing §2.3"]);
    expect(p[1].text).toBe("If a payment is captured twice, the duplicate is reversed to the original method.");
    expect(p[2].text).toBe("Agents never promise a date for the reversal.");
    expect(p[1].heading).toBe("Duplicate charges");
    expect(p[5].text).toBe("Leads may approve up to ₹10,000.");
  });

  it("never gives two passages the same label, even with repeated section numbers", () => {
    const p = splitPolicy("X", "## 1. A\nfirst\n\n## 1. B\nsecond");
    expect(new Set(p.map((x) => x.label)).size).toBe(p.length);
  });

  it("gives the same labels for the same text (stable citations)", () => {
    expect(splitPolicy("Billing", body)).toEqual(splitPolicy("Billing", body));
  });

  it("slugifies titles safely", () => {
    expect(slugify("Returns & Refunds!")).toBe("returns-refunds");
    expect(slugify("💥")).toBe("policy");
  });
});
