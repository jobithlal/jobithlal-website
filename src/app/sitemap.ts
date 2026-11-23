import type { MetadataRoute } from "next";
import { getProjects, getSeoSettings, getServices } from "@/lib/content";
import { getBlogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, services, projects, posts] = await Promise.all([getSeoSettings(), getServices(), getProjects(), getBlogPosts()]);
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
    // Only published articles are returned by getBlogPosts — drafts never appear here.
    ...(posts.length ? [{ url: u("/blog"), changeFrequency: "weekly" as const, priority: 0.7, lastModified: posts[0].updatedAt }] : []),
    ...posts.map((p) => ({ url: u(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.7 },
    { url: u("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: u("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ] as MetadataRoute.Sitemap).filter((e) => !hidden(new URL(e.url).pathname));
}
