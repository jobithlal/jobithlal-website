"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { MessageCircle, Target, Zap, Send } from "lucide-react";
import type { HomeContent } from "@/content/schema";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const icons = { message: MessageCircle, target: Target, zap: Zap, send: Send };

export function Process({ content }: { content: HomeContent["process"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 45%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const n = content.steps.length;
  const [active, setActive] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(v <= 0.02 ? -1 : Math.min(n - 1, Math.floor(v * n)));
  });

  return (
    <section id="process" aria-labelledby="process-heading" className="relative pb-[var(--section-y)] pt-[calc(var(--section-y)*0.55)]">
      <div className="container-x">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-20">
          <div>
            <Reveal>
              <Eyebrow>{content.eyebrow}</Eyebrow>
            </Reveal>
            <h2 id="process-heading" className="display-lg mt-6">
              <MaskLines lines={[content.heading]} />
            </h2>
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-sm text-fg-2">A clear, collaborative process — so you always know what happens next.</p>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          {/* Connecting line — horizontal on desktop, vertical on mobile */}
          <div aria-hidden className="absolute left-[1.6rem] top-0 h-full w-px bg-line lg:left-0 lg:top-[1.6rem] lg:h-px lg:w-full" />
          <motion.div
            aria-hidden
            className="absolute left-[1.6rem] top-0 hidden h-px w-full origin-left bg-accent lg:top-[1.6rem] lg:left-0 lg:block"
            style={{ scaleX: progress }}
          />
          <motion.div
            aria-hidden
            className="absolute left-[1.6rem] top-0 h-full w-px origin-top bg-accent lg:hidden"
            style={{ scaleY: progress }}
          />

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
            {content.steps.map((s, i) => {
              const Icon = icons[s.icon];
              const on = i <= active;
              return (
                <Reveal as="li" key={s.title} delay={i * 0.12} className="relative pl-20 lg:pl-0">
                  <span
                    className={cn(
                      "absolute left-0 top-0 grid size-[3.2rem] place-items-center rounded-full border transition-all duration-500 lg:relative",
                      on ? "border-accent bg-accent text-ink shadow-[0_0_30px_-6px_var(--accent)]" : "border-line bg-bg text-fg-2",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div
                    className={cn(
                      "rounded-[var(--radius-card)] border p-6 transition-colors duration-500 lg:mt-8",
                      on ? "border-accent/40 bg-card" : "border-line bg-card/40",
                    )}
                  >
                    <p className={cn("font-display text-sm font-bold transition-colors", on ? "text-accent-fg" : "text-muted")}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">{s.title}</h3>
                    <p className="mt-3 leading-relaxed text-fg-2">{s.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
