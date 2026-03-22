"use client";

import { motion } from "framer-motion";
import { MessageSquare, ClipboardCheck, Sparkles } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Consult",
    description:
      "We learn your goals, assess your skin, and run in-house labs if needed. Your $150 deposit applies toward treatment.",
  },
  {
    icon: ClipboardCheck,
    number: "02",
    title: "Customize",
    description:
      "Your treatment plan is designed for your unique anatomy, skin type, and goals — reviewed by our Medical Director.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Transform",
    description:
      "Experience visible results with ongoing support, progress tracking, and plan adjustments along the way.",
  },
];

export default function ProcessSteps() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="YOUR JOURNEY" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            Your Path to Results
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            From your first call to lasting results — here&apos;s how we take care
            of you.
          </p>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
          {steps.map((step, i) => (
            <FadeInOnScroll key={step.number} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-xl border border-rani-border bg-rani-cream/50 p-6 text-center transition-shadow duration-300 hover:shadow-md"
              >
                {/* Step number */}
                <span className="absolute -top-3 left-6 rounded-full bg-rani-gold px-3 py-0.5 font-body text-xs font-bold text-rani-navy">
                  {step.number}
                </span>

                <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-rani-navy">
                  <step.icon size={24} className="text-rani-gold" />
                </div>

                <h3 className="mt-4 font-body text-base font-bold text-rani-navy">
                  {step.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-rani-muted">
                  {step.description}
                </p>

                {/* Connector line (hidden on last item and mobile) */}
                {i < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden h-0.5 w-6 bg-rani-gold/30 lg:block" />
                )}
              </motion.div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
