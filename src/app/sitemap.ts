import { MetadataRoute } from "next";
import { geoPages } from "@/data/locations/geo-pages";
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
import { comparisonPages } from "@/data/comparisons";
import { pnwCities } from "@/data/locations/pnw-cities";
import { waCitiesExtended } from "@/data/locations/wa-cities-extended";
import { serviceGeoEntries } from "@/data/locations/service-geo";
import { extendedServiceGeoEntries } from "@/data/locations/service-geo-extended";
import { publishedCityServicePages } from "@/data/programmatic-seo/city-service-pages";

const baseUrl = "https://www.ranibeautyclinic.com";

// Use fixed dates reflecting actual content updates, not build time.
const CONTENT_LAST_UPDATED = "2026-04-05T00:00:00.000Z";
const GEO_LAST_UPDATED = "2026-03-15T00:00:00.000Z";
const BLOG_LAST_UPDATED = "2026-04-05T00:00:00.000Z";

const aestheticSlugs = [
  "laser-hair-removal", "hydrafacial", "rf-microneedling", "biorepeel",
  "botox-dysport", "dermal-fillers", "red-light-therapy", "laser-acne-facial",
  "chemical-peels", "ai-skin-analysis", "sofwave", "scar-reduction",
  "cosmelan-peel", "microneedling-arrissence-undereye",
];

const wellnessSlugs = [
  "glp1-weight-management", "nad-injections", "vitamin-injections",
  "hormone-therapy", "blood-work",
];

// Single flat sitemap at /sitemap.xml — Next.js 14 generateSitemaps() does not
// auto-generate a sitemap index, leaving /sitemap.xml as a 404 and hiding every
// sub-sitemap from Google. ~3,100 URLs fits comfortably under Google's
// 50,000-URL / 50MB limits.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...buildCoreSitemap(),
    ...buildBlogSitemap(),
    ...buildSeoContentSitemap(),
    ...buildGeoHubSitemap(),
    ...buildNearServiceSitemap("a-k"),
    ...buildNearServiceSitemap("l-z"),
  ];
}

