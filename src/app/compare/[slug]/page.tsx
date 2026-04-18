import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Phone, Shield, Star, Check, X, ArrowRight } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { comparisonPages, ComparisonPage } from "@/data/comparisons";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return comparisonPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = comparisonPages.find((p) => p.slug === params.slug);
  if (!page) {
    return { title: "Comparison Not Found | Rani Beauty Clinic" };
  }

  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/compare/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "article",
      url: `${clinicInfo.website}/compare/${page.slug}`,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${page.treatmentA} vs ${page.treatmentB} - Rani Beauty Clinic`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.treatmentA} vs ${page.treatmentB} | Rani Beauty Clinic`,
      description: page.metaDescription,
    },
  };
}

export default function ComparePage({ params }: PageProps) {
  const page = comparisonPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  // Related comparisons (exclude current)
  const relatedComparisons = comparisonPages
    .filter((p) => p.slug !== page.slug)
    .slice(0, 6);

  // FAQ structured data
  const faqData = {
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

  // Article structured data
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.metaTitle,
    description: page.metaDescription,
    url: `${clinicInfo.website}/compare/${page.slug}`,
    author: {
      "@type": "Organization",
      name: clinicInfo.name,
      url: clinicInfo.website,
    },
    publisher: {
      "@type": "Organization",
      name: clinicInfo.name,
      url: clinicInfo.website,
    },
    mainEntityOfPage: `${clinicInfo.website}/compare/${page.slug}`,
  };

  return (
    <>
      <StructuredData data={faqData} />
      <StructuredData data={articleData} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: clinicInfo.website },
          { name: "Compare Treatments", url: `${clinicInfo.website}/compare` },
          { name: `${page.treatmentA} vs ${page.treatmentB}`, url: `${clinicInfo.website}/compare/${page.slug}` },
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0F1D2C] via-[#1a2d40] to-[#0F1D2C] py-12 sm:py-16 lg:py-28">
        <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 text-sm text-gray-400">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-[#C9A96E] transition-colors">Home</Link>
                </li>
                <li><ChevronRight size={14} className="text-gray-600" /></li>
                <li>
                  <Link href="/compare" className="hover:text-[#C9A96E] transition-colors">Compare</Link>
                </li>
                <li><ChevronRight size={14} className="text-gray-600" /></li>
                <li className="text-white font-medium">{page.treatmentA} vs {page.treatmentB}</li>
              </ol>
            </nav>
            <h1 className="font-playfair text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
              <span className="text-[#C9A96E]">{page.treatmentA}</span>
              {" "}vs{" "}
              <span className="text-[#C9A96E]">{page.treatmentB}</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base leading-relaxed text-gray-300 sm:text-xl">
              An honest, side-by-side comparison from the physician-supervised team at Rani Beauty Clinic in Renton, WA.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href={clinicInfo.booking.url}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 min-h-[48px] text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
              >
                Book Consultation
              </a>
              <a
                href={clinicInfo.phoneTel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 min-h-[48px] text-base font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {clinicInfo.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-white py-10 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-base sm:text-lg leading-relaxed text-gray-700">
            {page.intro}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-[#F8F6F1] py-10 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-2xl font-bold text-[#0F1D2C] sm:text-4xl">
            Side-by-Side Comparison
          </h2>
          {/* Desktop Table */}
          <div className="mt-8 sm:mt-10 hidden sm:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#0F1D2C] text-white">
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-[#C9A96E]">{page.treatmentA}</th>
                  <th className="px-6 py-4 font-semibold text-[#C9A96E]">{page.treatmentB}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {page.comparisonTable.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F6F1]/50"}>
                    <td className="px-6 py-4 font-semibold text-[#0F1D2C]">{row.category}</td>
                    <td className="px-6 py-4 text-gray-700">{row.treatmentA}</td>
                    <td className="px-6 py-4 text-gray-700">{row.treatmentB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: Stacked comparison cards per category */}
          <div className="mt-8 space-y-4 sm:hidden">
            {page.comparisonTable.map((row, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-[#0F1D2C] px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{row.category}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold text-[#C9A96E] mb-1">{page.treatmentA}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{row.treatmentA}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold text-[#C9A96E] mb-1">{page.treatmentB}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{row.treatmentB}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pros & Cons */}
      <section className="bg-white py-10 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-2xl font-bold text-[#0F1D2C] sm:text-4xl">
            Pros &amp; Cons
          </h2>
          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Treatment A */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-8 shadow-sm">
              <h3 className="font-playfair text-2xl font-bold text-[#0F1D2C]">{page.treatmentA}</h3>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Advantages</p>
                <ul className="mt-3 space-y-2.5">
                  {page.prosA.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm leading-relaxed text-gray-700">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Considerations</p>
                <ul className="mt-3 space-y-2.5">
                  {page.consA.map((con, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span className="text-sm leading-relaxed text-gray-700">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {page.relatedServiceA && (
                <Link
                  href={page.relatedServiceA}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-rani-gold-accessible hover:underline"
                >
                  Learn more about {page.treatmentA} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Treatment B */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-8 shadow-sm">
              <h3 className="font-playfair text-2xl font-bold text-[#0F1D2C]">{page.treatmentB}</h3>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Advantages</p>
                <ul className="mt-3 space-y-2.5">
                  {page.prosB.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm leading-relaxed text-gray-700">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Considerations</p>
                <ul className="mt-3 space-y-2.5">
                  {page.consB.map((con, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span className="text-sm leading-relaxed text-gray-700">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {page.relatedServiceB && (
                <Link
                  href={page.relatedServiceB}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-rani-gold-accessible hover:underline"
                >
                  Learn more about {page.treatmentB} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="bg-[#F8F6F1] py-10 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#C9A96E]/20 bg-white p-5 sm:p-8 shadow-sm lg:p-10">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-rani-gold-accessible" />
              <h2 className="font-playfair text-2xl font-bold text-[#0F1D2C] sm:text-3xl">
                Our Verdict
              </h2>
            </div>
            <p className="text-base leading-relaxed text-gray-700">
              {page.verdict}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href={clinicInfo.booking.url}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-6 min-h-[48px] text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
              >
                Book a Consultation
              </a>
              <a
                href={clinicInfo.phoneTel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0F1D2C]/20 px-6 min-h-[48px] text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#0F1D2C] hover:text-white"
              >
                <Phone className="h-4 w-4" />
                {clinicInfo.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-10 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-2xl font-bold text-[#0F1D2C] sm:text-4xl">
            {page.treatmentA} vs {page.treatmentB} FAQ
          </h2>
          <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-4">
            {page.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-200 bg-[#F8F6F1]"
              >
                <summary className="flex cursor-pointer items-center justify-between px-4 sm:px-6 py-4 text-[15px] sm:text-base font-semibold text-[#0F1D2C] min-h-[48px] gap-3">
                  <span>{faq.question}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-90" />
                </summary>
                <p className="px-4 sm:px-6 pb-4 text-sm leading-relaxed text-gray-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Comparisons */}
      <section className="bg-[#F8F6F1] py-10 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
            More Treatment Comparisons
          </h2>
          <p className="mt-2 text-gray-600">
            Make informed decisions with our physician-reviewed side-by-side guides.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedComparisons.map((related) => (
              <Link
                key={related.slug}
                href={`/compare/${related.slug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition hover:border-[#C9A96E]/30 hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E]">
                    {related.treatmentA} vs {related.treatmentB}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#C9A96E]" />
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 text-sm font-semibold text-rani-gold-accessible hover:underline"
            >
              View All Comparisons <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl font-bold text-white sm:text-4xl">
            Still Not Sure? Let Us Help.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-gray-300">
            Book a personalized consultation and our physician-supervised team will recommend the right treatment for your goals, skin type, and budget.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href={clinicInfo.booking.url}
              className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 min-h-[48px] text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
            >
              Book Online
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 min-h-[48px] text-base font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              Call {clinicInfo.phone}
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-[#C9A96E]" />
              {clinicInfo.reviews.aggregateRating}/5 on Google
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#C9A96E]" />
              Physician-supervised
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
