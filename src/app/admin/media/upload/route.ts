import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { ALLOWED_TYPES, MAX_VIDEO_BYTES, storageConfigured } from "@/lib/media";

/**
 * Issues short-lived, single-file upload tokens so the browser can upload
 * directly to Vercel Blob (large videos never pass through the server).
 * The storage credential stays on the server; the browser only gets a token
 * restricted to the allowed types and size.
 */
export async function POST(request: Request) {
  if (!storageConfigured()) {
    return NextResponse.json({ error: "Media storage isn't connected yet." }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!can(user.role, "media:upload")) return NextResponse.json({ error: "Your role can't upload media." }, { status: 403 });
  if (!(await rateLimit(`upload:${user.id}`, 120, 60 * 60_000))) {
    return NextResponse.json({ error: "Upload limit reached. Try again in an hour." }, { status: 429 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^media\/\d{4}\/\d{2}\/[a-z0-9-]+\.(jpg|png|webp|avif|gif|mp4|webm|mov)$/.test(pathname)) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: [...ALLOWED_TYPES],
          maximumSizeInBytes: MAX_VIDEO_BYTES, // images are re-checked against their own limit on registration
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          validUntil: Date.now() + 30 * 60_000,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload refused" }, { status: 400 });
  }
}
