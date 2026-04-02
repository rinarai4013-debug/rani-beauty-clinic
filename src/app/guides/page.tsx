import { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog/posts";
import { costPages } from "@/data/cost-pages";
import { comparisonPages } from "@/data/comparisons";

export const metadata: Metadata = {
  title: "Treatment Guides & Expert Resources | Rani Beauty Clinic",
  description:
    "Comprehensive treatment guides from our board-certified medical team. Expert insights on Botox, laser hair removal, HydraFacial, RF microneedling, chemical peels, dermal fillers, GLP-1 weight management, and Sofwave in Renton, WA.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/guides",
  },
  openGraph: {
    title: "Treatment Guides & Expert Resources | Rani Beauty Clinic",
    description:
      "Comprehensive treatment guides from our board-certified medical team in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/guides",
    type: "website",
  },
};

interface GuideCategory {
  slug: string;
  title: string;
  description: string;
  icon: string;
  blogCategories: string[];
  blogKeywords: string[];
  costSlugs: string[];
  comparisonKeywords: string[];
}

const guideCategories: GuideCategory[] = [
  {
    slug: "botox-injectables",
    title: "Botox & Injectables Guide",
    description:
      "Everything you need to know about neuromodulators — how Botox and Dysport smooth wrinkles, what to expect during treatment, and how our board-certified neurologist delivers natural-looking results.",
    icon: "💉",
    blogCategories: ["Injectables", "Injectable Treatments"],
    blogKeywords: ["botox", "dysport", "neuromodulator", "wrinkle"],
    costSlugs: ["botox-cost"],
    comparisonKeywords: ["botox", "dysport"],
  },
  {
    slug: "laser-hair-removal",
    title: "Laser Hair Removal Guide",
    description:
      "Your complete resource for laser hair removal — sessions needed, pain management, aftercare, pricing by body area, and how our Candela GentleMax Pro Plus treats all skin tones safely.",
    icon: "✨",
    blogCategories: ["Laser Hair Removal", "Laser Treatments", "Laser"],
    blogKeywords: ["laser hair removal", "laser session", "hair removal"],
    costSlugs: ["laser-hair-removal-cost"],
    comparisonKeywords: ["laser-hair-removal"],
  },
  {
    slug: "skin-rejuvenation",
    title: "HydraFacial Guide",
    description:
      "Discover how HydraFacial MD uses patented vortex technology to cleanse, exfoliate, extract, and hydrate — delivering an immediate glow with zero downtime for every skin type.",
    icon: "🌊",
    blogCategories: ["Facials", "Skin Rejuvenation"],
    blogKeywords: ["hydrafacial", "facial", "hydration"],
    costSlugs: ["hydrafacial-cost"],
    comparisonKeywords: ["hydrafacial"],
  },
  {
    slug: "skin-rejuvenation",
    title: "RF Microneedling Guide",
    description:
      "Learn how our Cutera Secret Pro combines microneedling with radiofrequency energy to rebuild collagen from within — transforming acne scars, fine lines, and skin laxity.",
    icon: "🔬",
    blogCategories: ["Skin Rejuvenation"],
    blogKeywords: ["rf microneedling", "microneedling", "secret pro", "radiofrequency"],
    costSlugs: ["rf-microneedling-cost"],
    comparisonKeywords: ["rf-microneedling", "microneedling"],
  },
  {
    slug: "skin-rejuvenation",
    title: "Chemical Peels Guide",
    description:
      "From gentle glycolic peels to the innovative BioRePeel, explore how controlled exfoliation reveals brighter, smoother skin and addresses pigmentation, acne scarring, and sun damage.",
    icon: "🧪",
    blogCategories: ["Skin Rejuvenation", "Skincare"],
    blogKeywords: ["chemical peel", "peel", "biorepeel", "vi peel", "exfoli"],
    costSlugs: ["chemical-peels-cost", "biorepeel-cost"],
    comparisonKeywords: ["biorepeel", "peel"],
  },
  {
    slug: "botox-injectables",
    title: "Dermal Fillers Guide",
    description:
      "Understand how hyaluronic acid fillers restore volume, contour the jawline, and enhance lips — plus why your injector's expertise is the most important factor in natural-looking results.",
    icon: "💎",
    blogCategories: ["Injectables", "Injectable Treatments"],
    blogKeywords: ["filler", "dermal filler", "juvederm", "restylane", "lip", "volume"],
    costSlugs: ["dermal-fillers-cost"],
    comparisonKeywords: ["filler"],
  },
  {
    slug: "glp1-weight-management",
    title: "GLP-1 Weight Management Guide",
    description:
      "A physician-supervised deep dive into Semaglutide and Tirzepatide — how GLP-1 medications work, who qualifies, expected weight loss timelines, and our comprehensive Rani Protocol.",
    icon: "⚖️",
    blogCategories: ["Medical Wellness", "GLP-1 Skin"],
    blogKeywords: ["glp-1", "glp1", "semaglutide", "tirzepatide", "weight"],
    costSlugs: ["glp1-cost", "semaglutide-cost", "tirzepatide-cost"],
    comparisonKeywords: ["semaglutide", "tirzepatide", "liraglutide"],
  },
  {
    slug: "skin-rejuvenation",
    title: "Sofwave Skin Tightening Guide",
    description:
      "Explore how Sofwave SUPERB ultrasound technology lifts and tightens skin without surgery or downtime — FDA-cleared for the brow, jawline, and neck with results that build over months.",
    icon: "🔊",
    blogCategories: ["Skin Tightening", "Sofwave"],
    blogKeywords: ["sofwave", "skin tightening", "ultrasound", "lifting"],
    costSlugs: ["sofwave-cost"],
    comparisonKeywords: ["sofwave", "ultherapy"],
  },
];

