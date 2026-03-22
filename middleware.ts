import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: Domain canonicalization + trailing-slash normalization + edge headers
 *
 * 1. Redirects non-www to www (SEO canonical domain)
 * 2. 301-redirects trailing-slash URLs to non-trailing-slash form
 * 3. Adds performance/CORS headers for API routes
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
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

  // --- Subdomain canonicalization: offers.* → www ---
  // Legacy WordPress subdomain — redirect everything to main site
  if (
    hostname === "offers.ranibeautyclinic.com" ||
    hostname.startsWith("offers.")
  ) {
    const url = request.nextUrl.clone();
    url.host = "www.ranibeautyclinic.com";
    url.protocol = "https";
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // Skip static files, Next.js internals
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // --- Strip WordPress query parameters (cause noindex/duplicate issues in GSC) ---
  const wpParams = ["replytocom", "s", "remove_item", "_wpnonce", "add-to-cart", "page_id", "format"];
  const hasWpParam = wpParams.some((p) => searchParams.has(p));
  if (hasWpParam) {
    const url = request.nextUrl.clone();
    wpParams.forEach((p) => url.searchParams.delete(p));
    if (!url.searchParams.toString()) {
      url.search = "";
    }
    return NextResponse.redirect(url, 301);
  }

  // API routes: add timing and CORS headers
  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();

    // Performance monitoring
    response.headers.set("X-Response-Time", Date.now().toString());
    response.headers.set("X-Powered-By", "RaniOS");

    // CORS for webhook endpoints
    if (pathname.startsWith("/api/webhooks/")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "POST, GET, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, stripe-signature, x-mangomint-signature, x-cherry-signature"
      );
    }

    return response;
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
