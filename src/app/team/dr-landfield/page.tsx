import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield, Award, GraduationCap, Stethoscope, ChevronRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Dr. Alexander Landfield | Medical Director | Board-Certified Neurologist",
  description:
    "Meet Dr. Alexander Landfield, board-certified neurologist and Medical Director of Rani Beauty Clinic in Renton, WA. Learn about his expertise in aesthetic medicine and physician-supervised treatments.",
  alternates: {
    canonical: `${clinicInfo.website}/team/dr-landfield`,
  },
  openGraph: {
    title: "Dr. Alexander Landfield | Rani Beauty Clinic Medical Director",
    description:
      "Board-certified neurologist supervising all medical treatments at Rani Beauty Clinic. Expertise in neurotoxins, aesthetic medicine, and medical wellness.",
    type: "profile",
    url: `${clinicInfo.website}/team/dr-landfield`,
  },
};

const credentials = [
  { icon: GraduationCap, label: "Board-Certified Neurologist" },
  { icon: Stethoscope, label: "Medical Director, Rani Beauty Clinic" },
  { icon: Shield, label: "Physician Oversight of All Medical Treatments" },
  { icon: Award, label: "Expertise in Neurotoxin Science & Aesthetic Medicine" },
];

const supervisedServices = [
  { name: "Botox & Dysport Injections", href: "/services/botox-dysport" },
  { name: "Dermal Fillers", href: "/services/dermal-fillers" },
  { name: "Laser Hair Removal", href: "/services/laser-hair-removal" },
  { name: "RF Microneedling", href: "/services/rf-microneedling" },
  { name: "GLP-1 Weight Management", href: "/wellness/glp1-weight-management" },
  { name: "Peptide Therapy", href: "/wellness/peptide-therapy" },
  { name: "NAD+ Injections", href: "/wellness/nad-injections" },
  { name: "Hormone Therapy", href: "/wellness/hormone-therapy" },
  { name: "Blood Work & Lab Panels", href: "/wellness/blood-work" },
];

export default function DrLandfieldPage() {
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: "Dr. Alexander Landfield",
    jobTitle: "Medical Director",
    medicalSpecialty: "Neurology",
    description:
      "Board-certified neurologist and Medical Director of Rani Beauty Clinic. Supervises all medical aesthetic and wellness treatments including Botox, fillers, laser treatments, GLP-1 weight management, and peptide therapy.",
    worksFor: {
      "@type": "MedicalBusiness",
      name: clinicInfo.name,
      url: clinicInfo.website,
      telephone: clinicInfo.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: clinicInfo.address.street,
        addressLocality: clinicInfo.address.city,
        addressRegion: clinicInfo.address.state,
        postalCode: clinicInfo.address.zip,
        addressCountry: "US",
      },
    },
    url: `${clinicInfo.website}/team/dr-landfield`,
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Our Team", url: `${clinicInfo.website}/team` },
    { name: "Dr. Alexander Landfield", url: `${clinicInfo.website}/team/dr-landfield` },
  ];

  return (
    <>
      <StructuredData data={physicianSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Breadcrumb */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-rani-navy transition-colors">Home</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li>
                <Link href="/team" className="hover:text-rani-navy transition-colors">Our Team</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><span className="text-rani-navy font-semibold">Dr. Alexander Landfield</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label="MEDICAL DIRECTOR"
        title="Dr. Alexander Landfield"
        subtitle="Board-certified neurologist and Medical Director of Rani Beauty Clinic. Dr. Landfield's expertise in neuromuscular anatomy and neurotoxin science brings unparalleled precision to every treatment."
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.consultation.url }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Board-Certified", "Neurologist", "Medical Director"]}
        dark
      />

      {/* Credentials */}
      <section className="bg-white border-b border-rani-gold/20">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {credentials.map((cred) => (
              <div key={cred.label} className="flex items-center gap-3">
                <cred.icon size={20} className="shrink-0 text-rani-gold" />
                <span className="font-body text-sm font-semibold text-rani-navy">
                  {cred.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <div className="mb-8 flex items-center gap-6">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-rani-gold/30 shrink-0">
                <Image
                  src="/images/team/dr-landfield.webp"
                  alt="Dr. Alexander Landfield"
                  fill
                  className="object-cover object-top"
                  sizes="96px"
                />
              </div>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  Dr. Alexander Landfield
                </h2>
                <p className="font-body text-base text-rani-gold">
                  Medical Director, Board-Certified Neurologist
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="font-body text-base leading-relaxed text-rani-text">
                Dr. Alexander Landfield is a board-certified neurologist who
                serves as the Medical Director of Rani Beauty Clinic. His
                extensive training in neuromuscular anatomy and neurotoxin
                science brings a level of medical expertise to aesthetic
                medicine that sets Rani Beauty Clinic apart from other medspas
                in the greater Seattle area.
              </p>
              <p className="font-body text-base leading-relaxed text-rani-text">
                With a deep understanding of facial nerve pathways and muscle
                dynamics, Dr. Landfield provides unparalleled precision in
                neurotoxin treatments such as Botox and Dysport. His
                neurological background informs every aspect of the
                clinic&apos;s approach to injectable treatments, ensuring that
                results are not only aesthetically pleasing but anatomically
                sound and medically safe.
              </p>
              <p className="font-body text-base leading-relaxed text-rani-text">
                Beyond aesthetics, Dr. Landfield oversees Rani Beauty
                Clinic&apos;s full range of medical wellness services, including
                the GLP-1 weight management program (The Rani Protocol),
                peptide therapy, NAD+ injections, hormone therapy, and
                comprehensive blood work panels. His commitment to
                evidence-based medicine ensures that every treatment protocol
                at Rani meets the highest standards of safety and clinical
                efficacy.
              </p>
              <p className="font-body text-base leading-relaxed text-rani-text">
                Dr. Landfield reviews all treatment plans, oversees medical
                protocols, and is available for patient consultations on
                complex cases. His presence as Medical Director gives Rani
                Beauty Clinic clients the confidence that their care is guided
                by genuine medical expertise — not just aesthetic trends.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Services Supervised */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="SUPERVISED TREATMENTS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Treatments Under Dr. Landfield&apos;s Supervision
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supervisedServices.map((service, index) => (
              <FadeInOnScroll key={service.href} delay={index * 0.05}>
                <Link
                  href={service.href}
                  className="group flex items-center justify-between rounded-xl border border-rani-gold/10 bg-white px-5 py-4 transition-all hover:border-rani-gold hover:shadow-sm"
                >
                  <span className="font-body text-sm font-semibold text-rani-navy group-hover:text-rani-gold">
                    {service.name}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-rani-muted transition-transform group-hover:translate-x-1 group-hover:text-rani-gold"
                  />
                </Link>
              </FadeInOnScroll>
            ))}
          </div>

          <FadeInOnScroll delay={0.5}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Badge icon="shield">Physician Supervised</Badge>
              <Badge icon="check">Board-Certified</Badge>
              <Badge icon="clock">Open 7 Days</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <CTABanner
        label="PHYSICIAN-SUPERVISED CARE"
        title="Book a Consultation with Our Medical Team"
        subtitle={`Every treatment at Rani Beauty Clinic is backed by Dr. Landfield's medical expertise. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
