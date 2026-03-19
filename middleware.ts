import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: Trailing-slash normalization + domain canonicalization
 *
 * 1. Redirects non-www to www (SEO canonical domain)
 * 2. 301-redirects trailing-slash URLs to non-trailing-slash form
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // --- Domain canonicalization: non-www → www ---
  if (
    hostname === "ranibeautyclinic.com" ||
    hostname === "http://ranibeautyclinic.com"
  ) {
    const url = request.nextUrl.clone();
    url.host = "www.ranibeautyclinic.com";
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  // Skip static files, API routes, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Strip trailing slashes for all paths (SEO canonical form)
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|eot)).*)",
  ],
};
