"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

const previewOptions = [
  "Glow & Radiance",
  "Anti-Aging & Prevention",
  "Body Sculpting & Contouring",
  "Medical Wellness",
];

export default function QuizCTA() {
  return (
    <section className="bg-rani-navy py-20 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left: Messaging */}
          <FadeInOnScroll direction="left">
            <div>
              <SectionLabel label="PERSONALIZED CARE" dark />
              <h2 className="mt-6 font-heading text-3xl font-bold text-white md:text-4xl">
                Your Personalized Treatment Blueprint
              </h2>
              <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-gray-300">
                Answer a few questions about your goals, skin, and history.
                Our clinical team uses your responses to design a protocol
                built around you, not a generic menu.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  href="/quiz"
                  className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                >
                  Start Your Quiz
                </Button>
                <span className="font-body text-xs text-gray-400">
                  Takes 60 seconds
                </span>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Right: Quiz Preview (desktop only) */}
          <FadeInOnScroll direction="right">
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-rani-gold/20 bg-white/5 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={16} className="text-rani-gold" />
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                    Preview
                  </span>
                </div>
                <p className="font-heading text-xl font-bold text-white mb-6">
                  What&apos;s your primary skin goal?
                </p>
                <div className="space-y-3">
                  {previewOptions.map((option) => (
                    <div
                      key={option}
                      className="rounded-xl border border-white/10 px-5 py-4 font-body text-sm text-white/70 transition-colors hover:border-rani-gold/30 hover:bg-white/5"
                    >
                      {option}
                    </div>
                  ))}
                </div>
                <Link
                  href="/quiz"
                  className="mt-6 block text-center font-body text-sm font-semibold text-rani-gold hover:text-rani-gold-light transition-colors"
                >
                  Take the quiz to see your results &rarr;
                </Link>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
