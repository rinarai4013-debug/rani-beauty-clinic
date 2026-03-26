import { NextRequest, NextResponse } from "next/server";
import { blogPosts } from "@/data/blog/posts";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import { costPages } from "@/data/cost-pages";
import { comparisonPages } from "@/data/comparisons";
import { skinConcerns } from "@/data/skin-concerns";
import { pillarGuides } from "@/data/guides/pillar-pages";
import { geoPages } from "@/data/locations/geo-pages";
import { allServiceSlugs } from "@/data/locations/geo-service-data";
import { galleryPages } from "@/data/results/gallery";
import { serviceVariations } from "@/data/services/service-variations";
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

const INDEXNOW_KEY = "fef37905157843c4ae05afb82e58b988";
const BASE_URL = "https://www.ranibeautyclinic.com";

function getAllUrls(): string[] {
  const urls: string[] = [];

  // Static pages
  urls.push(BASE_URL);
  [
    "/services", "/wellness", "/about", "/pricing", "/contact",
    "/locations", "/blog", "/results", "/team", "/team/dr-landfield",
    "/concerns", "/compare", "/technology", "/safety",
  ].forEach((p) => urls.push(`${BASE_URL}${p}`));

  // Aesthetic services
  aestheticServices.forEach((s) => urls.push(`${BASE_URL}/services/${s.slug}`));

  // Wellness services
  wellnessServices.forEach((s) => urls.push(`${BASE_URL}/wellness/${s.slug}`));

  // Blog posts
  blogPosts.forEach((p) => urls.push(`${BASE_URL}/blog/${p.slug}`));

  // Cost pages
  costPages.forEach((p) => urls.push(`${BASE_URL}/cost/${p.slug}`));

  // Comparison pages
  comparisonPages.forEach((p) => urls.push(`${BASE_URL}/compare/${p.slug}`));

  // Skin concerns
  skinConcerns.forEach((c) => urls.push(`${BASE_URL}/concerns/${c.slug}`));

  // Pillar guides
  pillarGuides.forEach((g) => urls.push(`${BASE_URL}/guides/${g.slug}`));

  // Gallery pages
  galleryPages.forEach((g) => urls.push(`${BASE_URL}/results/${g.slug}`));

  // Service variations
  serviceVariations.forEach((v) => {
    const basePath = v.category === "wellness" ? "wellness" : "services";
    urls.push(`${BASE_URL}/${basePath}/${v.parentSlug}/${v.slug}`);
  });

  // Geo location pages
  geoPages.forEach((g) => urls.push(`${BASE_URL}/locations/${g.slug}`));

  // Geo-service combo pages (48 locations × 17 services = 816 pages)
  geoPages.forEach((g) => {
    allServiceSlugs.forEach((s) => urls.push(`${BASE_URL}/locations/${g.slug}/${s}`));
  });

  // SEO programmatic pages
  urls.push(`${BASE_URL}/knowledge`);
  aftercarePages.forEach((p) => urls.push(`${BASE_URL}/aftercare/${p.slug}`));
  preparationPages.forEach((p) => urls.push(`${BASE_URL}/preparation/${p.slug}`));
  demographicPages.forEach((p) => urls.push(`${BASE_URL}/treatments-for/${p.slug}`));
  sideEffectsPages.forEach((p) => urls.push(`${BASE_URL}/side-effects/${p.slug}`));
  worthItPages.forEach((p) => urls.push(`${BASE_URL}/worth-it/${p.slug}`));
  firstTimePages.forEach((p) => urls.push(`${BASE_URL}/first-time/${p.slug}`));
  resultsTimelinePages.forEach((p) => urls.push(`${BASE_URL}/results-timeline/${p.slug}`));
  seasonalPages.forEach((p) => urls.push(`${BASE_URL}/seasonal/${p.slug}`));
  financingPages.forEach((p) => urls.push(`${BASE_URL}/financing/${p.slug}`));
  bodyAreaPages.forEach((p) => urls.push(`${BASE_URL}/treatment-areas/${p.slug}`));
  urls.push(`${BASE_URL}/faq`);
  urls.push(`${BASE_URL}/team/providers`);
  urls.push(`${BASE_URL}/tools/botox-cost-calculator`);
  urls.push(`${BASE_URL}/tools/treatment-finder`);
  urls.push(`${BASE_URL}/press`);

  return urls;
}

export async function POST(req: NextRequest) {
  // Protect with a simple secret
  const authHeader = req.headers.get("authorization");
  const secret = process.env.INDEXNOW_SECRET || "rani-indexnow-2026";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urls = getAllUrls();

  // IndexNow accepts max 10,000 URLs per request
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += 10000) {
    batches.push(urls.slice(i, i + 10000));
  }

  const results: { engine: string; status: number; count: number }[] = [];

  for (const batch of batches) {
    const payload = {
      host: "www.ranibeautyclinic.com",
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    };

    // Submit to IndexNow (Bing, Yandex, Naver, Seznam)
    const engines = [
      "https://api.indexnow.org/indexnow",
      "https://www.bing.com/indexnow",
      "https://yandex.com/indexnow",
    ];

    for (const engine of engines) {
      try {
        const res = await fetch(engine, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });
        results.push({
          engine,
          status: res.status,
          count: batch.length,
        });
      } catch (err) {
        results.push({
          engine,
          status: 0,
          count: batch.length,
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    totalUrls: urls.length,
    results,
  });
}

// GET endpoint - returns the IndexNow key for verification
export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: { "Content-Type": "text/plain" },
  });
}
