import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getBlogSettings } from "@/lib/blog";
import { dayFmt } from "@/lib/admin/format";
import { Badge, BtnLink, Card, EmptyState, PageHeader } from "@/components/admin/kit";
import { BlogSettingsForm, CategoryManager, DeleteArticleButton } from "./BlogClient";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/blog">) {
  const user = await requirePage("content:view");
  const sp = await searchParams;
  const status = sp.status === "PUBLISHED" || sp.status === "DRAFT" ? sp.status : undefined;
  const db = requireDb();
  const [posts, categories, settings, counts] = await Promise.all([
    db.blogPost.findMany({
      where: status ? { status } : {},
      orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      include: { category: { select: { name: true } }, cover: { select: { url: true } } },
    }),
    db.blogCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], include: { _count: { select: { posts: true } } } }),
    getBlogSettings(),
    db.blogPost.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const canEdit = can(user.role, "content:edit");
  const canPublish = can(user.role, "content:publish");
  const tab = (label: string, value?: string) => (
    <Link
      href={value ? `/admin/blog?status=${value}` : "/admin/blog"}
      aria-current={status === value ? "page" : undefined}
      className={status === value ? "rounded-full bg-accent px-4 py-1.5 font-semibold text-ink" : "rounded-full px-4 py-1.5 text-fg-2 hover:text-fg"}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Blog"
        description="Articles shown at /blog. Drafts stay private and out of the sitemap until published."
        actions={
          canEdit && (
            <BtnLink href="/admin/blog/new" variant="primary">
              <Plus className="size-4" aria-hidden /> New article
            </BtnLink>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <nav aria-label="Filter articles" className="mb-4 flex flex-wrap gap-1 text-sm">
            {tab(`All (${n("PUBLISHED") + n("DRAFT")})`)}
            {tab(`Published (${n("PUBLISHED")})`, "PUBLISHED")}
            {tab(`Drafts (${n("DRAFT")})`, "DRAFT")}
          </nav>
          {posts.length === 0 ? (
            <EmptyState title="No articles here yet">{canEdit ? "Use “New article” to write one." : "Articles will appear here."}</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {posts.map((p) => {
                const cover = p.cover?.url ?? p.coverUrl;
                return (
                  <li key={p.id} className="flex items-center gap-4 py-3">
                    <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-bg-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                      {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/blog/${p.id}`} className="line-clamp-1 font-semibold hover:text-accent">
                        {p.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {p.category?.name ?? "Uncategorised"} · {p.publishedAt ? dayFmt.format(p.publishedAt) : "Not published"} · {p.readingMinutes} min read
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {p.featured && <Badge tone="accent">Featured</Badge>}
                      {p.status === "PUBLISHED" ? <Badge tone="accent">Published</Badge> : <Badge tone="muted">Draft</Badge>}
                      {p.status === "PUBLISHED" && (
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="hidden text-sm text-fg-2 hover:text-accent sm:inline">
                          View ↗
                        </a>
                      )}
                      {canPublish && <DeleteArticleButton id={p.id} title={p.title} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <BlogSettingsForm v={settings} canEdit={canPublish} />
          <CategoryManager categories={categories.map((c) => ({ id: c.id, name: c.name, count: c._count.posts }))} canEdit={canPublish} />
        </div>
      </div>
    </>
  );
}
