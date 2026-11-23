"use client";

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlogCard, type BlogCardData } from "./BlogCard";

type Props = {
  posts: BlogCardData[];
  categories: { slug: string; name: string }[];
  perPage: number;
  /** Shown above the grid already, so hidden from it until the visitor filters or searches. */
  featuredSlugs?: string[];
};

const subscribeNoop = () => () => {};
const readParam = (k: string) => () => new URLSearchParams(window.location.search).get(k) ?? "";

/** Writes the current filter to the address bar so a filtered view can be shared. */
function syncUrl(category: string, q: string) {
  const url = new URL(window.location.href);
  if (category) url.searchParams.set("category", category);
  else url.searchParams.delete("category");
  if (q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url.pathname + url.search);
}

export function BlogExplorer({ posts, categories, perPage, featuredSlugs = [] }: Props) {
  // ?category= and ?q= links work; the server HTML always lists the newest posts for crawlers.
  const initialCat = useSyncExternalStore(subscribeNoop, readParam("category"), () => "");
  const initialQ = useSyncExternalStore(subscribeNoop, readParam("q"), () => "");
  const [catState, setCategory] = useState<string | null>(null);
  const [qState, setQuery] = useState<string | null>(null);
  const [shown, setShown] = useState(perPage);
  const category = catState ?? (categories.some((c) => c.slug === initialCat) ? initialCat : "");
  const query = qState ?? initialQ;
  const q = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean);
    return posts.filter((p) => {
      if (category && p.category?.slug !== category) return false;
      if (!words.length) return category ? true : !featuredSlugs.includes(p.slug);
      const hay = `${p.title} ${p.excerpt} ${p.category?.name ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [posts, category, q, featuredSlugs]);

  const visible = filtered.slice(0, shown);
  const pick = (slug: string) => {
    setCategory(slug);
    setShown(perPage);
    syncUrl(slug, query.trim());
  };

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter articles by category" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible">
          {[{ slug: "", name: "All articles" }, ...categories].map((c) => (
            <button
              key={c.slug || "all"}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => pick(c.slug)}
              className={cn(
                "relative shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
                category === c.slug ? "border-accent text-ink" : "border-line text-fg-2 hover:border-fg-2 hover:text-fg",
              )}
            >
              {category === c.slug && (
                <motion.span layoutId="blog-filter-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              )}
              <span className="relative">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full shrink-0 lg:max-w-xs">
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(perPage);
              syncUrl(category, e.target.value.trim());
            }}
            placeholder="Search articles…"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-line bg-card pl-11 pr-11 text-sm placeholder:text-muted focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                syncUrl(category, "");
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-fg"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "article" : "articles"} found
      </p>

      {visible.length ? (
        <ul className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <motion.li
              key={p.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.08 }}
            >
              <BlogCard post={p} />
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center">
          <p className="text-fg-2">No articles match{q ? ` “${query.trim()}”` : ""}.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              pick("");
            }}
            className="mt-4 text-sm font-semibold text-accent-fg underline-offset-4 hover:underline"
          >
            Show all articles
          </button>
        </div>
      )}

      {filtered.length > shown && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setShown((n) => n + perPage)}
            className="rounded-full border border-line px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent-fg"
          >
            Load more articles
          </button>
          <p className="text-xs text-muted">
            Showing {visible.length} of {filtered.length}
          </p>
        </div>
      )}
    </div>
  );
}
