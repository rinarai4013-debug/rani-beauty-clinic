"use client";

import { useEffect, useRef, useState } from "react";
import { Stethoscope, Users, Star, Clock, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface TrustItem {
  icon: LucideIcon;
  label: string;
  numericValue?: number;
  numericSuffix?: string;
  numericPrefix?: string;
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
    <div
      className="flex shrink-0 items-center gap-3 px-5 py-2 transition-all duration-500 ease-out"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${index * 80}ms`,
      }}
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
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TrustBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { rootMargin: "-40px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-rani-navy py-4">
      <div className="mx-auto max-w-7xl px-4">
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
