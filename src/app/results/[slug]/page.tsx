import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Layers, RefreshCw, ImageIcon } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { galleryPages } from "@/data/results/gallery";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return galleryPages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = galleryPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Results Not Found | Rani Beauty Clinic" };

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/results/${params.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/results/${params.slug}`,
    },
  };
}

export default function GalleryPage({ params }: PageProps) {
  const page = galleryPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const servicePath =
    page.category === "wellness"
      ? `/wellness/${page.serviceSlug}`
      : `/services/${page.serviceSlug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Results", url: `${clinicInfo.website}/results` },
    { name: page.title, url: `${clinicInfo.website}/results/${page.slug}` },
  ];

  return (
    <>
      <StructuredData data={faqSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-rani-navy transition-colors">Home</Link></li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><Link href="/results" className="hover:text-rani-navy transition-colors">Results</Link></li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><span className="text-rani-navy font-semibold">{page.title}</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label="BEFORE & AFTER"
        title={page.title}
        subtitle={`Real patient results from Rani Beauty Clinic in Renton, WA. All treatments physician-supervised by ${clinicInfo.medicalDirector.name}.`}
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.booking.url, target: "_blank" }}
        secondaryCTA={{ text: "Learn More", href: servicePath }}
        badges={["Physician Supervised", "Real Patients"]}
        dark
      />

      {/* Description & Info */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <p className="font-body text-base leading-relaxed text-rani-text mb-10">
              {page.description}
            </p>
          </FadeInOnScroll>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FadeInOnScroll delay={0.1}>
              <div className="rounded-xl border border-rani-gold/10 bg-rani-cream p-5">
                <Clock size={18} className="text-rani-gold mb-2" />
                <h3 className="font-body text-sm font-bold text-rani-navy mb-1">Result Timeline</h3>
                <p className="font-body text-xs text-rani-muted leading-relaxed">{page.resultTimeline}</p>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.2}>
              <div className="rounded-xl border border-rani-gold/10 bg-rani-cream p-5">
                <Layers size={18} className="text-rani-gold mb-2" />
                <h3 className="font-body text-sm font-bold text-rani-navy mb-1">Sessions Needed</h3>
                <p className="font-body text-xs text-rani-muted leading-relaxed">{page.sessionsNeeded}</p>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.3}>
              <div className="rounded-xl border border-rani-gold/10 bg-rani-cream p-5">
                <RefreshCw size={18} className="text-rani-gold mb-2" />
                <h3 className="font-body text-sm font-bold text-rani-navy mb-1">Maintenance</h3>
                <p className="font-body text-xs text-rani-muted leading-relaxed">{page.maintenanceInfo}</p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="GALLERY" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Patient Results
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-sm text-rani-muted">
              Before and after photos coming soon. Schedule a consultation to see results in person.
            </p>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <FadeInOnScroll key={i} delay={i * 0.1}>
                <div className="aspect-square rounded-xl border border-rani-gold/10 bg-white flex flex-col items-center justify-center gap-3">
                  <ImageIcon size={32} className="text-rani-muted/30" />
                  <span className="font-body text-xs text-rani-muted/50">Coming Soon</span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="FAQ" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Frequently Asked Questions
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 space-y-6">
            {page.faqs.map((faq, i) => (
              <FadeInOnScroll key={i} delay={i * 0.1}>
                <div className="rounded-xl bg-rani-cream p-6 border border-rani-gold/10">
                  <h3 className="font-body text-base font-bold text-rani-navy">{faq.question}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-rani-text">{faq.answer}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      <FadeInOnScroll>
        <div className="bg-white pb-8 flex flex-wrap items-center justify-center gap-3">
          <Badge icon="shield">Physician Supervised</Badge>
          <Badge icon="check">Real Patients</Badge>
          <Badge icon="clock">Open 7 Days</Badge>
        </div>
      </FadeInOnScroll>

      <CTABanner
        label={page.title.toUpperCase()}
        title={`Ready to See Your Own ${page.title.replace(" Before & After", "")} Results?`}
        subtitle={`Schedule a consultation at Rani Beauty Clinic. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
