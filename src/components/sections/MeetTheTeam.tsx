"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";

export default function MeetTheTeam() {
  return (
    <section className="bg-rani-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Images - Real photos of the founders */}
          <FadeInOnScroll direction="left">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <Image
                  src="/images/team/co-founder.jpg"
                  alt="Rani Beauty Clinic Co-Founder"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-xl">
                <Image
                  src="/images/team/raj.jpg"
                  alt="Raj - Co-Founder of Rani Beauty Clinic"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </div>
          </FadeInOnScroll>

          {/* Text content */}
          <FadeInOnScroll direction="right">
            <div>
              <SectionLabel label="MEET THE FOUNDERS" className="!items-start" />
              <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                World-Trained &amp; Renowned Providers
              </h2>
              <p className="mt-6 font-body text-base leading-relaxed text-rani-text">
                After training in many different dermatology clinics in Los
                Angeles, Dubai and Korea, the founders are bringing the best of
                everything they learned to the Greater Seattle &amp; Bellevue
                area. Their vision was simple: combine world-class aesthetic
                techniques with genuine, personalized care.
              </p>
              <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                At Rani Beauty Clinic, every treatment plan is customized to your
                unique anatomy, skin type, and personal goals. Whether
                you&apos;re looking for a subtle refresh or a complete
                transformation, our expert team is here to
                guide you every step of the way.
              </p>

              {/* Key highlights */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { value: "3+", label: "Countries Trained In" },
                  { value: "7", label: "Days Open Per Week" },
                  { value: "127+", label: "5-Star Reviews" },
                  { value: "2022", label: "Established" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-white p-4 text-center shadow-sm"
                  >
                    <p className="font-heading text-2xl font-bold text-rani-gold">
                      {stat.value}
                    </p>
                    <p className="mt-1 font-body text-xs text-rani-muted">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  href={clinicInfo.booking.url}
                  className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                >
                  Book a Consultation
                </Button>
                <Button variant="ghost" href="/about">
                  Our Story
                </Button>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
