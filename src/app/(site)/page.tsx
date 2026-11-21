import { HomeSections } from "@/components/sections/HomeSections";
import { getFeaturedProjects, getHero, getHome, getHomeLayout, getServices, getSiteSettings, getTicker } from "@/lib/content";

export default async function HomePage() {
  const [site, hero, ticker, home, services, projects, layout] = await Promise.all([
    getSiteSettings(),
    getHero(),
    getTicker(),
    getHome(),
    getServices(),
    getFeaturedProjects(),
    getHomeLayout(),
  ]);
  return <HomeSections site={site} hero={hero} ticker={ticker} home={home} services={services} projects={projects} visible={layout.visible} order={layout.order} />;
}
