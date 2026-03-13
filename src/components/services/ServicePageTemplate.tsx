"use client";

import { ChevronRight, Shield, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import CTABanner from "@/components/sections/CTABanner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { motion } from "framer-motion";
import { staggerItem } from "@/components/animations/StaggerChildren";
import { getServiceImage } from "@/data/service-images";

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

  const serviceStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    provider: {
      "@type": "MedicalBusiness",
      name: clinicInfo.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: clinicInfo.address.street,
        addressLocality: clinicInfo.address.city,
        addressRegion: clinicInfo.address.state,
        postalCode: clinicInfo.address.zip,
      },
    },
  };

  return (
    <>
      <StructuredData data={faqStructuredData} />
      <StructuredData data={serviceStructuredData} />

      {/* Hero — with service image background */}
      <Hero
        title={service.title}
        subtitle={service.heroDescription}
        primaryCTA={{ text: "Book This Treatment", href: clinicInfo.booking.url }}
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
      <section className="bg-white py-20 md:py-28">
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
      <section className="bg-rani-cream py-20 md:py-28">
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
      <section className="bg-white py-20 md:py-28">
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
      <section className="bg-rani-cream py-20 md:py-28">
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
      <section className="bg-white py-20 md:py-28">
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

      {/* Why Rani */}
      <section className="bg-rani-cream py-20 md:py-28">
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
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeInOnScroll>
            <SectionLabel label="INVESTMENT" />
            <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Pricing
            </h2>
            <p className="mt-6 font-body text-base text-rani-muted">
              Contact us for personalized pricing. We offer competitive rates and
              flexible financing through Cherry and PatientFi.
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

      {/* Results Gallery — service treatment images */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeInOnScroll>
            <SectionLabel label="RESULTS GALLERY" />
            <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Treatment Gallery
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3">
              {serviceImageData && serviceImageData.image ? (
                <>
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <Image
                      src={serviceImageData.image}
                      alt={`${service.title} treatment`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  {serviceImageData.hoverImage && (
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      <Image
                        src={serviceImageData.hoverImage}
                        alt={`${service.title} results`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-rani-navy to-rani-navy-light flex flex-col items-center justify-center p-4">
                    <p className="font-heading text-2xl text-rani-gold mb-2">
                      Book Now
                    </p>
                    <p className="font-body text-xs text-gray-300">
                      See your own results
                    </p>
                  </div>
                </>
              ) : (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center"
                  >
                    <p className="font-body text-xs text-gray-400 px-4 text-center">
                      Photos coming soon
                    </p>
                  </div>
                ))
              )}
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
        <section className="bg-rani-cream py-20 md:py-28">
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
      <section className="bg-rani-cream py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/cost/${service.slug}-cost`}
              className="rounded-full border border-rani-gold/20 bg-white px-4 py-2 font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
            >
              {service.title} Cost →
            </Link>
            <Link
              href={`/results/${service.slug}`}
              className="rounded-full border border-rani-gold/20 bg-white px-4 py-2 font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
            >
              Before & After →
            </Link>
            <Link
              href="/locations"
              className="rounded-full border border-rani-gold/20 bg-white px-4 py-2 font-body text-xs font-semibold text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
            >
              Locations Near You →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTABanner
        title={`Ready to Book Your ${service.title}?`}
        subtitle={`Call ${clinicInfo.phone} or book online to schedule your consultation.`}
      />
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
