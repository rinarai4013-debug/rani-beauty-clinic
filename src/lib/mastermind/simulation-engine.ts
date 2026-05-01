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
import { TREATMENT_PRESETS } from '@/lib/photo-simulation/filter-presets';
import {
  DEGRADATION_PRESETS,
  getAgeAdjustedDegradation,
} from '@/lib/photo-simulation/degradation-presets';

// ── TYPES ──

interface SimulationInput {
  sourceImageDataUrl: string;
  scanResult: AuraScanResult;
  plan: MastermindPlan | null; // null = use draft/mock data
  canvasWidth?: number;
  canvasHeight?: number;
}

interface TimeframeConfig {
  key: string;
  label: string;
  monthNumber: number;
}

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

// ── MAIN GENERATOR ──

export async function generateSimulationComparison(
  input: SimulationInput
): Promise<SimulationComparison> {
  const { sourceImageDataUrl, scanResult, plan } = input;
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
    plan
  );

  const withoutTreatment = await generateWithoutTreatmentPath(
    sourceImage,
    width,
    height,
    scanResult
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
  plan: MastermindPlan | null
): Promise<SimulationPath> {
  const frames: SimulationFrame[] = [];
  const baseScore = scanResult.auraScore.overall;
  const baseSkinAge = scanResult.auraScore.skinAge;

  // Collect treatment filter presets from the plan
  const treatmentFilters = getTreatmentFilterSteps(plan);

  for (const timeframe of WITH_TREATMENT_TIMEFRAMES) {
    // Progressive intensity: ramp up with time
    const progressFactor = getProgressFactor(timeframe.monthNumber);

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
      kind: 'photo-simulation',
      timepoint: timeframe.key,
      monthNumber: timeframe.monthNumber,
      description: getWithTreatmentDescription(timeframe, plan),
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
  scanResult: AuraScanResult
): Promise<SimulationPath> {
  const frames: SimulationFrame[] = [];
  const baseScore = scanResult.auraScore.overall;
  const baseSkinAge = scanResult.auraScore.skinAge;
  const age = scanResult.auraScore.chronologicalAge;

  // Calculate risk multiplier from lifestyle
  const riskMultiplier = calculateRiskMultiplier(scanResult);

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
      kind: 'photo-simulation',
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
function getTreatmentFilterSteps(plan: MastermindPlan | null): FilterStep[] {
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

  const treatments = [
    ...plan.recommendations.primary,
    ...plan.recommendations.complementary,
  ];

  for (const tx of treatments) {
    // Try to match treatment to a preset
    const presetKey = findPresetKey(tx);
    const preset = presetKey ? TREATMENT_PRESETS[presetKey] : null;

    if (preset) {
      for (const f of preset.filters) {
        const key = `${f.filter}_${f.intensity}`;
        if (!seen.has(key)) {
          seen.add(key);
          allFilters.push(f);
        }
      }
    }
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

/** Map a treatment to a TREATMENT_PRESETS key */
function findPresetKey(tx: MastermindTreatment): string | null {
  const name = tx.treatmentName.toLowerCase();
  const category = tx.category.toLowerCase();

  if (name.includes('botox') || category.includes('neurotoxin')) return 'anti-aging';
  if (name.includes('filler') || category.includes('filler')) return 'skin-tightening';
  if (name.includes('rf') || name.includes('microneedling')) return 'skin-rejuvenation';
  if (name.includes('hydrafacial')) return 'brightening-hydration';
  if (name.includes('peel') || name.includes('vi peel')) return 'tone-correction';
  if (name.includes('laser') || name.includes('picoway')) return 'pigment-targeting';
  if (name.includes('sofwave')) return 'skin-tightening';
  if (category.includes('facial')) return 'overall-glow';

  return null;
}

/** Calculate progressive intensity factor (0→1) over treatment timeline */
function getProgressFactor(monthNumber: number): number {
  // Quick initial results (month 1 = 0.4), plateaus around month 6-12
  if (monthNumber <= 1) return 0.35;
  if (monthNumber <= 3) return 0.6;
  if (monthNumber <= 6) return 0.85;
  return 1.0;
}

/** Calculate risk multiplier from scan data */
function calculateRiskMultiplier(scanResult: AuraScanResult): number {
  let multiplier = 1.0;

  for (const risk of scanResult.predictiveMetrics.riskFactors) {
    if (risk.impact === 'high') multiplier += 0.3;
    else if (risk.impact === 'medium') multiplier += 0.15;
    else multiplier += 0.05;
  }

  return Math.min(2.0, multiplier);
}

/** Generate description for with-treatment timeframe */
function getWithTreatmentDescription(
  timeframe: TimeframeConfig,
  plan: MastermindPlan | null
): string {
  if (!plan) return `Projected improvement at ${timeframe.label}`;

  switch (timeframe.key) {
    case '1M':
      return 'Initial treatments taking effect. Wrinkle softening and volume restoration visible.';
    case '3M':
      return 'Core treatment series underway. Progressive texture and tone improvement.';
    case '6M':
      return 'Full treatment effects realized. Significant improvement across all concerns.';
    case '1Y':
      return 'Peak results with maintenance protocol. Optimal skin health achieved.';
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
