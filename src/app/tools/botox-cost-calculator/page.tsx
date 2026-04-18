"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Check, Calculator, Phone, ArrowRight, Copy, CheckCheck } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

/* ── Treatment Area Data ──────────────────────────────────────────── */

interface TreatmentArea {
  id: string;
  name: string;
  description: string;
  unitsMin: number;
  unitsMax: number;
  note?: string;
}

const PRICE_PER_UNIT_MIN = 12;
const PRICE_PER_UNIT_MAX = 14;

const treatmentAreas: TreatmentArea[] = [
  {
    id: "forehead",
    name: "Forehead Lines",
    description: "Smooth horizontal lines across the forehead",
    unitsMin: 10,
    unitsMax: 30,
  },
  {
    id: "frown",
    name: "Frown Lines (11s)",
    description: "Vertical lines between the brows",
    unitsMin: 15,
    unitsMax: 25,
  },
  {
    id: "crows-feet",
    name: "Crow's Feet",
    description: "Fine lines at the outer corners of the eyes",
    unitsMin: 20,
    unitsMax: 30,
    note: "10-15 units per side",
  },
  {
    id: "bunny-lines",
    name: "Bunny Lines",
    description: "Lines on the sides of the nose when scrunching",
    unitsMin: 5,
    unitsMax: 10,
  },
  {
    id: "lip-flip",
    name: "Lip Flip",
    description: "Subtle upper lip enhancement without filler",
    unitsMin: 4,
    unitsMax: 8,
  },
  {
    id: "masseter",
    name: "Jawline / Masseter",
    description: "Slim the jawline or relieve teeth grinding",
    unitsMin: 50,
    unitsMax: 100,
    note: "25-50 units per side",
  },
  {
    id: "neck-bands",
    name: "Neck Bands",
    description: "Reduce visible platysmal bands on the neck",
    unitsMin: 20,
    unitsMax: 40,
  },
  {
    id: "brow-lift",
    name: "Brow Lift",
    description: "Subtle lift to open and brighten the eyes",
    unitsMin: 4,
    unitsMax: 8,
  },
];

/* ── FAQ Schema Data ──────────────────────────────────────────────── */

