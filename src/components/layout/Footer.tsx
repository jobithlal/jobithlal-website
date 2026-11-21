import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { footerNav } from "./nav";
import { Logo } from "./Logo";
import { BackToTop, CopyrightYear } from "./FooterClient";
import type { SiteSettings, Service } from "@/content/schema";
import { formatPhone, whatsappLink } from "@/lib/utils";

export function Footer({ site, services }: { site: SiteSettings; services: Service[] }) {
  const socials = site.socials.filter((s) => s.url);
  return (
    <footer className="relative border-t border-line bg-bg">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo text={site.logoText} subtitle={site.logoSubtitle} imageUrl={site.logoImageUrl} />
          <p className="mt-6 max-w-xs text-fg-2">{site.tagline}</p>
          <ul className="mt-8 space-y-3 text-sm text-fg-2">
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-3 hover:text-accent">
                <Mail className="size-4 text-accent" aria-hidden />
                {site.email}
              </a>
            </li>
            <li>
              <a href={whatsappLink(site.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 hover:text-accent">
                <MessageCircle className="size-4 text-accent" aria-hidden />
                WhatsApp {formatPhone(site.whatsapp)}
              </a>
            </li>
            <li className="inline-flex items-center gap-3">
              <MapPin className="size-4 text-accent" aria-hidden />
              {site.location}
            </li>
          </ul>
        </div>

        <FooterCol title="Navigate" className="md:col-span-2 md:col-start-6">
          {footerNav.map((n) => (
            <li key={n.label}>
              <Link href={n.href} className="link-underline hover:text-fg">
                {n.label}
              </Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Services" className="md:col-span-3">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="link-underline hover:text-fg">
                {s.shortTitle}
              </Link>
            </li>
          ))}
        </FooterCol>

        {socials.length > 0 && (
          <FooterCol title="Follow" className="md:col-span-2">
            {socials.map((s) => (
              <li key={s.platform}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-fg">
                  {s.platform}
                </a>
              </li>
            ))}
          </FooterCol>
        )}
      </div>

      {/* Oversized wordmark */}
      <div aria-hidden className="container-x select-none overflow-hidden">
        <p className="translate-y-[18%] font-display text-[clamp(4rem,17vw,16rem)] font-bold leading-[0.8] tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_var(--border)]">
          <span className="[-webkit-text-stroke:1px_var(--accent)]">/</span>
          {site.logoText}
        </p>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © <CopyrightYear /> {site.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="link-underline hover:text-fg">
              Privacy Policy
            </Link>
            <Link href="/terms" className="link-underline hover:text-fg">
              Terms
            </Link>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h2 className="eyebrow mb-5">{title}</h2>
      <ul className="space-y-3 text-fg-2">{children}</ul>
    </div>
  );
}
