import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, ChevronRight, Check, Phone } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import MapSection from "@/components/sections/MapSection";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { geoPages } from "@/data/locations/geo-pages";
import {
  allServiceSlugs,
  serviceDirectory,
  generateGeoServiceMeta,
  generateGeoServiceContent,
} from "@/data/locations/geo-service-data";

interface PageProps {
  params: { slug: string; service: string };
}

export function generateStaticParams() {
  const params: { slug: string; service: string }[] = [];
  for (const geo of geoPages) {
    for (const svc of allServiceSlugs) {
      params.push({ slug: geo.slug, service: svc });
    }
  }
  return params;
}

export function generateMetadata({ params }: PageProps): Metadata {
  const geo = geoPages.find((p) => p.slug === params.slug);
  const serviceInfo = serviceDirectory[params.service as keyof typeof serviceDirectory];

  if (!geo || !serviceInfo) {
    return { title: "Not Found | Rani Beauty Clinic" };
  }

  const meta = generateGeoServiceMeta(geo.city, serviceInfo);

  return {
    title: meta.metaTitle,
    description: meta.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/locations/${geo.slug}/${serviceInfo.slug}`,
    },
    openGraph: {
      title: meta.metaTitle,
      description: meta.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/locations/${geo.slug}/${serviceInfo.slug}`,
    },
  };
}

