"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { HeroContent, Service, SiteSettings } from "@/content/schema";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ButtonLink } from "@/components/ui/Button";
import { MaskLines } from "@/components/ui/Reveal";
import { artFor } from "@/content/service-map";

const ease = [0.22, 1, 0.36, 1] as const;

/** Short codes for the social row, as in an editorial footer line. */
const SOCIAL_CODE: Record<string, string> = { Instagram: "IG", LinkedIn: "IN", YouTube: "YT", Vimeo: "VI", Behance: "BE" };

/** Media panel with the top-left and bottom-left corners cut on the diagonal (desktop) or one corner (mobile). */
const PANEL_CLIP =
  "[clip-path:polygon(0_0,100%_0,100%_100%,16%_100%,0_88%)] lg:[clip-path:polygon(0_0,100%_0,100%_100%,22%_100%,0_84%)]";

function ServiceCard({ service, delay }: { service: Service; delay: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease, delay }}
      className="min-w-0"
    >
      <Link
        href={`/services/${service.slug}`}
        data-track="service_open"
        data-track-label={service.title}
        className="group flex h-full flex-col rounded-[1.4rem] border border-line bg-elevated/90 p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors hover:border-accent"
      >
        <div data-theme="dark" className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-card">
          <div className="absolute inset-0 transition-transform duration-[1.1s] ease-[var(--ease-out)] group-hover:scale-[1.06]">
            <MediaFrame media={service.media} art={artFor(service.slug)} sizes="(min-width: 1024px) 12vw, 44vw" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-3">
          <span className="min-w-0 text-[0.8rem] font-semibold leading-tight">{service.shortTitle}</span>
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-ink transition-transform duration-300 group-hover:rotate-45"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

export function Hero({
  hero,
  experienceYears,
  services = [],
  socials = [],
}: {
  hero: HeroContent;
  experienceYears: number;
  services?: Service[];
  socials?: SiteSettings["socials"];
}) {
  const featured = services.slice(0, 2);
  const links = socials.filter((s) => s.url);

  return (
    <section id="top" aria-labelledby="hero-heading" className="relative isolate overflow-hidden pb-14 pt-28 sm:pb-20 lg:pb-10 lg:pt-28">
      {/* Soft glow behind the panel, like the light source in the reference */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background:radial-gradient(60%_45%_at_50%_10%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_70%)] lg:[background:radial-gradient(38%_60%_at_52%_42%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_72%)]"
      />

      <div className="container-x grid gap-10 lg:min-h-[max(36rem,calc(100svh-9.5rem))] xl:h-[calc(100svh-9.5rem)] xl:max-h-[58rem] lg:grid-cols-12 lg:gap-6">
        {/* ── Centre: tall media panel (first on mobile, top-centre) ── */}
        <motion.div
          className="relative mx-auto w-[min(86vw,24rem)] lg:order-2 lg:col-span-5 lg:mx-0 lg:h-full lg:w-full"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, ease, delay: 0.15 }}
        >
          <div
            className={`relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-card)*1.4)] bg-card lg:aspect-auto lg:h-full ${PANEL_CLIP}`}
          >
            <MediaFrame media={hero.media} art="hero" priority opacity={hero.mediaOpacity} sizes="(min-width: 1024px) 40vw, 86vw" />
          </div>
        </motion.div>

        {/* ── Left: eyebrow + headline in the middle, description + actions at the bottom ── */}
        <div className="flex flex-col lg:order-1 lg:col-span-4 lg:justify-between lg:py-6">
          <div className="hidden lg:block" aria-hidden />
          <div>
            <motion.p
              className="eyebrow inline-flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.35 }}
            >
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              {hero.eyebrow}
            </motion.p>
            <h1 id="hero-heading" className="display-xl mt-5 lg:text-[clamp(2.6rem,3.7vw,4.6rem)] lg:leading-[0.98]">
              <MaskLines lines={hero.lines} accentIndex={hero.accentLine} delay={0.5} stagger={0.14} animateOnMount />
            </h1>
          </div>

          <div className="mt-8">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.95 }}
            >
              <span className="font-display text-2xl font-bold leading-none text-accent-fg">{experienceYears}+</span>
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-fg">Years of creative production</span>
            </motion.div>
            <motion.p
              className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-fg-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 1.05 }}
            >
              {hero.description}
            </motion.p>
            <motion.div
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 1.2 } } }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
                <ButtonLink href={hero.primaryCta.href} className="w-full sm:w-auto">
                  {hero.primaryCta.label}
                </ButtonLink>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
                <ButtonLink href={hero.secondaryCta.href} variant="ghost" icon="play" className="w-full sm:w-auto">
                  {hero.secondaryCta.label}
                </ButtonLink>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ── Right: floating service cards overlapping the panel, socials at the bottom ── */}
        <div className="flex flex-col lg:order-3 lg:col-span-3 lg:justify-between lg:py-6">
          <div className="hidden lg:block" aria-hidden />
          {featured.length > 0 && (
            <nav aria-label="Featured services" className="relative z-10 lg:-ml-[62%] xl:-ml-[52%]">
              <ul className="grid grid-cols-2 gap-3">
                {featured.map((s, i) => (
                  <ServiceCard key={s.slug} service={s} delay={1.3 + i * 0.12} />
                ))}
              </ul>
            </nav>
          )}
          {links.length > 0 ? (
            <motion.ul
              aria-label="Social profiles"
              className="mt-8 flex items-center gap-6 lg:mt-0 lg:justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 1 }}
            >
              {links.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    title={s.platform}
                    className="font-display text-sm font-bold tracking-[0.12em] text-fg-2 transition-colors hover:text-accent-fg"
                  >
                    {SOCIAL_CODE[s.platform] ?? s.platform.slice(0, 2).toUpperCase()}
                  </a>
                </li>
              ))}
            </motion.ul>
          ) : (
            <div className="hidden lg:block" aria-hidden />
          )}
        </div>
      </div>
    </section>
  );
}
