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

      // --- Additional WordPress artifact paths (found in GSC) ---
      {
        source: "/wp-json/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/product-category/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/product-tag/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/author/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/tag/:path*",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/feed/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/comments/feed/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-sitemap:path*",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/wp-:slug.php",
        destination: "/",
        permanent: true,
      },

      // --- Old WordPress blog posts (GSC: Crawled not indexed / Duplicate canonical) ---
      {
        source: "/liposuction-what-it-is-surgery-recovery-results",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/after-aesthetic-treatment-what-matters-most",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/how-to-keep-your-skin-hydrated-with-10-simple-tips",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/best-skin-treatments-for-tight-and-glowing-skin",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/top-5-benefits-of-laser-facial-resurfacing-rejuvenation",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/having-overw-eight-and-depression-can",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/more-than-80-clinical-trials-launch-to-test-coronavirus-3",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/world-aids-day-designated-on-1-december",
        destination: "/blog",
        permanent: true,
      },

      // --- WooCommerce pages (GSC: 404) ---
      { source: "/cart", destination: "/", permanent: true },
      { source: "/checkout/:path*", destination: "/", permanent: true },
      { source: "/my-account/:path*", destination: "/", permanent: true },
      { source: "/shop/:path*", destination: "/", permanent: true },
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
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://booking.mangomint.com https://www.clarity.ms https://patient.withcherry.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://connect.facebook.net https://api.stripe.com https://booking.mangomint.com https://www.clarity.ms https://patient.withcherry.com https://api.airtable.com https://graph.facebook.com https://api.resend.com",
              "frame-src https://booking.mangomint.com https://js.stripe.com https://patient.withcherry.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
