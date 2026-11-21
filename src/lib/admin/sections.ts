import { z } from "zod";
import { heroSchema, homeSchema, tickerSchema } from "@/content/schema";

/** Turns flat form keys like "values.0.title" into nested objects/arrays. */
export function unflatten(flat: Record<string, string | string[]>) {
  const root: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let node: Record<string, unknown> | unknown[] = root;
    parts.forEach((p, i) => {
      const last = i === parts.length - 1;
      const nextIsIndex = /^\d+$/.test(parts[i + 1] ?? "");
      const key = /^\d+$/.test(p) ? Number(p) : p;
      const holder = node as Record<string | number, unknown>;
      if (last) holder[key] = value;
      else {
        holder[key] ??= nextIsIndex ? [] : {};
        node = holder[key] as Record<string, unknown>;
      }
    });
  }
  return root;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean) : []);
const lines = (v: unknown) =>
  str(v)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
const bool = (v: unknown) => v === "true" || v === "on";
const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) && str(v) !== "" ? Number(v) : d);
const url = (v: unknown) => str(v) || undefined;

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  ticker: "Service ticker",
  services: "Services intro",
  difference: "About / The difference",
  work: "Selected work intro",
  process: "Process",
  finalCta: "Final call to action",
  contact: "Contact",
};

/** Build + validate one section's JSON from its submitted form. */
export function buildSection(key: string, flat: Record<string, string | string[]>) {
  const u = unflatten(flat) as Record<string, unknown>;
  const cta = (o: unknown) => ({ label: str((o as Record<string, unknown>)?.label), href: str((o as Record<string, unknown>)?.href) });
  switch (key) {
    case "hero":
      return heroSchema.parse({
        eyebrow: str(u.eyebrow),
        lines: list(u.lines).map(str).filter(Boolean),
        accentLine: num(u.accentLine),
        description: str(u.description),
        primaryCta: cta(u.primaryCta),
        secondaryCta: cta(u.secondaryCta),
        media: {
          imageUrl: url(u.heroImageUrl) ?? url(u.heroVideoPoster),
          mobileImageUrl: url(u.heroMobileImageUrl) ?? url(u.heroMobileVideoPoster),
          videoUrl: url(u.heroVideoUrl),
          mobileVideoUrl: url(u.heroMobileVideoUrl),
          alt: str(u.mediaAlt),
          focal: str(u.focal) || "50% 50%",
        },
        autoplay: bool(u.autoplay),
        loop: bool(u.loop),
        muted: true, // autoplaying video must be muted for browsers and accessibility
        mediaOpacity: num(u.mediaOpacity, 85) / 100,
        overlayStrength: num(u.overlayStrength, 85) / 100,
      });
    case "ticker":
      return tickerSchema.parse({
        enabled: bool(u.enabled),
        items: lines(u.items),
        durationSeconds: num(u.durationSeconds, 28),
        direction: str(u.direction) === "right" ? "right" : "left",
      });
    case "services":
    case "work":
      return homeSchema.shape[key].parse({ eyebrow: str(u.eyebrow), heading: str(u.heading), description: str(u.description) });
    case "difference":
      return homeSchema.shape.difference.parse({
        eyebrow: str(u.eyebrow),
        headingLines: lines(u.headingLines),
        accent: str(u.accent),
        body: str(u.body),
        portrait: { imageUrl: url(u.portraitUrl), alt: str(u.portraitAlt), focal: str(u.portraitFocal) || "50% 30%" },
        values: list(u.values).map((v) => {
          const o = v as Record<string, unknown>;
          return { title: str(o.title), text: str(o.text), icon: str(o.icon) };
        }),
        stats: list(u.stats)
          .map((v) => {
            const o = v as Record<string, unknown>;
            return { value: str(o.value), label: str(o.label), verified: bool(o.verified) };
          })
          .filter((s) => s.value || s.label),
      });
    case "process":
      return homeSchema.shape.process.parse({
        eyebrow: str(u.eyebrow),
        heading: str(u.heading),
        steps: list(u.steps).map((v) => {
          const o = v as Record<string, unknown>;
          return { title: str(o.title), text: str(o.text), icon: str(o.icon) };
        }),
      });
    case "finalCta":
      return homeSchema.shape.finalCta.parse({ heading: str(u.heading), lead: str(u.lead), body: str(u.body), cta: cta(u.cta) });
    case "contact":
      return homeSchema.shape.contact.parse({ heading: str(u.heading), accent: str(u.accent), description: str(u.description) });
    default:
      throw new z.ZodError([{ code: "custom", path: ["key"], message: "Unknown section", input: key }]);
  }
}

/** Zod issue paths → form field names ("lines.0", "values.2.title"). */
export function fieldErrorsFrom(e: z.ZodError) {
  const out: Record<string, string[]> = {};
  for (const i of e.issues) {
    const k = i.path.join(".") || "_";
    (out[k] ??= []).push(i.message);
  }
  return out;
}
