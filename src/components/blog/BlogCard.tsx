import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPostDate, readingLabel } from "./format";

/** Card data only — no article body, so lists stay light. */
export type BlogCardData = {
  slug: string;
  title: string;
  excerpt: string;
  category: { slug: string; name: string } | null;
  cover: { url: string; alt: string } | null;
  publishedAt: string;
  readingMinutes: number;
};

function Cover({ post, sizes, priority, className }: { post: BlogCardData; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-card", className)}>
      {post.cover ? (
        <Image
          src={post.cover.url}
          alt={post.cover.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out)] group-hover:scale-[1.04]"
        />
      ) : (
        <div aria-hidden className="absolute inset-0 [background:radial-gradient(80%_80%_at_70%_30%,color-mix(in_srgb,var(--accent)_14%,var(--card)),var(--card))]" />
      )}
    </div>
  );
}

function Meta({ post }: { post: BlogCardData }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      {post.category && <span className="font-semibold uppercase tracking-[0.14em] text-accent-fg">{post.category.name}</span>}
      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{readingLabel(post.readingMinutes)}</span>
    </p>
  );
}

export function BlogCard({ post, headingLevel = "h3" }: { post: BlogCardData; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col">
      <Cover post={post} sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw" className="aspect-[16/10]" />
      <div className="mt-5 flex flex-1 flex-col">
        <Meta post={post} />
        <H className="mt-3 font-display text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-accent-fg">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </H>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-2">{post.excerpt}</p>
        <span aria-hidden className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fg">
          Read article <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

/** Large editorial card for featured articles. */
export function FeaturedBlogCard({ post, priority }: { post: BlogCardData; priority?: boolean }) {
  return (
    <article className="group relative grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <Cover post={post} sizes="(min-width: 1024px) 58vw, 92vw" priority={priority} className="aspect-[16/9] lg:col-span-7" />
      <div className="lg:col-span-5">
        <Meta post={post} />
        <h2 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight transition-colors group-hover:text-accent-fg sm:text-4xl">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-fg-2">{post.excerpt}</p>
        <span aria-hidden className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
          Read article <ArrowUpRight className="size-4" />
        </span>
      </div>
    </article>
  );
}
