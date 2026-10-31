import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration. .env.local takes precedence over .env,
 * matching Next.js behavior. No database credential is stored in source.
 */
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.DATABASE_URL_POOLED;
if (!databaseUrl) {
  throw new Error("DATABASE_URL, NEON_DATABASE_URL, or DATABASE_URL_POOLED is required for Drizzle Kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: databaseUrl },
});
