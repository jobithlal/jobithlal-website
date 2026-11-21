import { z } from "zod";

/**
 * Structured content models.
 *
 * Every piece of public content is described by a Zod schema. In Phases 1–4 the
 * values come from the seed files in this folder; in Phase 5 the same schemas
 * validate rows loaded from PostgreSQL, so the public components never change.
 */

/** Required, non-blank text (whitespace-only is rejected). */
const req = (max = 500) => z.string().trim().min(1, "This can't be empty.").max(max);

export const ctaSchema = z.object({
  label: req(60),
  href: req(300).refine((v) => /^(\/|#|https:\/\/|mailto:|tel:)/.test(v), "Use a path like /contact, an https:// link, mailto: or tel:."),
});
export type Cta = z.infer<typeof ctaSchema>;

/** A media slot: an uploaded image/video URL, or empty (renders designed artwork). */
export const mediaSchema = z.object({
  imageUrl: z.string().url().or(z.string().startsWith("/")).optional(),
  mobileImageUrl: z.string().url().or(z.string().startsWith("/")).optional(),
  videoUrl: z.string().url().or(z.string().startsWith("/")).optional(),
  mobileVideoUrl: z.string().url().or(z.string().startsWith("/")).optional(),
  alt: z.string().max(200).default(""),
  /** CSS object-position, e.g. "60% 40%" */
  focal: z.string().max(20).default("50% 50%"),
});
export type Media = z.infer<typeof mediaSchema>;

export const siteSettingsSchema = z.object({
  name: z.string(),
  logoText: z.string(),
  logoSubtitle: z.string(),
  logoImageUrl: z.string().optional(),
  tagline: z.string(),
  url: z.string().url(),
  email: z.string().email(),
  whatsapp: z.string(),
  location: z.string(),
  experienceYears: z.number().int().positive(),
  socials: z.array(
    z.object({
      platform: z.enum(["Instagram", "LinkedIn", "YouTube", "Vimeo", "Behance"]),
      /** Empty until the administrator enters a verified profile URL. */
      url: z.string().url().optional(),
    }),
  ),
  /** Shows clearly-labelled sample work cards until real projects exist. */
  showDemoProjects: z.boolean(),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const heroSchema = z.object({
  eyebrow: req(120),
  lines: z.array(req(80)).min(1, "Add at least one headline line.").max(4),
  /** Index of the line rendered in the accent colour. */
  accentLine: z.number().int().min(0),
  description: req(600),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  media: mediaSchema,
  autoplay: z.boolean(),
  loop: z.boolean(),
  muted: z.boolean(),
  mediaOpacity: z.number().min(0).max(1),
  overlayStrength: z.number().min(0).max(1),
});
export type HeroContent = z.infer<typeof heroSchema>;

export const tickerSchema = z.object({
  enabled: z.boolean(),
  items: z.array(req(60)).min(1, "Add at least one item."),
  /** Seconds for one full loop. */
  durationSeconds: z.number().min(5).max(120),
  direction: z.enum(["left", "right"]),
});
export type TickerContent = z.infer<typeof tickerSchema>;

export const serviceSlugSchema = z.enum([
  "social-media-reels",
  "motion-graphics",
  "website-development",
]);
export type ServiceSlug = z.infer<typeof serviceSlugSchema>;

export const faqSchema = z.object({ q: z.string(), a: z.string() });
export type Faq = z.infer<typeof faqSchema>;

export const serviceSchema = z.object({
  slug: serviceSlugSchema,
  enabled: z.boolean(),
  order: z.number().int(),
  title: req(80),
  shortTitle: req(60),
  subtitle: req(120),
  description: req(600),
  icon: z.enum(["clapperboard", "sparkles", "code"]),
  media: mediaSchema,
  page: z.object({
    eyebrow: req(80),
    headline: req(160),
    accent: z.string().trim().max(80),
    subheading: req(400),
    intro: req(1500),
    features: z.array(z.object({ title: z.string(), text: z.string() })),
    process: z.array(z.object({ title: z.string(), text: z.string() })),
    faqs: z.array(faqSchema),
  }),
  seo: z.object({ title: req(70), description: req(170) }),
  cta: ctaSchema,
});
export type Service = z.infer<typeof serviceSchema>;

export const projectCategorySchema = z.enum(["reels", "motion", "websites"]);
export type ProjectCategory = z.infer<typeof projectCategorySchema>;

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string(),
  category: projectCategorySchema,
  client: z.string().optional(),
  hideClient: z.boolean().default(false),
  year: z.number().int().optional(),
  summary: z.string(),
  overview: z.string(),
  challenge: z.string().optional(),
  approach: z.string().optional(),
  deliverables: z.array(z.string()).default([]),
  /** Only shown when the administrator has verified it. */
  outcome: z.string().optional(),
  outcomeVerified: z.boolean().default(false),
  cover: mediaSchema,
  externalVideoUrl: z.string().url().optional(),
  gallery: z.array(mediaSchema).default([]),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  status: z.enum(["draft", "published"]),
  /** Sample layout content: always badged as such on the public site. */
  isDemo: z.boolean().default(false),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).default({}),
});
export type Project = z.infer<typeof projectSchema>;

export const processStepSchema = z.object({
  title: req(80),
  text: req(400),
  icon: z.enum(["message", "target", "zap", "send"]),
});
export type ProcessStep = z.infer<typeof processStepSchema>;

export const valuePropSchema = z.object({
  title: req(80),
  text: req(400),
  icon: z.enum(["target", "layers", "cpu", "zap"]),
});

export const statSchema = z.object({
  value: z.string(),
  label: z.string(),
  /** Statistics only render when the administrator has marked them verified. */
  verified: z.boolean(),
});

export const homeSchema = z.object({
  services: z.object({ eyebrow: req(80), heading: req(160), description: req(600) }),
  difference: z.object({
    eyebrow: req(80),
    headingLines: z.array(req(80)).min(1, "Add at least one heading line."),
    accent: z.string().trim().max(80),
    body: req(1200),
    portrait: mediaSchema,
    values: z.array(valuePropSchema).length(4),
    stats: z.array(statSchema),
  }),
  work: z.object({ eyebrow: req(80), heading: req(160), description: req(600) }),
  process: z.object({ eyebrow: req(80), heading: req(160), steps: z.array(processStepSchema).min(1).max(8) }),
  finalCta: z.object({
    heading: req(120),
    lead: req(300),
    body: req(1200),
    cta: ctaSchema,
  }),
  contact: z.object({ heading: req(120), accent: z.string().trim().max(80), description: req(600) }),
});
export type HomeContent = z.infer<typeof homeSchema>;

/* ───────────────────────────── SEO ───────────────────────────── */

export const SEO_PAGES = [
  { path: "/", label: "Home" },
  { path: "/work", label: "Work" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/privacy-policy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms" },
] as const;

const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const optUrl = z.string().trim().url().optional().or(z.literal("").transform(() => undefined));

export const pageSeoSchema = z.object({
  title: optText(70),
  description: optText(170),
  ogTitle: optText(90),
  ogDescription: optText(200),
  ogImageUrl: optUrl,
  noindex: z.boolean().default(false),
});
export type PageSeo = z.infer<typeof pageSeoSchema>;

export const seoSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(60),
  defaultTitle: z.string().trim().min(1).max(90),
  defaultDescription: z.string().trim().min(1).max(170),
  shareImageUrl: optUrl,
  canonicalDomain: z.string().trim().url(),
  allowIndexing: z.boolean(),
  verification: z
    .object({
      google: optText(120),
      bing: optText(120),
    })
    .default({ google: undefined, bing: undefined }),
  pages: z.record(z.string(), pageSeoSchema).default({}),
});
export type SeoSettings = z.infer<typeof seoSettingsSchema>;

/* ─────────────────────────── Analytics ─────────────────────────── */

export const analyticsSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  /** GA4 measurement ID, e.g. G-ABC123XYZ */
  ga4MeasurementId: z
    .string()
    .trim()
    .regex(/^G-[A-Z0-9]{4,16}$/, "Use the GA4 Measurement ID, e.g. G-ABC123XYZ.")
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  /** Ask visitors for consent before any analytics cookie is set. */
  requireConsent: z.boolean().default(true),
});
export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;
