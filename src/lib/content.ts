import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { siteSettings as seedSite, hero as seedHero, ticker as seedTicker, home as seedHome } from "@/content/site";
import { services as seedServices } from "@/content/services";
import { projects as seedProjects } from "@/content/projects";
import {
  heroSchema,
  homeSchema,
  projectSchema,
  serviceSchema,
  siteSettingsSchema,
  tickerSchema,
  type HomeContent,
  type Media,
  type Project,
  type Service,
  type ServiceSlug,
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

type HomeBundle = {
  hero: typeof seedHero;
  ticker: typeof seedTicker;
  home: HomeContent;
  visible: Record<string, boolean>;
};

async function getHomeBundle(): Promise<HomeBundle> {
  "use cache";
  cacheTag(TAGS.home);
  cacheLife("max");
  const seed: HomeBundle = { hero: seedHero, ticker: seedTicker, home: seedHome, visible: {} };
  return fromDb(
    "home",
    async () => {
      const page = await db!.page.findUnique({ where: { slug: "home" }, include: { sections: { orderBy: { order: "asc" } } } });
      if (!page) return null;
      const by = Object.fromEntries(page.sections.map((s) => [s.key, s.publishedData]));
      const visible = Object.fromEntries(page.sections.map((s) => [s.key, s.visible]));
      return {
        hero: heroSchema.parse(by.hero ?? seedHero),
        ticker: tickerSchema.parse(by.ticker ?? seedTicker),
        home: homeSchema.parse({
          services: by.services ?? seedHome.services,
          difference: by.difference ?? seedHome.difference,
          work: by.work ?? seedHome.work,
          process: by.process ?? seedHome.process,
          finalCta: by.finalCta ?? seedHome.finalCta,
          contact: by.contact ?? seedHome.contact,
        }),
        visible,
      };
    },
    seed,
  );
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
/** Section visibility set in the admin (missing = visible). */
export async function getHomeVisibility() {
  return (await getHomeBundle()).visible;
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
        include: {
          category: true,
          cover: true,
          mobileCover: true,
          video: true,
          gallery: { orderBy: { order: "asc" }, include: { asset: true } },
        },
      });
      return list.map((p) =>
        projectSchema.parse({
          slug: p.slug,
          title: p.title,
          category: p.category.slug,
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
            g.asset.type === "VIDEO"
              ? media({ video: g.asset, alt: g.caption ?? "" })
              : media({ image: g.asset, alt: g.caption ?? g.asset.alt }),
          ),
          featured: p.featured,
          order: p.order,
          status: "published",
          isDemo: p.isDemo,
          seo: { title: p.seoTitle ?? undefined, description: p.seoDescription ?? undefined },
        }),
      );
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

const serviceToCategory: Record<ServiceSlug, Project["category"]> = {
  "social-media-reels": "reels",
  "motion-graphics": "motion",
  "website-development": "websites",
};

export async function getProjectsForService(slug: ServiceSlug) {
  return (await getProjects()).filter((p) => p.category === serviceToCategory[slug]);
}
