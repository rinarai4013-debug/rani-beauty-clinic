/**
 * Deterministic treatment trajectory engine.
 *
 * Produces comparative withTreatment / withoutTreatment progression data
 * across standard timeframes. All outputs are illustrative only.
 *
 * SAFETY CONSTRAINTS (hard requirements):
 *   - No clinical claims or guaranteed outcomes.
 *   - No dosage or prescribing guidance.
 *   - Disclaimer must be displayed at every consumer.
 *   - Non-visual metabolic tracks flagged as non-visual.
 */

import {
  getServiceProfile,
  SIMULATION_TIMEFRAMES,
  type SimulationTimeframe,
  type ServiceSimulationProfile,
} from './service-simulation-profiles';

export type { SimulationTimeframe };

/** Required disclaimer — must be displayed at every UI entry point */
export const SIMULATION_DISCLAIMER =
  'Illustrative simulation, not a diagnosis or guaranteed outcome. Individual results vary.';

export interface TrajectoryPoint {
  timeframe: SimulationTimeframe;
  improvementScore: number;  // 0-100 illustrative score
  confidenceLevel: number;   // 0-1
  label: string;
}

export interface TrajectoryScenario {
  serviceKey: string;
  displayName: string;
  isVisual: boolean;
  withTreatment: TrajectoryPoint[];
  withoutTreatment: TrajectoryPoint[];
  assumptions: string[];
  disclaimer: string;
}

// ── Internal constants ───────────────────────────────────────────

/** Illustrative baseline decline without treatment */
const WITHOUT_TREATMENT_CURVE: Record<SimulationTimeframe, number> = {
  '1m': 0,
  '3m': -3,
  '6m': -7,
  '12m': -12,
};

const BASELINE_WITHOUT_SCORE = 50;

/** Confidence levels: shorter timeframes = less certainty */
const CONFIDENCE_BY_TIMEFRAME: Record<SimulationTimeframe, number> = {
  '1m': 0.55,
  '3m': 0.70,
  '6m': 0.80,
  '12m': 0.75,
};

const LABELS_WITH_TREATMENT: Record<SimulationTimeframe, string> = {
  '1m': 'Initial improvements emerging',
  '3m': 'Visible treatment response',
  '6m': 'Progressive results evident',
  '12m': 'Sustained outcome at 12 months',
};

const LABELS_WITHOUT_TREATMENT: Record<SimulationTimeframe, string> = {
  '1m': 'Baseline maintained',
  '3m': 'Early natural changes continue',
  '6m': 'Untreated progression',
  '12m': 'Cumulative untreated change',
};

// ── Builders ─────────────────────────────────────────────────────

function buildWithTreatmentPoints(profile: ServiceSimulationProfile): TrajectoryPoint[] {
  return SIMULATION_TIMEFRAMES.map((tf) => ({
    timeframe: tf,
    improvementScore: profile.treatmentCurve[tf],
    confidenceLevel: CONFIDENCE_BY_TIMEFRAME[tf],
    label: LABELS_WITH_TREATMENT[tf],
  }));
}

function buildWithoutTreatmentPoints(): TrajectoryPoint[] {
  return SIMULATION_TIMEFRAMES.map((tf) => ({
    timeframe: tf,
    improvementScore: Math.max(0, BASELINE_WITHOUT_SCORE + WITHOUT_TREATMENT_CURVE[tf]),
    confidenceLevel: CONFIDENCE_BY_TIMEFRAME[tf],
    label: LABELS_WITHOUT_TREATMENT[tf],
  }));
}

function buildAssumptions(profile: ServiceSimulationProfile): string[] {
  const base: string[] = [
    'Patient follows recommended treatment protocol',
    'No significant confounding health changes during observation period',
    profile.courseNote,
  ];
  if (!profile.isVisual) {
    base.push(
      'Metabolic progression is an internal marker — not a visible aesthetic change',
    );
  }
  return base;
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Generate a deterministic trajectory scenario for a given service.
 * Same serviceKey always produces the same output (pure function, no randomness).
 *
 * Unknown serviceKey falls back to DEFAULT_SERVICE_PROFILE — never throws.
 */
export function generateTrajectoryScenario(serviceKey: string): TrajectoryScenario {
  const profile = getServiceProfile(serviceKey);

  return {
    serviceKey: profile.serviceKey,
    displayName: profile.displayName,
    isVisual: profile.isVisual,
    withTreatment: buildWithTreatmentPoints(profile),
    withoutTreatment: buildWithoutTreatmentPoints(),
    assumptions: buildAssumptions(profile),
    disclaimer: SIMULATION_DISCLAIMER,
  };
}

/**
 * Extract a single timeframe snapshot from a scenario.
 * Returns null slots if timeframe not found (should not happen with valid input).
 */
export function getScenarioAtTimeframe(
  scenario: TrajectoryScenario,
  timeframe: SimulationTimeframe,
): { withTreatment: TrajectoryPoint | null; withoutTreatment: TrajectoryPoint | null } {
  return {
    withTreatment: scenario.withTreatment.find((p) => p.timeframe === timeframe) ?? null,
    withoutTreatment: scenario.withoutTreatment.find((p) => p.timeframe === timeframe) ?? null,
  };
}
