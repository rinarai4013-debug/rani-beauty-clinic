import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { financingPages } from "@/data/seo/financing-pages";
import { clinicInfo } from "@/data/clinic-info";
import StructuredData from "@/components/seo/StructuredData";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return financingPages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = financingPages.find((p) => p.slug === params.slug);

  if (!page) {
    return {};
  }

  const canonical = `${clinicInfo.website}/financing/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      siteName: "Rani Beauty Clinic",
      type: "article",
      locale: "en_US",
    },
  };
}

export default function FinancingPage({ params }: PageProps) {
  const page = financingPages.find((p) => p.slug === params.slug);

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
        name: "Financing",
        item: `${clinicInfo.website}/financing`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.title,
        item: `${clinicInfo.website}/financing/${page.slug}`,
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
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/financing" className="hover:text-[#C9A96E] transition-colors">
                Financing
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#C9A96E] font-medium">{page.title}</li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-[#C9A96E] uppercase tracking-widest text-sm font-medium mb-4">
            Financing Options
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6">
            {page.title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-12">
            {page.sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-4">
                  {section.heading}
                </h2>
                <div className="h-0.5 w-12 bg-[#C9A96E] mb-6" />
                <p className="text-[#0F1D2C]/80 leading-relaxed text-lg">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="py-16 md:py-20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-10 text-center">
            Key Takeaways
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {page.keyTakeaways.map((takeaway, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl p-5 border border-[#C9A96E]/10 shadow-sm"
              >
                <span className="flex-shrink-0 text-[#C9A96E] mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="text-[#0F1D2C]/80 leading-relaxed">{takeaway}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {page.faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-[#F8F6F1] rounded-xl border border-[#C9A96E]/10 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 font-semibold text-[#0F1D2C] hover:text-[#C9A96E] transition-colors">
                  {faq.question}
                  <span className="ml-4 flex-shrink-0 text-[#C9A96E] group-open:rotate-45 transition-transform text-xl">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-[#0F1D2C]/70 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#0F1D2C]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">
            Start Your Transformation Today
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Flexible financing makes it easier than ever to invest in yourself.
            Explore your options and take the first step with Rani Beauty Clinic.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={clinicInfo.financing.patientfi.applyUrl}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C9A96E] text-white font-semibold rounded-lg hover:bg-[#b8954f] transition-colors text-sm uppercase tracking-wider"
            >
              Apply with PatientFi
            </Link>
            <Link
              href={clinicInfo.financing.cherry.applyUrl}
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-[#C9A96E] text-[#C9A96E] font-semibold rounded-lg hover:bg-[#C9A96E] hover:text-white transition-colors text-sm uppercase tracking-wider"
            >
              Apply with Cherry
            </Link>
          </div>
          <Link
            href={clinicInfo.booking.url}
            className="inline-block mt-6 text-white/60 hover:text-white text-sm underline underline-offset-4 transition-colors"
          >
            Or book a consultation to discuss payment plans
          </Link>
        </div>
      </section>
    </>
  );
}
