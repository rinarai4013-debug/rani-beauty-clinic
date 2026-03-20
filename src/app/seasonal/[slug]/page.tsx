import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { seasonalPages } from "@/data/seo/seasonal-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

export function generateStaticParams() {
  return seasonalPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = seasonalPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/seasonal/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/seasonal/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
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

export default function SeasonalPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = seasonalPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/seasonal/${page.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: page.metaTitle,
    headline: page.title,
    description: page.metaDescription,
    url: pageUrl,
    author: {
      "@type": "Organization",
      name: clinicInfo.name,
    },
    publisher: {
      "@type": "Organization",
      name: clinicInfo.name,
      url: clinicInfo.website,
    },
    reviewedBy: {
      "@type": "Physician",
      name: clinicInfo.medicalDirector.name,
      description: clinicInfo.medicalDirector.specialty,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable]"],
    },
    inLanguage: "en-US",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: clinicInfo.website },
      { "@type": "ListItem", position: 2, name: "Seasonal Guides", item: `${clinicInfo.website}/seasonal` },
      { "@type": "ListItem", position: 3, name: page.title, item: pageUrl },
    ],
  };

  return (
    <>
      <StructuredData data={articleSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-rani-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rani-gold">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-rani-navy">{page.title}</span>
        </nav>

        {/* Hero Header */}
        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            {seasonLabels[page.season]} Guide
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            {page.title}
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Physician-supervised by {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* Why This Season */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Why {seasonLabels[page.season]}?
          </h2>
          <p data-speakable="true" className="leading-relaxed text-rani-muted">
            {page.whyThisSeason}
          </p>
        </section>

        {/* Recommended Treatments */}
        <section className="mb-12">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Recommended Treatments
          </h2>
          <div className="space-y-6">
            {page.recommendedTreatments.map((treatment, i) => (
              <div key={i} className="rounded-xl border border-rani-border p-6 transition-shadow hover:shadow-md">
                <h3 className="mb-2 font-heading text-lg font-bold text-rani-navy">
                  <Link
                    href={`/${treatment.basePath}/${treatment.slug}`}
                    className="hover:text-rani-gold"
                  >
                    {treatment.name}
                  </Link>
                </h3>
                <p className="text-sm leading-relaxed text-rani-muted">
                  {treatment.whyNow}
                </p>
                <Link
                  href={`/${treatment.basePath}/${treatment.slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-rani-gold hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Skincare Tips */}
        <section className="mb-12 rounded-xl border border-rani-border bg-rani-cream/30 p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-rani-navy">
            {seasonLabels[page.season]} Skincare Tips
          </h2>
          <ul className="space-y-3">
            {page.skincareTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-rani-border p-5">
                <h3 className="mb-2 font-semibold text-rani-navy">
                  {faq.question}
                </h3>
                <p data-speakable="true" className="text-sm leading-relaxed text-rani-muted">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl bg-rani-navy p-8 text-center text-white">
          <h2 className="font-heading text-2xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Book a consultation and our team will create a personalized{" "}
            {page.season === "holiday" ? "holiday" : seasonLabels[page.season].toLowerCase()} treatment
            plan tailored to your goals.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.booking.url}
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Book a Consultation
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="rounded-lg border border-white/30 px-6 py-3 font-semibold transition-colors hover:bg-white/10"
            >
              Call {clinicInfo.phone}
            </a>
          </div>
        </section>
      </article>
    </>
  );
}
