import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import {
  resultsTimelinePages,
  ResultsTimelinePage,
} from "@/data/seo/results-timeline-pages";

export function generateStaticParams() {
  return resultsTimelinePages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = resultsTimelinePages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/results-timeline/${page.slug}`;

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

export default function ResultsTimelineSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = resultsTimelinePages.find(
    (p: ResultsTimelinePage) => p.slug === params.slug
  );
  if (!page) notFound();

  const url = `${clinicInfo.website}/results-timeline/${page.slug}`;

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
        name: page.treatment,
        item: `${clinicInfo.website}/${page.basePath}/${page.serviceSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.treatment} Results Timeline`,
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
            <Link
              href={`/${page.basePath}/${page.serviceSlug}`}
              className="hover:underline"
            >
              {page.treatment}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Results Timeline</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            {page.treatment} Results Timeline
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Visual Timeline */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-12 text-center">
            What to Expect &amp; When
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-[#C9A96E]/30" />
            <div className="space-y-8">
              {page.timeline.map((step, i) => (
                <div key={i} className="relative flex gap-6 md:gap-8">
                  <div className="flex-shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-full bg-[#0F1D2C] text-[#C9A96E] flex items-center justify-center text-xs md:text-sm font-bold z-10 text-center leading-tight">
                    {i + 1}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 flex-1">
                    <h3 className="font-semibold text-[#0F1D2C] text-lg mb-2">
                      {step.timeframe}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#0F1D2C] rounded-xl p-8 text-center">
              <p className="text-sm text-[#C9A96E] mb-2 uppercase tracking-wide">
                Average Duration of Results
              </p>
              <p className="text-3xl font-bold text-white">
                {page.averageDuration}
              </p>
            </div>
            <div className="bg-[#0F1D2C] rounded-xl p-8 text-center">
              <p className="text-sm text-[#C9A96E] mb-2 uppercase tracking-wide">
                Maintenance Schedule
              </p>
              <p className="text-xl font-bold text-white">
                {page.maintenanceSchedule}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Factors Affecting Results */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Factors That Affect Your Results
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <ul className="space-y-4">
              {page.factorsAffectingResults.map((factor, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-gray-700"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-[#C9A96E] flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How to Maximize Results */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            How to Maximize Your Results
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.howToMaximizeResults.map((tip, i) => (
              <div
                key={i}
                className="bg-[#F8F6F1] rounded-xl p-5 flex items-start gap-4"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A96E] text-white flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <span className="text-gray-700 pt-1">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6"
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
            Start Your {page.treatment} Journey
          </h2>
          <p className="text-gray-300 mb-8">
            See real results with physician-supervised {page.treatment} at Rani
            Beauty Clinic. Book your consultation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-block bg-[#C9A96E] text-white px-8 py-3.5 rounded-lg font-medium hover:bg-[#b8954f] transition-colors"
            >
              Book a Consultation
            </Link>
            <Link
              href={`/${page.basePath}/${page.serviceSlug}`}
              className="inline-block border border-[#C9A96E] text-[#C9A96E] px-8 py-3.5 rounded-lg font-medium hover:bg-[#C9A96E]/10 transition-colors"
            >
              Learn About {page.treatment}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
