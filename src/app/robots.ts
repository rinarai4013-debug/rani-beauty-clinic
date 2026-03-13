import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/wp-admin/",
          "/wp-login.php",
          "/cart/",
          "/checkout/",
          "/my-account/",
          "/xmlrpc.php",
        ],
      },
    ],
    sitemap: "https://ranibeautyclinic.com/sitemap.xml",
  };
}
