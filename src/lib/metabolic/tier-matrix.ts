/**
 * Tier Matrix — Foundation / Performance / Elite
 *
 * Deterministic tier selection based on symptom/goal intensity
 * and safety status. No AI, no randomness — pure scoring.
 */

import type { MetabolicIntake } from './matrix';

// ── Tier Levels ──

export const TIER_LEVELS = ['foundation', 'performance', 'elite'] as const;
export type TierLevel = (typeof TIER_LEVELS)[number];

export type SafetyStatus = 'eligible' | 'provider-review-required' | 'ineligible';

// ── Output Type ──

export interface TierRecommendation {
  tier: TierLevel;
  intensityScore: number;
  rationale: string[];
  constrainedByStatus: boolean;
  providerAuthorizationRequired: true;
}

// ── Scoring ──

function computeIntensityScore(intake: MetabolicIntake): number {
  let score = 0;

  // Goal complexity
  if (intake.goals.length >= 3) score += 4;
  else if (intake.goals.length >= 1) score += 2;

  // Symptom burden
  if (intake.symptoms.length >= 5) score += 5;
  else if (intake.symptoms.length >= 3) score += 3;
  else score += 2;

  // Labs suggest advanced protocol need
  if (intake.labs.latestA1c !== undefined && intake.labs.latestA1c >= 5.7) score += 1;
  if (intake.labs.fastingGlucose !== undefined && intake.labs.fastingGlucose >= 100) score += 1;
  if (intake.labs.baselineLabsCompleted) score += 1;

  return score;
}

function resolveTier(score: number, status: SafetyStatus): TierLevel {
  // Most conservative tier for hard blocks
  if (status === 'ineligible') return 'foundation';

  if (score >= 8) {
    // Provider-review-required caps at performance — no unguarded elite entry
    return status === 'eligible' ? 'elite' : 'performance';
  }
  if (score >= 5) return 'performance';
  return 'foundation';
}

// ── Main Entry Point ──

export function generateTierRecommendation(
  intake: MetabolicIntake,
  status: SafetyStatus,
): TierRecommendation {
  const score = computeIntensityScore(intake);
  const tier = resolveTier(score, status);
  const constrained = status !== 'eligible';

  const rationale: string[] = [
    `${intake.goals.length} goal(s) scored: ${intake.goals.join(', ')}.`,
    `${intake.symptoms.length} symptom(s) scored: ${intake.symptoms.join(', ')}.`,
    intake.labs.baselineLabsCompleted
      ? 'Baseline labs present — advanced eligibility confirmed pending provider review.'
      : 'Baseline labs not yet completed — conservative entry tier applies.',
  ];

  if (constrained) {
    rationale.push(
      `Tier constrained by safety status "${status}". Progression requires provider authorization.`,
    );
  }

  return {
    tier,
    intensityScore: score,
    rationale,
    constrainedByStatus: constrained,
    providerAuthorizationRequired: true,
  };
}
