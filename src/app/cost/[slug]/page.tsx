import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  DollarSign,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { costPages } from "@/data/cost-pages";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return costPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = costPages.find((p) => p.slug === params.slug);

  if (!page) {
    return { title: "Pricing Not Found | Rani Beauty Clinic" };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/cost/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/cost/${page.slug}`,
    },
  };
}

export default function CostPage({ params }: PageProps) {
  const page = costPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  /* ── Structured Data: FAQPage ─────────────────────────────────── */
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

  /* ── Structured Data: Offer / PriceSpecification ──────────────── */
  const offerStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${page.service} at ${clinicInfo.name}`,
    provider: {
      "@type": "MedicalBusiness",
      name: clinicInfo.name,
      telephone: clinicInfo.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: clinicInfo.address.street,
        addressLocality: clinicInfo.address.city,
        addressRegion: clinicInfo.address.state,
        postalCode: clinicInfo.address.zip,
        addressCountry: "US",
      },
    },
    areaServed: {
      "@type": "City",
      name: "Renton",
      containedInPlace: { "@type": "State", name: "Washington" },
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${page.service} Pricing`,
      itemListElement: page.priceRanges.map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: item.item,
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          price: item.price,
        },
      })),
    },
  };

  /* ── Breadcrumbs ──────────────────────────────────────────────── */
  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Pricing", url: `${clinicInfo.website}/pricing` },
    {
      name: `${page.service} Cost`,
      url: `${clinicInfo.website}/cost/${page.slug}`,
    },
  ];

  return (
    <>
      {/* ── Structured Data ──────────────────────────────────────── */}
      <StructuredData data={faqStructuredData} />
      <StructuredData data={offerStructuredData} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* ── Breadcrumb Nav ───────────────────────────────────────── */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav
            aria-label="Breadcrumb"
            className="font-body text-sm text-rani-muted"
          >
            <ol className="flex items-center gap-2">
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
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-rani-navy"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <span className="font-semibold text-rani-navy">
                  {page.service} Cost
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Hero
        label={`${page.service.toUpperCase()} PRICING`}
        title={page.heroTitle}
        subtitle={page.intro}
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.booking.url, target: "_blank" }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={[
          "Transparent Pricing",
          "Financing Available",
          "No Hidden Fees",
        ]}
        dark
      />

      {/* ── Price Table ──────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="PRICING" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              {page.service} Prices
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              All prices are per session unless otherwise noted. Prices are
              subject to change — contact us for the most current pricing.
            </p>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.2}>
            <div className="mt-10 overflow-hidden rounded-xl border border-rani-gold/20 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-rani-navy">
                    <th className="px-6 py-4 text-left font-body text-sm font-semibold uppercase tracking-wider text-white">
                      Treatment
                    </th>
                    <th className="px-6 py-4 text-right font-body text-sm font-semibold uppercase tracking-wider text-white">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.priceRanges.map((row, index) => (
                    <tr
                      key={row.item}
                      className={`border-b border-rani-gold/10 transition-colors hover:bg-rani-cream/50 ${
                        index % 2 === 0 ? "bg-white" : "bg-rani-cream/30"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-body text-base font-medium text-rani-navy">
                          {row.item}
                        </span>
                        {row.note && (
                          <span className="mt-1 block font-body text-xs text-rani-muted">
                            {row.note}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-body text-base font-bold text-rani-navy">
                          {row.price}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.3}>
            <p className="mt-4 text-center font-body text-sm text-rani-muted">
              <DollarSign className="mr-1 inline-block h-4 w-4 text-rani-gold" />
              HSA &amp; FSA cards accepted for eligible treatments
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* ── What Affects Cost ────────────────────────────────────── */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="FACTORS" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              What Affects {page.service} Cost?
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 space-y-4">
            {page.factors.map((factor, index) => (
              <FadeInOnScroll key={index} delay={0.1 * (index + 1)}>
                <div className="flex items-start gap-4 rounded-lg border border-rani-gold/10 bg-white p-5 shadow-sm">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10">
                    <span className="font-body text-sm font-bold text-rani-gold">
                      {index + 1}
                    </span>
                  </div>
                  <p className="font-body text-base leading-relaxed text-rani-text">
                    {factor}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Financing ────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="PAYMENT OPTIONS" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Financing &amp; Payment
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <FadeInOnScroll direction="left" delay={0.2}>
              <div className="rounded-xl border border-rani-gold/20 bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rani-gold/10">
                  <CreditCard size={24} className="text-rani-gold" />
                </div>
                <h3 className="font-body text-xl font-bold text-rani-navy">
                  Flexible Financing
                </h3>
                <div className="mt-2 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  {page.financingNote}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge icon="check" variant="light">
                    Afterpay
                  </Badge>
                  <Badge icon="check" variant="light">
                    Cherry
                  </Badge>
                  <Badge icon="check" variant="light">
                    PatientFi
                  </Badge>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right" delay={0.2}>
              <div className="rounded-xl border border-rani-gold/20 bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rani-gold/10">
                  <ShieldCheck size={24} className="text-rani-gold" />
                </div>
                <h3 className="font-body text-xl font-bold text-rani-navy">
                  Insurance &amp; HSA/FSA
                </h3>
                <div className="mt-2 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Most aesthetic and wellness treatments are not covered by
                  insurance. However, we accept HSA and FSA cards for eligible
                  treatments. Contact us if you have questions about which
                  services qualify.
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────────── */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="FREQUENTLY ASKED QUESTIONS" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              {page.service} Pricing FAQs
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 space-y-6">
            {page.faqs.map((faq, index) => (
              <FadeInOnScroll key={index} delay={0.1 * (index + 1)}>
                <div className="rounded-xl border border-rani-gold/10 bg-white p-6 shadow-sm">
                  <h3 className="flex items-start gap-3 font-body text-lg font-bold text-rani-navy">
                    <HelpCircle
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-rani-gold"
                    />
                    {faq.question}
                  </h3>
                  <p className="mt-3 pl-8 font-body text-base leading-relaxed text-rani-text">
                    {faq.answer}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learn More Link ──────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeInOnScroll>
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={18} className="text-rani-gold" />
              <p className="font-body text-base text-rani-text">
                Want to learn more about the treatment itself?
              </p>
            </div>
            <a
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-body text-base font-semibold text-rani-navy transition-colors hover:text-rani-gold"
            >
              Book a free consultation
              <ChevronRight size={16} />
            </a>
          </FadeInOnScroll>
        </div>
      </section>

      {/* ── Trust Badges ─────────────────────────────────────────── */}
      <section className="bg-rani-cream py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge icon="shield">Physician Supervised</Badge>
            <Badge icon="check">Woman-Owned</Badge>
            <Badge icon="clock">Open 7 Days</Badge>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <CTABanner
        label={`${page.service.toUpperCase()} PRICING`}
        title={`Ready to Get Started with ${page.service}?`}
        subtitle={`Book a consultation to discuss your goals and get a personalized pricing estimate. Call us at ${clinicInfo.phone}.`}
      />
    </>
  );
}
