import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { worthItPages } from "@/data/seo/worth-it-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import RelatedPages from "@/components/seo/RelatedPages";

export function generateStaticParams() {
  return worthItPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = worthItPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/worth-it/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/worth-it/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
  };
}

export default function WorthItPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = worthItPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/worth-it/${page.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.metaTitle,
    description: page.metaDescription,
    url: pageUrl,
    author: {
      "@type": "Organization",
      name: clinicInfo.name,
      url: clinicInfo.website,
    },
    publisher: {
      "@type": "Organization",
      name: clinicInfo.name,
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
      { "@type": "ListItem", position: 3, name: `Is ${page.treatment} Worth It?`, item: pageUrl },
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
          <span className="text-rani-navy">Is It Worth It?</span>
        </nav>

        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            Honest Assessment
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            Is {page.treatment} Worth It?
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Expert perspective from {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* Quick Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-rani-border p-5 text-center">
            <p className="text-sm text-rani-muted">Results Last</p>
            <p className="mt-1 font-heading text-lg font-bold text-rani-navy">{page.howLongResults}</p>
          </div>
          <div className="rounded-xl border border-rani-border p-5 text-center">
            <p className="text-sm text-rani-muted">Investment</p>
            <p className="mt-1 font-heading text-lg font-bold text-rani-navy">{page.costBreakdown.value}</p>
            <p className="text-xs text-rani-muted">{page.costBreakdown.description}</p>
          </div>
          <div className="rounded-xl border border-rani-border p-5 text-center">
            <p className="text-sm text-rani-muted">Satisfaction</p>
            <p className="mt-1 font-heading text-lg font-bold text-rani-gold">{page.satisfactionRate}</p>
          </div>
        </section>

        {/* Pros and Cons */}
        <section className="mb-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-green-100 bg-green-50/30 p-6">
            <h2 className="mb-4 font-heading text-xl font-bold text-green-800">
              Pros
            </h2>
            <ul className="space-y-3">
              {page.prosAndCons.pros.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-green-800/80">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/30 p-6">
            <h2 className="mb-4 font-heading text-xl font-bold text-red-800">
              Cons
            </h2>
            <ul className="space-y-3">
              {page.prosAndCons.cons.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-red-800/80">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ideal Candidates */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            {page.treatment} Is Best For
          </h2>
          <ul className="space-y-3">
            {page.idealCandidates.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Comparison to Alternatives */}
        <section className="mb-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            How {page.treatment} Compares
          </h2>
          <div className="space-y-4">
            {page.comparisonToAlternatives.map((comp, i) => (
              <div key={i} className="rounded-xl border border-rani-border p-5">
                <h3 className="mb-2 font-semibold text-rani-navy">
                  {page.treatment} vs. {comp.alternative}
                </h3>
                <p data-speakable="true" className="text-sm leading-relaxed text-rani-muted">
                  {comp.comparison}
                </p>
              </div>
            ))}
          </div>
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

        {/* Related Pages */}
        <RelatedPages serviceSlug={page.serviceSlug} currentPath={`/worth-it/${page.slug}`} />

        {/* CTA */}
        <section className="mt-10 rounded-xl bg-rani-navy p-8 text-center text-white">
          <h2 className="font-heading text-2xl font-bold">
            Ready to Try {page.treatment}?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Book a consultation and we&apos;ll help you decide if {page.treatment.toLowerCase()} is the right choice for your goals.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.booking.url}
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Book a Consultation
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
