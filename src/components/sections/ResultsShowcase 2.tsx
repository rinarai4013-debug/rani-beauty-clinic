"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import TestimonialCard from "@/components/ui/TestimonialCard";

// ── Before/After Slider ─────────────────────────────────────────────────────

interface BeforeAfterPair {
  before: string;
  after: string;
  label: string;
  sessions?: string;
}

const defaultPairs: BeforeAfterPair[] = [
  {
    before: "/images/before-after/before-1.webp",
    after: "/images/before-after/after-1.webp",
    label: "Skin Rejuvenation",
    sessions: "3 sessions",
  },
];

function SliderCard({ pair }: { pair: BeforeAfterPair }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-xl"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after comparison slider"
      >
        {/* After image (full) */}
        <Image
          src={pair.after}
          alt={`${pair.label} - after treatment at Rani Beauty Clinic`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
          draggable={false}
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={pair.before}
            alt={`${pair.label} - before treatment at Rani Beauty Clinic`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* Slider line + handle */}
        <div
          className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/60 backdrop-blur-sm"
          style={{ left: `${position}%` }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-rani-gold shadow-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-rani-navy"
            >
              <path
                d="M4 8H12M4 8L6 6M4 8L6 10M12 8L10 6M12 8L10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute left-4 top-4 z-10 rounded-full bg-rani-navy/80 px-3 py-1 font-body text-xs font-semibold text-white backdrop-blur-sm">
          Before
        </div>
        <div className="absolute right-4 top-4 z-10 rounded-full bg-rani-gold/90 px-3 py-1 font-body text-xs font-semibold text-rani-navy backdrop-blur-sm">
          After
        </div>
      </div>

      {/* Caption */}
      <p className="mt-3 text-center font-body text-sm text-rani-muted">
        {pair.label}
        {pair.sessions && (
          <span className="text-rani-gold"> &middot; {pair.sessions}</span>
        )}
      </p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  treatment: string;
  date: string;
}

export default function ResultsShowcase({ reviews }: { reviews: Review[] }) {
  const displayReviews = reviews.slice(0, 3);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Mobile auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % displayReviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displayReviews.length]);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="REAL RESULTS" />
          <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
            See the Difference
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            Drag the slider to compare. All results are from actual Rani Beauty
            Clinic patients.
          </p>
        </FadeInOnScroll>

        {/* Before/After Slider */}
        <div className="mx-auto mt-12 max-w-3xl">
          {defaultPairs.map((pair) => (
            <FadeInOnScroll key={pair.label}>
              <SliderCard pair={pair} />
            </FadeInOnScroll>
          ))}
        </div>

        {/* Testimonials - Desktop: 3-card grid */}
        <div className="mt-16 hidden md:grid md:grid-cols-3 md:gap-6">
          {displayReviews.map((review) => (
            <TestimonialCard
              key={review.id}
              name={review.name}
              text={review.text}
              rating={review.rating}
              treatment={review.treatment}
              date={review.date}
            />
          ))}
        </div>

        {/* Testimonials - Mobile: single rotating card */}
        <div className="mt-12 md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <TestimonialCard
                name={displayReviews[mobileIndex].name}
                text={displayReviews[mobileIndex].text}
                rating={displayReviews[mobileIndex].rating}
                treatment={displayReviews[mobileIndex].treatment}
                date={displayReviews[mobileIndex].date}
              />
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {displayReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === mobileIndex
                    ? "w-6 bg-rani-gold"
                    : "w-2.5 bg-rani-border"
                }`}
                aria-label={`View testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Links */}
        <FadeInOnScroll>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <Button variant="ghost" href="/results">
              See All Results
            </Button>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
