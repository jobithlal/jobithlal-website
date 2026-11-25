import { Hero, type HeroNavData } from "./Hero";
import { Ticker } from "./Ticker";
import { Services } from "./Services";
import { Difference } from "./Difference";
import { SelectedWork } from "./SelectedWork";
import { Process } from "./Process";
import { FinalCta } from "./FinalCta";
import { Contact } from "./Contact";
import type { HeroContent, HomeContent, Project, Service, SiteSettings, TickerContent } from "@/content/schema";

export type HomeData = {
  site: SiteSettings;
  hero: HeroContent;
  ticker: TickerContent;
  home: HomeContent;
  services: Service[];
  projects: Project[];
  visible: Record<string, boolean>;
  order?: string[];
  /** Split navigation shown inside the hero at wide widths. */
  nav?: HeroNavData;
};

const DEFAULT_ORDER = ["hero", "ticker", "services", "difference", "work", "process", "finalCta", "contact"];

/** The homepage, in the admin-defined order — shared by the live page and the draft preview. */
export function HomeSections({ site, hero, ticker, home, services, projects, visible, order = DEFAULT_ORDER, nav }: HomeData) {
  const render: Record<string, React.ReactNode> = {
    hero: <Hero hero={hero} experienceYears={site.experienceYears} services={services} socials={site.socials} nav={nav} />,
    ticker: <Ticker ticker={ticker} />,
    services: <Services content={home.services} services={services} />,
    difference: <Difference content={home.difference} />,
    work: <SelectedWork content={home.work} projects={projects} />,
    process: <Process content={home.process} />,
    finalCta: <FinalCta content={home.finalCta} />,
    contact: <Contact content={home.contact} site={site} />,
  };
  const keys = [...order, ...DEFAULT_ORDER.filter((k) => !order.includes(k))];
  return <>{keys.filter((k) => render[k] && visible[k] !== false).map((k) => <div key={k} className="contents">{render[k]}</div>)}</>;
}
