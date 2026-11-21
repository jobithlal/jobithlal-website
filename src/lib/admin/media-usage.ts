import "server-only";
import { requireDb } from "@/lib/db";

export type Usage = { label: string; href: string };

/**
 * Everywhere a media asset is referenced: foreign keys (services, projects,
 * galleries) plus URL references inside structured JSON content (page sections,
 * site settings). Used to show "where is this used" and to block unsafe deletes.
 */
export async function getAssetUsage(asset: { id: string; url: string; posterUrl?: string | null }): Promise<Usage[]> {
  const db = requireDb();
  const urls = [asset.url, asset.posterUrl].filter(Boolean) as string[];
  const [services, projects, gallery, sections, settings] = await Promise.all([
    db.service.findMany({
      where: { OR: [{ imageId: asset.id }, { videoId: asset.id }, { ogImageId: asset.id }] },
      select: { slug: true, title: true },
    }),
    db.project.findMany({
      where: { OR: [{ coverId: asset.id }, { mobileCoverId: asset.id }, { videoId: asset.id }, { ogImageId: asset.id }] },
      select: { id: true, title: true },
    }),
    db.projectMedia.findMany({ where: { assetId: asset.id }, select: { project: { select: { id: true, title: true } } } }),
    // JSON content stores URLs; a text search finds them in drafts and published data.
    Promise.all(
      urls.map((u) =>
        db.$queryRaw<{ key: string; slug: string }[]>`
          SELECT s."key", p."slug" FROM "PageSection" s JOIN "Page" p ON p."id" = s."pageId"
          WHERE s."publishedData"::text LIKE ${"%" + u + "%"} OR COALESCE(s."draftData"::text, '') LIKE ${"%" + u + "%"}`,
      ),
    ).then((r) => r.flat()),
    Promise.all(urls.map((u) => db.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SiteSettings" WHERE "data"::text LIKE ${"%" + u + "%"}`)).then((r) => r.flat()),
  ]);

  const out: Usage[] = [
    ...services.map((s) => ({ label: `Service · ${s.title}`, href: `/admin/services/${s.slug}` })),
    ...projects.map((p) => ({ label: `Project · ${p.title}`, href: `/admin/portfolio/${p.id}` })),
    ...gallery.map((g) => ({ label: `Gallery · ${g.project.title}`, href: `/admin/portfolio/${g.project.id}` })),
    ...sections.map((s) => ({ label: `Page · ${s.slug} · ${s.key}`, href: `/admin/content/${s.slug}` })),
    ...(settings.length ? [{ label: "Site settings (logo / share image)", href: "/admin/settings" }] : []),
  ];
  return out.filter((u, i, a) => a.findIndex((x) => x.label === u.label) === i);
}
