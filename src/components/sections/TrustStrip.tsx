"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Stethoscope, Heart, Star, Clock, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
    tooltip: "Every treatment designed under board-certified neurologist oversight",
  },
  {
    icon: Heart,
    label: "Woman-Owned",
    tooltip: "Founded and operated by women who understand your goals",
  },
  {
    icon: Star,
    label: "Rating",
    numericValue: 4.9,
    numericSuffix: " (127+)",
    isDecimal: true,
    tooltip: "4.9 stars across 127+ verified Google reviews",
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

function useCountUp(
  target: number,
  isInView: boolean,
  options?: { duration?: number; isDecimal?: boolean }
): string {
  const { duration = 1200, isDecimal = false } = options || {};
  const [value, setValue] = useState(target);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startFrom = target * 0.7;
    const range = target - startFrom;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startFrom + eased * range);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  if (isDecimal) return value.toFixed(1);
  return Math.floor(value).toLocaleString();
}

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
    <section ref={ref} className="bg-rani-navy border-t border-white/5">
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
