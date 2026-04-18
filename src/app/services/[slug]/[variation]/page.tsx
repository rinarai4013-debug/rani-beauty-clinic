import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import {
  serviceVariations,
  ServiceVariation,
} from "@/data/services/service-variations";

const aestheticVariations = serviceVariations.filter(
  (v) => v.category === "aesthetic"
);

export const dynamicParams = false;

export function generateStaticParams() {
  return aestheticVariations.map((v) => ({
    slug: v.parentSlug,
    variation: v.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string; variation: string };
}): Metadata {
  const variation = aestheticVariations.find(
    (v) => v.parentSlug === params.slug && v.slug === params.variation
  );
  if (!variation) return { title: "Service Not Found" };

  const canonical = `${clinicInfo.website}/services/${variation.parentSlug}/${variation.slug}`;

  return {
    title: { absolute: variation.metaTitle },
    description: variation.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: variation.metaTitle,
      description: variation.metaDescription,
      type: "website",
      url: canonical,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${variation.metaTitle} - Rani Beauty Clinic`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: variation.metaTitle,
      description: variation.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}

function buildStructuredData(variation: ServiceVariation) {
  const canonical = `${clinicInfo.website}/services/${variation.parentSlug}/${variation.slug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: variation.faqs.map((faq) => ({
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
        name: "Services",
        item: `${clinicInfo.website}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: variation.parentTitle,
        item: `${clinicInfo.website}/services/${variation.parentSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: variation.title,
        item: canonical,
      },
    ],
  };

  return { faqSchema, breadcrumbSchema };
}

export default function AestheticVariationPage({
  params,
}: {
  params: { slug: string; variation: string };
}) {
  const variation = aestheticVariations.find(
    (v) => v.parentSlug === params.slug && v.slug === params.variation
  );

  if (!variation) {
    notFound();
  }

  const { faqSchema, breadcrumbSchema } = buildStructuredData(variation);

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
                href="/services"
                className="hover:text-[#C9A96E] transition-colors"
              >
                Services
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/services/${variation.parentSlug}`}
                className="hover:text-[#C9A96E] transition-colors"
              >
                {variation.parentTitle}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#0F1D2C] font-medium">{variation.title}</li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#0F1D2C] text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A96E] uppercase tracking-widest text-sm font-medium mb-4">
            {variation.parentTitle}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
            {variation.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
            {variation.description}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Benefits
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {variation.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-6 rounded-xl bg-[#F8F6F1] border border-[#C9A96E]/20"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-[#0F1D2C]/80 leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal Candidates Section */}
      <section className="py-16 sm:py-20 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Ideal Candidates
          </h2>
          <ul className="space-y-4 max-w-3xl">
            {variation.idealFor.map((candidate, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#C9A96E]" />
                <p className="text-[#0F1D2C]/80 leading-relaxed">{candidate}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl">
            {variation.faqs.map((faq, i) => (
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

      {/* Back to Parent + CTA */}
      <section className="py-16 sm:py-20 bg-[#0F1D2C] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Book your consultation at Rani Beauty Clinic and discover how{" "}
            {variation.title.toLowerCase()} can help you achieve your aesthetic
            goals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/services/${variation.parentSlug}`}
              className="inline-block px-8 py-3 border border-[#C9A96E] text-[#C9A96E] rounded-lg hover:bg-[#C9A96E]/10 transition-colors font-medium"
            >
              View All {variation.parentTitle} Options
            </Link>
            <a
              href={clinicInfo.phoneTel}
              className="inline-block px-8 py-3 bg-[#C9A96E] text-[#0F1D2C] rounded-lg hover:bg-[#C9A96E]/90 transition-colors font-bold"
            >
              Book a Consultation
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
