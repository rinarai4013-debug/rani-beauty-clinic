import { describe, expect, it } from 'vitest';
import { generateTierRecommendation, type SafetyStatus } from '@/lib/metabolic/tier-matrix';
import { metabolicIntakeSchema, type MetabolicIntake } from '@/lib/metabolic/matrix';

function makeIntake(overrides: Partial<MetabolicIntake> = {}): MetabolicIntake {
  const base = metabolicIntakeSchema.parse({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    goals: ['weight-loss'],
    symptoms: ['appetite-dysregulation'],
    fulfillmentPreference: 'clinic',
  });
  return { ...base, ...overrides } as MetabolicIntake;
}

describe('generateTierRecommendation', () => {
  it('returns foundation for low-intensity intake (1 goal, 1 symptom, eligible)', () => {
    const intake = makeIntake({ goals: ['weight-loss'], symptoms: ['fatigue'] });
    const result = generateTierRecommendation(intake, 'eligible');
    expect(result.tier).toBe('foundation');
    expect(result.intensityScore).toBeGreaterThan(0);
    expect(result.constrainedByStatus).toBe(false);
    expect(result.providerAuthorizationRequired).toBe(true);
  });

  it('returns performance for moderate-intensity intake (3 goals + 4 symptoms)', () => {
    const intake = makeIntake({
      goals: ['weight-loss', 'hormone-balance', 'energy'],
      symptoms: ['fatigue', 'brain-fog', 'appetite-dysregulation', 'poor-sleep'],
    });
    const result = generateTierRecommendation(intake, 'eligible');
    // 3 goals → +4, 4 symptoms → +3 = score 7 → performance
    expect(result.tier).toBe('performance');
    expect(result.intensityScore).toBe(7);
  });

  it('returns elite for high-intensity eligible intake with advanced labs', () => {
    const intake = makeIntake({
      goals: ['weight-loss', 'hormone-balance', 'energy'],
      symptoms: ['fatigue', 'brain-fog', 'appetite-dysregulation', 'poor-sleep', 'low-libido'],
      labs: { baselineLabsCompleted: true, latestA1c: 6.2, fastingGlucose: 110, tsh: undefined },
    });
    const result = generateTierRecommendation(intake, 'eligible');
    // 3 goals → +4, 5 symptoms → +5, labs: A1c +1, glucose +1, completed +1 = score 12 → elite
    expect(result.tier).toBe('elite');
    expect(result.intensityScore).toBeGreaterThanOrEqual(8);
  });

  it('caps at performance when status is provider-review-required (no elite entry)', () => {
    const intake = makeIntake({
      goals: ['weight-loss', 'hormone-balance', 'energy'],
      symptoms: ['fatigue', 'brain-fog', 'appetite-dysregulation', 'poor-sleep', 'low-libido'],
      labs: { baselineLabsCompleted: true, latestA1c: 6.2, fastingGlucose: 110, tsh: undefined },
    });
    const result = generateTierRecommendation(intake, 'provider-review-required');
    expect(result.tier).toBe('performance');
    expect(result.constrainedByStatus).toBe(true);
    expect(result.providerAuthorizationRequired).toBe(true);
  });

  it('returns foundation when status is ineligible (most conservative)', () => {
    const intake = makeIntake({
      goals: ['weight-loss', 'hormone-balance', 'energy'],
      symptoms: ['fatigue', 'brain-fog', 'appetite-dysregulation', 'poor-sleep', 'low-libido'],
    });
    const result = generateTierRecommendation(intake, 'ineligible');
    expect(result.tier).toBe('foundation');
    expect(result.constrainedByStatus).toBe(true);
  });

  it('sets constrainedByStatus false for eligible status', () => {
    const intake = makeIntake();
    const result = generateTierRecommendation(intake, 'eligible');
    expect(result.constrainedByStatus).toBe(false);
  });

  it('rationale includes goal and symptom descriptions', () => {
    const intake = makeIntake({ goals: ['weight-loss'], symptoms: ['appetite-dysregulation'] });
    const result = generateTierRecommendation(intake, 'eligible');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale.some((r) => r.includes('goal'))).toBe(true);
    expect(result.rationale.some((r) => r.includes('symptom'))).toBe(true);
  });

  it('rationale includes constraint note when status is not eligible', () => {
    const intake = makeIntake();
    const result = generateTierRecommendation(intake, 'provider-review-required');
    expect(result.rationale.some((r) => r.includes('constrained'))).toBe(true);
  });

  it('is fully deterministic across multiple calls', () => {
    const intake = makeIntake();
    const r1 = generateTierRecommendation(intake, 'eligible');
    const r2 = generateTierRecommendation(intake, 'eligible');
    expect(r1.tier).toBe(r2.tier);
    expect(r1.intensityScore).toBe(r2.intensityScore);
    expect(r1.constrainedByStatus).toBe(r2.constrainedByStatus);
  });
});
