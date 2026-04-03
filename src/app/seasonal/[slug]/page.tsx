import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { seasonalPages, SeasonalPage } from "@/data/seo/seasonal-pages";

export function generateStaticParams() {
  return seasonalPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = seasonalPages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/seasonal/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      siteName: clinicInfo.name,
      type: "article",
    },
  };
}

const seasonLabels: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
  holiday: "Holiday Season",
};

const seasonIcons: Record<string, string> = {
  spring: "🌸",
  summer: "☀️",
  fall: "🍂",
  winter: "❄️",
  holiday: "✨",
};

export default function SeasonalSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = seasonalPages.find(
    (p: SeasonalPage) => p.slug === params.slug
  );
  if (!page) notFound();

  const url = `${clinicInfo.website}/seasonal/${page.slug}`;
  const seasonLabel = seasonLabels[page.season] || page.season;

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
        name: "Seasonal Treatments",
        item: `${clinicInfo.website}/seasonal`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <nav className="mb-6 text-sm text-[#C9A96E]">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{page.title}</span>
          </nav>
          <p className="text-[#C9A96E] text-lg mb-4">
            {seasonLabel} Guide
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            {page.title}
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Why This Season */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Why {seasonLabel} Is the Perfect Time
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-700 leading-relaxed text-lg">
              {page.whyThisSeason}
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Treatments */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Recommended {seasonLabel} Treatments
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {page.recommendedTreatments.map((treatment, i) => (
              <Link
                key={i}
                href={`/${treatment.basePath}/${treatment.slug}`}
                className="group bg-[#F8F6F1] rounded-xl p-6 border border-transparent hover:border-[#C9A96E] transition-colors"
              >
                <h3 className="font-semibold text-[#0F1D2C] text-lg mb-2 group-hover:text-[#C9A96E] transition-colors">
                  {treatment.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {treatment.whyNow}
                </p>
                <span className="inline-block mt-4 text-[#C9A96E] text-sm font-medium group-hover:underline">
                  Learn more &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Skincare Tips */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            {seasonLabel} Skincare Tips
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <ul className="space-y-4">
              {page.skincareTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F1D2C] text-[#C9A96E] flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-[#F8F6F1] rounded-xl p-6"
              >
                <h3 className="font-semibold text-[#0F1D2C] text-lg mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-4">
            Make the Most of This {seasonLabel}
          </h2>
          <p className="text-gray-300 mb-8">
            Our physician-supervised team will create a personalized{" "}
            {seasonLabel.toLowerCase()} treatment plan tailored to your skin
            goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-block bg-[#C9A96E] text-white px-8 py-3.5 rounded-lg font-medium hover:bg-[#b8954f] transition-colors"
            >
              Book a Consultation
            </Link>
            <Link
              href="/services"
              className="inline-block border border-[#C9A96E] text-[#C9A96E] px-8 py-3.5 rounded-lg font-medium hover:bg-[#C9A96E]/10 transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
