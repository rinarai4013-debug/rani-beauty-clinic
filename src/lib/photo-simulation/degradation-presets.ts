/**
 * Degradation presets — maps timeframes and age brackets
 * to degradation filter chains for aging simulation.
 *
 * Uses the same TreatmentPreset shape from filter-presets.ts
 * so the unified filter chain can process both improvement and degradation.
 */

import type { DegradationFilterStep } from './filters';

export interface DegradationPreset {
  label: string;
  filters: DegradationFilterStep[];
  description: string;
}

/** Degradation presets by timeframe */
export const DEGRADATION_PRESETS: Record<string, DegradationPreset> = {
  '6months': {
    label: '6 Months Without Treatment',
    filters: [
      { filter: 'agingProgression', intensity: 0.1 },
      { filter: 'toneDecline', intensity: 0.08 },
      { filter: 'textureDegradation', intensity: 0.06 },
    ],
    description: 'Subtle early decline — fine lines deepen slightly, tone begins to dull',
  },
  '1year': {
    label: '1 Year Without Treatment',
    filters: [
      { filter: 'agingProgression', intensity: 0.2 },
      { filter: 'toneDecline', intensity: 0.15 },
      { filter: 'textureDegradation', intensity: 0.12 },
      { filter: 'elasticityLoss', intensity: 0.08 },
    ],
    description: 'Noticeable aging — wrinkles deepen, skin becomes duller, early volume loss',
  },
  '3years': {
    label: '3 Years Without Treatment',
    filters: [
      { filter: 'agingProgression', intensity: 0.45 },
      { filter: 'toneDecline', intensity: 0.35 },
      { filter: 'textureDegradation', intensity: 0.3 },
      { filter: 'elasticityLoss', intensity: 0.25 },
    ],
    description: 'Significant aging — deep wrinkles, laxity, uneven tone, texture loss',
  },
  '5years': {
    label: '5 Years Without Treatment',
    filters: [
      { filter: 'agingProgression', intensity: 0.7 },
      { filter: 'toneDecline', intensity: 0.55 },
      { filter: 'textureDegradation', intensity: 0.5 },
      { filter: 'elasticityLoss', intensity: 0.45 },
    ],
    description: 'Advanced aging — deep-set wrinkles, sagging, significant tone and texture changes',
  },
};

/** Get degradation preset for a timeframe */
export function getDegradationForTimeframe(timeframe: string): DegradationPreset | null {
  return DEGRADATION_PRESETS[timeframe] || null;
}

/**
 * Scale degradation intensity based on age and lifestyle risk factors.
 * Older patients and those with risk factors age faster.
 */
export function getAgeAdjustedDegradation(
  basePreset: DegradationPreset,
  age: number,
  riskMultiplier: number = 1.0
): DegradationPreset {
  // Age acceleration: faster aging after 40, much faster after 55
  const ageMultiplier = age < 35 ? 0.8 : age < 45 ? 1.0 : age < 55 ? 1.2 : 1.4;
  const totalMultiplier = ageMultiplier * riskMultiplier;

  return {
    ...basePreset,
    filters: basePreset.filters.map((f) => ({
      ...f,
      intensity: Math.min(1.0, f.intensity * totalMultiplier),
    })),
  };
}
