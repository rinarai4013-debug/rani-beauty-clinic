import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { preparationPages } from "@/data/seo/preparation-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import RelatedPages from "@/components/seo/RelatedPages";

export function generateStaticParams() {
  return preparationPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = preparationPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/preparation/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/preparation/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
  };
}

export default function PreparationPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = preparationPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/preparation/${page.slug}`;

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Prepare for ${page.treatment}`,
    description: page.metaDescription,
    url: pageUrl,
    totalTime: "P14D",
    step: [
      ...page.weeksBeforeSteps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: `Week(s) before: Step ${i + 1}`,
        text: step,
      })),
      ...page.dayBeforeSteps.map((step, i) => ({
        "@type": "HowToStep",
        position: page.weeksBeforeSteps.length + i + 1,
        name: `Day before: Step ${i + 1}`,
        text: step,
      })),
      ...page.dayOfSteps.map((step, i) => ({
        "@type": "HowToStep",
        position: page.weeksBeforeSteps.length + page.dayBeforeSteps.length + i + 1,
        name: `Day of treatment: Step ${i + 1}`,
        text: step,
      })),
    ],
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
      { "@type": "ListItem", position: 3, name: `Prepare for ${page.treatment}`, item: pageUrl },
    ],
  };

  return (
    <>
      <StructuredData data={howToSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-rani-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rani-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${page.basePath}/${page.serviceSlug}`} className="hover:text-rani-gold">{page.treatment}</Link>
          <span className="mx-2">/</span>
          <span className="text-rani-navy">Preparation Guide</span>
        </nav>

        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            Preparation Guide
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            How to Prepare for {page.treatment}
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Expert guidance from {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* Weeks Before */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            1–2 Weeks Before Your Appointment
          </h2>
          <ul className="space-y-3">
            {page.weeksBeforeSteps.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10 text-xs font-bold text-rani-gold">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Day Before */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            The Day Before
          </h2>
          <ul className="space-y-3">
            {page.dayBeforeSteps.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Day Of */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Day of Treatment
          </h2>
          <ul className="space-y-3">
            {page.dayOfSteps.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-navy text-xs font-bold text-white">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What to Bring */}
        <section className="mb-10 rounded-xl border border-rani-border bg-rani-cream/30 p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-rani-navy">
            What to Bring
          </h2>
          <ul className="space-y-2">
            {page.whatToBring.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What to Wear */}
        <section className="mb-10 rounded-xl border border-rani-border bg-rani-cream/30 p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-rani-navy">
            What to Wear
          </h2>
          <ul className="space-y-2">
            {page.whatToWear.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
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

        {/* Related Pages */}
        <RelatedPages serviceSlug={page.serviceSlug} currentPath={`/preparation/${page.slug}`} />

        {/* CTA */}
        <section className="mt-10 rounded-xl bg-rani-navy p-8 text-center text-white">
          <h2 className="font-heading text-2xl font-bold">
            Ready to Book Your {page.treatment}?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Schedule your consultation and our team will walk you through everything.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.booking.url}
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Book Online
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
