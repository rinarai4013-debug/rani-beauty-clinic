"use client";

import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";
import { trackCTAClick, trackPhoneClick } from "@/lib/analytics/events";

interface CTABannerProps {
  label?: string;
  title?: string;
  subtitle?: string;
}

export default function CTABanner({
  label = "TAKE THE NEXT STEP",
  title = "Ready to Start Your Transformation?",
  subtitle,
}: CTABannerProps) {
  return (
    <section className="relative bg-rani-navy py-16 md:py-20 overflow-hidden">
      {/* Decorative lotus watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <span className="font-heading text-[300px] text-rani-gold select-none">
          R
        </span>
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <FadeInOnScroll>
          <SectionLabel label={label} dark />
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.2}>
          <h2 className="mt-6 font-heading text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {title}
          </h2>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.4}>
          <p className="mt-4 font-body text-lg text-gray-300">
            {subtitle ||
              `Book your consultation today or call us at ${clinicInfo.phone}`}
          </p>
          <p className="mt-2 font-body text-sm text-gray-400">
            Free phone consultations available - or $150 deposit for in-person (applies to your treatment)
          </p>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.6}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              href={clinicInfo.consultation.url}
              className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
              onClick={() => trackCTAClick('Book Your Consultation', 'cta_banner', clinicInfo.consultation.url)}
            >
              Book Your Consultation
            </Button>
            <Button
              variant="secondary"
              href={clinicInfo.phoneTel}
              onClick={() => trackPhoneClick('cta_banner')}
            >
              Free Phone Consult
            </Button>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
