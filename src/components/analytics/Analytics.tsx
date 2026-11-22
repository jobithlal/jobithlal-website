"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Google Analytics 4 with consent.
 * - Nothing is loaded and no cookie is set until the visitor accepts (when consent is required).
 * - Uses Consent Mode v2: everything defaults to "denied".
 * - Tracks page views on client navigation and any element with data-track="event_name".
 */

type Consent = "granted" | "denied" | null;
const KEY = "jl_analytics_consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function writeConsent(v: Exclude<Consent, null>) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode — choice lasts for this page only */
  }
}

let loaded = false;
function loadGtag(id: string) {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag requires the arguments object
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  // Page views are sent manually so client-side navigation is counted once.
  window.gtag("config", id, { send_page_view: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

/** Send a GA4 event if analytics is active; a no-op otherwise. */
export function track(event: string, params: Record<string, string | number | undefined> = {}) {
  if (loaded && window.gtag) window.gtag("event", event, params);
}

export function Analytics({ measurementId, requireConsent }: { measurementId: string; requireConsent: boolean }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = requireConsent ? readConsent() : "granted";
    // localStorage is only readable after hydration, so the stored choice is synced here once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(c);
    setOpen(requireConsent && c === null);
    setReady(true);
    const reopen = () => setOpen(true);
    window.addEventListener("jl:cookie-settings", reopen);
    return () => window.removeEventListener("jl:cookie-settings", reopen);
  }, [requireConsent]);

  useEffect(() => {
    if (consent === "granted") loadGtag(measurementId);
  }, [consent, measurementId]);

  // Page view on first load and on every client-side navigation.
  useEffect(() => {
    if (consent !== "granted") return;
    track("page_view", { page_path: pathname, page_location: window.location.href, page_title: document.title });
  }, [consent, pathname]);

  // Declarative events: <a data-track="cta_click" data-track-label="Start a project">.
  useEffect(() => {
    if (consent !== "granted") return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      track(el.dataset.track!, { label: el.dataset.trackLabel ?? el.textContent?.trim().slice(0, 80), page_path: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [consent]);

  if (!ready || !open) return null;

  const choose = (v: Exclude<Consent, null>) => {
    writeConsent(v);
    setConsent(v);
    setOpen(false);
    if (v === "denied" && loaded) window.gtag?.("consent", "update", { analytics_storage: "denied" });
  };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-xl rounded-2xl border border-line bg-card/95 p-5 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-5 sm:bottom-5">
      <p id="consent-title" className="font-display text-lg font-bold">
        Cookies &amp; analytics
      </p>
      <p className="mt-2 text-sm leading-relaxed text-fg-2">
        May I use Google Analytics cookies to understand how visitors use this site? No advertising cookies are used. You can change your choice any time from the footer.{" "}
        <Link href="/privacy-policy" className="text-accent-fg underline-offset-4 hover:underline">
          Privacy policy
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("granted")} className="h-11 rounded-full bg-accent px-6 text-sm font-semibold text-ink">
          Accept analytics
        </button>
        <button type="button" onClick={() => choose("denied")} className="h-11 rounded-full border border-line px-6 text-sm font-semibold text-fg hover:border-fg-2">
          Decline
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("jl:cookie-settings"))} className="link-underline hover:text-fg">
      Cookie settings
    </button>
  );
}
