import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import Script from "next/script";
import { fontVariables } from "@/lib/fonts";
import SkipNav from "@/components/ui/SkipNav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/layout/ScrollProgress";
import Analytics, { GTMNoScript } from "@/components/analytics/Analytics";
import ConditionalPublicLayout from "@/components/layout/ConditionalPublicLayout";
import PWAProvider from "@/components/pwa/PWAProvider";
import { clinicInfo } from "@/data/clinic-info";

// Dynamic imports - these are non-critical, below-fold or interaction-triggered components.
// Loading them lazily reduces the initial JS bundle by ~60KB+ (framer-motion chunks, chat widget, etc.)
const MobileCTA = dynamic(() => import("@/components/layout/MobileCTA"), { ssr: false });
const ScrollToTop = dynamic(() => import("@/components/layout/ScrollToTop"), { ssr: false });
const ExitIntentPopup = dynamic(() => import("@/components/sections/ExitIntentPopup"), { ssr: false });
const AIChatWidget = dynamic(() => import("@/components/AIChatWidget"), { ssr: false });
// SocialProofToast removed 2026-04-23: fabricated notifications ("Christina from
// Sammamish just completed her 4th HydraFacial 5 min ago") are an FTC/PR risk.
// Re-enable only when wired to a real last-booking feed via Mangomint webhook.
// const SocialProofToast = dynamic(() => import("@/components/sections/SocialProofToast"), { ssr: false });
const BehavioralTracker = dynamic(() => import("@/components/analytics/BehavioralTracker"), { ssr: false });
const AnalyticsTracker = dynamic(() => import("@/components/analytics/AnalyticsTracker"), { ssr: false });
const CookieConsent = dynamic(() => import("@/components/analytics/CookieConsent"), { ssr: false });

