import { Metadata } from "next";
import Link from "next/link";
import { Award, Shield, ChevronRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { teamMembers } from "@/data/team";

export const metadata: Metadata = {
  title: "Our Team | Meet the Experts at Rani Beauty Clinic",
  description:
    "Meet the physician-supervised team at Rani Beauty Clinic in Renton, WA. Led by Medical Director Dr. Alexander Landfield, board-certified neurologist.",
  alternates: {
    canonical: `${clinicInfo.website}/team`,
  },
  openGraph: {
    title: "Our Team | Rani Beauty Clinic",
    description:
      "Meet the experts behind Rani Beauty Clinic — physician-supervised aesthetic and wellness treatments in Renton, WA.",
    type: "website",
    url: `${clinicInfo.website}/team`,
  },
};

export default function TeamPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    url: `${clinicInfo.website}/team`,
    telephone: clinicInfo.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zip,
      addressCountry: "US",
    },
    employee: [
      {
        "@type": "Physician",
        name: "Dr. Alexander Landfield",
        jobTitle: "Medical Director",
        medicalSpecialty: "Neurology",
        description:
          "Board-certified neurologist and Medical Director of Rani Beauty Clinic. Supervises all medical treatments and protocols.",
      },
    ],
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Our Team", url: `${clinicInfo.website}/team` },
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <BreadcrumbSchema items={breadcrumbs} />

      <Hero
        label="OUR TEAM"
        title="The Experts Behind Your Care"
        subtitle="Every treatment at Rani Beauty Clinic is delivered by a skilled team under the direct supervision of our board-certified Medical Director. Meet the people committed to your safety and results."
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.consultation.url }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Physician Supervised", "Board-Certified", "Woman-Owned"]}
        dark
      />

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="LEADERSHIP" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Meet Our Leadership Team
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {teamMembers.map((member, index) => (
              <FadeInOnScroll
                key={member.name}
                direction={index % 2 === 0 ? "left" : "right"}
                delay={index * 0.2}
              >
                <div className="rounded-xl border border-rani-gold/10 bg-rani-cream p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rani-navy">
                      <span className="font-heading text-xl text-rani-gold">
                        {member.initials}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-body text-xl font-bold text-rani-navy">
                        {member.name}
                      </h3>
                      <p className="font-body text-sm text-rani-gold">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <p className="font-body text-base leading-relaxed text-rani-text">
                    {member.bio}
                  </p>
                  {member.name === "Dr. Alexander Landfield" && (
                    <Link
                      href="/team/dr-landfield"
                      className="mt-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-navy"
                    >
                      View Full Profile
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR APPROACH" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Physician-Supervised Excellence
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-center font-body text-base leading-relaxed text-rani-text">
              At Rani Beauty Clinic, physician supervision is not a marketing
              phrase — it is the foundation of everything we do. Dr. Landfield
              reviews every treatment protocol, oversees all medical procedures,
              and ensures our clinical standards exceed industry norms.
            </p>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FadeInOnScroll delay={0.2}>
              <div className="flex items-start gap-4 rounded-xl bg-white p-6 border border-rani-gold/10">
                <Shield size={24} className="mt-1 shrink-0 text-rani-gold" />
                <div>
                  <h3 className="font-body text-sm font-bold text-rani-navy">
                    Medical Oversight
                  </h3>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    Every injectable, laser treatment, and wellness protocol is
                    reviewed and supervised by our board-certified Medical
                    Director.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.3}>
              <div className="flex items-start gap-4 rounded-xl bg-white p-6 border border-rani-gold/10">
                <Award size={24} className="mt-1 shrink-0 text-rani-gold" />
                <div>
                  <h3 className="font-body text-sm font-bold text-rani-navy">
                    Evidence-Based Protocols
                  </h3>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    Our treatment plans are grounded in clinical evidence and
                    tailored to each individual client&apos;s needs, skin type,
                    and health profile.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>

          <FadeInOnScroll delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Badge icon="shield">Board-Certified MD</Badge>
              <Badge icon="check">FDA-Approved Devices</Badge>
              <Badge icon="clock">Open 7 Days</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <CTABanner
        label="EXPERT CARE"
        title="Ready to Meet Our Team?"
        subtitle={`Schedule your consultation and experience physician-supervised care. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
