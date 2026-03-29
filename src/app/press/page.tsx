import { Metadata } from "next";
import Link from "next/link";
import {
  Star,
  Users,
  Syringe,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Code,
  LinkIcon,
} from "lucide-react";
import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import CopyButton from "./CopyButton";

export const metadata: Metadata = {
  title: "Press & Media Kit | Rani Beauty Clinic",
  description:
    "Press kit, media resources, and embeddable tools from Rani Beauty Clinic - a physician-supervised luxury medspa in Renton, WA.",
  alternates: {
    canonical: `${clinicInfo.website}/press`,
  },
  openGraph: {
    title: "Press & Media Kit | Rani Beauty Clinic",
    description:
      "Press kit, media resources, and embeddable tools from Rani Beauty Clinic in Renton, WA.",
    type: "website",
    url: `${clinicInfo.website}/press`,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic Press Kit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Press & Media Kit | Rani Beauty Clinic",
    description:
      "Press kit, media resources, and embeddable tools from Rani Beauty Clinic in Renton, WA.",
  },
};

const keyFacts = [
  {
    icon: Star,
    value: "4.9\u2605",
    label: "Google Rating",
  },
  {
    icon: Users,
    value: "2,181+",
    label: "Clients Served",
  },
  {
    icon: Syringe,
    value: "12+",
    label: "Aesthetic Treatments",
  },
  {
    icon: Stethoscope,
    value: "MD",
    label: "Physician-Supervised",
  },
];

const shortBlurb = `Rani Beauty Clinic is a woman-owned, physician-supervised luxury medspa in Renton, WA. Offering 12+ medical aesthetic treatments and 6 wellness programs under the supervision of board-certified neurologist Dr. Alexander Landfield, Rani delivers clinically-assured results in a luxury setting.`;

const mediumBlurb = `Founded in 2022, Rani Beauty Clinic is a woman-owned luxury medspa in Renton, Washington, specializing in physician-supervised medical aesthetics. Under the clinical oversight of Medical Director Dr. Alexander Landfield, a board-certified neurologist, Rani offers over 12 advanced aesthetic treatments \u2014 including Sofwave skin tightening, RF microneedling, laser treatments, and injectable services \u2014 alongside 6 medical wellness programs. With a 4.9-star Google rating and over 2,181 clients served, Rani Beauty Clinic has established itself as the South King County destination for evidence-based aesthetic medicine and transformative results.`;

const botoxCalcEmbed = `<iframe
  src="${clinicInfo.website}/tools/botox-cost-calculator"
  width="100%"
  height="700"
  frameborder="0"
  title="Botox Cost Calculator - Rani Beauty Clinic"
  style="border: none; border-radius: 12px;"
></iframe>`;

const treatmentFinderEmbed = `<iframe
  src="${clinicInfo.website}/tools/treatment-finder"
  width="100%"
  height="800"
  frameborder="0"
  title="Treatment Finder Quiz - Rani Beauty Clinic"
  style="border: none; border-radius: 12px;"
></iframe>`;

const suggestedLinks = [
  {
    text: "Rani Beauty Clinic \u2014 Luxury Medspa in Renton, WA",
    url: clinicInfo.website,
  },
  {
    text: "Botox Cost Calculator by Rani Beauty Clinic",
    url: `${clinicInfo.website}/tools/botox-cost-calculator`,
  },
  {
    text: "Find Your Treatment \u2014 Rani Beauty Clinic Quiz",
    url: `${clinicInfo.website}/tools/treatment-finder`,
  },
  {
    text: "Book a Consultation at Rani Beauty Clinic",
    url: clinicInfo.consultation.url,
  },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: clinicInfo.name,
  url: clinicInfo.website,
  logo: `${clinicInfo.website}/logo.png`,
  description:
    "Woman-owned, physician-supervised luxury medspa in Renton, WA offering medical aesthetic treatments and wellness programs.",
  foundingDate: "2022",
  address: {
    "@type": "PostalAddress",
    streetAddress: clinicInfo.address.street,
    addressLocality: clinicInfo.address.city,
    addressRegion: clinicInfo.address.state,
    postalCode: clinicInfo.address.zip,
    addressCountry: "US",
  },
  telephone: clinicInfo.phone,
  email: clinicInfo.email,
  sameAs: [
    clinicInfo.social.instagram,
    clinicInfo.social.facebook,
    clinicInfo.social.tiktok,
    clinicInfo.social.google,
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: clinicInfo.reviews.aggregateRating,
    reviewCount: clinicInfo.reviews.reviewCount,
    bestRating: 5,
  },
};

