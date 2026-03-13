/** @type {import('next').NextConfig} */

const WP_ORIGIN =
  process.env.WORDPRESS_ORIGIN || "https://wp.ranibeautyclinic.com";

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
    ];
  },

  // ================================================================
  // REWRITES — Proxy WordPress pages through Next.js
  // Next.js pages always win; unmatched URLs fall through to WordPress
  // ================================================================
  async rewrites() {
    return {
      // beforeFiles: checked BEFORE Next.js routes (use sparingly)
      beforeFiles: [],

      // afterFiles: checked AFTER Next.js routes
      // If Next.js has a matching page, it wins. If not, proxy to WordPress.
      afterFiles: [
        // --- WooCommerce pages ---
        { source: "/shop", destination: `${WP_ORIGIN}/shop` },
        { source: "/shop/:path*", destination: `${WP_ORIGIN}/shop/:path*` },
        { source: "/cart", destination: `${WP_ORIGIN}/cart` },
        { source: "/cart/:path*", destination: `${WP_ORIGIN}/cart/:path*` },
        { source: "/checkout", destination: `${WP_ORIGIN}/checkout` },
        {
          source: "/checkout/:path*",
          destination: `${WP_ORIGIN}/checkout/:path*`,
        },
        { source: "/my-account", destination: `${WP_ORIGIN}/my-account` },
        {
          source: "/my-account/:path*",
          destination: `${WP_ORIGIN}/my-account/:path*`,
        },

        // --- WooCommerce product pages ---
        {
          source: "/product/:slug*",
          destination: `${WP_ORIGIN}/product/:slug*`,
        },

        // --- WordPress assets (CSS, JS, images, fonts) ---
        {
          source: "/wp-content/:path*",
          destination: `${WP_ORIGIN}/wp-content/:path*`,
        },
        {
          source: "/wp-includes/:path*",
          destination: `${WP_ORIGIN}/wp-includes/:path*`,
        },

        // --- WordPress admin panel ---
        {
          source: "/wp-admin/:path*",
          destination: `${WP_ORIGIN}/wp-admin/:path*`,
        },
        {
          source: "/wp-login.php",
          destination: `${WP_ORIGIN}/wp-login.php`,
        },

        // --- WordPress REST API & AJAX (WooCommerce depends on these) ---
        {
          source: "/wp-json/:path*",
          destination: `${WP_ORIGIN}/wp-json/:path*`,
        },
        {
          source: "/wp-admin/admin-ajax.php",
          destination: `${WP_ORIGIN}/wp-admin/admin-ajax.php`,
        },

        // --- WordPress cron (for scheduled tasks) ---
        {
          source: "/wp-cron.php",
          destination: `${WP_ORIGIN}/wp-cron.php`,
        },

        // --- WordPress XML-RPC ---
        {
          source: "/xmlrpc.php",
          destination: `${WP_ORIGIN}/xmlrpc.php`,
        },
      ],

      // fallback: catches ANY URL not matched by Next.js or afterFiles
      // Safety net — unknown WordPress pages still work
      fallback: [
        { source: "/:path*", destination: `${WP_ORIGIN}/:path*` },
      ],
    };
  },

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
        ],
      },
    ];
  },
};

export default nextConfig;
