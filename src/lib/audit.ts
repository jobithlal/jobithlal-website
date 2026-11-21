import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/auth/tokens";

/** Records a significant administrative or security event. Never throws. */
export async function audit(
  action: string,
  opts: { userId?: string | null; entity?: string; entityId?: string; details?: Record<string, unknown>; ip?: string } = {},
) {
  if (!db) return;
  try {
    await db.auditLog.create({
      data: {
        action,
        userId: opts.userId ?? null,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details as Prisma.InputJsonValue | undefined,
        ip: opts.ip ? hashIp(opts.ip) : undefined,
      },
    });
  } catch (e) {
    console.error("[audit] failed to record", action, e);
  }
}
