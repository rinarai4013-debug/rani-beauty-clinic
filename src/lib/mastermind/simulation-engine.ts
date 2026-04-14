/**
 * Simulation Engine — Predictive Dual-Path Generator
 *
 * Generates WITH and WITHOUT treatment visual progressions
 * using the unified filter chain system. All rendering is
 * client-side Canvas — no external image generation API.
 *
 * Uses:
 * - applyFilterChain() / applyUnifiedFilterChain() from filters.ts
 * - getPresetsForService() from filter-presets.ts
 * - DEGRADATION_PRESETS from degradation-presets.ts
 * - TREATMENT_PRESETS from filter-presets.ts
 */

import type {
  SimulationComparison,
  SimulationPath,
  SimulationFrame,
  AuraScanResult,
  MastermindPlan,
  MastermindTreatment,
} from '@/types/mastermind';
import type { FilterStep, DegradationFilterStep } from '@/lib/photo-simulation/filters';
import { applyFilterChain } from '@/lib/photo-simulation/filters';
import { TREATMENT_PRESETS, getPresetsForService } from '@/lib/photo-simulation/filter-presets';
import {
  DEGRADATION_PRESETS,
  getAgeAdjustedDegradation,
} from '@/lib/photo-simulation/degradation-presets';
import type { ServiceCategory } from '@/data/services/unified-catalog';

// ── TYPES ──

interface SimulationInput {
  sourceImageDataUrl: string;
  scanResult: AuraScanResult;
  plan: MastermindPlan | null; // null = use draft/mock data
  selectedTreatmentIds?: string[]; // optional focused simulation scope
  scenarioMode?: 'conservative' | 'typical' | 'aggressive';
  canvasWidth?: number;
  canvasHeight?: number;
}

interface TimeframeConfig {
  key: string;
  label: string;
  monthNumber: number;
}

export interface SimulationServiceScopeOption {
  id: string;
  label: string;
  presetKeys: string[];
}

export const SIMULATION_SERVICE_SCOPES: SimulationServiceScopeOption[] = [
  { id: 'preset:botox', label: 'Botox projection', presetKeys: ['anti-aging'] },
  { id: 'preset:fillers', label: 'Filler projection', presetKeys: ['volume-restoration'] },
  { id: 'preset:sculptra', label: 'Sculptra projection', presetKeys: ['volume-restoration', 'collagen-boost'] },
  { id: 'preset:prx', label: 'PRX peel projection', presetKeys: ['collagen-boost', 'brightening-hydration'] },
  { id: 'preset:rfmn', label: 'RFMN projection', presetKeys: ['skin-rejuvenation'] },
  { id: 'preset:laser-hair', label: 'Laser hair projection', presetKeys: ['skin-rejuvenation'] },
  { id: 'preset:sofwave', label: 'Sofwave projection', presetKeys: ['skin-tightening'] },
];

const SERVICE_SCOPE_MAP = new Map(
  SIMULATION_SERVICE_SCOPES.map((scope) => [scope.id, scope]),
);

// ── WITH-TREATMENT TIMEFRAMES ──

const WITH_TREATMENT_TIMEFRAMES: TimeframeConfig[] = [
  { key: '1M', label: 'Month 1', monthNumber: 1 },
  { key: '3M', label: 'Month 3', monthNumber: 3 },
  { key: '6M', label: 'Month 6', monthNumber: 6 },
  { key: '1Y', label: '1 Year', monthNumber: 12 },
];

// ── WITHOUT-TREATMENT TIMEFRAMES ──

const WITHOUT_TREATMENT_TIMEFRAMES: TimeframeConfig[] = [
  { key: '6M', label: '6 Months', monthNumber: 6 },
  { key: '1Y', label: '1 Year', monthNumber: 12 },
  { key: '3Y', label: '3 Years', monthNumber: 36 },
  { key: '5Y', label: '5 Years', monthNumber: 60 },
];

const SERVICE_CATEGORIES = new Set<ServiceCategory>([
  'laser-hair-removal',
  'facial',
  'chemical-peel',
  'rf-microneedling',
  'skin-tightening',
  'scar-reduction',
  'laser',
  'injectables',
  'wellness',
  'weight-management',
  'hormones',
  'labs',
  'skincare',
  'hair',
  'consultation',
]);

