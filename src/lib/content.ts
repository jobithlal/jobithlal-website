import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { siteSettings as seedSite, hero as seedHero, ticker as seedTicker, home as seedHome } from "@/content/site";
import { services as seedServices } from "@/content/services";
import { projects as seedProjects } from "@/content/projects";
import { categoryForService, inquiryValueForService } from "@/content/service-map";
import { serviceOptions as legacyServiceOptions } from "@/lib/contact-schema";
import {
  heroSchema,
  homeSchema,
  projectSchema,
  serviceSchema,
  siteSettingsSchema,
  tickerSchema,
  type HomeContent,
  seoSettingsSchema,
  analyticsSettingsSchema,
  type SeoSettings,
  type AnalyticsSettings,
  type Media,
  type Project,
  type Service,
  type SiteSettings,
} from "@/content/schema";

/**
 * Content access layer — the only way public pages read content.
 *
 * With DATABASE_URL set, content comes from PostgreSQL, validated by the same Zod
 * schemas as the seed files. Each reader is cached with a tag; admin saves call
 * `updateTag(TAGS.x)` so the next visit shows the change. If the database is
 * missing or unreachable, the seed content is served instead so the site never
 * goes blank.
 */
export const TAGS = {
  settings: "content:settings",
  home: "content:home",
  services: "content:services",
  projects: "content:projects",
  nav: "content:nav",
  seo: "content:seo",
  analytics: "content:analytics",
} as const;

async function fromDb<T>(label: string, load: () => Promise<T | null>, fallback: T): Promise<T> {
  if (!db) return fallback;
  try {
    return (await load()) ?? fallback;
  } catch (e) {
    console.error(`[content] ${label}: database read failed, serving seed content.`, e);
    return fallback;
  }
}

type Asset = { url: string; posterUrl: string | null; alt: string; type: "IMAGE" | "VIDEO" } | null;

function media(opts: { image?: Asset; mobileImage?: Asset; video?: Asset; focal?: string; alt?: string }): Media {
  const v = opts.video;
  return {
    imageUrl: opts.image?.url ?? v?.posterUrl ?? undefined,
    mobileImageUrl: opts.mobileImage?.url ?? undefined,
    videoUrl: v?.url ?? undefined,
    alt: opts.image?.alt || opts.alt || "",
    focal: opts.focal ?? "50% 50%",
  };
}

// ─────────────────────────── Settings ───────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("max");
  return fromDb(
    "settings",
    async () => {
      const [row, socials] = await Promise.all([
        db!.siteSettings.findUnique({ where: { id: "default" } }),
        db!.socialLink.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
      ]);
      if (!row) return null;
      return siteSettingsSchema.parse({
        ...(row.data as object),
        socials: socials.map((s) => ({ platform: s.platform, url: s.url ?? undefined })),
      });
    },
    seedSite,
  );
}

// ─────────────────────────── Homepage ───────────────────────────

export type HomeBundle = {
  hero: typeof seedHero;
  ticker: typeof seedTicker;
  home: HomeContent;
  visible: Record<string, boolean>;
  order: string[];
};

async function getHomeBundle(): Promise<HomeBundle> {
  "use cache";
  cacheTag(TAGS.home);
  cacheLife("max");
  const seed: HomeBundle = { hero: seedHero, ticker: seedTicker, home: seedHome, visible: {}, order: [] };
  return fromDb(
    "home",
    async () => {
      const page = await db!.page.findUnique({ where: { slug: "home" }, include: { sections: { orderBy: { order: "asc" } } } });
      if (!page) return null;
      return buildHomeBundle(page.sections.map((s) => ({ key: s.key, data: s.publishedData, visible: s.visible })));
    },
    seed,
  );
}

/**
 * Validates section JSON into the homepage shape. Invalid or missing sections
 * fall back to seed content instead of breaking the page.
 */
export function buildHomeBundle(sections: { key: string; data: unknown; visible: boolean }[]): HomeBundle {
  const by = Object.fromEntries(sections.map((s) => [s.key, s.data]));
  const pick = <T,>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, v: unknown, fallback: T): T => {
    const r = schema.safeParse(v);
    return r.success ? (r.data as T) : fallback;
  };
  return {
    hero: pick(heroSchema, by.hero, seedHero),
    ticker: pick(tickerSchema, by.ticker, seedTicker),
    home: {
      services: pick(homeSchema.shape.services, by.services, seedHome.services),
      difference: pick(homeSchema.shape.difference, by.difference, seedHome.difference),
      work: pick(homeSchema.shape.work, by.work, seedHome.work),
      process: pick(homeSchema.shape.process, by.process, seedHome.process),
      finalCta: pick(homeSchema.shape.finalCta, by.finalCta, seedHome.finalCta),
      contact: pick(homeSchema.shape.contact, by.contact, seedHome.contact),
    },
    visible: Object.fromEntries(sections.map((s) => [s.key, s.visible])),
    order: sections.map((s) => s.key),
  };
}

export async function getHero() {
  return (await getHomeBundle()).hero;
}
export async function getTicker() {
  return (await getHomeBundle()).ticker;
}
export async function getHome() {
  return (await getHomeBundle()).home;
}
/** Section visibility and order set in the admin (missing = visible, default order). */
export async function getHomeLayout() {
  const b = await getHomeBundle();
  return { visible: b.visible, order: b.order };
}

