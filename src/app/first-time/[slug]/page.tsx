import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { firstTimePages } from "@/data/seo/first-time-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

export function generateStaticParams() {
  return firstTimePages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = firstTimePages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/first-time/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/first-time/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
  };
}

export default function FirstTimePage({
  params,
}: {
  params: { slug: string };
}) {
  const page = firstTimePages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/first-time/${page.slug}`;

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Your First ${page.treatment} Treatment`,
    description: page.metaDescription,
    url: pageUrl,
    step: page.duringTreatment.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.step,
      text: step.details,
    })),
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
      { "@type": "ListItem", position: 3, name: `First Time ${page.treatment}`, item: pageUrl },
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
          <span className="text-rani-navy">What to Expect</span>
        </nav>

        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            First-Timer Guide
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            First Time {page.treatment}: What to Expect
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Expert guidance from {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* Quick Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-rani-border p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-rani-muted">Pain Level</p>
            <p className="mt-1 text-sm font-semibold text-rani-navy">{page.painLevel}</p>
          </div>
          <div className="rounded-xl border border-rani-border p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-rani-muted">Duration</p>
            <p className="mt-1 text-sm font-semibold text-rani-navy">{page.sessionDuration}</p>
          </div>
          <div className="rounded-xl border border-rani-border p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-rani-muted">Downtime</p>
            <p className="mt-1 text-sm font-semibold text-rani-navy">{page.downtime}</p>
          </div>
          <div className="rounded-xl border border-rani-border p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-rani-muted">Sessions</p>
            <p className="mt-1 text-sm font-semibold text-rani-navy">{page.numberOfSessions}</p>
          </div>
        </section>

        {/* Before Your Appointment */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Before Your Appointment
          </h2>
          <ul className="space-y-3">
            {page.beforeAppointment.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10 text-xs font-bold text-rani-gold">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* During Treatment */}
        <section className="mb-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            During Your Treatment
          </h2>
          <div className="space-y-6">
            {page.duringTreatment.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rani-navy text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-rani-navy">{step.step}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-rani-muted">{step.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* After Treatment */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            After Your Treatment
          </h2>
          <ul className="space-y-3">
            {page.afterTreatment.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Results Timeline */}
        <section className="mb-10 rounded-xl border border-rani-border bg-rani-cream/30 p-6">
          <h2 className="mb-3 font-heading text-xl font-bold text-rani-navy">
            When Will I See Results?
          </h2>
          <p data-speakable="true" className="leading-relaxed text-rani-muted">
            {page.resultsTimeline}
          </p>
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
            Ready for Your First {page.treatment}?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Our team will guide you through every step. Book your consultation today.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.booking.url}
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Book Your First Session
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
