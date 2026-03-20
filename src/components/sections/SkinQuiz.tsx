"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Zap,
  Sun,
  Droplets,
  Scissors,
  Heart,
  Calendar,
  Clock,
  TrendingUp,
  Star,
} from "lucide-react";

/* ────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */

type ConcernKey =
  | "acne"
  | "aging"
  | "pigmentation"
  | "body-hair"
  | "wellness";

type SkinTypeKey = "normal" | "dry" | "oily" | "combination" | "sensitive";

type BudgetKey = "under-300" | "300-600" | "600-1000" | "investment";

type TimelineKey = "quick" | "event" | "gradual" | "long-term";

interface LeadForm {
  firstName: string;
  email: string;
  phone: string;
}

interface RecommendationTier {
  label: string;
  treatment: string;
  reason: string;
  priceRange: string;
  timeline: string;
}

interface Recommendation {
  good: RecommendationTier;
  better: RecommendationTier;
  best: RecommendationTier;
}

/* ────────────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────────────── */

const concerns: { key: ConcernKey; label: string; icon: typeof Zap }[] = [
  { key: "acne", label: "Acne & Scarring", icon: Droplets },
  { key: "aging", label: "Aging & Wrinkles", icon: Clock },
  { key: "pigmentation", label: "Pigmentation & Sun Damage", icon: Sun },
  { key: "body-hair", label: "Body Contouring & Hair Removal", icon: Scissors },
  { key: "wellness", label: "Wellness & Weight Management", icon: Heart },
];

const skinTypes: { key: SkinTypeKey; label: string }[] = [
  { key: "normal", label: "Normal" },
  { key: "dry", label: "Dry" },
  { key: "oily", label: "Oily" },
  { key: "combination", label: "Combination" },
  { key: "sensitive", label: "Sensitive" },
];

const budgets: { key: BudgetKey; label: string; subtext: string }[] = [
  { key: "under-300", label: "Under $300", subtext: "per session" },
  { key: "300-600", label: "$300 - $600", subtext: "per session" },
  { key: "600-1000", label: "$600 - $1,000", subtext: "per session" },
  {
    key: "investment",
    label: "Investment-Focused",
    subtext: "Best results regardless of cost",
  },
];

const timelines: { key: TimelineKey; label: string; subtext: string; icon: typeof Zap }[] =
  [
    { key: "quick", label: "Quick Fix", subtext: "This week", icon: Zap },
    {
      key: "event",
      label: "Upcoming Event",
      subtext: "2-4 weeks",
      icon: Calendar,
    },
    {
      key: "gradual",
      label: "Gradual Improvement",
      subtext: "1-3 months",
      icon: TrendingUp,
    },
    {
      key: "long-term",
      label: "Long-Term Transformation",
      subtext: "3-6 months",
      icon: Star,
    },
  ];

/* ────────────────────────────────────────────────────────
   Recommendation logic
   ──────────────────────────────────────────────────────── */

