import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import MapSection from "@/components/sections/MapSection";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { geoPages } from "@/data/locations/geo-pages";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return geoPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = geoPages.find((p) => p.slug === params.slug);

  if (!page) {
    return { title: "Location Not Found | Rani Beauty Clinic" };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/locations/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/locations/${page.slug}`,
    },
  };
}

const aestheticServices = [
  { name: "Laser Hair Removal", href: "/services/laser-hair-removal" },
  { name: "HydraFacial MD", href: "/services/hydrafacial" },
  { name: "RF Microneedling", href: "/services/rf-microneedling" },
  { name: "BioRePeel", href: "/services/biorepeel" },
  { name: "Botox & Dysport", href: "/services/botox-dysport" },
  { name: "Dermal Fillers", href: "/services/dermal-fillers" },
  { name: "Red Light Therapy", href: "/services/red-light-therapy" },
  { name: "Laser Acne Facial", href: "/services/laser-acne-facial" },
  { name: "Chemical Peels", href: "/services/chemical-peels" },
  { name: "AI Skin Analysis", href: "/services/ai-skin-analysis" },
];

const wellnessServices = [
  { name: "GLP-1 Weight Management", href: "/wellness/glp1-weight-management" },
  { name: "Peptide Therapy", href: "/wellness/peptide-therapy" },
  { name: "NAD+ Injections", href: "/wellness/nad-injections" },
  { name: "Vitamin Injections", href: "/wellness/vitamin-injections" },
  { name: "Hormone Therapy", href: "/wellness/hormone-therapy" },
  { name: "Blood Work", href: "/wellness/blood-work" },
];

export default function LocationPage({ params }: PageProps) {
  const page = geoPages.find((p) => p.slug === params.slug);

  if (!page) {
    notFound();
  }

  const paragraphs = page.content.split("\n\n").filter((p) => p.trim());

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    description: page.metaDescription,
    url: `${clinicInfo.website}/locations/${page.slug}`,
    telephone: clinicInfo.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: page.city,
      containedInPlace: {
        "@type": "State",
        name: "Washington",
      },
    },
    openingHours: "Mo-Su 10:00-19:00",
    medicalSpecialty: "Dermatology",
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicInfo.geo.latitude,
      longitude: clinicInfo.geo.longitude,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating.toString(),
      reviewCount: clinicInfo.reviews.reviewCount.toString(),
      bestRating: "5",
    },
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Locations", url: `${clinicInfo.website}/locations` },
    { name: `${page.city}, ${page.state}`, url: `${clinicInfo.website}/locations/${page.slug}` },
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Breadcrumb */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-rani-navy transition-colors">Home</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li>
                <Link href="/locations" className="hover:text-rani-navy transition-colors">Locations</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><span className="text-rani-navy font-semibold">{page.city}, {page.state}</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label={`SERVING ${page.city.toUpperCase()}, ${page.state}`}
        title={`Premier Medspa Serving ${page.city}, WA`}
        subtitle={`Physician-supervised aesthetic treatments and medical wellness services for ${page.city} residents. ${page.driveTime} from our Renton clinic.`}
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.booking.url, target: "_blank" }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Physician Supervised", "Open 7 Days", page.driveTime]}
        dark
      />

      <section className="bg-white border-b border-rani-gold/20">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 font-body text-sm text-rani-text">
              <MapPin size={16} className="text-rani-gold" />
              <span>{clinicInfo.address.full}</span>
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-rani-text">
              <Clock size={16} className="text-rani-gold" />
              <span>{page.driveTime} from {page.city}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <div>
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="font-body text-base leading-relaxed text-rani-text mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label={`SERVICES FOR ${page.city.toUpperCase()} RESIDENTS`} />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Our Complete Menu of Services
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
            <FadeInOnScroll direction="left" delay={0.3}>
              <div className="rounded-xl bg-white p-8 shadow-sm border border-rani-gold/10">
                <h3 className="font-body text-xl font-bold text-rani-navy mb-2">Aesthetic Services</h3>
                <div className="h-0.5 w-10 bg-rani-gold mb-6" />
                <ul className="space-y-3">
                  {aestheticServices.map((service) => (
                    <li key={service.href}>
                      <Link href={service.href} className="group flex items-center gap-3 font-body text-rani-text hover:text-rani-navy transition-colors">
                        <ChevronRight size={14} className="text-rani-gold transition-transform group-hover:translate-x-1" />
                        <span>{service.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right" delay={0.3}>
              <div className="rounded-xl bg-white p-8 shadow-sm border border-rani-gold/10">
                <h3 className="font-body text-xl font-bold text-rani-navy mb-2">Medical Wellness</h3>
                <div className="h-0.5 w-10 bg-rani-gold mb-6" />
                <ul className="space-y-3">
                  {wellnessServices.map((service) => (
                    <li key={service.href}>
                      <Link href={service.href} className="group flex items-center gap-3 font-body text-rani-text hover:text-rani-navy transition-colors">
                        <ChevronRight size={14} className="text-rani-gold transition-transform group-hover:translate-x-1" />
                        <span>{service.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInOnScroll>
          </div>

          <FadeInOnScroll delay={0.5}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Badge icon="shield">Physician Supervised</Badge>
              <Badge icon="check">Woman-Owned</Badge>
              <Badge icon="clock">Open 7 Days</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <MapSection />

      <CTABanner
        label={`SERVING ${page.city.toUpperCase()}, ${page.state}`}
        title={`Ready to Visit Us from ${page.city}?`}
        subtitle={`Just ${page.driveTime} from ${page.city}. Book your consultation today or call ${clinicInfo.phone}.`}
      />
    </>
  );
}
