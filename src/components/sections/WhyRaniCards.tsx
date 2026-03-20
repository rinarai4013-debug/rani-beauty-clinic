"use client";

import { motion } from "framer-motion";
import { Brain, Zap, Heart, Clock } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import SectionLabel from "@/components/ui/SectionLabel";

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

export default function WhyRaniCards() {
  return (
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
  );
}
