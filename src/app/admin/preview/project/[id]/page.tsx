import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { requireDb } from "@/lib/db";
import { getHome, projectInclude, toProject } from "@/lib/content";
import { ProjectDetail } from "@/components/work/ProjectDetail";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("portfolio:view");
  const { id } = await params;
  const row = await requireDb().project.findUnique({ where: { id }, include: projectInclude });
  if (!row) notFound();
  const home = await getHome();
  return (
    <Providers smoothScroll={false}>
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-accent px-4 py-2 text-sm font-semibold text-ink">
        <span>Preview — {row.status === "PUBLISHED" ? "published version" : "draft, not visible to visitors"}</span>
        <Link href={`/admin/portfolio/${row.id}`} className="underline">
          Back to editor
        </Link>
      </div>
      <main>
        <ProjectDetail project={toProject(row)} finalCta={home.finalCta} />
      </main>
    </Providers>
  );
}

export default function ProjectPreviewPage({ params }: PageProps<"/admin/preview/project/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading preview…</p>}>
      <Preview params={params} />
    </Suspense>
  );
}
