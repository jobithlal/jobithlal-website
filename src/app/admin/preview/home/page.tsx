import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePage } from "@/lib/auth/session";
import { requireDb } from "@/lib/db";
import { buildHomeBundle, getFeaturedProjects, getServices, getSiteSettings } from "@/lib/content";
import { HomeSections } from "@/components/sections/HomeSections";
import { SiteChrome } from "@/components/layout/SiteChrome";

export const metadata: Metadata = { title: "Homepage preview", robots: { index: false, follow: false } };

async function Preview() {
  await requirePage("content:view");
  const page = await requireDb().page.findUniqueOrThrow({ where: { slug: "home" }, include: { sections: { orderBy: { order: "asc" } } } });
  const drafts = page.sections.filter((s) => s.draftData !== null).length;
  // Drafts where they exist, published content everywhere else.
  const bundle = buildHomeBundle(page.sections.map((s) => ({ key: s.key, data: s.draftData ?? s.publishedData, visible: s.visible })));
  const [site, services, projects] = await Promise.all([getSiteSettings(), getServices(), getFeaturedProjects()]);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[70] flex items-center justify-between gap-4 bg-accent px-4 py-2 text-sm font-semibold text-ink">
        <span>Preview — {drafts ? `${drafts} unpublished draft${drafts > 1 ? "s" : ""} shown` : "no drafts; this is the live content"}</span>
        <Link href="/admin/content/home" className="underline">
          Back to editor
        </Link>
      </div>
      <SiteChrome>
        <HomeSections site={site} services={services} projects={projects} hero={bundle.hero} ticker={bundle.ticker} home={bundle.home} visible={bundle.visible} order={bundle.order} />
      </SiteChrome>
    </>
  );
}

export default function HomePreviewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading preview…</p>}>
      <Preview />
    </Suspense>
  );
}
