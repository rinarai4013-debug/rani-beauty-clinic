import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pillarGuides } from "@/data/guides/pillar-pages";
import { blogPosts } from "@/data/blog/posts";
import { costPages } from "@/data/cost-pages";
import { comparisonPages } from "@/data/comparisons";

/* ─── Slug → filter config ──────────────────────────────────────────── */

interface GuideFilterConfig {
  blogCategories: string[];
  blogKeywords: string[];
  costSlugs: string[];
  comparisonKeywords: string[];
  serviceLinks: { href: string; label: string }[];
}

const GUIDE_FILTERS: Record<string, GuideFilterConfig> = {
  "laser-hair-removal": {
    blogCategories: ["Laser Hair Removal", "Laser Treatments", "Laser"],
    blogKeywords: ["laser hair removal", "laser session", "hair removal"],
    costSlugs: ["laser-hair-removal-cost"],
    comparisonKeywords: ["laser-hair-removal", "laser-vs", "vs-laser"],
    serviceLinks: [
      { href: "/services/laser-hair-removal", label: "Laser Hair Removal Service" },
    ],
  },
  "botox-injectables": {
    blogCategories: ["Injectables", "Injectable Treatments"],
    blogKeywords: ["botox", "dysport", "filler", "dermal filler", "neuromodulator", "injectable", "lip", "wrinkle"],
    costSlugs: ["botox-cost", "dermal-fillers-cost"],
    comparisonKeywords: ["botox", "dysport", "filler"],
    serviceLinks: [
      { href: "/services/botox-dysport", label: "Botox & Dysport" },
      { href: "/services/dermal-fillers", label: "Dermal Fillers" },
    ],
  },
  "skin-rejuvenation": {
    blogCategories: ["Facials", "Skin Rejuvenation", "Skin Tightening", "Sofwave", "Skincare"],
    blogKeywords: ["hydrafacial", "microneedling", "chemical peel", "biorepeel", "sofwave", "skin tightening", "facial", "peel"],
    costSlugs: ["hydrafacial-cost", "rf-microneedling-cost", "chemical-peels-cost", "biorepeel-cost", "sofwave-cost"],
    comparisonKeywords: ["hydrafacial", "microneedling", "peel", "sofwave", "ultherapy", "facial"],
    serviceLinks: [
      { href: "/services/hydrafacial", label: "HydraFacial" },
      { href: "/services/rf-microneedling", label: "RF Microneedling" },
      { href: "/services/chemical-peels", label: "Chemical Peels" },
      { href: "/services/biorepeel", label: "BioRePeel" },
      { href: "/services/sofwave", label: "Sofwave" },
    ],
  },
  "glp1-weight-management": {
    blogCategories: ["Medical Wellness", "GLP-1 Skin"],
    blogKeywords: ["glp-1", "glp1", "semaglutide", "tirzepatide", "weight management", "weight loss"],
    costSlugs: ["glp1-cost", "semaglutide-cost", "tirzepatide-cost"],
    comparisonKeywords: ["semaglutide", "tirzepatide", "liraglutide"],
    serviceLinks: [
      { href: "/wellness/glp1-weight-management", label: "GLP-1 Weight Management" },
    ],
  },
  "wellness-optimization": {
    blogCategories: ["Medical Wellness", "Wellness"],
    blogKeywords: ["peptide", "nad+", "nad ", "vitamin injection", "bpc-157", "wellness"],
    costSlugs: ["peptide-therapy-cost", "nad-injections-cost", "vitamin-injections-cost"],
    comparisonKeywords: ["nad", "peptide", "hgh"],
    serviceLinks: [
      { href: "/wellness/nad-injections", label: "NAD+ Injections" },
      { href: "/wellness/vitamin-injections", label: "Vitamin Injections" },
    ],
  },
  "hormone-therapy": {
    blogCategories: ["Medical Wellness"],
    blogKeywords: ["hormone", "testosterone", "hrt", "thyroid", "estrogen"],
    costSlugs: ["hormone-therapy-cost", "testosterone-cost", "blood-work-cost"],
    comparisonKeywords: ["hormone", "testosterone"],
    serviceLinks: [
      { href: "/wellness/hormone-therapy", label: "Hormone Therapy" },
      { href: "/wellness/blood-work", label: "Blood Work" },
    ],
  },
};

/* ─── Static params ─────────────────────────────────────────────────── */

export function generateStaticParams() {
  return pillarGuides.map((g) => ({ slug: g.slug }));
}

