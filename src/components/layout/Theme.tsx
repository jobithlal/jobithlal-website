"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import type { AppearanceSettings } from "@/content/schema";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "jl_theme";
const THEME_COLORS = { dark: "#080A08", light: "#F4F5EF" } as const;

/**
 * Inline script that sets <html data-theme> before the page paints, so there's
 * no flash of the wrong theme. In "toggle" mode a visitor's saved choice wins.
 */
export function ThemeScript({ appearance }: { appearance: AppearanceSettings }) {
  const cfg = JSON.stringify({ m: appearance.mode, d: appearance.toggleDefault, k: STORAGE_KEY, c: THEME_COLORS });
  const js = `(function(){try{var c=${cfg},t=c.m;if(t==="toggle"){var s=null;try{s=localStorage.getItem(c.k)}catch(e){}t=s==="light"||s==="dark"?s:c.d;if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}var h=document.documentElement;h.setAttribute("data-theme",t);h.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",c.c[t])}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};
const current = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, current, () => null);
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onClick={() => {
        const h = document.documentElement;
        h.setAttribute("data-theme", next);
        h.style.colorScheme = next;
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {}
      }}
      aria-label={theme ? `Switch to ${next} mode` : "Switch colour theme"}
      title={theme ? `Switch to ${next} mode` : undefined}
      className={cn(
        "grid size-12 place-items-center rounded-full border border-line bg-white/[0.03] text-fg transition-colors hover:border-accent hover:text-accent-fg",
        className,
      )}
    >
      {/* Sun in dark mode (switch to light), moon in light mode. CSS picks it, so it is right before hydration too. */}
      <Sun className="size-5 [[data-theme=light]_&]:hidden" aria-hidden />
      <Moon className="size-5 [[data-theme=dark]_&]:hidden [:root:not([data-theme])_&]:hidden" aria-hidden />
    </button>
  );
}
