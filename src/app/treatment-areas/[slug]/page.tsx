import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { bodyAreaPages, BodyAreaPage } from "@/data/seo/body-area-pages";
import { clinicInfo } from "@/data/clinic-info";
import StructuredData from "@/components/seo/StructuredData";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return bodyAreaPages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = bodyAreaPages.find((p) => p.slug === params.slug);

  if (!page) {
    return {};
  }

  const canonical = `${clinicInfo.website}/treatment-areas/${page.slug}`;

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

export default function TreatmentAreaPage({ params }: PageProps) {
  const page = bodyAreaPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  const canonical = `${clinicInfo.website}/treatment-areas/${page.slug}`;
  const parentPath = `/${page.basePath}/${page.serviceSlug}`;

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
        item: `${clinicInfo.website}${parentPath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.treatment} for ${page.bodyArea}`,
        item: canonical,
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
          <nav className="mb-6 text-sm text-[#C9A96E]" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link href={parentPath} className="hover:underline">{page.treatment}</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{page.bodyArea}</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {page.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            {page.heroDescription}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={clinicInfo.booking.url}
              className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-3 rounded-lg hover:bg-[#b8944f] transition-colors"
            >
              Book Your Treatment
            </Link>
            <Link
              href={clinicInfo.consultation.url}
              className="inline-block border border-[#C9A96E] text-[#C9A96E] font-semibold px-8 py-3 rounded-lg hover:bg-[#C9A96E]/10 transition-colors"
            >
              Free Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-[#0F1D2C] mb-6">
            How {page.treatment} Works for the {page.bodyArea}
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            {page.howItWorks}
          </p>
        </div>
      </section>

      {/* Session Info Grid */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-[#0F1D2C] mb-8 text-center">
            What to Expect
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <div className="text-rani-gold-accessible text-sm font-semibold uppercase tracking-wider mb-2">
                Duration
              </div>
              <div className="text-[#0F1D2C] text-xl font-bold">
                {page.sessionInfo.duration}
              </div>
            </div>
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <div className="text-rani-gold-accessible text-sm font-semibold uppercase tracking-wider mb-2">
                Sessions
              </div>
              <div className="text-[#0F1D2C] text-xl font-bold">
                {page.sessionInfo.sessions}
              </div>
            </div>
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <div className="text-rani-gold-accessible text-sm font-semibold uppercase tracking-wider mb-2">
                Downtime
              </div>
              <div className="text-[#0F1D2C] text-xl font-bold">
                {page.sessionInfo.downtime}
              </div>
            </div>
            <div className="bg-[#F8F6F1] rounded-xl p-6 text-center">
              <div className="text-rani-gold-accessible text-sm font-semibold uppercase tracking-wider mb-2">
                Pain Level
              </div>
              <div className="text-[#0F1D2C] text-xl font-bold">
                {page.sessionInfo.painLevel}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#0F1D2C] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-white mb-8">
            Benefits of {page.treatment} for the {page.bodyArea}
          </h2>
          <ul className="space-y-4">
            {page.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#C9A96E] mt-1 flex-shrink-0">&#10003;</span>
                <span className="text-gray-300 text-lg">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ideal Candidates */}
      <section className="bg-[#F8F6F1] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-[#0F1D2C] mb-6">
            Ideal Candidates
          </h2>
          <p className="text-gray-600 mb-6">
            {page.treatment} for the {page.bodyArea} may be right for you if:
          </p>
          <ul className="space-y-3">
            {page.idealCandidates.map((candidate, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#C9A96E] text-[#0F1D2C] flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-lg">{candidate}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-[#0F1D2C] mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-[#0F1D2C] mb-2">
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

      {/* Parent Service Link */}
      <section className="bg-[#F8F6F1] py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            {page.treatment} for the {page.bodyArea} is part of our comprehensive {page.treatment} program.
          </p>
          <Link
            href={parentPath}
            className="text-rani-gold-accessible font-semibold hover:underline text-lg"
          >
            Learn more about {page.treatment} at Rani Beauty Clinic &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Ready for Your {page.bodyArea} Transformation?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Book a complimentary consultation to create your personalized {page.treatment} plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={clinicInfo.booking.url}
              className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded-lg hover:bg-[#b8944f] transition-colors text-lg"
            >
              Book Now
            </Link>
            <Link
              href={`tel:${clinicInfo.phone.replace(/[^+\d]/g, "")}`}
              className="inline-block border border-[#C9A96E] text-[#C9A96E] font-semibold px-8 py-4 rounded-lg hover:bg-[#C9A96E]/10 transition-colors text-lg"
            >
              Call {clinicInfo.phone}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
