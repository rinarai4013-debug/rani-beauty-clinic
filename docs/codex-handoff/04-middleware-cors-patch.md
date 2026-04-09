# Middleware CORS/Preflight Patch

> Generated: 2026-04-07 | Codex-ready patch spec
> Scope: root `middleware.ts` only — do NOT touch `src/middleware.ts`

---

## Problem

### 1. No OPTIONS preflight handler

The middleware declares `OPTIONS` in `Access-Control-Allow-Methods` (L64, L78) but never intercepts OPTIONS requests. When a browser sends a CORS preflight for `POST /api/contact` (or any API route), the request passes through to the route handler, which has no `OPTIONS` export and returns **405 Method Not Allowed**. The browser then blocks the actual POST.

**Current behavior:**
```
Browser → OPTIONS /api/contact → middleware (sets headers, calls next()) → route.ts (no OPTIONS export) → 405
Browser sees 405 → blocks the real POST
```

This "works" today only because:
1. Most API calls come from the same origin (no preflight needed for same-origin)
2. Simple POST requests with `Content-Type: application/json` trigger preflight in some browsers but not all
3. The Vercel edge may be papering over some cases

But it's fragile and breaks for any cross-origin call.

### 2. Single-origin CORS

Line 73 uses a single env var:
```typescript
const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://ranibeautyclinic.com";
```

If the env is `https://ranibeautyclinic.com` but the request comes from `https://www.ranibeautyclinic.com`, the browser rejects the response. The `src/middleware.ts` (dead code) has the better pattern: an explicit allowlist that reflects the requesting origin.

---

## Patch

### File: `middleware.ts` (root, 113 lines)

### Change 1: Add OPTIONS preflight handler (insert after L42, before L44)

**After the static file bypass block (L39-42), before the WordPress param block (L44):**

```typescript
  // --- Handle CORS preflight for API routes ---
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [
      "https://ranibeautyclinic.com",
      "https://www.ranibeautyclinic.com",
    ];
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
    }
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
```

**Why 204:** Standard preflight response. No body, just headers. `Max-Age: 86400` caches the preflight for 24h so browsers don't repeat it every request.

### Change 2: Replace single-origin CORS with allowlist (modify L71-74)

**Before:**
```typescript
      // All other API routes: restrict CORS to own origin only
      const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://ranibeautyclinic.com";
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
```

**After:**
```typescript
      // All other API routes: restrict CORS to known origins
      const origin = request.headers.get("origin") || "";
      const allowedOrigins = [
        "https://ranibeautyclinic.com",
        "https://www.ranibeautyclinic.com",
      ];
      if (process.env.NODE_ENV === "development") {
        allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
      }
      const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
      response.headers.set("Access-Control-Allow-Origin", corsOrigin);
```

### Change 3: Extract shared allowlist constant (optional, reduces duplication)

Add at top of file, after imports (after L1):

```typescript
function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "https://ranibeautyclinic.com",
    "https://www.ranibeautyclinic.com",
  ];
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
  }
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}
```

Then both Change 1 and Change 2 just call `getCorsOrigin(request)`.

---

## Full Patched File

```typescript
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: Domain canonicalization + trailing-slash normalization + CORS + edge headers
 */

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "https://ranibeautyclinic.com",
    "https://www.ranibeautyclinic.com",
  ];
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
  }
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

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

  // --- Handle CORS preflight for API routes ---
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    const corsOrigin = getCorsOrigin(request);
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // --- Strip WordPress query parameters ---
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
    } else {
      // All other API routes: restrict CORS to known origins
      const corsOrigin = getCorsOrigin(request);
      response.headers.set("Access-Control-Allow-Origin", corsOrigin);
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

    return response;
  }

  // --- Add X-Robots-Tag: noindex for protected/private routes ---
  const noindexPrefixes = ["/dashboard", "/portal", "/admin", "/provider", "/m/", "/tv", "/offline", "/plan/", "/lp/"];
  const isProtected = noindexPrefixes.some((prefix) => pathname.startsWith(prefix)) || pathname === "/thank-you";
  if (isProtected) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|eot)).*)",
  ],
};
```

---

## What Changed (diff summary)

