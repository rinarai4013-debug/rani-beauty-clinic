"use client";

import Image from "next/image";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function DoctorIntro() {
  return (
    <section className="bg-rani-cream py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeInOnScroll direction="left">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-rani-cream to-white">
              <Image
                src="/images/team/dr-landfield.webp"
                alt="Dr. Alexander Landfield - Board-Certified Neurologist & Medical Director of Rani Beauty Clinic"
                width={600}
                height={750}
                className="h-full w-full object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll direction="right">
            <div>
              <SectionLabel
                label="MEDICAL EXPERTISE"
                className="!items-start"
              />
              <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Physician-Supervised Care
              </h2>
              <p className="mt-6 font-body text-base text-rani-text leading-relaxed">
                Every medical treatment at Rani Beauty Clinic is performed under
                the supervision of Dr. Alexander Landfield, a board-certified
                neurologist. His expertise in neuroscience and muscle anatomy
                brings a level of clinical precision that sets Rani apart.
              </p>
              <p className="mt-4 font-body text-base text-rani-text leading-relaxed">
                From neurotoxin injections to hormone optimization, your safety
                and results are in expert hands. Dr. Landfield&apos;s deep
                understanding of the nervous system enables more precise
                treatments and better outcomes for every patient.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge icon="shield">Board-Certified Neurologist</Badge>
                <Badge icon="check">Medical Director</Badge>
              </div>
              <div className="mt-8">
                <Button variant="ghost" href="/about">
                  Meet Dr. Landfield
                </Button>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
