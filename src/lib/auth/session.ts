import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireDb, db } from "@/lib/db";
import { can, type Permission } from "./permissions";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-jl_session" : "jl_session";
const SESSION_DAYS = 7;
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

export async function clientInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown",
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  const { ip, userAgent } = await clientInfo();
  await requireDb().session.create({ data: { tokenHash: hashToken(token), userId, expiresAt, ip, userAgent } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && db) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  // __Host- cookies are only replaced when the same Secure/Path attributes are sent.
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

/** Current admin user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async () => {
  if (!db) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, active: true, totpEnabled: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;

  // Sliding expiry, written at most once a day per session.
  if (Date.now() - session.lastSeenAt.getTime() > REFRESH_AFTER_MS) {
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5) },
    });
  }
  return { ...session.user, sessionId: session.id };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For admin pages: redirects to login when signed out, to the no-access page when lacking the permission. */
export async function requirePage(permission: Permission = "dashboard:view") {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission)) redirect("/admin/no-access");
  return user;
}

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") {
    super(code === "forbidden" ? "You don't have permission to do that." : "Your session has expired. Please sign in again.");
  }
}

/** For server actions / route handlers: throws AuthError instead of redirecting. */
export async function requireAction(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated");
  if (!can(user.role, permission)) throw new AuthError("forbidden");
  return user;
}
