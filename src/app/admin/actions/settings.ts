"use server";

import { z } from "zod";
import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { siteSettingsSchema } from "@/content/schema";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";
import { fieldErrorsFrom } from "@/lib/admin/sections";

const generalSchema = siteSettingsSchema.omit({ socials: true });

export async function saveGeneralSettings(fd: FormData): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    const f = formObject(fd) as Record<string, string>;
    const parsed = generalSchema.safeParse({
      name: f.name?.trim(),
      logoText: f.logoText?.trim(),
      logoSubtitle: f.logoSubtitle?.trim(),
      logoImageUrl: f.logoUrl?.trim() || undefined,
      tagline: f.tagline?.trim(),
      url: f.url?.trim().replace(/\/$/, ""),
      email: f.email?.trim().toLowerCase(),
      whatsapp: f.whatsapp?.replace(/[^\d+]/g, ""),
      location: f.location?.trim(),
      experienceYears: Number(f.experienceYears),
      showDemoProjects: f.showDemoProjects === "true",
    });
    if (!parsed.success) return { ok: false, error: "Some fields need attention.", fieldErrors: fieldErrorsFrom(parsed.error) };
    if (!/^\+\d{7,15}$/.test(parsed.data.whatsapp)) return { ok: false, error: "Check the WhatsApp number.", fieldErrors: { whatsapp: ["Use international format, e.g. +97477350438."] } };
    await requireDb().siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default", data: parsed.data as Prisma.InputJsonValue },
      update: { data: parsed.data as Prisma.InputJsonValue },
    });
    await audit("settings.general", { userId: user.id, entity: "SiteSettings" });
    updateTag(TAGS.settings);
    updateTag(TAGS.projects);
    refresh();
    return { ok: true, message: "Settings saved and live." };
  });
}

const PLATFORMS = ["Instagram", "LinkedIn", "YouTube", "Vimeo", "Behance"] as const;
const HOSTS: Record<(typeof PLATFORMS)[number], RegExp> = {
  Instagram: /(^|\.)instagram\.com$/,
  LinkedIn: /(^|\.)linkedin\.com$/,
  YouTube: /(^|\.)(youtube\.com|youtu\.be)$/,
  Vimeo: /(^|\.)vimeo\.com$/,
  Behance: /(^|\.)behance\.net$/,
};

export async function saveSocialLinks(fd: FormData): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    const f = formObject(fd) as Record<string, string>;
    const errors: Record<string, string[]> = {};
    const values = PLATFORMS.map((platform, order) => {
      const raw = (f[platform] ?? "").trim();
      let url: string | null = null;
      if (raw) {
        try {
          const u = new URL(raw);
          if (u.protocol !== "https:" || !HOSTS[platform].test(u.hostname)) throw new Error();
          url = u.toString();
        } catch {
          errors[platform] = [`Enter a full https:// link to your ${platform} profile.`];
        }
      }
      return { platform, url, order, visible: f[`${platform}Visible`] !== "false" };
    });
    if (Object.keys(errors).length) return { ok: false, error: "Check the highlighted links.", fieldErrors: errors };
    const db = requireDb();
    await db.$transaction(values.map((v) => db.socialLink.upsert({ where: { platform: v.platform }, create: v, update: v })));
    await audit("settings.social", { userId: user.id });
    updateTag(TAGS.settings);
    refresh();
    return { ok: true, message: "Social links saved. Links you left empty stay hidden." };
  });
}

export async function saveEmailTemplate(key: string, fd: FormData): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    const data = z
      .object({ subject: z.string().trim().min(3).max(200), body: z.string().trim().min(10).max(5000), enabled: z.enum(["true", "false"]).transform((v) => v === "true") })
      .parse(formObject(fd));
    const t = await requireDb().emailTemplate.update({ where: { key: z.enum(["admin_inquiry", "visitor_ack"]).parse(key) }, data });
    await audit("settings.email_template", { userId: user.id, entity: "EmailTemplate", entityId: t.id, details: { key } });
    refresh();
    return { ok: true, message: "Email template saved." };
  });
}
