import { NextRequest, NextResponse } from "next/server";

const PRODUCTION_CORS_ORIGINS = [
  "https://ranibeautyclinic.com",
  "https://www.ranibeautyclinic.com",
];

const DEVELOPMENT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  const allowedOrigins =
    process.env.NODE_ENV === "development"
      ? [...PRODUCTION_CORS_ORIGINS, ...DEVELOPMENT_CORS_ORIGINS]
      : PRODUCTION_CORS_ORIGINS;

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.ranibeautyclinic.com";
}

function setApiCorsHeaders(response: NextResponse, request: NextRequest) {
  response.headers.set("Access-Control-Allow-Origin", getCorsOrigin(request));
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
}

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
  const wpParams = ["replytocom", "s", "remove_item", "_wpnonce", "add-to-cart", "page_id", "format", "templately_library", "post_type", "p", "wc-ajax", "ver"];
  const hasWpParam = wpParams.some((p) => searchParams.has(p));
  if (hasWpParam) {
    const url = request.nextUrl.clone();
    wpParams.forEach((p) => url.searchParams.delete(p));
    if (!url.searchParams.toString()) {
      url.search = "";
    }
    return NextResponse.redirect(url, 301);
  }

  // API routes: add CORS headers (restricted by route type)
  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS" && !pathname.startsWith("/api/webhooks/")) {
      const response = new NextResponse(null, { status: 204 });
      setApiCorsHeaders(response, request);
      return response;
    }

    const response = NextResponse.next();

    // Webhook routes (server-to-server) — no CORS headers needed
    if (pathname.startsWith("/api/webhooks/")) {
      response.headers.set(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, stripe-signature, x-mangomint-signature, x-cherry-signature"
      );
      // No Access-Control-Allow-Origin — webhooks are server-to-server
    } else {
      // All other API routes: restrict CORS to own origin only
      setApiCorsHeaders(response, request);
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