| Change | Lines (old) | Lines (new) | Effect |
|--------|------------|-------------|--------|
| Add `getCorsOrigin()` helper | — | +11 | DRY CORS origin resolution |
| Add OPTIONS preflight handler | — | +12 (after old L42) | Returns 204 with correct CORS headers for all API preflight requests |
| Replace single-origin CORS | L71-74 | L95-98 | Uses allowlist instead of single env var |
| Remove `NEXT_PUBLIC_SITE_URL` dependency | L73 | — | No longer needed for CORS (still used elsewhere if set) |

**Net change:** +20 lines, 0 removed behaviors, 2 bugs fixed.

---

## Acceptance Checks

```bash
# 1. Preflight returns 204 with correct headers
curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS \
  -H "Origin: https://www.ranibeautyclinic.com" \
  -H "Access-Control-Request-Method: POST" \
  https://www.ranibeautyclinic.com/api/contact
# Expected: 204

# 2. Preflight reflects correct origin
curl -s -D - -o /dev/null \
  -X OPTIONS \
  -H "Origin: https://www.ranibeautyclinic.com" \
  https://www.ranibeautyclinic.com/api/contact \
  | grep -i "access-control-allow-origin"
# Expected: Access-Control-Allow-Origin: https://www.ranibeautyclinic.com

# 3. Unknown origin gets default, not reflection
curl -s -D - -o /dev/null \
  -X OPTIONS \
  -H "Origin: https://evil.com" \
  https://www.ranibeautyclinic.com/api/contact \
  | grep -i "access-control-allow-origin"
# Expected: Access-Control-Allow-Origin: https://ranibeautyclinic.com (default, NOT evil.com)

# 4. Normal API POST still works with CORS
curl -s -D - -o /dev/null \
  -X POST \
  -H "Origin: https://www.ranibeautyclinic.com" \
  -H "Content-Type: application/json" \
  https://www.ranibeautyclinic.com/api/health \
  | grep -i "access-control"
# Expected: Access-Control-Allow-Origin: https://www.ranibeautyclinic.com

# 5. Webhook routes still have no Allow-Origin
curl -s -D - -o /dev/null \
  https://www.ranibeautyclinic.com/api/webhooks/stripe \
  | grep -i "access-control-allow-origin"
# Expected: no match

# 6. Domain redirect still works
curl -s -o /dev/null -w "%{http_code}" http://ranibeautyclinic.com/
# Expected: 301

# 7. X-Robots-Tag still present on protected routes
curl -s -D - -o /dev/null https://www.ranibeautyclinic.com/dashboard \
  | grep -i "x-robots-tag"
# Expected: X-Robots-Tag: noindex, nofollow
```

---

## Rollback

```bash
git checkout middleware.ts
```

---

## Codex Prompt

```
Goal: Fix CORS preflight handling and replace single-origin CORS with allowlist in root middleware.

Inspect:
- middleware.ts (root, 113 lines — ACTIVE middleware)
- docs/codex-handoff/04-middleware-cors-patch.md (this spec)

Edit ONLY:
- middleware.ts

DO NOT edit:
- src/middleware.ts (dead SaaS scaffolding — leave untouched)
- next.config.mjs
- Any API route files

Changes:
1. Add getCorsOrigin() helper function after imports (extracts origin from request, checks against allowlist of ranibeautyclinic.com + www.ranibeautyclinic.com + localhost in dev)
2. Add OPTIONS preflight handler after static-file bypass (L42), before WP param block. Returns 204 with CORS headers + Max-Age 86400.
3. Replace single-origin CORS at L71-74 with getCorsOrigin() call.
4. See full patched file in docs/codex-handoff/04-middleware-cors-patch.md.

Acceptance checks:
- OPTIONS /api/contact returns 204 (not 405)
- Access-Control-Allow-Origin reflects requesting origin when in allowlist
- Unknown origins get default (ranibeautyclinic.com), NOT reflection
- Webhook routes (/api/webhooks/*) still have no Access-Control-Allow-Origin
- Domain redirect (non-www → www) still returns 301
- X-Robots-Tag still present on /dashboard

Rollback: git checkout middleware.ts
```
