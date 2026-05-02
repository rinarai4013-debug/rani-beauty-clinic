import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { vsPages, VsPage } from "@/data/seo/vs-pages";
import { comparisonPages } from "@/data/comparisons";
import { clinicInfo } from "@/data/clinic-info";
import StructuredData from "@/components/seo/StructuredData";

export const revalidate = 86400;
export const dynamicParams = false;

interface PageProps {
  params: { slug: string };
}

/**
 * Look up VS page data by slug.
 * 1. Check vsPages first (richer data with keywords, sections, etc.)
 * 2. Fall back to comparisonPages, adapting the data to match VsPage shape
 */
function findVsData(slug: string): VsPage | null {
  // Prefer vsPages — they have richer, hand-authored content
  const vsPage = vsPages.find((p) => p.slug === slug);
  if (vsPage) return vsPage;

  // Fall back to comparisonPages and adapt to VsPage shape
  const comp = comparisonPages.find((p) => p.slug === slug);
  if (!comp) return null;

  // Build sections from pros/cons
  const sections: VsPage["sections"] = [];
  if (comp.prosA.length > 0 || comp.consA.length > 0) {
    sections.push({
      heading: `Advantages & Drawbacks of ${comp.treatmentA}`,
      content: [
        ...(comp.prosA.length > 0
          ? [`Advantages: ${comp.prosA.join(". ")}.`]
          : []),
        ...(comp.consA.length > 0
          ? [`Considerations: ${comp.consA.join(". ")}.`]
          : []),
      ].join(" "),
    });
  }
  if (comp.prosB.length > 0 || comp.consB.length > 0) {
    sections.push({
      heading: `Advantages & Drawbacks of ${comp.treatmentB}`,
      content: [
        ...(comp.prosB.length > 0
          ? [`Advantages: ${comp.prosB.join(". ")}.`]
          : []),
        ...(comp.consB.length > 0
          ? [`Considerations: ${comp.consB.join(". ")}.`]
          : []),
      ].join(" "),
    });
  }

  return {
    slug: comp.slug,
    treatmentA: comp.treatmentA,
    treatmentB: comp.treatmentB,
    metaTitle: comp.metaTitle,
    metaDescription: comp.metaDescription,
    keywords: [`${comp.treatmentA} vs ${comp.treatmentB}`],
    heroDescription: comp.intro,
    comparisonTable: comp.comparisonTable,
    sections,
    expertRecommendation: comp.verdict,
    faqs: comp.faqs,
  };
}

export function generateStaticParams() {
  // Collect all unique slugs from both data sources
  const slugSet = new Set<string>();
  vsPages.forEach((p) => slugSet.add(p.slug));
  comparisonPages.forEach((p) => slugSet.add(p.slug));

  return Array.from(slugSet).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = findVsData(params.slug);

  if (!page) {
    return {};
  }

  const cleanTitle = page.metaTitle.replace(/\s*\|\s*Rani Beauty Clinic\s*$/i, "").trim();
  const canonical = `${clinicInfo.website}/vs/${page.slug}`;

  return {
    title: { absolute: cleanTitle },
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: cleanTitle,
      description: page.metaDescription,
      url: canonical,
      siteName: "Rani Beauty Clinic",
      type: "article",
      locale: "en_US",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${cleanTitle} | Rani Beauty Clinic`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: page.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default function VsComparisonPage({ params }: PageProps) {
  const page = findVsData(params.slug);

  if (!page) {
    notFound();
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: clinicInfo.website,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compare",
        item: `${clinicInfo.website}/vs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.treatmentA} vs ${page.treatmentB}`,
        item: `${clinicInfo.website}/vs/${page.slug}`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-[#F8F6F1] border-b border-[#C9A96E]/20">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <ol className="flex items-center gap-2 text-sm text-[#0F1D2C]/60">
            <li>
              <Link href="/" className="hover:text-[#C9A96E] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-rani-gold-accessible">/</li>
            <li>
              <Link href="/vs" className="hover:text-[#C9A96E] transition-colors">
                Compare
              </Link>
            </li>
            <li aria-hidden="true" className="text-rani-gold-accessible">/</li>
            <li className="text-[#0F1D2C] font-medium">
              {page.treatmentA} vs {page.treatmentB}
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="uppercase tracking-[0.2em] text-[#C9A96E] text-sm font-medium mb-4">
            Treatment Comparison
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">
            {page.treatmentA}{" "}
            <span className="text-[#C9A96E] font-normal">vs</span>{" "}
            {page.treatmentB}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] text-center mb-12">
            Side-by-Side <span className="text-rani-gold-accessible">Comparison</span>
          </h2>
          <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/20">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0F1D2C] text-white">
                  <th className="px-6 py-4 text-sm font-medium uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-sm font-medium uppercase tracking-wider">
                    {page.treatmentA}
                  </th>
                  <th className="px-6 py-4 text-sm font-medium uppercase tracking-wider">
                    {page.treatmentB}
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.comparisonTable.map((row, index) => (
                  <tr
                    key={row.category}
                    className={
                      index % 2 === 0 ? "bg-[#F8F6F1]" : "bg-white"
                    }
                  >
                    <td className="px-6 py-4 font-medium text-[#0F1D2C] text-sm">
                      {row.category}
                    </td>
                    <td className="px-6 py-4 text-[#0F1D2C]/80 text-sm">
                      {row.treatmentA}
                    </td>
                    <td className="px-6 py-4 text-[#0F1D2C]/80 text-sm">
                      {row.treatmentB}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 md:py-24 px-6 bg-[#F8F6F1]">
        <div className="mx-auto max-w-3xl space-y-16">
          {page.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-2xl md:text-3xl font-light text-[#0F1D2C] mb-6">
                {section.heading}
              </h2>
              <div className="prose prose-lg max-w-none text-[#0F1D2C]/80 leading-relaxed">
                <p>{section.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expert Recommendation */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="mx-auto max-w-3xl">
          <div className="border-l-4 border-[#C9A96E] bg-[#F8F6F1] p-8 md:p-12 rounded-r-lg">
            <p className="uppercase tracking-[0.2em] text-rani-gold-accessible text-sm font-medium mb-4">
              Expert Recommendation
            </p>
            <h2 className="text-2xl md:text-3xl font-light text-[#0F1D2C] mb-6">
              What Our Specialists Recommend
            </h2>
            <p className="text-[#0F1D2C]/80 text-lg leading-relaxed">
              {page.expertRecommendation}
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24 px-6 bg-[#F8F6F1]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] text-center mb-12">
            Frequently Asked <span className="text-rani-gold-accessible">Questions</span>
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white rounded-lg p-6 md:p-8 border border-[#C9A96E]/10"
              >
                <h3 className="text-lg font-medium text-[#0F1D2C] mb-3">
                  {faq.question}
                </h3>
                <p className="text-[#0F1D2C]/70 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6 bg-[#0F1D2C] text-white text-center">
        <div className="mx-auto max-w-2xl">
          <p className="uppercase tracking-[0.2em] text-[#C9A96E] text-sm font-medium mb-4">
            Ready to Decide?
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            Book a Personalized Consultation
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Our expert injectors will assess your unique anatomy and goals to
            recommend the ideal treatment plan for you.
          </p>
          <Link
            href="/book"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] px-10 py-4 text-sm font-medium uppercase tracking-wider rounded hover:bg-[#C9A96E]/90 transition-colors"
          >
            Book Your Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
