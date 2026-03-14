"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

interface BeforeAfterPair {
  before: string;
  after: string;
  label: string;
}

interface BeforeAfterSliderProps {
  pairs?: BeforeAfterPair[];
}

const defaultPairs: BeforeAfterPair[] = [
  {
    before: "/images/before-after/before-1.webp",
    after: "/images/before-after/after-1.webp",
    label: "Skin Rejuvenation",
  },
];

function SliderCard({ pair }: { pair: BeforeAfterPair }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

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
        alt={`${pair.label} - After`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={pair.before}
          alt={`${pair.label} - Before`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
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
  );
}

export default function BeforeAfterSlider({
  pairs = defaultPairs,
}: BeforeAfterSliderProps) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="TRANSFORMATIONS" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            Real Patients. Real Results.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            Drag the slider to see the transformation. All results are from
            actual Rani Beauty Clinic patients.
          </p>
        </FadeInOnScroll>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-1">
          {pairs.map((pair, i) => (
            <FadeInOnScroll key={pair.label} delay={i * 0.15}>
              <div>
                <SliderCard pair={pair} />
                <p className="mt-3 text-center font-body text-sm font-medium text-rani-navy">
                  {pair.label}
                </p>
              </div>
            </FadeInOnScroll>
          ))}
        </div>

        {/* Additional result gallery with downloaded images */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { src: "/images/services/hydrafacial/1.png", label: "HydraFacial" },
            { src: "/images/services/botox/1.png", label: "Botox" },
            { src: "/images/services/cheekfiller/1.webp", label: "Cheek Filler" },
            { src: "/images/services/lipfiller/1.jpg", label: "Lip Filler" },
            { src: "/images/services/cutera/1.jpg", label: "RF Microneedling" },
            { src: "/images/services/acnescarvipeel/1.png", label: "Acne Scar Treatment" },
            { src: "/images/services/laserhairremovals/fullbodylaser.jpeg", label: "Laser Hair Removal" },
            { src: "/images/before-after/result-1.webp", label: "Skin Glow" },
          ].map((item, i) => (
            <FadeInOnScroll key={item.label} delay={0.1 + i * 0.1}>
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rani-navy/70 to-transparent p-3">
                  <p className="font-body text-xs font-semibold text-white">
                    {item.label}
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          ))}
        </div>

        <FadeInOnScroll delay={0.3}>
          <div className="mt-10 text-center">
            <Button variant="ghost" href="/results">
              View Full Gallery
            </Button>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
