"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { HeroContent, Service, SiteSettings } from "@/content/schema";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ButtonLink } from "@/components/ui/Button";
import { MaskLines } from "@/components/ui/Reveal";
import { artFor } from "@/content/service-map";
import { Logo } from "@/components/layout/Logo";
import { SplitNavLeft, SplitNavRight, type SplitNavProps } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Short codes for the social row. */
const SOCIAL_CODE: Record<string, string> = { Instagram: "IG", LinkedIn: "IN", YouTube: "YT", Vimeo: "VI", Behance: "BE" };

/** Hero image: rounded corners with a diagonal cut across the lower-left corner. */
const PANEL_CLIP =
  "[clip-path:polygon(0_0,100%_0,100%_100%,18%_100%,0_86%)] split:[clip-path:polygon(0_0,100%_0,100%_100%,17%_100%,0_80%)]";

export type HeroNavData = SplitNavProps & {
  logo: { text: string; subtitle: string; imageUrl?: string };
};

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
            <MediaFrame media={service.media} art={artFor(service.slug)} sizes="(min-width: 1280px) 14vw, 44vw" />
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

/**
 * Homepage header + hero as one layout.
 *
 * `split:` and wider — a 27 / 46 / 27 grid. Left column: first nav pill, logo,
 * headline (vertical middle) and supporting copy (bottom). Centre: the hero
 * image, full height from nav level. Right column: second nav pill with the
 * contact CTA, two service cards overlapping the image's right edge, socials.
 *
 * Narrower — the global compact header (menu toggle) takes over and the hero
 * stacks: headline → image → copy → cards → socials.
 */
export function Hero({
  hero,
  experienceYears,
  services = [],
  socials = [],
  nav,
}: {
  hero: HeroContent;
  experienceYears: number;
  services?: Service[];
  socials?: SiteSettings["socials"];
  nav?: HeroNavData;
}) {
  const featured = services.slice(0, 2);
  const links = socials.filter((s) => s.url);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className={cn(
        "relative isolate overflow-hidden px-5 pb-14 pt-28 sm:px-8 sm:pb-20",
        "split:h-[100svh] split:max-h-[64rem] split:min-h-[44rem] split:p-3 2xl:p-4",
        // Without the split nav (e.g. the admin preview) the regular header sits on top.
        !nav && "split:pt-28 2xl:pt-28",
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background:radial-gradient(60%_45%_at_50%_12%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_70%)] split:[background:radial-gradient(40%_60%_at_50%_40%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_72%)]"
      />

      <div
        className={cn(
          "mx-auto grid max-w-2xl gap-8 [grid-template-areas:'head'_'media'_'copy'_'cards'_'social']",
          "md:max-w-3xl",
          "split:h-full split:max-w-none split:grid-cols-[27fr_46fr_27fr] split:grid-rows-[auto_minmax(0,1fr)_auto] split:gap-x-3 split:gap-y-0 2xl:gap-x-4",
          "split:[grid-template-areas:'lnav_media_rnav'_'head_media_cards'_'copy_media_social']",
        )}
      >
        {/* ── Navigation pills (split widths; the global header handles narrower screens) ── */}
        {nav && (
          <>
            <motion.div
              className="relative z-30 hidden [grid-area:lnav] split:block"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
            >
              <SplitNavLeft services={nav.services} showBlog={nav.showBlog} />
            </motion.div>
            <motion.div
              className="relative z-30 hidden [grid-area:rnav] split:block"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.18 }}
            >
              <SplitNavRight services={nav.services} themeToggle={nav.themeToggle} showBlog={nav.showBlog} />
            </motion.div>
          </>
        )}

        {/* ── Headline (vertical middle of the left column) ── */}
        <div className="[grid-area:head] split:flex split:flex-col split:justify-center split:px-4 split:py-8 2xl:px-6">
          {nav && (
            <motion.div
              className="mb-10 hidden split:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              <Logo text={nav.logo.text} subtitle={nav.logo.subtitle} imageUrl={nav.logo.imageUrl} />
            </motion.div>
          )}
          <motion.p
            className="eyebrow inline-flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.35 }}
          >
            <span aria-hidden className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {hero.eyebrow}
          </motion.p>
          <h1 id="hero-heading" className="display-xl mt-5 split:text-[clamp(2.4rem,3.3vw,4.4rem)] split:leading-[0.98]">
            <MaskLines lines={hero.lines} accentIndex={hero.accentLine} delay={0.5} stagger={0.14} animateOnMount />
          </h1>
        </div>

        {/* ── Hero image: full height from nav level, diagonal lower-left cut ── */}
        <motion.div
          className="relative [grid-area:media] split:h-full"
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, ease, delay: 0.15 }}
        >
          <div
            className={cn(
              "relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-card sm:aspect-[16/11] split:aspect-auto split:h-full",
              PANEL_CLIP,
            )}
          >
            <MediaFrame media={hero.media} art="hero" priority opacity={hero.mediaOpacity} sizes="(min-width: 1280px) 46vw, 100vw" />
          </div>
        </motion.div>

        {/* ── Supporting copy + actions (bottom of the left column) ── */}
        <div className="[grid-area:copy] split:px-4 split:pb-5 2xl:px-6">
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
            className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-fg-2 split:text-[0.9rem]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 1.05 }}
          >
            {hero.description}
          </motion.p>
          <motion.div
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
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

        {/* ── Two service cards around mid-height; the first overlaps the image's right edge ── */}
        {featured.length > 0 && (
          <nav
            aria-label="Featured services"
            className="relative z-10 [grid-area:cards] split:[grid-area:1/3/4/4] split:-ml-[20%] split:self-center"
          >
            <ul className="grid grid-cols-2 gap-3">
              {featured.map((s, i) => (
                <ServiceCard key={s.slug} service={s} delay={1.3 + i * 0.12} />
              ))}
            </ul>
          </nav>
        )}

        {/* ── Socials (bottom of the right column) ── */}
        {links.length > 0 && (
          <motion.ul
            aria-label="Social profiles"
            className="flex items-center gap-6 [grid-area:social] split:justify-end split:self-end split:px-4 split:pb-5"
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
        )}
      </div>
    </section>
  );
}
