// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  analyzeReceivables,
  analyzeCosts,
  analyzePayroll,
  analyzeBurnRate,
  calculateRunway,
  recommendSeasonalReserves,
  scoreEmergencyFund,
  generateCashFlowAlerts,
  projectCashFlow,
  analyzeCashFlow,
  type Receivable,
  type FixedCost,
  type VariableCost,
  type PayrollEntry,
  type CashFlowInput,
  type CashPosition,
  type BurnRateAnalysis,
  type RunwayAnalysis,
  type EmergencyFundScore,
  type Obligation,
} from '../cash-flow';

// ── Helpers ──

function makeReceivable(overrides: Partial<Receivable> = {}): Receivable {
  return {
    id: '1',
    clientName: 'Test Client',
    amount: 500,
    dueDate: new Date().toISOString().split('T')[0],
    source: 'cherry_financing',
    status: 'current',
    probability: 0.95,
    ...overrides,
  };
}

function makeFixedCosts(): FixedCost[] {
  return [
    { name: 'Rent', category: 'rent', monthlyAmount: 4500 },
    { name: 'Insurance', category: 'insurance', monthlyAmount: 800 },
    { name: 'Software', category: 'software', monthlyAmount: 600 },
  ];
}

function makeVariableCosts(): VariableCost[] {
  return [
    { name: 'Supplies', category: 'supplies', avgMonthlyAmount: 3000, lastThreeMonths: [2800, 3000, 3200] },
    { name: 'Marketing', category: 'marketing', avgMonthlyAmount: 2000, lastThreeMonths: [1800, 2000, 2200] },
  ];
}

function makePayroll(): PayrollEntry[] {
  return [
    { employeeName: 'Provider A', role: 'provider', grossPay: 4000, payFrequency: 'biweekly', federalWithholding: 600, stateWithholding: 0, fica: 306, benefits: 500 },
    { employeeName: 'Front Desk', role: 'front_desk', grossPay: 1800, payFrequency: 'biweekly', federalWithholding: 200, stateWithholding: 0, fica: 138, benefits: 300 },
  ];
}

function makeCashFlowInput(overrides: Partial<CashFlowInput> = {}): CashFlowInput {
  return {
    bankBalance: 50000,
    monthlyRevenue: [45000, 48000, 50000, 52000, 55000, 53000],
    monthlyExpenses: [35000, 37000, 38000, 40000, 42000, 41000],
    fixedCosts: makeFixedCosts(),
    variableCosts: makeVariableCosts(),
    receivables: [makeReceivable(), makeReceivable({ id: '2', amount: 300, status: 'past_due_30', probability: 0.8 })],
    payroll: makePayroll(),
    upcomingObligations: [
      { name: 'Quarterly Tax', amount: 5000, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], category: 'taxes', recurring: true, priority: 'critical' },
    ],
    ...overrides,
  };
}

// ── Receivables ──

describe('analyzeReceivables', () => {
  it('categorizes receivables by aging bucket', () => {
    const r = analyzeReceivables([
      makeReceivable({ status: 'current', amount: 1000 }),
      makeReceivable({ id: '2', status: 'past_due_30', amount: 500 }),
      makeReceivable({ id: '3', status: 'past_due_60', amount: 300 }),
    ]);
    expect(r.current.count).toBe(1);
    expect(r.current.amount).toBe(1000);
    expect(r.pastDue30.count).toBe(1);
    expect(r.pastDue60.count).toBe(1);
  });

  it('calculates weighted collectable amount', () => {
    const r = analyzeReceivables([
      makeReceivable({ amount: 1000, probability: 1.0 }),
      makeReceivable({ id: '2', amount: 500, probability: 0.5 }),
    ]);
    expect(r.weightedCollectable).toBe(1250);
  });

  it('calculates total outstanding', () => {
    const r = analyzeReceivables([
      makeReceivable({ amount: 1000 }),
      makeReceivable({ id: '2', amount: 500 }),
    ]);
    expect(r.totalOutstanding).toBe(1500);
  });

  it('handles empty receivables', () => {
    const r = analyzeReceivables([]);
    expect(r.totalOutstanding).toBe(0);
    expect(r.collectionRate).toBe(1);
  });

  it('calculates collection rate', () => {
    const r = analyzeReceivables([
      makeReceivable({ amount: 1000, probability: 0.8 }),
    ]);
    expect(r.collectionRate).toBeCloseTo(0.8, 2);
  });

  it('handles written-off receivables', () => {
    const r = analyzeReceivables([
      makeReceivable({ status: 'written_off', amount: 500, probability: 0 }),
    ]);
    expect(r.writtenOff.count).toBe(1);
    expect(r.writtenOff.amount).toBe(500);
  });
});

