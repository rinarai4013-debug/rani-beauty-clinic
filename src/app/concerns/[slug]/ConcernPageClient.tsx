"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle, ArrowRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { motion } from "framer-motion";
import { staggerItem } from "@/components/animations/StaggerChildren";
import type { SkinConcern } from "@/data/skin-concerns";
import { getCostSlugForService, getComparisonsForService } from "@/data/internal-links";

interface ConcernPageClientProps {
  concern: SkinConcern;
  allConcerns: SkinConcern[];
}

export default function ConcernPageClient({
  concern,
  allConcerns,
}: ConcernPageClientProps) {
  const relatedConcerns = allConcerns.filter((c) =>
    concern.relatedConcerns.includes(c.slug)
  );

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: concern.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const medicalConditionData = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: concern.title,
    about: {
      "@type": "MedicalCondition",
      name: concern.title,
      signOrSymptom: concern.symptoms.map((s) => ({
        "@type": "MedicalSignOrSymptom",
        name: s,
      })),
      possibleTreatment: concern.treatments.map((t) => ({
        "@type": "MedicalTherapy",
        name: t.name,
        description: t.description,
      })),
    },
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Dermatology",
    },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ranibeautyclinic.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Skin Concerns",
        item: "https://ranibeautyclinic.com/concerns",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: concern.title,
        item: `https://ranibeautyclinic.com/concerns/${concern.slug}`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={faqStructuredData} />
      <StructuredData data={medicalConditionData} />
      <StructuredData data={breadcrumbData} />

      {/* Hero */}
      <Hero
        title={concern.title}
        subtitle={concern.heroDescription}
        primaryCTA={{
          text: "Book a Consultation",
          href: clinicInfo.booking.url,
        }}
        badge={`Supervised by ${clinicInfo.medicalDirector.name}, ${clinicInfo.medicalDirector.specialty}`}
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
              href="/concerns"
              className="hover:text-rani-navy transition-colors"
            >
              Skin Concerns
            </Link>
            <ChevronRight size={14} />
            <span className="text-rani-navy font-semibold">
              {concern.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Overview */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="UNDERSTANDING YOUR CONCERN" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              About {concern.title}
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.2}>
            <div className="mt-8 font-body text-base text-rani-text leading-relaxed whitespace-pre-line">
              {concern.overview}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Causes & Symptoms */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="SIGNS & CAUSES" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Causes &amp; Symptoms
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <FadeInOnScroll delay={0.1}>
              <div className="rounded-xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="font-body text-lg font-bold text-rani-navy mb-4">
                  Common Causes
                </h3>
                <ul className="space-y-3">
                  {concern.causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                      <span className="font-body text-sm text-rani-text">
                        {cause}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.2}>
              <div className="rounded-xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="font-body text-lg font-bold text-rani-navy mb-4">
                  Signs &amp; Symptoms
                </h3>
                <ul className="space-y-3">
                  {concern.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-rani-gold"
                      />
                      <span className="font-body text-sm text-rani-text">
                        {symptom}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Treatment Options */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="YOUR TREATMENT OPTIONS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Recommended Treatments
            </h2>
            <p className="mt-4 text-center font-body text-base text-rani-muted max-w-2xl mx-auto">
              Every treatment plan is customized during your consultation. Here
              are the treatments we most commonly recommend for{" "}
              {concern.title.toLowerCase()}.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 space-y-6">
            {concern.treatments.map((treatment) => (
              <motion.div
                key={treatment.slug}
                variants={staggerItem}
                className="rounded-xl border border-rani-border bg-white p-6 transition-all hover:shadow-[0_10px_40px_rgba(15,29,44,0.06)] hover:border-rani-gold/30"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`${treatment.basePath}/${treatment.slug}`}
                      className="font-body text-lg font-bold text-rani-navy hover:text-rani-gold transition-colors"
                    >
                      {treatment.name}
                    </Link>
                    <p className="mt-2 font-body text-sm text-rani-text leading-relaxed">
                      {treatment.description}
                    </p>
                    <p className="mt-3 font-body text-xs text-rani-muted">
                      <span className="font-semibold text-rani-navy">
                        Best for:
                      </span>{" "}
                      {treatment.bestFor}
                    </p>
                  </div>
                  <Link
                    href={`${treatment.basePath}/${treatment.slug}`}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-rani-gold/30 px-4 py-2 font-body text-xs font-semibold text-rani-navy transition-all hover:bg-rani-gold hover:text-rani-navy hover:border-rani-gold"
                  >
                    Learn More
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Why Rani */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="THE RANI ADVANTAGE" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Why Choose Rani Beauty Clinic
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.2}>
            <p className="mt-8 font-body text-base text-rani-text leading-relaxed">
              {concern.whyRani}
            </p>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.3}>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Badge icon="shield">Physician-Supervised</Badge>
              <Badge icon="check">All Skin Types Welcome</Badge>
              <Badge icon="heart">Financing Available</Badge>
              <Badge icon="check">Open 7 Days a Week</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="COMMON QUESTIONS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Frequently Asked Questions
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 space-y-4">
            {concern.faqs.map((faq, i) => (
              <FadeInOnScroll key={i} delay={i * 0.1}>
                <details className="group rounded-xl border border-rani-border bg-white transition-all hover:shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-body text-base font-semibold text-rani-navy">
                    {faq.question}
                    <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-rani-gold text-xl">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-4">
                    <p className="font-body text-sm text-rani-muted leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Related Concerns */}
      {relatedConcerns.length > 0 && (
        <section className="bg-rani-cream py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="RELATED CONCERNS" />
              <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
                You May Also Be Interested In
              </h2>
            </FadeInOnScroll>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedConcerns.map((related, i) => (
                <FadeInOnScroll key={related.slug} delay={i * 0.15}>
                  <Link
                    href={`/concerns/${related.slug}`}
                    className="group block rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1"
                  >
                    <h3 className="font-body text-lg font-bold text-rani-navy group-hover:text-rani-gold transition-colors">
                      {related.title}
                    </h3>
                    <p className="mt-2 font-body text-sm text-rani-muted line-clamp-2">
                      {related.heroDescription}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 font-body text-xs font-semibold text-rani-gold">
                      Learn More
                      <ArrowRight size={12} />
                    </span>
                  </Link>
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cross Links */}
      {(() => {
        const costLinks = concern.treatments
          .map((t) => {
            const costSlug = getCostSlugForService(t.slug);
            return costSlug ? { name: t.name, costSlug } : null;
          })
          .filter(Boolean) as { name: string; costSlug: string }[];
        const compLinks = concern.treatments.flatMap((t) =>
          getComparisonsForService(t.slug).map((c) => ({ ...c, key: c.slug }))
        );
        // Deduplicate comparisons
        const seen = new Set<string>();
        const uniqueComps = compLinks.filter((c) => {
          if (seen.has(c.key)) return false;
          seen.add(c.key);
          return true;
        });
        if (costLinks.length === 0 && uniqueComps.length === 0) return null;
        return (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-4xl px-6">
              <div className="flex flex-wrap justify-center gap-3">
                {costLinks.map((cl) => (
                  <Link
                    key={cl.costSlug}
                    href={`/cost/${cl.costSlug}`}
                    className="rounded-full border border-rani-gold/20 bg-rani-cream px-4 py-2 font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
                  >
                    {cl.name} Cost →
                  </Link>
                ))}
                {uniqueComps.slice(0, 4).map((comp) => (
                  <Link
                    key={comp.slug}
                    href={`/compare/${comp.slug}`}
                    className="rounded-full border border-rani-gold/20 bg-rani-cream px-4 py-2 font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
                  >
                    {comp.treatmentA} vs {comp.treatmentB} →
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* CTA */}
      <CTABanner
        title={`Ready to Treat Your ${concern.title}?`}
        subtitle={`Call ${clinicInfo.phone} or book online to schedule your personalized consultation.`}
      />
    </>
  );
}
