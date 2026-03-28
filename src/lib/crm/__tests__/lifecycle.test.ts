/**
 * Lifecycle Engine Tests — 40 tests
 */

import {
  evaluateLifecycle,
  determineStage,
  evaluateCondition,
  evaluateMilestones,
  calculateProjectedLTV,
  calculateRetentionRisk,
  calculateLifecycleMetrics,
  getStageTemplates,
  getWinBackSequence,
  TRANSITION_RULES,
} from '../lifecycle';
import type { LifecycleStage, TransitionCondition, ClientLifecycle } from '@/types/crm';

interface LifecycleInput {
  clientId: string;
  clientName: string;
  currentStage: LifecycleStage;
  totalVisits: number;
  totalSpend: number;
  avgTicket: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  hasMembership: boolean;
  membershipTier?: string;
  communicationPreference: 'email' | 'sms' | 'phone';
  visitDates: string[];
  transactionAmounts: number[];
  birthday?: string;
  firstVisitDate?: string;
}

function makeInput(overrides: Partial<LifecycleInput> = {}): LifecycleInput {
  return {
    clientId: 'c_test',
    clientName: 'Test Client',
    currentStage: 'active',
    totalVisits: 3,
    totalSpend: 1500,
    avgTicket: 500,
    lastVisitDate: '2026-03-15',
    daysSinceLastVisit: 11,
    hasMembership: false,
    communicationPreference: 'email',
    visitDates: ['2026-03-15', '2026-02-15', '2026-01-15'],
    transactionAmounts: [500, 500, 500],
    ...overrides,
  };
}

// ─── Stage Determination Tests ───────────────────────────────

describe('Lifecycle - Stage Determination', () => {
  test('should detect prospect (0 visits)', () => {
    const input = makeInput({ currentStage: 'prospect', totalVisits: 0, daysSinceLastVisit: 999 });
    expect(determineStage(input)).toBe('prospect');
  });

  test('should transition prospect → first_visit (1 visit)', () => {
    const input = makeInput({ currentStage: 'prospect', totalVisits: 1, daysSinceLastVisit: 5 });
    expect(determineStage(input)).toBe('first_visit');
  });

  test('should transition first_visit → active (2+ visits)', () => {
    const input = makeInput({ currentStage: 'first_visit', totalVisits: 2, daysSinceLastVisit: 10 });
    expect(determineStage(input)).toBe('active');
  });

  test('should transition active → loyal (5+ visits, $2K+ spend)', () => {
    const input = makeInput({ currentStage: 'active', totalVisits: 5, totalSpend: 2500, daysSinceLastVisit: 15 });
    expect(determineStage(input)).toBe('loyal');
  });

  test('should transition loyal → vip (10+ visits, $5K+ spend)', () => {
    const input = makeInput({ currentStage: 'loyal', totalVisits: 12, totalSpend: 6000, daysSinceLastVisit: 10 });
    expect(determineStage(input)).toBe('vip');
  });

  test('should detect at_risk (active, 46-90 days inactive)', () => {
    const input = makeInput({ currentStage: 'active', daysSinceLastVisit: 55 });
    expect(determineStage(input)).toBe('at_risk');
  });

  test('should detect dormant (91-180 days inactive)', () => {
    const input = makeInput({ currentStage: 'active', daysSinceLastVisit: 120 });
    expect(determineStage(input)).toBe('dormant');
  });

  test('should detect lost (180+ days inactive)', () => {
    const input = makeInput({ currentStage: 'active', daysSinceLastVisit: 200 });
    expect(determineStage(input)).toBe('lost');
  });

  test('should detect reactivation (dormant, recent visit)', () => {
    const input = makeInput({ currentStage: 'dormant', totalVisits: 3, daysSinceLastVisit: 5 });
    expect(determineStage(input)).toBe('reactivated');
  });

  test('should detect reactivation from lost', () => {
    const input = makeInput({ currentStage: 'lost', daysSinceLastVisit: 7 });
    expect(determineStage(input)).toBe('reactivated');
  });
});

