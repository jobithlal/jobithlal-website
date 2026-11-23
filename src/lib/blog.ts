import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/content";
import { blogSettingsSchema, type BlogSettings } from "@/content/schema";

export type BlogCategoryView = { slug: string; name: string };
export type BlogPostView = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategoryView | null;
  cover: { url: string; alt: string } | null;
  author: string;
  featured: boolean;
  publishedAt: string; // ISO
  updatedAt: string; // ISO
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

const include = { category: true, cover: true } as const;
type Row = Awaited<ReturnType<NonNullable<typeof db>["blogPost"]["findFirstOrThrow"]>> & {
  category: { slug: string; name: string } | null;
  cover: { url: string; alt: string } | null;
};

export function toBlogView(p: Row): BlogPostView {
  const coverUrl = p.cover?.url ?? p.coverUrl ?? null;
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
    cover: coverUrl ? { url: coverUrl, alt: p.coverAlt || p.cover?.alt || p.title } : null,
    author: p.authorName,
    featured: p.featured,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    readingMinutes: p.readingMinutes,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

/** Published posts, newest first. Drafts are never returned. */
export async function getBlogPosts(): Promise<BlogPostView[]> {
  "use cache";
  cacheTag(TAGS.blog);
  cacheLife("max");
  if (!db) return [];
  const rows = await db.blogPost
    .findMany({ where: { status: "PUBLISHED" }, include, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] })
    .catch(() => []);
  return rows.map((r) => toBlogView(r as Row));
}

export async function getBlogPost(slug: string) {
  return (await getBlogPosts()).find((p) => p.slug === slug) ?? null;
}

/** Categories that have at least one published post, in admin order. */
export async function getBlogCategories(): Promise<BlogCategoryView[]> {
  "use cache";
  cacheTag(TAGS.blog);
  cacheLife("max");
  if (!db) return [];
  const rows = await db.blogCategory
    .findMany({ where: { posts: { some: { status: "PUBLISHED" } } }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { slug: true, name: true } })
    .catch(() => []);
  return rows;
}

export async function getBlogSettings(): Promise<BlogSettings> {
  "use cache";
  cacheTag(TAGS.blog);
  cacheLife("max");
  const fallback = blogSettingsSchema.parse({});
  if (!db) return fallback;
  const row = await db.blogSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  const parsed = blogSettingsSchema.safeParse(row?.data ?? {});
  return parsed.success ? parsed.data : fallback;
}

/** Related posts: same category first, then the most recent others. */
export function relatedPosts(all: BlogPostView[], post: BlogPostView, n = 3) {
  const others = all.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category?.slug && p.category.slug === post.category?.slug);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, n);
}
