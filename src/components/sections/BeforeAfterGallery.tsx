"use client";

import { useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  animate,
  PanInfo,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Treatment result data for the before/after gallery */
interface TreatmentResult {
  id: string;
  treatment: string;
  sessions: number;
  timeframe: string;
  category: string;
  accentColor: string;
}

const treatmentResults: TreatmentResult[] = [
  {
    id: "laser-hair-removal",
    treatment: "Laser Hair Removal",
    sessions: 6,
    timeframe: "8 weeks",
    category: "Body",
    accentColor: "#F3D6BE",
  },
  {
    id: "hydrafacial",
    treatment: "HydraFacial",
    sessions: 3,
    timeframe: "6 weeks",
    category: "Face",
    accentColor: "#D4E7ED",
  },
  {
    id: "botox-forehead",
    treatment: "Botox - Forehead Lines",
    sessions: 1,
    timeframe: "2 weeks",
    category: "Face",
    accentColor: "#E8D5E8",
  },
  {
    id: "microneedling",
    treatment: "Microneedling",
    sessions: 4,
    timeframe: "12 weeks",
    category: "Face",
    accentColor: "#D5E8D4",
  },
  {
    id: "chemical-peel",
    treatment: "Chemical Peel",
    sessions: 3,
    timeframe: "6 weeks",
    category: "Face",
    accentColor: "#E8E0D5",
  },
  {
    id: "body-contouring",
    treatment: "Body Contouring",
    sessions: 4,
    timeframe: "10 weeks",
    category: "Body",
    accentColor: "#D5D8E8",
  },
];

const CARD_WIDTH = 300;
const CARD_GAP = 16;
const DRAG_THRESHOLD = 50;

export default function BeforeAfterGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const totalCards = treatmentResults.length;
  const maxDrag = -(totalCards - 1) * (CARD_WIDTH + CARD_GAP);

  const snapToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, totalCards - 1));
    setActiveIndex(clamped);
    animate(x, -clamped * (CARD_WIDTH + CARD_GAP), {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    let nextIndex = activeIndex;

    if (Math.abs(offset) > DRAG_THRESHOLD || Math.abs(velocity) > 500) {
      if (offset < 0 || velocity < -500) {
        nextIndex = activeIndex + 1;
      } else {
        nextIndex = activeIndex - 1;
      }
    }

    snapToIndex(nextIndex);
  };

  const handleDotClick = (index: number) => {
    snapToIndex(index);
  };

  return (
    <section
      className="overflow-hidden bg-rani-cream py-16 sm:py-20"
      aria-label="Before and after treatment results"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 font-body text-sm font-semibold uppercase tracking-wider text-rani-gold">
            Real Results
          </p>
          <h2 className="font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
            Before &amp; After
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-base text-rani-muted">
            See the transformative results our clients experience with
            physician-supervised treatments.
          </p>
        </div>

        {/* Swipeable Card Container */}
        <div
          ref={containerRef}
          className="relative mx-auto"
          style={{ maxWidth: CARD_WIDTH + 40 }}
        >
          <motion.div
            className="flex cursor-grab active:cursor-grabbing"
            style={{ x, gap: CARD_GAP }}
            drag="x"
            dragConstraints={{ left: maxDrag - 20, right: 20 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {treatmentResults.map((result, index) => (
              <ResultCard
                key={result.id}
                result={result}
                isActive={index === activeIndex}
              />
            ))}
          </motion.div>
        </div>

        {/* Dot Indicators */}
        <div
          className="mt-8 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Gallery navigation"
        >
          {treatmentResults.map((result, index) => (
            <button
              key={result.id}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View ${result.treatment} result`}
              onClick={() => handleDotClick(index)}
              className={`
                h-2.5 rounded-full transition-all duration-300
                ${
                  index === activeIndex
                    ? "w-8 bg-rani-gold"
                    : "w-2.5 bg-rani-navy/20 hover:bg-rani-navy/40"
                }
              `}
            />
          ))}
        </div>

        {/* View All Results Link */}
        <div className="mt-8 text-center">
          <Link
            href="/results"
            className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-navy transition-colors hover:text-rani-gold"
          >
            View All Results
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Individual before/after result card */
function ResultCard({
  result,
  isActive,
}: {
  result: TreatmentResult;
  isActive: boolean;
}) {
  return (
    <motion.div
      className="flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-md"
      style={{ width: CARD_WIDTH }}
      animate={{
        scale: isActive ? 1 : 0.95,
        opacity: isActive ? 1 : 0.7,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Placeholder Image Area */}
      <div
        className="relative flex h-48 items-center justify-center"
        style={{ backgroundColor: result.accentColor }}
      >
        <div className="absolute inset-0 grid grid-cols-2">
          {/* Before side */}
          <div className="flex flex-col items-center justify-center border-r border-white/30">
            <span className="mb-1 font-body text-[10px] font-bold uppercase tracking-widest text-rani-navy/50">
              Before
            </span>
            <div className="h-16 w-16 rounded-full bg-white/40" />
          </div>
          {/* After side */}
          <div className="flex flex-col items-center justify-center">
            <span className="mb-1 font-body text-[10px] font-bold uppercase tracking-widest text-rani-navy/50">
              After
            </span>
            <div className="h-16 w-16 rounded-full bg-white/70" />
          </div>
        </div>
        {/* Category badge */}
        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-rani-navy backdrop-blur-sm">
          {result.category}
        </span>
      </div>

      {/* Card Details */}
      <div className="p-5">
        <h3 className="font-heading text-lg font-bold text-rani-navy">
          {result.treatment}
        </h3>
        <div className="mt-3 flex items-center gap-4">
          <div>
            <p className="font-body text-xs text-rani-muted">Sessions</p>
            <p className="font-body text-sm font-semibold text-rani-navy">
              {result.sessions}
            </p>
          </div>
          <div className="h-8 w-px bg-rani-border" />
          <div>
            <p className="font-body text-xs text-rani-muted">Timeframe</p>
            <p className="font-body text-sm font-semibold text-rani-navy">
              {result.timeframe}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
