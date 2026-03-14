"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Heart,
  Clock,
  Syringe,
  Droplets,
  Sparkles,
  Scale,
  Activity,
  Pill,
} from "lucide-react";
import Image from "next/image";
import Hero from "@/components/sections/Hero";
import TrustLogosBar from "@/components/sections/TrustLogosBar";
import ServiceCategoryPanels from "@/components/sections/ServiceCategoryPanels";
import MeetTheTeam from "@/components/sections/MeetTheTeam";
import BeforeAfterSlider from "@/components/sections/BeforeAfterSlider";
import TreatmentQuiz from "@/components/sections/TreatmentQuiz";
import ConsultationEmbed from "@/components/sections/ConsultationEmbed";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import ServiceCard from "@/components/services/ServiceCard";
import CTABanner from "@/components/sections/CTABanner";
import MapSection from "@/components/sections/MapSection";
import ReviewCarousel from "@/components/sections/ReviewCarousel";
import BlogTeaser from "@/components/sections/BlogTeaser";
import FAQ from "@/components/sections/FAQ";
import PopularPackages from "@/components/sections/PopularPackages";
import ProcessSteps from "@/components/sections/ProcessSteps";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { serviceImages } from "@/data/service-images";

const aestheticServices = [
  {
    title: "Laser Hair Removal",
    description:
      "Pain-free treatments with the Candela GentleMax Pro Plus. Safe for all skin types.",
    icon: "Zap",
    href: "/services/laser-hair-removal",
    image: serviceImages["laser-hair-removal"]?.image,
    hoverImage: serviceImages["laser-hair-removal"]?.hoverImage,
  },
  {
    title: "HydraFacial MD",
    description:
      "Deep cleanse, extract, and hydrate in one session. Immediate glow, zero downtime.",
    icon: "Droplets",
    href: "/services/hydrafacial",
    image: serviceImages["hydrafacial"]?.image,
    hoverImage: serviceImages["hydrafacial"]?.hoverImage,
  },
  {
    title: "RF Microneedling",
    description:
      "Cutera Secret Pro collagen stimulation for tighter, smoother skin.",
    icon: "Sparkles",
    href: "/services/rf-microneedling",
    image: serviceImages["rf-microneedling"]?.image,
    hoverImage: serviceImages["rf-microneedling"]?.hoverImage,
  },
  {
    title: "Botox & Dysport",
    description:
      "Neurologist-supervised injections for natural, refreshed results.",
    icon: "Syringe",
    href: "/services/botox-dysport",
    image: serviceImages["botox-dysport"]?.image,
    hoverImage: serviceImages["botox-dysport"]?.hoverImage,
  },
];

const wellnessServices = [
  {
    title: "GLP-1 Weight Management",
    description:
      "Physician-supervised Semaglutide and Tirzepatide programs with in-house blood work.",
    icon: "Scale",
    href: "/wellness/glp1-weight-management",
    image: serviceImages["glp1-weight-management"]?.image,
    hoverImage: serviceImages["glp1-weight-management"]?.hoverImage,
  },
  {
    title: "Hormone Therapy",
    description:
      "Bioidentical HRT for men and women. Comprehensive blood panels included.",
    icon: "Activity",
    href: "/wellness/hormone-therapy",
    image: serviceImages["hormone-therapy"]?.image,
    hoverImage: serviceImages["hormone-therapy"]?.hoverImage,
  },
  {
    title: "NAD+ Injections",
    description:
      "Boost cellular energy, brain function, and recovery with quick subcutaneous injections.",
    icon: "Brain",
    href: "/wellness/nad-injections",
    image: serviceImages["nad-injections"]?.image,
    hoverImage: serviceImages["nad-injections"]?.hoverImage,
  },
  {
    title: "Peptide Therapy",
    description:
      "BPC-157, CJC-1295 and more for recovery, anti-aging, and performance.",
    icon: "Pill",
    href: "/wellness/peptide-therapy",
    image: serviceImages["peptide-therapy"]?.image,
    hoverImage: serviceImages["peptide-therapy"]?.hoverImage,
  },
];

