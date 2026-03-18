'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Star,
  CheckCircle2,
  Clock,
  Shield,
  Heart,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  Award,
  Zap,
  Target,
  ArrowRight,
  CreditCard,
  Gift,
  User,
  Activity,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface PlanData {
  id: string;
  clientName: string;
  firstName: string;
  email: string;
  phone: string;
  skinConcerns: string[];
  targetAreas: string[];
  treatmentInterests: string[];
  skinType: string;
  treatmentHistory: string;
  processingStatus: string;
  intakeSummary: string | null;
  programPlan: string | null;
  costBreakdown: string | null;
  timeline: string | null;
  suggestedNextStep: string | null;
  treatmentValue: string | null;
  skinHealthScore: number | null;
  projectedScore: number | null;
  intelligenceReady: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   Animation variants
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   Utility: parse cost string into a number
   ═══════════════════════════════════════════════════════════════ */

function parseCostValue(costStr: string | null): number {
  if (!costStr) return 3500;
  const matches = costStr.match(/\$[\d,]+/g);
  if (!matches) return 3500;
  const values = matches.map((m) => parseInt(m.replace(/[$,]/g, ''), 10));
  // Return the largest value found as the total plan value
  return Math.max(...values) || 3500;
}

/* ═══════════════════════════════════════════════════════════════
   Treatment Packages builder
   ═══════════════════════════════════════════════════════════════ */

interface TreatmentPackage {
  tier: string;
  name: string;
  price: number;
  sessions: number;
  includes: string[];
  highlight?: boolean;
  savings?: string;
  monthlyPayment: number;
}

function buildPackages(plan: PlanData): TreatmentPackage[] {
  const baseValue = parseCostValue(plan.costBreakdown);
  const concerns = plan.skinConcerns;
  const interests = plan.treatmentInterests;

  // Determine primary treatment based on concerns/interests
  const hasAntiAging =
    concerns.some((c) => /aging|wrinkle|fine line|saggy|lax/i.test(c)) ||
    interests.some((i) => /sofwave|botox|filler|tighten/i.test(i));
  const hasSkin =
    concerns.some((c) => /acne|scar|texture|pore|pigment|dark spot|uneven/i.test(c)) ||
    interests.some((i) => /hydrafacial|peel|microneedling|pico/i.test(i));
  const hasWellness =
    interests.some((i) => /glp|weight|vitamin|nad|b12|wellness/i.test(i));

  const goodIncludes: string[] = [];
  const betterIncludes: string[] = [];
  const bestIncludes: string[] = [];

  if (hasAntiAging) {
    goodIncludes.push('Comprehensive Skin Consultation', 'Custom Treatment Plan', 'HydraFacial Signature (1 session)');
    betterIncludes.push('Comprehensive Skin Consultation', 'RF Microneedling (3 sessions)', 'HydraFacial Signature (2 sessions)', 'Medical-Grade Skincare Kit');
    bestIncludes.push('Comprehensive Skin Consultation', 'Sofwave Full Face', 'RF Microneedling (3 sessions)', 'HydraFacial Platinum (3 sessions)', 'Medical-Grade Skincare Kit', 'Priority Scheduling');
  } else if (hasSkin) {
    goodIncludes.push('Comprehensive Skin Consultation', 'VI Peel (1 session)', 'Skincare Assessment');
    betterIncludes.push('Comprehensive Skin Consultation', 'PicoWay (2 sessions)', 'HydraFacial Signature (2 sessions)', 'Rx Skincare Protocol');
    bestIncludes.push('Comprehensive Skin Consultation', 'RF Microneedling (3 sessions)', 'PicoWay (3 sessions)', 'HydraFacial Platinum (3 sessions)', 'Rx Skincare Protocol', 'Priority Scheduling');
  } else if (hasWellness) {
    goodIncludes.push('Wellness Consultation', 'Vitamin Injection Panel', 'Custom Wellness Plan');
    betterIncludes.push('Wellness Consultation', 'GLP-1 Program (3 months)', 'Monthly Vitamin Injections', 'Progress Tracking');
    bestIncludes.push('Wellness Consultation', 'GLP-1 Program (6 months)', 'Weekly Vitamin Injections', 'NAD+ Injection Series', 'Quarterly Labs', 'Dedicated Wellness Coach');
  } else {
    goodIncludes.push('Comprehensive Skin Consultation', 'Custom Treatment Plan', 'HydraFacial Signature (1 session)');
    betterIncludes.push('Comprehensive Skin Consultation', 'Targeted Treatment Series (3 sessions)', 'HydraFacial Signature (2 sessions)', 'Skincare Protocol');
    bestIncludes.push('Comprehensive Skin Consultation', 'Premium Treatment Series (4 sessions)', 'HydraFacial Platinum (3 sessions)', 'Medical-Grade Skincare Kit', 'Rx Skincare Protocol', 'Priority Scheduling');
  }

  const goodPrice = Math.round(baseValue * 0.4);
  const betterPrice = Math.round(baseValue * 0.7);
  const bestPrice = baseValue;

  return [
    {
      tier: 'Essential',
      name: 'Get Started',
      price: goodPrice,
      sessions: goodIncludes.filter((i) => /session/i.test(i)).length || 1,
      includes: goodIncludes,
      monthlyPayment: Math.round(goodPrice / 6),
    },
    {
      tier: 'Recommended',
      name: 'Best Results',
      price: betterPrice,
      sessions: betterIncludes.filter((i) => /session/i.test(i)).length || 3,
      includes: betterIncludes,
      highlight: true,
      savings: `Save ${Math.round(((betterPrice * 1.15 - betterPrice) / (betterPrice * 1.15)) * 100)}%`,
      monthlyPayment: Math.round(betterPrice / 12),
    },
    {
      tier: 'Platinum',
      name: 'Total Transformation',
      price: bestPrice,
      sessions: bestIncludes.filter((i) => /session/i.test(i)).length || 5,
      includes: bestIncludes,
      savings: `Save ${Math.round(((bestPrice * 1.2 - bestPrice) / (bestPrice * 1.2)) * 100)}%`,
      monthlyPayment: Math.round(bestPrice / 18),
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Roadmap Phases
   ═══════════════════════════════════════════════════════════════ */

interface Phase {
  phase: number;
  title: string;
  duration: string;
  description: string;
  icon: typeof Sparkles;
}

function buildRoadmap(plan: PlanData): Phase[] {
  // Parse timeline if available, otherwise provide defaults
  if (plan.timeline) {
    // Try to extract phases from timeline text
    const phases: Phase[] = [];
    const lines = plan.timeline.split(/\n|;|\./).filter((l) => l.trim().length > 10);

    if (lines.length >= 3) {
      const icons = [Target, Zap, TrendingUp, Star];
      const titles = ['Assessment & Preparation', 'Active Treatment', 'Optimization & Enhancement', 'Maintenance & Longevity'];
      const durations = ['Week 1-2', 'Week 3-8', 'Week 9-14', 'Ongoing'];

      for (let i = 0; i < Math.min(lines.length, 4); i++) {
        phases.push({
          phase: i + 1,
          title: titles[i] || `Phase ${i + 1}`,
          duration: durations[i] || `Phase ${i + 1}`,
          description: lines[i].trim(),
          icon: icons[i] || Star,
        });
      }
      return phases;
    }
  }

  return [
    {
      phase: 1,
      title: 'Assessment & Preparation',
      duration: 'Week 1-2',
      description: 'Comprehensive skin analysis, baseline photos, and custom skincare protocol to prepare your skin for optimal treatment results.',
      icon: Target,
    },
    {
      phase: 2,
      title: 'Active Treatment Phase',
      duration: 'Week 3-8',
      description: 'Begin your primary treatment series. Each session builds on the last, progressively addressing your specific concerns.',
      icon: Zap,
    },
    {
      phase: 3,
      title: 'Enhancement & Refinement',
      duration: 'Week 9-14',
      description: 'Fine-tune results with complementary treatments. Target any remaining concerns with precision protocols.',
      icon: TrendingUp,
    },
    {
      phase: 4,
      title: 'Maintenance & Longevity',
      duration: 'Ongoing',
      description: 'Quarterly maintenance sessions and a medical-grade at-home regimen to preserve and extend your results.',
      icon: Star,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Shimmer / Skeleton Component
   ═══════════════════════════════════════════════════════════════ */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] ${className}`}
      style={{ backgroundSize: '200% 100%' }}
    />
  );
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm uppercase tracking-widest text-[#C9A96E] font-semibold">{label}</p>
      <Shimmer className="h-4 w-full bg-[#0F1D2C]/10" />
      <Shimmer className="h-4 w-3/4 bg-[#0F1D2C]/10" />
      <Shimmer className="h-4 w-5/6 bg-[#0F1D2C]/10" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Score Ring Component
   ═══════════════════════════════════════════════════════════════ */

function ScoreRing({
  score,
  maxScore = 100,
  label,
  color,
  size = 140,
}: {
  score: number;
  maxScore?: number;
  label: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(201,169,110,0.15)"
            strokeWidth="8"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - progress }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-3xl font-bold text-[#0F1D2C]">
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-[#0F1D2C]/60">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Section Divider
   ═══════════════════════════════════════════════════════════════ */

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-8 print:py-4">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A96E]/40" />
      <div className="mx-4 h-1.5 w-1.5 rotate-45 bg-[#C9A96E]" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A96E]/40" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function TreatmentPlanClient({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/plan/${planId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load plan');
        }
        const data = await res.json();
        setPlan(data.plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, [planId]);

  const packages = useMemo(() => (plan ? buildPackages(plan) : []), [plan]);
  const roadmap = useMemo(() => (plan ? buildRoadmap(plan) : []), [plan]);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-12 h-12 border-2 border-[#C9A96E] border-t-transparent rounded-full"
          />
          <div>
            <p className="font-heading text-xl text-[#0F1D2C]">Preparing Your Plan</p>
            <p className="text-sm text-[#0F1D2C]/50 mt-1">Crafting your personalized treatment roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !plan) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#0F1D2C]/5 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#0F1D2C]/40" />
          </div>
          <h1 className="font-heading text-2xl text-[#0F1D2C]">Plan Not Found</h1>
          <p className="text-[#0F1D2C]/60 text-sm leading-relaxed">
            {error || 'We could not locate this treatment plan. Please check your link or contact us for assistance.'}
          </p>
          <a
            href="tel:+14252279250"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1D2C] text-white rounded-lg text-sm font-semibold tracking-wide hover:bg-[#1A2A3C] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us: (425) 227-9250
          </a>
        </div>
      </div>
    );
  }

  const totalValue = parseCostValue(plan.costBreakdown);
  const currentScore = plan.skinHealthScore ?? 62;
  const projectedScore = plan.projectedScore ?? 89;
  const mangomintBookingUrl = 'https://booking.mangomint.com/876418';

  return (
    <>
      {/* ─── Print Styles ─── */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, footer, .no-print, .mobile-cta { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F8F6F1] font-body text-[#0F1D2C]">
        {/* ═══════════════════════════════════════════════════════════
           HERO SECTION
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#0F1D2C] text-white">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 25%, #C9A96E 1px, transparent 1px), radial-gradient(circle at 75% 75%, #C9A96E 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          {/* Gold accent line at top */}
          <div className="h-1 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E] to-[#C9A96E]/0" />

          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            {/* Logo */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="mb-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A96E]">
                Rani Beauty Clinic
              </p>
              <div className="mt-2 mx-auto w-12 h-px bg-[#C9A96E]/40" />
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.15}
              className="font-heading text-3xl md:text-5xl lg:text-6xl leading-tight"
            >
              Your Personalized
              <br />
              <span className="text-[#C9A96E]">Treatment Roadmap</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed"
            >
              Prepared exclusively for{' '}
              <span className="text-[#C9A96E] font-semibold">{plan.clientName}</span>
            </motion.p>

            {/* Date */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="mt-4 text-xs uppercase tracking-widest text-white/40"
            >
              Created {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </motion.p>
          </div>

          {/* Bottom curve */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full">
              <path d="M0 60V30C240 0 480 0 720 15C960 30 1200 30 1440 0V60H0Z" fill="#F8F6F1" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
           SKIN HEALTH SCORE
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-16 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Skin Health Assessment
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Where You Are &mdash; Where You&apos;re Going
            </h2>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.15}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-12"
          >
            {plan.skinHealthScore !== null ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
                <ScoreRing score={currentScore} label="Current Score" color="#0F1D2C" />
                <div className="hidden md:flex flex-col items-center gap-2">
                  <ArrowRight className="w-8 h-8 text-[#C9A96E]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-semibold">
                    Your Journey
                  </span>
                </div>
                <div className="flex md:hidden items-center gap-2 -my-2">
                  <div className="h-8 w-px bg-[#C9A96E]/30" />
                  <ChevronRight className="w-5 h-5 text-[#C9A96E]" />
                  <div className="h-8 w-px bg-[#C9A96E]/30" />
                </div>
                <ScoreRing score={projectedScore} label="Projected Score" color="#C9A96E" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
                <ScoreRing score={currentScore} label="Current Score" color="#0F1D2C" />
                <div className="hidden md:flex flex-col items-center gap-2">
                  <ArrowRight className="w-8 h-8 text-[#C9A96E]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-semibold">
                    Your Journey
                  </span>
                </div>
                <div className="flex md:hidden items-center gap-2 -my-2">
                  <div className="h-8 w-px bg-[#C9A96E]/30" />
                  <ChevronRight className="w-5 h-5 text-[#C9A96E]" />
                  <div className="h-8 w-px bg-[#C9A96E]/30" />
                </div>
                <ScoreRing score={projectedScore} label="Projected Score" color="#C9A96E" />
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/10 text-center">
              <p className="text-sm text-[#0F1D2C]/60 leading-relaxed max-w-lg mx-auto">
                Based on your intake assessment, following our recommended plan could improve your overall
                skin health score by{' '}
                <span className="font-semibold text-[#C9A96E]">
                  {projectedScore - currentScore} points
                </span>{' '}
                within the first 90 days.
              </p>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           WHAT WE FOUND
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Clinical Insights
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              What We Found
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            {plan.intakeSummary ? (
              <div className="space-y-6">
                <p className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
                  {plan.intakeSummary}
                </p>

                {/* Concern Tags */}
                {plan.skinConcerns.length > 0 && (
                  <div className="pt-4 border-t border-[#C9A96E]/10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#0F1D2C]/40 mb-3">
                      Primary Concerns Identified
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {plan.skinConcerns.map((concern, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F6F1] rounded-full text-xs font-medium text-[#0F1D2C]/70 border border-[#C9A96E]/15"
                        >
                          <Activity className="w-3 h-3 text-[#C9A96E]" />
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skin Type & History */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#C9A96E]/10">
                  {plan.skinType && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/40">Skin Type</p>
                        <p className="text-sm text-[#0F1D2C]/70 mt-0.5">{plan.skinType}</p>
                      </div>
                    </div>
                  )}
                  {plan.treatmentHistory && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/40">Treatment History</p>
                        <p className="text-sm text-[#0F1D2C]/70 mt-0.5">{plan.treatmentHistory}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <LoadingSkeleton label="Generating Your Analysis..." />
            )}
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           YOUR TREATMENT PLAN (AI Program Plan)
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Custom Protocol
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Your Treatment Plan
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 overflow-hidden"
          >
            {/* Plan header */}
            <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2A3C] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-white">
                    Personalized Aesthetic Program
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Designed for {plan.firstName}&apos;s unique skin profile
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              {plan.programPlan ? (
                <div className="space-y-6">
                  <p className="text-[#0F1D2C]/80 leading-relaxed whitespace-pre-line">
                    {plan.programPlan}
                  </p>

                  {/* Key metrics row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#C9A96E]/10">
                    <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
                      <p className="font-heading text-2xl text-[#0F1D2C]">
                        {plan.treatmentValue
                          ? plan.treatmentValue.match(/\$[\d,]+/)?.[0] || `$${totalValue.toLocaleString()}`
                          : `$${totalValue.toLocaleString()}`}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Plan Value</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
                      <p className="font-heading text-2xl text-[#0F1D2C]">
                        {packages[1]?.sessions || 3}-{packages[2]?.sessions || 5}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Sessions</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
                      <p className="font-heading text-2xl text-[#0F1D2C]">12-16</p>
                      <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Weeks</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
                      <p className="font-heading text-2xl text-[#C9A96E]">90%+</p>
                      <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Confidence</p>
                    </div>
                  </div>
                </div>
              ) : (
                <LoadingSkeleton label="Building Your Treatment Plan..." />
              )}
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           TREATMENT ROADMAP (4 Phase Timeline)
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Journey
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Treatment Roadmap
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#C9A96E]/40 via-[#C9A96E]/20 to-[#C9A96E]/5 hidden md:block" />
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#C9A96E]/40 via-[#C9A96E]/20 to-[#C9A96E]/5 md:hidden" />

            {roadmap.map((phase, i) => {
              const Icon = phase.icon;
              const isLeft = i % 2 === 0;

              return (
                <motion.div
                  key={phase.phase}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.12}
                  className={`relative mb-10 last:mb-0 pl-16 md:pl-0 ${
                    isLeft ? 'md:pr-[calc(50%+2rem)]' : 'md:pl-[calc(50%+2rem)]'
                  }`}
                >
                  {/* Phase dot (mobile) */}
                  <div className="absolute left-3.5 top-2 w-5 h-5 rounded-full bg-[#C9A96E] border-4 border-[#F8F6F1] z-10 md:hidden" />

                  {/* Phase dot (desktop) */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-4 w-8 h-8 rounded-full bg-[#C9A96E] items-center justify-center z-10 shadow-md">
                    <span className="text-xs font-bold text-white">{phase.phase}</span>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5 text-[#C9A96E]" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base text-[#0F1D2C]">{phase.title}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-semibold">
                          {phase.duration}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-[#0F1D2C]/65 leading-relaxed">{phase.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           TREATMENT PACKAGES (Good / Better / Best)
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Choose Your Path
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Treatment Packages
            </h2>
            <p className="mt-3 text-sm text-[#0F1D2C]/50 max-w-lg mx-auto">
              Each package is tailored to your specific needs. All include a comprehensive consultation and
              personalized aftercare protocol.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.tier}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className={`relative rounded-2xl border overflow-hidden flex flex-col ${
                  pkg.highlight
                    ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/10 bg-white'
                    : 'border-[#C9A96E]/15 bg-white'
                }`}
              >
                {/* Highlight badge */}
                {pkg.highlight && (
                  <div className="bg-[#C9A96E] text-white text-[10px] font-bold uppercase tracking-widest text-center py-1.5">
                    Most Popular
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  {/* Tier */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E]">
                    {pkg.tier}
                  </p>
                  <h3 className="font-heading text-xl text-[#0F1D2C] mt-1">{pkg.name}</h3>

                  {/* Price */}
                  <div className="mt-4 mb-1">
                    <span className="font-heading text-3xl text-[#0F1D2C]">
                      ${pkg.price.toLocaleString()}
                    </span>
                    {pkg.savings && (
                      <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {pkg.savings}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#0F1D2C]/40 mb-6">
                    or ${pkg.monthlyPayment}/mo with Cherry
                  </p>

                  {/* Includes */}
                  <ul className="space-y-3 flex-1">
                    {pkg.includes.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#0F1D2C]/70">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href={mangomintBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 block text-center py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                      pkg.highlight
                        ? 'bg-[#C9A96E] text-white hover:bg-[#B8964F] shadow-sm'
                        : 'bg-[#0F1D2C] text-white hover:bg-[#1A2A3C]'
                    }`}
                  >
                    Select {pkg.tier}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           EXPECTED RESULTS
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              What to Expect
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Expected Results
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: 'Week 2-4',
                  description: 'Initial improvement in skin texture and radiance. Hydration levels improve visibly. Skin feels smoother to the touch.',
                },
                {
                  icon: TrendingUp,
                  title: 'Month 2-3',
                  description: 'Significant visible changes. Collagen remodeling begins. Concerns like fine lines, uneven tone, and texture show marked improvement.',
                },
                {
                  icon: Star,
                  title: 'Month 4-6',
                  description: 'Optimal results achieved. Full collagen maturation delivers peak improvement. Maintenance protocol preserves lasting results.',
                },
              ].map((result, i) => {
                const Icon = result.icon;
                return (
                  <div key={i} className="text-center md:text-left">
                    <div className="w-12 h-12 mx-auto md:mx-0 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#C9A96E]" />
                    </div>
                    <h3 className="font-heading text-lg text-[#0F1D2C] mb-2">{result.title}</h3>
                    <p className="text-sm text-[#0F1D2C]/60 leading-relaxed">{result.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8F6F1] rounded-full">
                <Shield className="w-4 h-4 text-[#C9A96E]" />
                <span className="text-xs font-semibold text-[#0F1D2C]/60">
                  Confidence Level: 90%+ based on clinical protocols and your skin profile
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           FINANCING OPTIONS
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Flexible Payment Options
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Financing Made Simple
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-8 md:p-12 text-white overflow-hidden relative"
          >
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A96E]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A96E]/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg">Cherry Financing</h3>
                  <p className="text-xs text-white/50">0% APR available for qualified applicants</p>
                </div>
              </div>

              {/* Payment Calculator Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.tier}
                    className={`rounded-xl p-5 ${
                      pkg.highlight ? 'bg-[#C9A96E]/15 border border-[#C9A96E]/30' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-1">
                      {pkg.tier}
                    </p>
                    <p className="font-heading text-2xl mb-0.5">
                      ${pkg.monthlyPayment}
                      <span className="text-sm text-white/50">/mo</span>
                    </p>
                    <p className="text-xs text-white/40">
                      ${pkg.price.toLocaleString()} over {pkg.price <= 2000 ? 6 : pkg.price <= 4000 ? 12 : 18} months
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">No hard credit check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">Instant approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">0% APR plans available</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           RESERVE YOUR PLAN CTA
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="relative bg-white rounded-2xl shadow-lg border border-[#C9A96E]/20 overflow-hidden"
          >
            {/* Gold accent top */}
            <div className="h-1 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E] to-[#C9A96E]/0" />

            <div className="p-8 md:p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A96E]/10 mb-6"
              >
                <Gift className="w-8 h-8 text-[#C9A96E]" />
              </motion.div>

              <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-3">
                Reserve Your Treatment Plan
              </h2>
              <p className="text-[#0F1D2C]/60 text-base max-w-lg mx-auto mb-2">
                Secure your spot with a $250 fully-refundable consultation deposit.
                This guarantees your pricing and priority scheduling.
              </p>
              <p className="text-xs text-[#0F1D2C]/40 mb-8">
                Your deposit is applied to any treatment package you choose.
              </p>

              <a
                href={mangomintBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-4 bg-[#C9A96E] text-white rounded-xl text-base font-semibold uppercase tracking-wider hover:bg-[#B8964F] transition-all duration-300 shadow-lg shadow-[#C9A96E]/20 hover:shadow-[#C9A96E]/30 hover:scale-[1.02]"
              >
                Reserve with $250 Deposit
                <ArrowRight className="w-5 h-5" />
              </a>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#0F1D2C]/40">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Fully refundable
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  No obligation
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Locks in your pricing
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           YOUR TREATMENT ARCHITECT
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Provider avatar placeholder */}
              <div className="flex-shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C9A96E]/20 to-[#0F1D2C]/5 flex items-center justify-center">
                <User className="w-12 h-12 text-[#C9A96E]/60" />
              </div>

              <div className="text-center md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-1">
                  Your Treatment Architect
                </p>
                <h3 className="font-heading text-xl text-[#0F1D2C]">Dr. Rani</h3>
                <p className="text-sm text-[#0F1D2C]/50 mt-0.5 mb-4">
                  Medical Director &bull; Board-Certified Physician
                </p>
                <p className="text-sm text-[#0F1D2C]/65 leading-relaxed max-w-lg">
                  As a physician-supervised medical aesthetics specialist, Dr. Rani combines clinical
                  expertise with an artistic eye to create natural, transformative results. Every treatment
                  plan is crafted with precision, safety, and your unique goals in mind.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  {['Physician-Supervised', 'Advanced Certifications', 'Personalized Care'].map(
                    (badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F6F1] rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#0F1D2C]/50 border border-[#C9A96E]/10"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#C9A96E]" />
                        {badge}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
           NEXT STEP (from AI)
           ═══════════════════════════════════════════════════════════ */}
        {plan.suggestedNextStep && (
          <>
            <SectionDivider />
            <section className="max-w-4xl mx-auto px-6 py-8 print-avoid-break">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
                className="bg-[#C9A96E]/5 rounded-2xl border border-[#C9A96E]/15 p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#C9A96E]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-1">
                      Suggested Next Step
                    </p>
                    <p className="text-[#0F1D2C]/75 leading-relaxed">{plan.suggestedNextStep}</p>
                  </div>
                </div>
              </motion.div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════════════ */}
        <footer className="bg-[#0F1D2C] text-white mt-12">
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Contact */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Contact
                </p>
                <div className="space-y-3">
                  <a
                    href="tel:+14252279250"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#C9A96E] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    (425) 227-9250
                  </a>
                  <a
                    href="mailto:info@ranibeautyclinic.com"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#C9A96E] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    info@ranibeautyclinic.com
                  </a>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Location
                </p>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70 leading-relaxed">
                    401 Olympia Ave NE #101
                    <br />
                    Renton, WA 98056
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Hours
                </p>
                <div className="space-y-1.5 text-sm text-white/70">
                  <p>Mon - Fri: 10am - 7pm</p>
                  <p>Saturday: 10am - 5pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Fine Print */}
            <div className="mt-10 pt-6 border-t border-white/10 text-center">
              <p className="text-[11px] text-white/30 leading-relaxed max-w-2xl mx-auto">
                This treatment plan is a personalized recommendation based on your intake assessment and is not a
                guarantee of results. Individual results may vary. All treatments are performed under physician
                supervision. Pricing is valid for 30 days from the date shown above. Financing subject to credit
                approval through Cherry Technologies, Inc.
              </p>
              <p className="mt-4 text-[10px] text-white/20 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Rani Beauty Clinic. All Rights Reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
