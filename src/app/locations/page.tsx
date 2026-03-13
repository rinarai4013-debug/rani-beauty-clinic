import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import MapSection from "@/components/sections/MapSection";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { geoPages } from "@/data/locations/geo-pages";

export const metadata: Metadata = {
  title: "Areas We Serve | Medspa Serving Greater Seattle & King County",
  description:
    "Rani Beauty Clinic in Renton serves all of King County including Bellevue, Kent, Kirkland, Redmond, Issaquah, Auburn, Federal Way, Seattle neighborhoods, and more. Physician-supervised medspa.",
  alternates: {
    canonical: `${clinicInfo.website}/locations`,
  },
  openGraph: {
    title: "Areas We Serve | Rani Beauty Clinic",
    description:
      "Serving 40+ cities and neighborhoods across King County from our central Renton location. Physician-supervised aesthetic and medical wellness treatments.",
    type: "website",
    url: `${clinicInfo.website}/locations`,
  },
};

const regionLabels: Record<string, string> = {
  renton: "Renton Neighborhoods",
  "south-king": "South King County",
  eastside: "Eastside",
  seattle: "Seattle Neighborhoods",
  north: "North",
  regional: "Regional",
};

const regionOrder = [
  "renton",
  "eastside",
  "south-king",
  "seattle",
  "north",
  "regional",
];

export default function LocationsPage() {
  // Group pages by region
  const grouped = regionOrder
    .map((region) => ({
      region,
      label: regionLabels[region],
      pages: geoPages
        .filter((p) => p.region === region)
        .sort((a, b) => a.driveMinutes - b.driveMinutes),
    }))
    .filter((g) => g.pages.length > 0);

  const serviceAreaSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    url: `${clinicInfo.website}/locations`,
    telephone: clinicInfo.phone,
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
    areaServed: geoPages.map((p) => ({
      "@type": "City",
      name: p.city,
      containedInPlace: { "@type": "State", name: "Washington" },
    })),
    openingHours: "Mo-Su 10:00-19:00",
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Locations", url: `${clinicInfo.website}/locations` },
  ];

  return (
    <>
      <StructuredData data={serviceAreaSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      <Hero
        label="AREAS WE SERVE"
        title="Serving Greater Seattle & King County"
        subtitle={`Rani Beauty Clinic is centrally located in Renton with easy access from 40+ cities and neighborhoods across King County. Physician-supervised aesthetic and medical wellness treatments for the entire region.`}
        primaryCTA={{ text: "Book Consultation", href: "/contact" }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Centrally Located", "Open 7 Days", "Free Parking"]}
        dark
      />

      {/* Clinic location bar */}
      <section className="border-b border-rani-gold/20 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 font-body text-sm text-rani-text">
              <MapPin size={16} className="text-rani-gold" />
              <span>{clinicInfo.address.full}</span>
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-rani-text">
              <Clock size={16} className="text-rani-gold" />
              <span>{clinicInfo.hours.formatted}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location groups */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="SERVICE AREAS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Find Us Near You
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              Our Renton clinic is conveniently located to serve communities
              across King County. Click any location to learn more about how we
              serve your area.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 space-y-12">
            {grouped.map((group, groupIndex) => (
              <FadeInOnScroll key={group.region} delay={groupIndex * 0.1}>
                <div>
                  <h3 className="mb-6 font-body text-xl font-bold text-rani-navy">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.pages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/locations/${page.slug}`}
                        className="group flex items-center justify-between rounded-xl border border-rani-gold/10 bg-rani-cream px-5 py-4 transition-all hover:border-rani-gold hover:shadow-sm"
                      >
                        <div>
                          <span className="font-body text-sm font-semibold text-rani-navy group-hover:text-rani-gold">
                            {page.city}, {page.state}
                          </span>
                          <p className="mt-0.5 font-body text-xs text-rani-muted">
                            {page.driveTime}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-rani-muted transition-transform group-hover:translate-x-1 group-hover:text-rani-gold"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      <MapSection />

      <CTABanner
        label="SERVING ALL OF KING COUNTY"
        title="Ready to Visit Us?"
        subtitle={`No matter where you are in King County, Rani Beauty Clinic is within reach. Call ${clinicInfo.phone} or book your consultation online.`}
      />
    </>
  );
}
