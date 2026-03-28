"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Stethoscope, Users, Star, Clock, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { TOTAL_CLIENTS, AGGREGATE_RATING } from "@/data/constants";

// ── Types ───────────────────────────────────────────────────────────────────

interface TrustItem {
  icon: LucideIcon;
  label: string;
  /** If set, triggers a count-up animation from 0 to this value */
  numericValue?: number;
  /** Suffix appended after the number, e.g. "+" or "★" */
  numericSuffix?: string;
  /** Prefix before the number, e.g. "" */
  numericPrefix?: string;
  /** Whether the number has a decimal (e.g., 4.9) */
  isDecimal?: boolean;
}

const trustItems: TrustItem[] = [
  {
    icon: Stethoscope,
    label: "Physician Supervised",
  },
  {
    icon: Users,
    label: "Clients Treated",
    numericValue: TOTAL_CLIENTS,
    numericSuffix: "+",
  },
  {
    icon: Star,
    label: "Google Rating",
    numericValue: AGGREGATE_RATING,
    numericSuffix: "\u2605",
    isDecimal: true,
  },
  {
    icon: Clock,
    label: "Open 7 Days",
  },
  {
    icon: Heart,
    label: "Woman-Owned",
  },
];

// ── Single trust item ───────────────────────────────────────────────────────

function TrustItemDisplay({
  item,
  isInView,
  index,
}: {
  item: TrustItem;
  isInView: boolean;
  index: number;
}) {
  const displayValue = useCountUp(item.numericValue ?? 0, isInView, {
    isDecimal: item.isDecimal,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex shrink-0 items-center gap-3 px-5 py-2"
    >
      <item.icon size={22} className="shrink-0 text-[#C9A96E]" />
      <span className="whitespace-nowrap font-body text-sm font-medium text-white">
        {item.numericValue != null ? (
          <>
            {item.numericPrefix}
            <span className="tabular-nums">{displayValue}</span>
            {item.numericSuffix}{" "}
            {item.label}
          </>
        ) : (
          item.label
        )}
      </span>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TrustBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="bg-rani-navy py-4" aria-label="Clinic statistics and trust indicators">
      <div className="mx-auto max-w-7xl px-4">
        {/* Scrollable container - no visible scrollbar */}
        <div className="scrollbar-hide flex items-center justify-start gap-2 overflow-x-auto md:justify-center">
          {trustItems.map((item, i) => (
            <TrustItemDisplay
              key={item.label}
              item={item}
              isInView={isInView}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
