import type { Metadata } from "next";
import { getHome, getProjects } from "@/lib/content";
import { breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/PageHero";
import { WorkGrid } from "@/components/work/WorkGrid";
import { FinalCta } from "@/components/sections/FinalCta";

export const metadata: Metadata = pageMetadata({
  title: "Work — Reels, Motion Graphics & Websites",
  description:
    "Selected projects by JOBITHLAL across social media reels, motion graphics and website development, from a creative digital studio in Doha, Qatar.",
  path: "/work",
});

export default async function WorkPage() {
  const [projects, home] = await Promise.all([getProjects(), getHome()]);
  const onlyDemo = projects.length > 0 && projects.every((p) => p.isDemo);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }])} />
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Work" }]}
        eyebrow={home.work.eyebrow}
        lines={["See what's"]}
        accent="possible."
        lead={home.work.description}
      />
      <section aria-label="Projects" className="pb-[var(--section-y)]">
        <div className="container-x">
          {projects.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-fg-2">
              New projects are being added. Get in touch to see recent work.
            </p>
          ) : (
            <>
              <WorkGrid projects={projects} />
              {onlyDemo && (
                <p className="mt-6 text-xs text-muted">
                  Cards marked “Sample layout” are placeholders — published projects are on the way.
                </p>
              )}
            </>
          )}
        </div>
      </section>
      <FinalCta content={home.finalCta} />
      <div className="h-[var(--section-y)]" />
    </>
  );
}
