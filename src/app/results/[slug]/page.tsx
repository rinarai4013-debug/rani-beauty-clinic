import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shield, Award, CheckCircle } from "lucide-react";

import { galleryPages } from "@/data/results/gallery";
import { testimonials } from "@/data/testimonials";
import { clinicInfo } from "@/data/clinic-info";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import StructuredData from "@/components/seo/StructuredData";

/* ─── Static params ──────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return galleryPages.map((page) => ({ slug: page.slug }));
}

/* ─── Metadata ───────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const gallery = galleryPages.find((g) => g.slug === params.slug);
  if (!gallery) {
    return { title: "Results Not Found" };
  }

  return {
    title: gallery.metaTitle,
    description: gallery.metaDescription,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/results/${params.slug}`,
    },
    openGraph: {
      title: `${gallery.title} | Rani Beauty Clinic`,
      description: gallery.metaDescription,
      url: `https://www.ranibeautyclinic.com/results/${params.slug}`,
      images: gallery.images[0]
        ? [{ url: gallery.images[0], width: 800, height: 600 }]
        : undefined,
    },
  };
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ResultsPage({
  params,
}: {
  params: { slug: string };
}) {
  const gallery = galleryPages.find((g) => g.slug === params.slug);
  if (!gallery) notFound();

  // Filter testimonials that match this service
  const serviceTestimonials = testimonials.filter(
    (t) => t.treatmentSlug === gallery.slug
  );

  // Related results — other gallery pages excluding the current one
  const relatedResults = galleryPages
    .filter((g) => g.slug !== gallery.slug)
    .slice(0, 4);

  // Structured data for SEO
  const baseUrl = "https://www.ranibeautyclinic.com";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Results",
        item: `${baseUrl}/results`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: gallery.title,
        item: `${baseUrl}/results/${gallery.slug}`,
      },
    ],
  };

  const imageGallerySchema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: gallery.title,
    description: gallery.metaDescription,
    url: `${baseUrl}/results/${gallery.slug}`,
    provider: {
      "@type": "MedicalBusiness",
      name: "Rani Beauty Clinic",
      url: baseUrl,
      telephone: clinicInfo.phoneTel.replace(/^tel:/, ""),
      address: {
        "@type": "PostalAddress",
        streetAddress: clinicInfo.address.street,
        addressLocality: clinicInfo.address.city,
        addressRegion: clinicInfo.address.state,
        postalCode: clinicInfo.address.zip,
      },
    },
    image: gallery.images.map((src, index) => ({
      "@type": "ImageObject",
      url: `${baseUrl}${src}`,
      name: `${gallery.title} result ${index + 1}`,
      description: `${gallery.title} at Rani Beauty Clinic in Renton, WA`,
    })),
  };

  const faqSchema =
    gallery.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: gallery.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={imageGallerySchema} />
      {faqSchema && <StructuredData data={faqSchema} />}

      <Breadcrumbs
        items={[
          { label: "Results", href: "/results" },
          { label: gallery.title, href: `/results/${gallery.slug}` },
        ]}
      />

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-rani-cream to-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <SectionLabel label="REAL RESULTS" />
          <h1 className="mt-6 font-heading text-4xl font-bold text-rani-navy md:text-5xl lg:text-6xl">
            {gallery.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-lg text-rani-muted leading-relaxed">
            {gallery.description}
          </p>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2.5 font-body text-sm text-rani-navy">
              <Shield size={20} className="text-rani-gold flex-shrink-0" />
              <span>Physician-Supervised</span>
            </div>
            <div className="flex items-center gap-2.5 font-body text-sm text-rani-navy">
              <Award size={20} className="text-rani-gold flex-shrink-0" />
              <span>Board-Certified Medical Director</span>
            </div>
            <div className="flex items-center gap-2.5 font-body text-sm text-rani-navy">
              <CheckCircle size={20} className="text-rani-gold flex-shrink-0" />
              <span>{clinicInfo.reviews.reviewCount}+ Five-Star Reviews</span>
            </div>
          </div>

          {/* Treatment Details */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-rani-border/50 bg-white p-5 shadow-sm">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                Timeline
              </p>
              <p className="mt-2 font-body text-sm text-rani-text leading-relaxed">
                {gallery.resultTimeline}
              </p>
            </div>
            <div className="rounded-xl border border-rani-border/50 bg-white p-5 shadow-sm">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                Sessions
              </p>
              <p className="mt-2 font-body text-sm text-rani-text leading-relaxed">
                {gallery.sessionsNeeded}
              </p>
            </div>
            <div className="rounded-xl border border-rani-border/50 bg-white p-5 shadow-sm">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                Maintenance
              </p>
              <p className="mt-2 font-body text-sm text-rani-text leading-relaxed">
                {gallery.maintenanceInfo}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Image Gallery ───────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Before &amp; After Gallery
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-rani-muted">
              Real patient outcomes from Rani Beauty Clinic. All treatments
              performed under physician supervision.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.images.map((src, index) => (
              <div
                key={src}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-rani-border/30 bg-rani-cream shadow-sm transition-shadow duration-300 hover:shadow-lg"
              >
                <Image
                  src={src}
                  alt={`${gallery.title} result ${index + 1} at Rani Beauty Clinic`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading={index < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rani-navy/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ────────────────────────────────────────────────────────── */}
      {gallery.faqs.length > 0 && (
        <section className="bg-rani-cream py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <SectionLabel label="FREQUENTLY ASKED" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Common Questions
            </h2>
            <div className="mt-12 space-y-6">
              {gallery.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-rani-border/50 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-heading text-lg font-semibold text-rani-navy">
                    {faq.question}
                  </h3>
                  <p className="mt-3 font-body text-base text-rani-muted leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      {serviceTestimonials.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionLabel label="PATIENT STORIES" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              What Our Patients Say
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {serviceTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="relative border-l-[3px] border-l-rani-gold rounded-xl bg-rani-cream/50 p-8 shadow-sm"
                >
                  <span className="absolute -top-2 left-6 font-heading text-6xl text-rani-gold leading-none select-none">
                    &ldquo;
                  </span>
                  <div className="mt-4">
                    <p className="font-body text-lg text-rani-text italic leading-relaxed">
                      {t.text}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm font-semibold text-rani-navy">
                          {t.name}
                        </p>
                        <p className="font-body text-xs text-rani-muted mt-0.5">
                          {t.treatment}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <svg
                            key={i}
                            className="h-4 w-4 fill-rani-gold text-rani-gold"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {t.location && (
                      <p className="mt-2 font-body text-xs text-rani-muted">
                        {t.location} &middot; {t.date}
                      </p>
                    )}
                    {t.verified && (
                      <p className="mt-1 font-body text-xs text-rani-gold font-medium">
                        Verified Patient
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ─────────────────────────────────────────────────── */}
      <section className="bg-rani-navy py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Ready for Your Transformation?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-white/70 leading-relaxed">
            Schedule a complimentary consultation with our physician-supervised
            team and discover what&apos;s possible for you.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="secondary"
              href={clinicInfo.booking.url}
              target="_blank"
            >
              Book a Consultation
            </Button>
            <Button variant="ghost" href={`tel:${clinicInfo.phone}`} className="text-white hover:text-rani-gold">
              Call {clinicInfo.phone}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Related Results ──────────────────────────────────────────────── */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionLabel label="EXPLORE MORE" />
          <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
            More Real Results
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedResults.map((related) => (
              <Link
                key={related.slug}
                href={`/results/${related.slug}`}
                className="group overflow-hidden rounded-xl border border-rani-border/30 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={related.images[0]}
                    alt={related.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-base font-semibold text-rani-navy group-hover:text-rani-gold transition-colors duration-200">
                    {related.title}
                  </h3>
                  <p className="mt-1 font-body text-xs text-rani-muted line-clamp-2">
                    {related.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="ghost" href="/results">
              View All Results
            </Button>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <section className="border-t border-rani-border/30 bg-white py-8">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-xs text-rani-muted leading-relaxed">
            <strong>Disclaimer:</strong> Individual results may vary. The images
            and testimonials on this page represent the experiences of actual
            patients and are not a guarantee of specific outcomes. All medical
            aesthetic treatments at Rani Beauty Clinic are performed under the
            supervision of {clinicInfo.medicalDirector.name},{" "}
            {clinicInfo.medicalDirector.specialty}. A personalized consultation
            is required to determine the best treatment plan for your individual
            needs and goals.
          </p>
        </div>
      </section>
    </>
  );
}
