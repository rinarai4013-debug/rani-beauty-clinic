import { describe, it, expect } from 'vitest';
import {
  generateTrajectoryScenario,
  getScenarioAtTimeframe,
  SIMULATION_DISCLAIMER,
} from '@/lib/photo-simulation/trajectory-scenarios';
import { SIMULATION_TIMEFRAMES } from '@/lib/photo-simulation/service-simulation-profiles';

// ── Determinism ───────────────────────────────────────────────────────────

describe('generateTrajectoryScenario — determinism', () => {
  it('produces identical output on repeated calls for same serviceKey', () => {
    const a = generateTrajectoryScenario('botox');
    const b = generateTrajectoryScenario('botox');
    expect(a).toEqual(b);
  });

  it('produces different output for different serviceKeys', () => {
    const botox = generateTrajectoryScenario('botox');
    const sculptra = generateTrajectoryScenario('sculptra');
    // Sculptra peaks late; botox peaks early
    const botox3m = getScenarioAtTimeframe(botox, '3m');
    const sculptra3m = getScenarioAtTimeframe(sculptra, '3m');
    expect(botox3m.withTreatment!.improvementScore).not.toBe(
      sculptra3m.withTreatment!.improvementScore,
    );
  });
});

// ── WithTreatment > WithoutTreatment ──────────────────────────────────────

describe('withTreatment always better than withoutTreatment', () => {
  const supportedServices = [
    'botox', 'fillers', 'sculptra', 'prx-peel', 'rfmn',
    'laser-hair-removal', 'sofwave', 'glp1', 'hormones', 'peptides',
  ];

  for (const service of supportedServices) {
    it(`${service}: withTreatment.improvementScore > withoutTreatment at every timeframe`, () => {
      const scenario = generateTrajectoryScenario(service);
      for (const tf of SIMULATION_TIMEFRAMES) {
        const { withTreatment, withoutTreatment } = getScenarioAtTimeframe(scenario, tf);
        expect(withTreatment).not.toBeNull();
        expect(withoutTreatment).not.toBeNull();
        expect(withTreatment!.improvementScore).toBeGreaterThan(
          withoutTreatment!.improvementScore,
        );
      }
    });
  }
});

// ── Timeline completeness ─────────────────────────────────────────────────

describe('timeline completeness', () => {
  it('includes all 4 timeframe points in both arrays', () => {
    const scenario = generateTrajectoryScenario('rfmn');
    expect(scenario.withTreatment).toHaveLength(4);
    expect(scenario.withoutTreatment).toHaveLength(4);
    const tfs = scenario.withTreatment.map((p) => p.timeframe);
    expect(tfs).toContain('1m');
    expect(tfs).toContain('3m');
    expect(tfs).toContain('6m');
    expect(tfs).toContain('12m');
  });

  it('each TrajectoryPoint has all required fields', () => {
    const scenario = generateTrajectoryScenario('sofwave');
    for (const point of [...scenario.withTreatment, ...scenario.withoutTreatment]) {
      expect(point.timeframe).toBeDefined();
      expect(typeof point.improvementScore).toBe('number');
      expect(typeof point.confidenceLevel).toBe('number');
      expect(typeof point.label).toBe('string');
      expect(point.label.length).toBeGreaterThan(0);
    }
  });

  it('improvementScore is within 0-100 range', () => {
    const scenario = generateTrajectoryScenario('sculptra');
    for (const point of [...scenario.withTreatment, ...scenario.withoutTreatment]) {
      expect(point.improvementScore).toBeGreaterThanOrEqual(0);
      expect(point.improvementScore).toBeLessThanOrEqual(100);
    }
  });

  it('confidenceLevel is within 0-1 range', () => {
    const scenario = generateTrajectoryScenario('laser-hair-removal');
    for (const point of [...scenario.withTreatment, ...scenario.withoutTreatment]) {
      expect(point.confidenceLevel).toBeGreaterThan(0);
      expect(point.confidenceLevel).toBeLessThanOrEqual(1);
    }
  });
});

// ── Safety: disclaimer ────────────────────────────────────────────────────

describe('safety constraints', () => {
  it('disclaimer is present and matches required text', () => {
    const scenario = generateTrajectoryScenario('botox');
    expect(scenario.disclaimer).toBe(SIMULATION_DISCLAIMER);
    expect(scenario.disclaimer).toContain('Illustrative simulation');
    expect(scenario.disclaimer).toContain('not a diagnosis or guaranteed outcome');
  });

  it('assumptions array is non-empty', () => {
    const scenario = generateTrajectoryScenario('prx-peel');
    expect(scenario.assumptions.length).toBeGreaterThan(0);
  });
});

// ── Metabolic tracks ──────────────────────────────────────────────────────

describe('metabolic track flags', () => {
  it('glp1 is marked isVisual:false', () => {
    expect(generateTrajectoryScenario('glp1').isVisual).toBe(false);
  });

  it('hormones is marked isVisual:false', () => {
    expect(generateTrajectoryScenario('hormones').isVisual).toBe(false);
  });

  it('peptides is marked isVisual:false', () => {
    expect(generateTrajectoryScenario('peptides').isVisual).toBe(false);
  });

  it('metabolic assumptions include non-visual note', () => {
    const scenario = generateTrajectoryScenario('glp1');
    const hasNote = scenario.assumptions.some((a) =>
      a.toLowerCase().includes('non-visual') || a.toLowerCase().includes('internal marker'),
    );
    expect(hasNote).toBe(true);
  });
});

// ── Boundary: unknown service ─────────────────────────────────────────────

describe('boundary checks', () => {
  it('unknown serviceKey falls back to default profile — never throws', () => {
    expect(() => generateTrajectoryScenario('totally-unknown-service-xyz')).not.toThrow();
  });

  it('default fallback has valid shape', () => {
    const scenario = generateTrajectoryScenario('not-a-real-service');
    expect(scenario.withTreatment).toHaveLength(4);
    expect(scenario.withoutTreatment).toHaveLength(4);
    expect(scenario.disclaimer).toBeDefined();
  });

  it('getScenarioAtTimeframe returns null for both when timeframe invalid', () => {
    const scenario = generateTrajectoryScenario('botox');
    // @ts-expect-error intentional invalid timeframe for boundary test
    const result = getScenarioAtTimeframe(scenario, '99m');
    expect(result.withTreatment).toBeNull();
    expect(result.withoutTreatment).toBeNull();
  });
});
