import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from "node:crypto";

/** Field-level encryption for PII (AES-256-GCM). Format: v1.<keyId>.<iv>.<tag>.<ciphertext> (base64url). */
function key(): { id: string; bytes: Buffer } {
  const raw = process.env.FIELD_ENCRYPTION_KEY; // 32 bytes, base64
  const id = process.env.FIELD_ENCRYPTION_KEY_ID ?? "k1";
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY is not set");
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length !== 32) throw new Error("FIELD_ENCRYPTION_KEY must be 32 bytes (base64)");
  return { id, bytes };
}

export function encryptField(plain: string): string {
  const { id, bytes } = key();
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", bytes, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", id, iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptField(token: string): string {
  const [v, , iv, tag, ct] = token.split(".");
  if (v !== "v1") throw new Error("Unknown ciphertext version");
  const { bytes } = key();
  const d = createDecipheriv("aes-256-gcm", bytes, Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}

/** Random secret for a workspace's inbound webhook. */
export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Inbound webhook signature: header `x-resolve-signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "t.body">`.
 * Rejects bad signatures and anything outside a 5-minute window (stops replays of old requests).
 */
export function signWebhook(secret: string, body: string, t = Math.floor(Date.now() / 1000)): string {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}

export function verifyWebhook(secret: string, body: string, header: string | null, now = Math.floor(Date.now() / 1000), toleranceS = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  const t = Number(parts.t);
  if (!Number.isInteger(t) || Math.abs(now - t) > toleranceS || !parts.v1) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${body}`).digest("hex"));
  const given = Buffer.from(parts.v1);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Keyed, non-reversible hash for matching values (e.g. a customer's email) without storing them in clear. */
export function lookupHash(value: string): string {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY is not set");
  return createHmac("sha256", Buffer.from(raw, "base64")).update(`lookup:${value.trim().toLowerCase()}`).digest("base64url");
}
