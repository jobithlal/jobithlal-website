"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { can } from "@/lib/auth/permissions";
import { blogSettingsSchema } from "@/content/schema";
import { readingMinutes } from "@/lib/markdown-types";
import { formObject, guarded, slugify, type ActionResult } from "@/lib/admin/action";
import { fieldErrorsFrom } from "@/lib/admin/sections";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const postSchema = z.object({
  title: z.string().trim().min(3, "Add a title.").max(160),
  slug: z.string().trim().max(100).regex(slugRe, "Lowercase letters, numbers and hyphens only.").or(z.literal("")),
  categoryId: opt(40),
  excerpt: z.string().trim().min(20, "Write a short summary (at least 20 characters).").max(320),
  content: z.string().trim().min(50, "The article needs some content.").max(100_000),
  coverId: opt(40),
  coverUrl: opt(300),
  coverAlt: z.string().trim().max(200).default(""),
  featured: z.enum(["true", "false"]).optional(),
  seoTitle: opt(70),
  seoDescription: opt(170),
  publishedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .optional(),
  intent: z.enum(["save", "publish", "unpublish"]).default("save"),
});

function bust() {
  updateTag(TAGS.blog);
  refresh();
}

/** Creates or updates an article. Publishing needs content:publish; editors can save drafts. */
export async function saveBlogPost(id: string | null, fd: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded("content:edit", async (user) => {
    const parsed = postSchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, error: "Some fields need attention.", fieldErrors: fieldErrorsFrom(parsed.error) };
    const d = parsed.data;
    const db = requireDb();
    const existing = id ? await db.blogPost.findUnique({ where: { id } }) : null;
    if (id && !existing) return { ok: false, error: "This article no longer exists." };

    const wantsPublished = d.intent === "publish" || (d.intent === "save" && existing?.status === "PUBLISHED");
    if ((d.intent !== "save" || wantsPublished) && !can(user.role, "content:publish")) {
      return { ok: false, error: "Only an admin who can publish may change a published article. Save it as a draft instead." };
    }
    const status = d.intent === "unpublish" ? "DRAFT" : wantsPublished ? "PUBLISHED" : "DRAFT";

    const slug = d.slug || slugify(d.title).slice(0, 100);
    if (!slugRe.test(slug)) return { ok: false, error: "Choose a web address.", fieldErrors: { slug: ["Required."] } };
    const clash = await db.blogPost.findUnique({ where: { slug } });
    if (clash && clash.id !== id) return { ok: false, error: `Another article already uses “${slug}”.`, fieldErrors: { slug: ["Already in use."] } };

    if (d.categoryId && !(await db.blogCategory.findUnique({ where: { id: d.categoryId } }))) {
      return { ok: false, error: "That category no longer exists.", fieldErrors: { categoryId: ["Choose another category."] } };
    }
    if (d.coverId && !(await db.mediaAsset.findFirst({ where: { id: d.coverId, type: "IMAGE" } }))) {
      return { ok: false, error: "The cover must be an image from the media library.", fieldErrors: { cover: ["Choose an image."] } };
    }
    if (status === "PUBLISHED" && !d.coverId && !d.coverUrl) {
      return { ok: false, error: "Add a cover image before publishing.", fieldErrors: { cover: ["Required to publish."] } };
    }
    if (status === "PUBLISHED" && (d.coverId || d.coverUrl) && !d.coverAlt) {
      return { ok: false, error: "Describe the cover image (alt text) before publishing.", fieldErrors: { coverAlt: ["Required to publish."] } };
    }

    // Keep the original publish date; set one the first time an article goes live.
    const publishedAt = d.publishedAt
      ? new Date(`${d.publishedAt}T09:00:00+03:00`)
      : status === "PUBLISHED"
        ? (existing?.publishedAt ?? new Date())
        : (existing?.publishedAt ?? null);

    const data = {
      slug,
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      categoryId: d.categoryId,
      coverId: d.coverId,
      // A bundled cover is kept only while no library image is chosen.
      coverUrl: d.coverId ? null : d.coverUrl,
      coverAlt: d.coverAlt,
      featured: d.featured === "true",
      seoTitle: d.seoTitle,
      seoDescription: d.seoDescription,
      status,
      publishedAt,
      readingMinutes: readingMinutes(d.content),
    } satisfies Prisma.BlogPostUncheckedUpdateInput;

    const post = id ? await db.blogPost.update({ where: { id }, data }) : await db.blogPost.create({ data });
    await audit(id ? "blog.updated" : "blog.created", { userId: user.id, entity: "BlogPost", entityId: post.id, details: { slug, status } });
    bust();
    const message =
      d.intent === "publish" ? "Published — it’s live on the blog." : d.intent === "unpublish" ? "Unpublished — it’s now a hidden draft." : status === "PUBLISHED" ? "Saved and live." : "Draft saved.";
    return { ok: true, message, data: { id: post.id } };
  });
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const db = requireDb();
    const post = await db.blogPost.findUnique({ where: { id } });
    if (!post) return { ok: false, error: "That article no longer exists." };
    await db.blogPost.delete({ where: { id } });
    await audit("blog.deleted", { userId: user.id, entity: "BlogPost", entityId: id, details: { slug: post.slug, title: post.title } });
    bust();
    return { ok: true, message: `“${post.title}” deleted.` };
  });
}