export default function GeoServicePage({ params }: PageProps) {
  const geo = geoPages.find((p) => p.slug === params.slug);
  const serviceInfo = serviceDirectory[params.service as keyof typeof serviceDirectory];

  if (!geo || !serviceInfo) {
    notFound();
  }

  const content = generateGeoServiceContent(
    geo.city,
    geo.driveTime,
    serviceInfo
  );

  // Get nearby cities that also offer this service
  const nearbyCities = (geo.nearbyLocations || [])
    .map((slug) => geoPages.find((p) => p.slug === slug))
    .filter(Boolean)
    .slice(0, 5);

  // Determine the service page link
  const servicePageHref =
    serviceInfo.category === "wellness"
      ? `/wellness/${serviceInfo.slug}`
      : `/services/${serviceInfo.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    description: content.description,
    url: `${clinicInfo.website}/locations/${geo.slug}/${serviceInfo.slug}`,
    telephone: clinicInfo.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicInfo.geo.latitude,
      longitude: clinicInfo.geo.longitude,
    },
    areaServed: {
      "@type": "City",
      name: geo.city,
      containedInPlace: {
        "@type": "State",
        name: "Washington",
      },
    },
    openingHours: "Mo-Su 10:00-19:00",
    medicalSpecialty: "Dermatology",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating.toString(),
      reviewCount: clinicInfo.reviews.reviewCount.toString(),
      bestRating: "5",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
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
    { name: "Locations", url: `${clinicInfo.website}/locations` },
    {
      name: `${geo.city}, ${geo.state}`,
      url: `${clinicInfo.website}/locations/${geo.slug}`,
    },
    {
      name: serviceInfo.name,
      url: `${clinicInfo.website}/locations/${geo.slug}/${serviceInfo.slug}`,
    },
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={faqSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Breadcrumb nav */}
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
                <Link
                  href="/locations"
                  className="transition-colors hover:text-rani-navy"
                >
                  Locations
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <Link
                  href={`/locations/${geo.slug}`}
                  className="transition-colors hover:text-rani-navy"
                >
                  {geo.city}, {geo.state}
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <span className="font-semibold text-rani-navy">
                  {serviceInfo.name}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label={`${serviceInfo.name.toUpperCase()} NEAR ${geo.city.toUpperCase()}`}
        title={content.h1}
        subtitle={content.intro}
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.consultation.url }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={[
          "Physician Supervised",
          geo.driveTime,
          serviceInfo.category === "wellness"
            ? "In-House Blood Work"
            : "Advanced Technology",
        ]}
        dark
      />

      {/* Clinic info bar */}
      <section className="border-b border-rani-gold/20 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 font-body text-sm text-rani-text">
              <MapPin size={16} className="text-rani-gold" />
              <span>{clinicInfo.address.full}</span>
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-rani-text">
              <Clock size={16} className="text-rani-gold" />
              <span>
                {geo.driveTime} from {geo.city}
              </span>
            </div>
            <a
              href={clinicInfo.phoneTel}
              className="flex items-center gap-2 font-body text-sm text-rani-text transition-colors hover:text-rani-navy"
            >
              <Phone size={16} className="text-rani-gold" />
              <span>{clinicInfo.phone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Service description */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <h2 className="font-body text-2xl font-bold text-rani-navy md:text-3xl">
              About {serviceInfo.name}
            </h2>
            <p className="mt-6 font-body text-base leading-relaxed text-rani-text">
              {content.description}
            </p>
            {content.technology && (
              <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                At {clinicInfo.name}, we use the{" "}
                <strong>{content.technology}</strong> — ensuring {geo.city}{" "}
                residents receive the same caliber of treatment available at top
                clinics nationwide.
              </p>
            )}
          </FadeInOnScroll>

          {/* Key benefits */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-10 rounded-xl border border-rani-gold/10 bg-rani-cream p-8">
              <h3 className="font-body text-lg font-bold text-rani-navy">
                Key Benefits for {geo.city} Residents
              </h3>
              <ul className="mt-4 space-y-3">
                {content.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-rani-success"
                    />
                    <span className="font-body text-sm text-rani-text">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeInOnScroll>

          {/* Pricing snapshot */}
          <FadeInOnScroll delay={0.3}>
            <div className="mt-10 rounded-xl border border-rani-gold/10 bg-white p-8 shadow-sm">
              <h3 className="font-body text-lg font-bold text-rani-navy">
                {serviceInfo.name} Pricing
              </h3>
              <p className="mt-2 font-body text-2xl font-bold text-rani-gold">
                {content.pricing}
              </p>
              <p className="mt-2 font-body text-sm text-rani-muted">
                Packages and memberships available for additional savings.{" "}
                <Link
                  href="/pricing"
                  className="text-rani-navy underline transition-colors hover:text-rani-gold"
                >
                  View full pricing
                </Link>
              </p>
            </div>
          </FadeInOnScroll>

          {/* Link to full service page */}
          <FadeInOnScroll delay={0.4}>
            <div className="mt-8">
              <Link
                href={servicePageHref}
                className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-navy transition-colors hover:text-rani-gold"
              >
                Learn more about {serviceInfo.name}
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* FAQs */}
      {content.faqs.length > 0 && (
        <section className="bg-rani-cream py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="FREQUENTLY ASKED QUESTIONS" />
              <h2 className="mt-6 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
                {serviceInfo.name} Questions from {geo.city} Clients
              </h2>
            </FadeInOnScroll>

            <div className="mt-10 space-y-6">
              {content.faqs.map((faq, i) => (
                <FadeInOnScroll key={i} delay={i * 0.1}>
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

      {/* Nearby cities offering this service */}
      {nearbyCities.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <FadeInOnScroll>
              <h2 className="text-center font-body text-xl font-bold text-rani-navy">
                Also Serving Nearby Areas for {serviceInfo.name}
              </h2>
            </FadeInOnScroll>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {nearbyCities.map((nearby) => (
                <Link
                  key={nearby!.slug}
                  href={`/locations/${nearby!.slug}/${serviceInfo.slug}`}
                  className="rounded-full border border-rani-gold/20 bg-rani-cream px-4 py-2 font-body text-sm text-rani-text transition-colors hover:border-rani-gold hover:text-rani-navy"
                >
                  {nearby!.city}, {nearby!.state}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust badges */}
      <section className="bg-rani-cream py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge icon="shield">Physician Supervised</Badge>
            <Badge icon="check">Woman-Owned</Badge>
            <Badge icon="clock">Open 7 Days</Badge>
          </div>
        </div>
      </section>

      <MapSection />

      <CTABanner
        label={`${serviceInfo.name.toUpperCase()} NEAR ${geo.city.toUpperCase()}`}
        title={`Ready for ${serviceInfo.name} from ${geo.city}?`}
        subtitle={`Just ${geo.driveTime} from ${geo.city}. Book your consultation today or call ${clinicInfo.phone}.`}
      />
    </>
  );
}
