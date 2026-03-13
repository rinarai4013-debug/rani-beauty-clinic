import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: Trailing-slash normalization
 *
 * WordPress URLs use trailing slashes (/services/laser-hair-removal/)
 * Next.js URLs do not (/services/laser-hair-removal)
 *
 * This middleware 301-redirects trailing-slash URLs to their canonical
 * non-trailing-slash form, consolidating SEO link equity from old
 * WordPress links to the new Next.js pages.
 *
 * Exception: WooCommerce paths are proxied to WordPress and must
 * keep their trailing slashes intact.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, WordPress assets, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/wp-content") ||
    pathname.startsWith("/wp-includes") ||
    pathname.startsWith("/wp-admin") ||
    pathname.startsWith("/wp-json") ||
    pathname.startsWith("/wp-login") ||
    pathname.startsWith("/wp-cron") ||
    pathname.startsWith("/xmlrpc") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // WooCommerce paths — pass through to WordPress proxy, keep trailing slash
  const wpPaths = ["/shop", "/cart", "/checkout", "/my-account", "/product"];
  if (wpPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Strip trailing slashes for all other paths (SEO canonical form)
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
