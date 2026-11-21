import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { Badge, BtnLink, EmptyState, PageHeader } from "@/components/admin/kit";
import { dayFmt } from "@/lib/admin/format";
import { ProjectRowControls } from "./PortfolioClient";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const user = await requirePage("portfolio:view");
  const sp = await searchParams;
  const status = sp.status === "PUBLISHED" || sp.status === "DRAFT" ? sp.status : undefined;
  const category = typeof sp.category === "string" ? sp.category : "";
  const db = requireDb();
  const [projects, categories] = await Promise.all([
    db.project.findMany({
      where: { ...(status ? { status } : {}), ...(category ? { category: { slug: category } } : {}) },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { category: true, cover: { select: { url: true, posterUrl: true, type: true } } },
    }),
    db.projectCategory.findMany({ orderBy: { order: "asc" } }),
  ]);
  const realPublished = projects.some((p) => !p.isDemo && p.status === "PUBLISHED");
  const canEdit = can(user.role, "portfolio:edit");

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Projects shown on /work and the homepage. Drafts stay private until published."
        actions={
          canEdit && (
            <BtnLink href="/admin/portfolio/new" variant="primary">
              <Plus className="size-4" aria-hidden /> Add project
            </BtnLink>
          )
        }
      />
      {projects.some((p) => p.isDemo) && (
        <p className="mb-4 rounded-lg border border-dashed border-accent/40 p-3 text-sm text-fg-2">
          Items marked <Badge tone="warn">Sample</Badge> are placeholder layouts.{" "}
          {realPublished ? "They're hidden on the website now that a real project is published — you can delete them." : "They disappear from the website automatically as soon as you publish your first real project."}
        </p>
      )}
      <form className="mb-4 flex flex-wrap gap-2" aria-label="Filter projects">
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-10 rounded-lg border border-line bg-bg-2 px-3 text-sm">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Drafts</option>
        </select>
        <select name="category" defaultValue={category} aria-label="Category" className="h-10 rounded-lg border border-line bg-bg-2 px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-ink">Filter</button>
      </form>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet">Add your first project — it stays a draft until you publish it.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {projects.map((p, i) => {
            const thumb = p.cover ? (p.cover.type === "IMAGE" ? p.cover.url : p.cover.posterUrl) : null;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 bg-card p-3 sm:flex-nowrap">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-bg-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/portfolio/${p.id}`} className="font-semibold hover:text-accent">
                    {p.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone={p.status === "PUBLISHED" ? "accent" : "muted"}>{p.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                    {p.isDemo && <Badge tone="warn">Sample</Badge>}
                    {p.featured && <Badge>Featured</Badge>}
                    <span>{p.category.label}</span>
                    <span>· updated {dayFmt.format(p.updatedAt)}</span>
                  </p>
                </div>
                {canEdit && <ProjectRowControls id={p.id} featured={p.featured} first={i === 0} last={i === projects.length - 1} reorderable={!status && !category} />}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
