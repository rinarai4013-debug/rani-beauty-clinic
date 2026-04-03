import { describe, it, expect } from 'vitest';
import {
  getPhaseIndex,
  isPhaseAtLeast,
  canTransitionTo,
  isReadyForPresentation,
  isReadyForPdf,
  isReadyForCompletion,
  getSelectedPackage,
  getAllTreatments,
  getPlanTotalCost,
  getScoreProjection,
  getCostOfDelay,
  getComparisonMetrics,
  getAvailableSlides,
  calculateFinancingOptions,
  PRESENTATION_SLIDES,
} from '../index';
import { createSession } from '../session';
import { mockAuraScanResult, mockMastermindPlan, mockSimulationComparison } from '../mock-data';
import type { MastermindSession } from '@/types/mastermind';

function makeFullSession(): MastermindSession {
  return createSession({
    phase: 'presenting',
    auraScanResult: mockAuraScanResult(),
    mastermindPlan: mockMastermindPlan(),
    providerReview: {
      providerId: 'p1',
      providerName: 'Dr. Smith',
      modifications: [],
      clinicalNotes: [],
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
    },
    simulationComparison: mockSimulationComparison(),
    selectedPackageTier: 'Transform',
  });
}

// ── Phase Logic ──

describe('getPhaseIndex', () => {
  it('returns correct indices', () => {
    expect(getPhaseIndex('intake')).toBe(0);
    expect(getPhaseIndex('completed')).toBe(10);
    expect(getPhaseIndex('presenting')).toBe(9);
  });
});

describe('isPhaseAtLeast', () => {
  it('returns true when current >= target', () => {
    expect(isPhaseAtLeast('approved', 'plan_ready')).toBe(true);
    expect(isPhaseAtLeast('completed', 'intake')).toBe(true);
    expect(isPhaseAtLeast('intake', 'intake')).toBe(true);
  });

  it('returns false when current < target', () => {
    expect(isPhaseAtLeast('intake', 'scan_complete')).toBe(false);
    expect(isPhaseAtLeast('plan_ready', 'completed')).toBe(false);
  });
});

describe('canTransitionTo', () => {
  it('allows forward transitions', () => {
    expect(canTransitionTo('intake', 'scanning')).toBe(true);
    expect(canTransitionTo('approved', 'presenting')).toBe(true);
  });

  it('allows same-phase (no-op)', () => {
    expect(canTransitionTo('plan_ready', 'plan_ready')).toBe(true);
  });

  it('disallows backward transitions', () => {
    expect(canTransitionTo('completed', 'intake')).toBe(false);
    expect(canTransitionTo('presenting', 'plan_ready')).toBe(false);
  });
});

// ── Readiness Checks ──

describe('isReadyForPresentation', () => {
  it('returns true with full session data', () => {
    expect(isReadyForPresentation(makeFullSession())).toBe(true);
  });

  it('returns false without scan', () => {
    const session = makeFullSession();
    session.auraScanResult = null;
    expect(isReadyForPresentation(session)).toBe(false);
  });

  it('returns false without approved review', () => {
    const session = makeFullSession();
    session.providerReview!.approvalStatus = 'pending';
    expect(isReadyForPresentation(session)).toBe(false);
  });

  it('returns false without simulation', () => {
    const session = makeFullSession();
    session.simulationComparison = null;
    expect(isReadyForPresentation(session)).toBe(false);
  });
});

describe('isReadyForPdf', () => {
  it('returns true when ready for presentation + package selected', () => {
    expect(isReadyForPdf(makeFullSession())).toBe(true);
  });

  it('returns false without package selection', () => {
    const session = makeFullSession();
    session.selectedPackageTier = null;
    expect(isReadyForPdf(session)).toBe(false);
  });
});

describe('isReadyForCompletion', () => {
  it('returns true on presenting phase with full data', () => {
    expect(isReadyForCompletion(makeFullSession())).toBe(true);
  });

  it('returns false before presenting phase', () => {
    const session = makeFullSession();
    session.phase = 'approved';
    expect(isReadyForCompletion(session)).toBe(false);
  });
});

