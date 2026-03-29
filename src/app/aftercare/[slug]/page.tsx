import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { aftercarePages } from "@/data/seo/aftercare-pages";
import { clinicInfo } from "@/data/clinic-info";
import StructuredData from "@/components/seo/StructuredData";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return aftercarePages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = aftercarePages.find((p) => p.slug === params.slug);

  if (!page) {
    return {};
  }

  const canonical = `${clinicInfo.website}/aftercare/${page.slug}`;

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

export default function AftercarePage({ params }: PageProps) {
  const page = aftercarePages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  const canonical = `${clinicInfo.website}/aftercare/${page.slug}`;
  const parentPath = `/${page.basePath}/${page.serviceSlug}`;

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
        name: page.treatment,
        item: `${clinicInfo.website}${parentPath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.treatment} Aftercare`,
        item: canonical,
      },
    ],
  };

  const timelineSections = [
    {
      id: "immediate",
      title: "Immediately After Treatment",
      items: page.immediateAftercare,
      accent: "bg-[#C9A96E]",
    },
    {
      id: "24hours",
      title: "First 24 Hours",
      items: page.first24Hours,
      accent: "bg-[#C9A96E]/80",
    },
    {
      id: "firstweek",
      title: "First Week",
      items: page.firstWeek,
      accent: "bg-[#C9A96E]/60",
    },
    {
      id: "longterm",
      title: "Long-Term Care",
      items: page.longTerm,
      accent: "bg-[#C9A96E]/40",
    },
  ];

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <nav className="mb-6 text-sm text-[#C9A96E]" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link href={parentPath} className="hover:underline">{page.treatment}</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Aftercare</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {page.treatment} Aftercare Guide
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            {page.heroDescription}
          </p>
        </div>
      </section>

      {/* Timeline Navigation */}
      <section className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
          {timelineSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm font-semibold text-[#0F1D2C] hover:text-[#C9A96E] transition-colors px-3 py-1 rounded-full border border-gray-200 hover:border-[#C9A96E]"
            >
              {section.title}
            </a>
          ))}
          <a
            href="#avoid"
            className="text-sm font-semibold text-[#0F1D2C] hover:text-[#C9A96E] transition-colors px-3 py-1 rounded-full border border-gray-200 hover:border-[#C9A96E]"
          >
            Things to Avoid
          </a>
          <a
            href="#when-to-call"
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors px-3 py-1 rounded-full border border-red-200 hover:border-red-400"
          >
            When to Call Us
          </a>
        </div>
      </section>

      {/* Timeline Sections */}
      {timelineSections.map((section, sectionIndex) => (
        <section
          key={section.id}
          id={section.id}
          className={sectionIndex % 2 === 0 ? "bg-[#F8F6F1] py-16 px-6" : "bg-white py-16 px-6"}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-12 h-12 rounded-full ${section.accent} flex items-center justify-center text-[#0F1D2C] font-bold text-lg flex-shrink-0`}>
                {sectionIndex + 1}
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#0F1D2C]">
                {section.title}
              </h2>
            </div>
            <ul className="space-y-4 ml-16">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#C9A96E] mt-1 flex-shrink-0">&#10003;</span>
                  <span className="text-gray-700 text-lg leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Things to Avoid */}
      <section id="avoid" className="bg-[#0F1D2C] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-white mb-8">
            Things to Avoid After {page.treatment}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.thingsToAvoid.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white/5 rounded-lg p-4"
              >
                <span className="text-red-400 mt-0.5 flex-shrink-0 text-lg">&#10007;</span>
                <span className="text-gray-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When to Call Us */}
      <section id="when-to-call" className="bg-red-50 py-16 px-6 border-t-4 border-red-500">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl" role="img" aria-label="Warning">&#9888;</span>
            <h2 className="font-serif text-3xl font-bold text-red-800">
              When to Contact Us
            </h2>
          </div>
          <p className="text-red-700 mb-6 text-lg">
            While side effects are typically mild, contact Rani Beauty Clinic immediately if you experience any of the following:
          </p>
          <ul className="space-y-3">
            {page.whenToCallUs.map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm">
                <span className="text-red-500 mt-0.5 flex-shrink-0 font-bold">!</span>
                <span className="text-red-800 leading-relaxed font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm text-center">
            <p className="text-red-800 font-semibold mb-3">
              Need immediate assistance?
            </p>
            <Link
              href={`tel:${clinicInfo.phone.replace(/[^+\d]/g, "")}`}
              className="inline-block bg-red-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-red-700 transition-colors text-lg"
            >
              Call Us: {clinicInfo.phone}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-[#0F1D2C] mb-8 text-center">
            Aftercare FAQs
          </h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-[#0F1D2C] mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Service Link */}
      <section className="bg-[#F8F6F1] py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            This aftercare guide is for our {page.treatment} service.
          </p>
          <Link
            href={parentPath}
            className="text-[#C9A96E] font-semibold hover:underline text-lg"
          >
            Learn more about {page.treatment} at Rani Beauty Clinic &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Questions About Your Recovery?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Our clinical team is here to support you throughout your healing journey. Reach out anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={clinicInfo.booking.url}
              className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded-lg hover:bg-[#b8944f] transition-colors text-lg"
            >
              Book a Follow-Up
            </Link>
            <Link
              href={`tel:${clinicInfo.phone.replace(/[^+\d]/g, "")}`}
              className="inline-block border border-[#C9A96E] text-[#C9A96E] font-semibold px-8 py-4 rounded-lg hover:bg-[#C9A96E]/10 transition-colors text-lg"
            >
              Call {clinicInfo.phone}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
