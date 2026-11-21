import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings();
  // Indexing can be switched off in the SEO manager, or per deployment with NEXT_PUBLIC_ALLOW_INDEXING=false.
  const allow = seo.allowIndexing && process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";
  return {
    rules: allow ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/og"] }] : [{ userAgent: "*", disallow: "/" }],
    sitemap: new URL("/sitemap.xml", seo.canonicalDomain).toString(),
  };
}
