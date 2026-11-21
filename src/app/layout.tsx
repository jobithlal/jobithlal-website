import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "./globals.css";
import { getSeoSettings, getSiteSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo] = await Promise.all([getSiteSettings(), getSeoSettings()]);
  const indexable = seo.allowIndexing && process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";
  const image = seo.shareImageUrl ?? "/og";
  return {
    metadataBase: new URL(seo.canonicalDomain || site.url),
    title: { default: seo.defaultTitle, template: `%s | ${seo.siteName}` },
    description: seo.defaultDescription,
    applicationName: seo.siteName,
    authors: [{ name: "Jobith Lal", url: site.url }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: seo.siteName,
      locale: "en_US",
      url: "/",
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: [{ url: image, width: 1200, height: 630, alt: seo.siteName }],
    },
    twitter: { card: "summary_large_image", images: [image] },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    verification: {
      ...(seo.verification.google ? { google: seo.verification.google } : {}),
      ...(seo.verification.bing ? { other: { "msvalidate.01": seo.verification.bing } } : {}),
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#080A08",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
