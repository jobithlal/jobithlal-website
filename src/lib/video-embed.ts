/**
 * Parses YouTube / Vimeo page links into privacy-friendly embed URLs.
 * Accepts watch, youtu.be, /shorts/, /embed/, /live/, vimeo.com/<id>,
 * vimeo.com/<channel|groups…>/<id>, unlisted vimeo.com/<id>/<hash> and player.vimeo.com links.
 */
export type VideoLink = { provider: "youtube" | "vimeo"; id: string; embedUrl: string; thumbnailUrl?: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseVideoLink(raw: string | null | undefined): VideoLink | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") id = parts[0] ?? null;
    else if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) id = parts[1] ?? null;
    if (!id || !YT_ID.test(id)) return null;
    return {
      provider: "youtube",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const idx = parts.findIndex((p) => /^\d+$/.test(p));
    if (idx === -1) return null;
    const id = parts[idx];
    // Unlisted videos carry a privacy hash after the id (or as ?h=).
    const hash = u.searchParams.get("h") ?? (host === "vimeo.com" && /^[0-9a-f]{6,}$/i.test(parts[idx + 1] ?? "") ? parts[idx + 1] : null);
    return { provider: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}?dnt=1${hash ? `&h=${hash}` : ""}` };
  }
  return null;
}
