import { pgTable, text, timestamp, integer, uuid, primaryKey, index, pgEnum, jsonb, date, unique } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* ---------- Auth.js (database sessions) ---------- */
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

/* ---------- Tenancy ---------- */
export const role = pgEnum("role", ["agent", "lead", "admin"]);

/** A support team. Every row below belongs to exactly one workspace. */
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Secret for the signed inbound webhook (stored encrypted).
  inboundSecretEnc: text("inbound_secret_enc").notNull(),
  aiDailyCalls: integer("ai_daily_calls").notNull().default(200),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Who belongs to which workspace, their role, and how much they may commit the company to. */
export const memberships = pgTable("memberships", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: role("role").notNull().default("agent"),
  // Largest refund / credit / discount (in paise) this person may approve. 0 = none.
  authorityCents: integer("authority_cents").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.workspaceId, t.userId] }), index().on(t.userId)]);

/* ---------- Tickets ---------- */
export const ticketStatus = pgEnum("ticket_status", ["new", "triaged", "drafted", "awaiting_approval", "answered", "closed"]);
export const urgency = pgEnum("urgency", ["low", "normal", "high", "urgent"]);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // "form" | "webhook"
  externalId: text("external_id"), // idempotency for webhooks
  customerEmailEnc: text("customer_email_enc").notNull(),
  subject: text("subject").notNull(), // redacted
  bodyEnc: text("body_enc").notNull(), // raw, encrypted
  bodyRedacted: text("body_redacted").notNull(), // the only text a model ever sees
  redactions: jsonb("redactions").$type<Record<string, number>>().notNull(),
  status: ticketStatus("status").notNull().default("new"),
  topic: text("topic"),
  urgency: urgency("urgency"),
  duplicateOf: uuid("duplicate_of"),
  // Keyed hash of the customer's email: lets us link a customer's tickets without decrypting.
  customerHash: text("customer_hash"),
  classifiedBy: text("classified_by").notNull().default("rules"), // "ai" | "rules"
  classifyModel: text("classify_model"),
  // Phrases that looked like instructions to the AI (prompt injection). Non-empty = flagged.
  injectionFlags: jsonb("injection_flags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index().on(t.workspaceId, t.status, t.createdAt), unique().on(t.workspaceId, t.externalId), index().on(t.workspaceId, t.customerHash, t.createdAt)]);

/* ---------- AI budget ---------- */
export const aiUsage = pgTable("ai_usage", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  calls: integer("calls").notNull().default(0),
  tokens: integer("tokens").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.workspaceId, t.day] })]);

/* ---------- Audit ---------- */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  target: text("target").notNull(),
  meta: jsonb("meta"),
  at: timestamp("at").notNull().defaultNow(),
}, (t) => [index().on(t.workspaceId, t.at)]);

/* ---------- Policy library (milestone 2) ---------- */
/** A named policy (e.g. "Billing"). Its text lives in immutable versions. */
export const policies = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.workspaceId, t.slug)]);

/**
 * Published versions are never edited, so a draft can always show exactly which wording it relied on.
 * The current version of a policy is its highest version number.
 */
export const policyVersions = pgTable("policy_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  note: text("note"),
  publishedBy: text("published_by").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
}, (t) => [unique().on(t.policyId, t.version)]);

/** One citable passage of a policy version, e.g. "Billing §2.1". Full-text indexed for retrieval. */
export const passages = pgTable("passages", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id").notNull().references(() => policyVersions.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // "Billing §2.1"
  heading: text("heading").notNull(),
  text: text("text").notNull(),
  ord: integer("ord").notNull(),
}, (t) => [index().on(t.versionId, t.ord), index().on(t.workspaceId)]);