const CATEGORY_ALIASES: Record<string, ServiceCategory> = {
  neurotoxin: 'injectables',
  injectable: 'injectables',
  injectable_filler: 'injectables',
  filler: 'injectables',
  'rf microneedling': 'rf-microneedling',
  'rf-micro': 'rf-microneedling',
  'laser hair': 'laser-hair-removal',
  lhr: 'laser-hair-removal',
};

// ── MAIN GENERATOR ──

export async function generateSimulationComparison(
  input: SimulationInput
): Promise<SimulationComparison> {
  const {
    sourceImageDataUrl,
    scanResult,
    plan,
    selectedTreatmentIds,
    scenarioMode = 'typical',
  } = input;
  const maxWidth = input.canvasWidth || 600;
  const maxHeight = input.canvasHeight || 600;

  // Load source image
  const sourceImage = await loadImage(sourceImageDataUrl);
  const { width, height } = fitDimensions(
    sourceImage.width,
    sourceImage.height,
    maxWidth,
    maxHeight
  );

  // Generate both paths
  const withTreatment = await generateWithTreatmentPath(
    sourceImage,
    width,
    height,
    scanResult,
    plan,
    selectedTreatmentIds,
    scenarioMode,
  );

  const withoutTreatment = await generateWithoutTreatmentPath(
    sourceImage,
    width,
    height,
    scanResult,
    scenarioMode,
  );

  // Build comparison metadata
  const lastWithFrame = withTreatment.frames[withTreatment.frames.length - 1];
  const lastWithoutFrame = withoutTreatment.frames[withoutTreatment.frames.length - 1];

  const auraScoreDelta = lastWithFrame
    ? lastWithFrame.auraScoreProjection - (lastWithoutFrame?.auraScoreProjection || scanResult.auraScore.overall)
    : 0;
  const skinAgeDelta = lastWithoutFrame && lastWithFrame
    ? lastWithoutFrame.skinAgeProjection - lastWithFrame.skinAgeProjection
    : 0;

  // Cost of delay calculation
  const planCost = plan
    ? [...plan.recommendations.primary, ...plan.recommendations.complementary]
        .reduce((sum, t) => sum + t.totalEstimate, 0)
    : 4200; // Fallback estimate

  return {
    withTreatment,
    withoutTreatment,
    selection: {
      scope: selectedTreatmentIds && selectedTreatmentIds.length > 0 ? 'single-treatment' : 'full-plan',
      selectedTreatmentIds: selectedTreatmentIds || [],
      scenarioMode,
    },
    comparison: {
      auraScoreDelta,
      skinAgeDelta,
      keyDifferentiators: [
        `${auraScoreDelta}-point Aura Score difference at 1 year`,
        `${skinAgeDelta}-year skin age gap between paths`,
        `Treatment now: $${planCost.toLocaleString()} vs $${Math.round(planCost * 1.5).toLocaleString()}+ if delayed 3 years`,
      ],
    },
    costOfDelay: {
      currentPlanCost: planCost,
      costIfDelayed1Year: Math.round(planCost * 1.25),
      costIfDelayed3Years: Math.round(planCost * 1.8),
      reasoning:
        'As skin continues to age, more aggressive treatments are needed to achieve the same results. Starting now means less intervention and better outcomes.',
    },
  };
}

// ── WITH TREATMENT PATH ──