/* ─── Metadata ──────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const guide = pillarGuides.find((g) => g.slug === params.slug);
  if (!guide) {
    return { title: "Guide Not Found" };
  }

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: `https://www.ranibeautyclinic.com/guides/${guide.slug}`,
      type: "article",
    },
  };
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function getRelatedPosts(config: GuideFilterConfig) {
  return blogPosts.filter((post) => {
    const titleLower = post.title.toLowerCase();
    const categoryMatch = config.blogCategories.some(
      (c) => post.category === c
    );
    const keywordMatch = config.blogKeywords.some((kw) =>
      titleLower.includes(kw.toLowerCase())
    );
    return categoryMatch || keywordMatch;
  });
}

function getRelatedCostPages(config: GuideFilterConfig) {
  return costPages.filter((cp) => config.costSlugs.includes(cp.slug));
}

function getRelatedComparisons(config: GuideFilterConfig) {
  return comparisonPages.filter((cp) => {
    const slugLower = cp.slug.toLowerCase();
    return config.comparisonKeywords.some((kw) =>
      slugLower.includes(kw.toLowerCase())
    );
  });
}

/* ─── Page Component ────────────────────────────────────────────────── */

export default function GuideSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const guide = pillarGuides.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  const config = GUIDE_FILTERS[params.slug];
  const relatedPosts = config ? getRelatedPosts(config) : [];
  const relatedCosts = config ? getRelatedCostPages(config) : [];
  const relatedComparisons = config ? getRelatedComparisons(config) : [];
  const serviceLinks = config?.serviceLinks ?? [];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-stone-50 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/guides"
            className="inline-flex items-center text-sm text-amber-700 hover:text-amber-800 mb-6 transition-colors"
          >
            &larr; All Guides
          </Link>
          <h1 className="text-3xl font-light tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-stone-600 leading-relaxed">
            {guide.heroSubtitle}
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-stone-500">
            {relatedPosts.length > 0 && (
              <span>{relatedPosts.length} articles</span>
            )}
            {relatedCosts.length > 0 && (
              <span>{relatedCosts.length} pricing guide{relatedCosts.length !== 1 ? "s" : ""}</span>
            )}
            {relatedComparisons.length > 0 && (
              <span>{relatedComparisons.length} comparison{relatedComparisons.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Sidebar — Table of Contents + Quick Links */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              {/* TOC */}
              <nav>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 mb-4">
                  In This Guide
                </h2>
                <ul className="space-y-2">
                  {guide.tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-stone-600 hover:text-amber-700 transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a
                      href="#faq"
                      className="text-sm text-stone-600 hover:text-amber-700 transition-colors"
                    >
                      FAQs
                    </a>
                  </li>
                </ul>
              </nav>

              {/* Quick Links */}
              {(relatedCosts.length > 0 ||
                relatedComparisons.length > 0 ||
                serviceLinks.length > 0) && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 mb-4">
                    Quick Links
                  </h2>
                  <ul className="space-y-2">
                    {relatedCosts.map((cp) => (
                      <li key={cp.slug}>
                        <Link
                          href={`/cost/${cp.slug}`}
                          className="text-sm text-amber-700 hover:text-amber-800 transition-colors"
                        >
                          {cp.service} Pricing &rarr;
                        </Link>
                      </li>
                    ))}
                    {relatedComparisons.slice(0, 4).map((cp) => (
                      <li key={cp.slug}>
                        <Link
                          href={`/compare/${cp.slug}`}
                          className="text-sm text-stone-600 hover:text-amber-700 transition-colors"
                        >
                          {cp.treatmentA} vs {cp.treatmentB}
                        </Link>
                      </li>
                    ))}
                    {serviceLinks.map((sl) => (
                      <li key={sl.href}>
                        <Link
                          href={sl.href}
                          className="text-sm text-stone-600 hover:text-amber-700 transition-colors"
                        >
                          {sl.label} Service Page
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Booking CTA */}
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-5">
                <p className="text-sm font-semibold text-stone-800">
                  Ready to get started?
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Schedule your complimentary consultation today.
                </p>
                <a
                  href="https://www.ranibeautyclinic.com/booking"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Book a Consultation
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-w-0">
            {/* Pillar Guide Sections */}
            <article className="space-y-12">
              {guide.sections.map((section) => (
                <section key={section.id} id={section.id}>
                  <h2 className="text-2xl font-semibold text-stone-900 mb-4">
                    {section.heading}
                  </h2>
                  <div className="prose prose-stone max-w-none prose-p:leading-relaxed prose-p:text-stone-600">
                    {section.content.split("\n\n").map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </article>

            {/* Pricing Section */}
            {relatedCosts.length > 0 && (
              <section className="mt-16 pt-12 border-t border-stone-200">
                <h2 className="text-2xl font-semibold text-stone-900 mb-6">
                  Pricing & Cost Guides
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedCosts.map((cp) => (
                    <Link
                      key={cp.slug}
                      href={`/cost/${cp.slug}`}
                      className="group rounded-xl border border-stone-200 p-5 hover:border-amber-300 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-stone-900 group-hover:text-amber-800 transition-colors">
                        {cp.heroTitle}
                      </h3>
                      <p className="mt-2 text-sm text-stone-500 line-clamp-2">
                        {cp.intro.slice(0, 160)}...
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cp.priceRanges.slice(0, 3).map((pr) => (
                          <span
                            key={pr.item}
                            className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                          >
                            {pr.item}: {pr.price}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Comparisons Section */}
            {relatedComparisons.length > 0 && (
              <section className="mt-16 pt-12 border-t border-stone-200">
                <h2 className="text-2xl font-semibold text-stone-900 mb-6">
                  Treatment Comparisons
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedComparisons.map((cp) => (
                    <Link
                      key={cp.slug}
                      href={`/compare/${cp.slug}`}
                      className="group rounded-xl border border-stone-200 p-5 hover:border-amber-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
                        <span className="group-hover:text-amber-800 transition-colors">
                          {cp.treatmentA}
                        </span>
                        <span className="text-stone-400">vs</span>
                        <span className="group-hover:text-amber-800 transition-colors">
                          {cp.treatmentB}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-stone-500 line-clamp-2">
                        {cp.intro.slice(0, 120)}...
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related Blog Posts */}
            {relatedPosts.length > 0 && (
              <section className="mt-16 pt-12 border-t border-stone-200">
                <h2 className="text-2xl font-semibold text-stone-900 mb-2">
                  Related Articles
                </h2>
                <p className="text-stone-500 mb-6">
                  In-depth articles from our medical team covering every aspect of this treatment.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedPosts.slice(0, 12).map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group flex items-start gap-4 rounded-xl border border-stone-200 p-4 hover:border-amber-300 hover:shadow-md transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                          <span>{post.date}</span>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {relatedPosts.length > 12 && (
                  <p className="mt-4 text-sm text-stone-500">
                    And {relatedPosts.length - 12} more articles.{" "}
                    <Link
                      href="/blog"
                      className="text-amber-700 hover:text-amber-800 font-medium"
                    >
                      View all on our blog &rarr;
                    </Link>
                  </p>
                )}
              </section>
            )}

            {/* Service Pages */}
            {serviceLinks.length > 0 && (
              <section className="mt-16 pt-12 border-t border-stone-200">
                <h2 className="text-2xl font-semibold text-stone-900 mb-6">
                  Service Pages
                </h2>
                <div className="flex flex-wrap gap-3">
                  {serviceLinks.map((sl) => (
                    <Link
                      key={sl.href}
                      href={sl.href}
                      className="inline-flex items-center rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:border-amber-300 hover:text-amber-800 transition-all"
                    >
                      {sl.label} &rarr;
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ Section */}
            {guide.faqs.length > 0 && (
              <section
                id="faq"
                className="mt-16 pt-12 border-t border-stone-200"
              >
                <h2 className="text-2xl font-semibold text-stone-900 mb-8">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                  {guide.faqs.map((faq, idx) => (
                    <details
                      key={idx}
                      className="group rounded-xl border border-stone-200 overflow-hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between p-5 text-stone-900 font-medium hover:bg-stone-50 transition-colors">
                        <span className="pr-4">{faq.question}</span>
                        <span className="shrink-0 text-stone-400 group-open:rotate-45 transition-transform text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <div className="px-5 pb-5 text-sm text-stone-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Booking CTA */}
            <section className="mt-16 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-8 sm:p-12 text-center">
              <h2 className="text-2xl font-light text-white sm:text-3xl">
                Schedule Your Consultation
              </h2>
              <p className="mt-4 text-stone-400 leading-relaxed max-w-xl mx-auto">
                Our board-certified medical team is ready to create a
                personalized treatment plan aligned with your goals. Every
                journey at Rani Beauty Clinic begins with a complimentary
                consultation.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://www.ranibeautyclinic.com/booking"
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
                >
                  Book Now
                </a>
                <Link
                  href="/guides"
                  className="inline-flex items-center justify-center rounded-full border border-stone-600 px-8 py-3 text-sm font-semibold text-stone-300 hover:border-stone-400 hover:text-white transition-colors"
                >
                  Browse All Guides
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            name: guide.title,
            description: guide.metaDescription,
            url: `https://www.ranibeautyclinic.com/guides/${guide.slug}`,
            mainEntity: {
              "@type": "FAQPage",
              mainEntity: guide.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
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
