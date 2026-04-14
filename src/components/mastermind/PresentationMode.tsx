'use client';

/**
 * PresentationMode — Full-screen 5-slide consultation presentation
 *
 * Reads entirely from MastermindSession via useMastermindFlow.
 * No bespoke view models — all data derived from session selectors.
 *
 * Slides:
 * 1. Aura Score — overall score, grade, skin age, peer percentile
 * 2. Concern Breakdown — detected concerns with severity + zones
 * 3. Treatment Plan — phased plan with sequencing + AI summary
 * 4. Simulation — dual-path with/without treatment comparison
 * 5. Package Selection — 3-tier packages + financing + CTA
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Search,
  Sparkles,
  ArrowRight,
  Gift,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  CheckCircle2,
} from 'lucide-react';
import type { MastermindSession } from '@/types/mastermind';
import type { SlideId, SlideConfig } from '@/lib/mastermind/index';
import PackageSelector from './PackageSelector';
import FinancingCalculator from './FinancingCalculator';
import type { GeneratedPackage } from '@/lib/plan-builder/types';
import type { FinancingOption } from '@/lib/mastermind/index';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import {
  getPackagesForRecommendation,
  type MetabolicPackageOption,
} from '@/lib/metabolic/boomrx-matrix';
import { buildDosagePlan } from '@/lib/metabolic/dosing-engine';
import {
  generateMetabolicRecommendation,
  type FulfillmentOption,
  type MetabolicGoal,
  type MetabolicIntake,
  type MetabolicRecommendation,
  type MetabolicSymptom,
} from '@/lib/metabolic/matrix';

// ── Props ──

interface PresentationModeProps {
  session: MastermindSession;
  slides: SlideConfig[];
  currentSlideIndex: number;
  onGoToSlide: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onSelectPackage: (tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => void;
  onGeneratePdf: () => Promise<string | null>;
  onComplete: () => Promise<unknown>;
  selectedPackage: GeneratedPackage | null;
  financingOptions: FinancingOption[];
  selectedFinancing: FinancingOption | null;
  onSelectFinancing: (months: number | null) => void;
  pdfLoading: boolean;
  completing: boolean;
  scoreProjection: {
    current: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
    withoutOneYear: number;
    skinAgeCurrent: number;
    skinAgeProjected: number;
    chronologicalAge: number;
  } | null;
  costOfDelay: {
    currentPlanCost: number;
    costIfDelayed1Year: number;
    costIfDelayed3Years: number;
    reasoning: string;
  } | null;
  comparisonMetrics: {
    auraScoreDelta: number;
    skinAgeDelta: number;
    keyDifferentiators: string[];
  } | null;
}

// ── Icon Map ──

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Search,
  Sparkles,
  ArrowRight,
  Gift,
};

// ── Slide Animations ──

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function PresentationMode({
  session,
  slides,
  currentSlideIndex,
  onGoToSlide,
  onNext,
  onPrev,
  onExit,
  onSelectPackage,
  onGeneratePdf,
  onComplete,
  selectedPackage,
  financingOptions,
  selectedFinancing,
  onSelectFinancing,
  pdfLoading,
  completing,
  scoreProjection,
  costOfDelay,
  comparisonMetrics,
}: PresentationModeProps) {
  const currentSlide = slides[currentSlideIndex];
  const isFirst = currentSlideIndex === 0;
  const isLast = currentSlideIndex === slides.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (!isLast) onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) onPrev();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onNext, onPrev, onExit]);

  // Touch swipe navigation (iPad/mobile)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const SWIPE_THRESHOLD = 60;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0 && !isLast) onNext(); // swipe left = next
        if (deltaX > 0 && !isFirst) onPrev(); // swipe right = prev
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [isFirst, isLast, onNext, onPrev]
  );

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1D2C] flex flex-col" style={{ height: '100dvh' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0F1D2C]/80 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-heading)] text-white/80 text-sm tracking-wider uppercase">
            Rani Beauty Clinic
          </span>
          <span className="text-[#C9A96E] text-xs">|</span>
          <span className="text-white/40 text-xs font-body">
            {session.patientName}
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          aria-label="Exit presentation"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Slide Content — touch swipe enabled */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentSlide.id}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="h-full"
          >
            {renderSlide(currentSlide.id, {
              session,
              scoreProjection,
              costOfDelay,
              comparisonMetrics,
              selectedPackage,
              financingOptions,
              selectedFinancing,
              onSelectPackage,
              onSelectFinancing,
              onGeneratePdf,
              onComplete,
              pdfLoading,
              completing,
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation — touch-friendly 44px+ targets */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#0F1D2C]/80 backdrop-blur-sm border-t border-white/5 safe-area-pb">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Prev */}
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center gap-2 min-w-[44px] min-h-[44px] px-4 py-2.5 rounded-xl text-white/60 hover:text-white active:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-body text-sm hidden sm:inline">Back</span>
          </button>

          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => {
              const Icon = ICON_MAP[slide.icon] || Activity;
              const isActive = i === currentSlideIndex;
              const isPast = i < currentSlideIndex;

              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => onGoToSlide(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-body ${
                    isActive
                      ? 'bg-[#C9A96E] text-[#0F1D2C]'
                      : isPast
                        ? 'bg-white/10 text-white/60'
                        : 'bg-white/5 text-white/30 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{slide.title}</span>
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="flex items-center gap-2 min-w-[44px] min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C9A96E] text-[#0F1D2C] font-body text-sm font-medium disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#C9A96E]/90 active:bg-[#C9A96E]/80 transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Slide Renderers ──

interface SlideProps {
  session: MastermindSession;
  scoreProjection: PresentationModeProps['scoreProjection'];
  costOfDelay: PresentationModeProps['costOfDelay'];
  comparisonMetrics: PresentationModeProps['comparisonMetrics'];
  selectedPackage: GeneratedPackage | null;
  financingOptions: FinancingOption[];
  selectedFinancing: FinancingOption | null;
  onSelectPackage: (tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => void;
  onSelectFinancing: (months: number | null) => void;
  onGeneratePdf: () => Promise<string | null>;
  onComplete: () => Promise<unknown>;
  pdfLoading: boolean;
  completing: boolean;
}

function renderSlide(slideId: SlideId, props: SlideProps) {
  switch (slideId) {
    case 'aura-score':
      return <AuraScoreSlide {...props} />;
    case 'concern-breakdown':
      return <ConcernBreakdownSlide {...props} />;
    case 'treatment-plan':
      return <TreatmentPlanSlide {...props} />;
    case 'simulation':
      return <SimulationSlide {...props} />;
    case 'package-selection':
      return <PackageSelectionSlide {...props} />;
    default:
      return null;
  }
}

// ── Slide 1: Aura Score ──

function AuraScoreSlide({ session, scoreProjection }: SlideProps) {
  const scan = session.auraScanResult;
  if (!scan) return <EmptySlide message="Scan data not available" />;

  const { auraScore, auraDeviceAnalysis } = scan;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center space-y-8 max-w-2xl"
      >
        {/* Big Score Ring */}
        <div className="relative w-48 h-48 mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="#C9A96E"
              strokeWidth="8"
              strokeDasharray={`${(auraScore.overall / 100) * 264} 264`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white font-[family-name:var(--font-heading)]">
              {auraScore.overall}
            </span>
            <span className="text-[#C9A96E] text-sm font-body font-medium mt-1">
              {auraScore.grade} — {auraScore.label}
            </span>
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-heading)] text-3xl text-white">
          Your Aura Score
        </h2>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-6">
          <MetricCard
            label="Skin Age"
            value={`${auraScore.skinAge}`}
            unit="years"
            subtitle={`Chronological: ${auraScore.chronologicalAge}`}
            accent={auraScore.skinAgeDelta > 0 ? '#DC2626' : '#059669'}
          />
          <MetricCard
            label="Peer Ranking"
            value={`${auraScore.percentile}th`}
            unit="percentile"
            subtitle="vs. same age group"
            accent="#C9A96E"
          />
          <MetricCard
            label="Projected Score"
            value={scoreProjection ? `${scoreProjection.sixMonth}` : '—'}
            unit="in 6 months"
            subtitle={scoreProjection ? `+${scoreProjection.sixMonth - auraScore.overall} points` : ''}
            accent="#059669"
          />
        </div>

        {/* AURA 5-Category Grid */}
        <div className="grid grid-cols-5 gap-3 mt-8">
          {auraDeviceAnalysis.categories.map((cat) => (
            <div
              key={cat.category}
              className="bg-white/5 rounded-xl p-3 text-center border border-white/5"
            >
              <div className="text-2xl font-bold text-white font-[family-name:var(--font-heading)]">
                {cat.absoluteScore.toFixed(1)}
              </div>
              <div className="text-xs text-white/40 font-body mt-1">{cat.label}</div>
              <div
                className={`text-xs font-body mt-1 ${
                  cat.peerScore > 0 ? 'text-red-400' : cat.peerScore < 0 ? 'text-green-400' : 'text-white/30'
                }`}
              >
                {cat.peerScore > 0 ? '+' : ''}{cat.peerScore.toFixed(1)} vs peers
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Slide 2: Concern Breakdown ──

function ConcernBreakdownSlide({ session }: SlideProps) {
  const scan = session.auraScanResult;
  if (!scan) return <EmptySlide message="Scan data not available" />;

  const concerns = scan.detectedConcerns;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl text-white">
            What We Found
          </h2>
          <p className="font-body text-white/40 mt-2">
            {concerns.length} concerns identified across{' '}
            {new Set(concerns.flatMap((c) => c.zones)).size} facial zones
          </p>
        </div>

        <div className="space-y-4">
          {concerns.map((concern, i) => (
            <motion.div
              key={concern.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 * i }}
              className="bg-white/5 rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <SeverityDot severity={concern.severity} />
                    <h3 className="font-[family-name:var(--font-heading)] text-lg text-white capitalize">
                      {concern.concern.replace(/_/g, ' ')}
                    </h3>
                    <span
                      className={`text-xs font-body px-2 py-0.5 rounded-full ${
                        concern.urgency === 'high'
                          ? 'bg-red-500/20 text-red-300'
                          : concern.urgency === 'medium'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {concern.urgency} priority
                    </span>
                  </div>
                  <p className="font-body text-sm text-white/60 mt-2">
                    {concern.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-white/30 font-body">Zones:</span>
                    {concern.zones.slice(0, 4).map((zone) => (
                      <span
                        key={zone}
                        className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded font-body capitalize"
                      >
                        {zone.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score ring */}
                <div className="relative w-16 h-16 flex-shrink-0 ml-4">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"
                    />
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke={severityColor(concern.severity)}
                      strokeWidth="3"
                      strokeDasharray={`${(concern.score / 100) * 88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{concern.score}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slide 3: Treatment Plan ──

function TreatmentPlanSlide({ session }: SlideProps) {
  const plan = session.mastermindPlan;
  if (!plan) return <EmptySlide message="Treatment plan not generated yet" />;

  const allTreatments = [
    ...plan.recommendations.primary.map((t) => ({ ...t, tier: 'Primary' as const })),
    ...plan.recommendations.complementary.map((t) => ({ ...t, tier: 'Complementary' as const })),
    ...plan.recommendations.maintenance.map((t) => ({ ...t, tier: 'Maintenance' as const })),
  ];

  return (
    <div className="flex flex-col items-center min-h-full px-6 py-12">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl text-white">
            Your Transformation Plan
          </h2>
          <p className="font-body text-white/40 mt-2 max-w-xl mx-auto">
            {plan.aiSummary.patientFacing}
          </p>
        </div>

        {/* Key Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {plan.aiSummary.keyHighlights.slice(0, 3).map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-full px-4 py-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
              <span className="font-body text-xs text-[#C9A96E]">{h}</span>
            </div>
          ))}
        </div>

        {/* Treatment Timeline */}
        <div className="space-y-3">
          {plan.sequencing.map((phase, i) => (
            <motion.div
              key={phase.phase}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 * i }}
              className="bg-white/5 rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center">
                  <span className="text-[#C9A96E] font-bold text-sm">{phase.phase}</span>
                </div>
                <div>
                  <h3 className="font-body text-sm font-semibold text-white">
                    {phase.phaseName}
                  </h3>
                  <span className="font-body text-xs text-white/30">{phase.duration}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {phase.treatments.map((t) => {
                  const details = allTreatments.find((at) => at.id === t.treatmentId);
                  return (
                    <div
                      key={`${t.treatmentId}_${t.sessionNumber}`}
                      className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          details?.tier === 'Primary'
                            ? 'bg-[#C9A96E]'
                            : details?.tier === 'Complementary'
                              ? 'bg-blue-400'
                              : 'bg-green-400'
                        }`}
                      />
                      <span className="font-body text-xs text-white/70">
                        {details?.treatmentName || t.treatmentId}
                      </span>
                      <span className="text-xs text-white/20 ml-auto font-body">
                        Week {t.week}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="font-body text-xs text-[#C9A96E]/60 mt-3 italic">
                {phase.expectedMilestone}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slide 4: Simulation ──

function SimulationSlide({ session, comparisonMetrics, costOfDelay }: SlideProps) {
  const sim = session.simulationComparison;
  if (!sim) return <EmptySlide message="Simulation not generated yet" />;

  const withFrame = sim.withTreatment.frames[sim.withTreatment.frames.length - 1];
  const withoutFrame = sim.withoutTreatment.frames[sim.withoutTreatment.frames.length - 1];

  return (
    <div className="flex flex-col items-center min-h-full px-6 py-12">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl text-white">
            Your Future Self
          </h2>
          <p className="font-body text-white/40 mt-2">
            Two paths — one choice
          </p>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-green-400 font-[family-name:var(--font-heading)]">
              {withFrame?.auraScoreProjection || '—'}
            </div>
            <div className="text-xs text-green-400/60 font-body mt-1">With Treatment (1Y)</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-white font-[family-name:var(--font-heading)]">
              {session.auraScanResult?.auraScore.overall || '—'}
            </div>
            <div className="text-xs text-white/40 font-body mt-1">Current</div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-red-400 font-[family-name:var(--font-heading)]">
              {withoutFrame?.auraScoreProjection || '—'}
            </div>
            <div className="text-xs text-red-400/60 font-body mt-1">Without Treatment (1Y)</div>
          </div>
        </div>

        {/* Key Differentiators */}
        {comparisonMetrics && (
          <div className="space-y-2">
            {comparisonMetrics.keyDifferentiators.map((diff, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <ArrowRight className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                <span className="font-body text-sm text-white/70">{diff}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cost of Delay */}
        {costOfDelay && (
          <div className="bg-gradient-to-r from-[#C9A96E]/10 to-transparent border border-[#C9A96E]/20 rounded-2xl p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-white mb-4">
              The Cost of Waiting
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <CostOfDelayCard
                label="Start Now"
                amount={costOfDelay.currentPlanCost}
                highlight
              />
              <CostOfDelayCard
                label="Wait 1 Year"
                amount={costOfDelay.costIfDelayed1Year}
              />
              <CostOfDelayCard
                label="Wait 3 Years"
                amount={costOfDelay.costIfDelayed3Years}
              />
            </div>
            <p className="font-body text-xs text-white/40 mt-4">{costOfDelay.reasoning}</p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="font-body text-[10px] text-white/15 text-center mt-6 max-w-lg mx-auto">
          Simulations are AI-generated projections for illustrative purposes only.
          Individual results vary based on skin type, lifestyle, and treatment adherence.
          These are not guarantees of outcomes.
        </p>
      </div>
    </div>
  );
}

// ── Slide 5: Package Selection ──

function PackageSelectionSlide({
  session,
  selectedPackage,
  financingOptions,
  selectedFinancing,
  onSelectPackage,
  onSelectFinancing,
  onGeneratePdf,
  onComplete,
  pdfLoading,
  completing,
}: SlideProps) {
  const plan = session.mastermindPlan;
  if (!plan) return <EmptySlide message="Plan not available" />;

  const metabolicContext = useMemo(() => buildMetabolicContext(session), [session]);
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentOption>('clinic');
  const [selectedMetabolicPackageId, setSelectedMetabolicPackageId] = useState<string | null>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!metabolicContext) return;
    const recommended = metabolicContext.recommendation.fulfillment.recommended;
    const fallback = metabolicContext.recommendation.fulfillment.allowed[0] ?? 'clinic';
    setSelectedFulfillment(recommended ?? fallback);
  }, [metabolicContext]);

  const metabolicPackages = useMemo(() => {
    if (!metabolicContext) return [];
    return getPackagesForRecommendation(
      metabolicContext.recommendation.recommendedTrack,
      selectedFulfillment,
    );
  }, [metabolicContext, selectedFulfillment]);

  useEffect(() => {
    if (!metabolicContext || metabolicPackages.length === 0) {
      setSelectedMetabolicPackageId(null);
      return;
    }
    const preferredTier = mapPlanTierToMetabolicTier(session.selectedPackageTier);
    const byTier = preferredTier
      ? metabolicPackages.find((pkg) => pkg.tier === preferredTier)
      : undefined;
    const fallback = byTier ?? metabolicPackages[0];
    setSelectedMetabolicPackageId((current) => {
      if (current && metabolicPackages.some((pkg) => pkg.id === current)) return current;
      return fallback.id;
    });
  }, [metabolicContext, metabolicPackages, session.selectedPackageTier]);

  const selectedMetabolicPackage = useMemo(() => {
    if (metabolicPackages.length === 0) return null;
    if (!selectedMetabolicPackageId) return metabolicPackages[0];
    return (
      metabolicPackages.find((pkg) => pkg.id === selectedMetabolicPackageId) ??
      metabolicPackages[0]
    );
  }, [metabolicPackages, selectedMetabolicPackageId]);

  const dosagePlan = useMemo(() => {
    if (!metabolicContext || !selectedMetabolicPackage) return null;
    const recommendationForMode: MetabolicRecommendation = {
      ...metabolicContext.recommendation,
      fulfillment: {
        ...metabolicContext.recommendation.fulfillment,
        recommended: selectedFulfillment,
      },
    };
    return buildDosagePlan(
      metabolicContext.intake,
      recommendationForMode,
      selectedMetabolicPackage.tier,
    );
  }, [metabolicContext, selectedFulfillment, selectedMetabolicPackage]);

  const submitMetabolicHandoff = useCallback(async () => {
    if (!metabolicContext || !selectedMetabolicPackage) return;

    const patientName = session.patientName?.trim();
    const patientEmail = session.patientEmail?.trim();
    if (!patientName || !patientEmail) {
      setHandoffMessage('Cannot submit handoff: patient name/email is missing.');
      return;
    }

    setHandoffLoading(true);
    setHandoffMessage(null);
    try {
      const protocol =
        selectedFulfillment === 'home'
          ? selectedMetabolicPackage.homeProtocol
          : selectedMetabolicPackage.clinicProtocol;
      const dosingSummary = dosagePlan
        ? [
            `Start Dose: ${dosagePlan.startDose}`,
            `Pulse Cadence: ${dosagePlan.pulseCadence}`,
            `Escalation: ${dosagePlan.escalationRules.slice(0, 2).join(' | ')}`,
            `Hold Rules: ${dosagePlan.holdRules.slice(0, 2).join(' | ')}`,
          ].join('\n')
        : `Dose Framework: ${selectedMetabolicPackage.doseFramework}`;

      const response = await fetch('/api/mastermind/metabolic-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          patientName,
          patientEmail,
          patientPhone: session.intakeData?.phone || '',
          selectedPackageName: selectedMetabolicPackage.name,
          recommendedTrack: metabolicContext.recommendation.recommendedTrack,
          protocolTier: selectedMetabolicPackage.tier,
          fulfillmentPreference: selectedFulfillment,
          homeDeliveryRequested: selectedFulfillment === 'home',
          dosageGovernanceSummary: [
            `Pulse Schedule: ${selectedMetabolicPackage.pulseSchedule}`,
            `Targets: ${selectedMetabolicPackage.improvementTargets.join(', ')}`,
            `Protocol: ${protocol}`,
            '',
            dosingSummary,
          ].join('\n'),
          mastermindPackageTier: session.selectedPackageTier || '',
          goalsSummary: metabolicContext.goalsSummary || '',
          symptomsSummary: metabolicContext.symptomsSummary || '',
        }),
      });

      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok || (payload as { success?: boolean }).success === false) {
        throw new Error((payload as { error?: string }).error || 'Handoff request failed');
      }

      setHandoffMessage(
        selectedFulfillment === 'home'
          ? 'Handoff sent. Home checkout opened in a new tab.'
          : 'Handoff sent. Clinic onboarding checkout opened in a new tab.',
      );
      const nextUrl =
        selectedFulfillment === 'home'
          ? '/glp1/intake?checkout=home'
          : '/glp1/intake?checkout=clinic';
      window.open(nextUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setHandoffMessage(
        error instanceof Error ? error.message : 'Unable to submit metabolic handoff.',
      );
    } finally {
      setHandoffLoading(false);
    }
  }, [dosagePlan, metabolicContext, selectedFulfillment, selectedMetabolicPackage, session]);

  return (
    <div className="flex flex-col items-center min-h-full px-6 py-12">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl text-white">
            Choose Your Journey
          </h2>
          <p className="font-body text-white/40 mt-2">
            Every package is designed for real results — choose the level that fits your goals
          </p>
        </div>

        {/* Package Cards */}
        <PackageSelector
          packages={plan.packages}
          selectedTier={session.selectedPackageTier}
          onSelect={onSelectPackage}
          variant="dark"
        />

        {/* Financing (shown after package selection) */}
        {selectedPackage && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <FinancingCalculator
              amount={selectedPackage.price}
              options={financingOptions}
              selectedOption={selectedFinancing}
              onSelect={onSelectFinancing}
              variant="dark"
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        {selectedPackage && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              type="button"
              onClick={onGeneratePdf}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors font-body text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {pdfLoading ? 'Generating...' : 'Download Plan PDF'}
            </button>

            <button
              type="button"
              onClick={onComplete}
              disabled={completing}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#C9A96E] text-[#0F1D2C] font-body text-sm font-semibold hover:bg-[#C9A96E]/90 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {completing ? 'Completing...' : 'Book My Transformation'}
            </button>
          </motion.div>
        )}

        {metabolicContext && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl border border-[#C9A96E]/20 bg-[#0B1724] p-5 space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A96E]/80 font-body">
                  Provider Protocol Accelerator
                </p>
                <p className="text-white text-sm font-body mt-1">
                  Recommended track: {toTitleCase(metabolicContext.recommendation.recommendedTrack)}
                  {' · '}
                  Status: {metabolicContext.recommendation.status}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
                {(['clinic', 'home'] as const).map((mode) => {
                  const allowed = metabolicContext.recommendation.fulfillment.allowed.includes(mode);
                  const active = selectedFulfillment === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={!allowed}
                      onClick={() => allowed && setSelectedFulfillment(mode)}
                      className={`px-3 py-2 text-xs font-body transition-colors ${
                        !allowed
                          ? 'text-white/25 cursor-not-allowed bg-white/5'
                          : active
                            ? 'bg-[#C9A96E] text-[#0F1D2C] font-semibold'
                            : 'bg-transparent text-white/65 hover:text-white'
                      }`}
                    >
                      {mode === 'clinic' ? 'In Clinic' : 'Ship Home'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {metabolicPackages.map((pkg) => {
                const selected = selectedMetabolicPackage?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedMetabolicPackageId(pkg.id)}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      selected
                        ? 'border-[#C9A96E]/60 bg-[#C9A96E]/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-[#C9A96E]/40'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-[#C9A96E]/80 font-body">
                      {pkg.tier}
                    </p>
                    <p className="text-white text-sm font-semibold mt-1">{pkg.name}</p>
                    <p className="text-white/60 text-xs mt-1">{pkg.monthlyEstimate}</p>
                    <p className="text-white/45 text-[11px] mt-2">{pkg.pulseSchedule}</p>
                  </button>
                );
              })}
            </div>

            {selectedMetabolicPackage && dosagePlan && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <p className="text-white/80 text-sm font-semibold font-body">
                  Dosage Governance Summary
                </p>
                <p className="text-white/65 text-xs font-body">
                  Start dose: {dosagePlan.startDose}
                </p>
                <p className="text-white/65 text-xs font-body">
                  Pulse cadence: {dosagePlan.pulseCadence}
                </p>
                <p className="text-white/65 text-xs font-body">
                  Treatment areas: {dosagePlan.treatmentAreas.join(', ')}
                </p>
                <p className="text-white/55 text-[11px] font-body">
                  Escalation gates: {dosagePlan.escalationRules.slice(0, 2).join(' | ')}
                </p>
                <p className="text-white/55 text-[11px] font-body">
                  Hold criteria: {dosagePlan.holdRules.slice(0, 2).join(' | ')}
                </p>
                <p className="text-white/45 text-[11px] font-body">
                  Targets: {selectedMetabolicPackage.improvementTargets.join(', ')}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={submitMetabolicHandoff}
                disabled={handoffLoading || !selectedMetabolicPackage}
                className="px-5 py-2.5 rounded-xl bg-[#059669] text-white text-sm font-semibold font-body hover:bg-[#059669]/90 disabled:opacity-50"
              >
                {handoffLoading
                  ? 'Sending handoff...'
                  : selectedFulfillment === 'home'
                    ? 'One-click handoff + launch home checkout'
                    : 'One-click handoff + launch clinic checkout'}
              </button>
              <p className="text-[11px] text-white/45 font-body">
                Sends protocol + dosage governance to intake pipeline for provider plug-and-play.
              </p>
            </div>

            {handoffMessage && (
              <p className="text-xs font-body text-[#C9A96E]">{handoffMessage}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

const METABOLIC_GOAL_KEYWORDS: Array<{ goal: MetabolicGoal; terms: string[] }> = [
  { goal: 'weight-loss', terms: ['weight', 'fat loss', 'slim', 'lose'] },
  { goal: 'body-recomposition', terms: ['recomp', 'tone', 'body composition', 'lean'] },
  { goal: 'metabolic-health', terms: ['a1c', 'metabolic', 'insulin', 'glucose'] },
  { goal: 'energy', terms: ['energy', 'fatigue', 'tired'] },
  { goal: 'hormone-balance', terms: ['hormone', 'cycle', 'menopause', 'libido'] },
  { goal: 'recovery', terms: ['recovery', 'inflammation', 'injury'] },
  { goal: 'longevity', terms: ['longevity', 'healthy aging', 'anti-aging'] },
  { goal: 'performance', terms: ['performance', 'strength', 'muscle'] },
];

const METABOLIC_SYMPTOM_KEYWORDS: Array<{ symptom: MetabolicSymptom; terms: string[] }> = [
  { symptom: 'appetite-dysregulation', terms: ['appetite', 'hungry'] },
  { symptom: 'sugar-cravings', terms: ['sugar', 'craving'] },
  { symptom: 'weight-plateau', terms: ['plateau', 'stuck'] },
  { symptom: 'fatigue', terms: ['fatigue', 'tired', 'energy'] },
  { symptom: 'brain-fog', terms: ['brain fog', 'focus'] },
  { symptom: 'low-libido', terms: ['libido', 'sex drive'] },
  { symptom: 'poor-sleep', terms: ['sleep', 'insomnia'] },
  { symptom: 'mood-swings', terms: ['mood', 'irritable', 'anxiety'] },
  { symptom: 'slow-recovery', terms: ['slow recovery', 'recovery'] },
  { symptom: 'inflammation', terms: ['inflammation', 'swelling'] },
  { symptom: 'muscle-loss', terms: ['muscle loss', 'muscle'] },
  { symptom: 'water-retention', terms: ['water retention', 'bloating'] },
  { symptom: 'gut-bloating', terms: ['gut', 'bloating'] },
];

function normalizeWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((term) => text.includes(term));
}

function mapPlanTierToMetabolicTier(
  tier: MastermindSession['selectedPackageTier'],
): 'start' | 'transform' | 'elite' | null {
  if (tier === 'Start' || tier === 'Essential') return 'start';
  if (tier === 'Transform') return 'transform';
  if (tier === 'Elite') return 'elite';
  return null;
}

function inferFallbackTrack(intake: Partial<ConsultationFormData>): MetabolicRecommendation['recommendedTrack'] {
  const interests = Array.isArray(intake.treatmentInterests) ? intake.treatmentInterests.map((v) => String(v).toLowerCase()) : [];
  const joined = interests.join(' ');
  if (joined.includes('glp') || joined.includes('weight')) return 'glp1';
  if (joined.includes('hormone') || joined.includes('hrt') || joined.includes('trt')) return 'hormones';
  if (joined.includes('peptide') || joined.includes('nad')) return 'peptides';
  return 'hybrid';
}

function toMetabolicGoals(intake: Partial<ConsultationFormData>): MetabolicGoal[] {
  const text = normalizeWords(
    [intake.goals, intake.treatmentHistory, intake.currentRoutine].filter(Boolean).join(' '),
  );
  const goals = METABOLIC_GOAL_KEYWORDS
    .filter((entry) => includesAny(text, entry.terms))
    .map((entry) => entry.goal);
  if (goals.length > 0) return Array.from(new Set(goals));

  const fallbackTrack = inferFallbackTrack(intake);
  if (fallbackTrack === 'glp1') return ['weight-loss'];
  if (fallbackTrack === 'hormones') return ['hormone-balance'];
  if (fallbackTrack === 'peptides') return ['recovery'];
  return ['weight-loss', 'hormone-balance'];
}

function toMetabolicSymptoms(intake: Partial<ConsultationFormData>): MetabolicSymptom[] {
  const text = normalizeWords(
    [
      intake.goals,
      intake.treatmentHistory,
      intake.currentRoutine,
      Array.isArray(intake.skinConcerns) ? intake.skinConcerns.join(' ') : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  const symptoms = METABOLIC_SYMPTOM_KEYWORDS
    .filter((entry) => includesAny(text, entry.terms))
    .map((entry) => entry.symptom);
  if (symptoms.length > 0) return Array.from(new Set(symptoms));

  const fallbackTrack = inferFallbackTrack(intake);
  if (fallbackTrack === 'glp1') return ['weight-plateau'];
  if (fallbackTrack === 'hormones') return ['fatigue'];
  if (fallbackTrack === 'peptides') return ['slow-recovery'];
  return ['weight-plateau', 'fatigue'];
}

function toTitleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildMetabolicContext(
  session: MastermindSession,
): {
  intake: MetabolicIntake;
  recommendation: MetabolicRecommendation;
  goalsSummary: string;
  symptomsSummary: string;
} | null {
  const intakeData = (session.intakeData ?? {}) as Partial<ConsultationFormData>;
  const firstName = intakeData.firstName || session.patientName?.split(' ')[0] || '';
  const lastName =
    intakeData.lastName ||
    session.patientName?.split(' ').slice(1).join(' ') ||
    '';
  const email = intakeData.email || session.patientEmail || '';
  if (!firstName || !lastName || !email) return null;

  const goals = toMetabolicGoals(intakeData);
  const symptoms = toMetabolicSymptoms(intakeData);
  const preferredTrack = intakeData.metabolicTrackPreference || inferFallbackTrack(intakeData);

  const intake: MetabolicIntake = {
    firstName,
    lastName,
    email,
    phone: intakeData.phone || '',
    goals,
    symptoms,
    preferredTrack,
    fulfillmentPreference: intakeData.fulfillmentPreference || 'clinic',
    timelineWeeks: intakeData.timeline === 'asap' ? 4 : intakeData.timeline === 'event' ? 12 : 16,
    currentMeds: intakeData.treatmentHistory || '',
    notes: intakeData.goals || '',
    source: 'mastermind-provider',
    medicalFlags: {
      pregnant: Boolean(intakeData.pregnant),
      breastfeeding: Boolean(intakeData.breastfeeding),
      thyroidCancerHistory: false,
      pancreatitisHistory: false,
      gallbladderDisease: false,
      uncontrolledHypertension: false,
      severeDepression: false,
      eatingDisorderHistory: false,
    },
    labs: {
      baselineLabsCompleted: Boolean(intakeData.baselineLabsCompleted),
      latestA1c: undefined,
      fastingGlucose: undefined,
      tsh: undefined,
    },
  };

  const recommendation = generateMetabolicRecommendation(intake);
  return {
    intake,
    recommendation,
    goalsSummary: typeof intakeData.goals === 'string' ? intakeData.goals : '',
    symptomsSummary: Array.isArray(intakeData.skinConcerns) ? intakeData.skinConcerns.join(', ') : '',
  };
}

// ── Shared Components ──

function MetricCard({
  label,
  value,
  unit,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
      <div className="text-xs text-white/30 font-body uppercase tracking-wider">{label}</div>
      <div className="mt-2">
        <span className="text-3xl font-bold font-[family-name:var(--font-heading)]" style={{ color: accent }}>
          {value}
        </span>
        <span className="text-xs text-white/30 font-body ml-1">{unit}</span>
      </div>
      <div className="text-xs text-white/20 font-body mt-1">{subtitle}</div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: 'mild' | 'moderate' | 'severe' }) {
  const color = severityColor(severity);
  return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />;
}

function severityColor(severity: 'mild' | 'moderate' | 'severe'): string {
  switch (severity) {
    case 'mild': return '#3B82F6';
    case 'moderate': return '#F59E0B';
    case 'severe': return '#DC2626';
  }
}

function CostOfDelayCard({
  label,
  amount,
  highlight,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center ${
        highlight
          ? 'bg-[#C9A96E]/20 border border-[#C9A96E]/40'
          : 'bg-white/5 border border-white/5'
      }`}
    >
      <div className="text-xs text-white/40 font-body">{label}</div>
      <div
        className={`text-2xl font-bold font-[family-name:var(--font-heading)] mt-1 ${
          highlight ? 'text-[#C9A96E]' : 'text-white/60'
        }`}
      >
        ${amount.toLocaleString()}
      </div>
    </div>
  );
}

function EmptySlide({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-full">
      <p className="font-body text-white/30 text-sm">{message}</p>
    </div>
  );
}
