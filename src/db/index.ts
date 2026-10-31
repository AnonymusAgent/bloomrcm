import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database URL resolution:
 * - NEON_DATABASE_URL is preferred for the managed production database.
 * - DATABASE_URL_POOLED supports pooled Neon connections.
 * - DATABASE_URL supports direct PostgreSQL connections and local development.
 *
 * Credentials must be supplied through environment variables. There is
 * deliberately no source-code fallback, so secrets can never enter Git.
 */
const databaseUrl =
  process.env.NEON_DATABASE_URL ??
  process.env.DATABASE_URL_POOLED ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("NEON_DATABASE_URL, DATABASE_URL_POOLED, or DATABASE_URL is required");
}

/**
 * Driver selection:
 * - Neon hosts → @neondatabase/serverless HTTP driver. Best practice for
 *   serverless runtimes: no persistent TCP pools across invocations.
 * - Other PostgreSQL hosts → classic node-postgres pool.
 */
const isNeonHost = /\.neon\.tech(\/|:|\?|$)/.test(databaseUrl);

export const db = isNeonHost
  ? (drizzleNeon(neon(databaseUrl), { schema }) as unknown as ReturnType<typeof drizzlePg>)
  : createPooledDb(databaseUrl);

function createPooledDb(url: string) {
  return drizzlePg(getSharedPool(url), { schema });
}

const globalForDb = globalThis as typeof globalThis & {
  __bloomRcmPostgresqlPool?: Pool;
};

function getSharedPool(url: string): Pool {
  if (!globalForDb.__bloomRcmPostgresqlPool) {
    globalForDb.__bloomRcmPostgresqlPool = new Pool({ connectionString: url });
  }
  return globalForDb.__bloomRcmPostgresqlPool;
}

export const pool: Pool | undefined = isNeonHost ? undefined : globalForDb.__bloomRcmPostgresqlPool;
