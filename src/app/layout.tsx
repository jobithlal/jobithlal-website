import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "./globals.css";
import { getSiteSettings } from "@/lib/content";

const DEFAULT_DESCRIPTION =
  "JOBITHLAL is a creative digital studio in Doha, Qatar creating high-impact social media reels, motion graphics and conversion-focused websites.";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — Social Media Reels, Motion Graphics & Websites in Doha`,
      template: `%s | ${site.name}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: site.name,
    authors: [{ name: "Jobith Lal", url: site.url }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: "/",
      title: `${site.name} — Creative Digital Studio`,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: { card: "summary_large_image" },
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