// ── Cost Analysis ──

describe('analyzeCosts', () => {
  it('calculates total fixed and variable costs', () => {
    const r = analyzeCosts(makeFixedCosts(), makeVariableCosts());
    expect(r.totalFixed).toBe(5900);
    expect(r.totalVariable).toBe(5000);
    expect(r.totalMonthly).toBe(10900);
  });

  it('calculates fixed vs variable percentages', () => {
    const r = analyzeCosts(makeFixedCosts(), makeVariableCosts());
    expect(r.fixedPercentage + r.variablePercentage).toBeCloseTo(100, 0);
  });

  it('aggregates by category', () => {
    const r = analyzeCosts(makeFixedCosts(), makeVariableCosts());
    expect(r.byCategory.length).toBeGreaterThan(0);
    const total = r.byCategory.reduce((s, c) => s + c.amount, 0);
    expect(total).toBe(r.totalMonthly);
  });

  it('returns top 5 expenses', () => {
    const r = analyzeCosts(makeFixedCosts(), makeVariableCosts());
    expect(r.topExpenses.length).toBeLessThanOrEqual(5);
    expect(r.topExpenses[0].amount).toBeGreaterThanOrEqual(r.topExpenses[r.topExpenses.length - 1].amount);
  });

  it('handles empty costs', () => {
    const r = analyzeCosts([], []);
    expect(r.totalMonthly).toBe(0);
  });
});

// ── Payroll ──

describe('analyzePayroll', () => {
  it('calculates total gross and net', () => {
    const r = analyzePayroll(makePayroll(), 50000);
    expect(r.totalGross).toBeGreaterThan(0);
    expect(r.totalNet).toBeLessThan(r.totalGross);
  });

  it('calculates employer cost', () => {
    const r = analyzePayroll(makePayroll(), 50000);
    expect(r.employerCost).toBeGreaterThan(r.totalGross);
  });

  it('calculates payroll as percent of revenue', () => {
    const r = analyzePayroll(makePayroll(), 50000);
    expect(r.payrollAsPercentOfRevenue).toBeGreaterThan(0);
    expect(r.payrollAsPercentOfRevenue).toBeLessThan(100);
  });

  it('aggregates by role', () => {
    const r = analyzePayroll(makePayroll(), 50000);
    expect(r.byRole.length).toBe(2);
    expect(r.byRole.find(b => b.role === 'provider')).toBeDefined();
  });

  it('handles biweekly to monthly conversion', () => {
    const entry: PayrollEntry = { employeeName: 'Test', role: 'provider', grossPay: 3000, payFrequency: 'biweekly', federalWithholding: 400, stateWithholding: 0, fica: 230, benefits: 300 };
    const r = analyzePayroll([entry], 50000);
    // Biweekly: 26/12 = 2.167 multiplier
    expect(r.totalGross).toBeCloseTo(3000 * (26 / 12), -1);
  });

  it('handles monthly payroll', () => {
    const entry: PayrollEntry = { employeeName: 'Test', role: 'manager', grossPay: 6000, payFrequency: 'monthly', federalWithholding: 800, stateWithholding: 0, fica: 459, benefits: 400 };
    const r = analyzePayroll([entry], 50000);
    expect(r.totalGross).toBe(6000);
  });
});

// ── Burn Rate ──

