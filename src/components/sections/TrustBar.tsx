"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Stethoscope, Users, Star, Clock, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
    numericValue: 2181,
    numericSuffix: "+",
  },
  {
    icon: Star,
    label: "Google Rating",
    numericValue: 4.9,
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

// ── Animated counter hook ───────────────────────────────────────────────────

function useCountUp(
  target: number,
  isInView: boolean,
  options?: { duration?: number; isDecimal?: boolean }
): string {
  const { duration = 2000, isDecimal = false } = options || {};
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  if (isDecimal) {
    return value.toFixed(1);
  }
  return Math.floor(value).toLocaleString();
}

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
    <section ref={ref} className="bg-rani-navy py-4">
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
