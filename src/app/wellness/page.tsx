"use client";

import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import ServiceCard from "@/components/services/ServiceCard";
import CTABanner from "@/components/sections/CTABanner";
import Badge from "@/components/ui/Badge";
import { clinicInfo } from "@/data/clinic-info";

const services = [
  {
    title: "GLP-1 Weight Management",
    description: "Physician-supervised Semaglutide and Tirzepatide programs with in-house blood work and ongoing monitoring.",
    icon: "Scale",
    href: "/wellness/glp1-weight-management",
  },
  {
    title: "Peptide Therapy",
    description: "BPC-157, CJC-1295 and more for recovery, anti-aging, cognitive enhancement, and performance.",
    icon: "Pill",
    href: "/wellness/peptide-therapy",
  },
  {
    title: "NAD+ Injections",
    description: "Boost cellular energy, brain function, and recovery with quick subcutaneous NAD+ injections.",
    icon: "Brain",
    href: "/wellness/nad-injections",
  },
  {
    title: "Vitamin Injections",
    description: "B12, D3, Biotin, Glutathione, and Lipo-B injections for rapid absorption and results.",
    icon: "Syringe",
    href: "/wellness/vitamin-injections",
  },
  {
    title: "Hormone Therapy",
    description: "Bioidentical hormone replacement for men and women with comprehensive blood panel monitoring.",
    icon: "Activity",
    href: "/wellness/hormone-therapy",
  },
  {
    title: "Blood Work Services",
    description: "In-house blood draws by licensed professionals. Comprehensive panels reviewed by Dr. Landfield.",
    icon: "TestTube",
    href: "/wellness/blood-work",
  },
];

export default function WellnessPage() {
  return (
    <>
      <Hero
        label="MEDICAL WELLNESS"
        title="Medical Wellness Programs"
        subtitle="Comprehensive medical wellness programs designed and supervised by Dr. Alexander Landfield, Board-Certified Neurologist. Your health, optimized from the inside out."
        primaryCTA={{ text: "Book a Consultation", href: clinicInfo.booking.url }}
        dark
      />

      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR PROGRAMS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Medical Wellness Services
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-center font-body text-base text-rani-muted">
              Every medical wellness program at Rani begins with comprehensive blood work
              and a personalized treatment plan designed by our Medical Director.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Badge icon="shield">Physician-Supervised</Badge>
              <Badge icon="check">HSA Accepted</Badge>
              <Badge icon="check">In-House Blood Work</Badge>
              <Badge icon="check">Licensed Professionals</Badge>
            </div>
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
