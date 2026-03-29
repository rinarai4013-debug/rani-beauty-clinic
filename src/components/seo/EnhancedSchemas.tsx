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
  // TODO: Re-enable aggregateRating once reviewCount is verified against live GBP
  // aggregateRating: {
  //   "@type": "AggregateRating",
  //   ratingValue: clinicInfo.reviews.aggregateRating,
  //   reviewCount: clinicInfo.reviews.reviewCount,
  //   bestRating: 5,
  //   worstRating: 1,
  // },
  sameAs: [
    clinicInfo.social.instagram,
    clinicInfo.social.facebook,
    clinicInfo.social.tiktok,
    clinicInfo.social.google,
  ],
};

/* ─── 1. Homepage Schema (AI Citation Optimized) ─────────── */

export function HomepageSchema() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${clinicInfo.website}/#organization`,
    name: clinicInfo.name,
    alternateName: "Rani Beauty Clinic Renton",
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
    founder: {
      "@type": "Person",
      name: "Rani",
      jobTitle: "Founder & CEO",
    },
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      minValue: 5,
      maxValue: 15,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: clinicInfo.phone,
        contactType: "customer service",
        areaServed: "US",
        availableLanguage: ["English"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "10:00",
          closes: "19:00",
        },
      },
      {
        "@type": "ContactPoint",
        telephone: clinicInfo.phone,
        contactType: "reservations",
        areaServed: "US",
        availableLanguage: ["English"],
      },
    ],
    address: CLINIC_BASE.address,
    sameAs: [
      clinicInfo.social.instagram,
      clinicInfo.social.facebook,
      clinicInfo.social.tiktok,
      clinicInfo.social.google,
    ],
    knowsAbout: [
      "Laser Hair Removal",
      "Botox Injections",
      "Dermal Fillers",
      "HydraFacial",
      "RF Microneedling",
      "Chemical Peels",
      "Sofwave Skin Tightening",
      "GLP-1 Weight Management",
      "Semaglutide",
      "Tirzepatide",
      "NAD+ Injections",
      "Hormone Therapy",
      "Medical Aesthetics",
      "Medspa Treatments",
      "Skin Rejuvenation",
      "Anti-Aging Treatments",
      "Neurotoxin Injections",
      "Red Light Therapy",
      "AI Skin Analysis",
      "Candela GentleMax Pro Plus",
    ],
    award: "Woman-Owned Business",
    slogan: "Your Skin. Your Wellness. Our Expertise.",
  };

  const localBusiness = {
    "@context": "https://schema.org",
    ...CLINIC_BASE,
    "@type": ["LocalBusiness", "MedicalBusiness"] as const,
    "@id": `${clinicInfo.website}/#localbusiness`,
    name: clinicInfo.name,
    alternateName: "Rani Medspa Renton WA",
    description:
      "Rani Beauty Clinic is a physician-supervised medspa in Renton, WA. Every medical treatment is performed under the supervision of Dr. Alexander Landfield, a board-certified neurologist. The clinic offers laser hair removal (Candela GentleMax Pro Plus), Botox & Dysport, dermal fillers, HydraFacial MD, RF microneedling, Sofwave skin tightening, GLP-1 weight management (Semaglutide/Tirzepatide), NAD+ injections, hormone therapy, and more. Woman-owned. Open 7 days a week. Safe for all skin types. Rated 4.9 stars on Google.",
    medicalSpecialty: "Dermatology",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Debit Card, HSA, FSA",
    employee: {
      "@type": "Physician",
      "@id": `${clinicInfo.website}/#physician`,
      name: clinicInfo.medicalDirector.name,
      jobTitle: clinicInfo.medicalDirector.title,
      description: `${clinicInfo.medicalDirector.specialty} serving as Medical Director. Provides neurological expertise for neurotoxin injections (Botox, Dysport) and oversees all medical treatments and wellness programs.`,
      medicalSpecialty: "Neurology",
      worksFor: {
        "@id": `${clinicInfo.website}/#organization`,
      },
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Aesthetic & Wellness Services",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Aesthetic Treatments", itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Laser Hair Removal", url: `${clinicInfo.website}/services/laser-hair-removal` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Botox & Dysport", url: `${clinicInfo.website}/services/botox-dysport` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dermal Fillers", url: `${clinicInfo.website}/services/dermal-fillers` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "HydraFacial MD", url: `${clinicInfo.website}/services/hydrafacial` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "RF Microneedling", url: `${clinicInfo.website}/services/rf-microneedling` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Chemical Peels", url: `${clinicInfo.website}/services/chemical-peels` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sofwave", url: `${clinicInfo.website}/services/sofwave` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Red Light Therapy", url: `${clinicInfo.website}/services/red-light-therapy` } },
        ]},
        { "@type": "OfferCatalog", name: "Medical Wellness Programs", itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "GLP-1 Weight Management", url: `${clinicInfo.website}/wellness/glp1-weight-management` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "NAD+ Injections", url: `${clinicInfo.website}/wellness/nad-injections` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vitamin Injections", url: `${clinicInfo.website}/wellness/vitamin-injections` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Hormone Therapy", url: `${clinicInfo.website}/wellness/hormone-therapy` } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Blood Work", url: `${clinicInfo.website}/wellness/blood-work` } },
        ]},
      ],
    },
    areaServed: [
      { "@type": "City", name: "Renton", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Bellevue", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Kent", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Tukwila", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Newcastle", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Mercer Island", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Auburn", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Federal Way", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Kirkland", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Redmond", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Issaquah", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Sammamish", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "City", name: "Seattle", containedInPlace: { "@type": "State", name: "Washington" } },
      { "@type": "AdministrativeArea", name: "King County" },
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${clinicInfo.website}/#website`,
    name: clinicInfo.name,
    url: clinicInfo.website,
    description: "Official website of Rani Beauty Clinic - physician-supervised medspa in Renton, WA.",
    publisher: {
      "@id": `${clinicInfo.website}/#organization`,
    },
    inLanguage: "en-US",
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

/* ─── 1b. AI Citation Schemas - Speakable, Reviews, FAQ ──── */

interface ReviewData {
  name: string;
  rating: number;
  text: string;
  treatment: string;
  date: string;
}

interface FAQData {
  question: string;
  answer: string;
}

export function AICitationSchemas({
  reviews,
  faqs,
}: {
  reviews: ReviewData[];
  faqs: FAQData[];
}) {
  // Speakable schema - tells Google AI Overview which content to cite
  const speakable = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${clinicInfo.website}/#webpage`,
    name: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    url: clinicInfo.website,
    description:
      "Physician-supervised medspa in Renton, WA. Every treatment supervised by Dr. Alexander Landfield, Board-Certified Neurologist. Laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections. Woman-owned. Open 7 days a week. 4.9-star Google rating.",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [
        "h1",
        ".hero-subtitle",
        ".trust-bar",
        ".faq-answer",
        "[data-speakable]",
      ],
    },
    isPartOf: {
      "@id": `${clinicInfo.website}/#website`,
    },
    about: {
      "@id": `${clinicInfo.website}/#organization`,
    },
    mainEntity: {
      "@id": `${clinicInfo.website}/#localbusiness`,
    },
  };

  // Individual Review schema - more citation surface for AI
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${clinicInfo.website}/#localbusiness`,
    name: clinicInfo.name,
    review: reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
      },
      reviewBody: r.text,
      datePublished: new Date(r.date).toISOString().split("T")[0],
      itemReviewed: {
        "@type": "Service",
        name: r.treatment,
      },
    })),
    // TODO: Re-enable aggregateRating once reviewCount is verified against live GBP
    // aggregateRating: {
    //   "@type": "AggregateRating",
    //   ratingValue: clinicInfo.reviews.aggregateRating,
    //   reviewCount: clinicInfo.reviews.reviewCount,
    //   bestRating: 5,
    //   worstRating: 1,
    // },
  };

  // Homepage FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // ItemList of services - helps AI models understand the full service offering
  const serviceList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Rani Beauty Clinic Services",
    description: "Complete list of aesthetic treatments and medical wellness programs offered at Rani Beauty Clinic in Renton, WA.",
    numberOfItems: 17,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Laser Hair Removal", url: `${clinicInfo.website}/services/laser-hair-removal` },
      { "@type": "ListItem", position: 2, name: "Botox & Dysport", url: `${clinicInfo.website}/services/botox-dysport` },
      { "@type": "ListItem", position: 3, name: "Dermal Fillers", url: `${clinicInfo.website}/services/dermal-fillers` },
      { "@type": "ListItem", position: 4, name: "HydraFacial MD", url: `${clinicInfo.website}/services/hydrafacial` },
      { "@type": "ListItem", position: 5, name: "RF Microneedling", url: `${clinicInfo.website}/services/rf-microneedling` },
      { "@type": "ListItem", position: 6, name: "Chemical Peels", url: `${clinicInfo.website}/services/chemical-peels` },
      { "@type": "ListItem", position: 7, name: "Sofwave", url: `${clinicInfo.website}/services/sofwave` },
      { "@type": "ListItem", position: 8, name: "BioRePeel", url: `${clinicInfo.website}/services/biorepeel` },
      { "@type": "ListItem", position: 9, name: "Red Light Therapy", url: `${clinicInfo.website}/services/red-light-therapy` },
      { "@type": "ListItem", position: 10, name: "AI Skin Analysis", url: `${clinicInfo.website}/services/ai-skin-analysis` },
      { "@type": "ListItem", position: 11, name: "Scar Reduction", url: `${clinicInfo.website}/services/scar-reduction` },
      { "@type": "ListItem", position: 12, name: "Laser Acne Facial", url: `${clinicInfo.website}/services/laser-acne-facial` },
      { "@type": "ListItem", position: 13, name: "GLP-1 Weight Management", url: `${clinicInfo.website}/wellness/glp1-weight-management` },
      { "@type": "ListItem", position: 14, name: "NAD+ Injections", url: `${clinicInfo.website}/wellness/nad-injections` },
      { "@type": "ListItem", position: 15, name: "Vitamin Injections", url: `${clinicInfo.website}/wellness/vitamin-injections` },
      { "@type": "ListItem", position: 16, name: "Hormone Therapy", url: `${clinicInfo.website}/wellness/hormone-therapy` },
      { "@type": "ListItem", position: 17, name: "Blood Work", url: `${clinicInfo.website}/wellness/blood-work` },
    ],
  };

  return (
    <>
      <StructuredData data={speakable} />
      <StructuredData data={reviewSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={serviceList} />
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
    // TODO: Re-enable aggregateRating once reviewCount is verified against live GBP
    // aggregateRating: {
    //   "@type": "AggregateRating",
    //   ratingValue: clinicInfo.reviews.aggregateRating,
    //   reviewCount: clinicInfo.reviews.reviewCount,
    //   bestRating: 5,
    //   worstRating: 1,
    // },
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
    name: `${clinicInfo.name} - Serving ${location.city}, ${location.state}`,
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
