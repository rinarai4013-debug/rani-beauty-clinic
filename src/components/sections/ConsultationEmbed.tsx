"use client";

import { useEffect, useRef } from "react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Badge from "@/components/ui/Badge";

export default function ConsultationEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Typeform embed script
    const script = document.createElement("script");
    script.src = "//embed.typeform.com/next/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      const existingScript = document.querySelector(
        'script[src="//embed.typeform.com/next/embed.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <section className="bg-rani-cream py-20 md:py-28" id="consultation">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <FadeInOnScroll direction="left">
            <div>
              <SectionLabel label="FREE CONSULTATION" className="!items-start" />
              <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Book Your Complimentary Consultation
              </h2>
              <p className="mt-6 font-body text-base leading-relaxed text-rani-text">
                Every journey at Rani Beauty Clinic begins with a personalized
                consultation. Our team will assess your goals, recommend a
                customized treatment plan, and answer all your questions — all
                under the guidance of our board-certified Medical Director.
              </p>
              <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                Fill out the form and we will reach out within 24 hours to
                schedule your visit. Your consultation includes a full skin
                assessment and personalized treatment roadmap.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge icon="check">No Obligation</Badge>
                <Badge icon="shield">Physician-Supervised</Badge>
                <Badge icon="clock">Response Within 24 Hours</Badge>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Right: Typeform Embed */}
          <FadeInOnScroll direction="right">
            <div
              ref={containerRef}
              className="overflow-hidden rounded-xl border border-rani-gold/20 bg-white shadow-sm"
            >
              <div
                data-tf-widget="Ecgz85JA"
                data-tf-opacity="100"
                data-tf-inline-on-mobile
                data-tf-iframe-props="title=Consultation Request"
                style={{ width: "100%", height: "500px" }}
              />
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
