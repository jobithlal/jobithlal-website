import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getHome, getProjectsForService, getService, getServices } from "@/lib/content";
import { breadcrumbJsonLd, faqJsonLd, JsonLd, seoMetadata, serviceJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { Faq } from "@/components/ui/Faq";
import { Artwork } from "@/components/media/Artwork";
import { artFor } from "@/content/service-map";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { FinalCta } from "@/components/sections/FinalCta";

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return {};
  return seoMetadata(`/services/${s.slug}`, { title: s.seo.title, description: s.seo.description, ogImageUrl: s.media.imageUrl });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  const [projects, home, all] = await Promise.all([getProjectsForService(service.slug), getHome(), getServices()]);
  const others = all.filter((s) => s.slug !== service.slug);
  const p = service.page;

  return (
    <>
      <JsonLd data={serviceJsonLd(service)} />
      <JsonLd data={faqJsonLd(p.faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/#services" },
          { name: service.title, path: `/services/${service.slug}` },
        ])}
      />

      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Services", href: "/#services" }, { name: service.shortTitle }]}
        eyebrow={p.eyebrow}
        lines={[p.headline]}
        accent={p.accent}
        lead={p.subheading}
        actions={
          <>
            <ButtonLink href={service.cta.href}>{service.cta.label}</ButtonLink>
            <ButtonLink href="#features" variant="ghost" icon="none">
              What&apos;s included
            </ButtonLink>
          </>
        }
        visual={
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line sm:aspect-square lg:aspect-[4/5]">
            <Artwork variant={artFor(service.slug)} />
          </div>
        }
      />

      {/* Intro + features */}
      <section id="features" aria-labelledby="features-heading" className="section-y border-t border-line">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <Eyebrow>What&apos;s included</Eyebrow>
              </Reveal>
              <h2 id="features-heading" className="display-md mt-6">
                <MaskLines lines={[service.subtitle]} />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-6 leading-relaxed text-fg-2">{p.intro}</p>
              </Reveal>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {p.features.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 4) * 0.06}>
                <div className="border-sweep group flex h-full gap-4 rounded-2xl border border-line bg-card/60 p-6 transition-colors hover:bg-card">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-ink">
                    <Check className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fg-2">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Work samples */}
      {projects.length > 0 && (
        <section aria-labelledby="samples-heading" className="pb-[var(--section-y)]">
          <div className="container-x">
            <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <Reveal>
                  <Eyebrow>Work</Eyebrow>
                </Reveal>
                <h2 id="samples-heading" className="display-md mt-6">
                  <MaskLines lines={[`${service.shortTitle} projects`]} />
                </h2>
              </div>
              <ButtonLink href="/work" variant="ghost">
                All work
              </ButtonLink>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((pr, i) => (
                <Reveal as="li" key={pr.slug} delay={i * 0.08}>
                  <ProjectCard project={pr} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Process */}
      <section aria-labelledby="svc-process-heading" className="section-y border-t border-line bg-bg-2">
        <div className="container-x">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
          </Reveal>
          <h2 id="svc-process-heading" className="display-md mt-6">
            <MaskLines lines={[home.process.heading]} />
          </h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {p.process.map((st, i) => (
              <Reveal as="li" key={st.title} delay={i * 0.08} className="bg-bg-2 p-7">
                <p className="font-display text-5xl font-bold leading-none text-accent">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-6 font-display text-xl font-bold">{st.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">{st.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="section-y">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>FAQ</Eyebrow>
            </Reveal>
            <h2 id="faq-heading" className="display-md mt-6">
              <MaskLines lines={["Questions,", "answered."]} />
            </h2>
          </div>
          <div className="lg:col-span-8">
            <Faq items={p.faqs} />
          </div>
        </div>
      </section>

      <FinalCta content={{ ...home.finalCta, cta: service.cta }} />

      {/* Other services */}
      <section aria-labelledby="other-heading" className="section-y">
        <div className="container-x">
          <Reveal>
            <Eyebrow>Also available</Eyebrow>
          </Reveal>
          <h2 id="other-heading" className="display-md mt-6">
            <MaskLines lines={["Explore other services"]} />
          </h2>
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {others.map((s) => (
              <Reveal as="li" key={s.slug}>
                <ServiceCard service={s} index={all.indexOf(s)} className="h-full" />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
