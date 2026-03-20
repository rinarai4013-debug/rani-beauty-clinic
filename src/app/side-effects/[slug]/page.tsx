import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { sideEffectsPages } from "@/data/seo/side-effects-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

export function generateStaticParams() {
  return sideEffectsPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = sideEffectsPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/side-effects/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/side-effects/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
  };
}

export default function SideEffectsPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = sideEffectsPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/side-effects/${page.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url: pageUrl,
    about: {
      "@type": "MedicalProcedure",
      name: page.treatment,
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
      { "@type": "ListItem", position: 3, name: `${page.treatment} Side Effects`, item: pageUrl },
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
          <Link href={`/${page.basePath}/${page.serviceSlug}`} className="hover:text-rani-gold">{page.treatment}</Link>
          <span className="mx-2">/</span>
          <span className="text-rani-navy">Side Effects</span>
        </nav>

        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            Safety Information
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            {page.treatment} Side Effects
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Reviewed by {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* Common Side Effects */}
        <section className="mb-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Common Side Effects
          </h2>
          <div className="space-y-4">
            {page.commonSideEffects.map((se, i) => (
              <div key={i} className="rounded-xl border border-rani-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-rani-navy">{se.effect}</h3>
                  <span className={`flex-shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${
                    se.severity === "mild"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {se.severity}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-sm text-rani-muted sm:grid-cols-2">
                  <p><span className="font-medium text-rani-navy">Duration:</span> {se.duration}</p>
                  <p><span className="font-medium text-rani-navy">Management:</span> {se.management}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rare Side Effects */}
        <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50/30 p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-amber-800">
            Rare Side Effects
          </h2>
          <p className="mb-4 text-sm text-amber-800/70">
            These are uncommon but patients should be aware of them.
          </p>
          <ul className="space-y-3">
            {page.rareSideEffects.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-amber-800/80">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* When to Seek Help */}
        <section className="mb-10 rounded-xl border border-red-100 bg-red-50/30 p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-red-800">
            When to Contact Your Provider
          </h2>
          <p className="mb-4 text-sm text-red-800/70">
            Call Rani Beauty Clinic at{" "}
            <a href={clinicInfo.phoneTel} className="font-semibold underline">
              {clinicInfo.phone}
            </a>{" "}
            if you experience:
          </p>
          <ul className="space-y-3">
            {page.whenToSeekHelp.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-red-800/80">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Prevention Tips */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            How to Minimize Side Effects
          </h2>
          <ul className="space-y-3">
            {page.preventionTips.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10 text-xs font-bold text-rani-gold">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQs */}
        <section className="mb-10">
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
            Questions About {page.treatment}?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Our physician-supervised team is here to address all your concerns.
            Schedule a consultation to discuss your treatment safely.
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
