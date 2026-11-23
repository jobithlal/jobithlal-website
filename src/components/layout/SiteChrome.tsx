import { Suspense } from "react";
import { Header, HeaderShell } from "./Header";
import { Footer } from "./Footer";
import { Providers } from "./Providers";
import { getAnalyticsSettings, getAppearance, getServices, getSiteSettings } from "@/lib/content";
import { ThemeScript } from "./Theme";
import { getBlogSettings } from "@/lib/blog";
import { Analytics } from "@/components/analytics/Analytics";
import { JsonLd, siteJsonLd } from "@/lib/seo";

/** Public-site frame: header, main landmark and footer. The admin has its own layout. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [site, services, analytics, appearance, blog] = await Promise.all([getSiteSettings(), getServices(), getAnalyticsSettings(), getAppearance(), getBlogSettings()]);
  const ga = analytics.enabled && analytics.ga4MeasurementId ? analytics.ga4MeasurementId : null;
  const headerProps = {
    logo: { text: site.logoText, subtitle: site.logoSubtitle, imageUrl: site.logoImageUrl },
    services: services.map((s) => ({ slug: s.slug, title: s.title, subtitle: s.subtitle })),
    themeToggle: appearance.mode === "toggle",
    showBlog: blog.showInHeader,
  };
  return (
    <>
      <ThemeScript appearance={appearance} />
      <JsonLd data={siteJsonLd(site)} />
      <Providers>
        <Suspense fallback={<HeaderShell {...headerProps} pathname={null} />}>
          <Header {...headerProps} />
        </Suspense>
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer site={site} services={services} cookieSettings={Boolean(ga && analytics.requireConsent)} />
        {ga && (
          <Suspense fallback={null}>
            <Analytics measurementId={ga} requireConsent={analytics.requireConsent} />
          </Suspense>
        )}
      </Providers>
    </>
  );
}
