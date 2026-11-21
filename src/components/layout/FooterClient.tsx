"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";

const subscribe = () => () => {};

/** Rendered on the client so the prerendered shell never bakes in a stale year. */
export function CopyrightYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <span suppressHydrationWarning>{year ?? ""}</span>;
}

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        document.getElementById("main")?.focus({ preventScroll: true });
      }}
      aria-label="Back to top"
      className="group inline-flex items-center gap-2 uppercase tracking-[0.18em] text-fg-2 hover:text-accent"
    >
      <span className="hidden sm:inline">Back to top</span>
      <span className="grid size-8 place-items-center rounded-full border border-line transition-colors group-hover:border-accent">
        <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" aria-hidden />
      </span>
    </button>
  );
}
