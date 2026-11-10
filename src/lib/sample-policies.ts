/** Starter policies for a new workspace (an imaginary D2C clothing brand). Editable like any policy. */
export const SAMPLE_POLICIES = [
  { title: "Billing", body: `## 1. Payment methods
We accept UPI, cards, net banking and cash on delivery for orders under ₹5,000.

## 2. Duplicate charges
If a payment is captured twice for one order, the duplicate is reversed to the original payment method.
Reversals usually reach the customer within 5–7 working days, depending on their bank.
Agents must not promise a specific reversal date.

## 3. Invoices
A GST invoice is emailed when an order ships and can be downloaded from Account → Orders.
Invoices can be corrected (name or GST number) within 30 days of the order date.` },
  { title: "Refunds", body: `## 1. Eligibility
Unused items with tags can be returned within 15 days of delivery for a full refund.
Sale items marked "final sale" can't be returned, but can be exchanged for a different size within 7 days.

## 2. How refunds are paid
Refunds go back to the original payment method within 7 working days of the return reaching our warehouse.
Cash-on-delivery orders are refunded by bank transfer to an account the customer provides.

## 3. Approval limits
Agents may approve refunds up to ₹2,000; leads up to ₹10,000. Anything above needs the finance team.
Discount codes and goodwill credits count as refunds for approval limits.` },
  { title: "Delivery", body: `## 1. Timelines
Metro cities: 2–4 working days. Other locations: 4–7 working days.

## 2. Delays
If tracking hasn't updated for 3 working days, the agent raises a trace with the courier and tells the customer it may take 48 hours to hear back.
Agents must not promise a delivery date while a trace is open.

## 3. Lost parcels
If the courier confirms a parcel is lost, the customer chooses a replacement or a full refund.` },
  { title: "Accounts", body: `## 1. Sign-in problems
If an OTP doesn't arrive, the customer can request a new one after 60 seconds, up to 5 times an hour.
Agents can't read, reset or share OTPs and must never ask for one.

## 2. Account changes
Email or phone changes need verification from the old contact or an order number with the billing PIN code.` },
];
