import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, ChevronRight, Phone, Star, Shield, ArrowLeft } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import RelatedBlogArticles from "@/components/seo/RelatedBlogArticles";
import { clinicInfo } from "@/data/clinic-info";
import { pnwCities } from "@/data/locations/pnw-cities";
import { waCitiesExtended } from "@/data/locations/wa-cities-extended";
import {
  getServiceGeoEntry,
  getServiceGeoByCity,
  serviceGeoEntries,
  serviceTemplates,
} from "@/data/locations/service-geo";
import {
  extendedServiceGeoEntries,
  extendedServiceTemplates,
  getExtendedServiceGeoEntry,
  getExtendedServiceGeoByCity,
} from "@/data/locations/service-geo-extended";
import { takeStableRotated } from "@/lib/seo/stable-collection";

const allCities = [...pnwCities, ...waCitiesExtended];
const allServiceGeoEntries = [...serviceGeoEntries, ...extendedServiceGeoEntries];
const allServiceTemplates = [...serviceTemplates, ...extendedServiceTemplates];

export const revalidate = 86400;
export const dynamicParams = false;

const SERVICE_TITLE_OVERRIDES: Record<string, string> = {
  "sammamish/rf-microneedling": "Best RF Microneedling Near Sammamish - From $495",
  "north-bend/lip-filler": "Best Lip Filler Near North Bend - From $650",
  "issaquah/weight-loss-glp1": "Best Weight Loss (GLP-1) Near Issaquah - From $399/month",
  "west-seattle/botox": "Best Botox Near West Seattle - From $12/unit",
  "north-bend/weight-loss-glp1": "Best Weight Loss (GLP-1) Near North Bend",
  "maple-valley/weight-loss-glp1": "Best Weight Loss (GLP-1) Near Maple Valley",
  "sammamish/botox": "Best Botox Near Sammamish - From $12/unit",
  "north-bend/laser-hair-removal": "Best Laser Hair Removal Near North Bend",
  "vancouver-wa/lip-filler-geo": "Best Lip Filler Near Vancouver - From $650",
  "federal-way/botox": "Best Botox Near Federal Way - From $12/unit",
  "snoqualmie/weight-loss-glp1": "Best Weight Loss (GLP-1) Near Snoqualmie",
  "index/laser-hair-removal": "Best Laser Hair Removal Near Index - From $79/session",
  "spokane/laser-hair-removal": "Best Laser Hair Removal Near Spokane - From $79/session",
  "west-seattle/laser-hair-removal": "Best Laser Hair Removal Near West Seattle",
  "lynnwood/laser-hair-removal": "Best Laser Hair Removal Near Lynnwood - From $79/session",
};

interface PageProps {
  params: { city: string; service: string };
}

function buildShortNearServiceTitle(serviceName: string, cityName: string): string {
  const maxTitleLength = 39; // 39 + " | Rani Beauty Clinic" = 60
  const candidates = [
    `Best ${serviceName} Near ${cityName}`,
    `${serviceName} Near ${cityName}`,
    `${serviceName} ${cityName}`,
  ];

  const best = candidates.find((candidate) => candidate.length <= maxTitleLength) ?? candidates[1];
  return best.length <= maxTitleLength
    ? best
    : best.slice(0, maxTitleLength).replace(/\s+\S*$/, "").trim();
}

