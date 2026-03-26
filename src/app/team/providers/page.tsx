import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Award,
  GraduationCap,
  Stethoscope,
  ChevronRight,
  Brain,
  HeartPulse,
  Microscope,
  BookOpen,
  CheckCircle2,
  Users,
  BadgeCheck,
} from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Provider Expertise & Physician Supervision | Rani Beauty Clinic",
  description:
    "Meet the physician-supervised provider team at Rani Beauty Clinic in Renton, WA. Led by Medical Director Dr. Alexander Landfield, board-certified neurologist. Learn about our medical credentials, training, and approach to safety.",
  keywords: [
    "medspa doctor renton",
    "board certified medspa",
    "physician supervised medspa",
    "medspa medical director",
    "neurologist medspa",
    "botox doctor renton wa",
    "board certified aesthetic medicine",
    "medspa safety",
  ],
  alternates: {
    canonical: `${clinicInfo.website}/team/providers`,
  },
  openGraph: {
    title: "Provider Expertise | Rani Beauty Clinic",
    description:
      "Board-certified Medical Director and expert provider team delivering physician-supervised aesthetic and wellness treatments in Renton, WA.",
    type: "website",
    url: `${clinicInfo.website}/team/providers`,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic Provider Expertise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Provider Expertise | Rani Beauty Clinic",
    description:
      "Board-certified physician-supervised medspa care in Renton, WA. Meet the expertise behind every treatment.",
  },
};

// ---------------------------------------------------------------------------
// Dr. Landfield expertise areas
// ---------------------------------------------------------------------------

const expertiseAreas = [
  {
    icon: Brain,
    title: "Neurotoxin Science",
    description:
      "As a board-certified neurologist, Dr. Landfield has specialized knowledge of neuromuscular anatomy, acetylcholine receptor biology, and the precise mechanism of action behind Botox and Dysport. This expertise translates directly to safer, more accurate injection placement.",
  },
  {
    icon: Stethoscope,
    title: "Medical Oversight & Protocol Design",
    description:
      "Dr. Landfield personally reviews and approves every medical treatment protocol at Rani Beauty Clinic. From injectable dosing to laser parameters to wellness medication management, each protocol is grounded in clinical evidence and adapted for individual patient safety.",
  },
  {
    icon: HeartPulse,
    title: "Medical Wellness Programs",
    description:
      "Dr. Landfield supervises all medical wellness services including GLP-1 weight management (The Rani Protocol), NAD+ injections, hormone therapy, and comprehensive blood work panels. His medical background ensures these programs meet the highest standards of clinical care.",
  },
  {
    icon: Microscope,
    title: "Evidence-Based Aesthetics",
    description:
      "Every treatment offered at Rani Beauty Clinic is backed by clinical research and FDA approval. Dr. Landfield stays current with peer-reviewed literature on aesthetic medicine, ensuring our protocols reflect the latest advancements in safety and efficacy.",
  },
];

const knowledgeTopics = [
  "Neurotoxin pharmacology (Botox, Dysport)",
  "Facial nerve anatomy and motor point mapping",
  "Neuromuscular junction physiology",
  "Hyaluronic acid filler science and vascular safety",
  "Laser-tissue interaction and chromophore targeting",
  "Radiofrequency energy and collagen remodeling",
  "Ultrasound-based skin tightening (HIFU/Sofwave)",
  "GLP-1 receptor agonist pharmacology",
  "NAD+ biochemistry and cellular metabolism",
  "Hormone replacement therapy protocols",
  "Platelet-rich plasma (PRP) science",
  "Chemical exfoliation (TCA, retinoid, AHA/BHA)",
  "Skin barrier function and dermatological assessment",
  "Fitzpatrick skin typing and treatment safety across skin tones",
  "Adverse event recognition and emergency management",
  "Post-procedure care and wound healing biology",
  "Patient health screening and contraindication assessment",
  "FDA device classification and regulatory compliance",
  "Clinical photography and outcome documentation",
  "Infection control and medical-grade sterilization protocols",
  "Pain management and topical anesthetic pharmacology",
  "Melanin-safe laser protocols for diverse skin types",
];

const certifications = [
  "Board Certification in Neurology (ABPN)",
  "Medical Director - Rani Beauty Clinic",
  "Advanced Injectable Technique Training",
  "Laser Safety Officer Certification",
  "FDA-Approved Device Protocol Training",
  "BLS/ACLS Certified",
];

const whyPhysicianSupervision = [
  {
    title: "Deeper Anatomical Knowledge",
    description:
      "Physicians undergo years of medical training including anatomy, physiology, and pharmacology. This foundational knowledge is critical for safe injectable placement, understanding drug interactions, and managing any complications.",
  },
  {
    title: "Adverse Event Management",
    description:
      "In the rare event of a complication, physician-supervised clinics have the medical expertise and protocols to respond immediately. From vascular occlusion with fillers to allergic reactions, our team is trained to handle emergencies.",
  },
  {
    title: "Personalized Treatment Planning",
    description:
      "A physician can evaluate your complete health profile, medications, and medical history to ensure treatments are both safe and effective for your specific situation. This is especially important for wellness programs and injectable treatments.",
  },
  {
    title: "Regulatory Accountability",
    description:
      "Physician-supervised medspas operate under medical licensing regulations that require higher standards of care, documentation, and clinical oversight. This regulatory framework provides an added layer of protection for patients.",
  },
];

