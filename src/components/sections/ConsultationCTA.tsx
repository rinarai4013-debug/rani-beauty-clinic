"use client";

import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";

export default function ConsultationCTA() {
  return (
    <section className="relative bg-rani-navy py-16 md:py-36 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-rani-navy via-rani-navy-light/20 to-rani-navy opacity-50" />

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <FadeInOnScroll>
          <SectionLabel label="YOUR NEXT STEP" dark />

          <h2 className="mt-6 font-heading text-3xl font-bold text-white md:text-4xl lg:text-5xl leading-tight">
            Ready to See What&apos;s Possible?
          </h2>

          <p className="mx-auto mt-6 max-w-lg font-body text-base leading-relaxed text-gray-300">
            In a private consultation with our clinical team, we assess your skin,
            listen to your goals, and design a protocol built specifically for you.
            No pressure. Just clarity.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              href={clinicInfo.booking.url}
              target="_blank"
              className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light w-full sm:w-auto"
            >
              Book Your Consultation
            </Button>
            <a
              href={clinicInfo.phoneTel}
              className="font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-gold-light"
            >
              Call {clinicInfo.phone}
            </a>
          </div>

          <p className="mt-6 font-body text-sm text-gray-400">
            Your $150 consultation deposit applies entirely toward your first
            treatment.
          </p>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
