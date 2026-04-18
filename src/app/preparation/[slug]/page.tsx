import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import {
  preparationPages,
  PreparationPage,
} from "@/data/seo/preparation-pages";

export function generateStaticParams() {
  return preparationPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = preparationPages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/preparation/${page.slug}`;

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

export default function PreparationSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = preparationPages.find(
    (p: PreparationPage) => p.slug === params.slug
  );
  if (!page) notFound();

  const url = `${clinicInfo.website}/preparation/${page.slug}`;

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
        name: `How to Prepare for ${page.treatment}`,
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
            <span className="text-white">Preparation</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            How to Prepare for {page.treatment}
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Weeks Before */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Weeks Before Your Appointment
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <ul className="space-y-4">
              {page.weeksBeforeSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F1D2C] text-[#C9A96E] flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Day Before */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            The Day Before
          </h2>
          <div className="bg-[#F8F6F1] rounded-xl p-8">
            <ul className="space-y-4">
              {page.dayBeforeSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A96E] text-white flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Day Of Treatment */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Day of Treatment
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <ul className="space-y-4">
              {page.dayOfSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F1D2C] text-white flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What to Bring & What to Wear */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* What to Bring */}
            <div>
              <h2 className="font-serif text-2xl text-[#0F1D2C] mb-6">
                What to Bring
              </h2>
              <div className="bg-[#F8F6F1] rounded-xl p-6">
                <ul className="space-y-3">
                  {page.whatToBring.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 text-rani-gold-accessible mt-0.5 flex-shrink-0"
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
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* What to Wear */}
            <div>
              <h2 className="font-serif text-2xl text-[#0F1D2C] mb-6">
                What to Wear
              </h2>
              <div className="bg-[#F8F6F1] rounded-xl p-6">
                <ul className="space-y-3">
                  {page.whatToWear.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 text-rani-gold-accessible mt-0.5 flex-shrink-0"
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
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
            Ready for Your {page.treatment} Appointment?
          </h2>
          <p className="text-gray-300 mb-8">
            Now that you know how to prepare, book your appointment and take the
            next step in your transformation journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-block bg-[#C9A96E] text-white px-8 py-3.5 rounded-lg font-medium hover:bg-[#b8954f] transition-colors"
            >
              Book Your Appointment
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
