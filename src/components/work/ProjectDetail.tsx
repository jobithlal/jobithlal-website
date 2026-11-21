import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryLabels } from "@/content/projects";
import type { HomeContent, Project } from "@/content/schema";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";
import { PageHero } from "@/components/ui/PageHero";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MediaFrame } from "@/components/media/MediaFrame";
import { DemoBadge } from "@/components/work/ProjectCard";
import { FinalCta } from "@/components/sections/FinalCta";
import type { ArtVariant } from "@/components/media/Artwork";

const art: Record<string, ArtVariant> = { reels: "reels", motion: "motion", websites: "websites" };

/** Turns YouTube/Vimeo page URLs into privacy-friendly embed URLs. */
function embedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com") && !u.hostname.startsWith("player.")) return `https://player.vimeo.com/video${u.pathname}?dnt=1`;
    return url;
  } catch {
    return null;
  }
}

/** Case-study layout shared by the public project page and the admin draft preview. */
export function ProjectDetail({ project, next, finalCta }: { project: Project; next?: Project; finalCta: HomeContent["finalCta"] }) {
  const client = project.client && !project.hideClient ? project.client : null;
  const embed = project.externalVideoUrl ? embedUrl(project.externalVideoUrl) : null;

  const facts = [
    { k: "Category", v: categoryLabels[project.category] },
    client ? { k: "Client", v: client } : null,
    project.year ? { k: "Year", v: String(project.year) } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  const blocks = [
    { title: "Overview", text: project.overview },
    project.challenge ? { title: "The challenge", text: project.challenge } : null,
    project.approach ? { title: "Creative approach", text: project.approach } : null,
    project.outcome && project.outcomeVerified ? { title: "Outcome", text: project.outcome } : null,
  ].filter(Boolean) as { title: string; text: string }[];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: project.title, path: `/work/${project.slug}` },
        ])}
      />
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Work", href: "/work" }, { name: project.title }]}
        eyebrow={categoryLabels[project.category]}
        lines={[project.title]}
        lead={project.summary}
      />

      <section aria-label="Project media" className="container-x">
        {project.isDemo && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-accent/40 p-4 text-sm text-fg-2">
            <DemoBadge />
            This is a placeholder showing the case-study layout. It is not a real client project.
          </div>
        )}
        <Reveal y={40}>
          <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
            {embed ? (
              <iframe
                src={embed}
                title={`${project.title} video`}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <MediaFrame media={project.cover} art={art[project.category]} priority />
            )}
          </div>
        </Reveal>
      </section>

      <section className="section-y">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card/50 px-6">
              {facts.map((f) => (
                <div key={f.k} className="flex justify-between gap-6 py-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted">{f.k}</dt>
                  <dd className="text-right font-semibold">{f.v}</dd>
                </div>
              ))}
              {project.deliverables.length > 0 && (
                <div className="py-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted">Deliverables</dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {project.deliverables.map((d) => (
                      <span key={d} className="rounded-full border border-line px-3 py-1 text-sm text-fg-2">
                        {d}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
          <div className="space-y-12 lg:col-span-7 lg:col-start-6">
            {blocks.map((b) => (
              <Reveal key={b.title}>
                <Eyebrow>{b.title}</Eyebrow>
                <p className="mt-5 text-lg leading-relaxed text-fg-2">{b.text}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {project.gallery.length > 0 && (
          <ul className="container-x mt-16 grid gap-5 sm:grid-cols-2">
            {project.gallery.map((m, i) => (
              <Reveal as="li" key={i} className={i % 3 === 0 ? "sm:col-span-2" : undefined}>
                <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line">
                  <MediaFrame media={m} art={art[project.category]} sizes="(min-width:640px) 50vw, 100vw" />
                </div>
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {next && next.slug !== project.slug && (
        <section aria-label="Next project" className="container-x pb-[var(--section-y)]">
          <Link
            href={`/work/${next.slug}`}
            className="group flex flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-line p-8 transition-colors hover:border-accent sm:flex-row sm:items-center sm:p-12"
          >
            <div>
              <p className="eyebrow">Next project</p>
              <p className="display-md mt-4 transition-transform duration-500 group-hover:translate-x-2">{next.title}</p>
            </div>
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-ink transition-transform duration-500 group-hover:-rotate-45">
              <ArrowRight className="size-6" aria-hidden />
            </span>
          </Link>
        </section>
      )}

      <FinalCta content={finalCta} />
      <div className="h-[var(--section-y)]" />
    </>
  );
}
