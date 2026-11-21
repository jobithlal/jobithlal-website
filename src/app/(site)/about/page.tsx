import type { Metadata } from "next";
import { getHome, getServices, getSiteSettings } from "@/lib/content";
import { breadcrumbJsonLd, JsonLd, seoMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { Difference } from "@/components/sections/Difference";
import { Process } from "@/components/sections/Process";
import { FinalCta } from "@/components/sections/FinalCta";
import { ServiceCard } from "@/components/sections/ServiceCard";

export async function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/about", {
  title: "About Jobith Lal — Creative Director, Doha",
  description:
    "Jobith Lal brings 16+ years of creative media and digital production experience to social media reels, motion graphics and website development in Doha, Qatar."
  });
}

export default async function AboutPage() {
  const [home, site, services] = await Promise.all([getHome(), getSiteSettings(), getServices()]);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "About" }]}
        eyebrow="About"
        lines={["Your independent", "creative partner"]}
        accent="in Doha."
        lead={`I'm Jobith Lal — a creative director and producer with ${site.experienceYears}+ years in creative media and digital production. I help brands stand out with reels, motion graphics and websites that are built around real business goals.`}
        actions={
          <>
            <ButtonLink href="/contact">Start a project</ButtonLink>
            <ButtonLink href="/work" variant="ghost" icon="play">
              Explore my work
            </ButtonLink>
          </>
        }
      />

      <Difference content={home.difference} />

      <section aria-labelledby="focus-heading" className="section-y">
        <div className="container-x">
          <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow>Focus</Eyebrow>
              </Reveal>
              <h2 id="focus-heading" className="display-md mt-6">
                <MaskLines lines={["Three disciplines.", "One creative partner."]} />
              </h2>
            </div>
            <Reveal delay={0.15} className="lg:col-span-5">
              <p className="lead">
                Working directly with one person means one creative vision from the first idea to the final file — no hand-offs, no lost details.
              </p>
            </Reveal>
          </div>
          <ul className="grid gap-5 md:grid-cols-3">
            {services.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i * 0.08}>
                <ServiceCard service={s} index={i} className="h-full" />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Process content={home.process} />
      <FinalCta content={home.finalCta} />
      <div className="h-[var(--section-y)]" />
    </>
  );
}