async function generateWithTreatmentPath(
  sourceImage: HTMLImageElement,
  width: number,
  height: number,
  scanResult: AuraScanResult,
  plan: MastermindPlan | null,
  selectedTreatmentIds?: string[],
  scenarioMode: 'conservative' | 'typical' | 'aggressive' = 'typical',
): Promise<SimulationPath> {
  const frames: SimulationFrame[] = [];
  const baseScore = scanResult.auraScore.overall;
  const baseSkinAge = scanResult.auraScore.skinAge;

  // Collect treatment filter presets from the plan
  const treatmentFilters = getTreatmentFilterSteps(plan, selectedTreatmentIds);

  for (const timeframe of WITH_TREATMENT_TIMEFRAMES) {
    // Progressive intensity: ramp up with time
    const progressFactor = getProgressFactor(timeframe.monthNumber, scenarioMode);

    // Scale treatment filters by progress
    const scaledFilters: FilterStep[] = treatmentFilters.map((f) => ({
      ...f,
      intensity: Math.min(1.0, f.intensity * progressFactor),
    }));

    // Render frame
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceImage, 0, 0, width, height);

    if (scaledFilters.length > 0) {
      applyFilterChain(ctx, width, height, scaledFilters);
    }

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Project scores
    const scoreImprovement = Math.round((100 - baseScore) * progressFactor * 0.6);
    const ageReduction = Math.round(
      (baseSkinAge - scanResult.auraScore.chronologicalAge) * progressFactor * 0.7
    );

    frames.push({
      imageDataUrl,
      timepoint: timeframe.key,
      monthNumber: timeframe.monthNumber,
      description: getWithTreatmentDescription(timeframe, plan, scenarioMode),
      auraScoreProjection: Math.min(98, baseScore + scoreImprovement),
      skinAgeProjection: Math.max(
        scanResult.auraScore.chronologicalAge - 5,
        baseSkinAge - ageReduction
      ),
    });
  }

  return {
    frames,
    narrative: plan
      ? plan.aiSummary.patientFacing
      : 'With a personalized treatment plan, your skin progressively improves month by month, addressing your top concerns with clinically-proven treatments.',
  };
}

// ── WITHOUT TREATMENT PATH ──

async function generateWithoutTreatmentPath(
  sourceImage: HTMLImageElement,
  width: number,
  height: number,
  scanResult: AuraScanResult,
  scenarioMode: 'conservative' | 'typical' | 'aggressive' = 'typical',
): Promise<SimulationPath> {
  const frames: SimulationFrame[] = [];
  const baseScore = scanResult.auraScore.overall;
  const baseSkinAge = scanResult.auraScore.skinAge;
  const age = scanResult.auraScore.chronologicalAge;

  // Calculate risk multiplier from lifestyle
  const riskMultiplier = calculateRiskMultiplier(scanResult, scenarioMode);

  const timeframeKeys = ['6months', '1year', '3years', '5years'];

  for (let i = 0; i < WITHOUT_TREATMENT_TIMEFRAMES.length; i++) {
    const timeframe = WITHOUT_TREATMENT_TIMEFRAMES[i];
    const presetKey = timeframeKeys[i];
    const basePreset = DEGRADATION_PRESETS[presetKey];

    if (!basePreset) continue;

    // Age-adjust the degradation
    const adjusted = getAgeAdjustedDegradation(basePreset, age, riskMultiplier);

    // Render frame with degradation filters applied directly
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceImage, 0, 0, width, height);

    // Apply degradation filters using dynamic import
    const {
      applyAgingProgression,
      applyTextureDegradation,
      applyToneDecline,
      applyElasticityLoss,
    } = await import('@/lib/photo-simulation/degradation-filters');

    const degradationMap: Record<string, Function> = {
      agingProgression: applyAgingProgression,
      textureDegradation: applyTextureDegradation,
      toneDecline: applyToneDecline,
      elasticityLoss: applyElasticityLoss,
    };

    for (const step of adjusted.filters) {
      const fn = degradationMap[step.filter];
      if (fn) fn(ctx, width, height, step.intensity);
    }

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Project declining scores
    const annualDecline = 2 * riskMultiplier;
    const years = timeframe.monthNumber / 12;
    const scoreDecline = Math.round(annualDecline * years);

    frames.push({
      imageDataUrl,
      timepoint: timeframe.key,
      monthNumber: timeframe.monthNumber,
      description: adjusted.description,
      auraScoreProjection: Math.max(15, baseScore - scoreDecline),
      skinAgeProjection: Math.round(baseSkinAge + years * 1.5 * riskMultiplier),
    });
  }

  return {
    frames,
    narrative:
      'Without intervention, natural aging combined with environmental factors will progressively deepen wrinkles, increase volume loss, and reduce skin elasticity. Treatment costs increase the longer you wait.',
  };
}

// ── HELPER FUNCTIONS ──

