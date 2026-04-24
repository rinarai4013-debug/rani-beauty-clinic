/**
 * Mastermind Flow Orchestrator
 *
 * Central entry point for the mastermind consultation engine.
 * All phase transitions, orchestration, and cross-module
 * coordination routes through here — components never call
 * engines directly.
 */

import type {
  MastermindSession,
  MastermindPhase,
  MastermindPlan,
  AuraScanResult,
  SimulationComparison,
} from '@/types/mastermind';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

// ── Phase Progression ──

const PHASE_ORDER: MastermindPhase[] = [
  'intake',
  'scanning',
  'scan_complete',
  'generating_plan',
  'plan_ready',
  'provider_review',
  'approved',
  'simulating',
  'simulation_ready',
  'presenting',
  'completed',
];

const PHASE_INDEX = new Map<MastermindPhase, number>(
  PHASE_ORDER.map((p, i) => [p, i])
);

export function getPhaseIndex(phase: MastermindPhase): number {
  return PHASE_INDEX.get(phase) ?? -1;
}

export function isPhaseAtLeast(current: MastermindPhase, target: MastermindPhase): boolean {
  return getPhaseIndex(current) >= getPhaseIndex(target);
}

export function canTransitionTo(current: MastermindPhase, target: MastermindPhase): boolean {
  const currentIdx = getPhaseIndex(current);
  const targetIdx = getPhaseIndex(target);
  // Allow forward progression or staying on same phase
  return targetIdx >= currentIdx;
}

// ── Session Readiness Checks ──

export function isReadyForPresentation(session: MastermindSession): boolean {
  return (
    !!session.auraScanResult &&
    !!session.mastermindPlan &&
    !!session.providerReview &&
    session.providerReview.approvalStatus === 'approved' &&
    !!session.simulationComparison
  );
}

export function isReadyForPdf(session: MastermindSession): boolean {
  return (
    isReadyForPresentation(session) &&
    !!session.selectedPackageTier
  );
}

export function isReadyForCompletion(session: MastermindSession): boolean {
  return (
    isReadyForPdf(session) &&
    isPhaseAtLeast(session.phase, 'presenting')
  );
}

// ── Derived Selectors (read from MastermindSession, never bespoke view models) ──

export function getSelectedPackage(session: MastermindSession): GeneratedPackage | null {
  if (!session.mastermindPlan || !session.selectedPackageTier) return null;
  return (
    session.mastermindPlan.packages.find(
      (pkg) => pkg.tier === session.selectedPackageTier
    ) || null
  );
}

export function getAllTreatments(plan: MastermindPlan) {
  return [
    ...plan.recommendations.primary,
    ...plan.recommendations.complementary,
    ...plan.recommendations.maintenance,
  ];
}

export function getPlanTotalCost(plan: MastermindPlan): number {
  return getAllTreatments(plan).reduce((sum, t) => sum + t.totalEstimate, 0);
}

export function getScoreProjection(session: MastermindSession) {
  const scan = session.auraScanResult;
  if (!scan) return null;

  const current = scan.auraScore.overall;
  const withTreatment = scan.predictiveMetrics.withTreatment;
  const withoutTreatment = scan.predictiveMetrics.withoutIntervention;

  return {
    current,
    threeMonth: withTreatment.threeMonths.auraScore,
    sixMonth: withTreatment.sixMonths.auraScore,
    oneYear: withTreatment.oneYear.auraScore,
    withoutOneYear: withoutTreatment.oneYear.auraScore,
    skinAgeCurrent: scan.auraScore.skinAge,
    skinAgeProjected: withTreatment.sixMonths.skinAge,
    chronologicalAge: scan.auraScore.chronologicalAge,
  };
}

export function getCostOfDelay(session: MastermindSession) {
  if (!session.simulationComparison) return null;
  return session.simulationComparison.costOfDelay;
}

export function getComparisonMetrics(session: MastermindSession) {
  if (!session.simulationComparison) return null;
  return session.simulationComparison.comparison;
}

// ── Presentation Slide Definitions ──

export type SlideId =
  | 'aura-score'
  | 'concern-breakdown'
  | 'treatment-plan'
  | 'simulation'
  | 'package-selection';

export interface SlideConfig {
  id: SlideId;
  title: string;
  subtitle: string;
  icon: string; // Lucide icon name
  requiresData: (_session: MastermindSession) => boolean;
}

export const PRESENTATION_SLIDES: readonly SlideConfig[] = [
  {
    id: 'aura-score',
    title: 'Your Aura Score',
    subtitle: 'Where your skin stands today',
    icon: 'Activity',
    requiresData: (s) => !!s.auraScanResult,
  },
  {
    id: 'concern-breakdown',
    title: 'What We Found',
    subtitle: 'Your personalized skin analysis',
    icon: 'Search',
    requiresData: (s) => !!s.auraScanResult,
  },
  {
    id: 'treatment-plan',
    title: 'Your Transformation Plan',
    subtitle: 'Clinically designed for your goals',
    icon: 'Sparkles',
    requiresData: (s) => !!s.mastermindPlan,
  },
  {
    id: 'simulation',
    title: 'Your Future Self',
    subtitle: 'See what\'s possible',
    icon: 'ArrowRight',
    requiresData: (s) => !!s.simulationComparison,
  },
  {
    id: 'package-selection',
    title: 'Choose Your Journey',
    subtitle: 'Invest in the results you deserve',
    icon: 'Gift',
    requiresData: (s) => !!s.mastermindPlan,
  },
];

export function getAvailableSlides(session: MastermindSession): SlideConfig[] {
  return PRESENTATION_SLIDES.filter((slide) => slide.requiresData(session));
}

// ── Financing Calculations ──

export interface FinancingOption {
  termMonths: number;
  label: string;
  monthlyPayment: number;
  totalCost: number;
  apr: number;
}

export function calculateFinancingOptions(amount: number): FinancingOption[] {
  if (amount <= 0) return [];

  const tiers: { months: number; label: string; apr: number }[] = [
    { months: 6, label: '6 Months', apr: 0 },
    { months: 12, label: '12 Months', apr: 4.99 },
    { months: 24, label: '24 Months', apr: 9.99 },
    { months: 36, label: '36 Months', apr: 14.99 },
  ];

  return tiers.map(({ months, label, apr }) => {
    let monthlyPayment: number;
    let totalCost: number;

    if (apr === 0) {
      // 0% APR — simple division
      monthlyPayment = Math.round(amount / months);
      totalCost = amount;
    } else {
      // Amortized payment formula:
      // M = P * [r(1+r)^n] / [(1+r)^n - 1]
      const monthlyRate = apr / 100 / 12;
      const factor = Math.pow(1 + monthlyRate, months);
      monthlyPayment = Math.round(amount * (monthlyRate * factor) / (factor - 1));
      totalCost = monthlyPayment * months;
    }

    return { termMonths: months, label, monthlyPayment, totalCost, apr };
  });
}

// ── Re-exports for convenience ──

export { sessionReducer, createSession, getSessionById, getSessionByIdAsync, saveSession, saveSessionAsync, getAllSessions, getAllSessionsAsync, deleteSession } from './session';
export { generateMastermindPlan } from './plan-generator';
export { generateSimulationComparison } from './simulation-engine';
export { mockAuraScanResult, mockMastermindPlan, mockSimulationComparison, mockMastermindSession } from './mock-data';
