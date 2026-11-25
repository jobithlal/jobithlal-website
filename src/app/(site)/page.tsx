import { HomeSections } from "@/components/sections/HomeSections";
import { getAppearance, getFeaturedProjects, getHero, getHome, getHomeLayout, getServices, getSiteSettings, getTicker } from "@/lib/content";
import { getBlogSettings } from "@/lib/blog";
import type { HeroNavData } from "@/components/sections/Hero";

export default async function HomePage() {
  const [site, hero, ticker, home, services, projects, layout, appearance, blog] = await Promise.all([
    getSiteSettings(),
    getHero(),
    getTicker(),
    getHome(),
    getServices(),
    getFeaturedProjects(),
    getHomeLayout(),
    getAppearance(),
    getBlogSettings(),
  ]);
  const nav: HeroNavData = {
    logo: { text: site.logoText, subtitle: site.logoSubtitle, imageUrl: site.logoImageUrl },
    services: services.map((s) => ({ slug: s.slug, title: s.title, subtitle: s.subtitle })),
    themeToggle: appearance.mode === "toggle",
    showBlog: blog.showInHeader,
  };
  return <HomeSections site={site} hero={hero} ticker={ticker} home={home} services={services} projects={projects} visible={layout.visible} order={layout.order} nav={nav} />;
}
