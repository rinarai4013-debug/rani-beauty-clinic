import StructuredData from "./StructuredData";
import { clinicInfo } from "@/data/clinic-info";

/**
 * Site-wide LocalBusiness + Organization JSON-LD structured data.
 * Rendered in the root layout so it appears on every page.
 *
 * The HomepageSchema in EnhancedSchemas.tsx adds richer, page-specific
 * data (offer catalogs, areas served, etc.) on top of this baseline.
 */
export default function SiteWideSchema() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${clinicInfo.website}/#organization`,
    name: clinicInfo.name,
    url: clinicInfo.website,
    logo: {
      "@type": "ImageObject",
      url: `${clinicInfo.website}/images/logo/logo-dark.png`,
      width: 600,
      height: 200,
    },
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections, hormone therapy and more. Every medical treatment supervised by Dr. Alexander Landfield, Board-Certified Neurologist.",
    foundingDate: String(clinicInfo.established),
    telephone: clinicInfo.phone,
    email: clinicInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: clinicInfo.phone,
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: ["English"],
    },
    sameAs: [
      clinicInfo.social.instagram,
      clinicInfo.social.facebook,
      clinicInfo.social.tiktok,
      clinicInfo.social.google,
    ],
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness", "HealthAndBeautyBusiness"],
    "@id": `${clinicInfo.website}/#localbusiness`,
    name: clinicInfo.name,
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections, hormone therapy and more.",
    url: clinicInfo.website,
    telephone: clinicInfo.phone,
    email: clinicInfo.email,
    image: `${clinicInfo.website}/opengraph-image`,
    priceRange: "$$$",
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating,
      reviewCount: clinicInfo.reviews.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      clinicInfo.social.instagram,
      clinicInfo.social.facebook,
      clinicInfo.social.tiktok,
      clinicInfo.social.google,
    ],
  };

  return (
    <>
      <StructuredData data={organization} />
      <StructuredData data={localBusiness} />
    </>
  );
}
