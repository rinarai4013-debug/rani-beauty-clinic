import { MetadataRoute } from "next";
import { geoPages } from "@/data/locations/geo-pages";
import { allServiceSlugs } from "@/data/locations/geo-service-data";
import { costPages } from "@/data/cost-pages";
import { comparisonPages } from "@/data/comparisons";
import { serviceVariations } from "@/data/services/service-variations";
import { galleryPages } from "@/data/results/gallery";
import { pillarGuides } from "@/data/guides/pillar-pages";
import { blogPosts } from "@/data/blog/posts";
import { skinConcerns } from "@/data/skin-concerns";
import { aftercarePages } from "@/data/seo/aftercare-pages";
import { preparationPages } from "@/data/seo/preparation-pages";
import { demographicPages } from "@/data/seo/demographic-pages";
import { sideEffectsPages } from "@/data/seo/side-effects-pages";
import { worthItPages } from "@/data/seo/worth-it-pages";
import { firstTimePages } from "@/data/seo/first-time-pages";
import { resultsTimelinePages } from "@/data/seo/results-timeline-pages";
import { seasonalPages } from "@/data/seo/seasonal-pages";
import { financingPages } from "@/data/seo/financing-pages";
import { bodyAreaPages } from "@/data/seo/body-area-pages";
import { menPages } from "@/data/seo/men-pages";
import { agePages } from "@/data/seo/age-pages";
import { combinationPages } from "@/data/seo/combination-pages";
import { vsPages } from "@/data/seo/vs-pages";
import { pnwCities } from "@/data/locations/pnw-cities";
import { serviceGeoEntries } from "@/data/locations/service-geo";

const baseUrl = "https://www.ranibeautyclinic.com";

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
  const now = new Date().toISOString();

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
    { url: `${baseUrl}/team/dr-landfield`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/safety`, lastModified: now, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/technology`, lastModified: now, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/the-reveal`, lastModified: now, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/get-started`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/knowledge`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/faq`, lastModified: now, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/team/providers`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/tools/botox-cost-calculator`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/tools/treatment-finder`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
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

  // Gallery pages
  const galleryPageUrls: MetadataRoute.Sitemap = galleryPages.map((page) => ({
    url: `${baseUrl}/results/${page.slug}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  // Pillar guide pages
  const guidePageUrls: MetadataRoute.Sitemap = pillarGuides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  // Geo location pages (48 cities/neighborhoods)
  const locationPages: MetadataRoute.Sitemap = geoPages.map((page) => ({
    url: `${baseUrl}/locations/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Geo-service combo pages (48 locations x 18 services = 864 pages)
  const geoServicePages: MetadataRoute.Sitemap = [];
  for (const geo of geoPages) {
    for (const svc of allServiceSlugs) {
      geoServicePages.push({
        url: `${baseUrl}/locations/${geo.slug}/${svc}`,
        lastModified: now,
        priority: 0.6,
        changeFrequency: "monthly",
      });
    }
  }

  // Cost/pricing pages
  const costPageUrls: MetadataRoute.Sitemap = costPages.map((page) => ({
    url: `${baseUrl}/cost/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Comparison pages
  const comparisonPageUrls: MetadataRoute.Sitemap = comparisonPages.map((page) => ({
    url: `${baseUrl}/compare/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Service variation pages (e.g., /services/laser-hair-removal/full-brazilian)
  const aestheticVariationPages: MetadataRoute.Sitemap = serviceVariations
    .filter((v) => v.category === "aesthetic")
    .map((v) => ({
      url: `${baseUrl}/services/${v.parentSlug}/${v.slug}`,
      lastModified: now,
      priority: 0.6,
      changeFrequency: "monthly",
    }));

  // Wellness variation pages (e.g., /wellness/glp1-weight-management/semaglutide)
  const wellnessVariationPages: MetadataRoute.Sitemap = serviceVariations
    .filter((v) => v.category === "wellness")
    .map((v) => ({
      url: `${baseUrl}/wellness/${v.parentSlug}/${v.slug}`,
      lastModified: now,
      priority: 0.6,
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

  // Preparation guide pages
  const preparationPageUrls: MetadataRoute.Sitemap = preparationPages.map((page) => ({
    url: `${baseUrl}/preparation/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Demographic treatment pages
  const demographicPageUrls: MetadataRoute.Sitemap = demographicPages.map((page) => ({
    url: `${baseUrl}/treatments-for/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Side effects pages
  const sideEffectsPageUrls: MetadataRoute.Sitemap = sideEffectsPages.map((page) => ({
    url: `${baseUrl}/side-effects/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Worth-it decision pages
  const worthItPageUrls: MetadataRoute.Sitemap = worthItPages.map((page) => ({
    url: `${baseUrl}/worth-it/${page.slug}`,
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

  // Results timeline pages
  const resultsTimelinePageUrls: MetadataRoute.Sitemap = resultsTimelinePages.map((page) => ({
    url: `${baseUrl}/results-timeline/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Seasonal treatment pages
  const seasonalPageUrls: MetadataRoute.Sitemap = seasonalPages.map((page) => ({
    url: `${baseUrl}/seasonal/${page.slug}`,
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

  // Body area treatment pages
  const bodyAreaPageUrls: MetadataRoute.Sitemap = bodyAreaPages.map((page) => ({
    url: `${baseUrl}/treatment-areas/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Men's treatment guide pages
  const menPageUrls: MetadataRoute.Sitemap = menPages.map((page) => ({
    url: `${baseUrl}/men/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Age-specific treatment pages
  const agePageUrls: MetadataRoute.Sitemap = agePages.map((page) => ({
    url: `${baseUrl}/age/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Treatment combination pages
  const combinationPageUrls: MetadataRoute.Sitemap = combinationPages.map((page) => ({
    url: `${baseUrl}/combinations/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Treatment comparison (vs) pages
  const vsPageUrls: MetadataRoute.Sitemap = vsPages.map((page) => ({
    url: `${baseUrl}/vs/${page.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Near [city] geo pages (50 PNW cities)
  const nearCityPages: MetadataRoute.Sitemap = pnwCities.map((city) => ({
    url: `${baseUrl}/near/${city.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Near [city]/[service] geo-service pages (50 cities x 10 services = 500 pages)
  const nearServicePages: MetadataRoute.Sitemap = serviceGeoEntries.map((entry) => ({
    url: `${baseUrl}/near/${entry.citySlug}/${entry.serviceSlug}`,
    lastModified: now,
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
    ...nearCityPages,
    ...nearServicePages,
    ...costPageUrls,
    ...comparisonPageUrls,
    ...aestheticVariationPages,
    ...wellnessVariationPages,
    ...galleryPageUrls,
    ...guidePageUrls,
    ...concernPages,
    ...aftercarePageUrls,
    ...preparationPageUrls,
    ...demographicPageUrls,
    ...sideEffectsPageUrls,
    ...worthItPageUrls,
    ...firstTimePageUrls,
    ...resultsTimelinePageUrls,
    ...seasonalPageUrls,
    ...financingPageUrls,
    ...bodyAreaPageUrls,
    ...menPageUrls,
    ...agePageUrls,
    ...combinationPageUrls,
    ...vsPageUrls,
  ];
}
