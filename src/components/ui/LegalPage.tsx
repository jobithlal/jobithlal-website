import type { ReactNode } from "react";
import { Breadcrumbs } from "./Section";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="container-x pb-[var(--section-y)] pt-32 sm:pt-40">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: title }]} />
      <header className="mt-10 max-w-3xl border-b border-line pb-10">
        <h1 className="display-lg">{title}</h1>
        <p className="mt-4 text-sm uppercase tracking-[0.18em] text-muted">Last updated {updated}</p>
      </header>
      <div className="mt-10 max-w-3xl space-y-8 leading-relaxed text-fg-2 [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