function getRecommendations(concern: ConcernKey): Recommendation {
  const map: Record<ConcernKey, Recommendation> = {
    acne: {
      good: {
        label: "Good",
        treatment: "Chemical Peel",
        reason:
          "A targeted chemical peel addresses active acne and surface scarring by accelerating cell turnover and unclogging pores.",
        priceRange: "$150 - $250",
        timeline: "Visible improvement in 1-2 weeks",
      },
      better: {
        label: "Better",
        treatment: "RF Microneedling",
        reason:
          "Radiofrequency microneedling stimulates deep collagen production to remodel acne scars while reducing active breakouts.",
        priceRange: "$400 - $700",
        timeline: "Progressive results over 4-8 weeks",
      },
      best: {
        label: "Best",
        treatment: "RF Microneedling + BioRePeel Combo",
        reason:
          "The combined approach tackles scars from within via RF microneedling while BioRePeel resurfaces the top layers for comprehensive skin renewal.",
        priceRange: "$700 - $1,100",
        timeline: "Dramatic improvement in 6-12 weeks",
      },
    },
    aging: {
      good: {
        label: "Good",
        treatment: "Botox",
        reason:
          "Botox relaxes overactive facial muscles to smooth fine lines and prevent new wrinkles from forming.",
        priceRange: "$200 - $500",
        timeline: "Results visible in 3-7 days",
      },
      better: {
        label: "Better",
        treatment: "Botox + HydraFacial",
        reason:
          "Combining Botox with a HydraFacial adds intense hydration and antioxidant infusion for a smoother, more radiant complexion.",
        priceRange: "$400 - $700",
        timeline: "Immediate glow, full Botox effect in 1 week",
      },
      best: {
        label: "Best",
        treatment: "Sofwave + Botox + Fillers",
        reason:
          "A comprehensive anti-aging protocol: Sofwave tightens skin at the deepest level, Botox smooths dynamic lines, and fillers restore lost volume.",
        priceRange: "$1,500 - $3,000",
        timeline: "Full transformation over 2-4 weeks",
      },
    },
    pigmentation: {
      good: {
        label: "Good",
        treatment: "VI Peel",
        reason:
          "The VI Peel targets melanin overproduction and sun damage with a medical-grade formula that brightens skin tone evenly.",
        priceRange: "$200 - $350",
        timeline: "Peeling in 3-5 days, fresh skin in 1-2 weeks",
      },
      better: {
        label: "Better",
        treatment: "PicoWay Laser",
        reason:
          "PicoWay uses ultra-short laser pulses to shatter pigment particles at a cellular level for faster, more targeted clearance.",
        priceRange: "$400 - $800",
        timeline: "Noticeable fading after 1-2 sessions",
      },
      best: {
        label: "Best",
        treatment: "PicoWay + HydraFacial Series",
        reason:
          "PicoWay eliminates deep pigment while a HydraFacial series maintains hydration and delivers brightening serums between laser sessions.",
        priceRange: "$900 - $1,500",
        timeline: "Significant improvement over 4-8 weeks",
      },
    },
    "body-hair": {
      good: {
        label: "Good",
        treatment: "Laser Hair Removal (Single Area)",
        reason:
          "Our Candela GentleMax Pro Plus offers safe, effective permanent hair reduction for a single target area.",
        priceRange: "$100 - $300",
        timeline: "6-8 sessions for optimal results",
      },
      better: {
        label: "Better",
        treatment: "Laser Hair Removal (Package)",
        reason:
          "A multi-area package covers your most common treatment zones with savings built into the series pricing.",
        priceRange: "$500 - $1,200",
        timeline: "6-8 sessions, smooth skin within 3-4 months",
      },
      best: {
        label: "Best",
        treatment: "Full Body Laser Package",
        reason:
          "The ultimate solution for total body smoothness covering all major areas with maximum per-session savings.",
        priceRange: "$2,000 - $4,000",
        timeline: "Complete transformation in 4-6 months",
      },
    },
    wellness: {
      good: {
        label: "Good",
        treatment: "Vitamin Injections",
        reason:
          "Targeted vitamin injections (B12, D, biotin) boost energy, metabolism, and overall vitality from the inside out.",
        priceRange: "$50 - $150",
        timeline: "Energy boost within 24-48 hours",
      },
      better: {
        label: "Better",
        treatment: "GLP-1 Weight Management",
        reason:
          "FDA-approved GLP-1 medications combined with physician monitoring support sustainable weight loss and metabolic health.",
        priceRange: "$400 - $800/mo",
        timeline: "Noticeable results in 4-8 weeks",
      },
      best: {
        label: "Best",
        treatment: "GLP-1 + NAD+ + Hormone Therapy",
        reason:
          "A comprehensive wellness protocol combining weight management, cellular rejuvenation, and hormonal optimization for total body transformation.",
        priceRange: "$800 - $1,500/mo",
        timeline: "Progressive transformation over 3-6 months",
      },
    },
  };

  return map[concern];
}

/* ────────────────────────────────────────────────────────
   Animation variants
   ──────────────────────────────────────────────────────── */

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

/* ────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */

