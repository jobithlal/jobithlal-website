import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("eyebrow inline-flex items-center gap-3", className)}>
      <span aria-hidden className="h-px w-8 bg-accent" />
      {children}
    </p>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("container-x", className)}>{children}</div>;
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.18em] text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-line">/</span>}
            {it.href ? (
              <Link href={it.href} className="link-underline hover:text-fg">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-fg-2">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
