import { sql } from "drizzle-orm";
import { db } from "@/db";
import { withinLimit } from "@/lib/security";

/**
 * Database-backed fixed-window rate limiter.
 * Atomic upsert resets the window once it expires and increments otherwise.
 */
export async function hitRateLimit(
  key: string,
  limit: number,
  windowMinutes: number,
): Promise<{ allowed: boolean; count: number; retryAfterSec: number }> {
  const safeKey = key.slice(0, 180);
  try {
    const result = await db.execute(sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${safeKey}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < now() - (${windowMinutes} * interval '1 minute')
                     THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - (${windowMinutes} * interval '1 minute')
                            THEN now() ELSE rate_limits.window_start END
      RETURNING count, window_start AS "windowStart"
    `);
    const row = (result.rows[0] ?? {}) as { count?: number; windowStart?: string | Date };
    const count = Number(row.count ?? 1);
    const windowStart = row.windowStart ? new Date(row.windowStart) : new Date();
    const retryAfterSec = Math.max(
      1,
      Math.ceil(windowStart.getTime() / 1000 + windowMinutes * 60 - Date.now() / 1000),
    );
    return { allowed: withinLimit(count, limit), count, retryAfterSec };
  } catch (error) {
    // If the limiter store is unavailable, fail closed for auth-critical keys
    // but avoid taking the public form down entirely.
    console.error("[rate-limit] store error:", error instanceof Error ? error.message : "unknown");
    return { allowed: key.startsWith("contact:"), count: 0, retryAfterSec: 60 };
  }
}
