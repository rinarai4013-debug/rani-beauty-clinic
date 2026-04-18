"use client";

import Image from "next/image";
import { Shield, Target, Heart, Lightbulb, Cpu, Sparkles, ScanFace, Waves, Radiation } from "lucide-react";
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

const schemaPhone = clinicInfo.phoneTel.replace("tel:", "");

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
      "Advanced radiofrequency microneedling system that delivers precise RF energy through gold-plated microneedles. Stimulates collagen production for skin tightening, scar revision, and overall skin rejuvenation.",
  },
  {
    icon: Waves,
    name: "HydraFacial Syndeo",
    description:
      "The next generation of HydraFacial technology. Syndeo delivers a personalized, connected treatment experience with patented Vortex-Fusion technology for deep cleansing, extraction, and hydration - all with real-time skin data tracking for optimized results.",
  },
  {
    icon: Radiation,
    name: "Sofwave",
    description:
      "FDA-cleared ultrasound skin tightening and lifting device. Sofwave's proprietary Synchronous Ultrasound Parallel Beam Technology (SUPERB™) stimulates new collagen production at 1.5mm depth for non-invasive brow lifting, wrinkle reduction, and skin firming.",
  },
  {
    icon: ScanFace,
    name: "AI Skin Analysis",
    description:
      "State-of-the-art skin analysis technology that maps your skin's condition across multiple dimensions - including texture, pores, wrinkles, pigmentation, and UV damage - to create a personalized treatment plan backed by data.",
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
  url: "https://www.ranibeautyclinic.com/team/dr-landfield",
  medicalSpecialty: "Neurology",
  jobTitle: "Medical Director",
  description: clinicInfo.medicalDirector.shortBio,
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
    telephone: schemaPhone,
    url: clinicInfo.website,
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: clinicInfo.name,
  url: clinicInfo.website,
  logo: "https://www.ranibeautyclinic.com/images/logo/logo-dark.png",
  image: "https://www.ranibeautyclinic.com/images/logo/logo-dark.png",
  description:
    "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections, hormone therapy and more.",
  telephone: schemaPhone,
  email: clinicInfo.email,
  priceRange: "$$$",
  foundingDate: "2022",
  address: {
    "@type": "PostalAddress",
    streetAddress: clinicInfo.address.street,
    addressLocality: clinicInfo.address.city,
    addressRegion: clinicInfo.address.state,
    postalCode: clinicInfo.address.zip,
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: clinicInfo.geo.latitude,
    longitude: clinicInfo.geo.longitude,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "10:00",
    closes: "19:00",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: clinicInfo.reviews.aggregateRating,
    reviewCount: clinicInfo.reviews.reviewCount,
    bestRating: 5,
  },
  sameAs: [
    clinicInfo.social.instagram,
    clinicInfo.social.facebook,
    clinicInfo.social.tiktok,
    clinicInfo.social.google,
  ],
  medicalSpecialty: [
    "Dermatology",
  ],
  employee: {
    "@type": "Physician",
    name: "Dr. Alexander Landfield",
    jobTitle: "Medical Director",
    medicalSpecialty: "Neurology",
  },
};

export default function AboutPageClient() {
  return (
    <>
      <StructuredData data={physicianStructuredData} />
      <StructuredData data={organizationStructuredData} />

      {/* Hero */}
      <Hero
        label="ABOUT US"
        title="About Rani Beauty Clinic"
        subtitle="A physician-supervised medspa and wellness clinic in Renton, WA. Advanced aesthetics and medical wellness come together under one roof."
        dark={false}
      />

      {/* Our Story */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div>
                <SectionLabel label="OUR STORY" className="!items-start" />
                <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                  Founded by Raj Rai
                </h2>
                <p className="mt-2 font-body text-sm font-semibold uppercase tracking-wide text-rani-gold">
                  A vision that began in 1990, built on global training, high standards, and personal care.
                </p>
                <p className="mt-6 font-body text-base leading-relaxed text-rani-text">
                  Rani Beauty Clinic began with a vision Raj Rai has held since 1990:
                  to create a beauty and wellness destination that feels refined,
                  trustworthy, and personal. With global training and a strong
                  commitment to quality, she built Rani to bring physician-supervised
                  aesthetics and medical wellness together in one welcoming space.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Her approach is grounded in honest care, strong standards, and an
                  experience that helps every patient feel comfortable, supported,
                  and confident in their treatment plan.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge icon="heart">Woman-Owned</Badge>
                  <Badge icon="shield">Physician-Supervised</Badge>
                  <Badge icon="clock">Open 7 Days a Week</Badge>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right">
              <div className="aspect-[4/5] overflow-hidden rounded-xl">
                <Image
                  src="/images/about/our-story.jpg"
                  alt="Rani Beauty Clinic interior"
                  width={600}
                  height={750}
                  className="h-full w-full object-cover"
                />
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
                <div className="relative h-72 w-72 overflow-hidden rounded-full border-4 border-rani-gold/30 shadow-lg">
                  <Image
                    src="/images/team/dr-landfield.webp"
                    alt="Dr. Alexander Landfield - Board-Certified Neurologist & Medical Director"
                    fill
                    className="object-cover object-top"
                    sizes="288px"
                  />
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right">
              <div>
                <h2 className="font-heading text-3xl font-bold text-rani-navy md:text-4xl">
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
                  bringing a rare depth of neurological expertise to every treatment protocol.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Why a neurologist? The same neuromuscular expertise that guides
                  neurological care translates directly to precision with neurotoxins
                  like Botox and Dysport. That is why Rani&apos;s injectable results
                  look natural, not frozen.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  As Medical Director, Dr. Landfield oversees every medical treatment
                  protocol, from GLP-1 weight management and hormone therapy to
                  advanced aesthetic procedures. His commitment to evidence-based
                  medicine ensures that every patient receives treatments that are
                  not only effective but held to the highest standards of safety.
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
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Meet the Experts Behind Your Results
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              Our team of licensed professionals is passionate about helping you
              look and feel your best. Each member brings specialized training and
              a genuine commitment to your care.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Card key={member.name} goldTop>
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-rani-gold/20">
                    <Image
                      src={member.image}
                      alt={`${member.name}, ${member.role}`}
                      fill
                      className="object-cover object-top"
                      sizes="80px"
                    />
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

      {/* What Our Patients Say */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="PATIENT STORIES" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              What Our Patients Say
            </h2>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: "Sarah M.",
                text: "The laser hair removal at Rani is truly pain-free. After just 4 sessions, I can already see incredible results.",
                treatment: "Laser Hair Removal",
              },
              {
                name: "Jennifer L.",
                text: "Knowing that a board-certified neurologist oversees the Botox treatments gave me so much confidence. My results look completely natural.",
                treatment: "Botox",
              },
              {
                name: "David K.",
                text: "The GLP-1 program at Rani changed my life. Dr. Landfield monitors everything closely, and having blood work done right in the clinic makes it so convenient.",
                treatment: "GLP-1 Weight Management",
              },
            ].map((review) => (
              <Card key={review.name}>
                <div className="flex flex-col text-center">
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-rani-gold text-lg">&#9733;</span>
                    ))}
                  </div>
                  <p className="mt-4 font-body text-sm leading-relaxed text-rani-muted italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <p className="mt-4 font-body text-sm font-bold text-rani-navy">{review.name}</p>
                  <p className="font-body text-xs text-rani-gold">{review.treatment}</p>
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
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
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
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
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
        subtitle="Book your consultation and see why patients across King County choose Rani. Your $150 consultation fee is applied as a credit toward your first treatment."
      />
    </>
  );
}