// ─── Condition Evaluation Tests ──────────────────────────────

describe('Lifecycle - Condition Evaluation', () => {
  test('should evaluate gt condition', () => {
    const cond: TransitionCondition = { field: 'totalVisits', operator: 'gt', value: 5 };
    expect(evaluateCondition(cond, makeInput({ totalVisits: 6 }))).toBe(true);
    expect(evaluateCondition(cond, makeInput({ totalVisits: 5 }))).toBe(false);
  });

  test('should evaluate lt condition', () => {
    const cond: TransitionCondition = { field: 'daysSinceLastVisit', operator: 'lt', value: 30 };
    expect(evaluateCondition(cond, makeInput({ daysSinceLastVisit: 15 }))).toBe(true);
    expect(evaluateCondition(cond, makeInput({ daysSinceLastVisit: 35 }))).toBe(false);
  });

  test('should evaluate gte condition', () => {
    const cond: TransitionCondition = { field: 'totalSpend', operator: 'gte', value: 2000 };
    expect(evaluateCondition(cond, makeInput({ totalSpend: 2000 }))).toBe(true);
    expect(evaluateCondition(cond, makeInput({ totalSpend: 1999 }))).toBe(false);
  });

  test('should evaluate between condition', () => {
    const cond: TransitionCondition = { field: 'daysSinceLastVisit', operator: 'between', value: [46, 90] };
    expect(evaluateCondition(cond, makeInput({ daysSinceLastVisit: 60 }))).toBe(true);
    expect(evaluateCondition(cond, makeInput({ daysSinceLastVisit: 30 }))).toBe(false);
    expect(evaluateCondition(cond, makeInput({ daysSinceLastVisit: 100 }))).toBe(false);
  });

  test('should handle unknown field gracefully', () => {
    const cond: TransitionCondition = { field: 'unknownField', operator: 'gt', value: 5 };
    expect(evaluateCondition(cond, makeInput())).toBe(false);
  });
});

// ─── Milestone Tests ─────────────────────────────────────────

describe('Lifecycle - Milestones', () => {
  test('should detect 5th visit milestone as achieved', () => {
    const input = makeInput({ totalVisits: 7 });
    const milestones = evaluateMilestones(input);
    const fifth = milestones.find(m => m.label === '5th Visit');
    expect(fifth?.achieved).toBe(true);
  });

  test('should detect 5th visit milestone as not achieved', () => {
    const input = makeInput({ totalVisits: 3 });
    const milestones = evaluateMilestones(input);
    const fifth = milestones.find(m => m.label === '5th Visit');
    expect(fifth?.achieved).toBe(false);
    expect(fifth?.currentValue).toBe(3);
  });

  test('should detect $1K spend milestone', () => {
    const input = makeInput({ totalSpend: 1200 });
    const milestones = evaluateMilestones(input);
    const threshold = milestones.find(m => m.label === '$1,000 Invested');
    expect(threshold?.achieved).toBe(true);
  });

  test('should detect $5K spend milestone as not achieved', () => {
    const input = makeInput({ totalSpend: 3000 });
    const milestones = evaluateMilestones(input);
    const threshold = milestones.find(m => m.label === '$5,000 Invested');
    expect(threshold?.achieved).toBe(false);
  });

  test('should detect anniversary milestone', () => {
    const input = makeInput({ firstVisitDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString() });
    const milestones = evaluateMilestones(input);
    const anniversary = milestones.find(m => m.label === '1 Year Anniversary');
    expect(anniversary?.achieved).toBe(true);
  });

  test('should have reward for each milestone', () => {
    const input = makeInput();
    const milestones = evaluateMilestones(input);
    for (const m of milestones) {
      expect(m.rewardOffered).toBeDefined();
    }
  });
});

// ─── LTV Projection Tests ───────────────────────────────────

