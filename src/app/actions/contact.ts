"use server";

import { headers } from "next/headers";
import { inquirySchema, serviceOptions, type ContactState, type Inquiry } from "@/lib/contact-schema";
import { sendEmail, emailConfigured, escapeHtml, getEmailConfig } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/auth/tokens";
import { getSiteSettings } from "@/lib/content";
import { whatsappLink } from "@/lib/utils";

const MIN_FILL_MS = 3000;
// In-memory duplicate guard used only when there is no database (the DB enforces a unique key otherwise).
const recentKeys = new Map<string, ContactState>();
const SUCCESS: ContactState = { status: "success", message: "Thanks — your message has been sent. I'll be in touch soon." };

async function fallbackLinks(data: Partial<Inquiry>) {
  const site = await getSiteSettings();
  const service = serviceOptions.find((s) => s.value === data.service)?.label ?? "";
  const body = [
    `Name: ${data.name ?? ""}`,
    data.company ? `Company: ${data.company}` : "",
    `Service: ${service}`,
    data.budget ? `Budget: ${data.budget}` : "",
    data.timeline ? `Timeline: ${data.timeline}` : "",
    "",
    data.details ?? "",
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  return {
    mailto: `mailto:${site.email}?subject=${encodeURIComponent(`Project inquiry — ${service || "New project"}`)}&body=${encodeURIComponent(body)}`,
    whatsapp: whatsappLink(site.whatsapp, `Hi Jobith, I'd like to discuss a project.\n\n${body}`),
  };
}

function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export async function submitInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const key = String(formData.get("submissionKey") ?? "").slice(0, 100) || null;
  if (key && !db && recentKeys.has(key)) return recentKeys.get(key)!;

  // Anti-spam 1: honeypot must stay empty. Pretend success so bots learn nothing.
  if (String(formData.get("website") ?? "") !== "") return SUCCESS;
  // Anti-spam 2: reject forms filled faster than a person can type.
  const startedAt = Number(formData.get("startedAt") ?? 0);
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "invalid", message: "Please take a moment to review your message, then send it again.", fieldErrors: {} };
  }
  // Anti-spam 3: per-IP rate limit (shared across instances when the DB is connected).
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!(await rateLimit(`contact:${ip}`, 5, 10 * 60_000))) {
    return {
      status: "error",
      message: "Too many messages from this connection. Please try again in a few minutes, or reach me directly below.",
      fallback: await fallbackLinks({}),
    };
  }

  const raw = Object.fromEntries(
    ["name", "email", "service", "details", "company", "phone", "budget", "timeline", "sourcePage"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid", message: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const serviceLabel = serviceOptions.find((s) => s.value === data.service)!.label;

  // 1. Save first, so an email failure never loses the inquiry.
  let inquiryId: string | null = null;
  if (db) {
    if (key) {
      const existing = await db.inquiry.findUnique({ where: { submissionKey: key }, select: { id: true } });
      if (existing) return SUCCESS; // accidental double submit
    }
    try {
      const row = await db.inquiry.create({
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          service: data.service,
          budget: data.budget,
          timeline: data.timeline,
          details: data.details,
          sourcePage: data.sourcePage,
          submissionKey: key,
          ipHash: hashIp(ip),
          adminEmailStatus: (await emailConfigured()) ? "PENDING" : "NOT_CONFIGURED",
        },
      });
      inquiryId = row.id;
    } catch (e) {
      // Unique violation on submissionKey = a concurrent duplicate; anything else is a real failure.
      if ((e as { code?: string }).code === "P2002") return SUCCESS;
      console.error("[contact] could not save inquiry:", e);
    }
  }

  if (!(await emailConfigured())) {
    if (inquiryId) return SUCCESS; // saved — visible in the admin inquiries list
    return {
      status: "unavailable",
      message: "The online form isn't connected yet. Your details are ready to send — choose email or WhatsApp below and nothing you typed is lost.",
      fallback: await fallbackLinks(data),
    };
  }

  // 2. Notify the administrator.
  const site = await getSiteSettings();
  const emailCfg = await getEmailConfig();
  const templates = db ? await db.emailTemplate.findMany({ where: { key: { in: ["admin_inquiry", "visitor_ack"] } } }) : [];
  const tpl = Object.fromEntries(templates.map((t) => [t.key, t]));
  const vars = { name: data.name, firstName: data.name.split(" ")[0], email: data.email, service: serviceLabel, details: data.details };

  const rows: [string, string | undefined][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company],
    ["Phone / WhatsApp", data.phone],
    ["Service", serviceLabel],
    ["Budget", data.budget],
    ["Timeline", data.timeline],
    ["Source page", data.sourcePage],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><strong>${escapeHtml(v!)}</strong></td></tr>`)
    .join("");
  const admin = await sendEmail({
    to: emailCfg.toEmail || site.email,
    replyTo: data.email,
    subject: render(tpl.admin_inquiry?.subject ?? "New inquiry: {{service}} — {{name}}", vars),
    html: `<h2>New project inquiry</h2><table>${table}</table><h3>Project details</h3><p style="white-space:pre-wrap">${escapeHtml(data.details)}</p>`,
    text: `${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${data.details}`,
  });

  // 3. Optional visitor acknowledgement.
  let visitorStatus: "SENT" | "FAILED" | "SKIPPED" = "SKIPPED";
  const ackEnabled = emailCfg.sendConfirmation && (tpl.visitor_ack?.enabled ?? true);
  if (admin.ok && ackEnabled) {
    const body = render(tpl.visitor_ack?.body ?? "Hi {{firstName}},\n\nThanks for reaching out about {{service}}. I'll get back to you soon.\n\n— Jobith Lal", vars);
    const ack = await sendEmail({
      to: data.email,
      subject: render(tpl.visitor_ack?.subject ?? "Thanks for getting in touch — JOBITHLAL", vars),
      text: body,
      html: `<p style="white-space:pre-wrap">${escapeHtml(body)}</p>`,
    });
    visitorStatus = ack.ok ? "SENT" : "FAILED";
  }

  if (db && inquiryId) {
    await db.inquiry
      .update({
        where: { id: inquiryId },
        data: { adminEmailStatus: admin.ok ? "SENT" : "FAILED", adminEmailError: admin.ok ? null : admin.error.slice(0, 500), visitorEmailStatus: visitorStatus },
      })
      .catch((e) => console.error("[contact] could not record email status:", e));
  }

  if (!admin.ok) {
    console.error("[contact] admin notification failed:", admin.error);
    // Saved in the database → the inquiry is safe even though the email failed.
    if (inquiryId) return SUCCESS;
    return {
      status: "error",
      message: "Your message couldn't be delivered just now. Please send it by email or WhatsApp instead — your details are pre-filled.",
      fallback: await fallbackLinks(data),
    };
  }

  if (key && !db) {
    recentKeys.set(key, SUCCESS);
    if (recentKeys.size > 500) recentKeys.delete(recentKeys.keys().next().value!);
  }
  return SUCCESS;
}