// ─────────────────────────── Services ───────────────────────────

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheTag(TAGS.services);
  cacheLife("max");
  const rows = await fromDb(
    "services",
    async () => {
      const list = await db!.service.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
        include: { image: true, video: true },
      });
      if (list.length === 0) return null;
      return list.map((s) =>
        serviceSchema.parse({
          slug: s.slug,
          enabled: s.enabled,
          order: s.order,
          title: s.title,
          shortTitle: s.shortTitle,
          subtitle: s.subtitle,
          description: s.description,
          icon: s.icon,
          media: media({ image: s.image, video: s.video, focal: s.focal }),
          page: s.page,
          seo: { title: s.seoTitle, description: s.seoDescription },
          cta: { label: s.ctaLabel, href: s.ctaHref },
        }),
      );
    },
    seedServices.filter((s) => s.enabled),
  );
  return [...rows].sort((a, b) => a.order - b.order);
}

export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

// ─────────────────────────── Projects ───────────────────────────

export const projectInclude = {
  category: true,
  cover: true,
  mobileCover: true,
  video: true,
  gallery: { orderBy: { order: "asc" as const }, include: { asset: true } },
} satisfies Prisma.ProjectInclude;

type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

/** Database row → validated public Project shape (also used by the admin preview). */
export function toProject(p: ProjectRow): Project {
  return projectSchema.parse({
    slug: p.slug,
    title: p.title,
    category: p.category.slug,
    categoryLabel: p.category.label,
    client: p.client ?? undefined,
    hideClient: p.hideClient,
    year: p.projectDate?.getFullYear(),
    summary: p.summary,
    overview: p.overview,
    challenge: p.challenge ?? undefined,
    approach: p.approach ?? undefined,
    deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
    outcome: p.outcome ?? undefined,
    outcomeVerified: p.outcomeVerified,
    cover: media({ image: p.cover, mobileImage: p.mobileCover, video: p.video, focal: p.focal, alt: p.title }),
    externalVideoUrl: p.externalVideoUrl ?? undefined,
    gallery: p.gallery.map((g) =>
      g.asset.type === "VIDEO" ? media({ video: g.asset, alt: g.caption ?? "" }) : media({ image: g.asset, alt: g.caption ?? g.asset.alt }),
    ),
    featured: p.featured,
    order: p.order,
    status: p.status === "PUBLISHED" ? "published" : "draft",
    isDemo: p.isDemo,
    seo: { title: p.seoTitle ?? undefined, description: p.seoDescription ?? undefined },
  });
}

async function getAllPublishedProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  return fromDb(
    "projects",
    async () => {
      const list = await db!.project.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: projectInclude,
      });
      return list.map(toProject);
    },
    seedProjects.filter((p) => p.status === "published"),
  );
}

export async function getProjects() {
  const [all, site] = await Promise.all([getAllPublishedProjects(), getSiteSettings()]);
  // Sample layouts disappear automatically once any real project is published.
  const hasReal = all.some((p) => !p.isDemo);
  return all.filter((p) => !p.isDemo || (site.showDemoProjects && !hasReal));
}

export async function getFeaturedProjects() {
  return (await getProjects()).filter((p) => p.featured);
}

export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

export async function getProjectsForService(slug: string) {
  const category = categoryForService(slug);
  return (await getProjects()).filter((p) => p.category === category);
}

/** Contact-form choices: one per enabled service, plus "Multiple services". */
export async function getServiceOptions() {
  const list = (await getServices()).map((s) => ({ value: inquiryValueForService(s.slug), label: s.title }));
  return [...list, { value: "multiple", label: "Multiple Services" }];
}

/** Labels for every inquiry service value ever used (incl. disabled or deleted services). Admin only. */
export async function getServiceLabels(): Promise<Record<string, string>> {
  const labels: Record<string, string> = Object.fromEntries(legacyServiceOptions.map((o) => [o.value, o.label]));
  if (db) {
    const rows = await db.service.findMany({ select: { slug: true, title: true }, orderBy: { order: "asc" } }).catch(() => []);
    for (const r of rows) labels[inquiryValueForService(r.slug)] = r.title;
  }
  return labels;
}

// ─────────────────────────── SEO & analytics ───────────────────────────

const seedSeo: SeoSettings = {
  siteName: seedSite.name,
  defaultTitle: "JOBITHLAL — Social Media Reels, Motion Graphics & Websites in Doha",
  defaultDescription:
    "JOBITHLAL is a creative digital studio in Doha, Qatar creating high-impact social media reels, motion graphics and conversion-focused websites.",
  canonicalDomain: seedSite.url,
  allowIndexing: true,
  verification: { google: undefined, bing: undefined },
  pages: {},
};

export async function getSeoSettings(): Promise<SeoSettings> {
  "use cache";
  cacheTag(TAGS.seo);
  cacheLife("max");
  return fromDb(
    "seo",
    async () => {
      const row = await db!.seoSettings.findUnique({ where: { id: "default" } });
      if (!row) return null;
      const r = seoSettingsSchema.safeParse({ ...seedSeo, ...(row.data as object) });
      return r.success ? r.data : null;
    },
    seedSeo,
  );
}

const seedAnalytics: AnalyticsSettings = { enabled: false, ga4MeasurementId: null, requireConsent: true };

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  "use cache";
  cacheTag(TAGS.analytics);
  cacheLife("max");
  return fromDb(
    "analytics",
    async () => {
      const row = await db!.analyticsSettings.findUnique({ where: { id: "default" } });
      if (!row) return null;
      const r = analyticsSettingsSchema.safeParse(row.data);
      return r.success ? r.data : null;
    },
    seedAnalytics,
  );
}
