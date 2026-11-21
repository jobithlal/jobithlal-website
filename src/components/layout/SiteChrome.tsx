import { Header } from "./Header";
import { Footer } from "./Footer";
import { Providers } from "./Providers";
import { getServices, getSiteSettings } from "@/lib/content";
import { JsonLd, siteJsonLd } from "@/lib/seo";

/** Public-site frame: header, main landmark and footer. The admin has its own layout. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [site, services] = await Promise.all([getSiteSettings(), getServices()]);
  return (
    <>
      <JsonLd data={siteJsonLd(site)} />
      <Providers>
        <Header
          logo={{ text: site.logoText, subtitle: site.logoSubtitle, imageUrl: site.logoImageUrl }}
          services={services.map((s) => ({ slug: s.slug, title: s.title, subtitle: s.subtitle }))}
        />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer site={site} services={services} />
      </Providers>
    </>
  );
}
