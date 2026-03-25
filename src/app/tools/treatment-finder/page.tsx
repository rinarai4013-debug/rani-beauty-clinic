"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Sparkles, Phone } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

/* ── Types ────────────────────────────────────────────────────────── */

type Concern =
  | "wrinkles"
  | "texture"
  | "hair-removal"
  | "weight"
  | "tightening"
  | "acne";

type Budget = "under-300" | "300-600" | "600-1000" | "1000-plus";

type Downtime = "zero" | "1-2-days" | "up-to-week";

interface Treatment {
  name: string;
  description: string;
  priceRange: string;
  href: string;
  minBudget: number; // minimum budget tier threshold in dollars
  downtime: Downtime[];
}

/* ── Treatment Database ───────────────────────────────────────────── */

const treatments: Record<string, Treatment> = {
  botox: {
    name: "Botox & Dysport",
    description:
      "Smooth wrinkles and fine lines with precision injections that relax targeted facial muscles for a naturally refreshed appearance.",
    priceRange: "$200 - $600",
    href: "/services/botox-dysport",
    minBudget: 0,
    downtime: ["zero", "1-2-days"],
  },
  fillers: {
    name: "Dermal Fillers",
    description:
      "Restore lost volume and sculpt facial contours with premium hyaluronic acid fillers for a youthful, balanced look.",
    priceRange: "$500 - $1,200",
    href: "/services/dermal-fillers",
    minBudget: 300,
    downtime: ["1-2-days", "up-to-week"],
  },
  sofwave: {
    name: "Sofwave Skin Tightening",
    description:
      "FDA-cleared ultrasound technology that lifts and tightens skin by stimulating new collagen production. No surgery, no downtime.",
    priceRange: "$2,750 - $4,500",
    href: "/services/sofwave",
    minBudget: 1000,
    downtime: ["zero", "1-2-days"],
  },
  hydrafacial: {
    name: "HydraFacial",
    description:
      "A medical-grade resurfacing treatment that cleanses, extracts, and hydrates for instant glow with zero downtime.",
    priceRange: "$275",
    href: "/services/hydrafacial",
    minBudget: 0,
    downtime: ["zero"],
  },
  "chemical-peels": {
    name: "Chemical Peels",
    description:
      "Professional-strength peels that accelerate cell turnover to reveal smoother, brighter, more even-toned skin.",
    priceRange: "$395 - $495",
    href: "/services/chemical-peels",
    minBudget: 300,
    downtime: ["1-2-days", "up-to-week"],
  },
  "rf-microneedling": {
    name: "RF Microneedling",
    description:
      "Combines microneedling with radiofrequency energy to rebuild collagen and elastin from within for firmer, smoother skin.",
    priceRange: "$495 - $850",
    href: "/services/rf-microneedling",
    minBudget: 300,
    downtime: ["1-2-days", "up-to-week"],
  },
  "laser-hair-removal": {
    name: "Laser Hair Removal",
    description:
      "Advanced laser technology for permanent hair reduction on virtually any body area. Safe for all skin tones.",
    priceRange: "From $800 (packages)",
    href: "/services/laser-hair-removal",
    minBudget: 300,
    downtime: ["zero", "1-2-days"],
  },
  "glp1-weight": {
    name: "GLP-1 Weight Management",
    description:
      "Physician-supervised medical weight management program using GLP-1 medications with ongoing clinical support.",
    priceRange: "$399 - $599/mo",
    href: "/wellness/glp1-weight-management",
    minBudget: 300,
    downtime: ["zero"],
  },
  "laser-acne-facial": {
    name: "Laser Acne Facial",
    description:
      "Targeted laser treatment that destroys acne-causing bacteria and reduces inflammation for clearer, calmer skin.",
    priceRange: "$250 - $400",
    href: "/services/laser-acne-facial",
    minBudget: 0,
    downtime: ["zero", "1-2-days"],
  },
};

/* ── Concern → Treatment Mapping ──────────────────────────────────── */

const concernTreatments: Record<Concern, string[]> = {
  wrinkles: ["botox", "fillers", "sofwave"],
  texture: ["hydrafacial", "chemical-peels", "rf-microneedling"],
  "hair-removal": ["laser-hair-removal"],
  weight: ["glp1-weight"],
  tightening: ["sofwave", "rf-microneedling"],
  acne: ["laser-acne-facial", "hydrafacial", "chemical-peels"],
};

/* ── Budget Thresholds ────────────────────────────────────────────── */

