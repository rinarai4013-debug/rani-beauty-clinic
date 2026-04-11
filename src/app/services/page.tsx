"use client";

import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import ServiceCard from "@/components/services/ServiceCard";
import CTABanner from "@/components/sections/CTABanner";
import BookingCTA from "@/components/conversion/BookingCTA";
import { clinicInfo } from "@/data/clinic-info";
import { serviceImages } from "@/data/service-images";

const faceSkinServices = [
  {
    title: "HydraFacial MD",
    description: "Deep cleanse, extract, and hydrate in one session. Immediate glow with zero downtime.",
    icon: "Droplets",
    href: "/services/hydrafacial",
    image: serviceImages["hydrafacial"]?.image,
    hoverImage: serviceImages["hydrafacial"]?.hoverImage,
  },
  {
    title: "Chemical Peels",
    description: "Medical-grade peels from light to deep for acne, hyperpigmentation, and anti-aging.",
    icon: "Layers",
    href: "/services/chemical-peels",
    image: serviceImages["chemical-peels"]?.image,
    hoverImage: serviceImages["chemical-peels"]?.hoverImage,
  },
  {
    title: "BioRePeel",
    description: "Innovative bi-phasic peel with TCA 35% for brighter, smoother skin. Zero downtime.",
    icon: "FlaskConical",
    href: "/services/biorepeel",
    image: serviceImages["biorepeel"]?.image,
    hoverImage: serviceImages["biorepeel"]?.hoverImage,
  },
  {
    title: "Laser Acne Facial",
    description: "Clinical-grade laser technology to target active acne, bacteria, and scarring.",
    icon: "ScanFace",
    href: "/services/laser-acne-facial",
    image: serviceImages["laser-acne-facial"]?.image,
    hoverImage: serviceImages["laser-acne-facial"]?.hoverImage,
  },
  {
    title: "AI Skin Analysis",
    description: "Advanced AI-powered imaging to identify concerns and create your personalized treatment plan.",
    icon: "Brain",
    href: "/services/ai-skin-analysis",
    image: serviceImages["ai-skin-analysis"]?.image,
    hoverImage: serviceImages["ai-skin-analysis"]?.hoverImage,
  },
  {
    title: "Red Light Therapy",
    description: "Full body red light therapy for collagen production, inflammation reduction, and recovery.",
    icon: "Sun",
    href: "/services/red-light-therapy",
    image: serviceImages["red-light-therapy"]?.image,
    hoverImage: serviceImages["red-light-therapy"]?.hoverImage,
  },
];

const injectableServices = [
  {
    title: "Botox & Dysport",
    description: "Neurologist-supervised neurotoxin injections for natural, refreshed results.",
    icon: "Syringe",
    href: "/services/botox-dysport",
    image: serviceImages["botox-dysport"]?.image,
    hoverImage: serviceImages["botox-dysport"]?.hoverImage,
  },
  {
    title: "Dermal Fillers",
    description: "FDA-approved hyaluronic acid fillers for natural volume restoration and facial contouring.",
    icon: "Heart",
    href: "/services/dermal-fillers",
    image: serviceImages["dermal-fillers"]?.image,
    hoverImage: serviceImages["dermal-fillers"]?.hoverImage,
  },
];

const bodyLaserServices = [
  {
    title: "Laser Hair Removal",
    description: "Pain-free treatments with the Candela GentleMax Pro Plus. Safe for all skin types and tones.",
    icon: "Zap",
    href: "/services/laser-hair-removal",
    image: serviceImages["laser-hair-removal"]?.image,
    hoverImage: serviceImages["laser-hair-removal"]?.hoverImage,
  },
  {
    title: "RF Microneedling",
    description: "Cutera Secret Pro combines microneedling with radiofrequency for collagen stimulation.",
    icon: "Sparkles",
    href: "/services/rf-microneedling",
    image: serviceImages["rf-microneedling"]?.image,
    hoverImage: serviceImages["rf-microneedling"]?.hoverImage,
  },
  {
    title: "Sofwave",
    description: "Non-invasive ultrasound skin tightening and lifting. Stimulates collagen for a naturally firmer appearance.",
    icon: "Waves",
    href: "/services/sofwave",
    image: serviceImages["sofwave"]?.image,
    hoverImage: serviceImages["sofwave"]?.hoverImage,
  },
  {
    title: "Scar Reduction",
    description: "Advanced laser and RF microneedling to reduce acne scars, surgical scars, and stretch marks.",
    icon: "Eraser",
    href: "/services/scar-reduction",
    image: serviceImages["scar-reduction"]?.image,
    hoverImage: serviceImages["scar-reduction"]?.hoverImage,
  },
];

