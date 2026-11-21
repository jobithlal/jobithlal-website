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

  for (const s of services) {
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
  for (const [order, [slug, label]] of Object.entries(categoryLabels).entries()) {
    const c = await db.projectCategory.upsert({ where: { slug }, create: { slug, label, order }, update: {} });
    cats.set(slug, c.id);
  }

  // Sample-layout projects (clearly flagged). Never created once real projects exist.
  const realCount = await db.project.count({ where: { isDemo: false } });
  if (realCount === 0) {
    for (const p of projects.filter((x) => x.isDemo)) {
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

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
