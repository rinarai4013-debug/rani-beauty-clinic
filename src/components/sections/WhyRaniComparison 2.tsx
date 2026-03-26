"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";

// ── Comparison data ─────────────────────────────────────────────────────────

interface ComparisonRow {
  category: string;
  daySpa: string;
  rani: string;
}

const comparisonRows: ComparisonRow[] = [
  {
    category: "Oversight",
    daySpa: "Esthetician only",
    rani: "Board-certified physician supervised",
  },
  {
    category: "Equipment",
    daySpa: "Consumer-grade devices",
    rani: "FDA-cleared medical technology (Candela, Cutera, Sofwave)",
  },
  {
    category: "Protocols",
    daySpa: "One-size-fits-all",
    rani: "Custom treatment plans with AI skin analysis",
  },
  {
    category: "Safety",
    daySpa: "Basic training",
    rani: "Hospital-grade safety protocols",
  },
  {
    category: "Follow-up",
    daySpa: "No follow-up",
    rani: "5-step post-treatment sequence with physician review",
  },
  {
    category: "Results",
    daySpa: "Temporary improvements",
    rani: "Measurable, lasting clinical results",
  },
];

// ── Stagger animation variants ──────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export default function WhyRaniComparison() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeInOnScroll>
          <SectionLabel label="WHY CHOOSE US" />
          <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl lg:text-5xl">
            Not All Medspas Are Created Equal
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            See what sets Rani Beauty Clinic apart from typical day spas and
            surface-level treatments.
          </p>
        </FadeInOnScroll>

        {/* Comparison table */}
        <div className="mt-12">
          {/* Column headers */}
          <FadeInOnScroll delay={0.15}>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr]">
              <div className="hidden md:block" />
              <div className="rounded-lg bg-gray-100 px-5 py-3 text-center">
                <span className="font-body text-sm font-semibold uppercase tracking-wider text-rani-muted">
                  Typical Day Spa
                </span>
              </div>
              <div className="rounded-lg bg-rani-navy px-5 py-3 text-center">
                <span className="font-body text-sm font-semibold uppercase tracking-wider text-rani-gold">
                  Rani Beauty Clinic
                </span>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Rows */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-3"
          >
            {comparisonRows.map((row) => (
              <motion.div
                key={row.category}
                variants={rowVariants}
                className="grid grid-cols-1 gap-3 rounded-lg border border-rani-border bg-white p-4 transition-shadow duration-300 hover:shadow-md md:grid-cols-[1fr_1fr_1fr] md:items-center md:gap-4 md:p-0"
              >
                {/* Category label */}
                <div className="md:px-5 md:py-4">
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold md:text-sm">
                    {row.category}
                  </span>
                </div>

                {/* Day spa (muted) */}
                <div className="flex items-start gap-3 rounded-lg bg-gray-50/70 px-4 py-3 md:h-full md:items-center md:rounded-none md:border-l md:border-rani-border">
                  {/* Mobile label */}
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-rani-muted md:hidden">
                    Day Spa
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <X size={12} className="text-red-400" />
                    </div>
                    <p className="font-body text-sm leading-relaxed text-rani-muted">
                      {row.daySpa}
                    </p>
                  </div>
                </div>

                {/* Rani (highlighted) */}
                <div className="flex items-start gap-3 rounded-lg bg-rani-cream/60 px-4 py-3 md:h-full md:items-center md:rounded-none md:border-l md:border-rani-gold/30">
                  {/* Mobile label */}
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-rani-gold md:hidden">
                    Rani Beauty Clinic
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check size={12} className="text-emerald-600" />
                    </div>
                    <p className="font-body text-sm font-medium leading-relaxed text-rani-navy">
                      {row.rani}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA */}
        <FadeInOnScroll delay={0.3}>
          <div className="mt-12 text-center">
            <Button
              href={clinicInfo.consultation.url}
              className="!bg-rani-navy !text-white hover:!bg-rani-navy-light"
              icon
            >
              Experience the Rani Difference
            </Button>
            <p className="mt-3 font-body text-xs text-rani-muted">
              Free phone consultations available - no commitment required
            </p>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