export default function SkinQuiz() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [concern, setConcern] = useState<ConcernKey | null>(null);
  const [skinType, setSkinType] = useState<SkinTypeKey | null>(null);
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [timeline, setTimeline] = useState<TimelineKey | null>(null);
  const [lead, setLead] = useState<LeadForm>({
    firstName: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const quizStartFired = useRef(false);

  // Fire quiz_started on first render
  useEffect(() => {
    if (!quizStartFired.current) {
      quizStartFired.current = true;
      trackAnalyticsEvent('quiz_started', {});
    }
  }, []);

  const canProceed = useCallback(() => {
    switch (step) {
      case 0:
        return concern !== null;
      case 1:
        return skinType !== null;
      case 2:
        return budget !== null;
      case 3:
        return timeline !== null;
      case 4:
        return lead.firstName.trim() !== "" && lead.email.trim() !== "";
      default:
        return false;
    }
  }, [step, concern, skinType, budget, timeline, lead]);

  const goNext = () => {
    if (!canProceed()) return;
    setDirection(1);

    // Track step completion
    const stepNames = ['concern', 'skin_type', 'budget', 'timeline', 'contact_info'];
    const answers = [concern, skinType, budget, timeline, 'form'];
    trackAnalyticsEvent('quiz_step_completed', {
      step_number: step + 1,
      step_name: stepNames[step],
      answer: String(answers[step] || ''),
    });

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!lead.firstName.trim() || !lead.email.trim()) {
      setError("Please fill in your first name and email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.firstName.trim(),
          email: lead.email.trim(),
          phone: lead.phone.trim() || undefined,
          source: "skin-quiz",
          quizAnswers: {
            concern,
            skinType,
            budget,
            timeline,
          },
        }),
      });
    } catch {
      // Non-blocking: quiz results still show
    } finally {
      setIsSubmitting(false);
      setShowResults(true);

      // Track quiz completion + lead
      trackAnalyticsEvent('quiz_completed', {
        result_type: concern || '',
        recommended_services: concern ? Object.values(getRecommendations(concern)).map((r: RecommendationTier) => r.treatment).join(', ') : '',
      });
      trackAnalyticsEvent('lead_submitted', {
        form_type: 'skin_quiz',
        service_interest: concern || '',
        lead_source: 'quiz',
      });
    }
  };

  /* ── Results Page ── */
  if (showResults && concern) {
    const recs = getRecommendations(concern);
    const tierColors = {
      good: "border-rani-border",
      better: "border-rani-gold/50",
      best: "border-rani-gold ring-2 ring-rani-gold/20",
    };
    const tierBg = {
      good: "bg-white",
      better: "bg-white",
      best: "bg-rani-cream",
    };
    const tierBadge = {
      good: "bg-rani-muted/10 text-rani-muted",
      better: "bg-rani-gold/20 text-rani-navy",
      best: "bg-rani-gold text-rani-navy",
    };

    return (
      <div className="min-h-screen bg-rani-cream">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rani-gold/20">
              <Sparkles className="h-8 w-8 text-rani-gold" />
            </div>
            <h2 className="font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
              Your Personalized Treatment Plan
            </h2>
            <p className="mx-auto mt-3 max-w-lg font-body text-base text-rani-muted">
              Based on your answers, here are our top recommendations tailored
              just for you, {lead.firstName}.
            </p>
          </motion.div>

          {/* 3-tier cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(["good", "better", "best"] as const).map((tier, i) => {
              const rec = recs[tier];
              return (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                  className={`relative flex flex-col rounded-2xl border-2 ${tierColors[tier]} ${tierBg[tier]} p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-8`}
                >
                  {/* Badge */}
                  <span
                    className={`mb-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-bold uppercase tracking-wider ${tierBadge[tier]}`}
                  >
                    {tier === "best" && <Star className="h-3.5 w-3.5" />}
                    {rec.label}
                  </span>

                  <h3 className="font-heading text-xl font-bold text-rani-navy sm:text-2xl">
                    {rec.treatment}
                  </h3>

                  <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-rani-muted">
                    {rec.reason}
                  </p>

                  <div className="mt-6 space-y-2 border-t border-rani-border pt-4">
                    <div className="flex items-center justify-between font-body text-sm">
                      <span className="text-rani-muted">Price Range</span>
                      <span className="font-semibold text-rani-navy">
                        {rec.priceRange}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-body text-sm">
                      <span className="text-rani-muted">Timeline</span>
                      <span className="font-semibold text-rani-navy">
                        {rec.timeline}
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://booking.mangomint.com/876418"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 font-body text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                      tier === "best"
                        ? "bg-rani-navy text-white hover:bg-rani-navy-light shadow-md hover:shadow-lg"
                        : "bg-rani-gold/20 text-rani-navy hover:bg-rani-gold"
                    }`}
                  >
                    Book This Treatment
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </motion.div>
              );
            })}
          </div>

          {/* Retake */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-10 text-center"
          >
            <button
              onClick={() => {
                setStep(0);
                setConcern(null);
                setSkinType(null);
                setBudget(null);
                setTimeline(null);
                setLead({ firstName: "", email: "", phone: "" });
                setShowResults(false);
                setError("");
              }}
              className="font-body text-sm font-medium text-rani-muted underline-offset-4 transition-colors hover:text-rani-navy hover:underline"
            >
              Retake Quiz
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Quiz Steps ── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-rani-cream px-4 py-12 sm:py-20">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between font-body text-sm text-rani-muted">
            <span>
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-rani-border">
            <motion.div
              className="h-full rounded-full bg-rani-gold"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Quiz Card */}
        <div className="min-h-[480px] overflow-hidden rounded-2xl border border-rani-border bg-white p-6 shadow-sm sm:p-10">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0 — Primary Concern */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
                  What&apos;s your primary concern?
                </h3>
                <p className="mt-2 font-body text-sm text-rani-muted">
                  Select the area you&apos;d like to focus on most.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {concerns.map((c) => {
                    const Icon = c.icon;
                    const isSelected = concern === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setConcern(c.key)}
                        className={`group flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-rani-gold bg-rani-gold/10 shadow-sm"
                            : "border-rani-border bg-white hover:border-rani-gold/40 hover:bg-rani-cream"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                            isSelected
                              ? "bg-rani-gold text-rani-navy"
                              : "bg-rani-cream text-rani-muted group-hover:bg-rani-gold/20"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span
                          className={`font-body text-sm font-semibold ${
                            isSelected ? "text-rani-navy" : "text-rani-text"
                          }`}
                        >
                          {c.label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="ml-auto h-5 w-5 flex-shrink-0 text-rani-gold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 1 — Skin Type */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
                  What&apos;s your skin type?
                </h3>
                <p className="mt-2 font-body text-sm text-rani-muted">
                  This helps us choose products and protocols that work best for
                  your skin.
                </p>
                <div className="mt-8 space-y-3">
                  {skinTypes.map((s) => {
                    const isSelected = skinType === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSkinType(s.key)}
                        className={`flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-rani-gold bg-rani-gold/10"
                            : "border-rani-border bg-white hover:border-rani-gold/40 hover:bg-rani-cream"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-rani-gold bg-rani-gold"
                              : "border-rani-muted/40"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="h-2 w-2 rounded-full bg-white"
                            />
                          )}
                        </span>
                        <span
                          className={`font-body text-sm font-semibold ${
                            isSelected ? "text-rani-navy" : "text-rani-text"
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Budget */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
                  What&apos;s your budget range?
                </h3>
                <p className="mt-2 font-body text-sm text-rani-muted">
                  We&apos;ll tailor recommendations to fit your investment level.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {budgets.map((b) => {
                    const isSelected = budget === b.key;
                    return (
                      <button
                        key={b.key}
                        onClick={() => setBudget(b.key)}
                        className={`rounded-xl border-2 px-5 py-5 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-rani-gold bg-rani-gold/10 shadow-sm"
                            : "border-rani-border bg-white hover:border-rani-gold/40 hover:bg-rani-cream"
                        }`}
                      >
                        <span
                          className={`block font-body text-base font-bold ${
                            isSelected ? "text-rani-navy" : "text-rani-text"
                          }`}
                        >
                          {b.label}
                        </span>
                        <span className="mt-0.5 block font-body text-xs text-rani-muted">
                          {b.subtext}
                        </span>
                        {isSelected && (
                          <CheckCircle className="mt-2 h-5 w-5 text-rani-gold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3 — Timeline */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
                  What&apos;s your ideal timeline?
                </h3>
                <p className="mt-2 font-body text-sm text-rani-muted">
                  Understanding your urgency helps us prioritize the right
                  treatments.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {timelines.map((t) => {
                    const Icon = t.icon;
                    const isSelected = timeline === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTimeline(t.key)}
                        className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-rani-gold bg-rani-gold/10 shadow-sm"
                            : "border-rani-border bg-white hover:border-rani-gold/40 hover:bg-rani-cream"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                            isSelected
                              ? "bg-rani-gold text-rani-navy"
                              : "bg-rani-cream text-rani-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <span
                            className={`block font-body text-sm font-semibold ${
                              isSelected ? "text-rani-navy" : "text-rani-text"
                            }`}
                          >
                            {t.label}
                          </span>
                          <span className="mt-0.5 block font-body text-xs text-rani-muted">
                            {t.subtext}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4 — Lead Capture */}
            {step === 4 && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
                  Almost there!
                </h3>
                <p className="mt-2 font-body text-sm text-rani-muted">
                  Enter your details to unlock your personalized treatment plan.
                </p>

                <div className="mt-8 space-y-5">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="sq-first"
                      className="mb-1.5 block font-body text-sm font-medium text-rani-navy"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sq-first"
                      type="text"
                      value={lead.firstName}
                      onChange={(e) =>
                        setLead((l) => ({ ...l, firstName: e.target.value }))
                      }
                      placeholder="Jane"
                      className="w-full rounded-xl border-2 border-rani-border bg-white px-5 py-3 font-body text-sm text-rani-text placeholder-rani-muted/50 outline-none transition-all focus:border-rani-gold focus:ring-0"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="sq-email"
                      className="mb-1.5 block font-body text-sm font-medium text-rani-navy"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sq-email"
                      type="email"
                      value={lead.email}
                      onChange={(e) =>
                        setLead((l) => ({ ...l, email: e.target.value }))
                      }
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border-2 border-rani-border bg-white px-5 py-3 font-body text-sm text-rani-text placeholder-rani-muted/50 outline-none transition-all focus:border-rani-gold focus:ring-0"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="sq-phone"
                      className="mb-1.5 block font-body text-sm font-medium text-rani-navy"
                    >
                      Phone Number{" "}
                      <span className="text-rani-muted">(optional)</span>
                    </label>
                    <input
                      id="sq-phone"
                      type="tel"
                      value={lead.phone}
                      onChange={(e) =>
                        setLead((l) => ({ ...l, phone: e.target.value }))
                      }
                      placeholder="(555) 123-4567"
                      className="w-full rounded-xl border-2 border-rani-border bg-white px-5 py-3 font-body text-sm text-rani-text placeholder-rani-muted/50 outline-none transition-all focus:border-rani-gold focus:ring-0"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-body text-sm text-red-500"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={step === 0}
              className={`inline-flex items-center gap-2 rounded-lg border border-rani-border px-5 py-2.5 font-body text-sm font-medium transition-all duration-300 ${
                step === 0
                  ? "cursor-not-allowed text-rani-muted/40"
                  : "text-rani-muted hover:border-rani-gold hover:text-rani-navy"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className={`group inline-flex items-center gap-2 rounded-lg px-7 py-2.5 font-body text-sm font-semibold uppercase tracking-wider shadow-sm transition-all duration-300 ${
                  canProceed()
                    ? "bg-rani-navy text-white hover:bg-rani-navy-light hover:shadow-md"
                    : "cursor-not-allowed bg-rani-border text-rani-muted/50"
                }`}
              >
                Next
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="group inline-flex items-center gap-2 rounded-lg bg-rani-gold px-7 py-2.5 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy shadow-sm transition-all duration-300 hover:bg-rani-gold-light hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Get My Personalized Plan
                    <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
