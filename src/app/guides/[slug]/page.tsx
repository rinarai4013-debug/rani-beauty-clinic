import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { pillarGuides, PillarGuide } from "@/data/guides/pillar-pages";

export function generateStaticParams() {
  return pillarGuides.map((guide) => ({
    slug: guide.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const guide = pillarGuides.find((g) => g.slug === params.slug);
  if (!guide) return { title: "Guide Not Found" };

  const canonical = `${clinicInfo.website}/guides/${guide.slug}`;

  return {
    title: { absolute: guide.metaTitle },
    description: guide.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: "article",
      url: canonical,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${guide.metaTitle} - Rani Beauty Clinic`,
        },
      ],
    },
  };
}

function buildStructuredData(guide: PillarGuide) {
  const canonical = `${clinicInfo.website}/guides/${guide.slug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: clinicInfo.website,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${clinicInfo.website}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: canonical,
      },
    ],
  };

  return { faqSchema, breadcrumbSchema };
}

export default function PillarGuidePage({
  params,
}: {
  params: { slug: string };
}) {
  const guide = pillarGuides.find((g) => g.slug === params.slug);

  if (!guide) {
    notFound();
  }

  const { faqSchema, breadcrumbSchema } = buildStructuredData(guide);

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="bg-[#F8F6F1] border-b border-[#C9A96E]/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-[#0F1D2C]/60">
            <li>
              <Link href="/" className="hover:text-[#C9A96E] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/guides"
                className="hover:text-[#C9A96E] transition-colors"
              >
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#0F1D2C] font-medium">{guide.title}</li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#0F1D2C] text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A96E] uppercase tracking-widest text-sm font-medium mb-4">
            Comprehensive Guide
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
            {guide.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
            {guide.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 bg-white border-b border-[#C9A96E]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-serif font-bold text-[#0F1D2C] mb-6">
            In This Guide
          </h2>
          <nav aria-label="Table of contents">
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {guide.tableOfContents.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8F6F1] transition-colors group"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#C9A96E]/20 text-rani-gold-accessible flex items-center justify-center text-xs font-bold group-hover:bg-[#C9A96E] group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    <span className="text-[#0F1D2C]/80 group-hover:text-[#0F1D2C] text-sm font-medium transition-colors">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      {/* Guide Sections */}
      <article className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {guide.sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              className={i > 0 ? "mt-16 pt-16 border-t border-[#C9A96E]/20" : ""}
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-6">
                {section.heading}
              </h2>
              <div className="prose prose-lg max-w-none text-[#0F1D2C]/70 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </article>

      {/* Related Services */}
      <section className="py-16 sm:py-20 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Related Services
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guide.relatedServices.map((service) => {
              const basePath =
                service.category === "wellness" ? "wellness" : "services";
              return (
                <Link
                  key={service.slug}
                  href={`/${basePath}/${service.slug}`}
                  className="group block bg-white rounded-xl border border-[#C9A96E]/20 p-6 hover:border-[#C9A96E] hover:shadow-lg transition-all"
                >
                  <span className="inline-block mb-3 text-xs uppercase tracking-wider font-medium text-rani-gold-accessible">
                    {service.category === "wellness"
                      ? "Wellness"
                      : "Aesthetic"}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#0F1D2C] group-hover:text-[#C9A96E] transition-colors">
                    {service.title}
                  </h3>
                  <span className="inline-block mt-4 text-rani-gold-accessible text-sm font-medium">
                    View service &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1D2C] mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl">
            {guide.faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b border-[#C9A96E]/20 pb-6 last:border-b-0"
              >
                <h3 className="text-lg font-semibold text-[#0F1D2C] mb-2">
                  {faq.question}
                </h3>
                <p className="text-[#0F1D2C]/70 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-[#0F1D2C] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Have More Questions?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Our physician-supervised team is here to answer all your questions
            and create a personalized treatment plan just for you.
          </p>
          <a
            href={clinicInfo.phoneTel}
            className="inline-block px-8 py-3 bg-[#C9A96E] text-[#0F1D2C] rounded-lg hover:bg-[#C9A96E]/90 transition-colors font-bold"
          >
            Book a Consultation
          </a>
        </div>
      </section>
    </>
  );
}
