import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Navigation, Phone, Shield, Sparkles } from 'lucide-react';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import StructuredData from '@/components/seo/StructuredData';
import { clinicInfo } from '@/data/clinic-info';
import type {
  ProgrammaticInternalLink,
  PublishedCityServicePage,
} from '@/data/programmatic-seo/city-service-pages';

interface CityServicePageTemplateProps {
  page: PublishedCityServicePage;
  relatedLinks: ProgrammaticInternalLink[];
}

function buildLocalBusinessSchema(page: PublishedCityServicePage) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MedicalBusiness'],
    '@id': `${clinicInfo.website}#localbusiness`,
    name: clinicInfo.name,
    url: page.canonicalUrl,
    telephone: clinicInfo.phoneTel.replace('tel:', ''),
    image: `${clinicInfo.website}/opengraph-image`,
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: clinicInfo.geo.latitude,
      longitude: clinicInfo.geo.longitude,
    },
    areaServed: {
      '@type': 'City',
      name: page.city.name,
      containedInPlace: {
        '@type': 'State',
        name: page.city.state,
      },
    },
    openingHours: 'Mo-Su 10:00-19:00',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: clinicInfo.reviews.aggregateRating,
      reviewCount: clinicInfo.reviews.reviewCount,
      bestRating: 5,
    },
    makesOffer: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'USD',
        description: page.service.priceRange,
      },
      itemOffered: {
        '@type': 'Service',
        name: page.service.schemaName,
        url: page.canonicalUrl,
      },
    },
  };
}

function buildServiceSchema(page: PublishedCityServicePage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${page.canonicalUrl}#service`,
    name: `${page.service.name} in ${page.city.name}, WA`,
    serviceType: page.service.schemaName,
    description: page.service.treatmentSummary,
    url: page.canonicalUrl,
    provider: {
      '@type': 'MedicalBusiness',
      '@id': `${clinicInfo.website}#localbusiness`,
      name: clinicInfo.name,
      telephone: clinicInfo.phoneTel.replace('tel:', ''),
      url: clinicInfo.website,
    },
    areaServed: {
      '@type': 'City',
      name: page.city.name,
      containedInPlace: {
        '@type': 'State',
        name: page.city.state,
      },
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      description: page.service.priceRange,
      url: clinicInfo.booking.url,
    },
  };
}

function buildFaqSchema(page: PublishedCityServicePage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default function CityServicePageTemplate({
  page,
  relatedLinks,
}: CityServicePageTemplateProps) {
  const breadcrumbs = [
    { name: 'Home', url: clinicInfo.website },
    { name: page.city.name, url: `${clinicInfo.website}/near/${page.city.slug}` },
    { name: page.service.name, url: page.canonicalUrl },
  ];

  return (
    <>
      <StructuredData data={buildLocalBusinessSchema(page)} />
      <StructuredData data={buildServiceSchema(page)} />
      <StructuredData data={buildFaqSchema(page)} />
      <BreadcrumbSchema items={breadcrumbs} />

      <main className="bg-white">
        <section className="relative overflow-hidden bg-[#0F1D2C] px-6 py-16 text-white md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,110,0.22),transparent_34rem)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A96E]">
                {page.hero.eyebrow}
              </p>
              <h1 className="mt-4 font-playfair text-4xl font-bold leading-tight md:text-6xl">
                {page.hero.title}
              </h1>
              <p className="mt-5 max-w-3xl font-body text-lg leading-relaxed text-white/78">
                {page.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={clinicInfo.booking.url}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#C9A96E] px-6 font-body text-sm font-bold text-[#0F1D2C] transition hover:bg-[#b8984f]"
                >
                  Book Consultation
                </a>
                <a
                  href={clinicInfo.phoneTel}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/20 px-6 font-body text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {clinicInfo.phone}
                </a>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/12 bg-white/8 p-6 shadow-2xl backdrop-blur">
              <p className="font-body text-sm font-semibold text-[#C9A96E]">Local visit details</p>
              <dl className="mt-5 space-y-4 font-body text-sm text-white/78">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A96E]" />
                  <div>
                    <dt className="font-semibold text-white">Drive time</dt>
                    <dd>
                      {page.city.driveTime} from {page.city.name}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A96E]" />
                  <div>
                    <dt className="font-semibold text-white">Route</dt>
                    <dd>{page.city.driveRoute}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A96E]" />
                  <div>
                    <dt className="font-semibold text-white">Parking</dt>
                    <dd>{page.city.parkingNote}</dd>
                  </div>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="px-6 py-14 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <article>
              <p className="font-body text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A96E]">
                {page.hero.callout}
              </p>
              <div className="mt-5 space-y-5 font-body text-base leading-relaxed text-[#0F1D2C]/75">
                {page.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-12 space-y-10">
                {page.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
                      {section.heading}
                    </h2>
                    <div className="mt-4 space-y-4 font-body text-base leading-relaxed text-[#0F1D2C]/72">
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <section className="mt-12 rounded-3xl bg-[#F8F6F1] p-6 md:p-8">
                <h2 className="font-playfair text-2xl font-bold text-[#0F1D2C]">
                  FAQs About {page.service.name} Near {page.city.name}
                </h2>
                <div className="mt-6 divide-y divide-[#0F1D2C]/10">
                  {page.faqs.map((faq) => (
                    <details key={faq.question} className="group py-4">
                      <summary className="cursor-pointer list-none font-body text-base font-bold text-[#0F1D2C]">
                        {faq.question}
                      </summary>
                      <p className="mt-3 font-body text-sm leading-relaxed text-[#0F1D2C]/70">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-[#0F1D2C]/10 p-6">
                <div className="flex items-center gap-2 font-body text-sm font-bold text-[#0F1D2C]">
                  <Shield className="h-5 w-5 text-[#C9A96E]" />
                  Physician-supervised care
                </div>
                <p className="mt-3 font-body text-sm leading-relaxed text-[#0F1D2C]/68">
                  {page.service.treatmentSummary}
                </p>
              </div>

              <div className="rounded-3xl border border-[#0F1D2C]/10 p-6">
                <div className="flex items-center gap-2 font-body text-sm font-bold text-[#0F1D2C]">
                  <Sparkles className="h-5 w-5 text-[#C9A96E]" />
                  Neighborhood callouts
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {page.city.neighborhoodCallouts.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-[#F8F6F1] px-3 py-1 font-body text-xs font-semibold text-[#0F1D2C]/70"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-[#0F1D2C] p-6 text-white">
                <h2 className="font-body text-sm font-bold uppercase tracking-[0.12em] text-[#C9A96E]">
                  Related pages
                </h2>
                <div className="mt-4 space-y-3">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3 font-body text-sm text-white/80 transition hover:border-[#C9A96E]/50 hover:text-white"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#C9A96E] transition group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
