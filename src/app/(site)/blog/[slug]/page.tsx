import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, CalendarDays } from "lucide-react";
import { getBlogPost, getBlogPosts, relatedPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { breadcrumbJsonLd, JsonLd, seoMetadata } from "@/lib/seo";
import { siteSettings } from "@/content/site";
import { Breadcrumbs } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { BlogCard } from "@/components/blog/BlogCard";
import { ShareButtons, Toc } from "@/components/blog/ArticleAside";
import { formatPostDate, readingLabel } from "@/components/blog/format";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  // At least one entry is required for static generation; an unknown slug 404s.
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const meta = await seoMetadata(`/blog/${post.slug}`, {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    ogImageUrl: post.cover?.url,
  });
  return {
    ...meta,
    authors: [{ name: post.author, url: siteSettings.url }],
    ...(post.category ? { category: post.category.name } : {}),
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      ...(post.category ? { section: post.category.name } : {}),
      images: post.cover ? [{ url: post.cover.url, width: 1920, height: 1080, alt: post.cover.alt }] : meta.openGraph?.images,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getBlogPost(slug), getBlogPosts()]);
  if (!post) notFound();

  const { html, toc } = renderMarkdown(post.content);
  const related = relatedPosts(all, post);
  const url = new URL(`/blog/${post.slug}`, siteSettings.url).toString();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(post.category ? [{ name: post.category.name, path: `/blog?category=${post.category.slug}` }] : []),
    { name: post.title, path: `/blog/${post.slug}` },
  ];
  const showToc = toc.filter((t) => t.level === 2).length >= 3;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#article`,
          mainEntityOfPage: url,
          headline: post.title,
          description: post.seoDescription || post.excerpt,
          ...(post.cover ? { image: [new URL(post.cover.url, siteSettings.url).toString()] } : {}),
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          ...(post.category ? { articleSection: post.category.name } : {}),
          wordCount: post.content.split(/\s+/).filter(Boolean).length,
          inLanguage: "en",
          author: { "@type": "Person", "@id": `${siteSettings.url}/#person`, name: post.author, url: siteSettings.url },
          publisher: { "@id": `${siteSettings.url}/#business` },
          isPartOf: { "@id": `${new URL("/blog", siteSettings.url).toString()}#blog` },
        }}
      />

      <article>
        <header className="relative overflow-hidden pb-10 pt-32 sm:pt-40">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[40rem] rounded-full bg-accent/[0.06] blur-3xl" />
          <div className="container-x relative">
            <Reveal y={10}>
              <Breadcrumbs items={crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />
            </Reveal>
            <div className="mt-10 max-w-4xl">
              {post.category && (
                <Reveal delay={0.05}>
                  <Link
                    href={`/blog?category=${post.category.slug}`}
                    className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-fg transition-colors hover:bg-accent hover:text-ink"
                  >
                    {post.category.name}
                  </Link>
                </Reveal>
              )}
              <Reveal delay={0.1}>
                <h1 className="mt-6 font-display text-[clamp(2.1rem,1.4rem+3vw,4rem)] font-bold leading-[1.05] tracking-tight">{post.title}</h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="lead mt-6 max-w-3xl">{post.excerpt}</p>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-fg-2">
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="grid size-10 place-items-center rounded-full bg-accent font-display text-sm font-bold text-ink">
                      {post.author
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>
                      By{" "}
                      <Link href="/about" rel="author" className="font-semibold text-fg hover:text-accent-fg">
                        {post.author}
                      </Link>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted" aria-hidden />
                    <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-muted" aria-hidden />
                    {readingLabel(post.readingMinutes)}
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </header>

        {post.cover && (
          <Reveal y={30} className="container-x">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
              <Image src={post.cover.url} alt={post.cover.alt} fill priority sizes="(min-width: 1440px) 1340px, 94vw" className="object-cover" />
            </div>
          </Reveal>
        )}

        <div className="container-x mt-14 grid gap-12 pb-20 lg:mt-20 lg:grid-cols-12">
          {showToc && (
            <details className="group rounded-[var(--radius-card)] border border-line bg-card p-5 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                In this article
                <span aria-hidden className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <Toc items={toc} className="mt-4" />
            </details>
          )}

          <div className="min-w-0 lg:col-span-8 xl:col-span-7">
            <div className="prose-blog" dangerouslySetInnerHTML={{ __html: html }} />

            <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
              <p className="text-sm font-semibold">Share this article</p>
              <ShareButtons url={url} title={post.title} />
            </div>

            <aside aria-labelledby="author-heading" className="mt-10 flex gap-5 rounded-[var(--radius-card)] border border-line bg-card p-6 sm:p-8">
              <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-bold text-ink">
                {post.author
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Written by</p>
                <h2 id="author-heading" className="mt-1 font-display text-xl font-bold">
                  {post.author}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">
                  Creative director, photographer and videographer based in Doha, Qatar, producing social media reels, motion graphics and websites for brands.
                </p>
                <Link href="/about" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-fg hover:underline">
                  More about {post.author.split(" ")[0]} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </aside>
          </div>

          <aside className="hidden lg:col-span-4 lg:col-start-9 lg:block xl:col-span-3 xl:col-start-10" aria-label="Article tools">
            <div className="sticky top-28 space-y-10">
              {showToc && (
                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">In this article</p>
                  <Toc items={toc} />
                </div>
              )}
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Share</p>
                <ShareButtons url={url} title={post.title} />
              </div>
              <div className="rounded-[var(--radius-card)] border border-line bg-card p-6">
                <p className="font-display text-lg font-bold leading-snug">Planning a shoot or a campaign?</p>
                <p className="mt-2 text-sm text-fg-2">Reels, motion graphics and websites, produced in Doha.</p>
                <Link href="/contact" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-fg hover:underline">
                  Start a project <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {/* Services / contact CTA */}
      <section aria-labelledby="blog-cta" className="px-3 sm:px-5">
        <Reveal y={30}>
          <div className="relative overflow-hidden rounded-[calc(var(--radius-card)*1.5)] bg-accent px-6 py-14 text-ink sm:px-12 sm:py-20">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/30 blur-3xl" />
            <div className="relative mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Work with JOBITHLAL</p>
              <h2 id="blog-cta" className="mt-4 font-display text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
                Let’s make something people stop scrolling for.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-ink/80">
                Social media reels, motion graphics and conversion-focused websites — planned, produced and delivered from Doha, Qatar.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/contact" variant="dark">
                  Start a project
                </ButtonLink>
                <Link
                  href="/#services"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-accent"
                >
                  Explore services
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="py-[var(--section-y)]">
          <div className="container-x">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-heading" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Keep reading
              </h2>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-fg-2 hover:text-accent-fg">
                <ArrowLeft className="size-4" aria-hidden /> All articles
              </Link>
            </div>
            <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <BlogCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
