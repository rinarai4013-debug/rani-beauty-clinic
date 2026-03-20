import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { aftercarePages } from "@/data/seo/aftercare-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

export function generateStaticParams() {
  return aftercarePages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const page = aftercarePages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/aftercare/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${clinicInfo.website}/aftercare/${page.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
  };
}

export default function AftercarePage({
  params,
}: {
  params: { slug: string };
}) {
  const page = aftercarePages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/aftercare/${page.slug}`;

  const articleSchema = {
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
      { "@type": "ListItem", position: 3, name: `${page.treatment} Aftercare`, item: pageUrl },
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
          <span className="text-rani-navy">Aftercare</span>
        </nav>

        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            Aftercare Guide
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            {page.treatment} Aftercare
          </h1>
          <p className="mt-2 text-sm text-rani-muted">
            Reviewed by {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty}
          </p>
          <p data-speakable="true" className="mt-6 text-lg leading-relaxed text-rani-muted">
            {page.heroDescription}
          </p>
        </header>

        {/* Immediate Aftercare */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Immediately After Treatment
          </h2>
          <ul className="space-y-3">
            {page.immediateAftercare.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10 text-xs font-bold text-rani-gold">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* First 24 Hours */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            First 24 Hours
          </h2>
          <ul className="space-y-3">
            {page.first24Hours.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* First Week */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            First Week
          </h2>
          <ul className="space-y-3">
            {page.firstWeek.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Long Term */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Long-Term Care & Maintenance
          </h2>
          <ul className="space-y-3">
            {page.longTerm.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-rani-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Things to Avoid */}
        <section className="mb-10 rounded-xl border border-red-100 bg-red-50/30 p-6">
          <h2 className="mb-4 font-heading text-2xl font-bold text-red-800">
            Things to Avoid
          </h2>
          <ul className="space-y-3">
            {page.thingsToAvoid.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-red-800/80">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* When to Call Us */}
        <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50/30 p-6">
          <h2 className="mb-4 font-heading text-2xl font-bold text-amber-800">
            When to Contact Rani Beauty Clinic
          </h2>
          <p className="mb-4 text-amber-800/80">
            Call us at{" "}
            <a href={clinicInfo.phoneTel} className="font-semibold underline">
              {clinicInfo.phone}
            </a>{" "}
            if you experience any of the following:
          </p>
          <ul className="space-y-3">
            {page.whenToCallUs.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-amber-800/80">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
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
            Questions About Your {page.treatment} Recovery?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Our team is here to support you every step of the way. Contact us
            anytime.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.phoneTel}
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Call {clinicInfo.phone}
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