// ---------------------------------------------------------------------------
// Structured Data
// ---------------------------------------------------------------------------

export default function ProvidersPage() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: "Dr. Alexander Landfield",
    jobTitle: "Medical Director",
    description:
      "Board-certified neurologist and Medical Director of Rani Beauty Clinic. Supervises all medical aesthetic and wellness treatments including Botox, Dysport, dermal fillers, laser treatments, RF microneedling, Sofwave, GLP-1 weight management, NAD+ injections, hormone therapy, and blood work panels. Expertise in neuromuscular anatomy, neurotoxin pharmacology, and evidence-based aesthetic medicine.",
    knowsAbout: knowledgeTopics,
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Medical School - Board-Certified via ABPN",
    },
    memberOf: [
      {
        "@type": "Organization",
        name: "American Board of Psychiatry and Neurology (ABPN)",
      },
    ],
    medicalSpecialty: "Neurology",
    url: `${clinicInfo.website}/team/providers`,
    sameAs: [
      `${clinicInfo.website}/team/dr-landfield`,
      clinicInfo.social.instagram,
      clinicInfo.social.facebook,
    ],
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
    image: `${clinicInfo.website}/images/team/dr-landfield.webp`,
  };

  const reviewedBySchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Provider Expertise - Rani Beauty Clinic",
    url: `${clinicInfo.website}/team/providers`,
    reviewedBy: {
      "@type": "Physician",
      name: "Dr. Alexander Landfield",
      jobTitle: "Medical Director",
      medicalSpecialty: "Neurology",
      url: `${clinicInfo.website}/team/dr-landfield`,
    },
    lastReviewed: "2026-03-01",
    about: {
      "@type": "MedicalBusiness",
      name: clinicInfo.name,
    },
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Our Team", url: `${clinicInfo.website}/team` },
    { name: "Provider Expertise", url: `${clinicInfo.website}/team/providers` },
  ];

  return (
    <>
      <StructuredData data={personSchema} />
      <StructuredData data={reviewedBySchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Breadcrumb */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-rani-navy">Home</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li>
                <Link href="/team" className="transition-colors hover:text-rani-navy">Our Team</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><span className="font-semibold text-rani-navy">Provider Expertise</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label="PROVIDER EXPERTISE"
        title="Physician-Supervised Excellence"
        subtitle="Every treatment at Rani Beauty Clinic is backed by genuine medical expertise. Our Medical Director, Dr. Alexander Landfield, is a board-certified neurologist who brings unparalleled knowledge of neuromuscular anatomy and clinical medicine to aesthetic care."
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.consultation.url }}
        secondaryCTA={{ text: "Call Now", href: clinicInfo.phoneTel }}
        badges={["Board-Certified Neurologist", "Physician Supervised", "FDA-Approved Devices"]}
        dark
      />

      {/* Medical Director Spotlight */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="MEDICAL DIRECTOR" />
            <div className="mt-10 flex flex-col items-start gap-8 lg:flex-row">
              <div className="shrink-0">
                <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-rani-gold/30">
                  <Image
                    src="/images/team/dr-landfield.webp"
                    alt="Dr. Alexander Landfield - Medical Director, Board-Certified Neurologist"
                    fill
                    className="object-cover object-top"
                    sizes="160px"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                  Dr. Alexander Landfield
                </h2>
                <p className="mt-1 font-body text-base font-semibold text-rani-gold">
                  Medical Director &mdash; Board-Certified Neurologist
                </p>
                <div className="mt-6 space-y-4">
                  <p className="font-body text-base leading-relaxed text-rani-muted">
                    Dr. Alexander Landfield is a board-certified neurologist who serves as the
                    Medical Director of Rani Beauty Clinic. His extensive training in
                    neuromuscular anatomy and neurotoxin science brings a level of medical
                    expertise to aesthetic medicine that sets Rani Beauty Clinic apart.
                  </p>
                  <p className="font-body text-base leading-relaxed text-rani-muted">
                    With a deep understanding of facial nerve pathways and muscle dynamics,
                    Dr. Landfield provides unparalleled precision in neurotoxin treatments such
                    as Botox and Dysport. His neurological background informs every aspect of the
                    clinic&apos;s approach to injectable treatments, laser protocols, and medical
                    wellness programs.
                  </p>
                </div>
                <Link
                  href="/team/dr-landfield"
                  className="mt-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-navy"
                >
                  View Full Profile
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Areas of Expertise */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="EXPERTISE" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Areas of Clinical Expertise
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base leading-relaxed text-rani-muted">
              Dr. Landfield&apos;s board-certified neurological training provides our clinic with
              expertise that most medspas cannot offer.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {expertiseAreas.map((area, idx) => (
              <FadeInOnScroll
                key={area.title}
                direction={idx % 2 === 0 ? "left" : "right"}
                delay={idx * 0.1}
              >
                <div className="rounded-xl border border-rani-gold/10 bg-white p-8 transition-all hover:border-rani-gold/30 hover:shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rani-navy">
                    <area.icon size={22} className="text-rani-gold" />
                  </div>
                  <h3 className="font-body text-lg font-bold text-rani-navy">{area.title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-rani-muted">
                    {area.description}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge & Specializations */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="KNOWLEDGE BASE" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Medical Knowledge & Specializations
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base leading-relaxed text-rani-muted">
              Dr. Landfield&apos;s expertise spans over 20 specialized areas of medical and
              aesthetic knowledge.
            </p>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {knowledgeTopics.map((topic, idx) => (
              <FadeInOnScroll key={topic} delay={Math.min(idx * 0.03, 0.4)}>
                <div className="flex items-start gap-3 rounded-lg border border-rani-border bg-rani-cream/50 px-4 py-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-rani-gold" />
                  <span className="font-body text-sm text-rani-navy">{topic}</span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Why Physician Supervision Matters */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="YOUR SAFETY" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Why Physician Supervision Matters
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base leading-relaxed text-rani-muted">
              Not all medspas operate under direct physician supervision. Here is why it makes a
              meaningful difference in your safety and results.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 space-y-6">
            {whyPhysicianSupervision.map((item, idx) => (
              <FadeInOnScroll key={item.title} delay={idx * 0.1}>
                <div className="flex items-start gap-5 rounded-xl border border-rani-gold/10 bg-white p-6 md:p-8">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rani-navy">
                    <Shield size={18} className="text-rani-gold" />
                  </div>
                  <div>
                    <h3 className="font-body text-base font-bold text-rani-navy">{item.title}</h3>
                    <p className="mt-1 font-body text-sm leading-relaxed text-rani-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Training */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="CREDENTIALS" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Certifications & Training
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {certifications.map((cert, idx) => (
              <FadeInOnScroll key={cert} delay={idx * 0.05}>
                <div className="flex items-center gap-3 rounded-xl border border-rani-gold/10 bg-rani-cream px-5 py-4">
                  <Award size={18} className="shrink-0 text-rani-gold" />
                  <span className="font-body text-sm font-semibold text-rani-navy">{cert}</span>
                </div>
              </FadeInOnScroll>
            ))}
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

      {/* Our Approach to Safety */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="OUR APPROACH" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Our Approach to Safety
            </h2>
          </FadeInOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FadeInOnScroll delay={0.1}>
              <div className="flex items-start gap-4 rounded-xl border border-rani-gold/10 bg-white p-6">
                <BadgeCheck size={22} className="mt-0.5 shrink-0 text-rani-gold" />
                <div>
                  <h3 className="font-body text-sm font-bold text-rani-navy">
                    FDA-Approved Only
                  </h3>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    We exclusively use FDA-cleared devices and FDA-approved products. Our Candela
                    GentleMax Pro Plus, Cutera Secret Pro, and Sofwave systems are
                    maintained to manufacturer specifications.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.2}>
              <div className="flex items-start gap-4 rounded-xl border border-rani-gold/10 bg-white p-6">
                <BookOpen size={22} className="mt-0.5 shrink-0 text-rani-gold" />
                <div>
                  <h3 className="font-body text-sm font-bold text-rani-navy">
                    Thorough Consultations
                  </h3>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    Every new client receives a comprehensive consultation including medical
                    history review, skin assessment, and personalized treatment planning before
                    any procedure begins.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.3}>
              <div className="flex items-start gap-4 rounded-xl border border-rani-gold/10 bg-white p-6">
                <Users size={22} className="mt-0.5 shrink-0 text-rani-gold" />
                <div>
                  <h3 className="font-body text-sm font-bold text-rani-navy">
                    Ongoing Training
                  </h3>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    Our clinical team participates in continuing education, manufacturer-led
                    training, and advanced technique workshops to maintain the highest level of
                    skill and safety awareness.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.4}>
              <div className="flex items-start gap-4 rounded-xl border border-rani-gold/10 bg-white p-6">
                <GraduationCap size={22} className="mt-0.5 shrink-0 text-rani-gold" />
                <div>
                  <h3 className="font-body text-sm font-bold text-rani-navy">
                    Emergency Protocols
                  </h3>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    Our clinic maintains emergency supplies and protocols as required for a
                    medical practice. All team members are trained in adverse event recognition
                    and response procedures.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      <CTABanner
        label="PHYSICIAN-SUPERVISED CARE"
        title="Experience the Difference Medical Expertise Makes"
        subtitle={`Every treatment at Rani Beauty Clinic is backed by Dr. Landfield's board-certified medical supervision. Call ${clinicInfo.phone} or book your consultation online.`}
      />
    </>
  );
}