// ── Sub-sitemap 0: Core pages (~250 URLs) ────────────────────────────
function buildCoreSitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: CONTENT_LAST_UPDATED, priority: 1.0, changeFrequency: "weekly" },
    { url: `${baseUrl}/about`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/services`, lastModified: CONTENT_LAST_UPDATED, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/wellness`, lastModified: CONTENT_LAST_UPDATED, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/blog`, lastModified: BLOG_LAST_UPDATED, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/pricing`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/contact`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/results`, lastModified: CONTENT_LAST_UPDATED, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/locations`, lastModified: CONTENT_LAST_UPDATED, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/membership`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/quiz`, lastModified: CONTENT_LAST_UPDATED, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/team`, lastModified: CONTENT_LAST_UPDATED, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/team/dr-landfield`, lastModified: CONTENT_LAST_UPDATED, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/safety`, lastModified: CONTENT_LAST_UPDATED, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/technology`, lastModified: CONTENT_LAST_UPDATED, priority: 0.6, changeFrequency: "yearly" },
    { url: `${baseUrl}/the-reveal`, lastModified: CONTENT_LAST_UPDATED, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/get-started`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/knowledge`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/faq`, lastModified: CONTENT_LAST_UPDATED, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/team/providers`, lastModified: CONTENT_LAST_UPDATED, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/tools/botox-cost-calculator`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/tools/treatment-finder`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/guides`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/press`, lastModified: CONTENT_LAST_UPDATED, priority: 0.6, changeFrequency: "monthly" },
    { url: `${baseUrl}/glp1`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/concerns`, lastModified: CONTENT_LAST_UPDATED, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/privacy-policy`, lastModified: CONTENT_LAST_UPDATED, priority: 0.3, changeFrequency: "yearly" },
    { url: `${baseUrl}/terms`, lastModified: CONTENT_LAST_UPDATED, priority: 0.3, changeFrequency: "yearly" },
  ];

  const servicePages: MetadataRoute.Sitemap = aestheticSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const wellnessPages: MetadataRoute.Sitemap = wellnessSlugs.map((slug) => ({
    url: `${baseUrl}/wellness/${slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const aestheticVariationPages: MetadataRoute.Sitemap = serviceVariations
    .filter((v) => v.category === "aesthetic")
    .map((v) => ({
      url: `${baseUrl}/services/${v.parentSlug}/${v.slug}`,
      lastModified: CONTENT_LAST_UPDATED,
      priority: 0.6,
      changeFrequency: "monthly",
    }));

  const wellnessVariationPages: MetadataRoute.Sitemap = serviceVariations
    .filter((v) => v.category === "wellness")
    .map((v) => ({
      url: `${baseUrl}/wellness/${v.parentSlug}/${v.slug}`,
      lastModified: CONTENT_LAST_UPDATED,
      priority: 0.6,
      changeFrequency: "monthly",
    }));

  const galleryPageUrls: MetadataRoute.Sitemap = galleryPages.map((page) => ({
    url: `${baseUrl}/results/${page.slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  const guidePageUrls: MetadataRoute.Sitemap = pillarGuides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const concernPages: MetadataRoute.Sitemap = skinConcerns.map((concern) => ({
    url: `${baseUrl}/concerns/${concern.slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  // Comparison pages — /vs/ URLs only (canonical). /compare/ 301-redirects here.
  // Include slugs from both vsPages and comparisonPages (deduplicated)
  const allVsSlugs = new Set([
    ...vsPages.map((p) => p.slug),
    ...comparisonPages.map((p) => p.slug),
  ]);
  const vsPageUrls: MetadataRoute.Sitemap = Array.from(allVsSlugs).map((slug) => ({
    url: `${baseUrl}/vs/${slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const costPageUrls: MetadataRoute.Sitemap = [
    "laser-hair-removal-cost", "hydrafacial-cost", "rf-microneedling-cost", "botox-cost",
    "dermal-fillers-cost", "chemical-peels-cost", "biorepeel-cost", "sofwave-cost",
    "scar-reduction-cost", "glp1-cost", "semaglutide-cost", "tirzepatide-cost",
    "peptide-therapy-cost", "nad-injections-cost", "hormone-therapy-cost", "testosterone-cost",
    "vitamin-injections-cost", "blood-work-cost",
  ].map((slug) => ({
    url: `${baseUrl}/cost/${slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  return [
    ...staticPages,
    ...servicePages,
    ...wellnessPages,
    ...aestheticVariationPages,
    ...wellnessVariationPages,
    ...galleryPageUrls,
    ...guidePageUrls,
    ...concernPages,
    ...vsPageUrls,
    ...costPageUrls,
  ];
}

// ── Sub-sitemap 1: Blog posts (~192 URLs) ───────────────────────────
function buildBlogSitemap(): MetadataRoute.Sitemap {
  return blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: parseBlogDate(post.date) || BLOG_LAST_UPDATED,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));
}

/** Parse "January 15, 2026" → ISO date string, or null if unparseable */
function parseBlogDate(dateStr: string): string | null {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

// ── Sub-sitemap 2: SEO content pages (~307 URLs) ────────────────────
function buildSeoContentSitemap(): MetadataRoute.Sitemap {
  const allSeoPages: MetadataRoute.Sitemap = [
    ...aftercarePages.map((p) => ({ url: `${baseUrl}/aftercare/${p.slug}` })),
    ...preparationPages.map((p) => ({ url: `${baseUrl}/preparation/${p.slug}` })),
    ...demographicPages.map((p) => ({ url: `${baseUrl}/treatments-for/${p.slug}` })),
    ...sideEffectsPages.map((p) => ({ url: `${baseUrl}/side-effects/${p.slug}` })),
    ...worthItPages.map((p) => ({ url: `${baseUrl}/worth-it/${p.slug}` })),
    ...firstTimePages.map((p) => ({ url: `${baseUrl}/first-time/${p.slug}` })),
    ...resultsTimelinePages.map((p) => ({ url: `${baseUrl}/results-timeline/${p.slug}` })),
    ...seasonalPages.map((p) => ({ url: `${baseUrl}/seasonal/${p.slug}` })),
    ...financingPages.map((p) => ({ url: `${baseUrl}/financing/${p.slug}` })),
    ...bodyAreaPages.map((p) => ({ url: `${baseUrl}/treatment-areas/${p.slug}` })),
    ...menPages.map((p) => ({ url: `${baseUrl}/men/${p.slug}` })),
    ...agePages.map((p) => ({ url: `${baseUrl}/age/${p.slug}` })),
    ...combinationPages.map((p) => ({ url: `${baseUrl}/combinations/${p.slug}` })),
  ];

  return allSeoPages.map((entry) => ({
    ...entry,
    lastModified: CONTENT_LAST_UPDATED,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));
}

// ── Sub-sitemap 3: Geo hub pages (~175 URLs) ────────────────────────
function buildGeoHubSitemap(): MetadataRoute.Sitemap {
  const locationPages: MetadataRoute.Sitemap = geoPages.map((page) => ({
    url: `${baseUrl}/locations/${page.slug}`,
    lastModified: GEO_LAST_UPDATED,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  const allNearbyCities = [...pnwCities, ...waCitiesExtended];
  const nearCityPages: MetadataRoute.Sitemap = allNearbyCities.map((city) => ({
    url: `${baseUrl}/near/${city.slug}`,
    lastModified: GEO_LAST_UPDATED,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  const programmaticCityServicePages: MetadataRoute.Sitemap = publishedCityServicePages.map(
    (page) => ({
      url: page.canonicalUrl,
      lastModified: page.lastReviewed,
      priority: 0.7,
      changeFrequency: "monthly",
    })
  );

  return [...locationPages, ...nearCityPages, ...programmaticCityServicePages];
}

// ── Sub-sitemaps 4-5: Near service pages (~2,250 URLs split A-K / L-Z) ─
function buildNearServiceSitemap(range: "a-k" | "l-z"): MetadataRoute.Sitemap {
  const allEntries = [...serviceGeoEntries, ...extendedServiceGeoEntries];

  const filtered = allEntries.filter((entry) => {
    const firstChar = entry.citySlug.charAt(0).toLowerCase();
    if (range === "a-k") return firstChar >= "a" && firstChar <= "k";
    return firstChar >= "l" && firstChar <= "z";
  });

  return filtered.map((entry) => ({
    url: `${baseUrl}/near/${entry.citySlug}/${entry.serviceSlug}`,
    lastModified: GEO_LAST_UPDATED,
    priority: 0.4,
    changeFrequency: "monthly" as const,
  }));
}
