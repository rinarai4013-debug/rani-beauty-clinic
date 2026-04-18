import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { firstTimePages } from "@/data/seo/first-time-pages";
import { clinicInfo } from "@/data/clinic-info";
import StructuredData from "@/components/seo/StructuredData";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return firstTimePages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = firstTimePages.find((p) => p.slug === params.slug);

  if (!page) {
    return {};
  }

  const canonical = `${clinicInfo.website}/first-time/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      siteName: "Rani Beauty Clinic",
      type: "article",
      locale: "en_US",
    },
  };
}

export default function FirstTimePage({ params }: PageProps) {
  const page = firstTimePages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

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
        name: "First Time",
        item: `${clinicInfo.website}/first-time`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.treatment,
        item: `${clinicInfo.website}/first-time/${page.slug}`,
      },
    ],
  };

  const serviceUrl = `/${page.basePath}/${page.serviceSlug}`;

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-[#F8F6F1] border-b border-[#C9A96E]/20">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <ol className="flex items-center gap-2 text-sm text-[#0F1D2C]/60">
            <li>
              <Link href="/" className="hover:text-[#C9A96E] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={serviceUrl} className="hover:text-[#C9A96E] transition-colors">
                {page.treatment}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-rani-gold-accessible font-medium">First Time</li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-[#C9A96E] uppercase tracking-widest text-sm font-medium mb-4">
            Your First Visit
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6">
            First Time Getting {page.treatment}?
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            {page.heroDescription}
          </p>
          <Link
            href={serviceUrl}
            className="inline-block mt-8 text-[#C9A96E] border-b border-[#C9A96E]/40 hover:border-[#C9A96E] transition-colors text-sm uppercase tracking-wider"
          >
            Learn more about {page.treatment} &rarr;
          </Link>
        </div>
      </section>

      {/* Before Your Appointment */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-8">
            Before Your Appointment
          </h2>
          <ul className="space-y-4">
            {page.beforeAppointment.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A96E]/10 text-rani-gold-accessible flex items-center justify-center font-semibold text-sm">
                  {i + 1}
                </span>
                <p className="text-[#0F1D2C]/80 leading-relaxed pt-1">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* During Treatment */}
      <section className="py-16 md:py-20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-8">
            During Your Treatment
          </h2>
          <div className="space-y-6">
            {page.duringTreatment.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-[#C9A96E]/10 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0F1D2C] text-[#C9A96E] flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#0F1D2C] text-lg mb-1">
                      {step.step}
                    </h3>
                    <p className="text-[#0F1D2C]/70 leading-relaxed">{step.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* After Treatment */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-8">
            After Your Treatment
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.afterTreatment.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-[#F8F6F1] rounded-lg p-4"
              >
                <span className="flex-shrink-0 text-rani-gold-accessible mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="text-[#0F1D2C]/80 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-16 md:py-20 bg-[#0F1D2C]">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-10 text-center">
            Quick Facts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: "Pain Level", value: page.painLevel },
              { label: "Session Duration", value: page.sessionDuration },
              { label: "Downtime", value: page.downtime },
              { label: "Results Timeline", value: page.resultsTimeline },
              { label: "Sessions Needed", value: page.numberOfSessions },
            ].map((fact) => (
              <div key={fact.label} className="text-center">
                <p className="text-[#C9A96E] font-semibold text-lg md:text-xl mb-1">
                  {fact.value}
                </p>
                <p className="text-white/60 text-xs uppercase tracking-wider">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {page.faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-[#C9A96E]/10 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 font-semibold text-[#0F1D2C] hover:text-[#C9A96E] transition-colors">
                  {faq.question}
                  <span className="ml-4 flex-shrink-0 text-rani-gold-accessible group-open:rotate-45 transition-transform text-xl">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-[#0F1D2C]/70 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0F1D2C] mb-4">
            Ready to Experience {page.treatment}?
          </h2>
          <p className="text-[#0F1D2C]/70 mb-8 leading-relaxed">
            Book your appointment at Rani Beauty Clinic and let our expert team guide you
            through every step of your first {page.treatment.toLowerCase()} treatment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={clinicInfo.booking.url}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C9A96E] text-white font-semibold rounded-lg hover:bg-[#b8954f] transition-colors text-sm uppercase tracking-wider"
            >
              Book Now
            </Link>
            <Link
              href={clinicInfo.consultation.url}
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-[#0F1D2C] text-[#0F1D2C] font-semibold rounded-lg hover:bg-[#0F1D2C] hover:text-white transition-colors text-sm uppercase tracking-wider"
            >
              Free Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
