"use client";

import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import ServiceCard from "@/components/services/ServiceCard";
import CTABanner from "@/components/sections/CTABanner";
import { clinicInfo } from "@/data/clinic-info";

const services = [
  {
    title: "Laser Hair Removal",
    description: "Pain-free treatments with the Candela GentleMax Pro Plus. Safe for all skin types and tones.",
    icon: "Zap",
    href: "/services/laser-hair-removal",
  },
  {
    title: "HydraFacial MD",
    description: "Deep cleanse, extract, and hydrate in one session. Immediate glow with zero downtime.",
    icon: "Droplets",
    href: "/services/hydrafacial",
  },
  {
    title: "RF Microneedling",
    description: "Cutera Secret Pro combines microneedling with radiofrequency for collagen stimulation.",
    icon: "Sparkles",
    href: "/services/rf-microneedling",
  },
  {
    title: "BioRePeel",
    description: "Innovative bi-phasic peel with TCA 35% for brighter, smoother skin. Zero downtime.",
    icon: "FlaskConical",
    href: "/services/biorepeel",
  },
  {
    title: "Botox & Dysport",
    description: "Neurologist-supervised neurotoxin injections for natural, refreshed results.",
    icon: "Syringe",
    href: "/services/botox-dysport",
  },
  {
    title: "Dermal Fillers",
    description: "FDA-approved hyaluronic acid fillers for natural volume restoration and facial contouring.",
    icon: "Heart",
    href: "/services/dermal-fillers",
  },
  {
    title: "Red Light Therapy",
    description: "Full body red light therapy for collagen production, inflammation reduction, and recovery.",
    icon: "Sun",
    href: "/services/red-light-therapy",
  },
  {
    title: "Laser Acne Facial",
    description: "Clinical-grade laser technology to target active acne, bacteria, and scarring.",
    icon: "ScanFace",
    href: "/services/laser-acne-facial",
  },
  {
    title: "Chemical Peels",
    description: "Medical-grade peels from light to deep for acne, hyperpigmentation, and anti-aging.",
    icon: "Layers",
    href: "/services/chemical-peels",
  },
  {
    title: "AI Skin Analysis",
    description: "Advanced AI-powered imaging to identify concerns and create your personalized treatment plan.",
    icon: "Brain",
    href: "/services/ai-skin-analysis",
  },
  {
    title: "Sofwave",
    description: "Non-invasive ultrasound skin tightening and lifting. Stimulates collagen for a naturally firmer appearance.",
    icon: "Waves",
    href: "/services/sofwave",
  },
  {
    title: "Scar Reduction",
    description: "Advanced laser and RF microneedling to reduce acne scars, surgical scars, and stretch marks.",
    icon: "Eraser",
    href: "/services/scar-reduction",
  },
];

export default function ServicesPage() {
  return (
    <>
      <Hero
        label="AESTHETIC SERVICES"
        title="Advanced Aesthetic Treatments"
        subtitle="Every treatment at Rani Beauty Clinic is performed under physician supervision using industry-leading technology for safe, effective results."
        primaryCTA={{ text: "Book a Consultation", href: clinicInfo.booking.url }}
        dark
      />

      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR TREATMENTS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Aesthetic Services
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-center font-body text-base text-rani-muted">
              From laser hair removal to advanced skin rejuvenation, our aesthetic treatments
              are designed to enhance your natural beauty with precision and care.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </StaggerChildren>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