const budgetThresholds: Record<Budget, number> = {
  "under-300": 299,
  "300-600": 600,
  "600-1000": 1000,
  "1000-plus": Infinity,
};

/* ── Step Options ─────────────────────────────────────────────────── */

const concerns: { value: Concern; label: string; icon: string }[] = [
  { value: "wrinkles", label: "Wrinkles & Fine Lines", icon: "~" },
  { value: "texture", label: "Skin Texture & Tone", icon: "\u2728" },
  { value: "hair-removal", label: "Unwanted Hair", icon: "\u2736" },
  { value: "weight", label: "Weight Management", icon: "\u2665" },
  { value: "tightening", label: "Skin Tightening", icon: "\u25B2" },
  { value: "acne", label: "Acne & Breakouts", icon: "\u25CF" },
];

const budgets: { value: Budget; label: string }[] = [
  { value: "under-300", label: "Under $300" },
  { value: "300-600", label: "$300 \u2013 $600" },
  { value: "600-1000", label: "$600 \u2013 $1,000" },
  { value: "1000-plus", label: "$1,000+" },
];

const downtimes: { value: Downtime; label: string; sub: string }[] = [
  { value: "zero", label: "Zero downtime", sub: "Back to life immediately" },
  {
    value: "1-2-days",
    label: "1\u20132 days",
    sub: "Minor redness or swelling",
  },
  {
    value: "up-to-week",
    label: "Up to a week",
    sub: "Peeling or recovery period",
  },
];

/* ── Recommendation Engine ────────────────────────────────────────── */

function getRecommendations(
  concern: Concern,
  budget: Budget,
  downtime: Downtime
): Treatment[] {
  const treatmentKeys = concernTreatments[concern];
  const maxBudget = budgetThresholds[budget];

  return treatmentKeys
    .map((key) => treatments[key])
    .filter((t) => t.minBudget <= maxBudget)
    .filter((t) => t.downtime.includes(downtime))
    .slice(0, 3);
}

/* ── Page Component ───────────────────────────────────────────────── */

