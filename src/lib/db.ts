import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Single Prisma client per server process (reused across hot reloads in dev).
 * `db` is null when DATABASE_URL isn't set, so the public site still builds and
 * renders from the seed content before a database is connected.
 */
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 5 });
  return new PrismaClient({ adapter });
}

export const dbConfigured = Boolean(process.env.DATABASE_URL);

export const db: PrismaClient | null = dbConfigured ? (globalForDb.prisma ??= create()) : null;

/** For code paths that cannot work without a database (admin, auth). */
export function requireDb(): PrismaClient {
  if (!db) throw new Error("DATABASE_URL is not configured");
  return db;
}