const whyRani = [
  {
    icon: Brain,
    title: "Neurologist-Led",
    description: "Medical director oversight on all treatments",
  },
  {
    icon: Zap,
    title: "Proven Technology",
    description: "Candela GentleMax Pro Plus & Cutera Secret Pro",
  },
  {
    icon: Heart,
    title: "Full Spectrum",
    description: "Aesthetics + medical wellness under one roof",
  },
  {
    icon: Clock,
    title: "Open 7 Days",
    description: "Convenient scheduling for every lifestyle",
  },
];

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
    text: "Started the peptide therapy program here and the difference in my energy and recovery is remarkable. The in-house blood work makes it so easy to track progress. This is what modern wellness should feel like.",
    treatment: "Peptide Therapy",
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

const structuredData = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "Rani Beauty Clinic",
  image: "https://ranibeautyclinic.com/images/logo/logo-dark.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "401 Olympia Ave NE, Suite 101",
    addressLocality: "Renton",
    addressRegion: "WA",
    postalCode: "98056",
    addressCountry: "US",
  },
  telephone: "+14255394440",
  url: "https://ranibeautyclinic.com",
  openingHoursSpecification: {
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
  priceRange: "$$$",
  founder: { "@type": "Person", name: "Raj" },
  employee: {
    "@type": "Physician",
    name: "Dr. Alexander Landfield",
    medicalSpecialty: "Neurology",
    jobTitle: "Medical Director",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 47.4856,
    longitude: -122.2031,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
  areaServed: [
    { "@type": "City", name: "Renton" },
    { "@type": "City", name: "Bellevue" },
    { "@type": "City", name: "Kent" },
    { "@type": "City", name: "Tukwila" },
    { "@type": "City", name: "Newcastle" },
    { "@type": "City", name: "Mercer Island" },
    { "@type": "City", name: "Auburn" },
    { "@type": "City", name: "Federal Way" },
    { "@type": "City", name: "Kirkland" },
    { "@type": "City", name: "Redmond" },
    { "@type": "City", name: "Issaquah" },
    { "@type": "City", name: "Sammamish" },
    { "@type": "City", name: "Burien" },
    { "@type": "City", name: "SeaTac" },
    { "@type": "City", name: "Covington" },
    { "@type": "City", name: "Maple Valley" },
    { "@type": "City", name: "Des Moines" },
    { "@type": "City", name: "Woodinville" },
    { "@type": "City", name: "Bothell" },
    { "@type": "AdministrativeArea", name: "King County" },
    { "@type": "AdministrativeArea", name: "South Seattle" },
  ],
};

export default function HomePage() {
  return (
    <>
      <StructuredData data={structuredData} />

      {/* 1. Announcement Bar — now in Navbar */}

      {/* 2. Hero Section — with background image */}
      <Hero
        label="PHYSICIAN-SUPERVISED MEDSPA & WELLNESS"
        title="Your Skin. Your Wellness. Our Expertise."
        subtitle="Advanced aesthetic treatments and medical wellness programs under the supervision of Dr. Alexander Landfield, Board-Certified Neurologist"
        primaryCTA={{ text: "Book a Consultation", href: "#consultation" }}
        secondaryCTA={{ text: "Explore Services", href: "/services" }}
        backgroundImage="/images/hero/hero-aesthetic.jpg"
        backgroundOverlay={60}
        stats={[
          { value: "4.9", label: "Google Rating" },
          { value: "127+", label: "5-Star Reviews" },
          { value: "7", label: "Days Open" },
          { value: "25+", label: "Treatments" },
        ]}
        dark
        fullHeight
      />

      {/* 3. Trust Logos Bar */}
      <TrustLogosBar />

      {/* 4. Service Category Panels */}
      <ServiceCategoryPanels />

      {/* 5. Services Overview — With Images */}
      <section className="bg-rani-cream py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR SERVICES" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Treatments Tailored to You
            </h2>
          </FadeInOnScroll>

          {/* Aesthetic Services */}
          <div className="mt-12">
            <FadeInOnScroll>
              <h3 className="mb-6 text-center font-body text-xl font-semibold text-rani-navy">
                Aesthetic Services
              </h3>
            </FadeInOnScroll>
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {aestheticServices.map((service) => (
                <ServiceCard key={service.href} {...service} />
              ))}
            </StaggerChildren>
          </div>

          {/* Medical Wellness */}
          <div className="mt-16">
            <FadeInOnScroll>
              <h3 className="mb-6 text-center font-body text-xl font-semibold text-rani-navy">
                Medical Wellness
              </h3>
            </FadeInOnScroll>
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {wellnessServices.map((service) => (
                <ServiceCard key={service.href} {...service} />
              ))}
            </StaggerChildren>
          </div>

          <FadeInOnScroll delay={0.4}>
            <div className="mt-12 text-center">
              <Button href="/services" icon>
                View All Services
              </Button>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* 6. Meet The Founders — Real founder photos */}
      <MeetTheTeam />

      {/* 6b. What to Expect — Process Steps */}
      <ProcessSteps />

      {/* 7. Dr. Landfield Introduction */}
      <section className="bg-rani-cream py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-rani-cream to-white">
                <Image
                  src="/images/team/dr-landfield.webp"
                  alt="Dr. Alexander Landfield — Board-Certified Neurologist & Medical Director of Rani Beauty Clinic"
                  width={600}
                  height={750}
                  className="h-full w-full object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right">
              <div>
                <SectionLabel
                  label="MEDICAL EXPERTISE"
                  className="!items-start"
                />
                <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
                  Physician-Supervised Care
                </h2>
                <p className="mt-6 font-body text-base text-rani-text leading-relaxed">
                  Every medical treatment at Rani Beauty Clinic is performed under
                  the supervision of Dr. Alexander Landfield, a board-certified
                  neurologist. His expertise in neuroscience and muscle anatomy
                  brings a level of clinical precision that sets Rani apart.
                </p>
                <p className="mt-4 font-body text-base text-rani-text leading-relaxed">
                  From neurotoxin injections to hormone optimization, your safety
                  and results are in expert hands. Dr. Landfield&apos;s deep
                  understanding of the nervous system enables more precise
                  treatments and better outcomes for every patient.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge icon="shield">Board-Certified Neurologist</Badge>
                  <Badge icon="check">Medical Director</Badge>
                </div>
                <div className="mt-8">
                  <Button variant="ghost" href="/about">
                    Meet Dr. Landfield
                  </Button>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* 8. Why Rani Section */}
      <section className="bg-rani-cream py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="WHY CHOOSE US" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              The Rani Difference
            </h2>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyRani.map((item) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: "easeOut" },
                  },
                }}
                className="text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                  <item.icon size={28} className="text-rani-gold" />
                </div>
                <h3 className="mt-4 font-body text-lg font-bold text-rani-navy">
                  {item.title}
                </h3>
                <p className="mt-2 font-body text-sm text-rani-muted">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* 9. Before & After Slider — Real patient results */}
      <BeforeAfterSlider />

      {/* 10. Reviews/Testimonials */}
      <ReviewCarousel reviews={reviews} />

      {/* 10b. Popular Packages */}
      <PopularPackages />

      {/* 11. Treatment Quiz — Email Capture / Lead Magnet */}
      <TreatmentQuiz />

      {/* 12. Blog Teaser */}
      <BlogTeaser posts={blogPosts} />

      {/* 13. Consultation Embed — Typeform on-site */}
      <ConsultationEmbed />

      {/* 13b. FAQ Section */}
      <FAQ />

      {/* 14. CTA Banner */}
      <CTABanner />

      {/* 15. Map & Location */}
      <MapSection />
    </>
  );
}