const wellnessServices = [
  {
    title: "GLP-1 Weight Management",
    description: "Physician-supervised semaglutide and tirzepatide programs for sustainable weight loss.",
    icon: "Scale",
    href: "/wellness/glp1-weight-management",
    image: serviceImages["glp1-weight-management"]?.image,
    hoverImage: serviceImages["glp1-weight-management"]?.hoverImage,
  },
  {
    title: "NAD+ Injections",
    description: "Cellular energy restoration for anti-aging, mental clarity, and recovery.",
    icon: "Atom",
    href: "/wellness/nad-injections",
    image: serviceImages["nad-injections"]?.image,
    hoverImage: serviceImages["nad-injections"]?.hoverImage,
  },
  {
    title: "Vitamin Injections",
    description: "B12, Vitamin D3, Tri-Immune, and Glutathione injections for energy and immune support.",
    icon: "Pill",
    href: "/wellness/vitamin-injections",
    image: serviceImages["vitamin-injections"]?.image,
    hoverImage: serviceImages["vitamin-injections"]?.hoverImage,
  },
  {
    title: "Hormone Therapy",
    description: "Physician-supervised hormone optimization for women and men through our telehealth program.",
    icon: "Activity",
    href: "/wellness/hormone-therapy",
    image: serviceImages["hormone-therapy"]?.image,
    hoverImage: serviceImages["hormone-therapy"]?.hoverImage,
  },
  {
    title: "Blood Work",
    description: "Comprehensive in-house lab panels to guide your personalized treatment plan.",
    icon: "TestTube",
    href: "/wellness/blood-work",
    image: serviceImages["blood-work"]?.image,
    hoverImage: serviceImages["blood-work"]?.hoverImage,
  },
];

interface ServiceSectionProps {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  services: typeof faceSkinServices;
  bg?: "white" | "cream" | "navy";
}

function ServiceSection({ id, label, title, subtitle, services, bg = "cream" }: ServiceSectionProps) {
  const bgClass = bg === "white" ? "bg-white" : bg === "navy" ? "bg-rani-navy" : "bg-rani-cream";
  const textClass = bg === "navy" ? "text-white" : "text-rani-navy";
  const mutedClass = bg === "navy" ? "text-white/70" : "text-rani-muted";

  return (
    <section id={id} className={`${bgClass} py-20 md:py-28`}>
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label={label} />
          <h2 className={`mt-6 text-center font-body text-3xl font-bold ${textClass} md:text-4xl`}>
            {title}
          </h2>
          <p className={`mt-4 mx-auto max-w-2xl text-center font-body text-base ${mutedClass}`}>
            {subtitle}
          </p>
        </FadeInOnScroll>

        <StaggerChildren className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.href} {...service} />
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

const categories = [
  { id: "face-skin", label: "Face & Skin" },
  { id: "injectables", label: "Injectables" },
  { id: "body-laser", label: "Body & Laser" },
  { id: "wellness", label: "Medical Wellness" },
];

export default function ServicesPage() {
  return (
    <>
      <Hero
        label="OUR TREATMENTS"
        title="Advanced Aesthetics & Medical Wellness"
        subtitle="From skin rejuvenation to physician-supervised wellness. Every treatment at Rani is designed to help you look refreshed, feel confident, and take the right next step with clarity."
        primaryCTA={{ text: "Book Your Consultation", href: clinicInfo.booking.url, target: "_blank" }}
        backgroundImage="/images/services/hydrafacial/2.webp"
        backgroundOverlay={70}
        dark
      />

      {/* Category Navigation */}
      <nav className="sticky top-0 z-30 border-b border-rani-gold/20 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-4 md:gap-6">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="whitespace-nowrap rounded-full border border-rani-gold/20 px-4 py-2 font-body text-xs font-semibold uppercase tracking-wide text-rani-navy transition-all hover:border-rani-gold hover:bg-rani-cream md:text-sm"
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <ServiceSection
        id="face-skin"
        label="FACE & SKIN"
        title="Skin Rejuvenation & Facials"
        subtitle="Medical-grade facials and peels designed to restore clarity, texture, and radiance. Results you can see after a single session."
        services={faceSkinServices}
        bg="white"
      />

      <ServiceSection
        id="injectables"
        label="INJECTABLES"
        title="Neurotoxins & Dermal Fillers"
        subtitle="Every injectable treatment is performed under the supervision of our board-certified neurologist. Precise, natural-looking results."
        services={injectableServices}
        bg="cream"
      />

      <ServiceSection
        id="body-laser"
        label="BODY & LASER"
        title="Laser Treatments & Body Contouring"
        subtitle="Advanced laser technology and RF energy for hair removal, skin tightening, and scar revision. Safe for all skin types."
        services={bodyLaserServices}
        bg="white"
      />

      <ServiceSection
        id="wellness"
        label="MEDICAL WELLNESS"
        title="Physician-Supervised Wellness Programs"
        subtitle="From GLP-1 weight management to hormone therapy and wellness injections. Our medical programs are designed to optimize how you feel, not just how you look."
        services={wellnessServices}
        bg="cream"
      />

      {/* Not Sure Where to Start? */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeInOnScroll>
            <h2 className="font-heading text-2xl font-bold text-rani-navy md:text-3xl">
              Not Sure Where to Start?
            </h2>
            <p className="mt-4 font-body text-base text-rani-muted">
              Take our 2-minute treatment quiz and get a personalized recommendation
              based on your goals and concerns.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="/quiz"
                className="inline-flex items-center justify-center rounded-lg border-2 border-rani-navy bg-rani-navy px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-rani-navy/90"
              >
                Take the Quiz
              </a>
              <a
                href={clinicInfo.phoneTel}
                className="inline-flex items-center justify-center rounded-lg border-2 border-rani-gold/30 px-6 py-3 font-body text-sm font-semibold text-rani-navy transition-all hover:border-rani-gold"
              >
                Call {clinicInfo.phone}
              </a>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <CTABanner
        title="Ready to Begin?"
        subtitle="Book your consultation and let us design a treatment plan around your goals. Your $150 consultation fee is applied as a credit toward your first treatment."
      />
    </>
  );
}
