import { MetadataRoute } from "next";

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
  "peptide-therapy",
  "nad-injections",
  "vitamin-injections",
  "hormone-therapy",
  "blood-work",
];

const blogSlugs = [
  "what-is-glp1-weight-management",
  "why-neurologist-for-botox",
  "pain-free-laser-hair-removal-guide",
  "nad-iv-therapy-brain-health",
  "best-medspa-renton-wa",
];

const locationSlugs = [
  "bellevue-wa",
  "kent-wa",
  "tukwila-wa",
  "newcastle-wa",
  "mercer-island-wa",
  "south-seattle-wa",
  "federal-way-wa",
  "auburn-wa",
  "king-county-wa",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/about`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/services`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/wellness`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/blog`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/pricing`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/results`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/privacy-policy`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${baseUrl}/terms`, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const servicePages = aestheticSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    priority: 0.8 as const,
    changeFrequency: "monthly" as const,
  }));

  const wellnessPages = wellnessSlugs.map((slug) => ({
    url: `${baseUrl}/wellness/${slug}`,
    priority: 0.8 as const,
    changeFrequency: "monthly" as const,
  }));

  const blogPages = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    priority: 0.7 as const,
    changeFrequency: "monthly" as const,
  }));

  const locationPages = locationSlugs.map((slug) => ({
    url: `${baseUrl}/locations/${slug}`,
    priority: 0.6 as const,
    changeFrequency: "monthly" as const,
  }));

  return [
    ...staticPages,
    ...servicePages,
    ...wellnessPages,
    ...blogPages,
    ...locationPages,
  ];
}
