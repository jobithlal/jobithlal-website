"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades + lifts content into view once. MotionConfig handles reduced motion globally. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "header" | "p";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </Comp>
  );
}

/** Masked line reveal for headings: each line slides up from behind a clip. */
export function MaskLines({
  lines,
  accentIndex,
  accentText,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.11,
  animateOnMount = false,
}: {
  lines: string[];
  accentIndex?: number;
  /** Appended to the final line in the accent colour. */
  accentText?: string;
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  animateOnMount?: boolean;
}) {
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } };
  const line: Variants = {
    hidden: { y: "110%" },
    show: { y: "0%", transition: { duration: 1, ease } },
  };
  const trigger = animateOnMount
    ? { animate: "show" as const }
    : { whileInView: "show" as const, viewport: { once: true, margin: "0px 0px -10% 0px" } };

  const all = accentText ? [...lines, accentText] : lines;
  return (
    <motion.span className={className} initial="hidden" {...trigger} variants={container}>
      {all.map((l, i) => {
        const isAccent = accentText ? i === all.length - 1 : i === accentIndex;
        return (
          <span key={i} className="block overflow-hidden pb-[0.06em]">
            <motion.span variants={line} className={`block will-change-transform ${lineClassName ?? ""} ${isAccent ? "text-accent-fg" : ""}`}>
              {l}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );
}
