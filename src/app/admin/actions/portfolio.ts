"use server";

import { z } from "zod";
import { refresh, updateTag } from "next/cache";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { can } from "@/lib/auth/permissions";
import { formObject, guarded, optionalText, slugify, slugSchema, type ActionResult } from "@/lib/admin/action";

const lines = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, max),
    );

const assetId = z.string().max(40).optional().transform((v) => (v ? v : null));

const projectSchema = z.object({
  title: z.string().trim().min(2, "Add a title.").max(140),
  slug: z.string().trim().optional(),
  categoryId: z.string().min(1, "Choose a category.").max(40),
  client: optionalText(140),
  hideClient: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  projectDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !isNaN(d.getTime()), "Invalid date."),
  summary: z.string().trim().min(10, "Write a short summary (10+ characters).").max(300),
  overview: z.string().trim().min(10, "Write an overview.").max(8000),
  challenge: optionalText(8000),
  approach: optionalText(8000),
  deliverables: lines(30),
  outcome: optionalText(4000),
  outcomeVerified: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  coverId: assetId,
  mobileCoverId: assetId,
  videoId: assetId,
  externalVideoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//.test(v), "Use a YouTube or Vimeo link."),
  focal: z.string().trim().regex(/^\d{1,3}% \d{1,3}%$/, "Use the form '50% 50%'.").default("50% 50%"),
  tags: lines(20),
  featured: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  ogImageId: assetId,
  gallery: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]).filter(Boolean).slice(0, 60)),
  intent: z.enum(["save", "publish", "unpublish"]).default("save"),
});

export async function saveProject(projectId: string | null, fd: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded("portfolio:edit", async (user) => {
    const data = projectSchema.parse(formObject(fd));
    if (data.intent !== "save" && !can(user.role, "portfolio:publish")) {
      return { ok: false, error: "Your role can save drafts but not publish." };
    }
    const slugParse = slugSchema.safeParse(data.slug || slugify(data.title));
    if (!slugParse.success) return { ok: false, error: "Check the URL slug.", fieldErrors: { slug: slugParse.error.issues.map((i) => i.message) } };
    const slug = slugParse.data;

    const db = requireDb();
    // Only reference media that exists (ids come from the browser).
    const ids = [data.coverId, data.mobileCoverId, data.videoId, data.ogImageId, ...data.gallery].filter(Boolean) as string[];
    if (ids.length) {
      const found = await db.mediaAsset.count({ where: { id: { in: [...new Set(ids)] } } });
      if (found !== new Set(ids).size) return { ok: false, error: "One of the selected media files no longer exists. Choose it again." };
    }

    const existing = projectId ? await db.project.findUniqueOrThrow({ where: { id: projectId }, select: { status: true, publishedAt: true } }) : null;
    const status = data.intent === "publish" ? "PUBLISHED" : data.intent === "unpublish" ? "DRAFT" : (existing?.status ?? "DRAFT");

    const fields = {
      title: data.title,
      slug,
      categoryId: data.categoryId,
      client: data.client ?? null,
      hideClient: data.hideClient,
      projectDate: data.projectDate,
      summary: data.summary,
      overview: data.overview,
      challenge: data.challenge ?? null,
      approach: data.approach ?? null,
      deliverables: data.deliverables,
      outcome: data.outcome ?? null,
      outcomeVerified: data.outcome ? data.outcomeVerified : false,
      coverId: data.coverId,
      mobileCoverId: data.mobileCoverId,
      videoId: data.videoId,
      externalVideoUrl: data.externalVideoUrl,
      focal: data.focal,
      tags: data.tags,
      featured: data.featured,
      order: data.order,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageId: data.ogImageId,
      status,
      publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
      // Editing a sample project turns it into a real one.
      isDemo: false,
    } as const;

    const saved = await db.$transaction(async (tx) => {
      const p = projectId ? await tx.project.update({ where: { id: projectId }, data: fields }) : await tx.project.create({ data: fields });
      await tx.projectMedia.deleteMany({ where: { projectId: p.id } });
      if (data.gallery.length) {
        await tx.projectMedia.createMany({ data: data.gallery.map((assetId, order) => ({ projectId: p.id, assetId, order })) });
      }
      return p;
    });

    await audit(projectId ? `project.${data.intent === "save" ? "updated" : data.intent + "ed"}` : "project.created", {
      userId: user.id,
      entity: "Project",
      entityId: saved.id,
      details: { title: saved.title, status },
    });
    updateTag(TAGS.projects);
    refresh();
    const msg = data.intent === "publish" ? "Published — it's live on the website." : data.intent === "unpublish" ? "Unpublished — it's now a draft." : status === "PUBLISHED" ? "Saved and live." : "Draft saved.";
    return { ok: true, message: msg, data: { id: saved.id } };
  });
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  return guarded("portfolio:publish", async (user) => {
    // Gallery links cascade; media files stay in the library.
    const p = await requireDb().project.delete({ where: { id: z.string().max(40).parse(projectId) } });
    await audit("project.deleted", { userId: user.id, entity: "Project", entityId: p.id, details: { title: p.title } });
    updateTag(TAGS.projects);
    return { ok: true, message: `“${p.title}” deleted. Its media files are still in the library.` };
  });
}

export async function moveProject(projectId: string, dir: "up" | "down"): Promise<ActionResult> {
  return guarded("portfolio:edit", async (user) => {
    const db = requireDb();
    const all = await db.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }], select: { id: true } });
    const i = all.findIndex((p) => p.id === projectId);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j], all[i]];
    await db.$transaction(all.map((p, order) => db.project.update({ where: { id: p.id }, data: { order } })));
    await audit("project.reordered", { userId: user.id, entity: "Project", entityId: projectId });
    updateTag(TAGS.projects);
    refresh();
    return { ok: true };
  });
}

export async function toggleFeatured(projectId: string, featured: boolean): Promise<ActionResult> {
  return guarded("portfolio:edit", async (user) => {
    await requireDb().project.update({ where: { id: projectId }, data: { featured } });
    await audit("project.featured", { userId: user.id, entity: "Project", entityId: projectId, details: { featured } });
    updateTag(TAGS.projects);
    refresh();
    return { ok: true, message: featured ? "Shown on the homepage." : "Removed from the homepage." };
  });
}
