import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, ChevronRight, Phone, Star, Shield, Sparkles } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { pnwCities, PNWCity } from "@/data/locations/pnw-cities";
import { waCitiesExtended } from "@/data/locations/wa-cities-extended";
import { nearServiceList } from "@/data/locations/service-geo";
import { extendedServiceGeoEntries } from "@/data/locations/service-geo-extended";

const allCities = [...pnwCities, ...waCitiesExtended];

interface PageProps {
  params: { city: string };
}

export function generateStaticParams() {
  return allCities.map((city) => ({
    city: city.slug,
  }));
}

function getCityBySlug(slug: string): PNWCity | undefined {
  return allCities.find((c) => c.slug === slug);
}

export function generateMetadata({ params }: PageProps): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) {
    return { title: "Location Not Found | Rani Beauty Clinic" };
  }

  const title = `Medspa Near ${city.name} - Botox, HydraFacial, Laser & Wellness | Rani Beauty Clinic`;
  const description = `Rani Beauty Clinic in Renton serves ${city.name} (${city.county}) with physician-supervised Botox, HydraFacial, laser hair removal, Sofwave, GLP-1 weight management & more. ${city.drivingTime}. Book today!`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${clinicInfo.website}/near/${city.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${clinicInfo.website}/near/${city.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `Rani Beauty Clinic - Serving ${city.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Medspa Near ${city.name} | Rani Beauty Clinic`,
      description,
    },
  };
}

const topServices = [
  { name: "Botox & Dysport", slug: "botox", price: "From $12/unit", description: "Smooth fine lines and wrinkles with expert injections. Natural-looking results that refresh without freezing your expressions." },
  { name: "HydraFacial MD", slug: "hydrafacial", price: "$249", description: "Deep cleansing, extraction, and hydration in one session using Vortex-Fusion technology. Instant glow with zero downtime." },
  { name: "Laser Hair Removal", slug: "laser-hair-removal", price: "From $79/session", description: "Permanent hair reduction for all skin types using the Candela GentleMax Pro Plus with dual-wavelength technology." },
  { name: "RF Microneedling", slug: "rf-microneedling", price: "From $495", description: "Stimulate collagen production with the Cutera Secret Pro for firmer, smoother, tighter skin with minimal downtime." },
  { name: "Sofwave", slug: "sofwave", price: "From $2,750", description: "Non-invasive skin tightening using SUPERB ultrasound technology. Lift brows, tighten jawline, and smooth wrinkles in one session." },
  { name: "Chemical Peels", slug: "chemical-peels", price: "From $150", description: "Medical-grade peels including VI Peel and BioRePeel for acne, hyperpigmentation, texture, and anti-aging concerns." },
  { name: "GLP-1 Weight Management", slug: "glp1", price: "From $399/mo", description: "The Rani Protocol - physician-supervised weight loss with Semaglutide and Tirzepatide. Includes blood work, custom dosing, and ongoing support." },
  { name: "Vitamin Injections", slug: "vitamin-injections", price: "From $35", description: "IM vitamin injections including B12, D3, Tri-Immune, Glutathione, and custom blends for energy, immunity, and vitality." },
  { name: "Peptide Therapy", slug: "peptide-therapy", price: "Consultation required", description: "Targeted peptide protocols for recovery, sleep optimization, body composition, and overall vitality under medical supervision." },
  { name: "Lip Filler", slug: "lip-filler", price: "From $650", description: "Expert lip augmentation with hyaluronic acid fillers for natural volume, definition, and symmetry. Customized to your facial proportions." },
  { name: "Lip Filler (Geo)", slug: "lip-filler-geo", price: "From $650", description: "Natural lip enhancement with premium hyaluronic acid fillers. Personalized volume, definition, and symmetry under physician supervision." },
  { name: "Scar Treatment", slug: "scar-treatment", price: "From $350", description: "Advanced scar reduction for acne scars, surgical scars, and stretch marks using RF microneedling, laser therapy, and medical-grade peels." },
  { name: "Skin Tightening (Sofwave)", slug: "skin-tightening", price: "From $2,750", description: "Non-invasive lifting and firming using SUPERB ultrasound technology. Tighten jawline, lift brows, and smooth neck lines without surgery." },
  { name: "Weight Loss (GLP-1)", slug: "weight-loss-glp1", price: "From $399/mo", description: "The Rani Protocol for sustainable weight management with Semaglutide and Tirzepatide. Full medical oversight including blood work and custom dosing." },
  { name: "Hormone Therapy (HRT)", slug: "hormone-therapy-hrt", price: "Consultation required", description: "Bioidentical hormone replacement therapy for men and women. Address fatigue, weight gain, low libido, and mood changes with physician-supervised protocols." },
];

