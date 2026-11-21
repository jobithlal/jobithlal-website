import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { Services } from "@/components/sections/Services";
import { Difference } from "@/components/sections/Difference";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Process } from "@/components/sections/Process";
import { FinalCta } from "@/components/sections/FinalCta";
import { Contact } from "@/components/sections/Contact";
import { getFeaturedProjects, getHero, getHome, getHomeVisibility, getServices, getSiteSettings, getTicker } from "@/lib/content";

export default async function HomePage() {
  const [site, hero, ticker, home, services, projects, visible] = await Promise.all([
    getSiteSettings(),
    getHero(),
    getTicker(),
    getHome(),
    getServices(),
    getFeaturedProjects(),
    getHomeVisibility(),
  ]);
  const show = (key: string) => visible[key] !== false;

  return (
    <>
      {show("hero") && <Hero hero={hero} experienceYears={site.experienceYears} />}
      {show("ticker") && <Ticker ticker={ticker} />}
      {show("services") && <Services content={home.services} services={services} />}
      {show("difference") && <Difference content={home.difference} />}
      {show("work") && <SelectedWork content={home.work} projects={projects} />}
      {show("process") && <Process content={home.process} />}
      {show("finalCta") && <FinalCta content={home.finalCta} />}
      {show("contact") && <Contact content={home.contact} site={site} />}
    </>
  );
}
