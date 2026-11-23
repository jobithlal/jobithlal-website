"use client";

import { motion } from "motion/react";
import type { HeroContent } from "@/content/schema";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ButtonLink } from "@/components/ui/Button";
import { MaskLines } from "@/components/ui/Reveal";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ hero, experienceYears }: { hero: HeroContent; experienceYears: number }) {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden pb-16 pt-28 sm:pb-20 lg:flex lg:min-h-[100svh] lg:items-center lg:pb-24"
    >
      {/* Soft themed backdrop behind the frame */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background:radial-gradient(70%_60%_at_50%_18%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_70%)] lg:[background:radial-gradient(55%_75%_at_80%_50%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_70%)]"
      />

      <div className="container-x grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 xl:gap-20">
        {/* Hero media: top-centre on mobile, right column aligned with the text on desktop */}
        <motion.div
          className="relative mx-auto w-[min(78vw,21rem)] lg:order-2 lg:mx-0 lg:w-auto"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease, delay: 0.2 }}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-2xl lg:h-[min(56svh,30rem)] lg:w-auto xl:h-[min(64svh,38rem)]">
            <MediaFrame media={hero.media} art="hero" priority opacity={hero.mediaOpacity} sizes="(min-width: 1024px) 32vw, 78vw" />
          </div>
          {/* Experience badge pinned to the frame */}
          <motion.div
            className="absolute -bottom-5 left-4 hidden rounded-2xl xl:-left-5 border border-line bg-elevated/95 px-5 py-4 shadow-xl backdrop-blur sm:block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8, ease }}
          >
            <p className="font-display text-3xl font-bold leading-none text-accent-fg">{experienceYears}+</p>
            <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.22em] text-muted">Years of creative production</p>
          </motion.div>
        </motion.div>

        <div className="lg:order-1">
          {/* 2. Eyebrow */}
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

          {/* 3–5. Headline lines (a little smaller on desktop so it sits beside the frame) */}
          <h1 id="hero-heading" className="display-xl mt-6 lg:text-[clamp(3.5rem,5.6vw,6.25rem)]">
            <MaskLines lines={hero.lines} accentIndex={hero.accentLine} delay={0.5} stagger={0.14} animateOnMount />
          </h1>

          {/* 6. Description */}
          <motion.p
            className="lead mt-8 max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 1.05 }}
          >
            {hero.description}
          </motion.p>

          {/* 7. CTAs */}
          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 1.25 } } }}
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

      {/* Scroll cue (desktop) */}
      <motion.div
        aria-hidden
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <span className="text-[0.62rem] uppercase tracking-[0.22em] text-muted">Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-accent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
