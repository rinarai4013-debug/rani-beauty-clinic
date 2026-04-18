import type { Metadata } from "next";
import Link from "next/link";
import { Star, Phone, MapPin, Shield, Clock, Award, CheckCircle } from "lucide-react";
import { testimonials, type Testimonial } from "@/data/testimonials";

/* ─── Landing Page Data ─── */

interface LandingPageData {
  headline: string;
  subheadline: string;
  benefits: [string, string, string];
  price: string;
  priceNote: string;
}

const LANDING_PAGES: Record<string, LandingPageData> = {
  botox: {
    headline: "Expert Botox by a Board-Certified Neurologist",
    subheadline:
      "Precision-driven results from a physician who understands facial neuroscience at the deepest level.",
    benefits: [
      "Precision injections guided by advanced neurological expertise for flawless, natural results",
      "Subtle, refreshed appearance — your friends will notice, but they won't know why",
      "Administered by a board-certified neurologist with unmatched understanding of facial anatomy",
    ],
    price: "$12/unit",
    priceNote: "Most patients use 20–40 units per treatment area",
  },
  "laser-hair-removal": {
    headline: "Permanent Hair Reduction with Candela GentleMax Pro Plus",
    subheadline:
      "The gold-standard laser for all skin tones — fast, comfortable, and FDA-cleared.",
    benefits: [
      "Virtually pain-free sessions with built-in cryogen cooling technology",
      "Safe and effective for all skin tones, including darker complexions",
      "FDA-cleared Candela GentleMax Pro Plus — the industry's most trusted platform",
    ],
    price: "$79/session",
    priceNote: "Package pricing available — most areas require 6–8 sessions",
  },
  hydrafacial: {
    headline: "The HydraFacial Experience",
    subheadline:
      "Deep cleansing, exfoliation, and hydration in one luxurious 30-minute treatment.",
    benefits: [
      "Immediate, visible glow — walk out looking radiant with zero redness",
      "No downtime: get treated on your lunch break and return to your day",
      "Fully customizable boosters to target your unique skin concerns",
    ],
    price: "$199",
    priceNote: "Signature HydraFacial — upgrades and boosters available",
  },
  "glp1-weight-loss": {
    headline: "Physician-Supervised GLP-1 Weight Management",
    subheadline:
      "Semaglutide and tirzepatide protocols monitored by a board-certified physician, right here in Renton.",
    benefits: [
      "Semaglutide & tirzepatide injections prescribed and managed by a licensed physician",
      "Ongoing medical monitoring with regular labs and check-ins for your safety",
      "Sustainable, long-term weight management — not a crash diet, a real medical program",
    ],
    price: "$399/month",
    priceNote: "Includes medication, physician visits, and lab monitoring",
  },
  "rf-microneedling": {
    headline: "RF Microneedling for Collagen Renewal",
    subheadline:
      "Stimulate your skin's natural healing to smooth texture, reduce scarring, and restore a youthful glow.",
    benefits: [
      "Dramatically improves skin texture, fine lines, and overall tone",
      "Reduces acne scarring and hyperpigmentation with proven RF energy technology",
      "Minimal downtime — most patients return to normal activity within 24 hours",
    ],
    price: "$350/session",
    priceNote: "Series of 3 recommended for optimal results",
  },
};

/* ─── Slug-to-testimonial mapping (testimonials use different slugs) ─── */

const SLUG_TO_TESTIMONIAL_SLUG: Record<string, string[]> = {
  botox: ["botox-dysport"],
  "laser-hair-removal": ["laser-hair-removal"],
  hydrafacial: ["hydrafacial"],
  "glp1-weight-loss": ["glp1-weight-management"],
  "rf-microneedling": ["rf-microneedling"],
};

/* ─── Static Params ─── */

export function generateStaticParams() {
  return [
    { slug: "botox" },
    { slug: "laser-hair-removal" },
    { slug: "hydrafacial" },
    { slug: "glp1-weight-loss" },
    { slug: "rf-microneedling" },
  ];
}

