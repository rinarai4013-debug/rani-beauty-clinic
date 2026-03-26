import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { combinationPages } from "@/data/seo/combination-pages";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return combinationPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = combinationPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Not Found" };
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical: `${clinicInfo.website}/combinations/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "article",
      url: `${clinicInfo.website}/combinations/${page.slug}`,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${page.metaTitle} - Rani Beauty Clinic`,
        },
      ],
    },
  };
}

export default function CombinationPage({ params }: PageProps) {
  const page = combinationPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  const pageUrl = `${clinicInfo.website}/combinations/${page.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription,
    url: pageUrl,
    author: {
      "@type": "Organization",
      name: clinicInfo.name,
      url: clinicInfo.website,
    },
    publisher: {
      "@type": "Organization",
      name: clinicInfo.name,
    },
    reviewedBy: {
      "@type": "Physician",
      name: clinicInfo.medicalDirector.name,
      description: clinicInfo.medicalDirector.specialty,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable]"],
    },
    inLanguage: "en-US",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
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
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <StructuredData data={articleSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-rani-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rani-gold">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="hover:text-rani-gold">Treatment Combinations</span>
          <span className="mx-2">/</span>
          <span className="text-rani-navy">{page.title}</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rani-gold">
            Treatment Combination
          </p>
          <h1 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            {page.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {page.treatments.map((tx, i) => (
              <span
                key={i}
                className="rounded-full bg-rani-gold/10 px-3 py-1 text-sm font-medium text-rani-gold"
              >
                {tx}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-rani-muted">
            Physician-supervised at {clinicInfo.name} &middot;{" "}
            {clinicInfo.address.city}, {clinicInfo.address.state}
          </p>
          <p
            data-speakable="true"
            className="mt-6 text-lg leading-relaxed text-rani-muted"
          >
            {page.heroDescription}
          </p>
        </header>

        {/* Why This Combination Works */}
        <section className="mb-10 rounded-xl border border-rani-gold/20 bg-rani-cream p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-rani-navy">
            Why This Combination Works
          </h2>
          <p className="text-base leading-relaxed text-rani-muted">
            {page.whySynergy}
          </p>
        </section>

        {/* Benefits */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Combination Benefits
          </h2>
          <ul className="space-y-3">
            {page.combinationBenefits.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-rani-muted"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rani-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Scheduling Guide */}
        <section className="mb-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Scheduling Guide
          </h2>
          <div className="overflow-hidden rounded-xl border border-rani-border">
            <table className="w-full">
              <thead>
                <tr className="bg-rani-cream">
                  <th className="px-5 py-3 text-left text-sm font-semibold text-rani-navy">
                    Step
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-rani-navy">
                    Timing
                  </th>
                  <th className="hidden px-5 py-3 text-left text-sm font-semibold text-rani-navy md:table-cell">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.schedulingGuide.map((item, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-rani-cream/30"}
                  >
                    <td className="px-5 py-3 text-sm font-medium text-rani-navy">
                      {item.step}
                    </td>
                    <td className="px-5 py-3 text-sm text-rani-muted whitespace-nowrap">
                      {item.timing}
                    </td>
                    <td className="hidden px-5 py-3 text-sm text-rani-muted md:table-cell">
                      {item.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Content Sections */}
        {page.sections.map((section, i) => (
          <section key={i} className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
              {section.heading}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-rani-muted">
              {section.content
                .split(". ")
                .reduce((acc: string[][], sentence, idx, arr) => {
                  const groupIdx = Math.floor(
                    idx / Math.ceil(arr.length / 2)
                  );
                  if (!acc[groupIdx]) acc[groupIdx] = [];
                  acc[groupIdx].push(
                    sentence + (idx < arr.length - 1 ? "." : "")
                  );
                  return acc;
                }, [])
                .map((group, gi) => (
                  <p key={gi}>{group.join(" ")}</p>
                ))}
            </div>
          </section>
        ))}

        {/* Expected Results */}
        <section className="mb-10 rounded-xl border border-rani-gold/20 bg-rani-cream p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-rani-navy">
            Expected Results
          </h2>
          <ul className="space-y-3">
            {page.expectedResults.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-rani-muted"
              >
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/10 text-xs font-bold text-rani-gold">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQs */}
        <section className="mb-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-rani-navy">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border border-rani-border p-5"
              >
                <h3 className="mb-2 font-semibold text-rani-navy">
                  {faq.question}
                </h3>
                <p
                  data-speakable="true"
                  className="text-sm leading-relaxed text-rani-muted"
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-xl bg-rani-navy p-8 text-center text-white">
          <h2 className="font-heading text-2xl font-bold">
            Ready to Combine Treatments?
          </h2>
          <p className="mt-3 text-rani-cream/80">
            Schedule a complimentary consultation to create a personalized
            combination treatment plan. Our team will optimize your schedule and
            maximize your results.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={clinicInfo.booking.url}
              className="rounded-lg bg-rani-gold px-6 py-3 font-semibold text-rani-navy transition-colors hover:bg-rani-gold/90"
            >
              Book a Consultation
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="rounded-lg border border-white/30 px-6 py-3 font-semibold transition-colors hover:bg-white/10"
            >
              Call {clinicInfo.phone}
            </a>
          </div>
        </section>
      </article>
    </>
  );
}
