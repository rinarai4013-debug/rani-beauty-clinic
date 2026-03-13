import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, X, ChevronRight, ArrowRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { comparisonPages } from "@/data/comparisons";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return comparisonPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = comparisonPages.find((p) => p.slug === params.slug);

  if (!page) {
    return { title: "Comparison Not Found | Rani Beauty Clinic" };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/compare/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/compare/${page.slug}`,
    },
  };
}

export default function ComparePage({ params }: PageProps) {
  const page = comparisonPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Compare", url: `${clinicInfo.website}/compare` },
    {
      name: `${page.treatmentA} vs ${page.treatmentB}`,
      url: `${clinicInfo.website}/compare/${page.slug}`,
    },
  ];

  const faqStructuredData = {
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

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <StructuredData data={faqStructuredData} />

      {/* Breadcrumb Navigation */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav
            aria-label="Breadcrumb"
            className="font-body text-sm text-rani-muted"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-rani-navy"
                >
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <span className="transition-colors hover:text-rani-navy">
                  Compare
                </span>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <span className="font-semibold text-rani-navy">
                  {page.treatmentA} vs {page.treatmentB}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <Hero
        label="TREATMENT COMPARISON"
        title={`${page.treatmentA} vs ${page.treatmentB}`}
        subtitle={page.intro}
        primaryCTA={{ text: "Book Consultation", href: "/contact" }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        dark
      />

      {/* Side-by-Side Comparison Table */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="SIDE-BY-SIDE COMPARISON" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              {page.treatmentA} vs {page.treatmentB} at a Glance
            </h2>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.2}>
            <div className="mt-12 overflow-hidden rounded-xl border border-rani-gold/20 bg-white shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-rani-navy">
                <div className="px-6 py-4">
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                    Category
                  </span>
                </div>
                <div className="border-l border-white/10 px-6 py-4">
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                    {page.treatmentA}
                  </span>
                </div>
                <div className="border-l border-white/10 px-6 py-4">
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                    {page.treatmentB}
                  </span>
                </div>
              </div>

              {/* Table Rows */}
              {page.comparisonTable.map((row, index) => (
                <div
                  key={row.category}
                  className={`grid grid-cols-3 ${
                    index % 2 === 0 ? "bg-white" : "bg-rani-cream/50"
                  } ${
                    index < page.comparisonTable.length - 1
                      ? "border-b border-rani-border"
                      : ""
                  }`}
                >
                  <div className="px-6 py-4">
                    <span className="font-body text-sm font-semibold text-rani-navy">
                      {row.category}
                    </span>
                  </div>
                  <div className="border-l border-rani-border px-6 py-4">
                    <span className="font-body text-sm text-rani-text">
                      {row.treatmentA}
                    </span>
                  </div>
                  <div className="border-l border-rani-border px-6 py-4">
                    <span className="font-body text-sm text-rani-text">
                      {row.treatmentB}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Pros and Cons */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="PROS &amp; CONS" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Weighing Your Options
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Treatment A Pros/Cons */}
            <FadeInOnScroll direction="left" delay={0.2}>
              <div className="flex h-full flex-col rounded-xl border border-rani-gold/20 bg-white p-8 shadow-sm">
                <h3 className="font-heading text-2xl font-bold text-rani-navy">
                  {page.treatmentA}
                </h3>
                <div className="mb-6 mt-4 h-0.5 w-12 bg-rani-gold" />

                <div className="mb-6">
                  <p className="mb-3 font-body text-sm font-semibold text-rani-navy">
                    Advantages
                  </p>
                  <ul className="space-y-2">
                    {page.prosA.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          size={16}
                          className="mt-0.5 shrink-0 text-green-600"
                        />
                        <span className="font-body text-sm text-rani-text">
                          {pro}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="mb-3 font-body text-sm font-semibold text-rani-navy">
                    Considerations
                  </p>
                  <ul className="space-y-2">
                    {page.consA.map((con, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X
                          size={16}
                          className="mt-0.5 shrink-0 text-red-400"
                        />
                        <span className="font-body text-sm text-rani-text">
                          {con}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {page.relatedServiceA && (
                  <div className="mt-auto border-t border-rani-border pt-6">
                    <Link
                      href={page.relatedServiceA}
                      className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-navy"
                    >
                      Learn more about {page.treatmentA}
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                )}
              </div>
            </FadeInOnScroll>

            {/* Treatment B Pros/Cons */}
            <FadeInOnScroll direction="right" delay={0.2}>
              <div className="flex h-full flex-col rounded-xl border border-rani-gold/20 bg-white p-8 shadow-sm">
                <h3 className="font-heading text-2xl font-bold text-rani-navy">
                  {page.treatmentB}
                </h3>
                <div className="mb-6 mt-4 h-0.5 w-12 bg-rani-gold" />

                <div className="mb-6">
                  <p className="mb-3 font-body text-sm font-semibold text-rani-navy">
                    Advantages
                  </p>
                  <ul className="space-y-2">
                    {page.prosB.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          size={16}
                          className="mt-0.5 shrink-0 text-green-600"
                        />
                        <span className="font-body text-sm text-rani-text">
                          {pro}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="mb-3 font-body text-sm font-semibold text-rani-navy">
                    Considerations
                  </p>
                  <ul className="space-y-2">
                    {page.consB.map((con, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X
                          size={16}
                          className="mt-0.5 shrink-0 text-red-400"
                        />
                        <span className="font-body text-sm text-rani-text">
                          {con}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {page.relatedServiceB && (
                  <div className="mt-auto border-t border-rani-border pt-6">
                    <Link
                      href={page.relatedServiceB}
                      className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-navy"
                    >
                      Learn more about {page.treatmentB}
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                )}
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Verdict Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR RECOMMENDATION" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              The Verdict
            </h2>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.2}>
            <div className="mt-10 rounded-xl border border-rani-gold/20 bg-rani-cream p-8 md:p-10">
              <p className="font-body text-base leading-[1.85] text-rani-text">
                {page.verdict}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {page.relatedServiceA && (
                  <Badge icon="check">
                    {page.treatmentA} Available at Rani
                  </Badge>
                )}
                {page.relatedServiceB && (
                  <Badge icon="check">
                    {page.treatmentB} Available at Rani
                  </Badge>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-rani-gold px-6 py-3 font-body text-sm font-semibold text-rani-navy transition-colors hover:bg-rani-gold-light"
                >
                  Book a Consultation
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href={clinicInfo.phoneTel}
                  className="inline-flex items-center gap-2 rounded-full border border-rani-navy px-6 py-3 font-body text-sm font-semibold text-rani-navy transition-colors hover:bg-rani-navy hover:text-white"
                >
                  {clinicInfo.phone}
                </Link>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* FAQs Section */}
      {page.faqs.length > 0 && (
        <section className="bg-rani-cream py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="FREQUENTLY ASKED QUESTIONS" />
              <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                {page.treatmentA} vs {page.treatmentB} FAQs
              </h2>
            </FadeInOnScroll>

            <div className="mt-10 space-y-6">
              {page.faqs.map((faq, index) => (
                <FadeInOnScroll key={index} delay={index * 0.1}>
                  <div className="rounded-xl border border-rani-gold/10 bg-white p-6 shadow-sm">
                    <h3 className="font-body text-base font-bold text-rani-navy">
                      {faq.question}
                    </h3>
                    <p className="mt-3 font-body text-sm leading-relaxed text-rani-text">
                      {faq.answer}
                    </p>
                  </div>
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Service Links */}
      {(page.relatedServiceA || page.relatedServiceB) && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="EXPLORE TREATMENTS" />
              <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                Related Services at Rani Beauty Clinic
              </h2>
            </FadeInOnScroll>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {page.relatedServiceA && (
                <FadeInOnScroll delay={0.2}>
                  <Link
                    href={page.relatedServiceA}
                    className="group flex items-center justify-between rounded-xl border border-rani-gold/20 bg-rani-cream p-6 transition-all hover:border-rani-gold hover:shadow-md"
                  >
                    <div>
                      <p className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                        Learn More
                      </p>
                      <p className="mt-1 font-heading text-lg font-bold text-rani-navy">
                        {page.treatmentA}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-rani-gold transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </FadeInOnScroll>
              )}

              {page.relatedServiceB &&
                page.relatedServiceB !== page.relatedServiceA && (
                  <FadeInOnScroll delay={0.3}>
                    <Link
                      href={page.relatedServiceB}
                      className="group flex items-center justify-between rounded-xl border border-rani-gold/20 bg-rani-cream p-6 transition-all hover:border-rani-gold hover:shadow-md"
                    >
                      <div>
                        <p className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                          Learn More
                        </p>
                        <p className="mt-1 font-heading text-lg font-bold text-rani-navy">
                          {page.treatmentB}
                        </p>
                      </div>
                      <ArrowRight
                        size={18}
                        className="shrink-0 text-rani-gold transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </FadeInOnScroll>
                )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <CTABanner
        label="READY TO DECIDE?"
        title={`Book Your ${page.treatmentA} or ${page.treatmentB} Consultation`}
        subtitle={`Our expert providers will help you choose between ${page.treatmentA} and ${page.treatmentB} based on your unique goals. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
