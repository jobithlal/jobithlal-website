import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter. Uses the RateLimit table when a database is
 * configured (shared across all server instances); otherwise falls back to
 * process memory.
 */
const buckets = new Map<string, { count: number; reset: number }>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!db) return memoryLimit(key, limit, windowMs);
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  try {
    // Atomic in one statement: start a new window if expired, otherwise increment.
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    return Number(rows[0]?.count ?? 1) <= limit;
  } catch (e) {
    console.error("[rate-limit] falling back to memory:", e);
    return memoryLimit(key, limit, windowMs);
  }
}

/** Housekeeping for expired windows (called opportunistically). */
export async function pruneRateLimits() {
  await db?.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
