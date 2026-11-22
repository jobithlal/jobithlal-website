"use client";

import { motion } from "motion/react";
import type { HeroContent } from "@/content/schema";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ButtonLink } from "@/components/ui/Button";
import { MaskLines } from "@/components/ui/Reveal";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ hero, experienceYears }: { hero: HeroContent; experienceYears: number }) {
  const o = hero.overlayStrength;
  return (
    <section id="top" aria-labelledby="hero-heading" className="relative isolate flex min-h-[100svh] items-end overflow-hidden pt-28 lg:items-center">
      {/* 1. Background reveal */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease }}
      >
        <MediaFrame media={hero.media} art="hero" priority opacity={hero.mediaOpacity} />
        {/* Legibility gradients — strength is admin-controlled */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, var(--bg) ${95 * o}%, transparent) 0%, color-mix(in srgb, var(--bg) ${75 * o}%, transparent) 38%, transparent 72%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: `linear-gradient(0deg, var(--bg) 0%, color-mix(in srgb, var(--bg) ${60 * o}%, transparent) 45%, transparent 100%)` }} />
      </motion.div>

      <div className="container-x relative pb-16 sm:pb-20 lg:pb-0">
        <div className="max-w-[58rem]">
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

          {/* 3–5. Headline lines */}
          <h1 id="hero-heading" className="display-xl mt-6">
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
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
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

      {/* Side meta (desktop) */}
      <motion.div
        className="absolute bottom-10 right-[var(--gutter)] hidden items-end gap-10 text-right lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
      >
        <div>
          <p className="font-display text-4xl font-bold leading-none text-accent-fg">{experienceYears}+</p>
          <p className="mt-2 text-[0.68rem] uppercase tracking-[0.22em] text-muted">Years of creative production</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-muted [writing-mode:vertical-rl]">Scroll</span>
          <span className="relative block h-14 w-px overflow-hidden bg-line">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-accent"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  );
}
