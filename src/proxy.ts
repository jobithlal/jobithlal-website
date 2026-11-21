import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for the admin area: no session cookie → straight to login.
 * The real check (valid, unexpired session + role) happens on the server in
 * every admin page and server action; this only saves a render.
 */
const PUBLIC_ADMIN = ["/admin/login", "/admin/setup", "/admin/forgot-password", "/admin/reset-password"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = req.cookies.has("__Host-jl_session") || req.cookies.has("jl_session");
  const isPublic = PUBLIC_ADMIN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasCookie && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