const faqItems = [
  {
    question: "How much does Botox cost per unit?",
    answer:
      "At Rani Beauty Clinic, Botox is priced at $12-$14 per unit. The total cost depends on how many units your provider recommends for each treatment area. Most patients invest between $200-$600 per visit depending on the areas treated.",
  },
  {
    question: "How many units of Botox will I need?",
    answer:
      "The number of units varies based on the treatment area, muscle strength, and your aesthetic goals. For example, forehead lines typically require 10-30 units, frown lines need 15-25 units, and crow's feet use 20-30 units total. Your provider will determine the exact amount during your consultation.",
  },
  {
    question: "Does Botox pricing vary between clinics?",
    answer:
      "Yes, Botox pricing can vary significantly between clinics based on provider experience, geographic location, and clinic overhead. At Rani Beauty Clinic, our physician-supervised treatments ensure you receive expert care at competitive pricing. We recommend choosing a provider based on qualifications and results rather than price alone.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Estimate Your Botox Cost",
  description:
    "Use our interactive calculator to estimate the cost of your Botox treatment at Rani Beauty Clinic.",
  step: [
    {
      "@type": "HowToStep",
      name: "Select Treatment Areas",
      text: "Choose which areas you'd like to treat by checking the boxes next to each treatment area (forehead lines, frown lines, crow's feet, etc.).",
    },
    {
      "@type": "HowToStep",
      name: "Review Unit Ranges and Cost Estimates",
      text: "View the estimated unit range and cost for each selected area, along with your total estimated investment.",
    },
    {
      "@type": "HowToStep",
      name: "Book Your Consultation",
      text: "Schedule a personalized consultation with our providers to get an exact treatment plan and pricing tailored to your needs.",
    },
  ],
};

/* ── Page Component ───────────────────────────────────────────────── */

export default function BotoxCostCalculatorPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totals = useMemo(() => {
    let unitsMin = 0;
    let unitsMax = 0;
    treatmentAreas.forEach((area) => {
      if (selected.has(area.id)) {
        unitsMin += area.unitsMin;
        unitsMax += area.unitsMax;
      }
    });
    return {
      unitsMin,
      unitsMax,
      costMin: unitsMin * PRICE_PER_UNIT_MIN,
      costMax: unitsMax * PRICE_PER_UNIT_MAX,
    };
  }, [selected]);

  const embedCode = `<iframe src="${clinicInfo.website}/tools/botox-cost-calculator" width="100%" height="900" style="border:none;border-radius:12px;" title="Botox Cost Calculator - Rani Beauty Clinic"></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <>
      {/* Structured Data */}
      <StructuredData data={faqSchema} />
      <StructuredData data={howToSchema} />

      <main className="min-h-screen bg-rani-cream">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="bg-rani-navy text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-rani-gold font-body text-sm tracking-[0.2em] uppercase mb-4">
              Interactive Tool
            </p>
            <h1 className="font-heading text-4xl md:text-5xl mb-4">
              Botox Cost Calculator
            </h1>
            <p className="font-body text-white/70 text-lg max-w-2xl mx-auto">
              Estimate your Botox investment by selecting the areas you&apos;d
              like to treat. Pricing is based on{" "}
              <strong className="text-white">$12-$14 per unit</strong> at Rani
              Beauty Clinic.
            </p>
          </div>
        </section>

        {/* ── Calculator ───────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-10 pb-16">
          <div className="bg-white rounded-xl shadow-lg border border-rani-border overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-rani-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rani-gold/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-rani-gold-accessible" />
              </div>
              <div>
                <h2 className="font-heading text-xl text-rani-navy">
                  Select Your Treatment Areas
                </h2>
                <p className="font-body text-sm text-rani-muted">
                  Check each area you&apos;re interested in treating
                </p>
              </div>
            </div>

            {/* Treatment area checkboxes */}
            <div className="grid sm:grid-cols-2 gap-0">
              {treatmentAreas.map((area) => {
                const isSelected = selected.has(area.id);
                const costMin = area.unitsMin * PRICE_PER_UNIT_MIN;
                const costMax = area.unitsMax * PRICE_PER_UNIT_MAX;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggle(area.id)}
                    className={`text-left px-6 py-5 border-b border-r border-rani-border transition-all duration-200 ${
                      isSelected
                        ? "bg-rani-gold/5 ring-inset ring-1 ring-rani-gold/30"
                        : "hover:bg-rani-cream/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox indicator */}
                      <div
                        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                          isSelected
                            ? "bg-rani-gold border-rani-gold"
                            : "border-rani-border"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-rani-navy font-semibold text-base">
                          {area.name}
                        </p>
                        <p className="font-body text-rani-muted text-sm mt-0.5">
                          {area.description}
                        </p>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-body text-xs text-rani-muted">
                            {area.unitsMin}-{area.unitsMax} units
                            {area.note && (
                              <span className="text-rani-muted/60">
                                {" "}
                                ({area.note})
                              </span>
                            )}
                          </span>
                          <span className="font-body text-sm font-semibold text-rani-navy">
                            ${costMin.toLocaleString()}-$
                            {costMax.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Totals */}
            <div className="px-6 py-6 bg-rani-navy text-white">
              {selected.size === 0 ? (
                <p className="font-body text-white/60 text-center">
                  Select treatment areas above to see your estimated cost
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-body text-white/60 text-sm uppercase tracking-wider">
                      Estimated Total
                    </p>
                    <p className="font-heading text-3xl mt-1">
                      ${totals.costMin.toLocaleString()}
                      <span className="text-white/40 mx-1">-</span>$
                      {totals.costMax.toLocaleString()}
                    </p>
                    <p className="font-body text-white/50 text-sm mt-1">
                      {totals.unitsMin}-{totals.unitsMax} total units &middot;{" "}
                      {selected.size} area{selected.size !== 1 && "s"} selected
                    </p>
                  </div>
                  <a
                    href={clinicInfo.consultation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-rani-gold hover:bg-rani-gold/90 text-rani-navy font-body font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    Book Free Consultation
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="font-body text-rani-muted text-xs text-center mt-4 max-w-2xl mx-auto">
            This calculator provides estimated cost ranges for informational
            purposes only. Actual pricing may vary based on individual anatomy,
            muscle strength, and provider recommendation. A personalized
            consultation is required for an exact treatment plan and pricing.
          </p>
        </section>

        {/* ── How It Works ─────────────────────────────────────────── */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl md:text-3xl text-rani-navy text-center mb-10">
              How to Use This Calculator
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Select Areas",
                  desc: "Choose the treatment areas you'd like to address from the checklist above.",
                },
                {
                  step: "02",
                  title: "Review Estimate",
                  desc: "See the estimated unit range and cost for each area, plus your total investment.",
                },
                {
                  step: "03",
                  title: "Book Consultation",
                  desc: "Schedule a free consultation to get a personalized plan and exact pricing.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-rani-gold/10 text-rani-gold-accessible font-heading text-lg flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-heading text-lg text-rani-navy mb-1">
                    {item.title}
                  </h3>
                  <p className="font-body text-rani-muted text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ──────────────────────────────────────────── */}
        <section className="py-16 px-4 bg-rani-cream">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl md:text-3xl text-rani-navy text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-rani-border p-6"
                >
                  <h3 className="font-heading text-lg text-rani-navy mb-2">
                    {faq.question}
                  </h3>
                  <p className="font-body text-rani-muted text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────── */}
        <section className="bg-rani-navy py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
              Ready for Your Personalized Quote?
            </h2>
            <p className="font-body text-white/60 mb-8 max-w-xl mx-auto">
              Our expert providers will assess your unique anatomy and goals to
              create a customized treatment plan. Consultations are complimentary.
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

        {/* ── Related Links ────────────────────────────────────────── */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-rani-muted text-sm mb-4">
              Learn more about Botox at Rani Beauty Clinic
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/services/botox-dysport"
                className="inline-flex items-center gap-1.5 font-body text-rani-gold-accessible hover:text-rani-gold/80 font-medium text-sm transition-colors"
              >
                Botox &amp; Dysport Services
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="hidden sm:inline text-rani-border">|</span>
              <Link
                href="/cost/botox-cost"
                className="inline-flex items-center gap-1.5 font-body text-rani-gold-accessible hover:text-rani-gold/80 font-medium text-sm transition-colors"
              >
                Botox Pricing Guide
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Embed Code Section ───────────────────────────────────── */}
        <section className="py-12 px-4 bg-rani-cream border-t border-rani-border">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-xl text-rani-navy text-center mb-2">
              Add This Calculator to Your Website
            </h2>
            <p className="font-body text-rani-muted text-sm text-center mb-6">
              Copy the embed code below to feature this calculator on your site.
            </p>
            <div className="relative">
              <textarea
                readOnly
                value={embedCode}
                rows={3}
                className="w-full font-mono text-xs bg-rani-navy text-white/80 p-4 rounded-xl border border-rani-border resize-none focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyEmbed}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-body px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