export function generateStaticParams() {
  return allServiceGeoEntries.map((entry) => ({
    city: entry.citySlug,
    service: entry.serviceSlug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const entry = getServiceGeoEntry(params.city, params.service) || getExtendedServiceGeoEntry(params.city, params.service);
  if (!entry) {
    return { title: "Service Not Found" };
  }

  const overrideKey = `${params.city}/${params.service}`;
  const title = SERVICE_TITLE_OVERRIDES[overrideKey] ?? buildShortNearServiceTitle(entry.serviceName, entry.cityName);

  return {
    title: { absolute: title },
    description: entry.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/near/${params.city}/${params.service}`,
    },
    openGraph: {
      title: `${title} | Rani Beauty Clinic`,
      description: entry.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/near/${params.city}/${params.service}`,
      siteName: "Rani Beauty Clinic",
      locale: "en_US",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${entry.serviceName} Near ${entry.cityName} | Rani Beauty Clinic`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Rani Beauty Clinic`,
      description: entry.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default function ServiceCityPage({ params }: PageProps) {
  const entry = getServiceGeoEntry(params.city, params.service) || getExtendedServiceGeoEntry(params.city, params.service);
  const city = allCities.find((c) => c.slug === params.city);
  const template = allServiceTemplates.find((t) => t.slug === params.service);

  if (!entry || !city || !template) {
    notFound();
  }
  const schemaPhone = clinicInfo.phoneTel.replace("tel:", "");

  const otherServicesInCity = [
    ...getServiceGeoByCity(params.city),
    ...getExtendedServiceGeoByCity(params.city),
  ].filter(
    (s) => s.serviceSlug !== params.service
  );

  const sameSvcOtherCities = allServiceGeoEntries
    .filter((e) => e.serviceSlug === params.service && e.citySlug !== params.city);
  const relatedCities = takeStableRotated(sameSvcOtherCities, `${params.city}/${params.service}`, 6);

  // LocalBusiness structured data
  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    description: `${entry.serviceName} for ${entry.cityName} residents. Physician-supervised ${template.category === "aesthetic" ? "aesthetic" : "medical wellness"} treatment at Rani Beauty Clinic in Renton, WA.`,
    url: `${clinicInfo.website}/near/${params.city}/${params.service}`,
    telephone: schemaPhone,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicInfo.geo.latitude,
      longitude: clinicInfo.geo.longitude,
    },
    areaServed: {
      "@type": "City",
      name: entry.cityName,
    },
    openingHours: "Mo-Su 10:00-19:00",
    priceRange: "$$-$$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating,
      reviewCount: clinicInfo.reviews.reviewCount,
      bestRating: 5,
    },
    medicalSpecialty: "Dermatology",
    isAcceptingNewPatients: true,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${entry.serviceName} Services`,
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "MedicalProcedure",
            name: entry.serviceName,
            description: entry.metaDescription,
          },
        },
      ],
    },
  };

  // FAQ structured data
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ...template.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
      {
        "@type": "Question",
        name: `How far is Rani Beauty Clinic from ${entry.cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Rani Beauty Clinic is located ${city.distanceFromRenton} from ${entry.cityName}. The drive typically takes ${city.drivingTime}. We are at ${clinicInfo.address.full} with free on-site parking.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the cost of ${entry.serviceName} at Rani Beauty Clinic?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${entry.serviceName} at Rani Beauty Clinic is priced ${template.priceRange}. Flexible payment options are available for qualified applicants. Contact us at (425) 539-4440 for a personalized quote.`,
        },
      },
    ],
  };

  const paragraphs = entry.content.split("\n\n").filter((p) => p.trim());

  return (
    <>
      <StructuredData data={localBusinessData} />
      <StructuredData data={faqData} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: clinicInfo.website },
          { name: "Areas We Serve", url: `${clinicInfo.website}/locations` },
          { name: entry.cityName, url: `${clinicInfo.website}/near/${params.city}` },
          { name: entry.serviceName, url: `${clinicInfo.website}/near/${params.city}/${params.service}` },
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0F1D2C] via-[#1a2d40] to-[#0F1D2C] py-16 lg:py-24">
        <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`/near/${params.city}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-[#C9A96E]"
          >
            <ArrowLeft className="h-4 w-4" />
            All services near {entry.cityName}
          </Link>
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A96E]/10 px-3 py-1 text-xs font-medium text-[#C9A96E]">
                <MapPin className="h-3.5 w-3.5" />
                {city.distanceFromRenton} from {entry.cityName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                {template.category === "aesthetic" ? "Aesthetic" : "Wellness"}
              </span>
              {template.technology && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                  {template.technology}
                </span>
              )}
            </div>
            <h1 className="font-playfair text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Best <span className="text-[#C9A96E]">{entry.serviceName}</span>{" "}
              Near {entry.cityName}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-300">
              Physician-supervised {entry.serviceName.toLowerCase()} for{" "}
              {entry.cityName} residents. {template.priceRange}.{" "}
              {city.drivingTime} from our Renton clinic with free parking.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={clinicInfo.booking.url}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 py-3.5 text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
              >
                Book {entry.serviceName}
              </a>
              <a
                href={clinicInfo.phoneTel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {clinicInfo.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
                {entry.serviceName} for {entry.cityName} Residents
              </h2>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-gray-700">
                {paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Technology highlight if applicable */}
              {template.technology && (
                <div className="mt-10 rounded-2xl border border-[#C9A96E]/20 bg-[#F8F6F1] p-6">
                  <h3 className="font-playfair text-xl font-bold text-[#0F1D2C]">
                    Technology: {template.technology}
                  </h3>
                  <p className="mt-2 text-sm text-gray-700">
                    At Rani Beauty Clinic, we invest in the most advanced
                    treatment technology available. The {template.technology}{" "}
                    represents the gold standard for {entry.serviceName.toLowerCase()},
                    delivering superior results with enhanced safety and comfort
                    for our {entry.cityName} clients.
                  </p>
                </div>
              )}

              {/* City-specific content — unique per city for content differentiation */}
              <div className="mt-10">
                <h3 className="font-playfair text-2xl font-bold text-[#0F1D2C]">
                  About {city.name}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-gray-700">
                  {city.description}
                </p>
              </div>

              {city.whyRani && (
                <div className="mt-8 rounded-2xl border border-[#C9A96E]/20 bg-gradient-to-br from-[#F8F6F1] to-white p-6">
                  <h3 className="font-playfair text-xl font-bold text-[#0F1D2C]">
                    Why {city.name} Residents Choose Rani
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">
                    {city.whyRani}
                  </p>
                </div>
              )}

              {city.demographics && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C9A96E]">
                    Who We Serve in {city.name}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {city.demographics}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="rounded-2xl border border-[#C9A96E]/20 bg-gradient-to-b from-[#0F1D2C] to-[#1a2d40] p-6 text-white">
                <h3 className="text-lg font-bold">{entry.serviceName} Pricing</h3>
                <p className="mt-2 text-3xl font-bold text-[#C9A96E]">
                  {template.priceRange}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#C9A96E]" /> Physician-supervised
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#C9A96E]" /> {clinicInfo.reviews.aggregateRating}/5 Google rating
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#C9A96E]" /> Open 7 days/week
                  </li>
                </ul>
                <a
                  href={clinicInfo.booking.url}
                  className="mt-6 block w-full rounded-lg bg-[#C9A96E] py-3 text-center text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
                >
                  Book Now
                </a>
                <p className="mt-3 text-center text-xs text-gray-400">
                  Flexible payment options available
                </p>
              </div>

              {/* Driving Directions Card */}
              <div className="rounded-2xl border border-gray-100 bg-[#F8F6F1] p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#0F1D2C]">
                  <MapPin className="h-5 w-5 text-[#C9A96E]" />
                  From {entry.cityName}
                </h3>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
                    <span>{city.drivingTime}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
                    <span>{city.distanceFromRenton} - {city.county}</span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-white p-4 text-sm text-gray-700">
                  <p className="font-semibold text-[#0F1D2C]">{clinicInfo.name}</p>
                  <p>{clinicInfo.address.full}</p>
                  <p className="mt-1 text-[#C9A96E]">Free on-site parking</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/${encodeURIComponent(city.name + ", WA")}/${encodeURIComponent(clinicInfo.address.full)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-lg bg-[#0F1D2C] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1a2d40]"
                >
                  Get Directions
                </a>
              </div>

              {/* Clinic Info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F1D2C]">Contact</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#C9A96E]" />
                    <a href={clinicInfo.phoneTel} className="text-[#C9A96E] hover:underline">
                      {clinicInfo.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#C9A96E]" /> Mon-Sun: 10 AM - 7 PM
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#C9A96E]" /> Dr. Alexander Landfield, Medical Director
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#F8F6F1] py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-3xl font-bold text-[#0F1D2C]">
            {entry.serviceName} FAQ - {entry.cityName}
          </h2>
          <div className="mt-10 space-y-4">
            {(faqData.mainEntity as Array<{ "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }>).map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-base font-semibold text-[#0F1D2C]">
                  {faq.name}
                  <ChevronRight className="h-5 w-5 text-gray-400 transition group-open:rotate-90" />
                </summary>
                <p className="px-6 pb-4 text-sm leading-relaxed text-gray-700">
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other Services in This City */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
            More Services Near {entry.cityName}
          </h2>
          <p className="mt-2 text-gray-600">
            All physician-supervised by Dr. Landfield at Rani Beauty Clinic.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherServicesInCity.map((svc) => (
              <Link
                key={svc.serviceSlug}
                href={`/near/${params.city}/${svc.serviceSlug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-100 px-5 py-4 transition hover:border-[#C9A96E]/30 hover:bg-[#F8F6F1]"
              >
                <div>
                  <p className="font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E]">
                    {svc.serviceName}
                  </p>
                  <p className="text-xs text-gray-500">Near {svc.cityName}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#C9A96E]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Same Service in Other Cities */}
      <section className="bg-[#F8F6F1] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
            {entry.serviceName} - Nearby Cities
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCities.map((svc) => (
              <Link
                key={svc.citySlug}
                href={`/near/${svc.citySlug}/${svc.serviceSlug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition hover:border-[#C9A96E]/30"
              >
                <div>
                  <p className="font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E]">
                    {entry.serviceName} Near {svc.cityName}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#C9A96E]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Articles — cross-link to blog for content depth + SEO */}
      <RelatedBlogArticles serviceSlug={params.service} serviceTitle={entry.serviceName} />

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-white sm:text-4xl">
            Book Your {entry.serviceName} Appointment
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300">
            {entry.cityName} residents - experience physician-supervised{" "}
            {entry.serviceName.toLowerCase()} at Rani Beauty Clinic.{" "}
            {template.priceRange}. {city.drivingTime} with free parking.
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