describe('analyzeBurnRate', () => {
  it('calculates monthly burn rate', () => {
    const r = analyzeBurnRate([50000, 55000, 60000], [40000, 42000, 44000]);
    expect(r.monthlyBurnRate).toBeGreaterThan(0);
    expect(r.dailyBurnRate).toBe(Math.round(r.monthlyBurnRate / 30));
  });

  it('detects increasing burn rate', () => {
    const r = analyzeBurnRate([50000, 50000, 50000], [30000, 40000, 50000]);
    expect(r.burnRateTrend).toBe('increasing');
  });

  it('detects decreasing burn rate', () => {
    const r = analyzeBurnRate([50000, 50000, 50000], [50000, 40000, 30000]);
    expect(r.burnRateTrend).toBe('decreasing');
  });

  it('calculates net burn rate', () => {
    const r = analyzeBurnRate([50000, 55000, 60000], [40000, 42000, 44000]);
    expect(r.netBurnRate).toBeLessThan(0); // expenses < revenue = negative net burn
  });

  it('handles empty arrays', () => {
    const r = analyzeBurnRate([], []);
    expect(r.monthlyBurnRate).toBe(0);
  });
});

// ── Runway ──

describe('calculateRunway', () => {
  it('calculates healthy runway when profitable', () => {
    const r = calculateRunway(50000, [50000, 55000, 60000], [30000, 32000, 34000]);
    expect(r.status).toBe('healthy');
    expect(r.monthsOfRunway).toBeGreaterThan(6);
  });

  it('calculates critical runway when burning cash', () => {
    const r = calculateRunway(5000, [10000, 10000, 10000], [20000, 20000, 20000]);
    expect(r.status).toBe('critical');
    expect(r.monthsOfRunway).toBeLessThan(3);
  });

  it('provides scenario runway', () => {
    const r = calculateRunway(50000, [50000, 50000, 50000], [40000, 40000, 40000]);
    expect(r.scenarioRunway.zeroRevenue).toBeLessThan(r.scenarioRunway.expected);
    expect(r.scenarioRunway.optimistic).toBeGreaterThanOrEqual(r.scenarioRunway.expected);
  });

  it('adds credit line to total cash', () => {
    const r1 = calculateRunway(10000, [10000], [20000]);
    const r2 = calculateRunway(10000, [10000], [20000], 50000);
    expect(r2.monthsOfRunway).toBeGreaterThan(r1.monthsOfRunway);
  });

  it('returns runway end date', () => {
    const r = calculateRunway(50000, [50000], [40000]);
    expect(r.runwayEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Seasonal Reserves ──

describe('recommendSeasonalReserves', () => {
  it('calculates recommended reserve', () => {
    const r = recommendSeasonalReserves([40000, 42000, 44000], [50000, 52000, 54000], 30000);
    expect(r.recommendedReserve).toBeGreaterThan(0);
  });

  it('identifies gap when under-reserved', () => {
    const r = recommendSeasonalReserves([50000, 50000, 50000], [60000, 60000, 60000], 10000);
    expect(r.gap).toBeGreaterThan(0);
    expect(r.monthlyContribution).toBeGreaterThan(0);
  });

  it('no gap when well-reserved', () => {
    const r = recommendSeasonalReserves([10000, 10000, 10000], [20000, 20000, 20000], 500000);
    expect(r.gap).toBe(0);
  });

  it('provides 12 monthly recommendations', () => {
    const r = recommendSeasonalReserves([40000], [50000], 30000);
    expect(r.monthlyRecommendations).toHaveLength(12);
  });
});

// ── Emergency Fund ──

describe('scoreEmergencyFund', () => {
  it('scores A for well-funded', () => {
    const r = scoreEmergencyFund(300000, [40000, 42000, 44000]);
    expect(r.grade).toBe('A');
    expect(r.score).toBeGreaterThanOrEqual(85);
  });

  it('scores F for critically low', () => {
    const r = scoreEmergencyFund(5000, [40000, 42000, 44000]);
    expect(r.grade).toBe('F');
    expect(r.score).toBeLessThan(30);
  });

  it('calculates months of coverage', () => {
    const r = scoreEmergencyFund(80000, [40000, 40000, 40000]);
    expect(r.currentMonths).toBeCloseTo(2, 0);
  });

  it('calculates shortfall', () => {
    const r = scoreEmergencyFund(10000, [40000, 40000, 40000]);
    expect(r.shortfall).toBeGreaterThan(0);
  });

  it('returns recommendation', () => {
    const r = scoreEmergencyFund(50000, [40000, 40000, 40000]);
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it('target is 4 months', () => {
    const r = scoreEmergencyFund(50000, [40000, 40000, 40000]);
    expect(r.targetMonths).toBe(4);
  });
});

// ── Cash Flow Alerts ──

describe('generateCashFlowAlerts', () => {
  it('alerts on critical runway', () => {
    const position: CashPosition = { bankBalance: 5000, expectedReceivables: 0, totalAvailable: 5000, netCashPosition: 0, upcomingObligationsTotal: 0, daysOfCashOnHand: 5 };
    const burnRate: BurnRateAnalysis = { monthlyBurnRate: 40000, dailyBurnRate: 1333, weeklyBurnRate: 9233, burnRateTrend: 'stable', burnRateThreeMonthAvg: 40000, grossBurnRate: 40000, netBurnRate: 10000 };
    const runway: RunwayAnalysis = { monthsOfRunway: 1.5, runwayEndDate: '2026-05-01', status: 'critical', scenarioRunway: { optimistic: 2, expected: 1.5, conservative: 1, zeroRevenue: 0.5 } };
    const emergency: EmergencyFundScore = { score: 10, grade: 'F', currentMonths: 0.1, targetMonths: 4, shortfall: 155000, recommendation: 'Build reserves immediately' };

    const alerts = generateCashFlowAlerts(position, burnRate, runway, [], emergency);
    expect(alerts.some(a => a.severity === 'critical' && a.category === 'runway')).toBe(true);
    expect(alerts.some(a => a.severity === 'critical' && a.category === 'liquidity')).toBe(true);
  });

  it('alerts on upcoming critical obligations', () => {
    const position: CashPosition = { bankBalance: 50000, expectedReceivables: 0, totalAvailable: 50000, netCashPosition: 45000, upcomingObligationsTotal: 5000, daysOfCashOnHand: 50 };
    const burnRate: BurnRateAnalysis = { monthlyBurnRate: 30000, dailyBurnRate: 1000, weeklyBurnRate: 6930, burnRateTrend: 'stable', burnRateThreeMonthAvg: 30000, grossBurnRate: 30000, netBurnRate: -10000 };
    const runway: RunwayAnalysis = { monthsOfRunway: 99, runwayEndDate: '2030-01-01', status: 'healthy', scenarioRunway: { optimistic: 999, expected: 999, conservative: 999, zeroRevenue: 5 } };
    const emergency: EmergencyFundScore = { score: 80, grade: 'B', currentMonths: 4, targetMonths: 4, shortfall: 0, recommendation: 'Good' };
    const obligations: Obligation[] = [{ name: 'Q1 Tax', amount: 5000, dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], category: 'taxes', recurring: true, priority: 'critical' }];

    const alerts = generateCashFlowAlerts(position, burnRate, runway, obligations, emergency);
    expect(alerts.some(a => a.category === 'obligation')).toBe(true);
  });

  it('no alerts when everything is healthy', () => {
    const position: CashPosition = { bankBalance: 200000, expectedReceivables: 0, totalAvailable: 200000, netCashPosition: 195000, upcomingObligationsTotal: 5000, daysOfCashOnHand: 200 };
    const burnRate: BurnRateAnalysis = { monthlyBurnRate: 30000, dailyBurnRate: 1000, weeklyBurnRate: 6930, burnRateTrend: 'stable', burnRateThreeMonthAvg: 30000, grossBurnRate: 30000, netBurnRate: -20000 };
    const runway: RunwayAnalysis = { monthsOfRunway: 99, runwayEndDate: '2030-01-01', status: 'healthy', scenarioRunway: { optimistic: 999, expected: 999, conservative: 999, zeroRevenue: 6.7 } };
    const emergency: EmergencyFundScore = { score: 90, grade: 'A', currentMonths: 6.7, targetMonths: 4, shortfall: 0, recommendation: 'Excellent' };

    const alerts = generateCashFlowAlerts(position, burnRate, runway, [], emergency);
    expect(alerts.every(a => a.severity !== 'critical')).toBe(true);
  });

  it('sorts alerts by severity', () => {
    const position: CashPosition = { bankBalance: 5000, expectedReceivables: 0, totalAvailable: 5000, netCashPosition: 0, upcomingObligationsTotal: 0, daysOfCashOnHand: 5 };
    const burnRate: BurnRateAnalysis = { monthlyBurnRate: 40000, dailyBurnRate: 1333, weeklyBurnRate: 9233, burnRateTrend: 'increasing', burnRateThreeMonthAvg: 40000, grossBurnRate: 40000, netBurnRate: 10000 };
    const runway: RunwayAnalysis = { monthsOfRunway: 1, runwayEndDate: '2026-04-01', status: 'critical', scenarioRunway: { optimistic: 2, expected: 1, conservative: 0.5, zeroRevenue: 0.1 } };
    const emergency: EmergencyFundScore = { score: 5, grade: 'F', currentMonths: 0.1, targetMonths: 4, shortfall: 155000, recommendation: 'Critical' };

    const alerts = generateCashFlowAlerts(position, burnRate, runway, [], emergency);
    if (alerts.length > 1) {
      expect(alerts[0].severity).toBe('critical');
    }
  });
});

// ── Cash Flow Projections ──

describe('projectCashFlow', () => {
  it('generates 6 months of projections by default', () => {
    const r = projectCashFlow(50000, [50000, 55000, 60000], [40000, 42000, 44000]);
    expect(r).toHaveLength(6);
  });

  it('projections have correct structure', () => {
    const r = projectCashFlow(50000, [50000], [40000]);
    expect(r[0]).toHaveProperty('month');
    expect(r[0]).toHaveProperty('projectedInflow');
    expect(r[0]).toHaveProperty('projectedOutflow');
    expect(r[0]).toHaveProperty('netCashFlow');
    expect(r[0]).toHaveProperty('endingBalance');
    expect(r[0]).toHaveProperty('cumulativeCashFlow');
  });

  it('ending balance accumulates', () => {
    const r = projectCashFlow(50000, [60000, 60000, 60000], [40000, 40000, 40000]);
    expect(r[5].endingBalance).toBeGreaterThan(r[0].endingBalance);
  });

  it('handles zero revenue', () => {
    const r = projectCashFlow(50000, [0], [40000]);
    expect(r[0].projectedInflow).toBe(0);
    expect(r[0].endingBalance).toBeLessThan(50000);
  });
});

// ── Full Cash Flow Analysis ──

describe('analyzeCashFlow', () => {
  it('returns complete analysis', () => {
    const r = analyzeCashFlow(makeCashFlowInput());
    expect(r).toHaveProperty('currentPosition');
    expect(r).toHaveProperty('operatingCashFlow');
    expect(r).toHaveProperty('receivablesAging');
    expect(r).toHaveProperty('costBreakdown');
    expect(r).toHaveProperty('payrollSummary');
    expect(r).toHaveProperty('burnRate');
    expect(r).toHaveProperty('runway');
    expect(r).toHaveProperty('seasonalReserves');
    expect(r).toHaveProperty('emergencyFund');
    expect(r).toHaveProperty('monthlyProjections');
    expect(r).toHaveProperty('alerts');
  });

  it('current position includes bank balance', () => {
    const r = analyzeCashFlow(makeCashFlowInput({ bankBalance: 75000 }));
    expect(r.currentPosition.bankBalance).toBe(75000);
  });

  it('operating cash flow is positive for profitable clinic', () => {
    const r = analyzeCashFlow(makeCashFlowInput());
    expect(r.operatingCashFlow.netOperatingCashFlow).toBeGreaterThan(0);
  });

  it('generates projections', () => {
    const r = analyzeCashFlow(makeCashFlowInput());
    expect(r.monthlyProjections.length).toBeGreaterThan(0);
  });
});
