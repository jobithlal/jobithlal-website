import type { Metadata } from "next";
import { siteSettings } from "@/content/site";
import { getSeoSettings } from "@/lib/content";

const site = siteSettings;
export type { SiteSettings } from "@/content/schema";

/**
 * Metadata for a page: the admin's SEO overrides for `path` win, then the
 * page's own defaults, then the site-wide defaults from the SEO manager.
 */
export async function seoMetadata(
  path: string,
  fallback: { title?: string; description: string; noindex?: boolean; ogImageUrl?: string },
): Promise<Metadata> {
  const seo = await getSeoSettings();
  const o = seo.pages[path] ?? { noindex: false };
  const title = o.title ?? fallback.title;
  const description = o.description ?? fallback.description;
  const image = o.ogImageUrl ?? fallback.ogImageUrl ?? seo.shareImageUrl ?? "/og";
  const noindex = o.noindex || fallback.noindex || !seo.allowIndexing;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      title: o.ogTitle ?? (title ? `${title} | ${seo.siteName}` : seo.defaultTitle),
      description: o.ogDescription ?? description,
      url: path,
      siteName: seo.siteName,
      type: "website",
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: title ?? seo.siteName }],
    },
    twitter: { card: "summary_large_image", title: o.ogTitle ?? title ?? seo.defaultTitle, description: o.ogDescription ?? description, images: [image] },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

/** Organization/Person + WebSite structured data — only facts from the brief. */
export function siteJsonLd(site: typeof siteSettings = siteSettings) {
  const sameAs = site.socials.map((s) => s.url).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${site.url}/#business`,
        name: site.name,
        description: "Creative digital studio for social media reels, motion graphics and website development.",
        url: site.url,
        email: site.email,
        telephone: site.whatsapp,
        address: { "@type": "PostalAddress", addressLocality: "Doha", addressCountry: "QA" },
        areaServed: "Qatar",
        founder: { "@id": `${site.url}/#person` },
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: "Jobith Lal",
        jobTitle: "Creative Director",
        worksFor: { "@id": `${site.url}/#business` },
        url: site.url,
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": `${site.url}/#business` },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: new URL(it.path, site.url).toString(),
    })),
  };
}

export function serviceJsonLd(s: { title: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    url: new URL(`/services/${s.slug}`, site.url).toString(),
    provider: { "@id": `${site.url}/#business` },
    areaServed: "Qatar",
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escaping of "<" prevents breaking out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