/** Get filter steps for the planned treatments */
function getTreatmentFilterSteps(
  plan: MastermindPlan | null,
  selectedTreatmentIds?: string[],
): FilterStep[] {
  if (!plan) {
    // Default fallback for draft/incomplete plans
    return [
      { filter: 'skinSmoothing', intensity: 0.5 },
      { filter: 'toneEvening', intensity: 0.4 },
      { filter: 'glow', intensity: 0.3 },
    ];
  }

  // Merge filter presets from all primary and complementary treatments
  const allFilters: FilterStep[] = [];
  const seen = new Set<string>();

  const allTreatments = [
    ...plan.recommendations.primary,
    ...plan.recommendations.complementary,
  ];
  const selectedSet = new Set(selectedTreatmentIds || []);
  const presetSelections = Array.from(selectedSet)
    .map((scopeId) => SERVICE_SCOPE_MAP.get(scopeId))
    .filter((scope): scope is SimulationServiceScopeOption => Boolean(scope));
  const selectedTreatmentOnly = Array.from(selectedSet).filter((scopeId) => !scopeId.startsWith('preset:'));

  for (const scope of presetSelections) {
    for (const presetKey of scope.presetKeys) {
      const preset = TREATMENT_PRESETS[presetKey];
      if (!preset) continue;
      for (const filter of preset.filters) {
        const dedupeKey = `${filter.filter}_${filter.intensity}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          allFilters.push(filter);
        }
      }
    }
  }

  const treatments =
    selectedTreatmentOnly.length > 0
      ? allTreatments.filter((tx) => selectedTreatmentOnly.includes(tx.id))
      : allTreatments;

  for (const tx of treatments) {
    const presetKeys = resolvePresetKeys(tx);
    for (const presetKey of presetKeys) {
      const preset = TREATMENT_PRESETS[presetKey];
      if (!preset) continue;
      for (const f of preset.filters) {
        const dedupeKey = `${f.filter}_${f.intensity}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          allFilters.push(f);
        }
      }
    }
  }

  // If selected treatment IDs yielded no matches, try full plan fallback
  if (allFilters.length === 0 && selectedSet.size > 0 && allTreatments.length > 0) {
    return getTreatmentFilterSteps(plan);
  }

  // If no presets matched, use default improvement filters
  if (allFilters.length === 0) {
    return [
      { filter: 'skinSmoothing', intensity: 0.5 },
      { filter: 'toneEvening', intensity: 0.4 },
      { filter: 'glow', intensity: 0.3 },
      { filter: 'brightening', intensity: 0.3 },
    ];
  }

  return allFilters;
}

function normalizeServiceCategory(raw: string): ServiceCategory | null {
  const normalized = raw.trim().toLowerCase();
  if (SERVICE_CATEGORIES.has(normalized as ServiceCategory)) {
    return normalized as ServiceCategory;
  }
  return CATEGORY_ALIASES[normalized] || null;
}

function resolvePresetKeys(tx: MastermindTreatment): string[] {
  const keys = new Set<string>();
  const name = tx.treatmentName.toLowerCase();
  const id = tx.id.toLowerCase();
  const normalizedCategory = normalizeServiceCategory(tx.category);

  if (normalizedCategory) {
    for (const preset of getPresetsForService(tx.id, normalizedCategory)) keys.add(preset);
    for (const preset of getPresetsForService(id, normalizedCategory)) keys.add(preset);
  }

  const fallback = findPresetKey(tx);
  if (fallback) keys.add(fallback);

  if (name.includes('sculptra') || id.includes('sculptra')) {
    keys.add('volume-restoration');
    keys.add('collagen-boost');
  }
  if (name.includes('botox') || name.includes('dysport') || name.includes('xeomin')) {
    keys.add('anti-aging');
  }
  if (
    name.includes('filler') ||
    name.includes('juvederm') ||
    name.includes('restylane') ||
    name.includes('radiesse')
  ) {
    keys.add('volume-restoration');
  }
  if (name.includes('prx')) {
    keys.add('collagen-boost');
    keys.add('brightening-hydration');
  }
  if (name.includes('laser hair') || id.startsWith('lhr-')) {
    keys.add('skin-rejuvenation');
  }
  if (name.includes('glp') || name.includes('semaglutide') || name.includes('tirzepatide')) {
    keys.add('body-contouring');
    keys.add('wellness-vitality');
  }
  if (
    name.includes('hormone') ||
    name.includes('trt') ||
    name.includes('hrt') ||
    name.includes('thyroid')
  ) {
    keys.add('wellness-vitality');
  }
  if (
    name.includes('peptide') ||
    name.includes('bpc') ||
    name.includes('ipamorelin') ||
    name.includes('cjc') ||
    name.includes('sermorelin')
  ) {
    keys.add('wellness-vitality');
    keys.add('collagen-boost');
  }

  return Array.from(keys).filter((key) => Boolean(TREATMENT_PRESETS[key]));
}

