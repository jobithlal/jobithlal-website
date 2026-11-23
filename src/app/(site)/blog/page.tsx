import type { Metadata } from "next";
import { getHome } from "@/lib/content";
import { getBlogCategories, getBlogPosts, getBlogSettings, type BlogPostView } from "@/lib/blog";
import { breadcrumbJsonLd, JsonLd, seoMetadata } from "@/lib/seo";
import { siteSettings } from "@/content/site";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { FinalCta } from "@/components/sections/FinalCta";
import { BlogExplorer } from "@/components/blog/BlogExplorer";
import { FeaturedBlogCard, type BlogCardData } from "@/components/blog/BlogCard";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getBlogSettings();
  return seoMetadata("/blog", {
    title: "Blog — Photography, Video & AI Content Insights",
    description: s.heroIntro.slice(0, 165),
  });
}

/** Strip the article body: cards only need summary fields. */
const card = (p: BlogPostView): BlogCardData => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  cover: p.cover,
  publishedAt: p.publishedAt,
  readingMinutes: p.readingMinutes,
});

/** Splits a heading into masked lines; the last word or two get the accent colour. */
function headingParts(title: string) {
  const words = title.trim().split(/\s+/);
  const accentCount = words.length > 4 ? 2 : 1;
  const accent = words.slice(-accentCount).join(" ");
  const rest = words.slice(0, -accentCount);
  const lines: string[] = [];
  let line = "";
  for (const w of rest) {
    if ((line + " " + w).trim().length > 26 && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return { lines, accent };
}

export default async function BlogPage() {
  const [posts, categories, settings, home] = await Promise.all([getBlogPosts(), getBlogCategories(), getBlogSettings(), getHome()]);
  const featured = (posts.filter((p) => p.featured).length ? posts.filter((p) => p.featured) : posts).slice(0, 1);
  const { lines, accent } = headingParts(settings.heroTitle);
  const url = new URL("/blog", siteSettings.url).toString();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${url}#blog`,
          name: `${siteSettings.name} Blog`,
          url,
          description: settings.heroIntro,
          publisher: { "@id": `${siteSettings.url}/#business` },
          blogPost: posts.slice(0, 20).map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: new URL(`/blog/${p.slug}`, siteSettings.url).toString(),
            datePublished: p.publishedAt,
          })),
        }}
      />
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: "Blog" }]} eyebrow={settings.heroEyebrow} lines={lines} accent={accent} lead={settings.heroIntro} />

      <section aria-label="Articles" className="pb-[var(--section-y)]">
        <div className="container-x">
          {posts.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-fg-2">New articles are on the way.</p>
          ) : (
            <>
              {featured.map((p) => (
                <Reveal key={p.slug} y={24}>
                  <p className="eyebrow mb-6">Featured</p>
                  <FeaturedBlogCard post={card(p)} priority />
                </Reveal>
              ))}
              {posts.length > 1 && (
                <div className="mt-20 border-t border-line pt-14 sm:mt-24">
                  <h2 className="sr-only">All articles</h2>
                  <BlogExplorer posts={posts.map(card)} categories={categories} perPage={settings.perPage} featuredSlugs={featured.map((p) => p.slug)} />
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <FinalCta content={home.finalCta} />
      <div className="h-[var(--section-y)]" />
    </>
  );
}
