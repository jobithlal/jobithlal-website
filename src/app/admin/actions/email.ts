"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { checkResendKey, emailDataSchema, escapeHtml, getEmailConfig, sendEmail } from "@/lib/email";
import { open, seal, secretBoxReady } from "@/lib/secret-box";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";

const KEY_RE = /^re_[A-Za-z0-9_-]{10,200}$/;

export async function saveEmailConnection(fd: FormData): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    const f = formObject(fd) as Record<string, string>;
    const newKey = (f.apiKey ?? "").trim();
    const parsed = emailDataSchema.safeParse({
      fromEmail: f.fromEmail,
      fromName: f.fromName ?? "",
      toEmail: (f.toEmail ?? "").trim() || null,
      sendConfirmation: f.sendConfirmation === "true",
      enabled: f.enabled === "true",
    });
    const fieldErrors: Record<string, string[]> = {};
    if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = ["Enter a valid email address."];
    if (newKey && !KEY_RE.test(newKey)) fieldErrors.apiKey = ["Resend API keys start with “re_”. Copy the whole key."];
    if (Object.keys(fieldErrors).length || !parsed.success) return { ok: false, error: "Some fields need attention.", fieldErrors };
    if (!secretBoxReady()) {
      return { ok: false, error: "AUTH_SECRET isn't set on the server, so the key can't be stored securely. Add it in Vercel → Environment Variables (32+ random characters) and redeploy." };
    }

    const db = requireDb();
    const existing = await db.emailSettings.findUnique({ where: { id: "default" } });
    const apiKey = newKey || (existing?.apiKeyEnc ? open(existing.apiKeyEnc) : null);
    if (!apiKey) return { ok: false, error: "Paste your Resend API key.", fieldErrors: { apiKey: ["Required."] } };

    // Verify the key — and, when the key can see domains, that the sender's domain is verified.
    const check = await checkResendKey(apiKey);
    if (!check.ok) return { ok: false, error: `Resend rejected the key: ${check.error}`, fieldErrors: { apiKey: ["This key didn't work."] } };
    const domain = parsed.data.fromEmail.split("@")[1];
    let note = "";
    if (!check.restricted && domain !== "resend.dev") {
      const d = check.domains.find((x) => x.name === domain);
      if (!d) {
        return {
          ok: false,
          error: `${domain} isn't added in your Resend account. Add it under Resend → Domains, add the DNS records, then try again.`,
          fieldErrors: { fromEmail: ["Domain not found in Resend."] },
        };
      }
      if (d.status !== "verified") {
        return {
          ok: false,
          error: `${domain} is “${d.status}” in Resend. Finish the DNS records and wait for it to show Verified.`,
          fieldErrors: { fromEmail: ["Domain not verified yet."] },
        };
      }
    }
    if (domain === "resend.dev") note = " The resend.dev test sender only delivers to your own Resend account email.";
    if (check.restricted) note = " This is a sending-only key, so domain status can't be checked here — send a test to confirm.";

    await db.emailSettings.upsert({
      where: { id: "default" },
      create: { id: "default", data: parsed.data as Prisma.InputJsonValue, apiKeyEnc: seal(apiKey), apiKeyLast4: apiKey.slice(-4) },
      update: {
        data: parsed.data as Prisma.InputJsonValue,
        ...(newKey ? { apiKeyEnc: seal(newKey), apiKeyLast4: newKey.slice(-4) } : {}),
      },
    });
    await audit("settings.email_connection", {
      userId: user.id,
      details: { fromEmail: parsed.data.fromEmail, toEmail: parsed.data.toEmail, enabled: parsed.data.enabled, keyChanged: Boolean(newKey) },
    });
    refresh();
    return { ok: true, message: `${parsed.data.enabled ? "Resend connected." : "Saved — email sending is paused."}${note}` };
  });
}

export async function disconnectEmail(): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    await requireDb().emailSettings.deleteMany({ where: { id: "default" } });
    await audit("settings.email_disconnected", { userId: user.id });
    refresh();
    return { ok: true, message: "Resend disconnected and the stored key deleted." };
  });
}

export async function sendTestEmail(fd: FormData): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    const to = z.string().trim().toLowerCase().email().safeParse(fd.get("to") || user.email);
    if (!to.success) return { ok: false, error: "Enter a valid address to send the test to.", fieldErrors: { to: ["Invalid email."] } };
    const c = await getEmailConfig();
    if (!c.apiKey || !c.fromEmail) return { ok: false, error: "Connect Resend first." };
    // Tests bypass the pause switch so the connection can be checked before going live.
    const r = await sendEmail(
      {
        to: to.data,
        subject: "JOBITHLAL — test email",
        text: `This is a test from your website admin, sent by ${user.name}. If you can read this, inquiry notifications will reach you.`,
        html: `<p>This is a test from your website admin, sent by ${escapeHtml(user.name)}.</p><p>If you can read this, inquiry notifications will reach you.</p>`,
      },
      c,
    );
    await audit("settings.email_test", { userId: user.id, details: { ok: r.ok, to: to.data } });
    return r.ok ? { ok: true, message: `Test email sent to ${to.data}. Check the inbox (and spam).` } : { ok: false, error: `Delivery failed: ${r.error}` };
  });
}
