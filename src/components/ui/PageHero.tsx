import type { ReactNode } from "react";
import { Breadcrumbs, Eyebrow } from "./Section";
import { MaskLines, Reveal } from "./Reveal";

/** Shared inner-page hero: breadcrumbs, eyebrow, masked headline, lead and optional actions/visual. */
export function PageHero({
  crumbs,
  eyebrow,
  lines,
  accent,
  lead,
  actions,
  visual,
}: {
  crumbs: { name: string; href?: string }[];
  eyebrow: string;
  lines: string[];
  accent?: string;
  lead?: string;
  actions?: ReactNode;
  visual?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-40 lg:pb-24">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[40rem] rounded-full bg-accent/[0.06] blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--text)_1px,transparent_1px),linear-gradient(90deg,var(--text)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(60%_80%_at_70%_20%,#000,transparent)]"
      />
      <div className="container-x relative">
        <Reveal y={10}>
          <Breadcrumbs items={crumbs} />
        </Reveal>
        <div className={visual ? "mt-10 grid items-center gap-12 lg:grid-cols-12" : "mt-10"}>
          <div className={visual ? "lg:col-span-7" : "max-w-5xl"}>
            <Reveal delay={0.1}>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
            <h1 className="display-lg mt-6">
              <MaskLines lines={lines} accentText={accent} animateOnMount delay={0.2} />
            </h1>
            {lead && (
              <Reveal delay={0.4}>
                <p className="lead mt-6 max-w-2xl">{lead}</p>
              </Reveal>
            )}
            {actions && (
              <Reveal delay={0.5} className="mt-10 flex flex-col gap-3 sm:flex-row">
                {actions}
              </Reveal>
            )}
          </div>
          {visual && (
            <Reveal delay={0.3} className="lg:col-span-5">
              {visual}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