/* ─── Metadata ─── */

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const data = LANDING_PAGES[params.slug];
  if (!data) {
    return { title: "Rani Beauty Clinic", robots: { index: false, follow: false } };
  }
  return {
    title: `${data.headline} | Rani Beauty Clinic — Renton, WA`,
    description: data.subheadline,
    robots: { index: false, follow: false },
  };
}

/* ─── Page ─── */

const BOOKING_URL = "https://booking.mangomint.com/ranibeautyclinic1";
const PHONE = "(425) 539-4440";
const PHONE_HREF = "tel:+14255394440";

export default function LandingPage({ params }: { params: { slug: string } }) {
  const data = LANDING_PAGES[params.slug];

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rani-cream">
        <p className="text-rani-navy text-lg">Landing page not found.</p>
      </div>
    );
  }

  /* Filter testimonials for this service */
  const testimonialSlugs = SLUG_TO_TESTIMONIAL_SLUG[params.slug] || [params.slug];
  const filteredTestimonials: Testimonial[] = testimonials
    .filter((t) => testimonialSlugs.includes(t.treatmentSlug))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="bg-rani-navy text-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            {data.headline}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {data.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-rani-gold text-rani-navy font-semibold px-8 py-4 rounded-lg text-lg hover:brightness-110 transition"
            >
              Book Your Consultation
            </a>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition text-base"
            >
              <Phone className="h-5 w-5" />
              {PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="bg-rani-cream border-y border-rani-gold/20 py-6">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center text-rani-navy">
          <div className="flex flex-col items-center gap-1">
            <Star className="h-5 w-5 text-rani-gold-accessible fill-rani-gold" />
            <span className="font-semibold text-sm">4.9&#9733; 127+ Reviews</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Award className="h-5 w-5 text-rani-gold-accessible" />
            <span className="font-semibold text-sm">Board-Certified MD</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-5 w-5 text-rani-gold-accessible" />
            <span className="font-semibold text-sm">Open 7 Days</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="h-5 w-5 text-rani-gold-accessible" />
            <span className="font-semibold text-sm">Physician-Supervised</span>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-rani-navy text-center mb-12">
            Why Choose Rani Beauty Clinic
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {data.benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-rani-cream rounded-xl p-6 border border-rani-gold/10"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-rani-gold-accessible flex-shrink-0 mt-0.5" />
                  <p className="text-rani-navy leading-relaxed">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {filteredTestimonials.length > 0 && (
        <section className="bg-rani-cream py-16 px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-rani-navy text-center mb-12">
              What Our Patients Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {filteredTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-rani-gold/10"
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-rani-gold-accessible fill-rani-gold"
                      />
                    ))}
                  </div>
                  <p className="text-rani-navy/80 text-sm leading-relaxed mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="text-sm font-semibold text-rani-navy">
                    {t.name}
                    {t.verified && (
                      <span className="ml-2 text-xs font-normal text-rani-gold-accessible">
                        Verified Patient
                      </span>
                    )}
                  </div>
                  {t.location && (
                    <div className="text-xs text-rani-navy/50 mt-1">{t.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pricing ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-rani-navy mb-4">
            Transparent Pricing
          </h2>
          <p className="text-4xl md:text-5xl font-bold text-rani-gold-accessible mb-3">
            Starting at {data.price}
          </p>
          <p className="text-rani-navy/60 mb-2">{data.priceNote}</p>
          <p className="text-sm text-rani-navy/50">
            Financing available through PatientFi &amp; Cherry
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-rani-navy py-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Book your consultation today and discover why patients across the
            Greater Seattle area trust Rani Beauty Clinic for their aesthetic
            and wellness goals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-rani-gold text-rani-navy font-semibold px-8 py-4 rounded-lg text-lg hover:brightness-110 transition"
            >
              Book Your Consultation
            </a>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition text-base"
            >
              <Phone className="h-5 w-5" />
              {PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* ── Minimal Footer ── */}
      <footer className="bg-rani-navy/95 text-white/60 py-8 px-6 text-sm">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>300 SW 7th St, Suite 100, Renton, WA 98057</span>
          </div>
          <a href={PHONE_HREF} className="hover:text-white transition">
            {PHONE}
          </a>
          <Link href="/privacy-policy" className="hover:text-white transition">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
