/**
 * Automation Engine Tests — 35 tests
 */

import {
  BUILT_IN_AUTOMATIONS,
  shouldTrigger,
  executeAutomation,
  getTriggeredAutomations,
  calculateAutomationMetrics,
  createABTest,
  determineABWinner,
  getAutomationsByCategory,
} from '../automations';
import type { AutomationRecipe, AutomationExecution, AutomationAction, ABTest } from '@/types/crm';

// ─── Built-in Automations Tests ──────────────────────────────

describe('Automations - Built-in Recipes', () => {
  test('should have 30 built-in automations', () => {
    expect(BUILT_IN_AUTOMATIONS).toHaveLength(30);
  });

  test('should have unique IDs', () => {
    const ids = BUILT_IN_AUTOMATIONS.map(a => a.id);
    expect(new Set(ids).size).toBe(30);
  });

  test('should all be built-in', () => {
    for (const auto of BUILT_IN_AUTOMATIONS) {
      expect(auto.isBuiltIn).toBe(true);
    }
  });

  test('should all be enabled by default', () => {
    for (const auto of BUILT_IN_AUTOMATIONS) {
      expect(auto.isEnabled).toBe(true);
    }
  });

  test('should all have at least 1 action', () => {
    for (const auto of BUILT_IN_AUTOMATIONS) {
      expect(auto.actions.length).toBeGreaterThan(0);
    }
  });

  test('should have valid categories', () => {
    const validCategories = ['lead_nurture', 'post_treatment', 'retention', 'reactivation', 'vip', 'membership', 'seasonal', 'review', 'referral', 'operational', 'birthday', 'cross_sell'];
    for (const auto of BUILT_IN_AUTOMATIONS) {
      expect(validCategories).toContain(auto.category);
    }
  });

  test('should have names and descriptions', () => {
    for (const auto of BUILT_IN_AUTOMATIONS) {
      expect(auto.name.length).toBeGreaterThan(0);
      expect(auto.description.length).toBeGreaterThan(0);
    }
  });

  test('should never use word infusion', () => {
    for (const auto of BUILT_IN_AUTOMATIONS) {
      expect(auto.name.toLowerCase()).not.toContain('infusion');
      expect(auto.description.toLowerCase()).not.toContain('infusion');
    }
  });
});

// ─── Trigger Evaluation Tests ────────────────────────────────

describe('Automations - Trigger Evaluation', () => {
  test('should trigger on matching event', () => {
    const auto = BUILT_IN_AUTOMATIONS.find(a => a.id === 'auto_001')!; // New Lead Welcome
    expect(shouldTrigger(auto, { type: 'lead_created' })).toBe(true);
  });

  test('should not trigger on non-matching event', () => {
    const auto = BUILT_IN_AUTOMATIONS.find(a => a.id === 'auto_001')!;
    expect(shouldTrigger(auto, { type: 'treatment_completed' })).toBe(false);
  });

  test('should not trigger disabled automations', () => {
    const auto = { ...BUILT_IN_AUTOMATIONS[0], isEnabled: false };
    expect(shouldTrigger(auto, { type: 'lead_created' })).toBe(false);
  });

  test('should trigger with matching conditions', () => {
    const auto = BUILT_IN_AUTOMATIONS.find(a => a.id === 'auto_007')!; // Botox reminder
    expect(shouldTrigger(auto, {
      type: 'treatment_completed',
      clientData: { serviceCategory: 'Injectable' },
    })).toBe(true);
  });

  test('should not trigger with non-matching conditions', () => {
    const auto = BUILT_IN_AUTOMATIONS.find(a => a.id === 'auto_007')!;
    expect(shouldTrigger(auto, {
      type: 'treatment_completed',
      clientData: { serviceCategory: 'Facial' },
    })).toBe(false);
  });

  test('should trigger score-based automation above threshold', () => {
    const auto: AutomationRecipe = {
      ...BUILT_IN_AUTOMATIONS[0],
      trigger: { type: 'score_based', scoreThreshold: 70, scoreDirection: 'above' },
    };
    expect(shouldTrigger(auto, { type: 'lead_created', clientData: { score: 80 } })).toBe(true);
    expect(shouldTrigger(auto, { type: 'lead_created', clientData: { score: 50 } })).toBe(false);
  });
});

// ─── Triggered Automations Tests ─────────────────────────────

