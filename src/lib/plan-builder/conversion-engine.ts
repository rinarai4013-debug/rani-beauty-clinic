import {
  UNIFIED_CATALOG,
  getServiceById,
  getServicesByConcern,
} from '@/data/services/unified-catalog';
import type { UnifiedService } from '@/data/services/unified-catalog';
import { recommendTreatmentPlan } from './ai-recommender';
import type { RecommendedService, ClientProfile } from './ai-recommender';
import { validatePlan } from './constraints';
import type { PlanWarning } from './constraints';
import { PHASE_LABELS } from './types';
import type { PlanPhase, SelectedService } from './types';

// ─── Input ──────────────────────────────────────────────────────────

export interface ConversionInput {
  skinConcerns: string[];
  treatmentInterests: string[];
  fitzpatrickType?: 1 | 2 | 3 | 4 | 5 | 6;
  urgency: 'relaxed' | 'moderate' | 'event-driven' | 'same-day';
  budgetSensitivity: 'price-conscious' | 'value-seeking' | 'investment-ready';
  engagementLevel: 'cold' | 'warm' | 'hot' | 'returning';
  previousTreatments?: string[];
  totalSpend?: number;
  visitCount?: number;
  downtimeTolerance?: 'none' | 'minimal' | 'moderate' | 'flexible';
  painTolerance?: 'low' | 'medium' | 'high';
  contraindications?: string[];
  seasonality?: 'summer' | 'fall' | 'winter' | 'spring';
  sameDayLikelihood?: number;
  referralSource?: string;
}

// ─── Output ─────────────────────────────────────────────────────────

export interface TierService {
  service: UnifiedService;
  phase: 1 | 2 | 3;
  phaseName: string;
  reason: string;
  whyThisPhase: string;
  isQuickWin: boolean;
  isAnchor: boolean;
}

export interface PlanTier {
  name: string;
  tagline: string;
  services: TierService[];
  totalPrice: number;
  monthlyPayment: number;
  sessions: number;
  whyThisTier: string;
}

export interface PlanStrength {
  score: number;
  factors: { name: string; score: number; weight: number }[];
  label: 'weak' | 'moderate' | 'strong' | 'exceptional';
  improvementTips: string[];
}

export interface TimelineMonth {
  month: number;
  label: string;
  treatments: string[];
  milestone: string;
  improvementEstimate: string;
}

export interface RevenueIntel {
  retailValue: number;
  corePackagePrice: number;
  savings: number;
  projectedRevenue: number;
  recurringPotential: number;
  upsellOpportunities: string[];
  financingMonthly12: number;
  financingMonthly24: number;
}

