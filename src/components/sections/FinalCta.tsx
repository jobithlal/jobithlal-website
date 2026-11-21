import type { HomeContent } from "@/content/schema";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function FinalCta({ content }: { content: HomeContent["finalCta"] }) {
  return (
    <section aria-labelledby="cta-heading" className="px-3 py-6 sm:px-5">
      <Reveal y={40}>
        <div className="grain relative mx-auto max-w-[calc(var(--max-w)+2rem)] overflow-hidden rounded-[calc(var(--radius-card)+10px)] bg-accent text-ink">
          {/* Subtle animated background */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(115deg,#000_0_1px,transparent_1px_22px)]" />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full border-[40px] border-black/[0.06]" style={{ animation: "drift 14s ease-in-out infinite" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 size-[30rem] rounded-full bg-white/25 blur-3xl" />

          <div className="relative grid gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-24">
            <h2 id="cta-heading" className="font-display text-[clamp(2.75rem,6.4vw,6.25rem)] font-bold uppercase leading-[0.9] tracking-[-0.035em] lg:col-span-7">
              <MaskLines lines={content.heading.split(/(?<=are) /)} />
            </h2>
            <div className="lg:col-span-5">
              <p className="font-display text-xl font-bold leading-snug">{content.lead}</p>
              <p className="mt-4 leading-relaxed text-black/75">{content.body}</p>
              <div className="mt-8">
                <ButtonLink href={content.cta.href} variant="dark" className="w-full sm:w-auto">
                  {content.cta.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
