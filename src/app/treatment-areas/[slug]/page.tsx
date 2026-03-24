import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { bodyAreaPages } from "@/data/seo/body-area-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

export function generateStaticParams() {
  return bodyAreaPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = bodyAreaPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/treatment-areas/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/treatment-areas/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
  };
}

export default function TreatmentAreaPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = bodyAreaPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/treatment-areas/${page.slug}`;

  const medicalWebPageSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url: pageUrl,
    mainContentOfPage: {
      "@type": "WebPageElement",
      cssSelector: "article",
    },
    about: {
      "@type": "MedicalProcedure",
      name: `${page.treatment} — ${page.bodyArea}`,
      bodyLocation: page.bodyArea,
      url: `${clinicInfo.website}/${page.basePath}/${page.serviceSlug}`,
    },
    author: {
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
      { "@type": "ListItem", position: 2, name: page.treatment, item: `${clinicInfo.website}/${page.basePath}/${page.serviceSlug}` },
      { "@type": "ListItem", position: 3, name: `${page.treatment} — ${page.bodyArea}`, item: pageUrl },
    ],
  };

  const statsItems = [
    { label: "Duration", value: page.sessionInfo.duration, icon: "clock" },
    { label: "Sessions", value: page.sessionInfo.sessions, icon: "calendar" },
    { label: "Downtime", value: page.sessionInfo.downtime, icon: "activity" },
    { label: "Pain Level", value: page.sessionInfo.painLevel, icon: "zap" },
  ];

  return (
    <>
      <StructuredData data={medicalWebPageSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-rani-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rani-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${page.basePath}/${page.serviceSlug}`} className="hover:text-rani-gold">{page.treatment}</Link>
          <span className="mx-2">/</span>
          <span className="text-rani-navy">{page.bodyArea}</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            {page.treatment} — {page.bodyArea}
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            {page.title}
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Reviewed by {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            How {page.treatment} Works on the {page.bodyArea}
          </h2>
          <p data-speakable="true" className="leading-relaxed text-rani-muted">
            {page.howItWorks}
          </p>
        </section>

        {/* Quick Stats Grid */}
        <section className="mb-12">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Quick Facts
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {statsItems.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-rani-border bg-rani-cream/30 p-5 text-center"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-rani-gold">
                  {stat.label}
                </p>
                <p className="mt-2 font-heading text-lg font-bold text-rani-navy">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Benefits of {page.title}
          </h2>
          <ul className="space-y-3">
            {page.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10 text-xs font-bold text-rani-gold">
                  {i + 1}
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Ideal Candidates */}
        <section className="mb-12 rounded-xl border border-rani-border bg-rani-cream/20 p-6">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Who Is {page.title} For?
          </h2>
          <ul className="space-y-3">
            {page.idealCandidates.map((candidate, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{candidate}</span>
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
            Ready to Get Started with {page.title}?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Book a consultation with our experienced team and discover what {page.treatment.toLowerCase()} can do for you.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Book Your Consultation
            </a>
            <Link
              href={`/${page.basePath}/${page.serviceSlug}`}
              className="rounded-lg border border-white/30 px-6 py-3 font-semibold transition-colors hover:bg-white/10"
            >
              Learn More About {page.treatment}
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
