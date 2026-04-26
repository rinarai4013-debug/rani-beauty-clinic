"use client";

import dynamic from "next/dynamic";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

// Lazy-load the wizard to keep initial page bundle small
const ConsultationWizard = dynamic(
  () => import("@/components/consultation/ConsultationWizard"),
  {
    loading: () => (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C9A96E] border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

export default function ConsultationEmbed() {
  return (
    <section className="bg-rani-cream py-16 md:py-20" id="consultation">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll direction="up">
          <div className="text-center mb-10">
            <SectionLabel label="CONSULTATION" />
            <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
              Start Your Glow Journey
            </h2>
            <p className="mt-4 max-w-2xl mx-auto font-body text-base leading-relaxed text-rani-text">
              Take 3 minutes to tell us about your goals. We&apos;ll craft a
              personalized treatment roadmap just for you, then help you book
              the right next step with any required deposit credited toward treatment.
            </p>
          </div>
        </FadeInOnScroll>

        <ConsultationWizard />
      </div>
    </section>
  );
}
