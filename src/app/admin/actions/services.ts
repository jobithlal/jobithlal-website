"use server";

import { z } from "zod";
import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { serviceSchema } from "@/content/schema";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";
import { fieldErrorsFrom, unflatten } from "@/lib/admin/sections";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const rows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const asset = z.string().max(40).optional().transform((v) => (v ? v : null));

export async function saveService(slug: string, fd: FormData): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const db = requireDb();
    const current = await db.service.findUniqueOrThrow({ where: { slug } });
    const u = unflatten(formObject(fd)) as Record<string, unknown>;

    const page = {
      eyebrow: str(u.eyebrow),
      headline: str(u.headline),
      accent: str(u.accent),
      subheading: str(u.subheading),
      intro: str(u.intro),
      features: rows(u.features).map((r) => ({ title: str(r.title), text: str(r.text) })).filter((r) => r.title),
      process: rows(u.process).map((r) => ({ title: str(r.title), text: str(r.text) })).filter((r) => r.title),
      faqs: rows(u.faqs).map((r) => ({ q: str(r.q), a: str(r.a) })).filter((r) => r.q),
    };
    const candidate = {
      slug,
      enabled: u.enabled === "true",
      order: Number(u.order) || 0,
      title: str(u.title),
      shortTitle: str(u.shortTitle),
      subtitle: str(u.subtitle),
      description: str(u.description),
      icon: str(u.icon),
      media: { alt: "", focal: str(u.focal) || "50% 50%" },
      page,
      seo: { title: str(u.seoTitle), description: str(u.seoDescription) },
      cta: { label: str(u.ctaLabel), href: str(u.ctaHref) },
    };
    const parsed = serviceSchema.safeParse(candidate);
    if (!parsed.success) {
      const fe = fieldErrorsFrom(parsed.error);
      // Map nested paths back to the form's field names.
      const map: Record<string, string> = { "seo.title": "seoTitle", "seo.description": "seoDescription", "cta.label": "ctaLabel", "cta.href": "ctaHref" };
      for (const [k, v] of Object.entries(fe)) if (map[k]) fe[map[k]] = v;
      for (const [k, v] of Object.entries(fe)) if (k.startsWith("page.")) fe[k.slice(5)] = v;
      return { ok: false, error: "Some fields need attention.", fieldErrors: fe };
    }
    const imageId = asset.parse(u.image);
    const videoId = asset.parse(u.video);
    const ogImageId = asset.parse(u.ogImage);
    const ids = [imageId, videoId, ogImageId].filter(Boolean) as string[];
    if (ids.length && (await db.mediaAsset.count({ where: { id: { in: ids } } })) !== new Set(ids).size) {
      return { ok: false, error: "A selected media file no longer exists. Choose it again." };
    }
    // At least one service must stay enabled so the site keeps its core offer.
    if (!candidate.enabled && current.enabled && (await db.service.count({ where: { enabled: true } })) <= 1) {
      return { ok: false, error: "At least one service must stay enabled." };
    }

    const s = parsed.data;
    await db.service.update({
      where: { slug },
      data: {
        enabled: s.enabled,
        order: s.order,
        title: s.title,
        shortTitle: s.shortTitle,
        subtitle: s.subtitle,
        description: s.description,
        icon: s.icon,
        focal: s.media.focal,
        imageId,
        videoId,
        ogImageId,
        page: s.page as Prisma.InputJsonValue,
        seoTitle: s.seo.title,
        seoDescription: s.seo.description,
        ctaLabel: s.cta.label,
        ctaHref: s.cta.href,
      },
    });
    await audit("service.updated", { userId: user.id, entity: "Service", entityId: current.id, details: { slug } });
    updateTag(TAGS.services);
    refresh();
    return { ok: true, message: `${s.title} saved and live.` };
  });
}
