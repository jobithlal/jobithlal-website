"use server";

import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { analyticsSettingsSchema } from "@/content/schema";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";
import { fieldErrorsFrom } from "@/lib/admin/sections";

export async function saveAnalyticsSettings(fd: FormData): Promise<ActionResult> {
  return guarded("settings:edit", async (user) => {
    const f = formObject(fd) as Record<string, string>;
    const id = (f.ga4MeasurementId ?? "").trim().toUpperCase();
    const parsed = analyticsSettingsSchema.safeParse({
      enabled: f.enabled === "true",
      ga4MeasurementId: id || null,
      requireConsent: f.requireConsent === "true",
    });
    if (!parsed.success) return { ok: false, error: "Check the Measurement ID.", fieldErrors: fieldErrorsFrom(parsed.error) };
    if (parsed.data.enabled && !parsed.data.ga4MeasurementId) {
      return { ok: false, error: "Add your GA4 Measurement ID before turning analytics on.", fieldErrors: { ga4MeasurementId: ["Required to enable analytics."] } };
    }
    await requireDb().analyticsSettings.upsert({
      where: { id: "default" },
      create: { id: "default", data: parsed.data as Prisma.InputJsonValue },
      update: { data: parsed.data as Prisma.InputJsonValue },
    });
    await audit("settings.analytics", { userId: user.id, details: parsed.data });
    // Analytics changes the site chrome (banner, footer link) and the privacy policy on every page.
    for (const t of Object.values(TAGS)) updateTag(t);
    refresh();
    return {
      ok: true,
      message: parsed.data.enabled
        ? parsed.data.requireConsent
          ? "Analytics is on. Visitors see a consent banner; tracking starts only after they accept."
          : "Analytics is on for all visitors."
        : "Analytics is off. No tracking code is loaded on the site.",
    };
  });
}