export default function PressPage() {
  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "Press & Media", url: `${clinicInfo.website}/press` },
  ];

  return (
    <>
      <StructuredData data={organizationSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Hero */}
      <Hero
        label="MEDIA RESOURCES"
        title="Press & Media"
        subtitle="Everything journalists, bloggers, and partners need to feature Rani Beauty Clinic. Download assets, embed our tools, and access pre-written copy."
        primaryCTA={{ text: "Media Inquiry", href: `mailto:${clinicInfo.email}` }}
        secondaryCTA={{ text: "About Us", href: "/about" }}
        badges={["Woman-Owned", "Physician-Supervised", "Est. 2022"]}
        dark
      />

      {/* About Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="ABOUT THE CLINIC" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              About Rani Beauty Clinic
            </h2>
            <div className="mt-8 max-w-3xl space-y-5 font-body text-lg leading-relaxed text-rani-muted">
              <p>
                Founded in 2022 in Renton, Washington, Rani Beauty Clinic is a
                woman-owned luxury medspa specializing in physician-supervised
                medical aesthetics and wellness programs.
              </p>
              <p>
                Every medical treatment is performed under the clinical oversight
                of Medical Director{" "}
                <strong className="text-rani-navy">
                  {clinicInfo.medicalDirector.name}
                </strong>
                , a{" "}
                <strong className="text-rani-navy">
                  {clinicInfo.medicalDirector.specialty}
                </strong>
                . This commitment to physician supervision sets Rani apart in the
                South King County aesthetics market.
              </p>
              <p>
                The clinic offers over 12 advanced aesthetic treatments &mdash;
                including Sofwave skin tightening, RF microneedling, PicoWay laser,
                HydraFacial, and injectable services &mdash; alongside 6 medical
                wellness programs such as GLP-1 weight management, NAD+ therapy,
                and vitamin injections.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Key Facts */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="AT A GLANCE" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Key Facts
            </h2>
          </FadeInOnScroll>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {keyFacts.map((fact) => (
              <FadeInOnScroll key={fact.label}>
                <div className="rounded-2xl border border-rani-border bg-white p-6 text-center shadow-sm">
                  <fact.icon className="mx-auto h-8 w-8 text-rani-gold" />
                  <p className="mt-4 font-heading text-3xl font-bold text-rani-navy">
                    {fact.value}
                  </p>
                  <p className="mt-2 font-body text-sm text-rani-muted">
                    {fact.label}
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Media Inquiries */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="GET IN TOUCH" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              For Media Inquiries
            </h2>
            <p className="mt-4 max-w-2xl font-body text-lg text-rani-muted">
              For interviews, feature requests, partnership opportunities, or
              additional assets, please reach out to our team.
            </p>
          </FadeInOnScroll>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <FadeInOnScroll>
              <Link
                href={`mailto:${clinicInfo.email}`}
                className="group flex items-start gap-4 rounded-2xl border border-rani-border bg-rani-cream p-6 transition-all hover:border-rani-gold hover:shadow-md"
              >
                <Mail className="mt-1 h-6 w-6 shrink-0 text-rani-gold" />
                <div>
                  <p className="font-heading text-sm font-semibold uppercase tracking-wider text-rani-navy">
                    Email
                  </p>
                  <p className="mt-1 font-body text-rani-muted">
                    {clinicInfo.email}
                  </p>
                </div>
              </Link>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <Link
                href={clinicInfo.phoneTel}
                className="group flex items-start gap-4 rounded-2xl border border-rani-border bg-rani-cream p-6 transition-all hover:border-rani-gold hover:shadow-md"
              >
                <Phone className="mt-1 h-6 w-6 shrink-0 text-rani-gold" />
                <div>
                  <p className="font-heading text-sm font-semibold uppercase tracking-wider text-rani-navy">
                    Phone
                  </p>
                  <p className="mt-1 font-body text-rani-muted">
                    {clinicInfo.phone}
                  </p>
                </div>
              </Link>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <div className="flex items-start gap-4 rounded-2xl border border-rani-border bg-rani-cream p-6">
                <MapPin className="mt-1 h-6 w-6 shrink-0 text-rani-gold" />
                <div>
                  <p className="font-heading text-sm font-semibold uppercase tracking-wider text-rani-navy">
                    Address
                  </p>
                  <p className="mt-1 font-body text-rani-muted">
                    {clinicInfo.address.full}
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Embed Our Tools */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="EMBED OUR TOOLS" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Embed Our Tools on Your Site
            </h2>
            <p className="mt-4 max-w-2xl font-body text-lg text-rani-muted">
              Partners and publishers can embed our interactive tools. Copy the
              code below and paste it into your HTML.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 space-y-10">
            {/* Botox Calculator */}
            <FadeInOnScroll>
              <div className="rounded-2xl border border-rani-border bg-white p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Code className="h-6 w-6 text-rani-gold" />
                  <h3 className="font-heading text-xl font-bold text-rani-navy">
                    Botox Cost Calculator
                  </h3>
                </div>
                <p className="mt-2 font-body text-rani-muted">
                  Let your readers estimate Botox pricing with our interactive
                  calculator.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-rani-navy p-4 font-mono text-sm text-rani-cream">
                  <code>{botoxCalcEmbed}</code>
                </pre>
                <div className="mt-4">
                  <CopyButton text={botoxCalcEmbed} label="Copy Code" />
                </div>
              </div>
            </FadeInOnScroll>

            {/* Treatment Finder */}
            <FadeInOnScroll>
              <div className="rounded-2xl border border-rani-border bg-white p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Code className="h-6 w-6 text-rani-gold" />
                  <h3 className="font-heading text-xl font-bold text-rani-navy">
                    Treatment Finder Quiz
                  </h3>
                </div>
                <p className="mt-2 font-body text-rani-muted">
                  Help your audience discover the right treatment with our guided
                  quiz.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-rani-navy p-4 font-mono text-sm text-rani-cream">
                  <code>{treatmentFinderEmbed}</code>
                </pre>
                <div className="mt-4">
                  <CopyButton text={treatmentFinderEmbed} label="Copy Code" />
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Pre-Written Blurbs */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="READY-TO-USE COPY" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Pre-Written Blurbs
            </h2>
            <p className="mt-4 max-w-2xl font-body text-lg text-rani-muted">
              Use these approved descriptions when featuring Rani Beauty Clinic.
              Copy and paste as needed.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 space-y-8">
            <FadeInOnScroll>
              <div className="rounded-2xl border border-rani-border bg-rani-cream p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-rani-navy">
                    Short Blurb
                  </h3>
                  <CopyButton text={shortBlurb} label="Copy" />
                </div>
                <p className="mt-4 font-body leading-relaxed text-rani-muted">
                  {shortBlurb}
                </p>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <div className="rounded-2xl border border-rani-border bg-rani-cream p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-rani-navy">
                    Medium Blurb
                  </h3>
                  <CopyButton text={mediumBlurb} label="Copy" />
                </div>
                <p className="mt-4 font-body leading-relaxed text-rani-muted">
                  {mediumBlurb}
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Link to Us */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="LINK TO US" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Suggested Links &amp; Anchor Text
            </h2>
            <p className="mt-4 max-w-2xl font-body text-lg text-rani-muted">
              When linking to Rani Beauty Clinic, please use one of the
              suggested anchor text and URL combinations below.
            </p>
          </FadeInOnScroll>

          <div className="mt-12 space-y-4">
            {suggestedLinks.map((link) => (
              <FadeInOnScroll key={link.url}>
                <div className="flex flex-col gap-3 rounded-2xl border border-rani-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 shrink-0 text-rani-gold" />
                      <p className="font-heading text-sm font-semibold text-rani-navy">
                        {link.text}
                      </p>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-rani-muted">
                      {link.url}
                    </p>
                  </div>
                  <CopyButton
                    text={`<a href="${link.url}">${link.text}</a>`}
                    label="Copy HTML"
                  />
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
