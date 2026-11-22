"use server";

import { z } from "zod";
import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { serviceSchema } from "@/content/schema";
import { formObject, guarded, slugify, type ActionResult } from "@/lib/admin/action";
import { categoryForService, SERVICE_ICON_VALUES } from "@/content/service-map";

/** Marks text that still needs writing; a service can't be switched on while any field contains it. */
const TODO = "[Write this before publishing]";

function starterService(title: string) {
  return {
    subtitle: TODO,
    description: TODO,
    page: { eyebrow: title, headline: title, accent: "", subheading: TODO, intro: TODO, features: [], process: [], faqs: [] },
    seoTitle: title.slice(0, 70),
    seoDescription: TODO,
    ctaLabel: "Start a project",
  };
}
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

    if (candidate.enabled && JSON.stringify(candidate).includes(TODO)) {
      return { ok: false, error: `Replace every “${TODO}” placeholder before switching this service on.` };
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
    // The portfolio category of a service created in the admin follows its short title.
    if (categoryForService(slug) === slug) {
      await db.projectCategory.updateMany({ where: { slug }, data: { label: s.shortTitle } });
    }
    await audit("service.updated", { userId: user.id, entity: "Service", entityId: current.id, details: { slug } });
    updateTag(TAGS.services);
    updateTag(TAGS.projects);
    refresh();
    return { ok: true, message: s.enabled ? `${s.title} saved and live.` : `${s.title} saved. It’s switched off, so it isn’t on the website yet.` };
  });
}

const createSchema = z.object({
  title: z.string().trim().min(2, "Enter a name for the service.").max(80),
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.")
    .or(z.literal("")),
  icon: z.enum(SERVICE_ICON_VALUES),
});

/** Creates a new service (switched off until its content is written) and its portfolio category. */
export async function createService(fd: FormData): Promise<ActionResult<{ slug: string }>> {
  return guarded("content:publish", async (user) => {
    const parsed = createSchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, error: "Some fields need attention.", fieldErrors: fieldErrorsFrom(parsed.error) };
    const { title, icon } = parsed.data;
    const slug = parsed.data.slug || slugify(title);
    if (!slug || slug.length < 2) return { ok: false, error: "Choose a web address.", fieldErrors: { slug: ["Required."] } };
    const db = requireDb();
    const taken =
      (await db.service.findUnique({ where: { slug } })) ||
      (await db.projectCategory.findUnique({ where: { slug: categoryForService(slug) } }));
    if (taken) return { ok: false, error: `“${slug}” is already used. Pick another web address.`, fieldErrors: { slug: ["Already in use."] } };

    const last = await db.service.aggregate({ _max: { order: true } });
    const catLast = await db.projectCategory.aggregate({ _max: { order: true } });
    const st = starterService(title);
    const created = await db.$transaction(async (tx) => {
      await tx.projectCategory.create({ data: { slug, label: title, order: (catLast._max.order ?? 0) + 1 } });
      return tx.service.create({
        data: {
          slug,
          enabled: false,
          order: (last._max.order ?? 0) + 1,
          title,
          shortTitle: title,
          subtitle: st.subtitle,
          description: st.description,
          icon,
          page: st.page as Prisma.InputJsonValue,
          seoTitle: st.seoTitle,
          seoDescription: st.seoDescription,
          ctaLabel: st.ctaLabel,
          ctaHref: `/contact?service=${slug}`,
        },
      });
    });
    await audit("service.created", { userId: user.id, entity: "Service", entityId: created.id, details: { slug, title } });
    updateTag(TAGS.services);
    updateTag(TAGS.projects);
    return { ok: true, message: `${title} created. Fill in the content, then switch it on.`, data: { slug } };
  });
}

/** Deletes a service. Refused while portfolio projects still use its category. */
export async function deleteService(slug: string): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const db = requireDb();
    const svc = await db.service.findUnique({ where: { slug } });
    if (!svc) return { ok: false, error: "That service no longer exists." };
    if (svc.enabled && (await db.service.count({ where: { enabled: true } })) <= 1) {
      return { ok: false, error: "At least one service must stay on the website." };
    }
    const category = await db.projectCategory.findUnique({ where: { slug: categoryForService(slug) } });
    // Real projects block the delete; sample-layout projects are removed along with the category.
    const real = category ? await db.project.count({ where: { categoryId: category.id, isDemo: false } }) : 0;
    if (real > 0) {
      return {
        ok: false,
        error: `${real} portfolio project${real === 1 ? " uses" : "s use"} this service’s category. Move ${real === 1 ? "it" : "them"} to another category or delete ${real === 1 ? "it" : "them"} in Portfolio first.`,
      };
    }
    await db.$transaction(async (tx) => {
      await tx.service.delete({ where: { slug } });
      if (category) {
        await tx.project.deleteMany({ where: { categoryId: category.id, isDemo: true } });
        await tx.projectCategory.delete({ where: { id: category.id } });
      }
    });
    await audit("service.deleted", { userId: user.id, entity: "Service", entityId: svc.id, details: { slug, title: svc.title } });
    updateTag(TAGS.services);
    updateTag(TAGS.projects);
    refresh();
    return { ok: true, message: `${svc.title} deleted.` };
  });
}
