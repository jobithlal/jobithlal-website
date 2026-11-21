import type { HomeContent, Service } from "@/content/schema";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ServiceCard } from "./ServiceCard";

export function Services({ content, services }: { content: HomeContent["services"]; services: Service[] }) {
  return (
    <section id="services" aria-labelledby="services-heading" className="section-y relative">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4 lg:pt-4">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <Eyebrow>{content.eyebrow}</Eyebrow>
            </Reveal>
            <h2 id="services-heading" className="display-md mt-6 max-w-md">
              <MaskLines lines={[content.heading]} />
            </h2>
            <Reveal delay={0.15}>
              <p className="lead mt-6 max-w-md">{content.description}</p>
            </Reveal>
            <Reveal delay={0.25} className="mt-10 hidden lg:block">
              <ButtonLink href="/contact" variant="ghost">
                Discuss your project
              </ButtonLink>
            </Reveal>
          </div>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal as="li" key={s.slug} delay={i * 0.1} className={i === 2 ? "sm:col-span-2 lg:col-span-1" : undefined}>
              <ServiceCard service={s} index={i} className="h-full" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