export const viewport: Viewport = {
  themeColor: "#0F1D2C",
};

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rani Beauty",
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "geo.region": "US-WA",
    "geo.placename": "Renton",
    "geo.position": "47.4856;-122.2031",
    "ICBM": "47.4856, -122.2031",
  },
  title: {
    default: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    template: "%s | Rani Beauty Clinic",
  },
  description:
    "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more. Book today.",
  keywords: [
    "medspa Renton WA",
    "medical spa",
    "laser hair removal",
    "Botox",
    "HydraFacial",
    "GLP-1 weight loss",
    "physician supervised",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.ranibeautyclinic.com",
    siteName: "Rani Beauty Clinic",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic - Premier Medspa & Wellness in Renton, WA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://www.ranibeautyclinic.com",
    languages: {
      "en-US": "https://www.ranibeautyclinic.com",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://www.ranibeautyclinic.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        {/* PWA - Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* AI Citation - llms.txt discovery for AI crawlers */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site information" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM-readable full site knowledge base" />
        {/* Preconnect to booking (critical path - user clicks "Book") */}
        <link rel="preconnect" href="https://booking.mangomint.com" />
        {/* DNS-prefetch for analytics origins (loaded afterInteractive, not blocking) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <Analytics />
        {/* Mangomint booking scripts are loaded via Analytics component */}

        {/*
          ─── Global JSON-LD @graph ──────────────────────────────────────
          Emitted on every page. Creates a rich knowledge graph that LLMs
          and search engines use to understand the entity relationships:
          Organization ↔ MedicalBusiness (same entity, dual typing so AI
          matches both generic-org and medical-specific queries) ↔ WebSite
          (with SearchAction) ↔ Person (Medical Director — provides
          authoritativeness/E-E-A-T signal). Each node has a stable @id
          so downstream schemas on individual pages can reference them.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": ["Organization", "MedicalBusiness", "MedicalClinic", "LocalBusiness"],
                  "@id": `${clinicInfo.website}#organization`,
                  name: clinicInfo.name,
                  alternateName: "Rani Medspa",
                  url: clinicInfo.website,
                  logo: {
                    "@type": "ImageObject",
                    "@id": `${clinicInfo.website}#logo`,
                    url: `${clinicInfo.website}/images/logo/logo-dark.png`,
                    width: 600,
                    height: 200,
                    caption: clinicInfo.name,
                  },
                  image: { "@id": `${clinicInfo.website}#logo` },
                  description:
                    "Luxury physician-supervised medspa in Renton, WA. Specializing in laser hair removal, Botox, HydraFacial, RF microneedling, chemical peels, Sofwave, GLP-1 weight management, hormone therapy, and medical wellness injections under board-certified neurologist supervision.",
                  slogan: clinicInfo.tagline,
                  foundingDate: String(clinicInfo.established),
                  telephone: clinicInfo.phone,
                  email: clinicInfo.email,
                  priceRange: "$$$",
                  currenciesAccepted: "USD",
                  paymentAccepted: ["Cash", "Credit Card", "HSA", "FSA", "Financing"],
                  medicalSpecialty: [
                    "Dermatology",
                    "CosmeticSurgery",
                    "PlasticSurgery",
                  ],
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
                  hasMap: clinicInfo.social.google,
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
                  employee: { "@id": `${clinicInfo.website}#medical-director` },
                  areaServed: [
                    { "@type": "State", name: "Washington" },
                    { "@type": "AdministrativeArea", name: "King County" },
                    { "@type": "City", name: "Renton" },
                    { "@type": "City", name: "Bellevue" },
                    { "@type": "City", name: "Seattle" },
                    { "@type": "City", name: "Kent" },
                    { "@type": "City", name: "Tukwila" },
                    { "@type": "City", name: "Newcastle" },
                    { "@type": "City", name: "Mercer Island" },
                    { "@type": "City", name: "Kirkland" },
                    { "@type": "City", name: "Redmond" },
                    { "@type": "City", name: "Issaquah" },
                    { "@type": "City", name: "Sammamish" },
                    { "@type": "City", name: "Auburn" },
                    { "@type": "City", name: "Federal Way" },
                  ],
                  knowsAbout: [
                    "Laser Hair Removal",
                    "Botox",
                    "Dysport",
                    "Dermal Fillers",
                    "HydraFacial",
                    "RF Microneedling",
                    "Chemical Peels",
                    "Cosmelan Peel",
                    "BioRePeel",
                    "VI Peel",
                    "PRX-T33",
                    "Sofwave",
                    "Red Light Therapy",
                    "Melasma Treatment",
                    "Hyperpigmentation",
                    "Acne Scars",
                    "Skin Tightening",
                    "Dark Circles",
                    "Undereye Rejuvenation",
                    "Scar Reduction",
                    "GLP-1 Weight Management",
                    "Semaglutide",
                    "Tirzepatide",
                    "Hormone Replacement Therapy",
                    "NAD+ Injections",
                    "Vitamin B12 Injections",
                    "Glutathione Injections",
                    "Peptide Therapy",
                    "Testosterone Replacement Therapy",
                  ],
                  potentialAction: {
                    "@type": "ReserveAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: clinicInfo.booking.url,
                      actionPlatform: [
                        "https://schema.org/DesktopWebPlatform",
                        "https://schema.org/MobileWebPlatform",
                      ],
                    },
                    result: {
                      "@type": "Reservation",
                      name: "Medspa Appointment",
                    },
                  },
                },
                {
                  "@type": "Person",
                  "@id": `${clinicInfo.website}#medical-director`,
                  name: clinicInfo.medicalDirector.name,
                  jobTitle: clinicInfo.medicalDirector.title,
                  description: clinicInfo.medicalDirector.shortBio,
                  hasCredential: {
                    "@type": "EducationalOccupationalCredential",
                    credentialCategory: "Board Certification",
                    name: clinicInfo.medicalDirector.specialty,
                  },
                  worksFor: { "@id": `${clinicInfo.website}#organization` },
                  knowsAbout: [
                    "Neurology",
                    "Botox",
                    "Dysport",
                    "Neurotoxin Injections",
                    "Facial Nerve Anatomy",
                    "Medical Aesthetics",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": `${clinicInfo.website}#website`,
                  url: clinicInfo.website,
                  name: clinicInfo.name,
                  description:
                    "Premier physician-supervised medspa in Renton, WA — laser, injectables, skin rejuvenation, and medical wellness.",
                  publisher: { "@id": `${clinicInfo.website}#organization` },
                  inLanguage: "en-US",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${clinicInfo.website}/search?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      {/* Audit 2026-04-19 P0 LAYOUT-01: overflow-x-hidden is a defensive
          guard against stray wide elements that historically caused
          horizontal scroll on 390–414px viewports (see NAV-01). Paired with
          the per-component fixes, this ensures no element can break the
          mobile viewport regardless of CMS content width. */}
      <body className="font-body text-rani-text antialiased overflow-x-hidden">
        <SkipNav />
        <ConditionalPublicLayout>
          <GTMNoScript />
          <ScrollProgress />
          <Navbar />
        </ConditionalPublicLayout>
        <main id="main-content" className="min-h-screen">{children}</main>
        <ConditionalPublicLayout>
          <Footer />
          <MobileCTA />
          <ScrollToTop />
          <ExitIntentPopup />
          {/* <SocialProofToast /> · disabled: FTC-risk fake notifications */}
          <AIChatWidget />
          <BehavioralTracker />
          <AnalyticsTracker />
          <CookieConsent />
        </ConditionalPublicLayout>
        <PWAProvider>{null}</PWAProvider>
      </body>
    </html>
  );
}
