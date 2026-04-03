import { describe, it, expect } from 'vitest';
import {
  mockAuraScanResult,
  mockMastermindPlan,
  mockSimulationComparison,
  mockMastermindSession,
} from '../mock-data';

/**
 * Verify mock factories produce valid, complete data structures.
 * This catches shape drift between mocks and types.
 */

describe('mockAuraScanResult', () => {
  it('produces valid aura score', () => {
    const scan = mockAuraScanResult();
    expect(scan.auraScore.overall).toBeGreaterThanOrEqual(0);
    expect(scan.auraScore.overall).toBeLessThanOrEqual(100);
    expect(scan.auraScore.grade).toMatch(/^[A-F]\+?$/);
    expect(scan.auraScore.skinAge).toBeGreaterThan(0);
    expect(scan.auraScore.chronologicalAge).toBeGreaterThan(0);
  });

  it('produces non-empty zone analysis', () => {
    const scan = mockAuraScanResult();
    expect(scan.zoneAnalysis.length).toBeGreaterThan(0);
    expect(scan.zoneAnalysis[0].zone).toBeTruthy();
    expect(scan.zoneAnalysis[0].zoneName).toBeTruthy();
  });

  it('produces non-empty concerns', () => {
    const scan = mockAuraScanResult();
    expect(scan.detectedConcerns.length).toBeGreaterThan(0);
    expect(scan.detectedConcerns[0].id).toBeTruthy();
    expect(scan.detectedConcerns[0].concern).toBeTruthy();
    expect(scan.detectedConcerns[0].zones.length).toBeGreaterThan(0);
  });

  it('produces predictive metrics for both paths', () => {
    const scan = mockAuraScanResult();
    const pm = scan.predictiveMetrics;
    expect(pm.withoutIntervention.sixMonths.auraScore).toBeTruthy();
    expect(pm.withTreatment.threeMonths.auraScore).toBeTruthy();
    expect(pm.riskFactors.length).toBeGreaterThan(0);
  });

  it('produces AURA device analysis', () => {
    const scan = mockAuraScanResult();
    expect(scan.auraDeviceAnalysis.categories).toHaveLength(5);
    expect(scan.auraDeviceAnalysis.compositeSkinScore).toBeGreaterThan(0);
  });

  it('accepts overrides', () => {
    const custom = mockAuraScanResult({ scanId: 'custom_scan' });
    expect(custom.scanId).toBe('custom_scan');
  });
});

describe('mockMastermindPlan', () => {
  it('produces treatments in all tiers', () => {
    const plan = mockMastermindPlan();
    expect(plan.recommendations.primary.length).toBeGreaterThan(0);
    expect(plan.recommendations.complementary.length).toBeGreaterThan(0);
    expect(plan.recommendations.maintenance.length).toBeGreaterThan(0);
  });

  it('produces 3 packages', () => {
    const plan = mockMastermindPlan();
    expect(plan.packages).toHaveLength(3);
    expect(plan.packages.map((p) => p.tier)).toEqual(['Start', 'Transform', 'Elite']);
  });

  it('produces sequencing phases', () => {
    const plan = mockMastermindPlan();
    expect(plan.sequencing.length).toBeGreaterThan(0);
    expect(plan.sequencing[0].treatments.length).toBeGreaterThan(0);
  });

  it('produces AI summary', () => {
    const plan = mockMastermindPlan();
    expect(plan.aiSummary.patientFacing).toBeTruthy();
    expect(plan.aiSummary.providerFacing).toBeTruthy();
    expect(plan.aiSummary.keyHighlights.length).toBeGreaterThan(0);
    expect(plan.aiSummary.addressedConcerns.length).toBeGreaterThan(0);
  });

  it('Transform package is highlighted', () => {
    const plan = mockMastermindPlan();
    const transform = plan.packages.find((p) => p.tier === 'Transform');
    expect(transform?.highlighted).toBe(true);
  });
});

describe('mockSimulationComparison', () => {
  it('produces with-treatment frames', () => {
    const sim = mockSimulationComparison();
    expect(sim.withTreatment.frames).toHaveLength(4);
    expect(sim.withTreatment.narrative).toBeTruthy();
  });

  it('produces without-treatment frames', () => {
    const sim = mockSimulationComparison();
    expect(sim.withoutTreatment.frames).toHaveLength(4);
  });

  it('produces comparison metrics', () => {
    const sim = mockSimulationComparison();
    expect(sim.comparison.auraScoreDelta).toBeGreaterThan(0);
    expect(sim.comparison.keyDifferentiators.length).toBeGreaterThan(0);
  });

  it('produces cost of delay', () => {
    const sim = mockSimulationComparison();
    expect(sim.costOfDelay.currentPlanCost).toBeGreaterThan(0);
    expect(sim.costOfDelay.costIfDelayed1Year).toBeGreaterThan(sim.costOfDelay.currentPlanCost);
    expect(sim.costOfDelay.costIfDelayed3Years).toBeGreaterThan(sim.costOfDelay.costIfDelayed1Year);
  });
});

describe('mockMastermindSession', () => {
  it('produces session at scan_complete phase by default', () => {
    const session = mockMastermindSession();
    expect(session.phase).toBe('scan_complete');
    expect(session.auraScanResult).toBeTruthy();
    expect(session.patientName).toBe('Sarah Johnson');
  });

  it('has null plan and review by default', () => {
    const session = mockMastermindSession();
    expect(session.mastermindPlan).toBeNull();
    expect(session.providerReview).toBeNull();
    expect(session.simulationComparison).toBeNull();
  });

  it('accepts overrides', () => {
    const session = mockMastermindSession({ phase: 'completed', patientName: 'Custom' });
    expect(session.phase).toBe('completed');
    expect(session.patientName).toBe('Custom');
  });
});
