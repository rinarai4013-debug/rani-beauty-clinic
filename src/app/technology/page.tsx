import { Metadata } from "next";
import Link from "next/link";
import { Zap, Radio, ScanFace, Sun, Droplets, ChevronRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Our Technology | Advanced Medical Devices at Rani Beauty Clinic",
  description:
    "Explore the FDA-approved technology at Rani Beauty Clinic in Renton, WA. Candela GentleMax Pro Plus, Cutera Secret Pro, Sofwave, HydraFacial MD, and AI skin analysis.",
  alternates: {
    canonical: `${clinicInfo.website}/technology`,
  },
  openGraph: {
    title: "Our Technology | Rani Beauty Clinic",
    description:
      "FDA-approved medical devices for laser, RF microneedling, skin tightening, and more at Rani Beauty Clinic.",
    type: "website",
    url: `${clinicInfo.website}/technology`,
  },
};

const devices = [
  {
    icon: Zap,
    name: "Candela GentleMax Pro Plus",
    category: "Laser Platform",
    description:
      "The gold standard in laser hair removal and skin rejuvenation. Features dual-wavelength technology with Alexandrite 755nm and Nd:YAG 1064nm lasers, treating all skin types safely and effectively. The integrated Dynamic Cooling Device (DCD) delivers cryogen milliseconds before each pulse for virtually pain-free treatments.",
    specs: [
      "Dual wavelengths: Alexandrite 755nm + Nd:YAG 1064nm",
      "Integrated DCD cooling + air cooling system",
      "Treats all Fitzpatrick skin types (I–VI)",
      "Large spot sizes for faster treatment coverage",
    ],
    services: [
      { name: "Laser Hair Removal", href: "/services/laser-hair-removal" },
      { name: "Laser Acne Facial", href: "/services/laser-acne-facial" },
    ],
  },
  {
    icon: Radio,
    name: "Cutera Secret Pro",
    category: "RF Microneedling",
    description:
      "An advanced radiofrequency microneedling system that combines fractional RF energy with precision microneedles. Delivers controlled thermal energy deep into the dermis to stimulate collagen and elastin remodeling, addressing skin laxity, scarring, stretch marks, and overall skin quality.",
    specs: [
      "Fractional RF + microneedling in one device",
      "Adjustable needle depth and energy levels",
      "Stimulates collagen at multiple dermal layers",
      "Minimal downtime with significant results",
    ],
    services: [
      { name: "RF Microneedling", href: "/services/rf-microneedling" },
      { name: "Scar Reduction", href: "/services/scar-reduction" },
    ],
  },
  {
    icon: Sun,
    name: "Sofwave",
    category: "Ultrasound Skin Tightening",
    description:
      "FDA-cleared SUPERB (Synchronous Ultrasound Parallel Beam) technology for non-invasive skin lifting and tightening. Delivers focused ultrasound energy at a precise depth of 1.5mm in the mid-dermis to stimulate new collagen production without damaging the skin surface.",
    specs: [
      "SUPERB ultrasound technology",
      "Targets 1.5mm depth in mid-dermis",
      "Integrated cooling for patient comfort",
      "No downtime — immediate return to activities",
    ],
    services: [
      { name: "Sofwave Treatment", href: "/services/sofwave" },
    ],
  },
  {
    icon: Droplets,
    name: "HydraFacial MD",
    category: "Skin Health Platform",
    description:
      "The HydraFacial MD system uses patented Vortex-Fusion technology to cleanse, extract, and hydrate the skin simultaneously. A multi-step treatment that delivers instant results with no downtime, customizable with boosters and serums for targeted skin concerns.",
    specs: [
      "Patented Vortex-Fusion delivery system",
      "Multi-step: cleanse, peel, extract, hydrate, protect",
      "Customizable with specialty boosters",
      "Suitable for all skin types — no downtime",
    ],
    services: [
      { name: "HydraFacial MD", href: "/services/hydrafacial" },
    ],
  },
  {
    icon: ScanFace,
    name: "AI Skin Analysis",
    category: "Diagnostic Technology",
    description:
      "Advanced imaging and AI-powered analysis that maps your skin across multiple dimensions including texture, pores, wrinkles, pigmentation, and UV damage. Provides a comprehensive, data-driven assessment that guides personalized treatment planning.",
    specs: [
      "Multi-spectral skin imaging",
      "AI-powered pattern recognition",
      "Tracks progress across treatments",
      "Objective data for personalized treatment plans",
    ],
    services: [
      { name: "AI Skin Analysis", href: "/services/ai-skin-analysis" },
    ],
  },
];

