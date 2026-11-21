"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { emailConfigured, sendEmail } from "@/lib/email";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { newTotpSecret, totpUri, verifyTotp } from "@/lib/auth/totp";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";

const roleSchema = z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"]);

async function superAdminCount(excludeId?: string) {
  return requireDb().user.count({ where: { role: "SUPER_ADMIN", active: true, ...(excludeId ? { id: { not: excludeId } } : {}) } });
}

/** Creates an admin. With email configured, sends a set-password link; otherwise returns a one-time temporary password. */
export async function createUser(fd: FormData): Promise<ActionResult<{ tempPassword?: string }>> {
  return guarded("users:manage", async (user) => {
    const data = z
      .object({ name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(200), role: roleSchema })
      .parse(formObject(fd));
    const db = requireDb();
    const temp = randomBytes(12).toString("base64url") + "9!";
    const created = await db.user.create({ data: { ...data, passwordHash: await hashPassword(temp) } });
    await audit("user.created", { userId: user.id, entity: "User", entityId: created.id, details: { role: data.role } });

    if (emailConfigured()) {
      const token = newToken();
      await db.passwordResetToken.create({ data: { tokenHash: hashToken(token), userId: created.id, expiresAt: new Date(Date.now() + 48 * 3600_000) } });
      const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/reset-password?token=${token}`;
      const r = await sendEmail({
        to: created.email,
        subject: "You've been invited to the JOBITHLAL admin",
        text: `Hi ${created.name},\n\n${user.name} added you as an admin. Set your password here (valid 48 hours):\n${link}`,
        html: `<p>Hi ${created.name},</p><p>${user.name} added you as an admin. <a href="${link}">Set your password</a> (valid 48 hours).</p>`,
      });
      if (r.ok) {
        refresh();
        return { ok: true, message: `Invitation sent to ${created.email}.` };
      }
    }
    refresh();
    return {
      ok: true,
      message: "User created. Share the temporary password below securely — it's shown only once.",
      data: { tempPassword: temp },
    };
  });
}

export async function updateUser(userId: string, fd: FormData): Promise<ActionResult> {
  return guarded("users:manage", async (me) => {
    const data = z
      .object({ name: z.string().trim().min(2).max(120), role: roleSchema, active: z.enum(["true", "false"]).transform((v) => v === "true") })
      .parse(formObject(fd));
    const target = await requireDb().user.findUniqueOrThrow({ where: { id: userId } });
    if (target.id === me.id && (data.role !== "SUPER_ADMIN" || !data.active)) {
      return { ok: false, error: "You can't remove your own Super Admin access or deactivate yourself." };
    }
    if (target.role === "SUPER_ADMIN" && (data.role !== "SUPER_ADMIN" || !data.active) && (await superAdminCount(target.id)) === 0) {
      return { ok: false, error: "There must always be at least one active Super Admin." };
    }
    await requireDb().$transaction([
      requireDb().user.update({ where: { id: userId }, data }),
      // Role or status changes take effect immediately: sign the user out.
      ...(data.role !== target.role || !data.active ? [requireDb().session.deleteMany({ where: { userId } })] : []),
    ]);
    await audit("user.updated", { userId: me.id, entity: "User", entityId: userId, details: { role: data.role, active: data.active } });
    refresh();
    return { ok: true, message: "User updated." };
  });
}

export async function signOutUserEverywhere(userId: string): Promise<ActionResult> {
  return guarded("users:manage", async (me) => {
    const r = await requireDb().session.deleteMany({ where: { userId } });
    await audit("user.sessions_revoked", { userId: me.id, entity: "User", entityId: userId, details: { count: r.count } });
    refresh();
    return { ok: true, message: `Signed out of ${r.count} session${r.count === 1 ? "" : "s"}.` };
  });
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  return guarded("users:manage", async (me) => {
    if (userId === me.id) return { ok: false, error: "You can't delete your own account." };
    const target = await requireDb().user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === "SUPER_ADMIN" && (await superAdminCount(target.id)) === 0) return { ok: false, error: "There must always be at least one active Super Admin." };
    await requireDb().user.delete({ where: { id: userId } });
    await audit("user.deleted", { userId: me.id, entity: "User", entityId: userId, details: { email: target.email } });
    refresh();
    return { ok: true, message: "User deleted. Their notes and history are kept, shown as “Former user”." };
  });
}

/* ───────────────────────── My account (every signed-in role) ───────────────────────── */

export async function changeMyPassword(fd: FormData): Promise<ActionResult> {
  return guarded("dashboard:view", async (user) => {
    const f = formObject(fd) as Record<string, string>;
    const row = await requireDb().user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(f.current ?? "", row.passwordHash))) return { ok: false, error: "Current password is incorrect.", fieldErrors: { current: ["Incorrect password."] } };
    const problem = passwordProblem(f.password ?? "");
    if (problem) return { ok: false, error: problem, fieldErrors: { password: [problem] } };
    if (f.password !== f.confirm) return { ok: false, error: "Passwords don't match.", fieldErrors: { confirm: ["Passwords don't match."] } };
    await requireDb().$transaction([
      requireDb().user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(f.password) } }),
      // Keep this session, end all others.
      requireDb().session.deleteMany({ where: { userId: user.id, id: { not: user.sessionId } } }),
    ]);
    await audit("auth.password_changed", { userId: user.id });
    refresh();
    return { ok: true, message: "Password changed. Other devices have been signed out." };
  });
}

export async function startTotpSetup(): Promise<ActionResult<{ secret: string; uri: string }>> {
  return guarded("dashboard:view", async (user) => {
    const secret = newTotpSecret();
    // Stored but not enabled until a valid code confirms it.
    await requireDb().user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });
    return { ok: true, data: { secret, uri: totpUri(secret, user.email) } };
  });
}

export async function confirmTotp(fd: FormData): Promise<ActionResult> {
  return guarded("dashboard:view", async (user) => {
    const row = await requireDb().user.findUniqueOrThrow({ where: { id: user.id } });
    if (!row.totpSecret || !verifyTotp(row.totpSecret, String(fd.get("code") ?? ""))) {
      return { ok: false, error: "That code isn't right. Check your authenticator app and try again.", fieldErrors: { code: ["Invalid code."] } };
    }
    await requireDb().user.update({ where: { id: user.id }, data: { totpEnabled: true } });
    await audit("auth.2fa_enabled", { userId: user.id });
    refresh();
    return { ok: true, message: "Two-step sign-in is on. You'll need a code each time you sign in." };
  });
}

export async function disableTotp(fd: FormData): Promise<ActionResult> {
  return guarded("dashboard:view", async (user) => {
    const row = await requireDb().user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(String(fd.get("current") ?? ""), row.passwordHash))) return { ok: false, error: "Enter your current password to turn this off.", fieldErrors: { current: ["Incorrect password."] } };
    await requireDb().user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } });
    await audit("auth.2fa_disabled", { userId: user.id });
    refresh();
    return { ok: true, message: "Two-step sign-in is off." };
  });
}

export async function revokeMySession(sessionId: string): Promise<ActionResult> {
  return guarded("dashboard:view", async (user) => {
    if (sessionId === user.sessionId) return { ok: false, error: "Use Sign out to end this session." };
    await requireDb().session.deleteMany({ where: { id: sessionId, userId: user.id } });
    await audit("auth.session_revoked", { userId: user.id });
    refresh();
    return { ok: true, message: "Session signed out." };
  });
}
