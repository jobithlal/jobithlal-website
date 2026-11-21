import type { MetadataRoute } from "next";
import { getProjects, getServices, getSiteSettings } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, services, projects] = await Promise.all([getSiteSettings(), getServices(), getProjects()]);
  const u = (p: string) => new URL(p, site.url).toString();
  return [
    { url: u("/"), changeFrequency: "weekly", priority: 1 },
    ...services.map((s) => ({ url: u(`/services/${s.slug}`), changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: u("/work"), changeFrequency: "weekly", priority: 0.8 },
    // Sample-layout projects are excluded (they are also noindex).
    ...projects.filter((p) => !p.isDemo).map((p) => ({ url: u(`/work/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: u("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.7 },
    { url: u("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: u("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
