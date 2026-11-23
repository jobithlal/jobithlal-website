"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import type { TocItem } from "@/lib/markdown-types";
import { cn } from "@/lib/utils";

/** Table of contents with the current section highlighted while reading. */
export function Toc({ items, className }: { items: TocItem[]; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label="Table of contents" className={className}>
      <ol className="space-y-2.5 border-l border-line text-sm">
        {items.map((i) => (
          <li key={i.id} className={i.level === 3 ? "pl-7" : "pl-4"}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "true" : undefined}
              className={cn(
                "-ml-px block border-l-2 pl-3 leading-snug transition-colors",
                active === i.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
                i.level === 3 ? "-ml-[13px]" : "-ml-[17px]",
              )}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const LinkedinIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={p.className} fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);
const FacebookIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={p.className} fill="currentColor">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
  </svg>
);
const XIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={p.className} fill="currentColor">
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.828l-5.35-6.993L4.6 22H1.34l8.02-9.17L1 2h7l4.83 6.39L18.244 2Zm-1.197 18h1.8L7.04 3.9H5.1L17.047 20Z" />
  </svg>
);

/** Share links (no third-party scripts) plus copy-link. */
export function ShareButtons({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: LinkedinIcon },
    { label: "Share on X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, Icon: XIcon },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: FacebookIcon },
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, Icon: MessageCircle },
  ];
  const btn = "grid size-10 place-items-center rounded-full border border-line text-fg-2 transition-colors hover:border-accent hover:text-accent-fg";
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={btn}>
          <Icon className="size-4" />
        </a>
      ))}
      <button
        type="button"
        className={btn}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? <Check className="size-4 text-accent-fg" /> : <Link2 className="size-4" />}
      </button>
    </div>
  );
}
