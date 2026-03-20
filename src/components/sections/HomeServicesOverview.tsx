"use client";

import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import ServiceCard from "@/components/services/ServiceCard";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { serviceImages } from "@/data/service-images";

const aestheticServices = [
  {
    title: "Laser Hair Removal",
    description:
      "Pain-free treatments with the Candela GentleMax Pro Plus. Safe for all skin types.",
    icon: "Zap" as const,
    href: "/services/laser-hair-removal",
    image: serviceImages["laser-hair-removal"]?.image,
    hoverImage: serviceImages["laser-hair-removal"]?.hoverImage,
  },
  {
    title: "HydraFacial MD",
    description:
      "Deep cleanse, extract, and hydrate in one session. Immediate glow, zero downtime.",
    icon: "Droplets" as const,
    href: "/services/hydrafacial",
    image: serviceImages["hydrafacial"]?.image,
    hoverImage: serviceImages["hydrafacial"]?.hoverImage,
  },
  {
    title: "RF Microneedling",
    description:
      "Cutera Secret Pro collagen stimulation for tighter, smoother skin.",
    icon: "Sparkles" as const,
    href: "/services/rf-microneedling",
    image: serviceImages["rf-microneedling"]?.image,
    hoverImage: serviceImages["rf-microneedling"]?.hoverImage,
  },
  {
    title: "Botox & Dysport",
    description:
      "Neurologist-supervised injections for natural, refreshed results.",
    icon: "Syringe" as const,
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
    icon: "Scale" as const,
    href: "/wellness/glp1-weight-management",
    image: serviceImages["glp1-weight-management"]?.image,
    hoverImage: serviceImages["glp1-weight-management"]?.hoverImage,
  },
  {
    title: "Hormone Therapy",
    description:
      "Bioidentical HRT for men and women. Comprehensive blood panels included.",
    icon: "Activity" as const,
    href: "/wellness/hormone-therapy",
    image: serviceImages["hormone-therapy"]?.image,
    hoverImage: serviceImages["hormone-therapy"]?.hoverImage,
  },
  {
    title: "NAD+ Injections",
    description:
      "Boost cellular energy, brain function, and recovery with quick subcutaneous injections.",
    icon: "Brain" as const,
    href: "/wellness/nad-injections",
    image: serviceImages["nad-injections"]?.image,
    hoverImage: serviceImages["nad-injections"]?.hoverImage,
  },
];

export default function HomeServicesOverview() {
  return (
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
  );
}
