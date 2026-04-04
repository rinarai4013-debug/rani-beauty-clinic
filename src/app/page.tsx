import { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import StructuredData from "@/components/seo/StructuredData";
import { HomepageSchema, AICitationSchemas } from "@/components/seo/EnhancedSchemas";
import ServiceCategoryPanels from "@/components/sections/ServiceCategoryPanels";
import { clinicInfo } from "@/data/clinic-info";
import { faqItems } from "@/data/faqs";
import { AGGREGATE_RATING } from "@/data/constants";
import { testimonials } from "@/data/testimonials";

export const metadata: Metadata = {
  title: "Premier Medspa & Wellness in Renton, WA",
  description:
    "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections, hormone therapy & more. Book your consultation today.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com",
  },
  openGraph: {
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections & more in Renton, WA.",
    url: "https://www.ranibeautyclinic.com",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections & more in Renton, WA.",
  },
};

// Below-fold sections - dynamically imported to reduce initial JS bundle.
const NewPatientPaths = dynamic(() => import("@/components/sections/NewPatientPaths"));
const ResultsShowcase = dynamic(() => import("@/components/sections/ResultsShowcase"));
const CredibilitySection = dynamic(() => import("@/components/sections/CredibilitySection"));
const QuizCTA = dynamic(() => import("@/components/sections/QuizCTA"));
const PopularPackages = dynamic(() => import("@/components/sections/PopularPackages"));
const ProcessSteps = dynamic(() => import("@/components/sections/ProcessSteps"));
const ConsultationCTA = dynamic(() => import("@/components/sections/ConsultationCTA"));
const FAQ = dynamic(() => import("@/components/sections/FAQ"));
const ConsultationUrgency = dynamic(() => import("@/components/conversion/ConsultationUrgency"));
const AreasWeServe = dynamic(() => import("@/components/sections/AreasWeServe"));

const reviews = testimonials;

const homepageFaqs = faqItems;

export default function HomePage() {
  return (
    <>
      {/* Schema Markup */}
      <HomepageSchema />
      <AICitationSchemas reviews={reviews} faqs={homepageFaqs} />

      {/* 1. Hero - Cinematic Split Layout */}
      <Hero
        label="RENTON'S PREMIER MEDICAL AESTHETICS CLINIC"
        title="Where Precision Medicine Meets Uncompromising Beauty."
        subtitle="Every protocol designed by a board-certified neurologist. Every result held to a higher standard."
        primaryCTA={{
          text: "Book Your Consultation",
          href: clinicInfo.booking.url,
          target: "_blank",
        }}
        badges={[
          "Neurologist-Directed Protocols",
          `${AGGREGATE_RATING} Stars \u00b7 Google Reviews`,
          "Open 7 Days a Week",
        ]}
        backgroundImage="/images/hero/facility.jpg"
        backgroundOverlay={0}
        layout="split"
        dark
        fullHeight
      />

      {/* 1b. Urgency / Scheduling Pressure */}
      <div className="bg-white py-3 px-6">
        <div className="mx-auto max-w-7xl">
          <ConsultationUrgency />
        </div>
      </div>

      {/* 2. Trust Credential Strip */}
      <TrustStrip />

      {/* 3. Service Categories */}
      <ServiceCategoryPanels />

      {/* 3b. New Patient Paths */}
      <NewPatientPaths />

      {/* 4. Results Showcase (B/A + Testimonials) */}
      <ResultsShowcase reviews={reviews} />

      {/* 5. Founders + Medical Director */}
      <CredibilitySection />

      {/* 6. Signature Packages */}
      <PopularPackages />

      {/* 7. Your Path to Results */}
      <ProcessSteps />

      {/* 8. Personalized Quiz */}
      <QuizCTA />

      {/* 9. Areas We Serve — internal linking to geo pages for SEO */}
      <AreasWeServe />

      {/* 10. Consultation CTA (single, clear close) */}
      <ConsultationCTA />

      {/* 11. FAQ */}
      <FAQ />
    </>
  );
}
