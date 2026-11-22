import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { open } from "@/lib/secret-box";

/**
 * Transactional email via Resend's HTTP API (no SDK dependency).
 * The connection is managed in Admin → Email (stored in the database, API key encrypted).
 * Environment variables RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL /
 * CONTACT_SEND_CONFIRMATION still work as a fallback when nothing is saved there.
 */

/** Overridable only for local testing against a mock server. */
const RESEND_API = process.env.RESEND_API_URL || "https://api.resend.com";

export const emailDataSchema = z.object({
  fromEmail: z.string().trim().toLowerCase().email().max(200),
  fromName: z.string().trim().max(80).default(""),
  toEmail: z.string().trim().toLowerCase().email().max(200).nullable().default(null),
  sendConfirmation: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
export type EmailData = z.infer<typeof emailDataSchema>;

export type EmailConfig = {
  source: "dashboard" | "env" | null;
  apiKey: string | null;
  apiKeyLast4: string | null;
  fromEmail: string | null;
  fromName: string;
  toEmail: string | null;
  sendConfirmation: boolean;
  enabled: boolean;
  /** A key is stored but can't be decrypted (AUTH_SECRET changed). */
  keyUnreadable: boolean;
};

function envConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY || null;
  return {
    source: apiKey ? "env" : null,
    apiKey,
    apiKeyLast4: apiKey ? apiKey.slice(-4) : null,
    fromEmail: process.env.CONTACT_FROM_EMAIL || null,
    fromName: process.env.CONTACT_FROM_NAME || "",
    toEmail: process.env.CONTACT_TO_EMAIL || null,
    sendConfirmation: process.env.CONTACT_SEND_CONFIRMATION === "true",
    enabled: true,
    keyUnreadable: false,
  };
}

/** Current email configuration, read once per request. */
export const getEmailConfig = cache(async (): Promise<EmailConfig> => {
  if (!db) return envConfig();
  const row = await db.emailSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  const env = envConfig();
  if (!row) return env;
  const parsed = emailDataSchema.safeParse(row.data);
  // A key pasted in the admin wins; otherwise the key from Vercel (e.g. the Resend integration) is used.
  const apiKey = row.apiKeyEnc ? open(row.apiKeyEnc) : env.apiKey;
  return {
    source: row.apiKeyEnc ? "dashboard" : env.apiKey ? "env" : null,
    apiKey,
    apiKeyLast4: row.apiKeyEnc ? row.apiKeyLast4 : env.apiKeyLast4,
    fromEmail: parsed.success ? parsed.data.fromEmail : null,
    fromName: parsed.success ? parsed.data.fromName : "",
    toEmail: parsed.success ? parsed.data.toEmail : null,
    sendConfirmation: parsed.success ? parsed.data.sendConfirmation : false,
    enabled: parsed.success ? parsed.data.enabled : false,
    keyUnreadable: Boolean(row.apiKeyEnc) && apiKey === null,
  };
});

export async function emailConfigured() {
  const c = await getEmailConfig();
  return Boolean(c.apiKey && c.fromEmail && c.enabled);
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendEmail(
  msg: { to: string; subject: string; html: string; text: string; replyTo?: string },
  override?: Pick<EmailConfig, "apiKey" | "fromEmail" | "fromName">,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const c = override ?? (await getEmailConfig());
  if (!c.apiKey || !c.fromEmail) return { ok: false, error: "Email provider not configured" };
  if (!override && !(await getEmailConfig()).enabled) return { ok: false, error: "Email sending is paused in the admin" };
  const from = c.fromName ? `${c.fromName} <${c.fromEmail}>` : c.fromEmail;
  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text, reply_to: msg.replyTo }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: `${res.status} ${body.message ?? res.statusText}` };
    return { ok: true, id: body.id ?? "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export type ResendDomain = { id: string; name: string; status: string; region?: string };

/**
 * Checks an API key against Resend. Full-access keys can list domains;
 * "sending access" keys are valid but can't, which is reported as `restricted`.
 */
export async function checkResendKey(apiKey: string): Promise<
  { ok: true; restricted: false; domains: ResendDomain[] } | { ok: true; restricted: true } | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${RESEND_API}/domains`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as { data?: ResendDomain[]; name?: string; message?: string };
    if (res.ok) return { ok: true, restricted: false, domains: body.data ?? [] };
    if (body.name === "restricted_api_key") return { ok: true, restricted: true };
    return { ok: false, error: body.message ?? `Resend answered ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't reach Resend" };
  }
}

/** Where inquiry notifications go: the admin setting, else the business email. */
export async function inquiryRecipient(fallback: string) {
  return (await getEmailConfig()).toEmail || fallback;
}
