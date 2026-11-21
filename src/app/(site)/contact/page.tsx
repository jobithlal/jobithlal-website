import type { Metadata } from "next";
import { getHome, getSiteSettings } from "@/lib/content";
import { breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Section";
import { Contact } from "@/components/sections/Contact";

export const metadata: Metadata = pageMetadata({
  title: "Contact — Start a Project",
  description:
    "Tell JOBITHLAL about your project — social media reels, motion graphics or a new website. Based in Doha, Qatar. Email, WhatsApp or the project form.",
  path: "/contact",
});

export default async function ContactPage() {
  const [home, site] = await Promise.all([getHome(), getSiteSettings()]);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <div className="container-x pt-32 sm:pt-40">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Contact" }]} />
      </div>
      <div className="-mt-12 sm:-mt-16">
        <Contact content={home.contact} site={site} headingLevel="h1" />
      </div>
    </>
  );
}
