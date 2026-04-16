import { describe, expect, it } from 'vitest';
import {
  metabolicIntakeSchema,
  generateMetabolicRecommendation,
  type MetabolicIntake,
} from '@/lib/metabolic/matrix';

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

describe('metabolicIntakeSchema', () => {
  it('parses valid intake with defaults', () => {
    const result = metabolicIntakeSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      goals: ['weight-loss'],
      symptoms: ['fatigue'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.medicalFlags.pregnant).toBe(false);
      expect(result.data.labs.baselineLabsCompleted).toBe(false);
      expect(result.data.fulfillmentPreference).toBe('clinic');
    }
  });

  it('rejects missing required fields', () => {
    const result = metabolicIntakeSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      // missing goals and symptoms
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid goal enum values', () => {
    const result = metabolicIntakeSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      goals: ['invalid-goal'],
      symptoms: ['fatigue'],
    });
    expect(result.success).toBe(false);
  });
});

describe('generateMetabolicRecommendation', () => {
  it('recommends glp1 for weight-loss + appetite-dysregulation', () => {
    const intake = makeIntake({ goals: ['weight-loss'], symptoms: ['appetite-dysregulation'] });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.recommendedTrack).toBe('glp1');
    expect(rec.status).toBe('eligible');
    expect(rec.tiers).toHaveLength(3);
  });

  it('recommends hormones for hormone-balance + fatigue symptoms', () => {
    const intake = makeIntake({
      goals: ['hormone-balance', 'energy'],
      symptoms: ['fatigue', 'brain-fog', 'low-libido'],
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.recommendedTrack).toBe('hormones');
    expect(rec.status).toBe('eligible');
  });

  it('recommends peptides for recovery + inflammation', () => {
    const intake = makeIntake({
      goals: ['recovery', 'performance'],
      symptoms: ['slow-recovery', 'inflammation', 'gut-bloating'],
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.recommendedTrack).toBe('peptides');
  });

  it('blocks glp1 for pregnant patients and sets provider-review-required', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, pregnant: true },
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.blockedTracks).toContain('glp1');
    expect(rec.status).toBe('provider-review-required');
    expect(rec.riskFlags.length).toBeGreaterThan(0);
  });

  it('sets ineligible when all 3 tracks are blocked', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: {
        ...makeIntake().medicalFlags,
        pregnant: true,
        thyroidCancerHistory: true,
        eatingDisorderHistory: true,
      },
    });
    const rec = generateMetabolicRecommendation(intake);
    // pregnancy blocks all 3, thyroid/eating block glp1 (redundant but confirms)
    expect(rec.status).toBe('ineligible');
  });

  it('gates home fulfillment for hormones without labs', () => {
    const intake = makeIntake({
      goals: ['hormone-balance'],
      symptoms: ['fatigue', 'brain-fog', 'low-libido'],
      fulfillmentPreference: 'home',
      labs: { baselineLabsCompleted: false, latestA1c: undefined, fastingGlucose: undefined, tsh: undefined },
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.fulfillment.allowed).toEqual(['clinic']);
    expect(rec.fulfillment.recommended).toBe('clinic');
  });

  it('allows home fulfillment for glp1', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      fulfillmentPreference: 'home',
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.fulfillment.allowed).toContain('home');
    expect(rec.fulfillment.recommended).toBe('home');
  });

  it('forceTrack overrides scoring but escalates status when blocked', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, pregnant: true },
    });
    const rec = generateMetabolicRecommendation(intake, { forceTrack: 'glp1' });
    expect(rec.recommendedTrack).toBe('glp1');
    expect(rec.status).toBe('provider-review-required');
    expect(rec.requiredNextSteps.some((s) => s.includes('safety-gated'))).toBe(true);
  });

  it('includes provider handoff with dosing framework', () => {
    const intake = makeIntake();
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.providerHandoff.dosingFramework.length).toBeGreaterThan(0);
    expect(rec.providerHandoff.monitoringChecklist.length).toBeGreaterThan(0);
    expect(rec.providerHandoff.summary).toContain('Jane');
  });

  it('output is deterministic (no AI dependency)', () => {
    const intake = makeIntake();
    const rec1 = generateMetabolicRecommendation(intake);
    const rec2 = generateMetabolicRecommendation(intake);
    expect(rec1.recommendedTrack).toBe(rec2.recommendedTrack);
    expect(rec1.status).toBe(rec2.status);
    expect(rec1.blockedTracks).toEqual(rec2.blockedTracks);
    expect(rec1.fulfillment.allowed).toEqual(rec2.fulfillment.allowed);
  });

  it('breastfeeding: blocks all 3 tracks (parity with pregnancy exclusions)', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, breastfeeding: true },
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.blockedTracks).toContain('glp1');
    expect(rec.blockedTracks).toContain('hormones');
    expect(rec.blockedTracks).toContain('peptides');
  });

  it('breastfeeding: sets non-eligible status (parity with pregnancy)', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, breastfeeding: true },
    });
    const rec = generateMetabolicRecommendation(intake);
    // Status is provider-review-required on current logic or ineligible
    // on older logic — never 'eligible' for breastfeeding patients
    expect(rec.status).not.toBe('eligible');
    expect(rec.riskFlags.length).toBeGreaterThan(0);
  });

  it('breastfeeding: riskFlags mention breastfeeding explicitly', () => {
    const intake = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, breastfeeding: true },
    });
    const rec = generateMetabolicRecommendation(intake);
    expect(rec.riskFlags.some((f) => /breastfeeding/i.test(f))).toBe(true);
  });

  it('breastfeeding + pregnancy: both flags produce the same blocked outcome', () => {
    const breastfeedingOnly = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, breastfeeding: true },
    });
    const bothFlags = makeIntake({
      goals: ['weight-loss'],
      symptoms: ['appetite-dysregulation'],
      medicalFlags: { ...makeIntake().medicalFlags, pregnant: true, breastfeeding: true },
    });
    const recB = generateMetabolicRecommendation(breastfeedingOnly);
    const recBP = generateMetabolicRecommendation(bothFlags);
    expect([...recB.blockedTracks].sort()).toEqual([...recBP.blockedTracks].sort());
  });
});