export interface BundleShortcut {
  id: string;
  name: string;
  services: string[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
}

export interface ConversionPlan {
  starter: PlanTier;
  core: PlanTier;
  elite: PlanTier;
  planStrength: PlanStrength;
  whyThisPlan: string;
  timelineProjection: TimelineMonth[];
  warnings: PlanWarning[];
  revenue: RevenueIntel;
  bundles: BundleShortcut[];
}

// ─── Phase Names ────────────────────────────────────────────────────

const EMOTIONAL_PHASES: Record<1 | 2 | 3, string> = {
  1: 'Glow Activation',
  2: 'Deep Renewal',
  3: 'Radiant Maintenance',
};

// ─── Bundle Definitions ─────────────────────────────────────────────

const BUNDLE_DEFS: { id: string; name: string; services: string[]; discount: number }[] = [
  { id: 'glow-starter', name: 'Glow Starter', services: ['hydrafacial-signature', 'vi-peel'], discount: 0.10 },
  { id: 'collagen-boost', name: 'Collagen Boost', services: ['rf-micro-face', 'prx-t33'], discount: 0.12 },
  { id: 'age-rewind', name: 'Age Rewind', services: ['sofwave-full-face', 'botox', 'hydrafacial-signature'], discount: 0.15 },
  { id: 'clear-skin', name: 'Clear Skin', services: ['vi-peel', 'hydrafacial-signature', 'tretinoin'], discount: 0.10 },
  { id: 'radiance', name: 'Radiance Revival', services: ['hydrafacial-signature', 'prx-t33', 'glutathione-injection'], discount: 0.10 },
  { id: 'tight-lift', name: 'Tight & Lift', services: ['sofwave-full-face-neck', 'rf-micro-face-neck'], discount: 0.12 },
];

// ─── Helpers ────────────────────────────────────────────────────────

function toTierService(rec: RecommendedService): TierService {
  return {
    service: rec.service,
    phase: rec.phase,
    phaseName: EMOTIONAL_PHASES[rec.phase],
    reason: rec.reason,
    whyThisPhase: rec.whyThisPhase || '',
    isQuickWin: rec.quickWin || false,
    isAnchor: rec.anchorTreatment || false,
  };
}

function calcTierTotal(services: TierService[]): number {
  return services.reduce((sum, s) => sum + s.service.price * s.service.sessions, 0);
}

function calcSessions(services: TierService[]): number {
  return services.reduce((sum, s) => sum + s.service.sessions, 0);
}

function mapBudgetBand(sensitivity: string): 'value' | 'mid' | 'premium' {
  switch (sensitivity) {
    case 'price-conscious': return 'value';
    case 'investment-ready': return 'premium';
    default: return 'mid';
  }
}

// ─── Main ───────────────────────────────────────────────────────────

export function generateConversionPlan(input: ConversionInput): ConversionPlan {
  const profile: ClientProfile = {
    skinConcerns: input.skinConcerns,
    treatmentInterests: input.treatmentInterests,
    fitzpatrickType: input.fitzpatrickType,
    downtimeTolerance: input.downtimeTolerance,
    budgetBand: mapBudgetBand(input.budgetSensitivity),
    urgency: input.urgency === 'same-day' ? 'event-driven' : input.urgency,
    painTolerance: input.painTolerance,
    previousTreatments: input.previousTreatments,
    seasonality: input.seasonality,
    contraindications: input.contraindications,
  };

  // Get full recommendation set
  const allRecs = recommendTreatmentPlan(profile);

  // ── Build tiers ──

  // Starter: Phase 1 only, 2-3 services, low friction
  let starterServices = allRecs.filter((r) => r.phase === 1).slice(0, 3);
  if (starterServices.length === 0 && allRecs.length > 0) {
    starterServices = allRecs.slice(0, 2);
  }
  // For cold leads, cap at 2 cheap services
  if (input.engagementLevel === 'cold') {
    starterServices = starterServices
      .sort((a, b) => a.service.price - b.service.price)
      .slice(0, 2);
  }

  // Core: Phases 1+2, 4-6 services, best balance
  let coreServices = allRecs.filter((r) => r.phase === 1 || r.phase === 2).slice(0, 6);
  if (coreServices.length < 3 && allRecs.length >= 3) {
    coreServices = allRecs.slice(0, Math.min(6, allRecs.length));
  }
  // Hot leads get premium treatments included
  if (input.engagementLevel === 'hot' || input.engagementLevel === 'returning') {
    const phase2Premium = allRecs.filter(
      (r) => r.phase === 2 && r.service.price > 500
    );
    for (const p of phase2Premium) {
      if (!coreServices.find((c) => c.service.id === p.service.id) && coreServices.length < 6) {
        coreServices.push(p);
      }
    }
  }

  // Elite: All 3 phases, 6-8 services, maximum transformation
  const eliteServices = allRecs.slice(0, 8);

  const starter = buildTier('Starter', 'Your confident first step', starterServices, input);
  const core = buildTier('Core', 'The sweet spot — most popular', coreServices, input);
  const elite = buildTier('Elite', 'Fastest, most comprehensive result', eliteServices, input);

  // ── Plan Strength ──
  const planStrength = scorePlan(core, input);

  // ── Why This Plan ──
  const quickWin = coreServices.find((r) => r.quickWin);
  const anchor = coreServices.find((r) => r.anchorTreatment);
  const concernList = input.skinConcerns.slice(0, 3).join(', ');
  const whyThisPlan = `Based on your concerns with ${concernList || 'your skin goals'}, we've designed a plan starting with ${quickWin?.service.name || 'an immediate-result treatment'} for a visible glow from visit one, followed by ${anchor?.service.name || 'advanced treatments'} for deep, lasting transformation. The Core package gives you the best balance of results and value.`;

  // ── Timeline ──
  const timelineProjection = buildTimeline(coreServices);

  // ── Warnings ──
  const mockPhases = buildMockPhases(coreServices);
  const warnings = validatePlan(mockPhases);

  // ── Revenue ──
  const retailValue = calcTierTotal(elite.services);
  const corePrice = core.totalPrice;
  const revenue: RevenueIntel = {
    retailValue,
    corePackagePrice: Math.round(corePrice * 0.9),
    savings: Math.round(retailValue - corePrice * 0.9),
    projectedRevenue: Math.round(corePrice * 0.9),
    recurringPotential: estimateRecurring(coreServices),
    upsellOpportunities: findUpsells(coreServices, input),
    financingMonthly12: Math.ceil((corePrice * 0.9) / 12),
    financingMonthly24: Math.ceil((corePrice * 0.9) / 24),
  };

  // ── Bundles ──
  const bundles = detectBundles(coreServices);

  return {
    starter,
    core,
    elite,
    planStrength,
    whyThisPlan,
    timelineProjection,
    warnings,
    revenue,
    bundles,
  };
}

// ─── Tier Builder ───────────────────────────────────────────────────

function buildTier(
  name: string,
  tagline: string,
  recs: RecommendedService[],
  input: ConversionInput
): PlanTier {
  const services = recs.map(toTierService);
  const totalPrice = calcTierTotal(services);
  const sessions = calcSessions(services);

  const whyMap: Record<string, string> = {
    Starter: 'A low-commitment entry that lets you experience real results before going deeper. Perfect if you want proof before investing more.',
    Core: 'The ideal balance — combines quick visible results with deeper treatments for lasting transformation. This is what most of our clients choose.',
    Elite: 'The fastest path to your best skin. Every treatment we recommend, nothing held back. Maximum results in minimum time.',
  };

  return {
    name,
    tagline,
    services,
    totalPrice,
    monthlyPayment: Math.ceil(totalPrice / 12),
    sessions,
    whyThisTier: whyMap[name] || '',
  };
}

// ─── Plan Strength Scoring ──────────────────────────────────────────

function scorePlan(core: PlanTier, input: ConversionInput): PlanStrength {
  const factors: PlanStrength['factors'] = [];

  // Concern coverage (30%)
  const coveredConcerns = new Set<string>();
  for (const svc of core.services) {
    svc.service.concerns.forEach((c) => coveredConcerns.add(c));
  }
  const totalConcerns = input.skinConcerns.length || 1;
  const coverageScore = Math.min(100, (coveredConcerns.size / totalConcerns) * 100);
  factors.push({ name: 'Concern Coverage', score: Math.round(coverageScore), weight: 0.30 });

  // Clinical logic (25%)
  const hasQuickWin = core.services.some((s) => s.isQuickWin);
  const hasAnchor = core.services.some((s) => s.isAnchor);
  const hasPhase1 = core.services.some((s) => s.phase === 1);
  const hasPhase2 = core.services.some((s) => s.phase === 2);
  let clinicalScore = 40;
  if (hasQuickWin) clinicalScore += 20;
  if (hasAnchor) clinicalScore += 20;
  if (hasPhase1 && hasPhase2) clinicalScore += 20;
  factors.push({ name: 'Clinical Logic', score: Math.min(100, clinicalScore), weight: 0.25 });

  // Conversion readiness (20%)
  let conversionScore = 50;
  if (hasQuickWin) conversionScore += 20;
  if (core.monthlyPayment < 300) conversionScore += 15;
  if (core.services.length >= 3 && core.services.length <= 6) conversionScore += 15;
  factors.push({ name: 'Conversion Readiness', score: Math.min(100, conversionScore), weight: 0.20 });

  // Revenue optimization (15%)
  let revenueScore = 50;
  if (core.totalPrice > 1000) revenueScore += 15;
  if (core.totalPrice > 2000) revenueScore += 15;
  if (core.services.some((s) => s.service.financingEligible)) revenueScore += 20;
  factors.push({ name: 'Revenue Optimization', score: Math.min(100, revenueScore), weight: 0.15 });

  // Personalization (10%)
  let persScore = 40;
  if (input.fitzpatrickType) persScore += 20;
  if (input.downtimeTolerance) persScore += 15;
  if (input.previousTreatments?.length) persScore += 15;
  if (input.contraindications?.length) persScore += 10;
  factors.push({ name: 'Personalization', score: Math.min(100, persScore), weight: 0.10 });

  const totalScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  const label: PlanStrength['label'] =
    totalScore >= 85 ? 'exceptional' :
    totalScore >= 70 ? 'strong' :
    totalScore >= 50 ? 'moderate' : 'weak';

  const tips: string[] = [];
  if (!hasQuickWin) tips.push('Add a quick-win treatment to Phase 1 (HydraFacial or light peel) for immediate client satisfaction');
  if (!hasAnchor) tips.push('Add an anchor treatment to Phase 2 (RF Microneedling or Sofwave) for deeper transformation');
  if (coverageScore < 60) tips.push('Plan only covers some concerns — consider adding services for remaining issues');
  if (core.totalPrice < 800) tips.push('Plan value is low — consider adding complementary services to increase perceived value');
  if (!input.fitzpatrickType) tips.push('Adding Fitzpatrick skin type improves recommendation accuracy');

  return { score: totalScore, factors, label, improvementTips: tips };
}

// ─── Timeline Builder ───────────────────────────────────────────────

function buildTimeline(recs: RecommendedService[]): TimelineMonth[] {
  const phase1 = recs.filter((r) => r.phase === 1);
  const phase2 = recs.filter((r) => r.phase === 2);
  const phase3 = recs.filter((r) => r.phase === 3);

  const months: TimelineMonth[] = [
    {
      month: 1,
      label: 'Month 1: Glow Activation',
      treatments: phase1.map((r) => r.service.name),
      milestone: 'First visible glow — skin feels refreshed and hydrated',
      improvementEstimate: '15-25% improvement',
    },
    {
      month: 2,
      label: 'Month 2: Building Momentum',
      treatments: phase2.slice(0, 2).map((r) => r.service.name),
      milestone: 'Collagen production activating, subtle tightening beginning',
      improvementEstimate: '30-40% improvement',
    },
    {
      month: 3,
      label: 'Month 3: Transformation Peak',
      treatments: phase2.slice(0, 3).map((r) => r.service.name),
      milestone: 'Most dramatic visible changes — skin texture and tone transformed',
      improvementEstimate: '50-65% improvement',
    },
    {
      month: 4,
      label: 'Month 4: Refinement',
      treatments: [...phase2.slice(2), ...phase3.slice(0, 1)].map((r) => r.service.name),
      milestone: 'Fine-tuning results, addressing remaining concerns',
      improvementEstimate: '70-80% improvement',
    },
    {
      month: 5,
      label: 'Month 5: Maintenance Start',
      treatments: phase3.map((r) => r.service.name),
      milestone: 'Locking in results with targeted maintenance',
      improvementEstimate: '80-90% improvement',
    },
    {
      month: 6,
      label: 'Month 6: Review & Optimize',
      treatments: ['Progress assessment', 'Maintenance plan adjustment'],
      milestone: 'Full evaluation — results sustained, plan optimized for long-term',
      improvementEstimate: '85-95% of target achieved',
    },
  ];

  // Filter out months with no treatments
  return months.filter((m) => m.treatments.length > 0 || m.month === 6);
}

// ─── Bundle Detection ───────────────────────────────────────────────

function detectBundles(recs: RecommendedService[]): BundleShortcut[] {
  const serviceIds = new Set(recs.map((r) => r.service.id));
  const bundles: BundleShortcut[] = [];

  for (const def of BUNDLE_DEFS) {
    const matchCount = def.services.filter((id) => serviceIds.has(id)).length;
    if (matchCount >= 2) {
      const services = def.services
        .map((id) => getServiceById(id))
        .filter((s): s is UnifiedService => !!s);
      const originalPrice = services.reduce((sum, s) => sum + s.price * s.sessions, 0);
      const bundlePrice = Math.round(originalPrice * (1 - def.discount));

      bundles.push({
        id: def.id,
        name: def.name,
        services: def.services,
        originalPrice,
        bundlePrice,
        savings: originalPrice - bundlePrice,
      });
    }
  }

  return bundles;
}

// ─── Revenue Helpers ────────────────────────────────────────────────

function estimateRecurring(recs: RecommendedService[]): number {
  let monthly = 0;
  const hasInjectables = recs.some((r) => r.service.category === 'injectables');
  const hasSkincare = recs.some((r) => r.service.category === 'skincare');
  const hasFacials = recs.some((r) => r.service.category === 'facial');
  const hasWellness = recs.some((r) => r.service.category === 'wellness');

  if (hasInjectables) monthly += 350; // Quarterly Botox
  if (hasSkincare) monthly += 99;     // Tretinoin
  if (hasFacials) monthly += 275;     // Monthly HydraFacial
  if (hasWellness) monthly += 75;     // Monthly wellness injection

  return Math.round(monthly / 3); // Average to monthly
}

function findUpsells(recs: RecommendedService[], input: ConversionInput): string[] {
  const categories = new Set(recs.map((r) => r.service.category));
  const upsells: string[] = [];

  if (!categories.has('skincare')) upsells.push('Add Tretinoin ($99/mo) for at-home results amplification');
  if (!categories.has('wellness')) upsells.push('Add Tri-Immune injection ($75) to boost healing between treatments');
  if (!categories.has('injectables') && input.skinConcerns.some((c) => ['aging', 'wrinkles', 'fine lines', 'aging-skin'].includes(c.toLowerCase()))) {
    upsells.push('Consider Botox or fillers for immediate volume and line correction');
  }
  if (!categories.has('facial')) upsells.push('Add monthly HydraFacial ($249) for ongoing skin maintenance');
  if (input.engagementLevel === 'returning' && (input.totalSpend || 0) > 2000) {
    upsells.push('Offer membership pricing — this client is a strong membership candidate');
  }

  return upsells.slice(0, 4);
}

// ─── Phase Mock Builder (for constraint validation) ─────────────────

function buildMockPhases(recs: RecommendedService[]): [PlanPhase, PlanPhase, PlanPhase] {
  let counter = 0;
  const phases: [PlanPhase, PlanPhase, PlanPhase] = [
    { id: 1, label: PHASE_LABELS[1].label, description: PHASE_LABELS[1].description, services: [] },
    { id: 2, label: PHASE_LABELS[2].label, description: PHASE_LABELS[2].description, services: [] },
    { id: 3, label: PHASE_LABELS[3].label, description: PHASE_LABELS[3].description, services: [] },
  ];

  for (const rec of recs) {
    const selected: SelectedService = {
      id: `mock-${++counter}`,
      serviceId: rec.service.id,
      service: rec.service,
      quantity: 1,
      notes: '',
      phase: rec.phase,
    };
    phases[rec.phase - 1].services.push(selected);
  }

  return phases;
}
