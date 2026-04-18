import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { combinationPages, CombinationPage } from "@/data/seo/combination-pages";
import { clinicInfo } from "@/data/clinic-info";
import StructuredData from "@/components/seo/StructuredData";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return combinationPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = combinationPages.find((p) => p.slug === params.slug);
  if (!page) return {};

  const canonical = `${clinicInfo.website}/combinations/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      siteName: "Rani Beauty Clinic",
      type: "website",
      locale: "en_US",
    },
  };
}

export default function CombinationPageRoute({ params }: PageProps) {
  const page = combinationPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const canonical = `${clinicInfo.website}/combinations/${page.slug}`;

  const faqSchema = {
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
        name: "Treatment Combinations",
        item: `${clinicInfo.website}/combinations`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.title,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Hero */}
      <section className="relative bg-[#0F1D2C] py-24 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center justify-center gap-2 text-sm text-[#C9A96E]/70">
              <li>
                <Link href="/" className="hover:text-[#C9A96E] transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/combinations"
                  className="hover:text-[#C9A96E] transition-colors"
                >
                  Combinations
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#C9A96E]">{page.title}</li>
            </ol>
          </nav>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-6">
            {page.title}
          </h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
            {page.heroDescription}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {page.treatments.map((treatment) => (
              <span
                key={treatment}
                className="rounded-full border border-[#C9A96E]/30 px-4 py-1.5 text-sm text-[#C9A96E]"
              >
                {treatment}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Combination Works */}
      <section className="bg-[#F8F6F1] py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] mb-8">
            Why This Combination Works
          </h2>
          <p className="text-lg text-[#0F1D2C]/70 leading-relaxed">
            {page.whySynergy}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] text-center mb-12">
            Combined Benefits
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {page.combinationBenefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-[#C9A96E]/15 bg-[#F8F6F1]/50 p-6"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C9A96E]/10 text-sm font-medium text-rani-gold-accessible">
                  {i + 1}
                </span>
                <p className="text-[#0F1D2C]/80 leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scheduling Guide */}
      <section className="bg-[#0F1D2C] py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-light text-white text-center mb-12">
            Your Treatment Timeline
          </h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#C9A96E]/20 hidden md:block" />
            <div className="space-y-8">
              {page.schedulingGuide.map((step, i) => (
                <div
                  key={i}
                  className="relative flex flex-col md:flex-row md:items-start gap-4 md:gap-8 md:pl-16"
                >
                  <div className="absolute left-[18px] top-2 hidden h-3 w-3 rounded-full border-2 border-[#C9A96E] bg-[#0F1D2C] md:block" />
                  <div className="shrink-0 rounded-lg bg-[#C9A96E]/10 px-4 py-2 text-center md:w-36">
                    <span className="text-sm font-medium text-[#C9A96E]">
                      {step.timing}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1">
                      {step.step}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {step.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Sections */}
      {page.sections.length > 0 && (
        <section className="bg-[#F8F6F1] py-20 px-6">
          <div className="mx-auto max-w-3xl space-y-16">
            {page.sections.map((section, i) => (
              <div key={i} className="text-center">
                <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] mb-6">
                  {section.heading}
                </h2>
                <p className="text-lg text-[#0F1D2C]/70 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expected Results */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] text-center mb-12">
            Expected Results
          </h2>
          <ul className="space-y-4">
            {page.expectedResults.map((result, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9A96E]" />
                <p className="text-[#0F1D2C]/80 leading-relaxed">{result}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      {page.faqs.length > 0 && (
        <section className="bg-[#F8F6F1] py-20 px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-light text-[#0F1D2C] text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {page.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#C9A96E]/15 bg-white p-6"
                >
                  <h3 className="text-lg font-medium text-[#0F1D2C] mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-[#0F1D2C]/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-24 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Book your personalized treatment combination consultation today and
            discover what curated care can do for you.
          </p>
          <Link
            href="/book"
            className="inline-block rounded-full bg-[#C9A96E] px-10 py-4 text-sm font-medium uppercase tracking-widest text-[#0F1D2C] transition-colors hover:bg-[#C9A96E]/90"
          >
            Book Your Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
