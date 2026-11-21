import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteSettings();
  // Set NEXT_PUBLIC_ALLOW_INDEXING=false on preview/staging deployments.
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";
  return {
    rules: allow ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }] : [{ userAgent: "*", disallow: "/" }],
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
