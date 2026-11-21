/** Media rules shared by the upload route, server actions and the uploader UI. */

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const ALLOWED_TYPES: readonly string[] = [...IMAGE_TYPES, ...VIDEO_TYPES];

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function extFor(type: string) {
  return EXT[type];
}

export function isVideo(type: string) {
  return type.startsWith("video/");
}

export function maxBytesFor(type: string) {
  return isVideo(type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

/** Lowercase, ASCII-only, hyphenated filename stem (extension is set from the verified type). */
export function safeStem(name: string) {
  const stem = name.replace(/\.[^.]+$/, "");
  return (
    stem
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file"
  );
}

/**
 * Identify a file from its first bytes (magic numbers). The claimed MIME type
 * and extension are never trusted on their own.
 */
export function sniff(b: Uint8Array): string | null {
  const s = (o: number, sig: number[]) => sig.every((v, i) => b[o + i] === v);
  const ascii = (o: number, len: number) => String.fromCharCode(...b.slice(o, o + len));
  if (s(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (s(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (s(0, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4"; // isom, mp41, mp42, M4V, iso2…
  }
  return null;
}

/** Only accept URLs from a Vercel Blob public store. */
export function isBlobUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function storageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
