/**
 * Production-safe seed. Every write is "create if missing": re-running it never
 * overwrites content an administrator has edited. It does NOT create admin users —
 * use `npm run admin:create` or the one-time /admin/setup page for that.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { siteSettings, hero, ticker, home } from "../src/content/site";
import { services } from "../src/content/services";
import { projects, categoryLabels } from "../src/content/projects";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readingMinutes } from "../src/lib/markdown-types";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const json = (v: unknown) => v as Prisma.InputJsonValue;

async function singleton(model: "siteSettings" | "themeSettings" | "seoSettings" | "analyticsSettings", data: unknown) {
  // @ts-expect-error — identical shape across the four singleton delegates
  await db[model].upsert({ where: { id: "default" }, create: { id: "default", data: json(data) }, update: {} });
}

async function main() {
  const { socials, ...settings } = siteSettings;
  await singleton("siteSettings", settings);
  await singleton("themeSettings", { preset: "neon-green-dark" });
  await singleton("seoSettings", {
    siteName: siteSettings.name,
    defaultTitle: "JOBITHLAL — Social Media Reels, Motion Graphics & Websites in Doha",
    defaultDescription:
      "JOBITHLAL is a creative digital studio in Doha, Qatar creating high-impact social media reels, motion graphics and conversion-focused websites.",
    canonicalDomain: siteSettings.url,
    allowIndexing: true,
    verification: {},
  });
  await singleton("analyticsSettings", { enabled: false, ga4MeasurementId: null });

  for (const [i, s] of socials.entries()) {
    await db.socialLink.upsert({ where: { platform: s.platform }, create: { platform: s.platform, url: s.url ?? null, order: i }, update: {} });
  }

  if ((await db.navigationItem.count()) === 0) {
    const header = ["Home:/#top", "Services:/#services", "Work:/#work", "Process:/#process", "About:/#about", "Contact:/#contact"];
    const footer = ["Home:/", "Services:/#services", "Work:/work", "About:/about", "Contact:/contact"];
    await db.navigationItem.createMany({
      data: [
        ...header.map((h, order) => ({ location: "HEADER" as const, label: h.split(":")[0], href: h.slice(h.indexOf(":") + 1), order })),
        ...footer.map((h, order) => ({ location: "FOOTER" as const, label: h.split(":")[0], href: h.slice(h.indexOf(":") + 1), order })),
      ],
    });
  }

  // Homepage as ordered, validated sections.
  const page = await db.page.upsert({
    where: { slug: "home" },
    create: { slug: "home", title: "Home", status: "PUBLISHED", publishedAt: new Date() },
    update: {},
  });
  const sections: [string, unknown][] = [
    ["hero", hero],
    ["ticker", ticker],
    ["services", home.services],
    ["difference", home.difference],
    ["work", home.work],
    ["process", home.process],
    ["finalCta", home.finalCta],
    ["contact", home.contact],
  ];
  for (const [order, [key, data]] of sections.entries()) {
    await db.pageSection.upsert({
      where: { pageId_key: { pageId: page.id, key } },
      create: { pageId: page.id, key, order, publishedData: json(data) },
      update: {},
    });
  }

  // Services and categories are seeded once; after that the admin owns them (deleted ones stay deleted).
  const firstRun = (await db.service.count()) === 0;
  for (const s of firstRun ? services : []) {
    await db.service.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        enabled: s.enabled,
        order: s.order,
        title: s.title,
        shortTitle: s.shortTitle,
        subtitle: s.subtitle,
        description: s.description,
        icon: s.icon,
        focal: s.media.focal,
        page: json(s.page),
        seoTitle: s.seo.title,
        seoDescription: s.seo.description,
        ctaLabel: s.cta.label,
        ctaHref: s.cta.href,
      },
      update: {},
    });
  }

  const cats = new Map<string, string>();
  if (firstRun || (await db.projectCategory.count()) === 0) {
    for (const [order, [slug, label]] of Object.entries(categoryLabels).entries()) {
      await db.projectCategory.upsert({ where: { slug }, create: { slug, label, order }, update: {} });
    }
  }
  for (const c of await db.projectCategory.findMany()) cats.set(c.slug, c.id);

  // Sample-layout projects (clearly flagged). Never created once real projects exist.
  const realCount = await db.project.count({ where: { isDemo: false } });
  if (realCount === 0) {
    for (const p of projects.filter((x) => x.isDemo && cats.has(x.category))) {
      await db.project.upsert({
        where: { slug: p.slug },
        create: {
          slug: p.slug,
          title: p.title,
          categoryId: cats.get(p.category)!,
          hideClient: p.hideClient,
          summary: p.summary,
          overview: p.overview,
          deliverables: json(p.deliverables),
          featured: p.featured,
          order: p.order,
          status: "PUBLISHED",
          isDemo: true,
          publishedAt: new Date(),
        },
        update: {},
      });
    }
  }

  const templates = [
    {
      key: "admin_inquiry",
      subject: "New inquiry: {{service}} — {{name}}",
      body: "New project inquiry from {{name}} ({{email}}).\n\n{{details}}",
    },
    {
      key: "visitor_ack",
      subject: "Thanks for getting in touch — JOBITHLAL",
      body: "Hi {{firstName}},\n\nThanks for reaching out about {{service}}. I've received your message and will get back to you soon.\n\n— Jobith Lal",
    },
  ];
  for (const t of templates) await db.emailTemplate.upsert({ where: { key: t.key }, create: t, update: {} });

  await seedBlog();
  console.log("Seed complete.");
}

const BLOG_CATEGORIES = [
  { slug: "ai-technology", name: "AI & Technology" },
  { slug: "photography", name: "Photography" },
  { slug: "videography", name: "Videography" },
  { slug: "content-creation", name: "Content Creation" },
  { slug: "creative-workflow", name: "Creative Workflow" },
  { slug: "industry-insights", name: "Industry Insights" },
];

/** Minimal front-matter reader for prisma/blog-seed/*.md (key: value lines). */
function readArticle(file: string) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter in ${file}`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  return { meta, content: m[2].trim() + "\n" };
}

/**
 * Adds the blog categories and sample articles once. A "seeded" flag in
 * BlogSettings makes sure deleted articles are never re-created on later deploys.
 */
async function seedBlog() {
  const row = await db.blogSettings.findUnique({ where: { id: "default" } });
  const data = (row?.data ?? {}) as Record<string, unknown>;
  if (data.seeded) return;

  for (const [order, c] of BLOG_CATEGORIES.entries()) {
    await db.blogCategory.upsert({ where: { slug: c.slug }, create: { ...c, order }, update: {} });
  }
  const cats = new Map((await db.blogCategory.findMany()).map((c) => [c.slug, c.id]));
  const dir = join(process.cwd(), "prisma", "blog-seed");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
    const { meta, content } = readArticle(join(dir, f));
    if (await db.blogPost.findUnique({ where: { slug: meta.slug } })) continue;
    await db.blogPost.create({
      data: {
        slug: meta.slug,
        title: meta.title,
        excerpt: meta.excerpt,
        content,
        categoryId: cats.get(meta.category) ?? null,
        coverUrl: `/blog/${meta.slug}/cover.webp`,
        coverAlt: meta.coverAlt ?? "",
        authorName: "Jobith Lal",
        featured: meta.featured === "true",
        status: "PUBLISHED",
        publishedAt: new Date(`${meta.publishedAt}T09:00:00+03:00`),
        readingMinutes: readingMinutes(content),
        seoTitle: meta.seoTitle || null,
        seoDescription: meta.seoDescription || null,
      },
    });
  }
  await db.blogSettings.upsert({
    where: { id: "default" },
    create: { id: "default", data: json({ ...data, seeded: true }) },
    update: { data: json({ ...data, seeded: true }) },
  });
  console.log("Blog sample articles added.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
