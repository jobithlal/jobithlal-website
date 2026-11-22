import { Target, Layers, Cpu, Zap } from "lucide-react";
import type { HomeContent } from "@/content/schema";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { RevealImage } from "./RevealImage";

const icons = { target: Target, layers: Layers, cpu: Cpu, zap: Zap };

export function Difference({ content }: { content: HomeContent["difference"] }) {
  const stats = content.stats.filter((s) => s.verified);
  return (
    <section id="about" aria-labelledby="about-heading" className="relative px-3 sm:px-5">
      <div className="relative mx-auto max-w-[calc(var(--max-w)+2rem)] overflow-hidden rounded-[calc(var(--radius-card)+8px)] border border-line bg-bg-2">
        {/* Ambient green */}
        <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 size-[36rem] rounded-full bg-accent/[0.07] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 size-[28rem] rounded-full bg-accent/[0.05] blur-3xl" />

        <div className="relative grid gap-10 p-5 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-12 xl:p-16">
          {/* Left: portrait */}
          <div className="lg:col-span-4">
            <RevealImage media={content.portrait} className="aspect-[4/5] w-full lg:h-full lg:min-h-[32rem]" />
          </div>

          {/* Centre: statement */}
          <div className="flex flex-col justify-center lg:col-span-4">
            <Reveal>
              <Eyebrow>{content.eyebrow}</Eyebrow>
            </Reveal>
            <h2 id="about-heading" className="display-md mt-6">
              <MaskLines lines={content.headingLines} accentText={content.accent} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 leading-relaxed text-fg-2">{content.body}</p>
            </Reveal>
            {stats.length > 0 && (
              <Reveal delay={0.3}>
                <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-line pt-8">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <dt className="sr-only">{s.label}</dt>
                      <dd className="font-display text-5xl font-bold leading-none text-accent-fg">{s.value}</dd>
                      <dd aria-hidden className="mt-2 max-w-[14rem] text-xs uppercase tracking-[0.18em] text-muted">
                        {s.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </div>

          {/* Right: value propositions */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            {content.values.map((v, i) => {
              const Icon = icons[v.icon];
              return (
                <Reveal as="li" key={v.title} delay={0.1 + i * 0.09}>
                  <div className="group flex h-full gap-4 rounded-2xl border border-line bg-card/60 p-5 transition-colors duration-500 hover:border-accent/50 hover:bg-card">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent-fg transition-transform duration-500 group-hover:scale-110 group-hover:bg-accent group-hover:text-ink">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold leading-tight">{v.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{v.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
