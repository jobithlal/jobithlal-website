import { z } from "zod";

/**
 * Structured content models.
 *
 * Every piece of public content is described by a Zod schema. In Phases 1–4 the
 * values come from the seed files in this folder; in Phase 5 the same schemas
 * validate rows loaded from PostgreSQL, so the public components never change.
 */

export const ctaSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(300),
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
  eyebrow: z.string(),
  lines: z.array(z.string()).min(1).max(4),
  /** Index of the line rendered in the accent colour. */
  accentLine: z.number().int().min(0),
  description: z.string(),
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
  items: z.array(z.string()).min(1),
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
  title: z.string(),
  shortTitle: z.string(),
  subtitle: z.string(),
  description: z.string(),
  icon: z.enum(["clapperboard", "sparkles", "code"]),
  media: mediaSchema,
  page: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    accent: z.string(),
    subheading: z.string(),
    intro: z.string(),
    features: z.array(z.object({ title: z.string(), text: z.string() })),
    process: z.array(z.object({ title: z.string(), text: z.string() })),
    faqs: z.array(faqSchema),
  }),
  seo: z.object({ title: z.string(), description: z.string() }),
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
  title: z.string(),
  text: z.string(),
  icon: z.enum(["message", "target", "zap", "send"]),
});
export type ProcessStep = z.infer<typeof processStepSchema>;

export const valuePropSchema = z.object({
  title: z.string(),
  text: z.string(),
  icon: z.enum(["target", "layers", "cpu", "zap"]),
});

export const statSchema = z.object({
  value: z.string(),
  label: z.string(),
  /** Statistics only render when the administrator has marked them verified. */
  verified: z.boolean(),
});

export const homeSchema = z.object({
  services: z.object({ eyebrow: z.string(), heading: z.string(), description: z.string() }),
  difference: z.object({
    eyebrow: z.string(),
    headingLines: z.array(z.string()),
    accent: z.string(),
    body: z.string(),
    portrait: mediaSchema,
    values: z.array(valuePropSchema).length(4),
    stats: z.array(statSchema),
  }),
  work: z.object({ eyebrow: z.string(), heading: z.string(), description: z.string() }),
  process: z.object({ eyebrow: z.string(), heading: z.string(), steps: z.array(processStepSchema) }),
  finalCta: z.object({
    heading: z.string(),
    lead: z.string(),
    body: z.string(),
    cta: ctaSchema,
  }),
  contact: z.object({ heading: z.string(), accent: z.string(), description: z.string() }),
});
export type HomeContent = z.infer<typeof homeSchema>;
