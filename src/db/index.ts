import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Small pool per serverless instance; prepare:false for Neon's pooled (PgBouncer) connection string.
const client = postgres(url, { max: Number(process.env.DB_POOL_MAX) || 5, prepare: false, idle_timeout: 20, ssl: url.includes("localhost") ? false : "require" });
export const db = drizzle(client, { schema });
export type DB = typeof db;
