import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowRight, BookOpen } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { pillarGuides } from "@/data/guides/pillar-pages";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return pillarGuides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const guide = pillarGuides.find((g) => g.slug === params.slug);
  if (!guide) return { title: "Guide Not Found | Rani Beauty Clinic" };

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/guides/${params.slug}`,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: "article",
      url: `${clinicInfo.website}/guides/${params.slug}`,
    },
  };
}

export default function GuidePage({ params }: PageProps) {
  const guide = pillarGuides.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    author: { "@type": "Organization", name: "Rani Beauty Clinic" },
    publisher: { "@type": "Organization", name: "Rani Beauty Clinic", url: clinicInfo.website },
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Guides", url: `${clinicInfo.website}/guides` },
    { name: guide.title, url: `${clinicInfo.website}/guides/${guide.slug}` },
  ];

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={articleSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-rani-navy transition-colors">Home</Link></li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><Link href="/guides" className="hover:text-rani-navy transition-colors">Guides</Link></li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><span className="text-rani-navy font-semibold">{guide.title}</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label="COMPREHENSIVE GUIDE"
        title={guide.title}
        subtitle={guide.heroSubtitle}
        primaryCTA={{ text: "Book Consultation", href: "/contact" }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Physician Supervised", "Expert Guide"]}
        dark
      />

      {/* Table of Contents + Content */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Sidebar TOC */}
            <aside className="mb-10 lg:mb-0">
              <div className="lg:sticky lg:top-28">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={16} className="text-rani-gold" />
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-muted">
                    In This Guide
                  </span>
                </div>
                <nav className="space-y-1">
                  {guide.tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 font-body text-sm text-rani-text transition-colors hover:bg-rani-cream hover:text-rani-navy"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="space-y-16">
              {guide.sections.map((section) => (
                <FadeInOnScroll key={section.id}>
                  <div id={section.id} className="scroll-mt-28">
                    <h2 className="font-body text-2xl font-bold text-rani-navy md:text-3xl mb-6">
                      {section.heading}
                    </h2>
                    <div className="font-body text-base leading-[1.85] text-rani-text space-y-4">
                      {section.content.split(". ").reduce((acc: string[][], sentence, i, arr) => {
                        const idx = Math.floor(i / Math.ceil(arr.length / 3));
                        if (!acc[idx]) acc[idx] = [];
                        acc[idx].push(sentence + (i < arr.length - 1 ? "." : ""));
                        return acc;
                      }, []).map((group, i) => (
                        <p key={i}>{group.join(" ")}</p>
                      ))}
                    </div>
                  </div>
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="RELATED SERVICES" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Explore Our Treatments
            </h2>
          </FadeInOnScroll>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {guide.relatedServices.map((svc) => (
              <Link
                key={svc.slug}
                href={svc.category === "wellness" ? `/wellness/${svc.slug}` : `/services/${svc.slug}`}
                className="group flex items-center justify-between rounded-xl border border-rani-gold/10 bg-white px-5 py-4 transition-all hover:border-rani-gold hover:shadow-sm"
              >
                <span className="font-body text-sm font-semibold text-rani-navy group-hover:text-rani-gold">
                  {svc.title}
                </span>
                <ArrowRight size={14} className="text-rani-muted transition-transform group-hover:translate-x-1 group-hover:text-rani-gold" />
              </Link>
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
            {guide.faqs.map((faq, i) => (
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
          <Badge icon="check">Woman-Owned</Badge>
          <Badge icon="clock">Open 7 Days</Badge>
        </div>
      </FadeInOnScroll>

      <CTABanner
        label="BOOK YOUR CONSULTATION"
        title="Ready to Get Started?"
        subtitle={`Schedule a consultation at Rani Beauty Clinic. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
