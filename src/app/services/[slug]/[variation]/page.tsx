import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check, ArrowRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { serviceVariations } from "@/data/services/service-variations";

interface PageProps {
  params: { slug: string; variation: string };
}

const aestheticVariations = serviceVariations.filter(
  (v) => v.category === "aesthetic"
);

export function generateStaticParams() {
  return aestheticVariations.map((v) => ({
    slug: v.parentSlug,
    variation: v.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const variation = aestheticVariations.find(
    (v) => v.parentSlug === params.slug && v.slug === params.variation
  );

  if (!variation) {
    return { title: "Treatment Not Found | Rani Beauty Clinic" };
  }

  return {
    title: variation.metaTitle,
    description: variation.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/services/${params.slug}/${params.variation}`,
    },
    openGraph: {
      title: variation.metaTitle,
      description: variation.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/services/${params.slug}/${params.variation}`,
    },
  };
}

export default function ServiceVariationPage({ params }: PageProps) {
  const variation = aestheticVariations.find(
    (v) => v.parentSlug === params.slug && v.slug === params.variation
  );

  if (!variation) {
    notFound();
  }

  const siblings = aestheticVariations.filter(
    (v) => v.parentSlug === params.slug && v.slug !== params.variation
  );

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

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Services", url: `${clinicInfo.website}/services` },
    {
      name: variation.parentTitle,
      url: `${clinicInfo.website}/services/${variation.parentSlug}`,
    },
    {
      name: variation.title,
      url: `${clinicInfo.website}/services/${variation.parentSlug}/${variation.slug}`,
    },
  ];

  return (
    <>
      <StructuredData data={faqSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Breadcrumb */}
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
                  className="hover:text-rani-navy transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-rani-navy transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <Link
                  href={`/services/${variation.parentSlug}`}
                  className="hover:text-rani-navy transition-colors"
                >
                  {variation.parentTitle}
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <span className="text-rani-navy font-semibold">
                  {variation.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label={variation.parentTitle.toUpperCase()}
        title={variation.title}
        subtitle={`Physician-supervised ${variation.title.toLowerCase()} at Rani Beauty Clinic in Renton, WA. Supervised by Dr. Alexander Landfield.`}
        primaryCTA={{ text: "Book Consultation", href: "/contact" }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Physician Supervised", "Open 7 Days"]}
        dark
      />

      {/* Description */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <p className="font-body text-base leading-relaxed text-rani-text">
              {variation.description}
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="BENEFITS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Why Choose {variation.title}
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {variation.benefits.map((benefit, index) => (
              <FadeInOnScroll key={index} delay={index * 0.1}>
                <div className="flex items-start gap-3 rounded-xl bg-white p-6 border border-rani-gold/10">
                  <Check
                    size={18}
                    className="mt-0.5 shrink-0 text-rani-gold"
                  />
                  <span className="font-body text-sm text-rani-text">
                    {benefit}
                  </span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="IDEAL FOR" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Is This Treatment Right for You?
            </h2>
          </FadeInOnScroll>

          <div className="mt-8 space-y-3">
            {variation.idealFor.map((item, index) => (
              <FadeInOnScroll key={index} delay={index * 0.1}>
                <div className="flex items-start gap-3">
                  <ChevronRight
                    size={16}
                    className="mt-0.5 shrink-0 text-rani-gold"
                  />
                  <span className="font-body text-base text-rani-text">
                    {item}
                  </span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="FAQ" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Frequently Asked Questions
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 space-y-6">
            {variation.faqs.map((faq, index) => (
              <FadeInOnScroll key={index} delay={index * 0.1}>
                <div className="rounded-xl bg-white p-6 border border-rani-gold/10">
                  <h3 className="font-body text-base font-bold text-rani-navy">
                    {faq.question}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-rani-text">
                    {faq.answer}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Related Variations */}
      {siblings.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="RELATED TREATMENTS" />
              <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Other {variation.parentTitle} Options
              </h2>
            </FadeInOnScroll>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.slice(0, 6).map((sib) => (
                <Link
                  key={sib.slug}
                  href={`/services/${sib.parentSlug}/${sib.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-rani-gold/10 bg-rani-cream px-5 py-4 transition-all hover:border-rani-gold hover:shadow-sm"
                >
                  <span className="font-body text-sm font-semibold text-rani-navy group-hover:text-rani-gold">
                    {sib.title}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-rani-muted transition-transform group-hover:translate-x-1 group-hover:text-rani-gold"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FadeInOnScroll>
        <div className="bg-white pb-8 flex flex-wrap items-center justify-center gap-3">
          <Badge icon="shield">Physician Supervised</Badge>
          <Badge icon="check">Woman-Owned</Badge>
          <Badge icon="clock">Open 7 Days</Badge>
        </div>
      </FadeInOnScroll>

      <CTABanner
        label={variation.parentTitle.toUpperCase()}
        title={`Ready to Book ${variation.title}?`}
        subtitle={`Schedule your consultation at Rani Beauty Clinic. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
