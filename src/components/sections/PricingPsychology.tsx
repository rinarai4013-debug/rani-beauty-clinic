"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Star, Tag, CreditCard, ArrowRight } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

/* ────────────────────────────────────────────────────────
   1. Most Popular Badge
   ──────────────────────────────────────────────────────── */

interface MostPopularBadgeProps {
  /** Defaults to "Most Popular" */
  label?: string;
  className?: string;
}

export function MostPopularBadge({
  label = "Most Popular",
  className = "",
}: MostPopularBadgeProps) {
  return (
    <span
      className={`absolute -top-3.5 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-rani-gold px-4 py-1 font-body text-xs font-bold uppercase tracking-wider text-rani-navy shadow-md ${className}`}
    >
      <Star className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────
   2. Save Badge
   ──────────────────────────────────────────────────────── */

interface SaveBadgeProps {
  /** Amount saved, e.g. 150 */
  amount: number;
  className?: string;
}

export function SaveBadge({ amount, className = "" }: SaveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-rani-success/10 px-3 py-1 font-body text-xs font-bold text-rani-success ${className}`}
    >
      <Tag className="h-3.5 w-3.5" />
      Save ${amount.toLocaleString()}
    </span>
  );
}

/* ────────────────────────────────────────────────────────
   3. Limited Availability Indicator
   ──────────────────────────────────────────────────────── */

interface LimitedAvailabilityProps {
  /** Number of spots left. Defaults to 3. */
  spots?: number;
  className?: string;
}

export function LimitedAvailability({
  spots = 3,
  className = "",
}: LimitedAvailabilityProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 ${className}`}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
      </span>
      <span className="font-body text-xs font-semibold text-amber-800">
        Only {spots} spot{spots !== 1 ? "s" : ""} left this week
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   4. Financing Strip
   ──────────────────────────────────────────────────────── */

interface FinancingStripProps {
  /** Monthly amount, e.g. 47 */
  monthlyAmount?: number;
  /** Provider name. Defaults to "Cherry". */
  provider?: string;
  className?: string;
}

export function FinancingStrip({
  monthlyAmount = 47,
  provider = "Cherry",
  className = "",
}: FinancingStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`overflow-hidden rounded-lg border border-rani-gold/20 bg-gradient-to-r from-rani-cream to-white ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/20">
          <CreditCard className="h-4 w-4 text-rani-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-rani-navy">
            Financing Available
          </p>
          <p className="font-body text-xs text-rani-muted">
            As low as{" "}
            <span className="font-bold text-rani-navy">
              ${monthlyAmount}/mo
            </span>{" "}
            with {provider}
          </p>
        </div>
        {/* Subtle shimmer animation */}
        <motion.div
          className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-r from-transparent via-rani-gold/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 3,
            ease: "linear",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────
   5. Compare & Save Section
   ──────────────────────────────────────────────────────── */

interface CompareItem {
  name: string;
  individualPrice: number;
  packagePrice: number;
}

interface CompareAndSaveProps {
  title?: string;
  subtitle?: string;
  items: CompareItem[];
  packageLabel?: string;
  bookingUrl?: string;
  className?: string;
}

export function CompareAndSave({
  title = "Compare & Save",
  subtitle = "See why packages deliver better value.",
  items,
  packageLabel = "Package Price",
  bookingUrl = clinicInfo.booking.url,
  className = "",
}: CompareAndSaveProps) {
  const totalIndividual = items.reduce((sum, it) => sum + it.individualPrice, 0);
  const totalPackage = items.reduce((sum, it) => sum + it.packagePrice, 0);
  const totalSaved = totalIndividual - totalPackage;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-rani-border bg-white ${className}`}
    >
      {/* Header */}
      <div className="border-b border-rani-border bg-rani-cream px-6 py-5">
        <h3 className="font-heading text-xl font-bold text-rani-navy">
          {title}
        </h3>
        <p className="mt-1 font-body text-sm text-rani-muted">{subtitle}</p>
      </div>

      {/* Table */}
      <div className="px-6">
        {/* Header row */}
        <div className="grid grid-cols-3 border-b border-rani-border py-3">
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-muted">
            Treatment
          </span>
          <span className="text-right font-body text-xs font-semibold uppercase tracking-wider text-rani-muted">
            Individual
          </span>
          <span className="text-right font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
            {packageLabel}
          </span>
        </div>

        {/* Items */}
        {items.map((item) => {
          const saved = item.individualPrice - item.packagePrice;
          return (
            <div
              key={item.name}
              className="grid grid-cols-3 items-center border-b border-rani-border/50 py-3 last:border-b-0"
            >
              <span className="font-body text-sm font-medium text-rani-text">
                {item.name}
              </span>
              <span className="text-right font-body text-sm text-rani-muted line-through">
                ${item.individualPrice.toLocaleString()}
              </span>
              <span className="text-right">
                <span className="font-body text-sm font-semibold text-rani-navy">
                  ${item.packagePrice.toLocaleString()}
                </span>
                {saved > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-rani-success/10 px-2 py-0.5 font-body text-[10px] font-bold text-rani-success">
                    -{Math.round((saved / item.individualPrice) * 100)}%
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-rani-border bg-rani-cream px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-rani-muted">Total</p>
            <div className="flex items-center gap-3">
              <span className="font-body text-sm text-rani-muted line-through">
                ${totalIndividual.toLocaleString()}
              </span>
              <span className="font-heading text-2xl font-bold text-rani-navy">
                ${totalPackage.toLocaleString()}
              </span>
              {totalSaved > 0 && <SaveBadge amount={totalSaved} />}
            </div>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-rani-navy px-6 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition-all duration-300 hover:bg-rani-navy-light hover:shadow-md"
          >
            Book Package
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   6. Pricing Card Wrapper (full orchestration)
   ──────────────────────────────────────────────────────── */

interface PricingCardWrapperProps {
  children: ReactNode;
  /** Show the "Most Popular" badge */
  popular?: boolean;
  /** Badge label override */
  popularLabel?: string;
  /** Show a "Save $X" badge above or near the card */
  savedAmount?: number;
  /** Show limited availability indicator */
  limitedSpots?: number;
  /** Show financing strip at the bottom */
  financing?: { monthlyAmount: number; provider?: string };
  className?: string;
}

export function PricingCardWrapper({
  children,
  popular = false,
  popularLabel,
  savedAmount,
  limitedSpots,
  financing,
  className = "",
}: PricingCardWrapperProps) {
  return (
    <div
      className={`relative rounded-2xl border-2 transition-shadow hover:shadow-lg ${
        popular
          ? "border-rani-gold ring-2 ring-rani-gold/20 shadow-md"
          : "border-rani-border shadow-sm"
      } ${className}`}
    >
      {popular && <MostPopularBadge label={popularLabel} />}

      <div className="p-6 sm:p-8">
        {/* Optional save badge & limited availability at the top */}
        {(savedAmount || limitedSpots) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {savedAmount && savedAmount > 0 && (
              <SaveBadge amount={savedAmount} />
            )}
            {limitedSpots && <LimitedAvailability spots={limitedSpots} />}
          </div>
        )}

        {children}
      </div>

      {financing && (
        <div className="border-t border-rani-border">
          <FinancingStrip
            monthlyAmount={financing.monthlyAmount}
            provider={financing.provider}
            className="border-0 rounded-none"
          />
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Default export for convenience
   ──────────────────────────────────────────────────────── */

const PricingPsychology = {
  MostPopularBadge,
  SaveBadge,
  LimitedAvailability,
  FinancingStrip,
  CompareAndSave,
  PricingCardWrapper,
};

export default PricingPsychology;
