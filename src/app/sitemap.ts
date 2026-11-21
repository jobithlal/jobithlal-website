import type { MetadataRoute } from "next";
import { getProjects, getSeoSettings, getServices } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, services, projects] = await Promise.all([getSeoSettings(), getServices(), getProjects()]);
  const u = (p: string) => new URL(p, seo.canonicalDomain).toString();
  // Pages the admin marked "noindex" are left out of the sitemap.
  const hidden = (path: string) => Boolean(seo.pages[path]?.noindex);
  return ([
    { url: u("/"), changeFrequency: "weekly", priority: 1 },
    ...services.map((s) => ({ url: u(`/services/${s.slug}`), changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: u("/work"), changeFrequency: "weekly", priority: 0.8 },
    // Sample-layout projects are excluded (they are also noindex).
    ...projects.filter((p) => !p.isDemo).map((p) => ({ url: u(`/work/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: u("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.7 },
    { url: u("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: u("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ] as MetadataRoute.Sitemap).filter((e) => !hidden(new URL(e.url).pathname));
}
