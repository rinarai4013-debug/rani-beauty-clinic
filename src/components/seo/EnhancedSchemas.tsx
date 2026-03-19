import StructuredData from "./StructuredData";
import { clinicInfo } from "@/data/clinic-info";

/* ─── Shared clinic constants ─────────────────────────────── */

const CLINIC_BASE = {
  "@type": "LocalBusiness" as const,
  name: clinicInfo.name,
  image: `${clinicInfo.website}/opengraph-image`,
  url: clinicInfo.website,
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
  geo: {
    "@type": "GeoCoordinates",
    latitude: clinicInfo.geo.latitude,
    longitude: clinicInfo.geo.longitude,
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
  priceRange: "$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: clinicInfo.reviews.aggregateRating,
    reviewCount: clinicInfo.reviews.reviewCount,
    bestRating: 5,
    worstRating: 1,
  },
  sameAs: [
    clinicInfo.social.instagram,
    clinicInfo.social.facebook,
    clinicInfo.social.tiktok,
    clinicInfo.social.google,
  ],
};

/* ─── 1. Homepage Schema ──────────────────────────────────── */

export function HomepageSchema() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: clinicInfo.name,
    url: clinicInfo.website,
    logo: `${clinicInfo.website}/logo.png`,
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy and more.",
    foundingDate: String(clinicInfo.established),
    founder: {
      "@type": "Person",
      name: "Rani",
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
    "@type": ["LocalBusiness", "MedicalBusiness"],
    "@id": `${clinicInfo.website}/#localbusiness`,
    ...CLINIC_BASE,
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy and more.",
    medicalSpecialty: "Dermatology",
    employee: {
      "@type": "Physician",
      name: clinicInfo.medicalDirector.name,
      jobTitle: clinicInfo.medicalDirector.title,
      description: clinicInfo.medicalDirector.specialty,
      medicalSpecialty: "Neurology",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${clinicInfo.website}/#website`,
    name: clinicInfo.name,
    url: clinicInfo.website,
    publisher: {
      "@id": `${clinicInfo.website}/#localbusiness`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${clinicInfo.website}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <StructuredData data={organization} />
      <StructuredData data={localBusiness} />
      <StructuredData data={website} />
    </>
  );
}

/* ─── 2. Service Schema ───────────────────────────────────── */

interface ServiceSchemaProps {
  service: {
    slug: string;
    title: string;
    shortDescription: string;
    metaDescription?: string;
    faqs?: { question: string; answer: string }[];
    /** "services" | "wellness" used to build canonical URL */
    basePath?: string;
  };
}

export function ServiceSchema({ service }: ServiceSchemaProps) {
  const basePath = service.basePath ?? "services";
  const serviceUrl = `${clinicInfo.website}/${basePath}/${service.slug}`;

  const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    url: serviceUrl,
    provider: {
      "@type": "LocalBusiness",
      name: clinicInfo.name,
      url: clinicInfo.website,
      telephone: clinicInfo.phone,
      address: CLINIC_BASE.address,
    },
    areaServed: {
      "@type": "City",
      name: "Renton",
      containedInPlace: {
        "@type": "State",
        name: "Washington",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating,
      reviewCount: clinicInfo.reviews.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };

  const medicalProcedure = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.title,
    description: service.metaDescription ?? service.shortDescription,
    url: serviceUrl,
    procedureType: "https://schema.org/NoninvasiveProcedure",
    performedBy: {
      "@type": "Physician",
      name: clinicInfo.medicalDirector.name,
      description: clinicInfo.medicalDirector.specialty,
    },
    howPerformed:
      "Performed in-clinic under physician supervision at Rani Beauty Clinic.",
    status: "https://schema.org/EventScheduled",
  };

  const breadcrumbList = {
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
        name: basePath === "wellness" ? "Wellness" : "Services",
        item: `${clinicInfo.website}/${basePath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: serviceUrl,
      },
    ],
  };

  const faqSchema =
    service.faqs && service.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: service.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <StructuredData data={serviceData} />
      <StructuredData data={medicalProcedure} />
      <StructuredData data={breadcrumbList} />
      {faqSchema && <StructuredData data={faqSchema} />}
    </>
  );
}

/* ─── 3. Blog Post Schema ─────────────────────────────────── */

interface BlogPostSchemaProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
    authorCredentials?: string;
    category: string;
    faqs?: { question: string; answer: string }[];
  };
}

export function BlogPostSchema({ post }: BlogPostSchemaProps) {
  const postUrl = `${clinicInfo.website}/blog/${post.slug}`;

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
      ...(post.authorCredentials && {
        jobTitle: post.authorCredentials,
      }),
      worksFor: {
        "@type": "Organization",
        name: clinicInfo.name,
        url: clinicInfo.website,
      },
    },
    publisher: {
      "@type": "Organization",
      name: clinicInfo.name,
      url: clinicInfo.website,
      logo: {
        "@type": "ImageObject",
        url: `${clinicInfo.website}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    image: `${clinicInfo.website}/opengraph-image`,
    articleSection: post.category,
    inLanguage: "en-US",
  };

  const faqSchema =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <StructuredData data={blogPosting} />
      {faqSchema && <StructuredData data={faqSchema} />}
    </>
  );
}

/* ─── 4. Location Schema ──────────────────────────────────── */

interface LocationSchemaProps {
  location: {
    slug: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    driveTime: string;
    metaDescription?: string;
  };
  services?: { slug: string; name: string; basePath?: string }[];
}

export function LocationSchema({ location, services }: LocationSchemaProps) {
  const locationUrl = `${clinicInfo.website}/locations/${location.slug}`;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness"],
    "@id": `${locationUrl}/#localbusiness`,
    name: `${clinicInfo.name} — Serving ${location.city}, ${location.state}`,
    description:
      location.metaDescription ??
      `${clinicInfo.name} serves ${location.city}, ${location.state} residents with physician-supervised aesthetic and wellness treatments. ${location.driveTime} from ${location.city}.`,
    url: locationUrl,
    telephone: clinicInfo.phone,
    email: clinicInfo.email,
    address: CLINIC_BASE.address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicInfo.geo.latitude,
      longitude: clinicInfo.geo.longitude,
    },
    openingHoursSpecification: CLINIC_BASE.openingHoursSpecification,
    priceRange: "$$",
    aggregateRating: CLINIC_BASE.aggregateRating,
    sameAs: CLINIC_BASE.sameAs,
    areaServed: {
      "@type": "City",
      name: location.city,
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.latitude,
        longitude: location.longitude,
      },
    },
    employee: {
      "@type": "Physician",
      name: clinicInfo.medicalDirector.name,
      jobTitle: clinicInfo.medicalDirector.title,
      description: clinicInfo.medicalDirector.specialty,
    },
    ...(services &&
      services.length > 0 && {
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.name,
              url: `${clinicInfo.website}/${s.basePath ?? "services"}/${s.slug}`,
            },
          })),
        },
      }),
  };

  const breadcrumbList = {
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
        name: "Locations",
        item: `${clinicInfo.website}/locations`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${location.city}, ${location.state}`,
        item: locationUrl,
      },
    ],
  };

  return (
    <>
      <StructuredData data={localBusiness} />
      <StructuredData data={breadcrumbList} />
    </>
  );
}
