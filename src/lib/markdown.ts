import "server-only";
import { Marked, type Tokens } from "marked";

/**
 * Renders blog Markdown to HTML on the server (so articles are fully crawlable).
 * - Raw HTML in the Markdown is escaped, never rendered.
 * - h2/h3 get stable ids and are returned as a table of contents.
 * - Images become <figure> with lazy loading and an optional caption (the image title).
 * - External links open in a new tab with rel="noopener noreferrer".
 */

export type { TocItem } from "./markdown-types";
import type { TocItem } from "./markdown-types";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Plain text for the table of contents (React escapes it again when rendering). */
const decode = (s: string) =>
  s.replace(/&(quot|#39|amp|lt|gt);/g, (_, e: string) => ({ quot: '"', "#39": "'", amp: "&", lt: "<", gt: ">" })[e]!);

/** Only http(s), mailto, tel, site-relative and in-page links are allowed. */
const safeHref = (href: string) => (/^(https?:|mailto:|tel:|\/(?!\/)|#)/i.test(href) ? href : "#");

export function renderMarkdown(md: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      html(token: Tokens.HTML | Tokens.Tag) {
        return escape(token.text);
      },
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        const level = Math.min(Math.max(token.depth, 2), 4); // the page owns the single <h1>
        if (level > 3) return `<h4>${inner}</h4>\n`;
        let id = slugify(token.text) || "section";
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n + 1}`;
        toc.push({ id, text: decode(inner.replace(/<[^>]+>/g, "")), level: level as 2 | 3 });
        return `<h${level} id="${id}">${inner}</h${level}>\n`;
      },
      link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Link) {
        const href = safeHref(token.href);
        const external = /^https?:/i.test(href);
        const title = token.title ? ` title="${escape(token.title)}"` : "";
        const ext = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${escape(href)}"${title}${ext}>${this.parser.parseInline(token.tokens)}</a>`;
      },
      image(token: Tokens.Image) {
        const src = /^(https:\/\/|\/(?!\/))/.test(token.href) ? token.href : "";
        if (!src) return "";
        const caption = token.title ? `<figcaption>${escape(token.title)}</figcaption>` : "";
        return `<figure><img src="${escape(src)}" alt="${escape(token.text)}" loading="lazy" decoding="async" width="1600" height="900" />${caption}</figure>`;
      },
      paragraph(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Paragraph) {
        // A paragraph that only holds an image renders as a bare <figure> (no <p> wrapper).
        if (token.tokens.length === 1 && token.tokens[0].type === "image") return this.parser.parseInline(token.tokens);
        return `<p>${this.parser.parseInline(token.tokens)}</p>\n`;
      },
    },
  });

  const html = marked.parse(md, { async: false }) as string;
  return { html, toc };
}

export { readingMinutes } from "./markdown-types";
