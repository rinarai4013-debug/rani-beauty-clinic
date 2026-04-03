import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { agePages, AgePage } from "@/data/seo/age-pages";

export function generateStaticParams() {
  return agePages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = agePages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const url = `${clinicInfo.website}/age/${page.slug}`;

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

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  essential: {
    bg: "bg-[#C9A96E]/20",
    text: "text-[#C9A96E]",
    label: "Essential",
  },
  recommended: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Recommended",
  },
  optional: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Optional",
  },
};

export default function AgeSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = agePages.find((p: AgePage) => p.slug === params.slug);
  if (!page) notFound();

  const url = `${clinicInfo.website}/age/${page.slug}`;

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
        name: "Treatments by Age",
        item: `${clinicInfo.website}/age`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Best Treatments in Your ${page.ageRange}`,
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
            <span className="text-white">
              Best Treatments in Your {page.ageRange}
            </span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">
            Best Treatments in Your {page.ageRange}
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Skin Concerns */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Common Skin Concerns in Your {page.ageRange}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {page.skinConcerns.map((concern, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-3"
              >
                <span className="mt-0.5 h-2 w-2 rounded-full bg-[#C9A96E] flex-shrink-0" />
                <span className="text-gray-700">{concern}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Treatments */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Recommended Treatments
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.recommendedTreatments.map((treatment, i) => {
              const style = priorityStyles[treatment.priority];
              return (
                <Link
                  key={i}
                  href={`/${treatment.basePath}/${treatment.slug}`}
                  className="group bg-[#F8F6F1] rounded-xl p-6 border border-transparent hover:border-[#C9A96E] transition-colors flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E] transition-colors">
                      {treatment.name}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">
                    {treatment.whyNow}
                  </p>
                  <span className="inline-block mt-4 text-[#C9A96E] text-sm font-medium group-hover:underline">
                    Learn more &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Treatment Stack */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-8 text-center">
            Your {page.ageRange} Treatment Stack
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-700 leading-relaxed text-lg">
              {page.treatmentStack}
            </p>
          </div>
        </div>
      </section>

      {/* Maintenance Schedule */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F1D2C] mb-10 text-center">
            Maintenance Schedule
          </h2>
          <div className="bg-[#F8F6F1] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0F1D2C] text-white">
                  <th className="text-left py-4 px-6 font-medium">
                    Frequency
                  </th>
                  <th className="text-left py-4 px-6 font-medium">
                    Treatment
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.maintenanceSchedule.map((item, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-[#F8F6F1]"}
                  >
                    <td className="py-4 px-6 font-medium text-[#0F1D2C] whitespace-nowrap">
                      {item.frequency}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {item.treatment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      {page.sections.length > 0 && (
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
      )}

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
            Build Your Personalized Treatment Plan
          </h2>
          <p className="text-gray-300 mb-8">
            Every decade brings new opportunities to invest in your skin. Let
            our physician-supervised team create a plan tailored to your age,
            goals, and lifestyle.
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
