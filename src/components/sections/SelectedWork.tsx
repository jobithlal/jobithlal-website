import type { HomeContent, Project } from "@/content/schema";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { WorkSlider } from "@/components/work/WorkSlider";

export function SelectedWork({ content, projects }: { content: HomeContent["work"]; projects: Project[] }) {
  const onlyDemo = projects.length > 0 && projects.every((p) => p.isDemo);
  return (
    <section id="work" aria-labelledby="work-heading" className="section-y relative overflow-hidden">
      <div className="container-x mb-12 grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Reveal>
            <Eyebrow>{content.eyebrow}</Eyebrow>
          </Reveal>
          <h2 id="work-heading" className="display-lg mt-6">
            <MaskLines lines={[content.heading]} />
          </h2>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.15}>
            <p className="lead">{content.description}</p>
          </Reveal>
          <Reveal delay={0.25} className="mt-6">
            <ButtonLink href="/work" variant="ghost">
              View all work
            </ButtonLink>
          </Reveal>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="container-x">
          <p className="rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-fg-2">
            New projects are being added. In the meantime, get in touch to see recent work.
          </p>
        </div>
      ) : (
        <>
          <WorkSlider projects={projects} />
          {onlyDemo && (
            <p className="container-x mt-2 text-xs text-muted">
              Cards marked “Sample layout” are placeholders — published projects are on the way.
            </p>
          )}
        </>
      )}
    </section>
  );
}
