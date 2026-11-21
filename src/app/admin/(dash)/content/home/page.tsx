import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { SECTION_LABELS } from "@/lib/admin/sections";
import { Badge, Card, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";
import { PublishAll, RestoreRevision, SectionRowControls } from "./HomeClient";

export const metadata: Metadata = { title: "Homepage content" };

export default async function HomeContentPage() {
  const user = await requirePage("content:view");
  const db = requireDb();
  const page = await db.page.findUnique({
    where: { slug: "home" },
    include: {
      sections: { orderBy: { order: "asc" } },
      revisions: { orderBy: { createdAt: "desc" }, take: 15, include: { createdBy: { select: { name: true } } } },
    },
  });
  if (!page) {
    return <Card title="Homepage not set up">Run <code>npm run db:seed</code> (it also runs automatically on each Vercel deploy).</Card>;
  }
  const drafts = page.sections.filter((s) => s.draftData !== null).length;
  const canPublish = can(user.role, "content:publish");

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Edit each section, save drafts, preview, then publish. Showing, hiding and reordering sections applies immediately."
        actions={
          <>
            <a href="/admin/preview/home" target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-lg border border-line bg-bg-2 px-4 text-sm font-semibold hover:border-fg-2/50">
              Preview with drafts ↗
            </a>
            {canPublish && <PublishAll count={drafts} />}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line lg:col-span-2" aria-label="Homepage sections">
          {page.sections.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 bg-card p-4">
              <span className="font-display text-sm font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/content/home/${s.key}`} className="font-semibold hover:text-accent">
                  {SECTION_LABELS[s.key] ?? s.key}
                </Link>
                <p className="mt-1 flex flex-wrap gap-2 text-xs">
                  {s.visible ? <Badge tone="accent">Visible</Badge> : <Badge tone="muted">Hidden</Badge>}
                  {s.draftData !== null && <Badge tone="warn">Unpublished draft</Badge>}
                  <span className="text-muted">Updated {dateFmt.format(s.updatedAt)}</span>
                </p>
              </div>
              {canPublish && <SectionRowControls sectionKey={s.key} visible={s.visible} first={i === 0} last={i === page.sections.length - 1} />}
              <Link href={`/admin/content/home/${s.key}`} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:border-accent">
                Edit
              </Link>
            </li>
          ))}
        </ol>
        <Card title="Version history" description="A snapshot is saved every time something is published.">
          {page.revisions.length === 0 ? (
            <p className="text-sm text-muted">No published versions yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {page.revisions.map((r) => (
                <li key={r.id} className="rounded-lg bg-bg-2 p-3">
                  <p className="font-medium">{r.note ?? "Published"}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {dateFmt.format(r.createdAt)} · {r.createdBy?.name ?? "Former user"}
                  </p>
                  {canPublish && <RestoreRevision id={r.id} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
