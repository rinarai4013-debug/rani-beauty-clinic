import { MetadataRoute } from "next";
import { geoPages } from "@/data/locations/geo-pages";
import { blogPosts } from "@/data/blog/posts";
import { skinConcerns } from "@/data/skin-concerns";
import { aftercarePages } from "@/data/seo/aftercare-pages";
import { demographicPages } from "@/data/seo/demographic-pages";
import { firstTimePages } from "@/data/seo/first-time-pages";
import { financingPages } from "@/data/seo/financing-pages";
import { pnwCities } from "@/data/locations/pnw-cities";
import { waCitiesExtended } from "@/data/locations/wa-cities-extended";

const baseUrl = "https://www.ranibeautyclinic.com";
const BUILD_DATE = new Date('2026-03-27').toISOString();

const aestheticSlugs = [
  "laser-hair-removal",
  "hydrafacial",
  "rf-microneedling",
  "biorepeel",
  "botox-dysport",
  "dermal-fillers",
  "red-light-therapy",
  "laser-acne-facial",
  "chemical-peels",
  "ai-skin-analysis",
  "sofwave",
  "scar-reduction",
];

const wellnessSlugs = [
  "glp1-weight-management",
  "nad-injections",
  "vitamin-injections",
  "hormone-therapy",
  "blood-work",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = BUILD_DATE;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${baseUrl}/about`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/services`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/wellness`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/blog`, lastModified: now, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/pricing`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/contact`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/results`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/locations`, lastModified: now, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/membership`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/quiz`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/compare`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/team`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/safety`, lastModified: now, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/technology`, lastModified: now, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/the-reveal`, lastModified: now, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/get-started`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/knowledge`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/faq`, lastModified: now, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/tools/botox-cost-calculator`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/press`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${baseUrl}/privacy-policy`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${baseUrl}/terms`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ];

  // Aesthetic service pages
  const servicePages: MetadataRoute.Sitemap = aestheticSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  // Wellness service pages
  const wellnessPages: MetadataRoute.Sitemap = wellnessSlugs.map((slug) => ({
    url: `${baseUrl}/wellness/${slug}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  // Blog pages (dynamic from all posts)
  const blogPageUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Geo location pages (48 cities/neighborhoods)
  const locationPages: MetadataRoute.Sitemap = geoPages.map((page) => ({
    url: `${baseUrl}/locations/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Skin concern pages
  const concernPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/concerns`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    ...skinConcerns.map((concern) => ({
      url: `${baseUrl}/concerns/${concern.slug}`,
      lastModified: now,
      priority: 0.7 as const,
      changeFrequency: "monthly" as const,
    })),
  ];

  // Aftercare guide pages
  const aftercarePageUrls: MetadataRoute.Sitemap = aftercarePages.map((page) => ({
    url: `${baseUrl}/aftercare/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // First-time experience pages
  const firstTimePageUrls: MetadataRoute.Sitemap = firstTimePages.map((page) => ({
    url: `${baseUrl}/first-time/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Financing info pages
  const financingPageUrls: MetadataRoute.Sitemap = financingPages.map((page) => ({
    url: `${baseUrl}/financing/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Near [city] geo pages (50 PNW cities + 100 extended cities = 150 total)
  const allNearbyCities = [...pnwCities, ...waCitiesExtended];
  const nearCityPages: MetadataRoute.Sitemap = allNearbyCities
    .filter((city) => ["renton", "bellevue", "kent", "newcastle", "mercer-island", "issaquah", "seattle", "federal-way"].includes(city.slug))
    .map((city) => ({
      url: `${baseUrl}/near/${city.slug}`,
      lastModified: now,
      priority: 0.7,
      changeFrequency: "monthly",
    }));

  return [
    ...staticPages,
    ...servicePages,
    ...wellnessPages,
    ...blogPageUrls,
    ...locationPages,
    ...nearCityPages,
    ...concernPages,
    ...aftercarePageUrls,
    ...firstTimePageUrls,
    ...financingPageUrls,
  ];
}