export async function saveBlogSettings(fd: FormData): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const f = formObject(fd) as Record<string, string>;
    const db = requireDb();
    const current = await db.blogSettings.findUnique({ where: { id: "default" } });
    const parsed = blogSettingsSchema.safeParse({
      ...((current?.data as object) ?? {}),
      showInHeader: f.showInHeader === "true",
      heroEyebrow: f.heroEyebrow,
      heroTitle: f.heroTitle,
      heroIntro: f.heroIntro,
      perPage: Number(f.perPage),
    });
    if (!parsed.success) return { ok: false, error: "Some fields need attention.", fieldErrors: fieldErrorsFrom(parsed.error) };
    await db.blogSettings.upsert({
      where: { id: "default" },
      create: { id: "default", data: parsed.data as Prisma.InputJsonValue },
      update: { data: parsed.data as Prisma.InputJsonValue },
    });
    await audit("blog.settings", { userId: user.id, details: { showInHeader: parsed.data.showInHeader, perPage: parsed.data.perPage } });
    bust();
    return { ok: true, message: parsed.data.showInHeader ? "Saved. Blog now appears in the header menu." : "Saved. Blog is linked from the footer only." };
  });
}

const categorySchema = z.object({ name: z.string().trim().min(2, "Enter a name.").max(40) });

export async function saveBlogCategory(id: string | null, fd: FormData): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const parsed = categorySchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, error: "Enter a category name.", fieldErrors: fieldErrorsFrom(parsed.error) };
    const db = requireDb();
    if (id) {
      await db.blogCategory.update({ where: { id }, data: { name: parsed.data.name } });
    } else {
      const slug = slugify(parsed.data.name).slice(0, 60);
      if (!slug || (await db.blogCategory.findUnique({ where: { slug } }))) {
        return { ok: false, error: "A category with that name already exists.", fieldErrors: { name: ["Already exists."] } };
      }
      const last = await db.blogCategory.aggregate({ _max: { order: true } });
      await db.blogCategory.create({ data: { slug, name: parsed.data.name, order: (last._max.order ?? 0) + 1 } });
    }
    await audit(id ? "blog.category_renamed" : "blog.category_created", { userId: user.id, details: { name: parsed.data.name } });
    bust();
    return { ok: true, message: id ? "Category renamed." : "Category added." };
  });
}

export async function deleteBlogCategory(id: string): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const db = requireDb();
    const cat = await db.blogCategory.findUnique({ where: { id }, include: { _count: { select: { posts: true } } } });
    if (!cat) return { ok: false, error: "That category no longer exists." };
    await db.blogCategory.delete({ where: { id } });
    await audit("blog.category_deleted", { userId: user.id, details: { name: cat.name, posts: cat._count.posts } });
    bust();
    return {
      ok: true,
      message: cat._count.posts ? `“${cat.name}” deleted. ${cat._count.posts} article(s) are now uncategorised.` : `“${cat.name}” deleted.`,
    };
  });
}

/** Renders Markdown exactly as the public article page will, for the editor's Preview tab. */
export async function previewBlogMarkdown(md: string): Promise<ActionResult<{ html: string }>> {
  return guarded("content:view", async () => {
    const { renderMarkdown } = await import("@/lib/markdown");
    return { ok: true, data: { html: renderMarkdown(String(md).slice(0, 100_000)).html } };
  });
}
