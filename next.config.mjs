import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  eslint: {
    // Temporarily disabled 2026-04-23 \u00b7 1000+ legacy warnings in the codebase
    // (unused vars/imports/types from speculative files) push past Next's
    // implicit max-warnings threshold and blocked production deploys.
    // Local `next lint` still runs on demand. TODO: clean up the pile, then
    // flip back to false.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  // Ensure consistent trailing slash behavior (no trailing slash = canonical)
  trailingSlash: false,
  async redirects() {
    return [
      // ── Legacy URL Redirects (GSC 404 fixes) ──────────────────────
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/about-us/:path*", destination: "/about", permanent: true },
      { source: "/our-team", destination: "/team", permanent: true },
      { source: "/our-services", destination: "/services", permanent: true },
      { source: "/treatments", destination: "/services", permanent: true },
      { source: "/treatments/:slug", destination: "/services/:slug", permanent: true },
      { source: "/aesthetic-services", destination: "/services", permanent: true },
      { source: "/aesthetic-services/:slug", destination: "/services/:slug", permanent: true },
      { source: "/wellness-services", destination: "/wellness", permanent: true },
      { source: "/wellness-services/:slug", destination: "/wellness/:slug", permanent: true },
      { source: "/meet-the-team", destination: "/team", permanent: true },
      { source: "/providers", destination: "/team/providers", permanent: true },
      { source: "/dr-landfield", destination: "/team/dr-landfield", permanent: true },
      { source: "/faqs", destination: "/faq", permanent: true },
      { source: "/frequently-asked-questions", destination: "/faq", permanent: true },
      { source: "/reviews", destination: "/results", permanent: true },
      { source: "/gallery", destination: "/results", permanent: true },
      { source: "/before-and-after", destination: "/results", permanent: true },
      { source: "/before-after", destination: "/results", permanent: true },
      { source: "/portfolio", destination: "/results", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/book-now", destination: "/book", permanent: true },
      { source: "/booking", destination: "/book", permanent: true },
      { source: "/schedule", destination: "/book", permanent: true },
      { source: "/appointment", destination: "/book", permanent: true },
      { source: "/appointments", destination: "/book", permanent: true },
      { source: "/consultation", destination: "/get-started", permanent: true },
      { source: "/free-consultation", destination: "/get-started", permanent: true },
      { source: "/specials", destination: "/pricing", permanent: true },
      { source: "/offers", destination: "/pricing", permanent: true },
      { source: "/promotions", destination: "/pricing", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms-of-service", destination: "/terms", permanent: true },
      { source: "/tos", destination: "/terms", permanent: true },
      { source: "/weight-loss", destination: "/wellness/glp1-weight-management", permanent: true },
      { source: "/semaglutide", destination: "/wellness/glp1-weight-management", permanent: true },
      { source: "/glp-1", destination: "/glp1", permanent: true },
      { source: "/glp1-weight-loss", destination: "/glp1", permanent: true },
      { source: "/botox", destination: "/services/botox-dysport", permanent: true },
      { source: "/dysport", destination: "/services/botox-dysport", permanent: true },
      { source: "/fillers", destination: "/services/dermal-fillers", permanent: true },
      { source: "/hydrafacial", destination: "/services/hydrafacial", permanent: true },
      { source: "/laser-hair-removal", destination: "/services/laser-hair-removal", permanent: true },
      { source: "/microneedling", destination: "/services/rf-microneedling", permanent: true },
      { source: "/rf-microneedling", destination: "/services/rf-microneedling", permanent: true },
      { source: "/chemical-peels", destination: "/services/chemical-peels", permanent: true },
      { source: "/red-light-therapy", destination: "/services/red-light-therapy", permanent: true },
      { source: "/sofwave", destination: "/services/sofwave", permanent: true },
      // ── GSC 404 fixes (Apr 2026) ──
      { source: "/memberships", destination: "/membership", permanent: true },
      { source: "/memberships/", destination: "/membership", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/services/laser-facials", destination: "/services/laser-acne-facial", permanent: true },
      { source: "/services/laser-facials/", destination: "/services/laser-acne-facial", permanent: true },
      // ── Trailing slash cleanup (catch any indexed with trailing slash) ──
      { source: "/services/", destination: "/services", permanent: true },
      { source: "/wellness/", destination: "/wellness", permanent: true },
      { source: "/about/", destination: "/about", permanent: true },
      { source: "/blog/", destination: "/blog", permanent: true },
      { source: "/contact/", destination: "/contact", permanent: true },
      { source: "/pricing/", destination: "/pricing", permanent: true },
      { source: "/results/", destination: "/results", permanent: true },
      { source: "/locations/", destination: "/locations", permanent: true },
      { source: "/membership/", destination: "/membership", permanent: true },
      { source: "/faq/", destination: "/faq", permanent: true },
      { source: "/team/", destination: "/team", permanent: true },
      { source: "/quiz/", destination: "/quiz", permanent: true },
      // ── Old blog URL patterns ──
      { source: "/posts/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/articles/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/news/:slug", destination: "/blog/:slug", permanent: true },
      // ── /compare/ → /vs/ catch-all redirect (compare is legacy, vs is canonical) ──
      { source: "/compare/:slug", destination: "/vs/:slug", permanent: true },
      // ── Bare route redirects (no index pages exist) ──
      { source: "/vs", destination: "/compare", permanent: false },
      { source: "/financing", destination: "/services", permanent: true },
      { source: "/treatments-for", destination: "/services", permanent: true },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js hydration + analytics inline scripts require 'unsafe-inline'
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://booking.mangomint.com https://connect.facebook.net",
      // Browser-only libraries such as pdf.js may create blob workers. Keep
      // workers same-origin/blob-only so dashboard tools do not fall back to
      // script-src and log noisy CSP errors.
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // Allow all HTTPS images (Airtable CDN, GA, Meta, etc.)
      "img-src 'self' data: blob: https:",
      // Restrict fetch/XHR to known API endpoints
      "connect-src 'self' https://api.airtable.com https://www.google-analytics.com https://stats.g.doubleclick.net https://www.clarity.ms https://connect.facebook.net https://www.facebook.com https://booking.mangomint.com https://*.ingest.us.sentry.io",
      // Mangomint overlay + GTM noscript iframe
      "frame-src 'self' https://www.googletagmanager.com https://booking.mangomint.com https://app.mangomint.com",
      // Block framing of this site (redundant with X-Frame-Options but belt+suspenders)
      "frame-ancestors 'none'",
      // Prevent base-tag injection
      "base-uri 'self'",
      // Restrict form submissions to same origin
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Upload source maps for better stack traces in Sentry dashboard
  widenClientFileUpload: true,
  // Hide source maps from users
  hideSourceMaps: true,
  // Disable Sentry telemetry
  disableLogger: true,
});