/** Map a treatment to a TREATMENT_PRESETS key */
function findPresetKey(tx: MastermindTreatment): string | null {
  const name = tx.treatmentName.toLowerCase();
  const category = tx.category.toLowerCase();

  if (name.includes('botox') || category.includes('neurotoxin')) return 'anti-aging';
  if (name.includes('filler') || category.includes('filler')) return 'volume-restoration';
  if (name.includes('sculptra')) return 'volume-restoration';
  if (name.includes('rf') || name.includes('microneedling')) return 'skin-rejuvenation';
  if (name.includes('hydrafacial')) return 'brightening-hydration';
  if (name.includes('peel') || name.includes('vi peel')) return 'tone-correction';
  if (name.includes('prx')) return 'collagen-boost';
  if (name.includes('laser') || name.includes('picoway')) return 'pigment-targeting';
  if (name.includes('sofwave')) return 'skin-tightening';
  if (name.includes('laser hair') || category.includes('laser-hair-removal')) return 'skin-rejuvenation';
  if (name.includes('glp') || name.includes('semaglutide') || name.includes('tirzepatide')) return 'body-contouring';
  if (name.includes('hormone') || name.includes('trt') || name.includes('hrt')) return 'wellness-vitality';
  if (name.includes('peptide') || name.includes('bpc') || name.includes('ipamorelin') || name.includes('cjc')) return 'wellness-vitality';
  if (category.includes('facial')) return 'overall-glow';

  return null;
}

/** Calculate progressive intensity factor (0→1) over treatment timeline */
function getProgressFactor(
  monthNumber: number,
  scenarioMode: 'conservative' | 'typical' | 'aggressive' = 'typical',
): number {
  const scenarioMultiplier =
    scenarioMode === 'conservative' ? 0.82 : scenarioMode === 'aggressive' ? 1.18 : 1;
  // Quick initial results (month 1 = 0.4), plateaus around month 6-12
  if (monthNumber <= 1) return Math.min(1, 0.35 * scenarioMultiplier);
  if (monthNumber <= 3) return Math.min(1, 0.6 * scenarioMultiplier);
  if (monthNumber <= 6) return Math.min(1, 0.85 * scenarioMultiplier);
  return Math.min(1, 1.0 * scenarioMultiplier);
}

/** Calculate risk multiplier from scan data */
function calculateRiskMultiplier(
  scanResult: AuraScanResult,
  scenarioMode: 'conservative' | 'typical' | 'aggressive' = 'typical',
): number {
  let multiplier = 1.0;

  for (const risk of scanResult.predictiveMetrics.riskFactors) {
    if (risk.impact === 'high') multiplier += 0.3;
    else if (risk.impact === 'medium') multiplier += 0.15;
    else multiplier += 0.05;
  }

  const scenarioDrag =
    scenarioMode === 'conservative' ? 1.15 : scenarioMode === 'aggressive' ? 0.9 : 1;
  return Math.min(2.0, multiplier * scenarioDrag);
}

/** Generate description for with-treatment timeframe */
function getWithTreatmentDescription(
  timeframe: TimeframeConfig,
  plan: MastermindPlan | null,
  scenarioMode: 'conservative' | 'typical' | 'aggressive' = 'typical',
): string {
  if (!plan) return `Projected improvement at ${timeframe.label}`;
  const scenarioText =
    scenarioMode === 'conservative'
      ? 'using conservative escalation'
      : scenarioMode === 'aggressive'
        ? 'using accelerated escalation'
        : 'using balanced escalation';

  switch (timeframe.key) {
    case '1M':
      return `Initial treatments taking effect ${scenarioText}. Wrinkle softening and volume restoration visible.`;
    case '3M':
      return `Core treatment series underway ${scenarioText}. Progressive texture and tone improvement.`;
    case '6M':
      return `Full treatment effects realized ${scenarioText}. Significant improvement across all concerns.`;
    case '1Y':
      return `Peak results with maintenance protocol ${scenarioText}. Optimal skin health achieved.`;
    default:
      return `Treatment progress at ${timeframe.label}`;
  }
}

// ── CANVAS UTILITIES ──

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function fitDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
}
