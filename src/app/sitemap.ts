import { MetadataRoute } from "next";
import { geoPages } from "@/data/locations/geo-pages";
import { allServiceSlugs } from "@/data/locations/geo-service-data";
import { costPages } from "@/data/cost-pages";
import { comparisonPages } from "@/data/comparisons";
import { serviceVariations } from "@/data/services/service-variations";
import { galleryPages } from "@/data/results/gallery";
import { pillarGuides } from "@/data/guides/pillar-pages";
import { blogPosts } from "@/data/blog/posts";

const baseUrl = "https://ranibeautyclinic.com";

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

// Blog slugs are now dynamically pulled from the data

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1.0, changeFrequency: "weekly" },
    { url: `${baseUrl}/about`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/services`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/wellness`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/blog`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/pricing`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/results`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/locations`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/team`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/team/dr-landfield`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/safety`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/technology`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/privacy-policy`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${baseUrl}/terms`, priority: 0.3, changeFrequency: "yearly" },
  ];

  // Aesthetic service pages
  const servicePages: MetadataRoute.Sitemap = aestheticSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  // Wellness service pages
  const wellnessPages: MetadataRoute.Sitemap = wellnessSlugs.map((slug) => ({
    url: `${baseUrl}/wellness/${slug}`,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  // Blog pages (dynamic from all posts)
  const blogPageUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Gallery pages
  const galleryPageUrls: MetadataRoute.Sitemap = galleryPages.map((page) => ({
    url: `${baseUrl}/results/${page.slug}`,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  // Pillar guide pages
  const guidePageUrls: MetadataRoute.Sitemap = pillarGuides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  // Geo location pages (48 cities/neighborhoods)
  const locationPages: MetadataRoute.Sitemap = geoPages.map((page) => ({
    url: `${baseUrl}/locations/${page.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Geo-service combo pages (48 locations x 18 services = 864 pages)
  const geoServicePages: MetadataRoute.Sitemap = [];
  for (const geo of geoPages) {
    for (const svc of allServiceSlugs) {
      geoServicePages.push({
        url: `${baseUrl}/locations/${geo.slug}/${svc}`,
        priority: 0.6,
        changeFrequency: "monthly",
      });
    }
  }

  // Cost/pricing pages
  const costPageUrls: MetadataRoute.Sitemap = costPages.map((page) => ({
    url: `${baseUrl}/cost/${page.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Comparison pages
  const comparisonPageUrls: MetadataRoute.Sitemap = comparisonPages.map((page) => ({
    url: `${baseUrl}/compare/${page.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Service variation pages (e.g., /services/laser-hair-removal/full-brazilian)
  const aestheticVariationPages: MetadataRoute.Sitemap = serviceVariations
    .filter((v) => v.category === "aesthetic")
    .map((v) => ({
      url: `${baseUrl}/services/${v.parentSlug}/${v.slug}`,
      priority: 0.6,
      changeFrequency: "monthly",
    }));

  // Wellness variation pages (e.g., /wellness/glp1-weight-management/semaglutide)
  const wellnessVariationPages: MetadataRoute.Sitemap = serviceVariations
    .filter((v) => v.category === "wellness")
    .map((v) => ({
      url: `${baseUrl}/wellness/${v.parentSlug}/${v.slug}`,
      priority: 0.6,
      changeFrequency: "monthly",
    }));

  return [
    ...staticPages,
    ...servicePages,
    ...wellnessPages,
    ...blogPageUrls,
    ...locationPages,
    ...geoServicePages,
    ...costPageUrls,
    ...comparisonPageUrls,
    ...aestheticVariationPages,
    ...wellnessVariationPages,
    ...galleryPageUrls,
    ...guidePageUrls,
  ];
}
