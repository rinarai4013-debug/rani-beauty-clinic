import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import TrustLogosBar from "@/components/sections/TrustLogosBar";
import StructuredData from "@/components/seo/StructuredData";
import { HomepageSchema, AICitationSchemas } from "@/components/seo/EnhancedSchemas";
import ServiceCategoryPanels from "@/components/sections/ServiceCategoryPanels";
import { clinicInfo } from "@/data/clinic-info";

// Above-fold client components (eagerly loaded — visible on initial viewport)
import HomeServicesOverview from "@/components/sections/HomeServicesOverview";

// Below-fold sections — dynamically imported to reduce initial JS bundle.
// Each loads only when React renders it (after hydration), cutting ~80KB from first load.
const TrustBar = dynamic(() => import("@/components/sections/TrustBar"));
const MeetTheTeam = dynamic(() => import("@/components/sections/MeetTheTeam"));
const ProcessSteps = dynamic(() => import("@/components/sections/ProcessSteps"));
const DoctorIntro = dynamic(() => import("@/components/sections/DoctorIntro"));
const WhyRaniCards = dynamic(() => import("@/components/sections/WhyRaniCards"));
const BeforeAfterSlider = dynamic(() => import("@/components/sections/BeforeAfterSlider"));
const ReviewCarousel = dynamic(() => import("@/components/sections/ReviewCarousel"));
const WhyRaniComparison = dynamic(() => import("@/components/sections/WhyRaniComparison"));
const BeforeAfterGallery = dynamic(() => import("@/components/sections/BeforeAfterGallery"));
const PopularPackages = dynamic(() => import("@/components/sections/PopularPackages"));
const TreatmentQuiz = dynamic(() => import("@/components/sections/TreatmentQuiz"));
const BlogTeaser = dynamic(() => import("@/components/sections/BlogTeaser"));
const ConsultationEmbed = dynamic(() => import("@/components/sections/ConsultationEmbed"));
const FAQ = dynamic(() => import("@/components/sections/FAQ"));
const CTABanner = dynamic(() => import("@/components/sections/CTABanner"));
const MapSection = dynamic(() => import("@/components/sections/MapSection"));

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
    text: "Knowing that a board-certified neurologist oversees the Botox treatments gave me so much confidence. My results look completely natural — refreshed, not frozen. The staff is incredibly professional and warm.",
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
    text: "The RF microneedling results have been amazing for my acne scars. The team was upfront about expectations and timeline, and they were right — after three sessions, my skin texture is dramatically smoother. Worth every penny.",
    treatment: "RF Microneedling",
    date: "March 2026",
  },
  {
    id: 6,
    name: "Angela W.",
    rating: 5,
    text: "I was hesitant about fillers but the team walked me through every step. The fact that a neurologist oversees the process made me feel completely safe. The results are so subtle and natural — my friends just say I look rested.",
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
    text: "Open 7 days a week is a game-changer for my schedule. I come in for my chemical peel on Sundays and it fits perfectly into my routine. The team remembers my preferences and my skin has never been clearer.",
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

const blogPosts = [
  {
    slug: "what-is-glp1-weight-management",
    title:
      "GLP-1 Weight Management: What Semaglutide and Tirzepatide Can Do That Diet Alone Cannot",
    excerpt:
      "Discover how GLP-1 receptor agonists work, who qualifies, and what to expect from a physician-supervised weight management program.",
    date: "March 1, 2026",
    author: "Dr. Alexander Landfield",
    category: "Medical Wellness",
  },
  {
    slug: "why-neurologist-for-botox",
    title:
      "Why Having a Neurologist Oversee Your Botox Makes a Difference",
    excerpt:
      "Botox is a neurotoxin — learn why neurological expertise leads to more precise placement, better results, and enhanced safety.",
    date: "February 20, 2026",
    author: "Rani Beauty Clinic Team",
    category: "Aesthetic Treatments",
  },
  {
    slug: "pain-free-laser-hair-removal-guide",
    title: "Your Complete Guide to Pain-Free Laser Hair Removal in 2026",
    excerpt:
      "Everything you need to know about the Candela GentleMax Pro Plus, the gold standard in pain-free laser hair removal technology.",
    date: "February 10, 2026",
    author: "Rani Beauty Clinic Team",
    category: "Aesthetic Treatments",
  },
];

// Homepage FAQ items — duplicated here for schema markup (visual FAQ is rendered client-side)
const homepageFaqs = [
  {
    question: "What makes Rani Beauty Clinic different from other medspas?",
    answer:
      "Every medical treatment at Rani is supervised by Dr. Alexander Landfield, a board-certified neurologist. His expertise in neuroscience and muscle anatomy means more precise injections, safer protocols, and better outcomes. We also combine aesthetics and medical wellness under one roof, so your care is truly comprehensive.",
  },
  {
    question: "How does the consultation deposit work?",
    answer:
      "Your consultation requires a $150 deposit to secure your appointment. The great news is that this deposit applies directly toward any treatment or product you choose — so it's not an extra cost, it's a credit toward your care. During your visit, our team will assess your skin, discuss your goals, and create a personalized treatment roadmap.",
  },
  {
    question: "How do I know which treatment is right for me?",
    answer:
      "That's exactly what your consultation is for. We evaluate your skin type, concerns, medical history, and goals to recommend the most effective plan. You can also take our Treatment Quiz on this page for a quick preliminary recommendation.",
  },
  {
    question: "Is laser hair removal painful?",
    answer:
      "Our Candela GentleMax Pro Plus uses an integrated cooling system that makes treatments virtually pain-free. Most patients describe it as a light snapping sensation. The dual-wavelength technology is safe for all skin types, including darker skin tones.",
  },
  {
    question: "What is GLP-1 weight management and am I a candidate?",
    answer:
      "GLP-1 programs use FDA-approved medications like Semaglutide and Tirzepatide to support weight loss alongside lifestyle changes. Candidates typically have a BMI of 27+ with a weight-related condition, or 30+. We include comprehensive blood work and physician monitoring in every program.",
  },
  {
    question: "How soon will I see results?",
    answer:
      "It depends on the treatment. HydraFacial gives an immediate glow. Botox takes 3-7 days to show full effect. RF microneedling results build over 3-6 months as collagen regenerates. During your consultation, we'll set realistic expectations for your specific treatment plan.",
  },
  {
    question: "Do you accept insurance or HSA/FSA?",
    answer:
      "While most aesthetic treatments are not covered by insurance, we do accept HSA and FSA cards for eligible medical wellness services. We also offer flexible financing options to make treatments accessible.",
  },
  {
    question: "What are your hours and do I need an appointment?",
    answer:
      "We're open 7 days a week, Monday through Sunday, 10 AM to 7 PM. While appointments are recommended to ensure availability, we do our best to accommodate walk-ins when possible. Book online or call us at (425) 539-4440.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* AI Citation Optimized Schema — Organization, LocalBusiness, WebSite */}
      <HomepageSchema />
      {/* Speakable, Reviews, FAQ, ServiceList schemas for AI citation */}
      <AICitationSchemas reviews={reviews} faqs={homepageFaqs} />

      {/* 1. Hero Section — LCP element, eagerly loaded with priority image */}
      <Hero
        label="PHYSICIAN-SUPERVISED MEDSPA IN RENTON · SERVING ALL OF KING COUNTY"
        title="Your Skin. Your Wellness. Our Expertise."
        subtitle="Advanced aesthetic treatments and medical wellness programs under the supervision of Dr. Alexander Landfield, Board-Certified Neurologist. Safe for all skin types."
        primaryCTA={{ text: "Book a Consultation", href: "#consultation" }}
        secondaryCTA={{ text: "Free Phone Consult", href: clinicInfo.phoneTel }}
        badges={[
          "Board-Certified Neurologist Oversight",
          "Open 7 Days a Week",
          "All Skin Types Welcome",
        ]}
        backgroundImage="/images/hero/hero-aesthetic.jpg"
        backgroundOverlay={60}
        stats={[
          { value: "4.9", label: "Google Rating" },
          { value: "127+", label: "5-Star Reviews" },
          { value: "7", label: "Days Open" },
          { value: "13K+", label: "Treatments Performed" },
        ]}
        dark
        fullHeight
      />

      {/* 2. Trust Logos Bar */}
      <TrustLogosBar />

      {/* 3. Trust Signals Bar */}
      <TrustBar />

      {/* 4. Service Category Panels */}
      <ServiceCategoryPanels />

      {/* 5. Services Overview */}
      <HomeServicesOverview />

      {/* 6. Meet The Founders */}
      <MeetTheTeam />

      {/* 7. What to Expect */}
      <ProcessSteps />

      {/* 8. Dr. Landfield Introduction */}
      <DoctorIntro />

      {/* 9. Why Rani Section */}
      <WhyRaniCards />

      {/* 10. Before & After Slider */}
      <BeforeAfterSlider />

      {/* 11. Reviews/Testimonials */}
      <ReviewCarousel reviews={reviews} />

      {/* 12. Why Rani — Comparison Strip */}
      <WhyRaniComparison />

      {/* 13. Before & After Gallery */}
      <BeforeAfterGallery />

      {/* 14. Popular Packages */}
      <PopularPackages />

      {/* 15. Treatment Quiz */}
      <TreatmentQuiz />

      {/* 16. Blog Teaser */}
      <BlogTeaser posts={blogPosts} />

      {/* 17. Consultation Embed */}
      <ConsultationEmbed />

      {/* 18. FAQ Section */}
      <FAQ />

      {/* 19. CTA Banner */}
      <CTABanner />

      {/* 20. Map & Location */}
      <MapSection />
    </>
  );
}
