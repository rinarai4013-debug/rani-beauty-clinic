import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import {
  demographicPages,
  type DemographicPage,
} from "@/data/seo/demographic-pages";

export function generateStaticParams() {
  return demographicPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = demographicPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Page Not Found" };

  const canonical = `${clinicInfo.website}/treatments-for/${page.slug}`;

  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      url: canonical,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${page.metaTitle} - Rani Beauty Clinic`,
        },
      ],
    },
  };
}

function buildStructuredData(page: DemographicPage) {
  const canonical = `${clinicInfo.website}/treatments-for/${page.slug}`;

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
        name: "Treatments For",
        item: `${clinicInfo.website}/treatments-for`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.title,
        item: canonical,
      },
    ],
  };

  return { faqSchema, breadcrumbSchema };
}

export default function DemographicPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = demographicPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  const { faqSchema, breadcrumbSchema } = buildStructuredData(page);

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="bg-[#F8F6F1] border-b border-[#C9A96E]/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-[#0F1D2C]/60">
            <li>
              <Link href="/" className="hover:text-[#C9A96E] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/treatments-for"
                className="hover:text-[#C9A96E] transition-colors"
              >
                Treatments For
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#0F1D2C] font-medium">{page.title}</li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#0F1D2C] text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A96E] uppercase tracking-widest text-sm font-medium mb-4">
            Treatments for {page.demographic}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
            {page.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Why This Demographic Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-6">
            Why {page.demographic} Choose Rani Beauty Clinic
          </h2>
          <p className="text-[#0F1D2C]/70 leading-relaxed max-w-3xl text-lg">
            {page.whyThisDemographic}
          </p>
        </div>
      </section>

      {/* Recommended Treatments */}
      <section className="py-16 sm:py-20 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Recommended Treatments
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.recommendedTreatments.map((treatment, i) => (
              <Link
                key={i}
                href={`/${treatment.basePath}/${treatment.slug}`}
                className="group block bg-white rounded-xl border border-[#C9A96E]/20 p-6 hover:border-[#C9A96E] hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-serif font-bold text-[#0F1D2C] mb-3 group-hover:text-[#C9A96E] transition-colors">
                  {treatment.name}
                </h3>
                <p className="text-[#0F1D2C]/70 leading-relaxed text-sm">
                  {treatment.whyRecommended}
                </p>
                <span className="inline-block mt-4 text-rani-gold-accessible text-sm font-medium">
                  Learn more &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Unique Considerations */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Unique Considerations for {page.demographic}
          </h2>
          <ul className="space-y-4 max-w-3xl">
            {page.uniqueConsiderations.map((consideration, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#C9A96E]" />
                <p className="text-[#0F1D2C]/80 leading-relaxed">
                  {consideration}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 sm:py-20 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl">
            {page.faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b border-[#C9A96E]/20 pb-6 last:border-b-0"
              >
                <h3 className="text-lg font-semibold text-[#0F1D2C] mb-2">
                  {faq.question}
                </h3>
                <p className="text-[#0F1D2C]/70 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-[#0F1D2C] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Personalized Care for {page.demographic}
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Every treatment at Rani Beauty Clinic is physician-supervised and
            tailored to your unique needs. Schedule a consultation to discover
            your personalized treatment plan.
          </p>
          <a
            href={clinicInfo.phoneTel}
            className="inline-block px-8 py-3 bg-[#C9A96E] text-[#0F1D2C] rounded-lg hover:bg-[#C9A96E]/90 transition-colors font-bold"
          >
            Book a Consultation
          </a>
        </div>
      </section>
    </>
  );
}