export default function TechnologyPage() {
  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Our Technology", url: `${clinicInfo.website}/technology` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />

      <Hero
        label="OUR TECHNOLOGY"
        title="Advanced Medical Devices for Superior Results"
        subtitle="At Rani Beauty Clinic, we invest in FDA-approved, industry-leading technology to deliver safe, effective, and consistent results. Every device is maintained to manufacturer specifications and operated by trained clinicians under physician supervision."
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.consultation.url }}
        secondaryCTA={{ text: "View Services", href: "/services" }}
        badges={["FDA-Approved", "Industry-Leading", "Physician Supervised"]}
        dark
      />

      {/* Devices */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="EQUIPMENT" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Our Technology Platform
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              We selected each device for its clinical efficacy, safety
              profile, and ability to deliver consistent results across diverse
              skin types and treatment goals.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 space-y-10">
            {devices.map((device, index) => (
              <FadeInOnScroll
                key={device.name}
                direction={index % 2 === 0 ? "left" : "right"}
                delay={0.1}
              >
                <div className="rounded-xl border border-rani-gold/10 bg-rani-cream p-8 lg:p-10">
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    <div className="lg:flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <device.icon size={28} className="text-rani-gold" />
                        <div>
                          <h3 className="font-body text-xl font-bold text-rani-navy">
                            {device.name}
                          </h3>
                          <p className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                            {device.category}
                          </p>
                        </div>
                      </div>
                      <p className="mb-6 font-body text-base leading-relaxed text-rani-text">
                        {device.description}
                      </p>

                      <h4 className="mb-3 font-body text-sm font-bold text-rani-navy">
                        Key Specifications
                      </h4>
                      <ul className="space-y-2">
                        {device.specs.map((spec) => (
                          <li
                            key={spec}
                            className="flex items-start gap-2 font-body text-sm text-rani-text"
                          >
                            <ChevronRight
                              size={14}
                              className="mt-0.5 shrink-0 text-rani-gold"
                            />
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="lg:w-64 shrink-0">
                      <h4 className="mb-3 font-body text-sm font-bold text-rani-navy">
                        Treatments Using This Device
                      </h4>
                      <div className="space-y-2">
                        {device.services.map((svc) => (
                          <Link
                            key={svc.href}
                            href={svc.href}
                            className="group flex items-center justify-between rounded-lg border border-rani-gold/10 bg-white px-4 py-3 transition-all hover:border-rani-gold hover:shadow-sm"
                          >
                            <span className="font-body text-sm font-semibold text-rani-navy group-hover:text-rani-gold">
                              {svc.name}
                            </span>
                            <ChevronRight
                              size={14}
                              className="text-rani-muted transition-transform group-hover:translate-x-1 group-hover:text-rani-gold"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeInOnScroll>
            <SectionLabel label="TRUST" />
            <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Technology Backed by Medical Expertise
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-base text-rani-muted">
              Advanced technology is only as effective as the team operating it.
              Every device at Rani Beauty Clinic is operated by trained
              clinicians under the supervision of Dr. Alexander Landfield,
              our board-certified Medical Director.
            </p>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Badge icon="shield">Physician Supervised</Badge>
              <Badge icon="check">FDA-Approved</Badge>
              <Badge icon="clock">Open 7 Days</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <CTABanner
        label="ADVANCED TECHNOLOGY"
        title="Experience the Difference"
        subtitle={`See our technology in action. Call ${clinicInfo.phone} or book your consultation online.`}
      />
    </>
  );
}
