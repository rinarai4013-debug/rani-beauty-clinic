import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { menPages, MenPage } from "@/data/seo/men-pages";

export function generateStaticParams() {
  return menPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = menPages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/men/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
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

export default function MenSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = menPages.find((p: MenPage) => p.slug === params.slug);
  if (!page) notFound();

  const url = `${clinicInfo.website}/men/${page.slug}`;

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
        name: `${page.treatment} for Men`,
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
            <span className="text-white">For Men</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            {page.treatment} for Men
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Why Men */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Why Men Choose {page.treatment}
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-700 leading-relaxed text-lg">
              {page.whyMen}
            </p>
          </div>
        </div>
      </section>

      {/* Male Differences */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            How {page.treatment} Differs for Men
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {page.maleDifferences.map((diff, i) => (
              <div
                key={i}
                className="bg-[#F8F6F1] rounded-xl p-6"
              >
                <h3 className="font-semibold text-[#0F1D2C] text-lg mb-2">
                  {diff.category}
                </h3>
                <p className="text-gray-600 leading-relaxed">{diff.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {page.sections.map((section, i) => (
            <div key={i}>
              <h2 className="font-serif text-2xl text-[#0F1D2C] mb-4">
                {section.heading}
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Results Expectations */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            What Results to Expect
          </h2>
          <div className="bg-[#0F1D2C] rounded-xl p-8">
            <ul className="space-y-4">
              {page.resultsExpectations.map((expectation, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-gray-200"
                >
                  <svg
                    className="w-5 h-5 text-[#C9A96E] mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {expectation}
                </li>
              ))}
            </ul>
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
            {page.treatment} Designed for Men
          </h2>
          <p className="text-gray-300 mb-8">
            Discreet, physician-supervised treatments tailored to male anatomy
            and aesthetic goals. Book your confidential consultation today.
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
