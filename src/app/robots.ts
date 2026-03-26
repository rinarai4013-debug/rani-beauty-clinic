import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── AI Crawlers - explicitly allowed for AI citation visibility ──
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
      // ── Default - all other crawlers ──
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/_next/",
          // WordPress artifact paths - save crawl budget
          "/wp-admin/",
          "/wp-content/",
          "/wp-includes/",
          "/wp-json/",
          "/wp-login.php",
          "/xmlrpc.php",
          "/wp-cron.php",
          // WooCommerce paths
          "/cart/",
          "/checkout/",
          "/my-account/",
          "/product/",
          "/product-category/",
          "/product-tag/",
          "/shop/",
          // WordPress dynamic parameters
          "/*?s=*",
          "/*?replytocom=*",
          "/*?remove_item=*",
          "/*?add-to-cart=*",
          // WordPress feeds & archives
          "/feed/",
          "/comments/feed/",
          "/author/",
          "/tag/",
          "/category/",
          // WordPress custom post types
          "/service_category/",
          "/cmsms_doctor/",
          // WordPress dynamic parameters (additional)
          "/*?templately_library=*",
          "/*?wc-ajax=*",
          "/*?post_type=*",
          "/*?p=*",
        ],
      },
    ],
    sitemap: [
      "https://www.ranibeautyclinic.com/sitemap.xml",
      "https://www.ranibeautyclinic.com/feed.xml",
    ],
  };
}
