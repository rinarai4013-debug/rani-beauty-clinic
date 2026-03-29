"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Stethoscope, Heart, Star, Clock, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { AGGREGATE_RATING } from "@/data/constants";

interface TrustItem {
  icon: LucideIcon;
  label: string;
  numericValue?: number;
  numericSuffix?: string;
  isDecimal?: boolean;
  tooltip: string;
}

const trustItems: TrustItem[] = [
  {
    icon: Stethoscope,
    label: "Neurologist-Led",
    tooltip: "Every protocol designed by a board-certified neurologist whose neuromuscular expertise ensures precise, natural-looking results",
  },
  {
    icon: Heart,
    label: "Woman-Owned",
    tooltip: "Founded and operated by women who understand your goals",
  },
  {
    icon: Star,
    label: "Google Reviews",
    numericValue: AGGREGATE_RATING,
    numericSuffix: " Stars",
    isDecimal: true,
    tooltip: `${AGGREGATE_RATING} stars on Google. Check our Google Business Profile for verified reviews.`,
  },
  {
    icon: Clock,
    label: "Open 7 Days",
    tooltip: "Monday through Sunday, 10am to 7pm",
  },
  {
    icon: Shield,
    label: "HSA/FSA Accepted",
    tooltip: "Use your health savings or flexible spending account",
  },
];

function TrustItemDisplay({
  item,
  isInView,
}: {
  item: TrustItem;
  isInView: boolean;
}) {
  const displayValue = useCountUp(item.numericValue ?? 0, isInView, {
    isDecimal: item.isDecimal,
  });

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-white/5 rounded-lg"
      title={item.tooltip}
    >
      <item.icon size={18} className="shrink-0 text-rani-gold" />
      <span className="whitespace-nowrap font-body text-[13px] font-medium text-white/90">
        {item.numericValue != null ? (
          <>
            <span className="tabular-nums">{displayValue}</span>
            {item.numericSuffix} {item.label}
          </>
        ) : (
          item.label
        )}
      </span>
    </div>
  );
}

export default function TrustStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="bg-rani-navy border-t border-white/5" aria-label="Clinic statistics and trust indicators">
      <div className="mx-auto max-w-7xl px-4">
        {/* Desktop: single row */}
        <div className="hidden md:flex items-center justify-center py-5">
          {trustItems.map((item, i) => (
            <div key={item.label} className="flex items-center">
              {i > 0 && (
                <div className="mx-2 h-4 w-px bg-white/10" />
              )}
              <TrustItemDisplay item={item} isInView={isInView} />
            </div>
          ))}
        </div>

        {/* Mobile: 2-row grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-1 py-4 md:hidden"
        >
          {trustItems.slice(0, 3).map((item) => (
            <TrustItemDisplay key={item.label} item={item} isInView={isInView} />
          ))}
          <div className="col-span-3 flex justify-center gap-1">
            {trustItems.slice(3).map((item) => (
              <TrustItemDisplay key={item.label} item={item} isInView={isInView} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
