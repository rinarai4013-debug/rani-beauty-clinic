"use client";

import { Shield, Target, Heart, Lightbulb, Cpu, Sparkles, ScanFace } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";
import { teamMembers } from "@/data/team";

const technologies = [
  {
    icon: Sparkles,
    name: "Candela GentleMax Pro Plus",
    description:
      "The gold standard in laser hair removal and skin rejuvenation. Dual-wavelength technology (Alexandrite 755nm & Nd:YAG 1064nm) treats all skin types safely and effectively with built-in Dynamic Cooling Device for pain-free treatments.",
  },
  {
    icon: Cpu,
    name: "Cutera Secret Pro",
    description:
      "Advanced RF microneedling system combining fractional CO2 laser with radiofrequency microneedling in one device. Stimulates collagen production for skin tightening, scar revision, and overall skin rejuvenation.",
  },
  {
    icon: ScanFace,
    name: "AI Skin Analysis",
    description:
      "State-of-the-art skin analysis technology that maps your skin's condition across multiple dimensions — including texture, pores, wrinkles, pigmentation, and UV damage — to create a personalized treatment plan backed by data.",
  },
];

const values = [
  {
    icon: Shield,
    title: "Patient Safety",
    description:
      "Every treatment is performed under the supervision of our board-certified Medical Director. We use FDA-approved devices and evidence-based protocols to ensure your safety comes first.",
  },
  {
    icon: Target,
    title: "Results-Driven",
    description:
      "We combine clinical expertise with the latest technology to deliver measurable, visible results. Your personalized treatment plan is designed around your unique goals and skin profile.",
  },
  {
    icon: Heart,
    title: "Inclusive & Welcoming",
    description:
      "Rani Beauty Clinic is a safe space for all skin types, all backgrounds, and all genders. Our treatments and technology are specifically chosen to serve diverse skin tones effectively.",
  },
  {
    icon: Lightbulb,
    title: "Continuous Innovation",
    description:
      "We stay at the forefront of aesthetic medicine and wellness by investing in the latest technology, ongoing training, and emerging treatments so you always receive the best care available.",
  },
];

const physicianStructuredData = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: "Dr. Alexander Landfield",
  medicalSpecialty: "Neurology",
  jobTitle: "Medical Director",
  worksFor: {
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: "US",
    },
    telephone: clinicInfo.phone,
    url: clinicInfo.website,
  },
};

export default function AboutPageClient() {
  return (
    <>
      <StructuredData data={physicianStructuredData} />

      {/* Hero */}
      <Hero
        label="ABOUT US"
        title="About Rani Beauty Clinic"
        subtitle="A physician-supervised medspa and wellness clinic in Renton, WA — where advanced aesthetics and medical wellness come together under one roof."
        dark={false}
      />

      {/* Our Story */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div>
                <SectionLabel label="OUR STORY" className="!items-start" />
                <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
                  Founded in {clinicInfo.established}
                </h2>
                <p className="mt-2 font-body text-sm font-semibold uppercase tracking-wide text-rani-gold">
                  {clinicInfo.ownership}
                </p>
                <p className="mt-6 font-body text-base leading-relaxed text-rani-text">
                  Rani Beauty Clinic was born from a simple belief: everyone deserves
                  access to physician-supervised aesthetic and wellness treatments in a
                  space that feels welcoming, not intimidating. After years in the
                  aesthetics industry, our founders saw a gap between high-end
                  clinics and the warm, personal care every patient deserves.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Nestled in the heart of Renton, WA, Rani Beauty Clinic serves
                  patients across King County and beyond. Our approach combines
                  cutting-edge technology with genuine human connection — because
                  looking your best should also feel like the best experience
                  of your day. Every treatment is overseen by our board-certified
                  Medical Director, ensuring the highest standards of safety and results.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge icon="heart">Woman-Owned</Badge>
                  <Badge icon="shield">Physician-Supervised</Badge>
                  <Badge icon="clock">Open 7 Days a Week</Badge>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-rani-cream to-rani-gold/20 flex items-center justify-center">
                <div className="text-center px-4">
                  <span className="font-heading text-6xl text-rani-navy/10">R</span>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Medical Director */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="MEDICAL LEADERSHIP" />
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div className="flex flex-col items-center">
                {/* Circular photo placeholder with initials */}
                <div className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-rani-gold/30 bg-gradient-to-br from-rani-navy to-rani-navy-light shadow-lg">
                  <span className="font-heading text-6xl text-rani-gold">AL</span>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right">
              <div>
                <h2 className="font-body text-3xl font-bold text-rani-navy md:text-4xl">
                  {clinicInfo.medicalDirector.name}
                </h2>
                <p className="mt-2 font-body text-lg font-semibold text-rani-gold">
                  {clinicInfo.medicalDirector.title} &middot;{" "}
                  {clinicInfo.medicalDirector.specialty}
                </p>

                <p className="mt-6 font-body text-base leading-relaxed text-rani-text">
                  Dr. Alexander Landfield is a board-certified neurologist who brings
                  a unique depth of medical expertise to aesthetic medicine. His
                  extensive training in neuromuscular anatomy and neurotoxin science
                  provides unparalleled precision in treatments like Botox and Dysport,
                  making him one of the most qualified injectors in the Pacific Northwest.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  As Medical Director of Rani Beauty Clinic, Dr. Landfield oversees
                  every medical treatment protocol, from GLP-1 weight management and
                  hormone therapy to advanced aesthetic procedures. His commitment to
                  evidence-based medicine ensures that every patient receives treatments
                  that are not only effective but held to the highest standards of safety.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge icon="shield">Board-Certified Neurologist</Badge>
                  <Badge icon="check">Medical Director</Badge>
                  <Badge icon="check">Neurotoxin Expert</Badge>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR TEAM" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Meet the Experts Behind Your Results
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              Our team of licensed professionals is passionate about helping you
              look and feel your best. Each member brings specialized training and
              a genuine commitment to your care.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <Card key={index} goldTop>
                <div className="flex flex-col items-center text-center">
                  {/* Circular avatar placeholder */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rani-navy to-rani-navy-light">
                    <span className="font-heading text-2xl text-rani-gold">
                      {member.initials}
                    </span>
                  </div>
                  <h3 className="mt-4 font-body text-lg font-bold text-rani-navy">
                    {member.name}
                  </h3>
                  <p className="mt-1 font-body text-sm font-semibold text-rani-gold">
                    {member.role}
                  </p>
                  <p className="mt-3 font-body text-sm leading-relaxed text-rani-muted">
                    {member.bio}
                  </p>
                </div>
              </Card>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Our Technology */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR TECHNOLOGY" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Industry-Leading Equipment
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              We invest in the most advanced, FDA-approved technology to deliver
              safe, effective, and comfortable treatments for all skin types.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {technologies.map((tech) => (
              <Card key={tech.name} goldTop>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rani-cream">
                    <tech.icon size={28} className="text-rani-gold" />
                  </div>
                  <h3 className="mt-4 font-body text-lg font-bold text-rani-navy">
                    {tech.name}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-rani-muted">
                    {tech.description}
                  </p>
                </div>
              </Card>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR VALUES" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              What We Stand For
            </h2>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title}>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rani-cream">
                    <value.icon size={28} className="text-rani-gold" />
                  </div>
                  <h3 className="mt-4 font-body text-lg font-bold text-rani-navy">
                    {value.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-rani-muted">
                    {value.description}
                  </p>
                </div>
              </Card>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Experience the Rani Difference"
        subtitle="Book your complimentary consultation and discover how our physician-supervised approach can help you achieve your aesthetic and wellness goals."
      />
    </>
  );
}
