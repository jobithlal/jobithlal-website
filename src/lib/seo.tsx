import type { Metadata } from "next";
import { siteSettings } from "@/content/site";

const site = siteSettings;
export type { SiteSettings } from "@/content/schema";

export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title?: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: title ? `${title} | ${site.name}` : site.name,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title: title ?? site.name, description },
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