function countRelatedBlogPosts(category: GuideCategory): number {
  return blogPosts.filter((post) => {
    const titleLower = post.title.toLowerCase();
    const categoryMatch = category.blogCategories.some(
      (c) => post.category === c
    );
    const keywordMatch = category.blogKeywords.some((kw) =>
      titleLower.includes(kw.toLowerCase())
    );
    return categoryMatch || keywordMatch;
  }).length;
}

function countRelatedCostPages(category: GuideCategory): number {
  return costPages.filter((cp) =>
    category.costSlugs.includes(cp.slug)
  ).length;
}

function countRelatedComparisons(category: GuideCategory): number {
  return comparisonPages.filter((cp) => {
    const slugLower = cp.slug.toLowerCase();
    return category.comparisonKeywords.some((kw) =>
      slugLower.includes(kw.toLowerCase())
    );
  }).length;
}

export default function GuidesHubPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-stone-50 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 mb-4">
            Rani Beauty Clinic
          </p>
          <h1 className="text-4xl font-light tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Treatment Guides{" "}
            <span className="text-amber-700">&</span> Resources
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-stone-600 leading-relaxed">
            Expert insights from our board-certified medical team. Each guide
            consolidates everything you need to know — from clinical science
            and candidacy to pricing, comparisons, and aftercare.
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              Physician-supervised care
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              Evidence-based protocols
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              Renton, WA
            </span>
          </div>
        </div>
      </section>

      {/* Guide Categories Grid */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {guideCategories.map((category) => {
              const blogCount = countRelatedBlogPosts(category);
              const costCount = countRelatedCostPages(category);
              const comparisonCount = countRelatedComparisons(category);
              const totalResources = blogCount + costCount + comparisonCount;

              // Build a dedicated slug for each card
              const cardSlug = buildCardSlug(category);

              return (
                <Link
                  key={category.title}
                  href={`/guides/${cardSlug}`}
                  className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Icon */}
                  <span className="text-3xl mb-4" aria-hidden="true">
                    {category.icon}
                  </span>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-stone-900 group-hover:text-amber-800 transition-colors">
                    {category.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-relaxed text-stone-500 flex-1">
                    {category.description}
                  </p>

                  {/* Resource Counts */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {blogCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                        {blogCount} article{blogCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {costCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {costCount} pricing guide{costCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {comparisonCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                        {comparisonCount} comparison{comparisonCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Total badge */}
                  {totalResources > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                        {totalResources} resources
                      </span>
                      <span className="text-amber-700 text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Explore &rarr;
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-stone-900 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-light text-white sm:text-3xl">
            Not Sure Which Treatment Is Right for You?
          </h2>
          <p className="mt-4 text-stone-400 leading-relaxed">
            Schedule a complimentary consultation with our medical team. We
            will assess your goals and recommend a personalized treatment plan
            tailored to your needs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://www.ranibeautyclinic.com/booking"
              className="inline-flex items-center justify-center rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Book a Consultation
            </a>
            <a
              href="tel:+14255551234"
              className="inline-flex items-center justify-center rounded-full border border-stone-600 px-8 py-3 text-sm font-semibold text-stone-300 transition-colors hover:border-stone-400 hover:text-white"
            >
              Call Us Today
            </a>
          </div>
        </div>
      </section>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Treatment Guides & Expert Resources",
            description:
              "Comprehensive treatment guides from the board-certified medical team at Rani Beauty Clinic in Renton, WA.",
            url: "https://www.ranibeautyclinic.com/guides",
            publisher: {
              "@type": "MedicalBusiness",
              name: "Rani Beauty Clinic",
              url: "https://www.ranibeautyclinic.com",
            },
          }),
        }}
      />
    </main>
  );
}

/** Maps each guide card to its specific pillar-page slug */
function buildCardSlug(category: GuideCategory): string {
  const titleToSlugMap: Record<string, string> = {
    "Botox & Injectables Guide": "botox-injectables",
    "Laser Hair Removal Guide": "laser-hair-removal",
    "HydraFacial Guide": "skin-rejuvenation",
    "RF Microneedling Guide": "skin-rejuvenation",
    "Chemical Peels Guide": "skin-rejuvenation",
    "Dermal Fillers Guide": "botox-injectables",
    "GLP-1 Weight Management Guide": "glp1-weight-management",
    "Sofwave Skin Tightening Guide": "skin-rejuvenation",
  };
  return titleToSlugMap[category.title] ?? category.slug;
}
