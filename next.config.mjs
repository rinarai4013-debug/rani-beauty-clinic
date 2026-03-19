/** @type {import('next').NextConfig} */


const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,

  // ================================================================
  // 301 REDIRECTS — WordPress URL → Next.js canonical URL
  // Preserves SEO equity from old WordPress URLs
  // ================================================================
  async redirects() {
    return [
      // --- WordPress service slug mismatches ---
      {
        source: "/services/hydrafacial-md/:path*",
        destination: "/services/hydrafacial",
        permanent: true,
      },
      {
        source: "/services/botox-clinic/:path*",
        destination: "/services/botox-dysport",
        permanent: true,
      },
      {
        source: "/services/bioreapeel/:path*",
        destination: "/services/biorepeel",
        permanent: true,
      },

      // --- WordPress-only services → closest Next.js equivalent ---
      {
        source: "/services/skin-tag-removal/:path*",
        destination: "/services",
        permanent: true,
      },
      {
        source: "/services/iv-therapy/:path*",
        destination: "/wellness/vitamin-injections",
        permanent: true,
      },
      {
        source: "/services/custom-facials/:path*",
        destination: "/services/hydrafacial",
        permanent: true,
      },

      // --- WordPress /about-us/ → Next.js /about ---
      {
        source: "/about-us/:path*",
        destination: "/about",
        permanent: true,
      },

      // --- WordPress category pages → blog ---
      {
        source: "/category/:slug*",
        destination: "/blog",
        permanent: true,
      },

      // --- WordPress root-level blog posts → Next.js /blog/ ---
      {
        source: "/laser-hair-removal-everything-you-need-to-know",
        destination: "/blog/pain-free-laser-hair-removal-guide",
        permanent: true,
      },
      {
        source: "/hydrafacial-the-ultimate-guide",
        destination: "/blog/is-hydrafacial-worth-it",
        permanent: true,
      },
      {
        source: "/botox-everything-you-need-to-know",
        destination: "/blog/first-time-botox",
        permanent: true,
      },
      {
        source: "/dermal-fillers-complete-guide",
        destination: "/blog/lip-filler-guide",
        permanent: true,
      },
      {
        source: "/rf-microneedling-guide",
        destination: "/blog/rf-microneedling-acne-scars",
        permanent: true,
      },
      {
        source: "/chemical-peels-guide",
        destination: "/blog/chemical-peel-first-time",
        permanent: true,
      },
      {
        source: "/biorepeel-guide",
        destination: "/blog/biorepeel-guide",
        permanent: true,
      },
      {
        source: "/sofwave-skin-tightening",
        destination: "/blog/sofwave-vs-facelift",
        permanent: true,
      },
      {
        source: "/glp1-weight-loss-guide",
        destination: "/blog/what-is-glp1-weight-management",
        permanent: true,
      },
      {
        source: "/semaglutide-guide",
        destination: "/blog/semaglutide-side-effects",
        permanent: true,
      },
      {
        source: "/peptide-therapy-guide",
        destination: "/blog/bpc-157-guide",
        permanent: true,
      },
      {
        source: "/nad-therapy-benefits",
        destination: "/blog/nad-anti-aging",
        permanent: true,
      },
      {
        source: "/hormone-therapy-guide",
        destination: "/blog/signs-need-hrt",
        permanent: true,
      },
      {
        source: "/vitamin-injections-guide",
        destination: "/blog/vitamin-injections-vs-oral",
        permanent: true,
      },
      {
        source: "/scar-reduction-guide",
        destination: "/blog/best-treatment-acne-scars",
        permanent: true,
      },
      {
        source: "/medspa-vs-spa",
        destination: "/blog/medspa-vs-spa",
        permanent: true,
      },
      {
        source: "/first-medspa-visit",
        destination: "/blog/first-medspa-visit",
        permanent: true,
      },
      {
        source: "/choosing-a-medspa",
        destination: "/blog/how-to-choose-medspa",
        permanent: true,
      },

      // --- Catch-all WordPress artifact paths → homepage ---
      // These were causing 404 errors in Google Search Console
      {
        source: "/wp-content/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-includes/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-login.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/xmlrpc.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-cron.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/shop/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/cart/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/checkout/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/my-account/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/product/:path*",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // ================================================================
  // REWRITES — removed WordPress proxy (site is fully on Vercel now)
  // WordPress rewrites were causing 502 errors and GSC indexing issues
  // ================================================================

  // ================================================================
  // HEADERS — Security and performance
  // ================================================================
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://booking.mangomint.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.airtable.com https://graph.facebook.com https://api.resend.com https://www.google-analytics.com https://region1.google-analytics.com https://booking.mangomint.com https://api.anthropic.com https://www.clarity.ms",
              "frame-src 'self' https://booking.mangomint.com https://www.google.com https://form.typeform.com",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