describe('Lifecycle - Projected LTV', () => {
  test('should project higher LTV for VIP clients', () => {
    const vipInput = makeInput({ currentStage: 'vip', totalVisits: 12, totalSpend: 8000 });
    const activeInput = makeInput({ currentStage: 'active', totalVisits: 3, totalSpend: 1500 });
    const vipLTV = calculateProjectedLTV(vipInput);
    const activeLTV = calculateProjectedLTV(activeInput);
    expect(vipLTV).toBeGreaterThan(activeLTV);
  });

  test('should project lower LTV for at-risk clients', () => {
    const atRisk = makeInput({ currentStage: 'active', daysSinceLastVisit: 60, totalVisits: 3, totalSpend: 1500 });
    const active = makeInput({ currentStage: 'active', daysSinceLastVisit: 10, totalVisits: 3, totalSpend: 1500 });
    expect(calculateProjectedLTV(atRisk)).toBeLessThan(calculateProjectedLTV(active));
  });

  test('should return estimate for prospects', () => {
    const input = makeInput({ currentStage: 'prospect', totalVisits: 0, totalSpend: 0 });
    expect(calculateProjectedLTV(input)).toBeGreaterThan(0);
  });

  test('should factor in visit frequency', () => {
    const frequent = makeInput({
      totalVisits: 6, totalSpend: 3000,
      visitDates: ['2026-03-15', '2026-03-01', '2026-02-15', '2026-02-01', '2026-01-15', '2026-01-01'],
    });
    const infrequent = makeInput({
      totalVisits: 2, totalSpend: 1000,
      visitDates: ['2026-03-15', '2025-09-15'],
    });
    expect(calculateProjectedLTV(frequent)).toBeGreaterThan(calculateProjectedLTV(infrequent));
  });
});

// ─── Retention Risk Tests ────────────────────────────────────