export default function TreatmentFinderPage() {
  const [step, setStep] = useState(0);
  const [concern, setConcern] = useState<Concern | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [downtime, setDowntime] = useState<Downtime | null>(null);

  const results =
    concern && budget && downtime
      ? getRecommendations(concern, budget, downtime)
      : [];

  const goNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const restart = () => {
    setStep(0);
    setConcern(null);
    setBudget(null);
    setDowntime(null);
  };

  const canProceed =
    (step === 0 && concern !== null) ||
    (step === 1 && budget !== null) ||
    (step === 2 && downtime !== null);

  return (
    <main className="min-h-screen bg-rani-cream">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-rani-navy text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rani-gold font-body text-sm tracking-[0.2em] uppercase mb-4">
            Interactive Tool
          </p>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">
            Treatment Finder Quiz
          </h1>
          <p className="font-body text-white/70 text-lg max-w-2xl mx-auto">
            Answer three quick questions and we&apos;ll recommend the perfect
            treatments for your goals, budget, and lifestyle.
          </p>
        </div>
      </section>

      {/* ── Quiz Container ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 pb-16">
        <div className="bg-white rounded-xl shadow-lg border border-rani-gold/10 overflow-hidden">
          {/* Progress Bar */}
          {step < 3 && (
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-xs text-rani-muted uppercase tracking-wider">
                  Step {step + 1} of 3
                </span>
                <span className="font-body text-xs text-rani-muted">
                  {Math.round(((step + 1) / 3) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-rani-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-rani-gold rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((step + 1) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Concern ──────────────────────────────────────── */}
          {step === 0 && (
            <div className="p-6 md:p-8">
              <h2 className="font-heading text-2xl md:text-3xl text-rani-navy mb-2">
                What&apos;s your primary concern?
              </h2>
              <p className="font-body text-rani-muted text-sm mb-8">
                Select the area you&apos;d most like to address.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {concerns.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setConcern(c.value)}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      concern === c.value
                        ? "border-rani-gold bg-rani-gold/5 ring-1 ring-rani-gold/20"
                        : "border-rani-cream hover:border-rani-gold/30 hover:bg-rani-cream/50"
                    }`}
                  >
                    <span className="text-lg mb-2 block">{c.icon}</span>
                    <span className="font-heading text-rani-navy font-semibold block">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Budget ───────────────────────────────────────── */}
          {step === 1 && (
            <div className="p-6 md:p-8">
              <h2 className="font-heading text-2xl md:text-3xl text-rani-navy mb-2">
                What&apos;s your budget range?
              </h2>
              <p className="font-body text-rani-muted text-sm mb-8">
                This helps us recommend treatments that fit your investment
                level.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {budgets.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBudget(b.value)}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      budget === b.value
                        ? "border-rani-gold bg-rani-gold/5 ring-1 ring-rani-gold/20"
                        : "border-rani-cream hover:border-rani-gold/30 hover:bg-rani-cream/50"
                    }`}
                  >
                    <span className="font-heading text-rani-navy font-semibold text-lg">
                      {b.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Downtime ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="p-6 md:p-8">
              <h2 className="font-heading text-2xl md:text-3xl text-rani-navy mb-2">
                How much downtime can you handle?
              </h2>
              <p className="font-body text-rani-muted text-sm mb-8">
                We&apos;ll match treatments to your schedule and recovery
                preference.
              </p>

              <div className="space-y-3">
                {downtimes.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDowntime(d.value)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      downtime === d.value
                        ? "border-rani-gold bg-rani-gold/5 ring-1 ring-rani-gold/20"
                        : "border-rani-cream hover:border-rani-gold/30 hover:bg-rani-cream/50"
                    }`}
                  >
                    <span className="font-heading text-rani-navy font-semibold block">
                      {d.label}
                    </span>
                    <span className="font-body text-rani-muted text-sm">
                      {d.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-rani-gold/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-rani-gold" />
                </div>
                <h2 className="font-heading text-2xl md:text-3xl text-rani-navy">
                  Your Recommended Treatments
                </h2>
              </div>
              <p className="font-body text-rani-muted text-sm mb-8">
                Based on your answers, here are our top picks for you.
              </p>

              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((treatment) => (
                    <div
                      key={treatment.name}
                      className="border border-rani-gold/15 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-heading text-xl text-rani-navy mb-1">
                            {treatment.name}
                          </h3>
                          <p className="font-body text-rani-muted text-sm leading-relaxed mb-3">
                            {treatment.description}
                          </p>
                          <p className="font-body text-rani-gold font-semibold text-sm">
                            {treatment.priceRange}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-shrink-0">
                          <Link
                            href={treatment.href}
                            className="inline-flex items-center justify-center gap-2 border border-rani-navy text-rani-navy hover:bg-rani-navy hover:text-white font-body font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                          >
                            Learn More
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <a
                            href={clinicInfo.booking.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-rani-gold hover:bg-rani-gold/90 text-rani-navy font-body font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                          >
                            Book Consultation
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-rani-cream/50 rounded-xl">
                  <p className="font-heading text-xl text-rani-navy mb-2">
                    No exact matches found
                  </p>
                  <p className="font-body text-rani-muted text-sm mb-6 max-w-md mx-auto">
                    Your combination of preferences is quite specific. A
                    complimentary consultation will help us find the perfect
                    treatment plan for you.
                  </p>
                  <a
                    href={clinicInfo.consultation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-rani-gold hover:bg-rani-gold/90 text-rani-navy font-body font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    Book Free Consultation
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation Footer ────────────────────────────────────── */}
          <div className="px-6 md:px-8 py-5 bg-rani-cream/40 border-t border-rani-gold/10 flex items-center justify-between">
            {step > 0 && step < 3 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 font-body text-rani-muted hover:text-rani-navy text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : step === 3 ? (
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 font-body text-rani-muted hover:text-rani-navy text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Start Over
              </button>
            ) : (
              <div />
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed}
                className={`inline-flex items-center gap-2 font-body font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  canProceed
                    ? "bg-rani-gold hover:bg-rani-gold/90 text-rani-navy"
                    : "bg-rani-cream text-rani-muted/50 cursor-not-allowed"
                }`}
              >
                {step === 2 ? "See My Results" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="font-body text-rani-muted text-xs text-center mt-4 max-w-2xl mx-auto">
          Recommendations are for informational purposes only and do not
          constitute medical advice. A personalized consultation is required to
          determine the best treatment plan for your individual needs and goals.
        </p>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="bg-rani-navy py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
            Not Sure Where to Start?
          </h2>
          <p className="font-body text-white/60 mb-8 max-w-xl mx-auto">
            Our expert providers will create a customized treatment plan tailored
            to your unique goals. Consultations are always complimentary.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={clinicInfo.consultation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-rani-gold hover:bg-rani-gold/90 text-rani-navy font-body font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Book Free Consultation
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-body px-8 py-3.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              {clinicInfo.phone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
