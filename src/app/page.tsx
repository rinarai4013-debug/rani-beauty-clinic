import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import StructuredData from "@/components/seo/StructuredData";
import { HomepageSchema, AICitationSchemas } from "@/components/seo/EnhancedSchemas";
import ServiceCategoryPanels from "@/components/sections/ServiceCategoryPanels";
import { clinicInfo } from "@/data/clinic-info";

// Below-fold sections - dynamically imported to reduce initial JS bundle.
const ResultsShowcase = dynamic(() => import("@/components/sections/ResultsShowcase"));
const CredibilitySection = dynamic(() => import("@/components/sections/CredibilitySection"));
const QuizCTA = dynamic(() => import("@/components/sections/QuizCTA"));
const PopularPackages = dynamic(() => import("@/components/sections/PopularPackages"));
const ProcessSteps = dynamic(() => import("@/components/sections/ProcessSteps"));
const ConsultationCTA = dynamic(() => import("@/components/sections/ConsultationCTA"));
const ConsultationEmbed = dynamic(() => import("@/components/sections/ConsultationEmbed"));
const FAQ = dynamic(() => import("@/components/sections/FAQ"));

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

const homepageFaqs = [
  {
    question: "What makes Rani Beauty Clinic different from other medspas?",
    answer:
      "Every medical treatment at Rani is supervised by Dr. Alexander Landfield, a board-certified neurologist. His expertise in neuroscience and muscle anatomy means more precise injections, safer protocols, and better outcomes. We also combine aesthetics and medical wellness under one roof, so your care is truly comprehensive.",
  },
  {
    question: "How does the consultation deposit work?",
    answer:
      "Your consultation requires a $150 deposit to secure your appointment. This deposit applies directly toward any treatment or product you choose - so it's not an extra cost, it's a credit toward your care. During your visit, our team will assess your skin, discuss your goals, and create a personalized treatment roadmap.",
  },
  {
    question: "How do I know which treatment is right for me?",
    answer:
      "That's exactly what your consultation is for. We evaluate your skin type, concerns, medical history, and goals to recommend the most effective plan. You can also take our Treatment Quiz for a quick preliminary recommendation.",
  },
  {
    question: "Is laser hair removal painful?",
    answer:
      "Our Candela GentleMax Pro Plus uses an integrated cooling system that makes treatments virtually pain-free. Most patients describe it as a light snapping sensation. The dual-wavelength technology is safe for all skin types, including darker skin tones.",
  },
  {
    question: "How soon will I see results?",
    answer:
      "It depends on the treatment. HydraFacial gives an immediate glow. Botox takes 3-7 days to show full effect. RF microneedling results build over 3-6 months as collagen regenerates. During your consultation, we'll set realistic expectations for your specific treatment plan.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Schema Markup */}
      <HomepageSchema />
      <AICitationSchemas reviews={reviews} faqs={homepageFaqs} />

      {/* 1. Hero - Cinematic Split Layout */}
      <Hero
        label="PHYSICIAN-SUPERVISED MEDSPA"
        title="Physician-Supervised Beauty. Personally Designed."
        subtitle="Expert-led treatments for skin, body, and wellness - designed by a neurologist-led team."
        primaryCTA={{
          text: "Book Your Consultation",
          href: clinicInfo.booking.url,
          target: "_blank",
        }}
        badges={[
          "Board-Certified Neurologist",
          "4.9 Google Rating",
          "Open 7 Days",
        ]}
        backgroundImage="/images/hero/facility.jpg"
        backgroundOverlay={0}
        layout="split"
        dark
        fullHeight
      />

      {/* 2. Trust Credential Strip */}
      <TrustStrip />

      {/* 3. Service Categories */}
      <ServiceCategoryPanels />

      {/* 4. Results Showcase (B/A + Testimonials) */}
      <ResultsShowcase reviews={reviews} />

      {/* 5. Founders + Medical Director */}
      <CredibilitySection />

      {/* 6. Quiz CTA */}
      <QuizCTA />

      {/* 7. Signature Packages */}
      <PopularPackages />

      {/* 8. Your Path to Results */}
      <ProcessSteps />

      {/* 9. Consultation Wizard */}
      <ConsultationEmbed />

      {/* 10. Consultation CTA (quick book) */}
      <ConsultationCTA />

      {/* 11. FAQ */}
      <FAQ />
    </>
  );
}
