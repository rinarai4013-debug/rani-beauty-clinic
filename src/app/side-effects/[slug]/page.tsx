import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import {
  sideEffectsPages,
  SideEffectsPage,
} from "@/data/seo/side-effects-pages";

export function generateStaticParams() {
  return sideEffectsPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = sideEffectsPages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/side-effects/${page.slug}`;

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

export default function SideEffectsSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = sideEffectsPages.find(
    (p: SideEffectsPage) => p.slug === params.slug
  );
  if (!page) notFound();

  const url = `${clinicInfo.website}/side-effects/${page.slug}`;

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
        name: `${page.treatment} Side Effects`,
        item: url,
      },
    ],
  };

  const severityColor = (severity: "mild" | "moderate") =>
    severity === "mild"
      ? "bg-green-50 text-green-800 border-green-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

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
            <span className="text-white">Side Effects</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            {page.treatment} Side Effects
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Common Side Effects */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Common Side Effects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {page.commonSideEffects.map((effect, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[#0F1D2C] text-lg">
                    {effect.effect}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${severityColor(effect.severity)}`}
                  >
                    {effect.severity}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {effect.management}
                </p>
                <p className="text-xs text-rani-gold-accessible font-medium">
                  Duration: {effect.duration}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rare Side Effects */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Rare Side Effects
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            These are uncommon but important to be aware of.
          </p>
          <ul className="space-y-3">
            {page.rareSideEffects.map((effect, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-gray-700"
              >
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#C9A96E] flex-shrink-0" />
                {effect}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Prevention Tips */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            How to Minimize Side Effects
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <ul className="space-y-4">
              {page.preventionTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F1D2C] text-white flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* When to Seek Help */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
            <h2 className="font-serif text-2xl text-red-900 mb-6 flex items-center gap-3">
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              When to Seek Medical Attention
            </h2>
            <p className="text-red-800 mb-6 text-sm">
              Contact Rani Beauty Clinic or seek medical attention immediately
              if you experience any of the following:
            </p>
            <ul className="space-y-3">
              {page.whenToSeekHelp.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-red-800"
                >
                  <span className="mt-0.5 text-red-600 font-bold">!</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-red-200">
              <p className="text-red-900 font-medium">
                Call us at{" "}
                <a
                  href={clinicInfo.phoneTel}
                  className="underline hover:no-underline"
                >
                  {clinicInfo.phone}
                </a>{" "}
                or visit your nearest emergency room if symptoms are severe.
              </p>
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
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-4">
            Questions About {page.treatment}?
          </h2>
          <p className="text-gray-300 mb-8">
            Our physician-supervised team is here to address your concerns and
            ensure your safety at every step.
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
