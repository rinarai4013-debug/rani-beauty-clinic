import { Metadata } from "next";
import Link from "next/link";
import { Shield, FileCheck, Stethoscope, AlertTriangle, ClipboardCheck, BadgeCheck } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Safety Standards & Physician Supervision | Our Commitment to Your Safety",
  description:
    "Learn about Rani Beauty Clinic's safety standards, physician supervision, FDA-approved devices, and medical protocols. Board-certified Medical Director oversees every treatment in Renton, WA.",
  alternates: {
    canonical: `${clinicInfo.website}/safety`,
  },
  openGraph: {
    title: "Safety Standards | Rani Beauty Clinic",
    description:
      "Physician-supervised care with FDA-approved devices and evidence-based protocols at Rani Beauty Clinic in Renton, WA.",
    type: "website",
    url: `${clinicInfo.website}/safety`,
  },
};

const safetyPillars = [
  {
    icon: Stethoscope,
    title: "Physician Supervision",
    description:
      "Every medical treatment at Rani Beauty Clinic is performed under the direct supervision of Dr. Alexander Landfield, our board-certified neurologist and Medical Director. Dr. Landfield reviews all treatment protocols, oversees medical procedures, and is available for consultations on complex cases.",
  },
  {
    icon: FileCheck,
    title: "FDA-Approved Devices & Products",
    description:
      "We exclusively use FDA-cleared devices and products for all treatments. Our Candela GentleMax Pro Plus for laser treatments, Cutera Secret Pro for RF microneedling, and Sofwave for skin tightening are all FDA-cleared medical devices maintained according to manufacturer specifications.",
  },
  {
    icon: ClipboardCheck,
    title: "Evidence-Based Protocols",
    description:
      "Our treatment protocols are developed from current medical literature and clinical evidence. We do not follow trends — we follow the science. Every protocol is reviewed and approved by Dr. Landfield to ensure it meets the highest standards of safety and efficacy.",
  },
  {
    icon: Shield,
    title: "Comprehensive Health Screening",
    description:
      "Before beginning any medical wellness program, we conduct thorough health screenings including in-house blood work and medical history review. This ensures treatments are appropriate for your individual health profile and helps us identify any contraindications.",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Preparedness",
    description:
      "Our clinic maintains emergency protocols and supplies as required for a medical practice. Our clinical team is trained in adverse event management and emergency response procedures. Patient safety is our top priority in every interaction.",
  },
  {
    icon: BadgeCheck,
    title: "Licensing & Compliance",
    description:
      "Rani Beauty Clinic operates under all required state and local licensing regulations for medical aesthetic practices in Washington State. All clinicians maintain current certifications and participate in ongoing training on the latest techniques and safety protocols.",
  },
];

export default function SafetyPage() {
  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Safety Standards", url: `${clinicInfo.website}/safety` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />

      <Hero
        label="PATIENT SAFETY"
        title="Your Safety Is Our Foundation"
        subtitle="At Rani Beauty Clinic, physician supervision is not a marketing phrase — it is the standard that governs every treatment, protocol, and clinical decision we make."
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.booking.url, target: "_blank" }}
        secondaryCTA={{ text: "Meet Our Team", href: "/team" }}
        badges={["Physician Supervised", "FDA-Approved Devices", "Board-Certified MD"]}
        dark
      />

      {/* Safety Pillars */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR STANDARDS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Six Pillars of Patient Safety
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              Every aspect of our practice is designed around patient safety,
              from the devices we use to the protocols we follow and the team
              that delivers your care.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {safetyPillars.map((pillar, index) => (
              <FadeInOnScroll key={pillar.title} delay={index * 0.1}>
                <div className="h-full rounded-xl border border-rani-gold/10 bg-rani-cream p-8">
                  <pillar.icon size={28} className="mb-4 text-rani-gold" />
                  <h3 className="mb-3 font-body text-lg font-bold text-rani-navy">
                    {pillar.title}
                  </h3>
                  <p className="font-body text-sm leading-relaxed text-rani-text">
                    {pillar.description}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Director */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="MEDICAL OVERSIGHT" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Led by a Board-Certified Physician
            </h2>
            <div className="mt-8 rounded-xl bg-white p-8 border border-rani-gold/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rani-navy">
                  <span className="font-heading text-xl text-rani-gold">AL</span>
                </div>
                <div>
                  <h3 className="font-body text-lg font-bold text-rani-navy">
                    Dr. Alexander Landfield
                  </h3>
                  <p className="font-body text-sm text-rani-gold">
                    Medical Director, Board-Certified Neurologist
                  </p>
                </div>
              </div>
              <p className="font-body text-base leading-relaxed text-rani-text">
                Dr. Landfield&apos;s role extends beyond titles. He actively
                reviews and approves every medical treatment protocol, oversees
                the clinical team, and ensures that our standards of care
                exceed regulatory requirements. His background in neurology
                gives him a unique perspective on neurotoxin treatments and
                patient safety that few aesthetic practices can offer.
              </p>
              <Link
                href="/team/dr-landfield"
                className="mt-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-navy"
              >
                Learn more about Dr. Landfield
                <span>&rarr;</span>
              </Link>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Badge icon="shield">Physician Supervised</Badge>
              <Badge icon="check">Woman-Owned</Badge>
              <Badge icon="clock">Open 7 Days</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <CTABanner
        label="SAFETY FIRST"
        title="Experience Physician-Supervised Care"
        subtitle={`Your safety is our top priority. Call ${clinicInfo.phone} or book online to schedule your consultation.`}
      />
    </>
  );
}
