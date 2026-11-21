import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHome, getProject, getProjects } from "@/lib/content";
import { categoryLabels } from "@/content/projects";
import { seoMetadata } from "@/lib/seo";
import { ProjectDetail } from "@/components/work/ProjectDetail";

export async function generateStaticParams() {
  // Must return at least one param with Cache Components; unlisted slugs render on request.
  const slugs = (await getProjects()).map((p) => ({ slug: p.slug }));
  // An empty portfolio still needs one param; it resolves to the 404 page.
  return slugs.length ? slugs : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return {};
  return seoMetadata(`/work/${p.slug}`, {
    title: p.seo.title ?? `${p.title} — ${categoryLabels[p.category]}`,
    description: p.seo.description ?? p.summary,
    noindex: p.isDemo,
    ogImageUrl: p.cover.imageUrl,
  });
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const [all, home] = await Promise.all([getProjects(), getHome()]);
  const idx = all.findIndex((p) => p.slug === project.slug);
  const next = all[(idx + 1) % all.length];
  return <ProjectDetail project={project} next={next} finalCta={home.finalCta} />;
}
