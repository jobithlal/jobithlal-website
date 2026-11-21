"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * Global motion settings.
 * - MotionConfig reducedMotion="user" makes every motion component honour the OS setting.
 * - Lenis smooth scrolling is lazy-loaded, desktop fine-pointer only, and skipped for
 *   reduced-motion users. `smoothScroll` / `animations` will come from ThemeSettings.
 */
export function Providers({
  children,
  smoothScroll = true,
  animations = true,
}: {
  children: ReactNode;
  smoothScroll?: boolean;
  animations?: boolean;
}) {
  useEffect(() => {
    document.documentElement.dataset.motion = animations ? "on" : "off";
  }, [animations]);

  useEffect(() => {
    if (!smoothScroll || !animations) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;

    let raf = 0;
    let destroyed = false;
    let lenis: import("lenis").default | null = null;

    import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      lenis = new Lenis({ duration: 1.1, anchors: { offset: -90 } });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [smoothScroll, animations]);

  return <MotionConfig reducedMotion={animations ? "user" : "always"}>{children}</MotionConfig>;
}
