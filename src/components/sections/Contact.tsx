import { Mail, MapPin, MessageCircle, ArrowUpRight } from "lucide-react";
import type { HomeContent, SiteSettings } from "@/content/schema";
import { Eyebrow } from "@/components/ui/Section";
import { MaskLines, Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { getServiceOptions } from "@/lib/content";
import { formatPhone, whatsappLink } from "@/lib/utils";

export function ContactDetails({ site }: { site: SiteSettings }) {
  const items = [
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: MessageCircle, label: "WhatsApp", value: formatPhone(site.whatsapp), href: whatsappLink(site.whatsapp), external: true },
    { icon: MapPin, label: "Location", value: site.location },
  ];
  return (
    <ul className="space-y-3">
      {items.map(({ icon: Icon, label, value, href, external }) => {
        const inner = (
          <>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-ink">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
              <span className="block break-all font-display text-lg font-bold">{value}</span>
            </span>
            {href && <ArrowUpRight className="size-5 text-muted transition-all group-hover:rotate-45 group-hover:text-accent" aria-hidden />}
          </>
        );
        const cls = "group flex items-center gap-4 rounded-2xl border border-line bg-card/50 p-4 transition-colors hover:border-accent/50";
        return (
          <li key={label}>
            {href ? (
              <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {inner}
              </a>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export async function Contact({ content, site, headingLevel = "h2" }: { content: HomeContent["contact"]; site: SiteSettings; headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  const serviceOptions = await getServiceOptions();
  return (
    <section id="contact" aria-labelledby="contact-heading" className="section-y relative">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <Eyebrow>Contact</Eyebrow>
          </Reveal>
          <H id="contact-heading" className="display-lg mt-6">
            <MaskLines lines={[content.heading]} accentText={content.accent} />
          </H>
          <Reveal delay={0.15}>
            <p className="lead mt-6 max-w-md">{content.description}</p>
          </Reveal>
          <Reveal delay={0.25} className="mt-10">
            <ContactDetails site={site} />
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="rounded-[calc(var(--radius-card)+6px)] border border-line bg-card/40 p-5 sm:p-8 lg:p-10">
            <ContactForm serviceOptions={serviceOptions} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
