import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { PageHeader } from "@/components/admin/kit";
import { ArticleForm } from "../BlogClient";

export const metadata: Metadata = { title: "Edit article" };

const ymd = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Qatar" }).format(d) : "");

export default async function EditArticlePage({ params }: PageProps<"/admin/blog/[id]">) {
  const user = await requirePage("content:view");
  const { id } = await params;
  const db = requireDb();
  const [post, categories] = await Promise.all([
    db.blogPost.findUnique({ where: { id }, include: { cover: true } }),
    db.blogCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!post) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/blog", label: "Blog" }} title={post.title} description={post.status === "PUBLISHED" ? `Live at /blog/${post.slug}` : "Draft — not visible on the website."} />
      <ArticleForm
        key={post.updatedAt.toISOString()}
        v={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          categoryId: post.categoryId ?? "",
          excerpt: post.excerpt,
          content: post.content,
          cover: post.cover ? { id: post.cover.id, url: post.cover.url, posterUrl: post.cover.posterUrl, type: post.cover.type, alt: post.cover.alt } : null,
          coverUrl: post.coverUrl ?? "",
          coverAlt: post.coverAlt,
          featured: post.featured,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          publishedAt: ymd(post.publishedAt),
          status: post.status,
        }}
        categories={categories}
        canPublish={can(user.role, "content:publish")}
        storageReady={storageConfigured()}
      />
    </>
  );
}