describe('Lifecycle - Retention Risk', () => {
  test('should have low risk for recent visitors', () => {
    const input = makeInput({ daysSinceLastVisit: 5 });
    expect(calculateRetentionRisk(input)).toBeLessThan(20);
  });

  test('should have higher risk for lapsed visitors', () => {
    const input = makeInput({ daysSinceLastVisit: 60 });
    expect(calculateRetentionRisk(input)).toBeGreaterThan(25);
  });

  test('should have highest risk for long-lapsed visitors', () => {
    const input = makeInput({ daysSinceLastVisit: 100 });
    expect(calculateRetentionRisk(input)).toBeGreaterThan(35);
  });

  test('should reduce risk for members', () => {
    const member = makeInput({ daysSinceLastVisit: 45, hasMembership: true });
    const nonMember = makeInput({ daysSinceLastVisit: 45, hasMembership: false });
    expect(calculateRetentionRisk(member)).toBeLessThan(calculateRetentionRisk(nonMember));
  });

  test('should increase risk for single-visit clients', () => {
    const single = makeInput({ totalVisits: 1, daysSinceLastVisit: 30 });
    const multi = makeInput({ totalVisits: 5, daysSinceLastVisit: 30 });
    expect(calculateRetentionRisk(single)).toBeGreaterThan(calculateRetentionRisk(multi));
  });

  test('should be between 0 and 100', () => {
    const inputs = [
      makeInput({ daysSinceLastVisit: 0, hasMembership: true }),
      makeInput({ daysSinceLastVisit: 200, totalVisits: 1 }),
    ];
    for (const input of inputs) {
      const risk = calculateRetentionRisk(input);
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Lifecycle Metrics Tests ─────────────────────────────────

describe('Lifecycle - Metrics', () => {
  test('should count clients by stage', () => {
    const clients: ClientLifecycle[] = [
      { clientId: 'c1', clientName: 'A', stage: 'active', enteredStageAt: '', daysInStage: 0, totalVisits: 3, totalSpend: 1000, avgTicket: 333, lastVisitDate: '', daysSinceLastVisit: 10, projectedLTV: 5000, retentionRiskScore: 20, hasMembership: false, milestones: [], communicationPreference: 'email' },
      { clientId: 'c2', clientName: 'B', stage: 'active', enteredStageAt: '', daysInStage: 0, totalVisits: 5, totalSpend: 2000, avgTicket: 400, lastVisitDate: '', daysSinceLastVisit: 5, projectedLTV: 8000, retentionRiskScore: 10, hasMembership: true, milestones: [], communicationPreference: 'sms' },
      { clientId: 'c3', clientName: 'C', stage: 'at_risk', enteredStageAt: '', daysInStage: 0, totalVisits: 2, totalSpend: 800, avgTicket: 400, lastVisitDate: '', daysSinceLastVisit: 65, projectedLTV: 1200, retentionRiskScore: 70, hasMembership: false, milestones: [], communicationPreference: 'email' },
    ];
    const metrics = calculateLifecycleMetrics(clients);
    expect(metrics.clientsByStage.active).toBe(2);
    expect(metrics.clientsByStage.at_risk).toBe(1);
    expect(metrics.atRiskCount).toBe(1);
  });

  test('should calculate average LTV by stage', () => {
    const clients: ClientLifecycle[] = [
      { clientId: 'c1', clientName: 'A', stage: 'vip', enteredStageAt: '', daysInStage: 0, totalVisits: 10, totalSpend: 8000, avgTicket: 800, lastVisitDate: '', daysSinceLastVisit: 5, projectedLTV: 30000, retentionRiskScore: 5, hasMembership: true, milestones: [], communicationPreference: 'email' },
      { clientId: 'c2', clientName: 'B', stage: 'vip', enteredStageAt: '', daysInStage: 0, totalVisits: 15, totalSpend: 12000, avgTicket: 800, lastVisitDate: '', daysSinceLastVisit: 3, projectedLTV: 50000, retentionRiskScore: 3, hasMembership: true, milestones: [], communicationPreference: 'email' },
    ];
    const metrics = calculateLifecycleMetrics(clients);
    expect(metrics.avgLTVByStage.vip).toBe(40000);
  });
});

// ─── Templates & Win-Back Tests ──────────────────────────────

describe('Lifecycle - Templates & Win-Back', () => {
  test('should have templates for at_risk stage', () => {
    const templates = getStageTemplates('at_risk');
    expect(templates).toBeDefined();
    expect(templates!.templates.length).toBeGreaterThan(0);
  });

  test('should have templates for vip stage', () => {
    const templates = getStageTemplates('vip');
    expect(templates).toBeDefined();
  });

  test('should have win-back sequence for at_risk', () => {
    const sequence = getWinBackSequence('at_risk');
    expect(sequence).toBeDefined();
    expect(sequence!.steps.length).toBeGreaterThan(0);
  });

  test('should have win-back sequence for dormant', () => {
    const sequence = getWinBackSequence('dormant');
    expect(sequence).toBeDefined();
    expect(sequence!.steps.length).toBeGreaterThanOrEqual(3);
  });

  test('should have win-back sequence for lost', () => {
    const sequence = getWinBackSequence('lost');
    expect(sequence).toBeDefined();
  });

  test('should not have win-back for active stage', () => {
    const sequence = getWinBackSequence('active');
    expect(sequence).toBeUndefined();
  });
});

// ─── Transition Rules Tests ──────────────────────────────────

describe('Lifecycle - Transition Rules', () => {
  test('should have rules defined', () => {
    expect(TRANSITION_RULES.length).toBeGreaterThan(5);
  });

  test('should have priorities for ordering', () => {
    for (const rule of TRANSITION_RULES) {
      expect(rule.priority).toBeGreaterThan(0);
    }
  });

  test('should have conditions for each rule', () => {
    for (const rule of TRANSITION_RULES) {
      expect(rule.conditions.length).toBeGreaterThan(0);
    }
  });
});
