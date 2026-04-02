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

export const metadata: Metadata = {
  title: "Premier Medspa & Wellness in Renton, WA",
  description:
    "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections, hormone therapy & more. Book your consultation today.",
  alternates: {
    canonical: "https://ranibeautyclinic.com",
  },
  openGraph: {
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections & more in Renton, WA.",
    url: "https://ranibeautyclinic.com",
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

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    rating: 5,
    text: "The laser hair removal at Rani is truly pain-free. I was nervous about my first session, but the cooling technology made it so comfortable. After just 4 sessions, I can already see incredible results.",
    treatment: "Laser Hair Removal",
    date: "January 2026",
  },
  {
    id: 2,
    name: "Jennifer L.",
    rating: 5,
    text: "Knowing that a board-certified neurologist oversees the Botox treatments gave me so much confidence. My results look completely natural - refreshed, not frozen. The staff is incredibly professional and warm.",
    treatment: "Botox",
    date: "December 2025",
  },
  {
    id: 3,
    name: "David K.",
    rating: 5,
    text: "The GLP-1 program at Rani changed my life. Dr. Landfield monitors everything closely, and having blood work done right in the clinic makes it so convenient. I feel healthier and more energetic than I have in years.",
    treatment: "GLP-1 Weight Management",
    date: "November 2025",
  },
  {
    id: 4,
    name: "Priya R.",
    rating: 5,
    text: "I tried HydraFacial at several spas before Rani, but the difference here is night and day. The clinical approach combined with a warm atmosphere makes it feel like genuine self-care, not just a treatment. My skin has never looked this radiant.",
    treatment: "HydraFacial MD",
    date: "February 2026",
  },
  {
    id: 5,
    name: "Michelle T.",
    rating: 5,
    text: "The RF microneedling results have been amazing for my acne scars. The team was upfront about expectations and timeline, and they were right - after three sessions, my skin texture is dramatically smoother. Worth every penny.",
    treatment: "RF Microneedling",
    date: "March 2026",
  },
  {
    id: 6,
    name: "Angela W.",
    rating: 5,
    text: "I was hesitant about fillers but the team walked me through every step. The fact that a neurologist oversees the process made me feel completely safe. The results are so subtle and natural - my friends just say I look rested.",
    treatment: "Dermal Fillers",
    date: "January 2026",
  },
  {
    id: 7,
    name: "Robert H.",
    rating: 5,
    text: "Started the NAD+ injection program here and the difference in my energy and recovery is remarkable. The in-house blood work makes it so easy to track progress. This is what modern wellness should feel like.",
    treatment: "NAD+ Injections",
    date: "February 2026",
  },
  {
    id: 8,
    name: "Lisa K.",
    rating: 5,
    text: "Open 7 days a week makes all the difference for my schedule. I come in for my chemical peel on Sundays and it fits perfectly into my routine. The team remembers my preferences and my skin has never been clearer.",
    treatment: "Chemical Peels",
    date: "March 2026",
  },
  {
    id: 9,
    name: "Carmen D.",
    rating: 5,
    text: "The hormone therapy program has been transformative. Dr. Landfield took the time to review my comprehensive blood panel and created a protocol that addressed my specific needs. I finally feel like myself again.",
    treatment: "Hormone Therapy",
    date: "December 2025",
  },
];

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

      {/* 9. Consultation CTA (single, clear close) */}
      <ConsultationCTA />

      {/* 10. FAQ */}
      <FAQ />
    </>
  );
}
