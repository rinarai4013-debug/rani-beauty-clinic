"use client";

import Image from "next/image";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

export default function CredibilitySection() {
  return (
    <section className="bg-rani-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Block 1: Founders - photo left, text right */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeInOnScroll direction="left">
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0 overflow-hidden rounded-xl">
              <Image
                src="/images/team/co-founder.jpg"
                alt="Rani Beauty Clinic Founder"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 80vw, 40vw"
              />
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll direction="right">
            <div>
              <SectionLabel label="OUR STORY" className="!items-start" />
              <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                Founded on Clinical Obsession. Sustained by Real Results.
              </h2>
              <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-rani-text">
                After training at top aesthetic clinics in Los Angeles, Dubai,
                and Seoul, our founder brought the best of everything she
                learned to King County. The vision: combine world-class
                techniques with genuine, personalized care.
              </p>
              <p className="mt-4 max-w-lg font-body text-base leading-relaxed text-rani-muted">
                Every treatment plan is customized to your unique anatomy, skin
                type, and personal goals.
              </p>
              <div className="mt-8">
                <Button variant="ghost" href="/about">
                  Meet Our Team
                </Button>
              </div>
            </div>
          </FadeInOnScroll>
        </div>

        {/* Divider */}
        <div className="my-16 flex justify-center">
          <div className="h-px w-24 bg-rani-gold/30" />
        </div>

        {/* Block 2: Doctor - text left, photo right */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeInOnScroll direction="left">
            <div className="lg:order-first">
              <SectionLabel
                label="MEDICAL DIRECTOR"
                className="!items-start"
              />
              <h2 className="mt-6 font-heading text-2xl font-bold text-rani-navy md:text-3xl leading-snug">
                Every Treatment Designed Under the Oversight of a Board-Certified
                Neurologist
              </h2>
              <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-rani-text">
                Dr. Alexander Landfield&apos;s neuroscience expertise means more
                precise injections, safer treatments, and results that work with
                your body&apos;s natural systems.
              </p>
              <div className="mt-8">
                <Button variant="ghost" href="/team/dr-landfield">
                  Meet Dr. Landfield
                </Button>
              </div>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll direction="right">
            <div className="relative aspect-[4/5] max-w-md mx-auto lg:mx-0 lg:ml-auto overflow-hidden rounded-xl">
              <Image
                src="/images/team/dr-landfield.webp"
                alt="Dr. Alexander Landfield - Board-Certified Neurologist & Medical Director"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 80vw, 40vw"
              />
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
