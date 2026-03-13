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
import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import ServiceCard from "@/components/services/ServiceCard";
import CTABanner from "@/components/sections/CTABanner";
import MapSection from "@/components/sections/MapSection";
import ReviewCarousel from "@/components/sections/ReviewCarousel";
import BlogTeaser from "@/components/sections/BlogTeaser";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";

const aestheticServices = [
  {
    title: "Laser Hair Removal",
    description:
      "Pain-free treatments with the Candela GentleMax Pro Plus. Safe for all skin types.",
    icon: "Zap",
    href: "/services/laser-hair-removal",
  },
  {
    title: "HydraFacial MD",
    description:
      "Deep cleanse, extract, and hydrate in one session. Immediate glow, zero downtime.",
    icon: "Droplets",
    href: "/services/hydrafacial",
  },
  {
    title: "RF Microneedling",
    description:
      "Cutera Secret Pro collagen stimulation for tighter, smoother skin.",
    icon: "Sparkles",
    href: "/services/rf-microneedling",
  },
  {
    title: "Botox & Fillers",
    description:
      "Neurologist-supervised injections for natural, refreshed results.",
    icon: "Syringe",
    href: "/services/botox-dysport",
  },
];

const wellnessServices = [
  {
    title: "GLP-1 Weight Management",
    description:
      "Physician-supervised Semaglutide and Tirzepatide programs with in-house blood work.",
    icon: "Scale",
    href: "/wellness/glp1-weight-management",
  },
  {
    title: "Hormone Therapy",
    description:
      "Bioidentical HRT for men and women. Comprehensive blood panels included.",
    icon: "Activity",
    href: "/wellness/hormone-therapy",
  },
  {
    title: "NAD+ Injections",
    description:
      "Boost cellular energy, brain function, and recovery with quick subcutaneous injections.",
    icon: "Brain",
    href: "/wellness/nad-injections",
  },
  {
    title: "Peptide Therapy",
    description:
      "BPC-157, CJC-1295 and more for recovery, anti-aging, and performance.",
    icon: "Pill",
    href: "/wellness/peptide-therapy",
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
  image: "https://ranibeautyclinic.com/images/logo/logo-horizontal.png",
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
  founder: { "@type": "Person", name: "Rina" },
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

      {/* 1. Hero Section */}
      <Hero
        label="PHYSICIAN-SUPERVISED MEDSPA & WELLNESS"
        title="Your Skin. Your Wellness. Our Expertise."
        subtitle="Advanced aesthetic treatments and medical wellness programs under the supervision of Dr. Alexander Landfield, Board-Certified Neurologist"
        primaryCTA={{ text: "Book a Consultation", href: "/contact" }}
        secondaryCTA={{ text: "Explore Services", href: "/services" }}
        badges={[
          "Open 7 Days",
          "Woman-Owned",
          "HSA Accepted",
          "Pain-Free Treatments",
        ]}
        dark
        fullHeight
      />

      {/* 2. Services Overview */}
      <section className="bg-rani-cream py-20 md:py-28">
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

      {/* 3. Dr. Landfield Introduction */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-rani-gold/30 bg-rani-navy-light">
                    <span className="font-heading text-3xl text-rani-gold">
                      AL
                    </span>
                  </div>
                  <p className="mt-4 font-body text-sm text-gray-400">
                    Photo coming soon
                  </p>
                </div>
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

      {/* 4. Why Rani Section */}
      <section className="bg-rani-cream py-20 md:py-28">
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

      {/* 5. Results Teaser */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="TRANSFORMATIONS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Real Patients. Real Results.
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <FadeInOnScroll key={i} delay={i * 0.1}>
                <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center">
                  <div className="text-center px-4">
                    <span className="font-heading text-3xl text-rani-gold/10">
                      R
                    </span>
                    <p className="mt-2 font-body text-xs text-gray-400">
                      Before &amp; After coming soon
                    </p>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>

          <FadeInOnScroll delay={0.3}>
            <div className="mt-10 text-center">
              <Button variant="ghost" href="/results">
                View Full Gallery
              </Button>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* 6. Reviews/Testimonials */}
      <ReviewCarousel reviews={reviews} />

      {/* 7. Blog Teaser */}
      <BlogTeaser posts={blogPosts} />

      {/* 8. CTA Banner */}
      <CTABanner />

      {/* 9. Map & Location */}
      <MapSection />
    </>
  );
}
