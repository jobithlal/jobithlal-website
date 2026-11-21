"use server";

import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { SEO_PAGES, seoSettingsSchema } from "@/content/schema";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";
import { fieldErrorsFrom, unflatten } from "@/lib/admin/sections";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Accepts either the bare token or the full <meta …content="…"> tag Google/Bing give you. */
function verificationToken(v: unknown) {
  const s = str(v);
  const m = s.match(/content=["']([^"']+)["']/i);
  return (m ? m[1] : s) || undefined;
}

export async function saveSeoSettings(fd: FormData): Promise<ActionResult> {
  return guarded("seo:edit", async (user) => {
    const u = unflatten(formObject(fd)) as Record<string, unknown>;
    const pagesIn = (u.pages ?? {}) as Record<string, Record<string, unknown>>;
    const pages: Record<string, unknown> = {};
    SEO_PAGES.forEach((p, i) => {
      const r = pagesIn[String(i)] ?? {};
      const entry = {
        title: str(r.title),
        description: str(r.description),
        ogTitle: str(r.ogTitle),
        ogDescription: str(r.ogDescription),
        ogImageUrl: str(r.ogImageUrl),
        noindex: r.noindex === "true",
      };
      // Only store pages that actually override something.
      if (Object.entries(entry).some(([k, v]) => (k === "noindex" ? v : v !== ""))) pages[p.path] = entry;
    });

    const parsed = seoSettingsSchema.safeParse({
      siteName: str(u.siteName),
      defaultTitle: str(u.defaultTitle),
      defaultDescription: str(u.defaultDescription),
      shareImageUrl: str(u.shareImageUrl),
      canonicalDomain: str(u.canonicalDomain).replace(/\/$/, ""),
      allowIndexing: u.allowIndexing === "true",
      verification: { google: verificationToken(u.google), bing: verificationToken(u.bing) },
      pages,
    });
    if (!parsed.success) {
      // Map "pages./about.title" back to the form's "pages.2.title".
      const fe = fieldErrorsFrom(parsed.error);
      for (const k of Object.keys(fe)) {
        const m = k.match(/^pages\.(\/[^.]*)\.(.+)$/);
        if (m) fe[`pages.${SEO_PAGES.findIndex((p) => p.path === m[1])}.${m[2]}`] = fe[k];
      }
      return { ok: false, error: "Some fields need attention.", fieldErrors: fe };
    }
    if (!/^https:\/\//.test(parsed.data.canonicalDomain)) {
      return { ok: false, error: "The canonical domain must start with https://", fieldErrors: { canonicalDomain: ["Use https://, e.g. https://www.jobithlal.com"] } };
    }
    await requireDb().seoSettings.upsert({
      where: { id: "default" },
      create: { id: "default", data: parsed.data as Prisma.InputJsonValue },
      update: { data: parsed.data as Prisma.InputJsonValue },
    });
    await audit("settings.seo", { userId: user.id, details: { overrides: Object.keys(pages), allowIndexing: parsed.data.allowIndexing } });
    // SEO affects every page's metadata, robots.txt and the sitemap.
    for (const t of Object.values(TAGS)) updateTag(t);
    refresh();
    return { ok: true, message: parsed.data.allowIndexing ? "SEO settings saved and live." : "Saved. Search engines are now asked NOT to index the site." };
  });
}
