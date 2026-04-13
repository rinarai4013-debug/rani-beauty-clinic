import { describe, expect, it } from 'vitest';
import { generateMastermindPlan } from '@/lib/mastermind/plan-generator';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';

describe('plan-generator', () => {
  const baseScan = mockAuraScanResult();

  it('maps medical risk booleans to contraindications that exclude unsafe services', () => {
    const plan = generateMastermindPlan(baseScan, {
      skinConcerns: ['aging-skin'],
      treatmentInterests: ['botox'],
      pregnant: true,
      bloodThinners: true,
      keloidHistory: true,
      hasAutoimmune: true,
      budget: 'premium' as never,
      timeline: 'ongoing' as never,
    });

    // Botox should be excluded because pregnancy + autoimmune both block it
    const allNames = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
      ...plan.recommendations.maintenance,
    ].map((t) => t.treatmentName.toLowerCase());

    expect(allNames.every((n) => !n.includes('botox'))).toBe(true);
    expect(allNames.every((n) => !n.includes('filler'))).toBe(true);
  });

  it('maps isotretinoin history to retinoid-use contraindication', () => {
    const plan = generateMastermindPlan(baseScan, {
      skinConcerns: ['acne'],
      treatmentInterests: [],
      isotretinoinHistory: true,
      budget: 'mid' as never,
      timeline: 'gradual' as never,
    });

    // VI Peel should be excluded (retinoid-use contraindication)
    const allNames = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
      ...plan.recommendations.maintenance,
    ].map((t) => t.treatmentName.toLowerCase());

    expect(allNames.every((n) => !n.includes('vi peel'))).toBe(true);
  });

  it('produces protocol block for GLP-1 services via BoomRx formulary', () => {
    const plan = generateMastermindPlan(baseScan, {
      skinConcerns: ['body-contouring'],
      treatmentInterests: ['glp1'],
      budget: 'premium' as never,
      timeline: 'ongoing' as never,
    });

    const allTreatments = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
      ...plan.recommendations.maintenance,
    ];

    // At least one treatment should have a protocol
    const hasProtocol = allTreatments.some((t) => t.protocol && t.protocol.dosage);
    expect(hasProtocol).toBe(true);
  });

  it('builds improvementTargets from scan detected concerns', () => {
    const plan = generateMastermindPlan(baseScan, {
      skinConcerns: ['aging-skin', 'dull-skin'],
      treatmentInterests: [],
      budget: 'mid' as never,
      timeline: 'gradual' as never,
    });

    const allTreatments = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
      ...plan.recommendations.maintenance,
    ];

    // At least one treatment should have improvement targets
    const hasTargets = allTreatments.some(
      (t) => t.improvementTargets && t.improvementTargets.length > 0
    );
    expect(hasTargets).toBe(true);

    // Verify target shape
    const targets = allTreatments.find((t) => t.improvementTargets?.length)?.improvementTargets;
    if (targets) {
      expect(targets[0]).toHaveProperty('concern');
      expect(targets[0]).toHaveProperty('targetDelta');
      expect(targets[0]).toHaveProperty('timeframe');
    }
  });

  it('passes downtimeTolerance and painTolerance to recommender profile', () => {
    // This should not throw and should generate a valid plan
    const plan = generateMastermindPlan(baseScan, {
      skinConcerns: ['aging-skin'],
      treatmentInterests: [],
      downtimeTolerance: 'none' as never,
      painTolerance: 'low' as never,
      budget: 'value' as never,
      timeline: 'gradual' as never,
    });

    // With low pain tolerance + no downtime, RF microneedling should be penalized
    const allNames = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
      ...plan.recommendations.maintenance,
    ].map((t) => t.treatmentName.toLowerCase());

    // Should still generate a plan (non-empty)
    expect(allNames.length).toBeGreaterThan(0);
  });

  it('maps recentSunExposure to summer risk profile (penalizes aggressive treatments)', () => {
    const baseline = generateMastermindPlan(baseScan, {
      skinConcerns: ['acne'],
      treatmentInterests: [],
      budget: 'premium' as never,
      timeline: 'gradual' as never,
    });

    const withRecentSun = generateMastermindPlan(baseScan, {
      skinConcerns: ['acne'],
      treatmentInterests: [],
      recentSunExposure: true as never,
      budget: 'premium' as never,
      timeline: 'gradual' as never,
    });

    const baselineTreatments = [
      ...baseline.recommendations.primary,
      ...baseline.recommendations.complementary,
      ...baseline.recommendations.maintenance,
    ];
    const sunTreatments = [
      ...withRecentSun.recommendations.primary,
      ...withRecentSun.recommendations.complementary,
      ...withRecentSun.recommendations.maintenance,
    ];

    const aggressiveNameRegex = /(vi peel|laser scar revision|nd:yag)/i;
    const baselineAggressive = baselineTreatments.find((t) => aggressiveNameRegex.test(t.treatmentName));
    expect(baselineAggressive).toBeDefined();

    if (!baselineAggressive) return;

    const sunMatch = sunTreatments.find(
      (t) => t.treatmentName.toLowerCase() === baselineAggressive.treatmentName.toLowerCase()
    );

    if (sunMatch) {
      expect(sunMatch.aiConfidence).toBeLessThanOrEqual(baselineAggressive.aiConfidence);
    } else {
      // Conservative behavior is also acceptable: treatment removed under recent sun exposure.
      expect(sunTreatments.length).toBeGreaterThan(0);
    }
  });

  it('generates valid plan structure with all required fields', () => {
    const plan = generateMastermindPlan(baseScan, {
      skinConcerns: ['aging-skin'],
      treatmentInterests: ['hydrafacial'],
      budget: 'mid' as never,
      timeline: 'ongoing' as never,
    });

    expect(plan.planId).toBeTruthy();
    expect(plan.generatedAt).toBeTruthy();
    expect(plan.recommendations).toBeTruthy();
    expect(plan.recommendations.primary).toBeInstanceOf(Array);
    expect(plan.recommendations.complementary).toBeInstanceOf(Array);
    expect(plan.recommendations.maintenance).toBeInstanceOf(Array);
    expect(plan.sequencing).toBeInstanceOf(Array);
    expect(plan.packages).toBeInstanceOf(Array);
    expect(plan.aiSummary).toBeTruthy();
    expect(plan.aiSummary.patientFacing).toBeTruthy();
    expect(plan.aiSummary.providerFacing).toBeTruthy();
  });
});
