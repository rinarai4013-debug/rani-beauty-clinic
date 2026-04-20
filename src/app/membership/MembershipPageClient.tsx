"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Star,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Crown,
  Users,
  Calendar,
  Shield,
} from "lucide-react";
import CountUp from "@/components/animations/CountUp";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import { MEMBERSHIP_PAGE_COPY } from "@/data/membership-copy";

/* ────────────────────────────────────────────────────────
   Types & Data
   ──────────────────────────────────────────────────────── */

const tiers = MEMBERSHIP_PAGE_COPY.tiers;
const faqs = MEMBERSHIP_PAGE_COPY.faqs;

/* ────────────────────────────────────────────────────────
   ROI Calculator
   ──────────────────────────────────────────────────────── */

const AVG_TREATMENT_COST = MEMBERSHIP_PAGE_COPY.roi.averageTreatmentCost;

function ROICalculator() {
  const [frequency, setFrequency] = useState(2);

  const yearlyWithout = frequency * AVG_TREATMENT_COST * 12;
  const yearlyWith = MEMBERSHIP_PAGE_COPY.roi.featuredTierMonthlyPrice * 12;
  const savings = yearlyWithout - yearlyWith;

  return (
    <section className="bg-rani-navy py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <FadeInOnScroll>
          <div className="text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-rani-gold">
              ROI Calculator
            </span>
            <div className="mx-auto mt-4 h-0.5 w-[60px] bg-rani-gold" />
            <h2 className="mt-6 font-heading text-3xl font-bold text-white sm:text-4xl">
              See How Much You Save
            </h2>
            <p className="mx-auto mt-3 max-w-lg font-body text-base text-white/60">
              Discover how membership pays for itself - and then some.
            </p>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.2}>
          <div className="mt-12 rounded-2xl border border-rani-gold/20 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
            {/* Slider */}
            <div>
              <label
                htmlFor="freq-slider"
                className="mb-3 block font-body text-sm font-medium text-white/70"
              >
                How often do you get treatments?
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="freq-slider"
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-rani-gold [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rani-gold [&::-webkit-slider-thumb]:shadow-lg"
                />
                <span className="min-w-[60px] text-right font-body text-lg font-bold text-rani-gold">
                  {frequency}x/mo
                </span>
              </div>
            </div>

            {/* Comparison */}
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-5 text-center">
                <p className="font-body text-sm text-white/50">
                  Without Membership
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-white">
                  $
                  <CountUp
                    end={yearlyWithout}
                    duration={1.5}
                    key={`without-${frequency}`}
                  />
                </p>
                <p className="mt-1 font-body text-xs text-white/40">per year</p>
              </div>
              <div className="rounded-xl border border-rani-gold/30 bg-rani-gold/10 p-5 text-center">
                <p className="font-body text-sm text-rani-gold">
                  With {MEMBERSHIP_PAGE_COPY.roi.featuredTierName}
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-white">
                  $
                  <CountUp
                    end={yearlyWith}
                    duration={1.5}
                    key={`with-${frequency}`}
                  />
                </p>
                <p className="mt-1 font-body text-xs text-white/40">per year</p>
              </div>
              <div className="rounded-xl bg-rani-success/10 p-5 text-center">
                <p className="font-body text-sm text-rani-success">
                  You Save
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-rani-success">
                  {savings > 0 ? (
                    <>
                      $
                      <CountUp
                        end={savings}
                        duration={1.5}
                        key={`save-${frequency}`}
                      />
                    </>
                  ) : (
                    <span className="text-white/50">--</span>
                  )}
                </p>
                <p className="mt-1 font-body text-xs text-white/40">per year</p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────
   FAQ Accordion
   ──────────────────────────────────────────────────────── */

function MembershipFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <FadeInOnScroll>
          <div className="text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-rani-gold">
              FAQ
            </span>
            <div className="mx-auto mt-4 h-0.5 w-[60px] bg-rani-gold" />
            <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
              Membership Questions
            </h2>
          </div>
        </FadeInOnScroll>

        <div className="mt-10">
          {faqs.map((faq, i) => (
            <FadeInOnScroll key={i} delay={i * 0.05}>
              <div className="border-b border-rani-border last:border-b-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-rani-gold"
                  aria-expanded={openIndex === i}
                >
                  <span className="pr-4 font-body text-base font-semibold text-rani-navy">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={20} className="text-rani-gold" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 font-body text-sm leading-relaxed text-rani-muted">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────
   Main Client Component
   ──────────────────────────────────────────────────────── */

export default function MembershipPageClient() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-rani-navy pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rani-gold/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-rani-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-rani-gold/30 bg-rani-gold/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-wider text-rani-gold"
          >
            <Crown className="h-4 w-4" />
            Exclusive Membership
          </motion.span>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mx-auto mt-6 h-0.5 w-[60px] bg-rani-gold"
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
          >
            The Glow Membership
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-gray-300"
          >
            Your monthly investment in radiant skin. Premium treatments,
            exclusive perks, and savings that grow with you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-wrap justify-center gap-6"
          >
            {[
              { icon: Shield, text: "No Contracts" },
              { icon: Calendar, text: "Cancel Anytime" },
              { icon: Users, text: "200+ Members" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-2 font-body text-sm text-white/60"
              >
                <Icon className="h-4 w-4 text-rani-gold" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Tier Comparison ── */}
      <section className="bg-rani-cream py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <FadeInOnScroll>
            <div className="text-center">
              <span className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-rani-gold">
                Choose Your Glow
              </span>
              <div className="mx-auto mt-4 h-0.5 w-[60px] bg-rani-gold" />
              <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
                Membership Tiers
              </h2>
              <p className="mx-auto mt-3 max-w-lg font-body text-base text-rani-muted">
                Every tier includes physician-supervised care. Choose the level
                that fits your lifestyle.
              </p>
            </div>
          </FadeInOnScroll>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {tiers.map((tier, i) => (
              <FadeInOnScroll key={tier.name} delay={i * 0.15}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border-2 p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-8 ${
                    tier.highlight
                      ? "border-rani-gold bg-white ring-2 ring-rani-gold/20"
                      : "border-rani-border bg-white"
                  }`}
                >
                  {/* Most Popular Badge */}
                  {tier.badge && (
                    <span className="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 rounded-full bg-rani-gold px-4 py-1 font-body text-xs font-bold uppercase tracking-wider text-rani-navy shadow-md">
                      <Star className="h-3.5 w-3.5" />
                      {tier.badge}
                    </span>
                  )}

                  <h3 className="font-heading text-xl font-bold text-rani-navy">
                    {tier.name}
                  </h3>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-bold text-rani-navy">
                      ${tier.price}
                    </span>
                    <span className="font-body text-sm text-rani-muted">
                      /month
                    </span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-rani-gold" />
                        <span className="font-body text-sm text-rani-text">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="https://booking.mangomint.com/ranibeautyclinic1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg py-3.5 font-body text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                      tier.highlight
                        ? "bg-rani-navy text-white shadow-md hover:bg-rani-navy-light hover:shadow-lg"
                        : "bg-rani-gold/20 text-rani-navy hover:bg-rani-gold"
                    }`}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <ROICalculator />

      {/* ── Social Proof ── */}
      <section className="bg-rani-cream py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeInOnScroll>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rani-gold/20">
              <Users className="h-7 w-7 text-rani-gold" />
            </div>
            <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
              Join 200+ Members Who Glow Every Month
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-base text-rani-muted">
              Our members see an average of 40% savings compared to individual
              treatments - plus exclusive perks you can&apos;t get anywhere else.
            </p>

            {/* Trust metrics */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { value: 200, suffix: "+", label: "Active Members" },
                { value: 40, suffix: "%", label: "Avg. Savings" },
                { value: 4.9, suffix: "", label: "Member Rating" },
                { value: 95, suffix: "%", label: "Retention Rate" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-3xl font-bold text-rani-navy">
                    <CountUp
                      end={stat.value}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </p>
                  <p className="mt-1 font-body text-sm text-rani-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* ── FAQ ── */}
      <MembershipFAQ />

      {/* ── Final CTA ── */}
      <section className="bg-rani-navy py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeInOnScroll>
            <Sparkles className="mx-auto h-8 w-8 text-rani-gold" />
            <h2 className="mt-6 font-heading text-3xl font-bold text-white sm:text-4xl">
              Start Your Glow Journey
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-lg text-white/60">
              No contracts. No sign-up fees. Just radiant skin, month after
              month.
            </p>
            <a
              href="https://booking.mangomint.com/ranibeautyclinic1"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-rani-gold px-10 py-4 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy shadow-lg shadow-rani-gold/20 transition-all duration-300 hover:bg-white hover:shadow-xl"
            >
              Book Your Consultation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </FadeInOnScroll>
        </div>
      </section>
    </>
  );
}
