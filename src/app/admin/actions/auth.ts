"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, emailConfigured } from "@/lib/email";
import { hashPassword, verifyPassword, dummyHash, passwordProblem } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { verifyTotp } from "@/lib/auth/totp";
import { clientInfo, createSession, destroySession, getCurrentUser } from "@/lib/auth/session";

export type FormState = { error?: string; message?: string; needsTotp?: boolean; fieldErrors?: Record<string, string[] | undefined> };

const GENERIC_LOGIN_ERROR = "Incorrect email or password.";
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
  totp: z.string().trim().max(10).optional(),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!db) return { error: "The database isn't connected yet. Set DATABASE_URL and run the migrations." };
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    totp: formData.get("totp") || undefined,
  });
  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };
  const { email, password, totp } = parsed.data;
  const { ip } = await clientInfo();

  // Throttle by IP and by account so neither can be brute-forced.
  const [ipOk, acctOk] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 20, 15 * 60_000),
    rateLimit(`login:acct:${email}`, 10, 15 * 60_000),
  ]);
  if (!ipOk || !acctOk) {
    await audit("auth.login.throttled", { details: { email }, ip });
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    await verifyPassword(password, await dummyHash()); // constant-ish timing
    await audit("auth.login.failed", { details: { email, reason: "unknown_or_inactive" }, ip });
    return { error: GENERIC_LOGIN_ERROR };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit("auth.login.locked", { userId: user.id, ip });
    return { error: `This account is temporarily locked after repeated failed attempts. Try again after ${LOCK_MINUTES} minutes or reset your password.` };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLoginCount + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: fails >= MAX_FAILS ? 0 : fails,
        lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await audit("auth.login.failed", { userId: user.id, details: { reason: "bad_password", fails }, ip });
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (user.totpEnabled && user.totpSecret) {
    if (!totp) return { needsTotp: true, message: "Enter the 6-digit code from your authenticator app." };
    if (!verifyTotp(user.totpSecret, totp)) {
      await audit("auth.login.failed", { userId: user.id, details: { reason: "bad_totp" }, ip });
      return { needsTotp: true, error: "That code isn't valid. Check your authenticator app and try again." };
    }
  }

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession(user.id);
  await audit("auth.login.success", { userId: user.id, ip });
  redirect("/admin");
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit("auth.logout", { userId: user.id });
  redirect("/admin/login");
}

const emailOnly = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const done: FormState = { message: "If that email belongs to an admin account, a reset link is on its way. It expires in 1 hour." };
  if (!db) return { error: "The database isn't connected yet." };
  if (!emailConfigured()) return { error: "Email isn't configured on this site, so reset links can't be sent. Ask a Super Admin to run `npm run admin:create` to set a new password." };
  const parsed = emailOnly.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: { email: ["Enter a valid email address."] } };
  const { ip } = await clientInfo();
  if (!(await rateLimit(`reset:${ip}`, 5, 60 * 60_000))) return done;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.active) {
    const token = newToken();
    await db.passwordResetToken.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60_000) },
    });
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const link = `${base}/admin/reset-password?token=${token}`;
    const sent = await sendEmail({
      to: user.email,
      subject: "Reset your JOBITHLAL admin password",
      text: `Hi ${user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      html: `<p>Hi ${user.name},</p><p><a href="${link}">Set a new password</a> (valid for 1 hour).</p><p>If you didn't ask for this, you can ignore this email.</p>`,
    });
    await audit("auth.reset.requested", { userId: user.id, details: { emailSent: sent.ok }, ip });
  }
  return done; // Same answer whether or not the account exists.
}

const resetSchema = z.object({ token: z.string().min(20).max(100), password: z.string(), confirm: z.string() });

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!db) return { error: "The database isn't connected yet." };
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "This reset link is invalid." };
  const { token, password, confirm } = parsed.data;
  const problem = passwordProblem(password);
  if (problem) return { fieldErrors: { password: [problem] } };
  if (password !== confirm) return { fieldErrors: { confirm: ["Passwords don't match."] } };

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link has expired or was already used. Request a new one." };
  }
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password), failedLoginCount: 0, lockedUntil: null },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Sign out everywhere after a password change.
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  await audit("auth.reset.completed", { userId: record.userId });
  return { message: "Password updated. You can now sign in." };
}

const setupSchema = z.object({
  setupToken: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string(),
  confirm: z.string(),
});

/**
 * One-time bootstrap of the first Super Admin. Only works while there are no
 * users AND the visitor knows ADMIN_SETUP_TOKEN from the server environment.
 */
export async function setupFirstAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!db) return { error: "The database isn't connected yet." };
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || expected.length < 16) return { error: "Setup is disabled. Set ADMIN_SETUP_TOKEN (16+ characters) in the server environment." };
  const { ip } = await clientInfo();
  if (!(await rateLimit(`setup:${ip}`, 10, 60 * 60_000))) return { error: "Too many attempts. Try again later." };

  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { setupToken, name, email, password, confirm } = parsed.data;
  if (hashToken(setupToken) !== hashToken(expected)) {
    await audit("auth.setup.bad_token", { ip });
    return { fieldErrors: { setupToken: ["Setup token is incorrect."] } };
  }
  const problem = passwordProblem(password);
  if (problem) return { fieldErrors: { password: [problem] } };
  if (password !== confirm) return { fieldErrors: { confirm: ["Passwords don't match."] } };

  // Serialise against a concurrent setup attempt.
  const created = await db.$transaction(async (tx) => {
    if ((await tx.user.count()) > 0) return null;
    return tx.user.create({
      data: { name, email, role: "SUPER_ADMIN", passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
    });
  });
  if (!created) return { error: "Setup has already been completed. Sign in instead." };
  await audit("auth.setup.completed", { userId: created.id, ip });
  await createSession(created.id);
  redirect("/admin");
}
