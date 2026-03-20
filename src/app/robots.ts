import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/_next/",
          // WordPress artifact paths — save crawl budget
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
        ],
      },
    ],
    sitemap: [
      "https://www.ranibeautyclinic.com/sitemap.xml",
      "https://www.ranibeautyclinic.com/feed.xml",
    ],
  };
}
