import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getSeoSettings } from "@/lib/content";
import { storageConfigured } from "@/lib/media";
import { PageHeader } from "@/components/admin/kit";
import type { PickedMedia } from "@/components/admin/MediaPicker";
import { SEO_PAGES } from "@/content/schema";
import { SeoForm } from "./SeoForm";

export const metadata: Metadata = { title: "SEO" };

/** Default descriptions each page uses when no override is set (shown as placeholders). */
const PAGE_DEFAULTS: Record<string, { title: string; description: string }> = {
  "/": { title: "", description: "" },
  "/work": {
    title: "Work — Reels, Motion Graphics & Websites",
    description: "Selected projects by JOBITHLAL across social media reels, motion graphics and website development, from a creative digital studio in Doha, Qatar.",
  },
  "/about": {
    title: "About Jobith Lal — Creative Director, Doha",
    description: "Jobith Lal brings 16+ years of creative media and digital production experience to social media reels, motion graphics and website development in Doha, Qatar.",
  },
  "/contact": {
    title: "Contact — Start a Project",
    description: "Tell JOBITHLAL about your project — social media reels, motion graphics or a new website. Based in Doha, Qatar. Email, WhatsApp or the project form.",
  },
  "/privacy-policy": { title: "Privacy Policy", description: "How JOBITHLAL collects, uses and protects personal information submitted through this website." },
  "/terms": { title: "Terms & Conditions", description: "Terms governing use of the JOBITHLAL website." },
};

export default async function SeoPage() {
  const user = await requirePage("settings:view");
  const seo = await getSeoSettings();
  const urls = [seo.shareImageUrl, ...Object.values(seo.pages).map((p) => p.ogImageUrl)].filter(Boolean) as string[];
  const assets = urls.length ? await requireDb().mediaAsset.findMany({ where: { url: { in: urls } } }) : [];
  const media: Record<string, PickedMedia> = Object.fromEntries(assets.map((a) => [a.url, { id: a.id, url: a.url, posterUrl: a.posterUrl, type: a.type, alt: a.alt }]));

  return (
    <>
      <PageHeader
        title="SEO"
        description="How the site appears in Google and when links are shared. Services and projects have their own SEO fields in their editors."
        actions={
          <>
            <a href="/sitemap.xml" target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-lg border border-line bg-bg-2 px-4 text-sm font-semibold hover:border-fg-2/50">
              Sitemap ↗
            </a>
            <a href="/robots.txt" target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-lg border border-line bg-bg-2 px-4 text-sm font-semibold hover:border-fg-2/50">
              robots.txt ↗
            </a>
          </>
        }
      />
      <SeoForm
        seo={seo}
        media={media}
        pages={SEO_PAGES.map((p) => ({ ...p, defaults: PAGE_DEFAULTS[p.path] ?? { title: "", description: "" } }))}
        canEdit={can(user.role, "seo:edit")}
        storageReady={storageConfigured()}
      />
    </>
  );
}
