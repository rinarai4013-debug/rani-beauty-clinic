import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Phone, Shield, Star, Clock, CreditCard, DollarSign } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { costPages } from "@/data/cost-pages";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return costPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = costPages.find((p) => p.slug === params.slug);
  if (!page) {
    return { title: "Pricing Not Found | Rani Beauty Clinic" };
  }

  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/cost/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/cost/${page.slug}`,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${page.service} Cost - Rani Beauty Clinic`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.service} Cost | Rani Beauty Clinic`,
      description: page.metaDescription,
    },
  };
}

// Map cost page slugs to their parent service pages for cross-linking
const serviceSlugMap: Record<string, { href: string; label: string }> = {
  "laser-hair-removal-cost": { href: "/services/laser-hair-removal", label: "Laser Hair Removal" },
  "hydrafacial-cost": { href: "/services/hydrafacial", label: "HydraFacial" },
  "rf-microneedling-cost": { href: "/services/rf-microneedling", label: "RF Microneedling" },
  "botox-cost": { href: "/services/botox-dysport", label: "Botox & Dysport" },
  "dermal-fillers-cost": { href: "/services/dermal-fillers", label: "Dermal Fillers" },
  "chemical-peels-cost": { href: "/services/chemical-peels", label: "Chemical Peels" },
  "biorepeel-cost": { href: "/services/biorepeel", label: "BioRePeel" },
  "sofwave-cost": { href: "/services/sofwave", label: "Sofwave" },
  "scar-reduction-cost": { href: "/services/scar-reduction", label: "Scar Reduction" },
  "glp1-cost": { href: "/wellness/glp1-weight-management", label: "GLP-1 Weight Management" },
  "semaglutide-cost": { href: "/wellness/glp1-weight-management", label: "GLP-1 Weight Management" },
  "tirzepatide-cost": { href: "/wellness/glp1-weight-management", label: "GLP-1 Weight Management" },
  "peptide-therapy-cost": { href: "/wellness/nad-injections", label: "Peptide Therapy" },
  "nad-injections-cost": { href: "/wellness/nad-injections", label: "NAD+ Injections" },
  "hormone-therapy-cost": { href: "/wellness/hormone-therapy", label: "Hormone Therapy" },
  "testosterone-cost": { href: "/wellness/hormone-therapy", label: "Hormone Therapy" },
  "vitamin-injections-cost": { href: "/wellness/vitamin-injections", label: "Vitamin Injections" },
  "blood-work-cost": { href: "/wellness/blood-work", label: "Blood Work" },
};

export default function CostPage({ params }: PageProps) {
  const page = costPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  const serviceLink = serviceSlugMap[page.slug];

  // Related cost pages (exclude current)
  const relatedCostPages = costPages
    .filter((p) => p.slug !== page.slug)
    .slice(0, 6);

  // Product structured data
  const productData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${page.service} at Rani Beauty Clinic`,
    description: page.metaDescription,
    url: `${clinicInfo.website}/cost/${page.slug}`,
    brand: {
      "@type": "Brand",
      name: clinicInfo.name,
    },
    offers: page.priceRanges.map((range) => ({
      "@type": "Offer",
      name: range.item,
      price: range.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
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
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating,
      reviewCount: clinicInfo.reviews.reviewCount,
      bestRating: 5,
    },
  };

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

  return (
    <>
      <StructuredData data={productData} />
      <StructuredData data={faqData} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: clinicInfo.website },
          { name: "Pricing", url: `${clinicInfo.website}/pricing` },
          { name: `${page.service} Cost`, url: `${clinicInfo.website}/cost/${page.slug}` },
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0F1D2C] via-[#1a2d40] to-[#0F1D2C] py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-400">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-[#C9A96E] transition-colors">Home</Link>
                </li>
                <li><ChevronRight size={14} className="text-gray-600" /></li>
                <li>
                  <Link href="/pricing" className="hover:text-[#C9A96E] transition-colors">Pricing</Link>
                </li>
                <li><ChevronRight size={14} className="text-gray-600" /></li>
                <li className="text-white font-medium">{page.service}</li>
              </ol>
            </nav>
            <h1 className="font-playfair text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              {page.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300 sm:text-xl">
              Transparent pricing at Rani Beauty Clinic in Renton, WA. Physician-supervised treatments with financing available.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={clinicInfo.booking.url}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 py-3.5 text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
              >
                Book Consultation
              </a>
              <a
                href={clinicInfo.phoneTel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {clinicInfo.phone}
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[#C9A96E]" />
                {clinicInfo.reviews.aggregateRating} Stars on Google
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#C9A96E]" />
                Physician-supervised
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#C9A96E]" />
                Financing available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + Pricing Table */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-lg leading-relaxed text-gray-700">
                {page.intro}
              </p>

              {/* Pricing Table */}
              <div className="mt-10 overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0F1D2C] text-white">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Treatment</th>
                      <th className="px-6 py-4 font-semibold">Price</th>
                      <th className="hidden px-6 py-4 font-semibold sm:table-cell">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {page.priceRanges.map((range, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F6F1]/50"}>
                        <td className="px-6 py-4 font-medium text-[#0F1D2C]">
                          {range.item}
                          {range.note && (
                            <span className="block text-xs text-gray-500 sm:hidden">{range.note}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-lg font-bold text-[#C9A96E]">{range.price}</td>
                        <td className="hidden px-6 py-4 text-gray-500 sm:table-cell">{range.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {serviceLink && (
                <div className="mt-6">
                  <Link
                    href={serviceLink.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
                  >
                    Learn more about {serviceLink.label} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Pricing Factors */}
              <div className="mt-12">
                <h2 className="font-playfair text-2xl font-bold text-[#0F1D2C] sm:text-3xl">
                  What Affects {page.service} Cost?
                </h2>
                <ul className="mt-6 space-y-4">
                  {page.factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A96E]" />
                      <span className="text-base leading-relaxed text-gray-700">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financing Card */}
              <div className="rounded-2xl border border-[#C9A96E]/20 bg-gradient-to-b from-[#0F1D2C] to-[#1a2d40] p-6 text-white">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <CreditCard className="h-5 w-5 text-[#C9A96E]" />
                  Financing Options
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  {page.financingNote}
                </p>
                <div className="mt-6 space-y-3">
                  <a
                    href={clinicInfo.financing.cherry.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-[#C9A96E] py-2.5 text-center text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
                  >
                    Apply with Cherry
                  </a>
                  <a
                    href={clinicInfo.financing.patientfi.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg border border-white/20 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Apply with PatientFi
                  </a>
                </div>
              </div>

              {/* Clinic Info Card */}
              <div className="rounded-2xl border border-gray-100 bg-[#F8F6F1] p-6">
                <h3 className="text-lg font-bold text-[#0F1D2C]">Rani Beauty Clinic</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#C9A96E]" /> {clinicInfo.hours.formatted}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#C9A96E]" />
                    <a href={clinicInfo.phoneTel} className="text-[#C9A96E] hover:underline">{clinicInfo.phone}</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#C9A96E]" /> {clinicInfo.medicalDirector.name}
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#C9A96E]" /> {clinicInfo.reviews.aggregateRating} Stars ({clinicInfo.reviews.reviewCount} reviews)
                  </li>
                </ul>
                <a
                  href={clinicInfo.booking.url}
                  className="mt-6 block w-full rounded-lg bg-[#0F1D2C] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1a2d40]"
                >
                  Book Consultation
                </a>
              </div>

              {/* Membership CTA */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F1D2C]">Save with Membership</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Rani members enjoy exclusive pricing on treatments, priority booking, and monthly perks.
                </p>
                <Link
                  href="/membership"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C9A96E] hover:underline"
                >
                  View Membership Plans <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#F8F6F1] py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-3xl font-bold text-[#0F1D2C] sm:text-4xl">
            {page.service} Pricing FAQ
          </h2>
          <div className="mt-10 space-y-4">
            {page.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-base font-semibold text-[#0F1D2C]">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 text-gray-400 transition group-open:rotate-90" />
                </summary>
                <p className="px-6 pb-4 text-sm leading-relaxed text-gray-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Cost Pages */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
            More Treatment Pricing
          </h2>
          <p className="mt-2 text-gray-600">
            Transparent pricing for all physician-supervised treatments at Rani Beauty Clinic.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCostPages.map((related) => (
              <Link
                key={related.slug}
                href={`/cost/${related.slug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-100 px-5 py-4 transition hover:border-[#C9A96E]/30 hover:bg-[#F8F6F1]"
              >
                <div>
                  <p className="font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E]">
                    {related.service} Cost
                  </p>
                  <p className="text-xs text-gray-500">
                    {related.priceRanges[0]?.price && `From ${related.priceRanges[0].price}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#C9A96E]" />
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              View Full Pricing Menu <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started with {page.service}?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300">
            Book a consultation to discuss your treatment plan and get a personalized quote. Financing available through Cherry and PatientFi.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={clinicInfo.booking.url}
              className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 py-3.5 text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
            >
              Book Online
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              Call {clinicInfo.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