describe('Automations - Get Triggered', () => {
  test('should find all automations for lead_created', () => {
    const triggered = getTriggeredAutomations(BUILT_IN_AUTOMATIONS, { type: 'lead_created' });
    expect(triggered.length).toBeGreaterThanOrEqual(1);
  });

  test('should find automations for treatment_completed', () => {
    const triggered = getTriggeredAutomations(BUILT_IN_AUTOMATIONS, { type: 'treatment_completed' });
    expect(triggered.length).toBeGreaterThanOrEqual(1);
  });

  test('should find automations for birthday_approaching', () => {
    const triggered = getTriggeredAutomations(BUILT_IN_AUTOMATIONS, { type: 'birthday_approaching' });
    expect(triggered.length).toBeGreaterThanOrEqual(1);
  });

  test('should find automations for membership_expiring', () => {
    const triggered = getTriggeredAutomations(BUILT_IN_AUTOMATIONS, { type: 'membership_expiring' });
    expect(triggered.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Execution Tests ─────────────────────────────────────────

describe('Automations - Execution', () => {
  test('should create execution log', () => {
    const auto = BUILT_IN_AUTOMATIONS[0];
    const exec = executeAutomation(auto, 'c001', 'Test Client');
    expect(exec.id).toMatch(/^exec_/);
    expect(exec.automationId).toBe(auto.id);
    expect(exec.clientId).toBe('c001');
    expect(exec.status).toBe('running');
    expect(exec.totalActions).toBe(auto.actions.length);
  });

  test('should handle A/B test variant selection', () => {
    const auto = {
      ...BUILT_IN_AUTOMATIONS[0],
      abTest: {
        id: 'ab_test',
        variantA: { name: 'A', actions: BUILT_IN_AUTOMATIONS[0].actions },
        variantB: { name: 'B', actions: BUILT_IN_AUTOMATIONS[0].actions.slice(0, 1) },
        splitPercentage: 50,
        metrics: {
          variantA: { sent: 0, opened: 0, clicked: 0, converted: 0 },
          variantB: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        },
        startedAt: '2026-03-01T00:00:00Z',
      } as ABTest,
    };
    const exec = executeAutomation(auto, 'c001', 'Test');
    expect(exec.variant === 'A' || exec.variant === 'B').toBe(true);
  });
});

// ─── Metrics Tests ───────────────────────────────────────────

describe('Automations - Metrics', () => {
  test('should count active automations', () => {
    const metrics = calculateAutomationMetrics(BUILT_IN_AUTOMATIONS, []);
    expect(metrics.activeAutomations).toBe(30);
    expect(metrics.totalAutomations).toBe(30);
  });

  test('should count executions today', () => {
    const executions: AutomationExecution[] = [
      { id: 'e1', automationId: 'auto_001', clientId: 'c1', clientName: 'A', triggeredAt: new Date().toISOString(), status: 'completed', actionsCompleted: 4, totalActions: 4 },
    ];
    const metrics = calculateAutomationMetrics(BUILT_IN_AUTOMATIONS, executions);
    expect(metrics.executionsToday).toBe(1);
  });

  test('should sum revenue generated', () => {
    const executions: AutomationExecution[] = [
      { id: 'e1', automationId: 'auto_001', clientId: 'c1', clientName: 'A', triggeredAt: new Date().toISOString(), status: 'completed', actionsCompleted: 4, totalActions: 4, revenue: 500 },
      { id: 'e2', automationId: 'auto_006', clientId: 'c2', clientName: 'B', triggeredAt: new Date().toISOString(), status: 'completed', actionsCompleted: 5, totalActions: 5, revenue: 1200 },
    ];
    const metrics = calculateAutomationMetrics(BUILT_IN_AUTOMATIONS, executions);
    expect(metrics.totalRevenueGenerated).toBe(1700);
  });

  test('should handle empty executions', () => {
    const metrics = calculateAutomationMetrics(BUILT_IN_AUTOMATIONS, []);
    expect(metrics.executionsToday).toBe(0);
    expect(metrics.totalRevenueGenerated).toBe(0);
  });
});

// ─── A/B Testing Tests ───────────────────────────────────────

describe('Automations - A/B Testing', () => {
  test('should create A/B test on automation', () => {
    const auto = BUILT_IN_AUTOMATIONS[0];
    const variant: { name: string; actions: AutomationAction[] } = {
      name: 'Variant B',
      actions: auto.actions.slice(0, 2),
    };
    const result = createABTest(auto, variant, 50);
    expect(result.abTest).toBeDefined();
    expect(result.abTest!.variantA.name).toBe('Original');
    expect(result.abTest!.variantB.name).toBe('Variant B');
    expect(result.abTest!.splitPercentage).toBe(50);
  });

  test('should determine winner when A is better', () => {
    const abTest: ABTest = {
      id: 'ab_1',
      variantA: { name: 'A', actions: [] },
      variantB: { name: 'B', actions: [] },
      splitPercentage: 50,
      metrics: {
        variantA: { sent: 100, opened: 60, clicked: 30, converted: 20 },
        variantB: { sent: 100, opened: 50, clicked: 20, converted: 10 },
      },
      startedAt: '2026-03-01T00:00:00Z',
    };
    expect(determineABWinner(abTest)).toBe('A');
  });

  test('should determine winner when B is better', () => {
    const abTest: ABTest = {
      id: 'ab_1',
      variantA: { name: 'A', actions: [] },
      variantB: { name: 'B', actions: [] },
      splitPercentage: 50,
      metrics: {
        variantA: { sent: 100, opened: 40, clicked: 15, converted: 8 },
        variantB: { sent: 100, opened: 55, clicked: 30, converted: 18 },
      },
      startedAt: '2026-03-01T00:00:00Z',
    };
    expect(determineABWinner(abTest)).toBe('B');
  });

  test('should return null with insufficient sample size', () => {
    const abTest: ABTest = {
      id: 'ab_1',
      variantA: { name: 'A', actions: [] },
      variantB: { name: 'B', actions: [] },
      splitPercentage: 50,
      metrics: {
        variantA: { sent: 10, opened: 5, clicked: 3, converted: 2 },
        variantB: { sent: 10, opened: 4, clicked: 2, converted: 1 },
      },
      startedAt: '2026-03-01T00:00:00Z',
    };
    expect(determineABWinner(abTest)).toBeNull();
  });
});

// ─── Category Organization Tests ─────────────────────────────

describe('Automations - Categories', () => {
  test('should organize automations by category', () => {
    const byCategory = getAutomationsByCategory(BUILT_IN_AUTOMATIONS);
    expect(byCategory.lead_nurture.length).toBeGreaterThan(0);
    expect(byCategory.post_treatment.length).toBeGreaterThan(0);
    expect(byCategory.retention.length).toBeGreaterThan(0);
  });

  test('should include all automations across categories', () => {
    const byCategory = getAutomationsByCategory(BUILT_IN_AUTOMATIONS);
    const total = Object.values(byCategory).reduce((sum, arr) => sum + arr.length, 0);
    expect(total).toBe(30);
  });
});