// ── Derived Selectors ──

describe('getSelectedPackage', () => {
  it('returns the matching package', () => {
    const session = makeFullSession();
    const pkg = getSelectedPackage(session);
    expect(pkg).toBeTruthy();
    expect(pkg!.tier).toBe('Transform');
  });

  it('returns null when no tier selected', () => {
    const session = makeFullSession();
    session.selectedPackageTier = null;
    expect(getSelectedPackage(session)).toBeNull();
  });

  it('returns null when no plan', () => {
    const session = createSession();
    expect(getSelectedPackage(session)).toBeNull();
  });
});

describe('getAllTreatments', () => {
  it('returns all treatments across tiers', () => {
    const plan = mockMastermindPlan();
    const all = getAllTreatments(plan);
    const total =
      plan.recommendations.primary.length +
      plan.recommendations.complementary.length +
      plan.recommendations.maintenance.length;
    expect(all).toHaveLength(total);
  });
});

describe('getPlanTotalCost', () => {
  it('sums all treatment estimates', () => {
    const plan = mockMastermindPlan();
    const cost = getPlanTotalCost(plan);
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });
});

describe('getScoreProjection', () => {
  it('returns projections from scan', () => {
    const session = makeFullSession();
    const proj = getScoreProjection(session);
    expect(proj).toBeTruthy();
    expect(proj!.current).toBe(session.auraScanResult!.auraScore.overall);
    expect(proj!.sixMonth).toBeGreaterThan(proj!.current);
  });

  it('returns null without scan', () => {
    const session = createSession();
    expect(getScoreProjection(session)).toBeNull();
  });
});

describe('getCostOfDelay', () => {
  it('returns cost data from simulation', () => {
    const session = makeFullSession();
    const cost = getCostOfDelay(session);
    expect(cost).toBeTruthy();
    expect(cost!.currentPlanCost).toBeGreaterThan(0);
    expect(cost!.costIfDelayed1Year).toBeGreaterThan(cost!.currentPlanCost);
  });

  it('returns null without simulation', () => {
    const session = createSession();
    expect(getCostOfDelay(session)).toBeNull();
  });
});

// ── Slide Availability ──

describe('getAvailableSlides', () => {
  it('returns all 5 slides for full session', () => {
    const slides = getAvailableSlides(makeFullSession());
    expect(slides).toHaveLength(5);
  });

  it('returns only scan slides when only scan exists', () => {
    const session = createSession({ auraScanResult: mockAuraScanResult() });
    const slides = getAvailableSlides(session);
    // aura-score and concern-breakdown require scan
    expect(slides.length).toBeGreaterThanOrEqual(2);
    expect(slides.every((s) => s.requiresData(session))).toBe(true);
  });

  it('returns empty for empty session', () => {
    const session = createSession();
    const slides = getAvailableSlides(session);
    expect(slides).toHaveLength(0);
  });
});

// ── Financing ──

describe('calculateFinancingOptions', () => {
  it('returns 4 options for valid amount', () => {
    const options = calculateFinancingOptions(4200);
    expect(options).toHaveLength(4);
    expect(options[0].termMonths).toBe(6);
    expect(options[0].apr).toBe(0);
    expect(options[3].termMonths).toBe(36);
  });

  it('returns empty for zero amount', () => {
    expect(calculateFinancingOptions(0)).toHaveLength(0);
  });

  it('returns empty for negative amount', () => {
    expect(calculateFinancingOptions(-100)).toHaveLength(0);
  });

  it('calculates correct monthly payments', () => {
    const options = calculateFinancingOptions(1200);
    const sixMonth = options.find((o) => o.termMonths === 6)!;
    expect(sixMonth.monthlyPayment).toBe(200); // 1200 / 6
    expect(sixMonth.totalCost).toBe(1200); // 0% APR
  });

  it('longer terms have higher total cost', () => {
    const options = calculateFinancingOptions(4200);
    expect(options[3].totalCost).toBeGreaterThan(options[0].totalCost);
  });
});