export default function NearCityPage({ params }: PageProps) {
  const city = getCityBySlug(params.city);
  if (!city) {
    notFound();
  }

  const allServiceList = [
    ...nearServiceList,
    ...extendedServiceGeoEntries.map((e) => ({ citySlug: e.citySlug, serviceSlug: e.serviceSlug })),
  ];
  const cityServices = allServiceList.filter((s) => s.citySlug === city.slug);
  const nearbyCities = allCities
    .filter((c) => c.slug !== city.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 8);

  // LocalBusiness structured data
  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    description: `Physician-supervised medspa in Renton, WA serving ${city.name} with Botox, HydraFacial, laser hair removal, Sofwave, GLP-1 weight management, and medical wellness treatments.`,
    url: `${clinicInfo.website}/near/${city.slug}`,
    telephone: clinicInfo.phone,
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
    areaServed: {
      "@type": "City",
      name: city.name,
    },
    openingHours: "Mo-Su 10:00-19:00",
    priceRange: "$$-$$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinicInfo.reviews.aggregateRating,
      reviewCount: clinicInfo.reviews.reviewCount,
      bestRating: 5,
    },
    medicalSpecialty: "Dermatology",
    isAcceptingNewPatients: true,
  };

  // FAQ structured data
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How far is Rani Beauty Clinic from ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Rani Beauty Clinic is located ${city.distanceFromRenton} from ${city.name}. The drive typically takes ${city.drivingTime}. We are located at ${clinicInfo.address.full} with free on-site parking.`,
        },
      },
      {
        "@type": "Question",
        name: `What medspa services are available for ${city.name} residents?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `We offer physician-supervised Botox, Dysport, dermal fillers, HydraFacial, laser hair removal (Candela GentleMax Pro Plus for all skin types), RF microneedling, Sofwave skin tightening, chemical peels, GLP-1 weight management, NAD+ injections, vitamin injections, peptide therapy, hormone therapy, and comprehensive blood work.`,
        },
      },
      {
        "@type": "Question",
        name: "Is Rani Beauty Clinic physician-supervised?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Every treatment at Rani Beauty Clinic is performed under the supervision of Dr. Alexander Landfield, our board-certified Medical Director. This physician oversight ensures the highest standards of safety and efficacy for all aesthetic and wellness treatments.`,
        },
      },
      {
        "@type": "Question",
        name: `What are Rani Beauty Clinic's hours for ${city.name} clients?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `We are open seven days a week, Monday through Sunday, from 10:00 AM to 7:00 PM. This flexible schedule makes it easy for ${city.name} residents to book appointments that fit their lifestyle.`,
        },
      },
      {
        "@type": "Question",
        name: "Does Rani Beauty Clinic offer laser hair removal for dark skin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Our Candela GentleMax Pro Plus features dual-wavelength technology including the Nd:YAG 1064nm laser, which is specifically designed for safe and effective treatment on darker skin tones (Fitzpatrick IV-VI). We serve all skin types safely.",
        },
      },
      {
        "@type": "Question",
        name: "What is The Rani Protocol for weight management?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Rani Protocol is our physician-supervised GLP-1 weight management program using Semaglutide and Tirzepatide. It includes in-house blood work, custom dosing, ongoing medical support, and regular follow-ups with Dr. Landfield's team. Programs start at $399 per month.",
        },
      },
    ],
  };

  return (
    <>
      <StructuredData data={localBusinessData} />
      <StructuredData data={faqData} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: clinicInfo.website },
          { name: "Areas We Serve", url: `${clinicInfo.website}/locations` },
          { name: city.name, url: `${clinicInfo.website}/near/${city.slug}` },
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0F1D2C] via-[#1a2d40] to-[#0F1D2C] py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#C9A96E]/10 px-4 py-1.5 text-sm font-medium text-[#C9A96E]">
              <MapPin className="h-4 w-4" />
              {city.distanceFromRenton} from {city.name}
            </p>
            <h1 className="font-playfair text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Medspa Near{" "}
              <span className="text-[#C9A96E]">{city.name}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300 sm:text-xl">
              Physician-supervised aesthetic and medical wellness treatments for{" "}
              {city.name} residents. {city.drivingTime} from our Renton clinic
              with free parking.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={clinicInfo.booking.url}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 py-3.5 text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
              >
                Book Your Appointment
              </a>
              <a
                href={clinicInfo.phoneTel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {clinicInfo.phone}
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[#C9A96E]" />
                {clinicInfo.reviews.aggregateRating} Stars on Google
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#C9A96E]" />
                Open 7 days a week
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#C9A96E]" />
                Physician-supervised
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C] sm:text-4xl">
                Serving {city.name} with Physician-Supervised Excellence
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
                {city.description.split(". ").reduce((acc: string[][], sentence, i) => {
                  const groupIndex = Math.floor(i / 4);
                  if (!acc[groupIndex]) acc[groupIndex] = [];
                  acc[groupIndex].push(sentence);
                  return acc;
                }, []).map((group, idx) => (
                  <p key={idx}>{group.join(". ")}{group[group.length - 1].endsWith(".") ? "" : "."}</p>
                ))}
              </div>

              <h3 className="mt-10 font-playfair text-2xl font-bold text-[#0F1D2C]">
                Why {city.name} Residents Choose Rani
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-700">{city.whyRani}</p>

              <h3 className="mt-10 font-playfair text-2xl font-bold text-[#0F1D2C]">
                Demographics &amp; Community
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-700">{city.demographics}</p>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Driving Directions Card */}
              <div className="rounded-2xl border border-gray-100 bg-[#F8F6F1] p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#0F1D2C]">
                  <MapPin className="h-5 w-5 text-[#C9A96E]" />
                  Driving From {city.name}
                </h3>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
                    <span>{city.drivingTime}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
                    <span>{city.distanceFromRenton} - {city.county}</span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-white p-4 text-sm text-gray-700">
                  <p className="font-semibold text-[#0F1D2C]">Rani Beauty Clinic</p>
                  <p>{clinicInfo.address.full}</p>
                  <p className="mt-1 text-[#C9A96E]">Free on-site parking</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/${encodeURIComponent(city.name + ", WA")}/${encodeURIComponent(clinicInfo.address.full)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-lg bg-[#0F1D2C] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1a2d40]"
                >
                  Get Directions
                </a>
              </div>

              {/* Quick Info Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F1D2C]">Clinic Details</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#C9A96E]" /> Mon-Sun: 10 AM - 7 PM
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#C9A96E]" />
                    <a href={clinicInfo.phoneTel} className="text-[#C9A96E] hover:underline">{clinicInfo.phone}</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#C9A96E]" /> Dr. Alexander Landfield, Medical Director
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#C9A96E]" /> {clinicInfo.reviews.aggregateRating} Stars on Google
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#C9A96E]" /> Woman-owned business
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-[#F8F6F1] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C] sm:text-4xl">
              Services Available for {city.name} Residents
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Every treatment is physician-supervised by Dr. Alexander Landfield,
              our board-certified Medical Director. Click any service to learn
              more about pricing and availability for {city.name} clients.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topServices.map((service) => {
              const serviceGeo = cityServices.find((s) => s.serviceSlug === service.slug);
              return (
                <Link
                  key={service.slug}
                  href={serviceGeo ? `/near/${city.slug}/${service.slug}` : `/near/${city.slug}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-[#C9A96E]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-playfair text-lg font-bold text-[#0F1D2C] group-hover:text-[#C9A96E]">
                      {service.name}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-gray-300 transition group-hover:text-[#C9A96E]" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {service.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[#C9A96E]">
                    {service.price}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C] sm:text-4xl">
            Pricing for {city.name} Clients
          </h2>
          <p className="mt-4 max-w-2xl text-base text-gray-600">
            Transparent pricing with no hidden fees. Financing available through
            PatientFi and Cherry for qualified applicants.
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0F1D2C] text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold">Treatment</th>
                  <th className="px-6 py-4 font-semibold">Starting Price</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: "Botox / Dysport", price: "$12/unit", category: "Injectable" },
                  { name: "Dermal Fillers", price: "$650/syringe", category: "Injectable" },
                  { name: "Lip Filler", price: "$650", category: "Injectable" },
                  { name: "HydraFacial MD", price: "$249", category: "Facial" },
                  { name: "Chemical Peels (VI Peel)", price: "$395", category: "Facial" },
                  { name: "BioRePeel (PRX-T33)", price: "$495", category: "Facial" },
                  { name: "Laser Hair Removal", price: "$79/session", category: "Laser" },
                  { name: "RF Microneedling", price: "$495", category: "Skin Renewal" },
                  { name: "Sofwave", price: "$2,750", category: "Skin Tightening" },
                  { name: "GLP-1 Weight Management", price: "$399/month", category: "Wellness" },
                  { name: "NAD+ Injections", price: "$150", category: "Wellness" },
                  { name: "Vitamin Injections", price: "$35", category: "Wellness" },
                  { name: "Peptide Therapy", price: "Consultation", category: "Wellness" },
                  { name: "Hormone Therapy", price: "Consultation", category: "Wellness" },
                  { name: "Blood Work Panel", price: "$99", category: "Wellness" },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F6F1]/50"}>
                    <td className="px-6 py-3 font-medium text-[#0F1D2C]">{row.name}</td>
                    <td className="px-6 py-3 text-[#C9A96E]">{row.price}</td>
                    <td className="px-6 py-3 text-gray-500">{row.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              View Full Pricing Details <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cost/botox-cost"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Botox Cost Guide <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cost/laser-hair-removal-cost"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Laser Hair Removal Cost <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare/botox-vs-dysport"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Compare: Botox vs Dysport <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#F8F6F1] py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-3xl font-bold text-[#0F1D2C] sm:text-4xl">
            Frequently Asked Questions - {city.name}
          </h2>
          <div className="mt-10 space-y-6">
            {(faqData.mainEntity as Array<{ "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }>).map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-base font-semibold text-[#0F1D2C]">
                  {faq.name}
                  <ChevronRight className="h-5 w-5 text-gray-400 transition group-open:rotate-90" />
                </summary>
                <p className="px-6 pb-4 text-sm leading-relaxed text-gray-700">
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Cities */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-[#0F1D2C]">
            Also Serving Cities Near {city.name}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nearbyCities.map((nearby) => (
              <Link
                key={nearby.slug}
                href={`/near/${nearby.slug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-100 px-5 py-4 transition hover:border-[#C9A96E]/30 hover:bg-[#F8F6F1]"
              >
                <div>
                  <p className="font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E]">
                    {nearby.name}
                  </p>
                  <p className="text-xs text-gray-500">{nearby.drivingTime}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#C9A96E]" />
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              View All Service Areas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F1D2C] py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-white sm:text-4xl">
            Ready to Experience the Rani Difference?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300">
            {city.name} residents - book your consultation today and discover why
            our clients trust us for physician-supervised aesthetic and wellness
            treatments. {city.drivingTime} with free parking.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={clinicInfo.booking.url}
              className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-8 py-3.5 text-base font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
            >
              Book Online
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              Call {clinicInfo.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
