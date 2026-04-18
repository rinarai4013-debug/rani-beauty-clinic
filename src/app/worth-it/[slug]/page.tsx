import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { worthItPages, WorthItPage } from "@/data/seo/worth-it-pages";

export function generateStaticParams() {
  return worthItPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = worthItPages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/worth-it/${page.slug}`;

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

export default function WorthItSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = worthItPages.find(
    (p: WorthItPage) => p.slug === params.slug
  );
  if (!page) notFound();

  const url = `${clinicInfo.website}/worth-it/${page.slug}`;

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
        name: `Is ${page.treatment} Worth It?`,
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
            <span className="text-white">Worth It?</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            Is {page.treatment} Worth It?
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Pros & Cons */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Pros &amp; Cons
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8">
              <h3 className="text-xl font-semibold text-green-800 mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
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
                Pros
              </h3>
              <ul className="space-y-4">
                {page.prosAndCons.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8">
              <h3 className="text-xl font-semibold text-red-800 mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cons
              </h3>
              <ul className="space-y-4">
                {page.prosAndCons.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Breakdown & Key Stats */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Cost &amp; Results at a Glance
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
                Cost
              </p>
              <p className="text-2xl font-bold text-[#0F1D2C]">
                {page.costBreakdown.value}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {page.costBreakdown.description}
              </p>
            </div>
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
                Results Last
              </p>
              <p className="text-2xl font-bold text-[#0F1D2C]">
                {page.howLongResults}
              </p>
            </div>
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
                Satisfaction Rate
              </p>
              <p className="text-2xl font-bold text-rani-gold-accessible">
                {page.satisfactionRate}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison to Alternatives */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            How {page.treatment} Compares to Alternatives
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0F1D2C] text-white">
                  <th className="text-left py-4 px-6 font-medium">
                    Alternative
                  </th>
                  <th className="text-left py-4 px-6 font-medium">
                    Comparison
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.comparisonToAlternatives.map((item, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-4 px-6 font-medium text-[#0F1D2C] whitespace-nowrap">
                      {item.alternative}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {item.comparison}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Ideal Candidates */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Ideal Candidates
          </h2>
          <p className="text-gray-500 text-center mb-8">
            {page.treatment} may be right for you if:
          </p>
          <div className="bg-[#F8F6F1] rounded-xl p-8">
            <ul className="space-y-4">
              {page.idealCandidates.map((candidate, i) => (
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
                  {candidate}
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
            Ready to See If {page.treatment} Is Right for You?
          </h2>
          <p className="text-gray-300 mb-8">
            Schedule a complimentary consultation with our physician-supervised
            team to discuss your goals and create a personalized plan.
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
