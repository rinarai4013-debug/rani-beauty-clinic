"use client";

import { ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/sections/Hero";
import StickyBookBar from "@/components/ui/StickyBookBar";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import CTABanner from "@/components/sections/CTABanner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { useServicePageTracking } from "@/lib/analytics/hooks";
import { motion } from "framer-motion";
import { staggerItem } from "@/components/animations/StaggerChildren";
import { getServiceImage } from "@/data/service-images";
import { galleryPages } from "@/data/results/gallery";
import { testimonials } from "@/data/testimonials";
import { getRxProgramPrimaryCta } from "@/lib/rx-programs";
import { getConcernsForService, getComparisonsForService } from "@/data/internal-links";
import { UNIFIED_CATALOG, type UnifiedService } from "@/data/services/unified-catalog";

/** Maps service slug → cost page slug (only for services that have a cost page) */
const COST_SLUG_MAP: Record<string, string> = {
  "laser-hair-removal": "laser-hair-removal-cost",
  "hydrafacial": "hydrafacial-cost",
  "rf-microneedling": "rf-microneedling-cost",
  "botox-dysport": "botox-cost",
  "dermal-fillers": "dermal-fillers-cost",
  "chemical-peels": "chemical-peels-cost",
  "biorepeel": "biorepeel-cost",
  "sofwave": "sofwave-cost",
  "scar-reduction": "scar-reduction-cost",
  "glp1-weight-management": "glp1-cost",
  "peptide-therapy": "peptide-therapy-cost",
  "nad-injections": "nad-injections-cost",
  "hormone-therapy": "hormone-therapy-cost",
  "vitamin-injections": "vitamin-injections-cost",
  "blood-work": "blood-work-cost",
};

/** Service slugs that have a results/gallery page */
const RESULTS_SLUGS = new Set([
  "laser-hair-removal",
  "hydrafacial",
  "rf-microneedling",
  "botox-dysport",
  "dermal-fillers",
  "chemical-peels",
  "scar-reduction",
  "glp1-weight-management",
  "sofwave",
]);

type OfferMappingRule = {
  ids?: string[];
  parentSlugs?: string[];
  categories?: UnifiedService["category"][];
};

const OFFER_MAPPING: Record<string, OfferMappingRule> = {
  "botox-dysport": { ids: ["botox", "dysport"], parentSlugs: ["botox", "dysport"] },
  "chemical-peels": { parentSlugs: ["chemical-peels", "vi-peel", "biorepeel", "prx-t33", "cosmelan-peel"] },
  "laser-acne-facial": { ids: ["laser-acne-facial", "laser-facial-ndyag"], parentSlugs: ["laser-acne-facial", "laser-facial"] },
  "ai-skin-analysis": { ids: ["ai-skin-analysis"], parentSlugs: ["ai-skin-analysis"] },
  "glp1-weight-management": { parentSlugs: ["glp1-weight-management", "glp-1-weight-management"] },
  "nad-injections": { ids: ["nad-injection"], parentSlugs: ["nad-injections", "wellness-injections"] },
  "vitamin-injections": {
    ids: ["b12-injection", "lipo-b-injection", "biotin-injection", "glutathione-injection", "tri-immune-injection", "vitamin-d3-injection"],
    parentSlugs: ["vitamin-injections", "wellness-injections"],
  },
  "peptide-therapy": {
    ids: ["sermorelin", "nad-injection", "glutathione-injection"],
    parentSlugs: ["peptide-therapy", "wellness-injections"],
  },
  "hormone-therapy": { parentSlugs: ["hormone-therapy", "hormones"], categories: ["hormones"] },
  "blood-work": { parentSlugs: ["blood-work"], ids: ["blood-work-wellness-panel"] },
};

function getCatalogEntriesForServiceSlug(slug: string): UnifiedService[] {
  const mapping = OFFER_MAPPING[slug];
  const idSet = new Set([slug, ...(mapping?.ids ?? [])]);
  const parentSlugSet = new Set([slug, ...(mapping?.parentSlugs ?? [])]);
  const categorySet = new Set(mapping?.categories ?? []);
  const matched = UNIFIED_CATALOG.filter((entry) => {
    if (idSet.has(entry.id)) return true;
    if (entry.parentSlug && parentSlugSet.has(entry.parentSlug)) return true;
    if (categorySet.size > 0 && categorySet.has(entry.category)) return true;
    return false;
  });

  const deduped = new Map<string, UnifiedService>();
  for (const entry of matched) {
    deduped.set(entry.id, entry);
  }

  return Array.from(deduped.values());
}

function summarizeCatalogPricing(entries: UnifiedService[]) {
  if (entries.length === 0) return null;
  const prices = entries.map((entry) => entry.price).filter((price) => Number.isFinite(price));
  if (prices.length === 0) return null;

  return {
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: prices.length,
  };
}

interface ServiceData {
  slug: string;
  title: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  heroDescription: string;
  whatIsIt: string;
  howItWorks: { step: string; description: string }[];
  whoIsItFor: string[];
  whatToExpect: { before: string; during: string; after: string };
  resultsAndRecovery: string;
  whyRani: string;
  faqs: { question: string; answer: string }[];
  relatedSlugs: string[];
  isWellness?: boolean;
}

interface ServicePageTemplateProps {
  service: ServiceData;
  allServices: ServiceData[];
}

export default function ServicePageTemplate({
  service,
  allServices,
}: ServicePageTemplateProps) {
  useServicePageTracking(service.title, service.isWellness ? "wellness" : "aesthetic");

  const relatedServices = allServices.filter((s) =>
    service.relatedSlugs.includes(s.slug)
  );

  const basePath = service.isWellness ? "/wellness" : "/services";
  const serviceImageData = getServiceImage(service.slug);

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const serviceUrl = `https://www.ranibeautyclinic.com${basePath}/${service.slug}`;
  const serviceImage = serviceImageData?.image
    ? `https://www.ranibeautyclinic.com${serviceImageData.image}`
    : "https://www.ranibeautyclinic.com/images/logo/logo-dark.png";
  const schemaPhone = clinicInfo.phoneTel.replace("tel:", "");
  const medicalReviewDate = clinicInfo.contentReviewDate ?? "April 18, 2026";
  const primaryCta =
    getRxProgramPrimaryCta(service.slug, Boolean(service.isWellness)) ?? {
      text: "Book This Treatment",
      href: clinicInfo.booking.url,
    };

  // Catalog lookup — pulls pricing, concerns, duration, sessions, and body areas
  // so we can emit a rich MedicalProcedure + Offer pair that LLMs cite.
  const catalogEntries = getCatalogEntriesForServiceSlug(service.slug);
  const concernSet = new Set(catalogEntries.flatMap((entry) => entry.concerns));
  const bodyAreaSet = new Set(catalogEntries.flatMap((entry) => entry.bodyAreas));
  const priceSummary = summarizeCatalogPricing(catalogEntries);

  const serviceStructuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.title,
    description: service.shortDescription,
    url: serviceUrl,
    image: serviceImage,
    procedureType: "https://health-lifesci.schema.org/NoninvasiveProcedure",
    howPerformed: service.howItWorks.map((s) => s.description).join(" "),
    // Indications — what this treatment addresses. LLMs use this to match
    // user queries like "what helps melasma" to the right service page.
    ...(concernSet.size > 0
      ? {
          indication: Array.from(concernSet).map((concern) => ({
            "@type": "MedicalIndication",
            name: concern.replace(/-/g, " "),
          })),
        }
      : {}),
    // Body location — helps AI match "undereye treatment" or "face rejuvenation"
    ...(bodyAreaSet.size > 0
      ? {
          bodyLocation: Array.from(bodyAreaSet).map((area) => area.replace(/-/g, " ")),
        }
      : {}),
    // Preparation — AI Overviews cite these heavily for "how to prepare for X"
    ...(service.whatToExpect?.before
      ? {
          preparation: service.whatToExpect.before,
        }
      : {}),
    // Follow-up — aftercare is high-value content for LLM answers
    ...(service.whatToExpect?.after
      ? {
          followup: service.whatToExpect.after,
        }
      : {}),
    medicalSpecialty: {
      "@type": "MedicalSpecialty",
      name: "Dermatology",
    },
    provider: {
      "@type": "MedicalBusiness",
      "@id": `${clinicInfo.website}#organization`,
      name: clinicInfo.name,
      telephone: schemaPhone,
      url: clinicInfo.website,
      priceRange: "$$$",
      medicalSpecialty: ["Dermatology", "CosmeticSurgery", "Medical-aesthetics"],
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
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: clinicInfo.reviews.aggregateRating,
        reviewCount: clinicInfo.reviews.reviewCount,
        bestRating: 5,
      },
    },
    areaServed: [
      { "@type": "State", name: "Washington" },
      { "@type": "City", name: "Renton" },
      { "@type": "City", name: "Bellevue" },
      { "@type": "City", name: "Seattle" },
      { "@type": "City", name: "Kent" },
      { "@type": "City", name: "Tukwila" },
      { "@type": "City", name: "Newcastle" },
      { "@type": "City", name: "Mercer Island" },
      { "@type": "AdministrativeArea", name: "King County" },
    ],
  };

  // Separate Service + Offer schema — enables AI shopping / pricing answers
  // ("how much does cosmelan peel cost near me?")
  const offerStructuredData = priceSummary
    ? {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: service.title,
        name: service.title,
        description: service.shortDescription,
        url: serviceUrl,
        image: serviceImage,
        provider: {
          "@type": "MedicalBusiness",
          "@id": `${clinicInfo.website}#organization`,
          name: clinicInfo.name,
        },
        areaServed: { "@type": "AdministrativeArea", name: "King County, Washington" },
        offers:
          priceSummary.lowPrice === priceSummary.highPrice
            ? {
                "@type": "Offer",
                price: priceSummary.lowPrice,
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: `${clinicInfo.booking.url}`,
                priceValidUntil: "2027-12-31",
                validFrom: "2026-04-17",
                seller: {
                  "@type": "MedicalBusiness",
                  "@id": `${clinicInfo.website}#organization`,
                  name: clinicInfo.name,
                },
              }
            : {
                "@type": "AggregateOffer",
                lowPrice: priceSummary.lowPrice,
                highPrice: priceSummary.highPrice,
                offerCount: priceSummary.offerCount,
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: `${clinicInfo.booking.url}`,
                seller: {
                  "@type": "MedicalBusiness",
                  "@id": `${clinicInfo.website}#organization`,
                  name: clinicInfo.name,
                },
              },
      }
    : null;

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.ranibeautyclinic.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: service.isWellness ? "Medical Wellness" : "Services",
        item: `https://www.ranibeautyclinic.com${basePath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: serviceUrl,
      },
    ],
  };

  return (
    <>
      <StructuredData data={faqStructuredData} />
      <StructuredData data={serviceStructuredData} />
      {offerStructuredData && <StructuredData data={offerStructuredData} />}
      <StructuredData data={breadcrumbStructuredData} />
      {service.howItWorks.length > 0 && (
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How ${service.title} Works at Rani Beauty Clinic`,
            description: service.shortDescription,
            step: service.howItWorks.map((step, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: step.step,
              text: step.description,
            })),
          }}
        />
      )}

      {/* Hero - with service image background */}
      <Hero
        title={service.title}
        subtitle={service.heroDescription}
        primaryCTA={primaryCta}
        badge={`Supervised by ${clinicInfo.medicalDirector.name}, ${clinicInfo.medicalDirector.specialty}`}
        backgroundImage={serviceImageData?.image || undefined}
        backgroundOverlay={65}
        dark
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-rani-border">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex items-center gap-2 font-body text-sm text-rani-muted">
            <Link href="/" className="hover:text-rani-navy transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link
              href={basePath === "/wellness" ? "/wellness" : "/services"}
              className="hover:text-rani-navy transition-colors"
            >
              {service.isWellness ? "Medical Wellness" : "Services"}
            </Link>
            <ChevronRight size={14} />
            <span className="text-rani-navy font-semibold">
              {service.title}
            </span>
          </nav>
        </div>
      </div>

      {/* What Is It */}
      <section className="bg-white py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="ABOUT THIS TREATMENT" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              What Is {service.title}?
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.2}>
            <div className="mt-8 font-body text-base text-rani-text leading-relaxed whitespace-pre-line">
              {service.whatIsIt}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-rani-cream py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="THE PROCESS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              How It Works
            </h2>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 space-y-6">
            {service.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="flex gap-6 rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rani-navy text-white font-body font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-body text-lg font-bold text-rani-navy">
                    {step.step}
                  </h3>
                  <p className="mt-2 font-body text-sm text-rani-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="bg-white py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="IDEAL CANDIDATES" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Who Is It For?
            </h2>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.2}>
            <ul className="mt-8 space-y-3">
              {service.whoIsItFor.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-rani-gold"
                  />
                  <span className="font-body text-base text-rani-text">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </FadeInOnScroll>
        </div>
      </section>

      {/* What to Expect */}
      <section className="bg-rani-cream py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="YOUR EXPERIENCE" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              What to Expect
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: "Before", text: service.whatToExpect.before },
              { label: "During", text: service.whatToExpect.during },
              { label: "After", text: service.whatToExpect.after },
            ].map((item, i) => (
              <FadeInOnScroll key={item.label} delay={i * 0.15}>
                <div className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-t-2 border-t-rani-gold">
                  <h3 className="font-body text-lg font-bold text-rani-navy">
                    {item.label}
                  </h3>
                  <p className="mt-3 font-body text-sm text-rani-muted leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Results & Recovery */}
      <section className="bg-white py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="RESULTS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Results &amp; Recovery
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.2}>
            <p className="mt-8 font-body text-base text-rani-text leading-relaxed">
              {service.resultsAndRecovery}
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Medical Disclaimer + Review Stamp */}
      <section className="bg-rani-navy py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <div className="rounded-xl border border-rani-gold/30 bg-white/5 p-6 md:p-8">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-rani-gold">
                Medical Review &amp; Disclosure
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-gray-100">
                This page is educational and does not replace individualized medical diagnosis, treatment, or
                emergency care. Every injectable, device, and wellness protocol at Rani Beauty Clinic is delivered
                under physician supervision and requires clinical screening for candidacy and safety.
              </p>
              <p className="mt-4 font-body text-xs text-gray-300">
                Last medically reviewed: {medicalReviewDate} by {clinicInfo.medicalDirector.name},{" "}
                {clinicInfo.medicalDirector.specialty}.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Social Proof - Google Reviews */}
      {(() => {
        const serviceReviews = testimonials.filter(
          (t) => t.treatmentSlug === service.slug
        );
        const displayReviews = serviceReviews.length > 0
          ? serviceReviews
          : testimonials.filter((t) => t.verified).slice(0, 2);
        return displayReviews.length > 0 ? (
          <section className="bg-rani-cream py-16 md:py-20">
            <div className="mx-auto max-w-4xl px-6">
              <FadeInOnScroll>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                    <span className="font-body text-sm font-bold text-rani-navy">
                      {clinicInfo.reviews.aggregateRating}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-body text-sm text-rani-muted">
                      Verified Google Reviews
                    </span>
                  </div>
                </div>
              </FadeInOnScroll>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {displayReviews.map((review) => (
                  <FadeInOnScroll key={review.id}>
                    <div className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                      <div className="flex gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="font-body text-sm text-rani-text leading-relaxed line-clamp-4">
                        &ldquo;{review.text}&rdquo;
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="font-body text-sm font-semibold text-rani-navy">
                            {review.name}
                          </p>
                          {review.location && (
                            <p className="font-body text-xs text-rani-muted">
                              {review.location}
                            </p>
                          )}
                        </div>
                        <span className="font-body text-xs text-rani-muted">
                          {review.verified && "Verified"} · {review.date}
                        </span>
                      </div>
                    </div>
                  </FadeInOnScroll>
                ))}
              </div>
              <FadeInOnScroll delay={0.2}>
                <p className="mt-6 text-center">
                  <a
                    href={clinicInfo.social.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-sm font-semibold text-rani-gold hover:underline"
                  >
                    Read Our Reviews on Google &rarr;
                  </a>
                </p>
              </FadeInOnScroll>
            </div>
          </section>
        ) : null;
      })()}

      {/* Why Rani */}
      <section className="bg-rani-cream py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="THE RANI ADVANTAGE" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Why Rani for {service.title}
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.2}>
            <p className="mt-8 font-body text-base text-rani-text leading-relaxed">
              {service.whyRani}
            </p>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.3}>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {service.isWellness && (
                <>
                  <Badge icon="shield">Medical Director Supervised</Badge>
                  <Badge icon="check">HSA Accepted</Badge>
                  <Badge icon="check">Licensed Professionals</Badge>
                </>
              )}
              <Badge icon="check">Physician-Supervised</Badge>
              <Badge icon="heart">Financing Available</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section className="bg-white py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeInOnScroll>
            <SectionLabel label="INVESTMENT" />
            <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Pricing
            </h2>
            <p className="mt-6 font-body text-base text-rani-muted">
              Contact us for personalized pricing. We offer competitive rates and
              flexible payment options for qualified applicants.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {service.isWellness && <Badge icon="check">HSA Accepted</Badge>}
              <Badge icon="heart">Financing Available</Badge>
            </div>
            <div className="mt-8">
              <Button href={clinicInfo.booking.url}>Get a Quote</Button>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Results Gallery - service treatment images */}
      <section className="bg-rani-cream py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <FadeInOnScroll>
            <SectionLabel label="RESULTS GALLERY" />
            <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Treatment Gallery
            </h2>
            {(() => {
              const galleryPage = galleryPages.find(
                (g) => g.serviceSlug === service.slug
              );
              const galleryImages = galleryPage?.images ?? [];
              const allImages = galleryImages.length > 0
                ? galleryImages
                : serviceImageData
                  ? [serviceImageData.image, serviceImageData.hoverImage].filter(Boolean) as string[]
                  : [];

              return allImages.length > 0 ? (
                <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {allImages.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-xl shadow-sm">
                      <Image
                        src={img}
                        alt={`${service.title} treatment ${i + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                  <Link
                    href={clinicInfo.booking.url}
                    target="_blank"
                    className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-rani-navy to-rani-navy/80 flex flex-col items-center justify-center p-4 transition-all hover:shadow-lg hover:scale-[1.02]"
                  >
                    <p className="font-heading text-2xl text-rani-gold mb-2">
                      Book Now
                    </p>
                    <p className="font-body text-xs text-gray-300">
                      See your own results
                    </p>
                  </Link>
                </div>
              ) : (
                <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-gradient-to-br from-rani-navy to-rani-navy/80 flex items-center justify-center"
                    />
                  ))}
                </div>
              );
            })()}
          </FadeInOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="COMMON QUESTIONS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Frequently Asked Questions
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 space-y-4">
            {service.faqs.map((faq, i) => (
              <FadeInOnScroll key={i} delay={i * 0.1}>
                <FAQItem question={faq.question} answer={faq.answer} />
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Related Treatments */}
      {relatedServices.length > 0 && (
        <section className="bg-rani-cream py-12 md:py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="YOU MAY ALSO LIKE" />
              <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Related Treatments
              </h2>
            </FadeInOnScroll>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((related, i) => {
                const relatedImg = getServiceImage(related.slug);
                return (
                  <FadeInOnScroll key={related.slug} delay={i * 0.15}>
                    <Link
                      href={`${related.isWellness ? "/wellness" : "/services"}/${related.slug}`}
                      className="group block overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1"
                    >
                      {relatedImg && relatedImg.image ? (
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                          <Image
                            src={relatedImg.image}
                            alt={related.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-rani-navy via-rani-navy-light to-rani-navy flex items-center justify-center">
                          <div className="h-px w-12 bg-rani-gold/30" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-body text-lg font-bold text-rani-navy group-hover:text-rani-gold transition-colors">
                          {related.title}
                        </h3>
                        <p className="mt-2 font-body text-sm text-rani-muted line-clamp-2">
                          {related.shortDescription}
                        </p>
                      </div>
                    </Link>
                  </FadeInOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Cross Links */}
      <section className="bg-rani-cream py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {COST_SLUG_MAP[service.slug] && (
              <Link
                href={`/cost/${COST_SLUG_MAP[service.slug]}`}
                className="rounded-full border border-rani-gold/20 bg-white px-4 py-2.5 min-h-[44px] flex items-center font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
              >
                {service.title} Cost →
              </Link>
            )}
            {RESULTS_SLUGS.has(service.slug) && (
              <Link
                href={`/results/${service.slug}`}
                className="rounded-full border border-rani-gold/20 bg-white px-4 py-2.5 min-h-[44px] flex items-center font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
              >
                Before & After →
              </Link>
            )}
            {getConcernsForService(service.slug).map((concern) => (
              <Link
                key={concern.slug}
                href={`/concerns/${concern.slug}`}
                className="rounded-full border border-rani-gold/20 bg-white px-4 py-2.5 min-h-[44px] flex items-center font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
              >
                {concern.title} →
              </Link>
            ))}
            {getComparisonsForService(service.slug).map((comp) => (
              <Link
                key={comp.slug}
                href={`/vs/${comp.slug}`}
                className="rounded-full border border-rani-gold/20 bg-white px-4 py-2.5 min-h-[44px] flex items-center font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
              >
                {comp.treatmentA} vs {comp.treatmentB} →
              </Link>
            ))}
            <Link
              href="/contact"
              className="rounded-full border border-rani-gold/20 bg-white px-4 py-2.5 min-h-[44px] flex items-center font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
            >
              Visit Our Clinic →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="pb-20 lg:pb-0">
        <CTABanner
          title={`Ready to Book Your ${service.title}?`}
          subtitle={`Call ${clinicInfo.phone} or book online to schedule your consultation.`}
        />
      </div>

      {/* Sticky Book Bar — mobile only */}
      <StickyBookBar />
    </>
  );
}

// FAQ Accordion Item
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-xl border border-rani-border bg-white transition-all hover:shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-body text-base font-semibold text-rani-navy">
        {question}
        <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-rani-gold text-xl">
          +
        </span>
      </summary>
      <div className="px-6 pb-4">
        <p className="font-body text-sm text-rani-muted leading-relaxed">
          {answer}
        </p>
      </div>
    </details>
  );
}
