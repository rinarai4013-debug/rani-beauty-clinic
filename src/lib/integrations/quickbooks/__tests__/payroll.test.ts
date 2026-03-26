// ═══════════════════════════════════════════════════════════════
// QuickBooks Payroll Integration — Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCommissions,
  estimatePayrollTaxes,
  getBenefitsCostAllocation,
  getRevenuePerEmployeeHour,
  getLaborCostAnalysis,
  getPayrollSummary,
  setProviderConfigs,
  getProviderConfigs,
  getQBOEmployees,
  syncProviderConfigsFromQBO,
} from '../payroll';
import type { ProviderConfig } from '../payroll';

/* ─── Mock dependencies ─────────────────────────────────────── */

vi.mock('../client', () => ({
  qboClient: {
    query: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../sync', () => ({
  getTransactionsByDateRange: vi.fn().mockReturnValue([]),
  getClassCache: vi.fn().mockReturnValue([]),
}));

vi.mock('../reports', () => ({
  getProfitAndLoss: vi.fn().mockResolvedValue({
    totalIncome: 80000,
    totalExpenses: 50000,
    netIncome: 30000,
    lineItems: [],
  }),
}));

import { getTransactionsByDateRange, getClassCache } from '../sync';
import { qboClient } from '../client';
const mockGetTransactions = vi.mocked(getTransactionsByDateRange);
const mockGetClasses = vi.mocked(getClassCache);
const mockQuery = vi.mocked(qboClient.query);

/* ─── Setup ─────────────────────────────────────────────────── */

const TEST_CONFIGS: ProviderConfig[] = [
  {
    name: 'Mom',
    qboClassId: 'class-1',
    baseMonthlySalary: 8000,
    commissionRate: 15,
    averageHoursPerWeek: 35,
    benefitsCostMonthly: 800,
  },
  {
    name: 'Dr. Rina',
    qboClassId: 'class-2',
    baseMonthlySalary: 12000,
    commissionRate: 10,
    averageHoursPerWeek: 40,
    benefitsCostMonthly: 1200,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  setProviderConfigs(TEST_CONFIGS);
  mockGetClasses.mockReturnValue([
    { Id: 'class-1', Name: 'Mom', FullyQualifiedName: 'Mom', Active: true, MetaData: { CreateTime: '', LastUpdatedTime: '' }, SyncToken: '0' },
    { Id: 'class-2', Name: 'Dr. Rina', FullyQualifiedName: 'Dr. Rina', Active: true, MetaData: { CreateTime: '', LastUpdatedTime: '' }, SyncToken: '0' },
  ]);
});

/* ─── Provider Config Tests ─────────────────────────────────── */

describe('Provider Configuration', () => {
  it('stores and retrieves provider configs', () => {
    const configs = getProviderConfigs();
    expect(configs).toHaveLength(2);
    expect(configs[0].name).toBe('Mom');
    expect(configs[1].name).toBe('Dr. Rina');
  });

  it('returns a copy of configs', () => {
    const configs1 = getProviderConfigs();
    const configs2 = getProviderConfigs();
    expect(configs1).not.toBe(configs2);
  });
});

/* ─── Commission Calculation Tests ──────────────────────────── */

describe('calculateCommissions', () => {
  it('calculates commissions for each provider', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 5000, date: '2026-03-15', description: 'Sofwave', className: 'Mom', syncedAt: '' },
      { id: '2', qboId: '2', type: 'income', category: 'service_revenue', amount: 3000, date: '2026-03-15', description: 'HydraFacial', className: 'Mom', syncedAt: '' },
      { id: '3', qboId: '3', type: 'income', category: 'service_revenue', amount: 10000, date: '2026-03-15', description: 'Botox', className: 'Dr. Rina', syncedAt: '' },
    ]);

    const commissions = calculateCommissions('2026-03-01', '2026-03-31');
    expect(commissions).toHaveLength(2);

    const mom = commissions.find(c => c.providerName === 'Mom');
    expect(mom?.serviceRevenue).toBe(8000);
    expect(mom?.commissionAmount).toBe(1200); // 8000 * 15%

    const rina = commissions.find(c => c.providerName === 'Dr. Rina');
    expect(rina?.serviceRevenue).toBe(10000);
    expect(rina?.commissionAmount).toBe(1000); // 10000 * 10%
  });

  it('returns zero for providers with no revenue', () => {
    mockGetTransactions.mockReturnValue([]);

    const commissions = calculateCommissions('2026-03-01', '2026-03-31');
    expect(commissions[0].serviceRevenue).toBe(0);
    expect(commissions[0].commissionAmount).toBe(0);
  });

  it('includes transaction details', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 5000, date: '2026-03-15', description: 'Sofwave', className: 'Mom', syncedAt: '' },
    ]);

    const commissions = calculateCommissions('2026-03-01', '2026-03-31');
    const mom = commissions.find(c => c.providerName === 'Mom');
    expect(mom?.transactions).toHaveLength(1);
    expect(mom?.transactions[0].revenue).toBe(5000);
    expect(mom?.transactions[0].commission).toBe(750);
  });

  it('only counts income transactions', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 5000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
      { id: '2', qboId: '2', type: 'expense', category: 'supplies', amount: 1000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const commissions = calculateCommissions('2026-03-01', '2026-03-31');
    const mom = commissions.find(c => c.providerName === 'Mom');
    expect(mom?.serviceRevenue).toBe(5000); // Only income
  });
});

/* ─── Payroll Tax Estimation Tests ──────────────────────────── */

describe('estimatePayrollTaxes', () => {
  it('calculates employer FICA taxes', () => {
    mockGetTransactions.mockReturnValue([]);

    const taxes = estimatePayrollTaxes('2026-03-01', '2026-03-31');

    // 1 month: Mom ($8000) + Rina ($12000) = $20000 gross payroll
    expect(taxes.grossPayroll).toBe(20000);
    expect(taxes.socialSecurity).toBeGreaterThan(0);
    expect(taxes.medicare).toBeGreaterThan(0);
  });

  it('includes FUTA and state taxes', () => {
    mockGetTransactions.mockReturnValue([]);

    const taxes = estimatePayrollTaxes('2026-01-01', '2026-03-31');
    expect(taxes.futa).toBeGreaterThan(0);
    expect(taxes.stateUnemployment).toBeGreaterThan(0);
    expect(taxes.paidFamilyLeave).toBeGreaterThan(0);
    expect(taxes.workersComp).toBeGreaterThan(0);
  });

  it('calculates effective tax rate', () => {
    mockGetTransactions.mockReturnValue([]);

    const taxes = estimatePayrollTaxes('2026-03-01', '2026-03-31');
    expect(taxes.effectiveRate).toBeGreaterThan(0);
    expect(taxes.effectiveRate).toBeLessThan(20); // Should be reasonable
  });

  it('sums all tax components correctly', () => {
    mockGetTransactions.mockReturnValue([]);

    const taxes = estimatePayrollTaxes('2026-03-01', '2026-03-31');
    const componentSum = taxes.socialSecurity + taxes.medicare + taxes.futa +
      taxes.stateUnemployment + taxes.paidFamilyLeave + taxes.workersComp;
    expect(taxes.totalEmployerTaxes).toBeCloseTo(componentSum, 2);
  });

  it('includes commission in gross payroll', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 10000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const taxes = estimatePayrollTaxes('2026-03-01', '2026-03-31');
    // Mom base: $8000, Rina base: $12000, Mom commission: $1500 (10000 * 15%)
    expect(taxes.grossPayroll).toBe(21500);
  });
});

/* ─── Benefits Cost Allocation Tests ────────────────────────── */

describe('getBenefitsCostAllocation', () => {
  it('returns benefits for each provider', () => {
    const benefits = getBenefitsCostAllocation('2026-03-01', '2026-03-31');
    expect(benefits).toHaveLength(2);
    expect(benefits[0].providerName).toBe('Mom');
    expect(benefits[1].providerName).toBe('Dr. Rina');
  });

  it('calculates monthly benefits correctly', () => {
    const benefits = getBenefitsCostAllocation('2026-03-01', '2026-03-31');
    const mom = benefits.find(b => b.providerName === 'Mom');
    expect(mom?.totalBenefits).toBe(800); // 1 month * $800
  });

  it('breaks down benefits by category', () => {
    const benefits = getBenefitsCostAllocation('2026-03-01', '2026-03-31');
    const mom = benefits[0];

    expect(mom.healthInsurance).toBeGreaterThan(0);
    expect(mom.dentalVision).toBeGreaterThan(0);
    expect(mom.retirement).toBeGreaterThan(0);
    expect(mom.pto).toBeGreaterThan(0);
    expect(mom.other).toBeGreaterThan(0);

    // All components should sum to total
    const sum = mom.healthInsurance + mom.dentalVision + mom.retirement + mom.pto + mom.other;
    expect(sum).toBeCloseTo(mom.totalBenefits, 2);
  });

  it('scales with period length', () => {
    const oneMonth = getBenefitsCostAllocation('2026-03-01', '2026-03-31');
    const threeMonths = getBenefitsCostAllocation('2026-01-01', '2026-03-31');

    expect(threeMonths[0].totalBenefits).toBeCloseTo(oneMonth[0].totalBenefits * 3, 0);
  });

  it('calculates benefits as percent of compensation', () => {
    const benefits = getBenefitsCostAllocation('2026-03-01', '2026-03-31');
    const mom = benefits[0];
    expect(mom.benefitsAsPercentOfComp).toBe((800 / 8000) * 100);
  });
});

/* ─── Revenue Per Employee Hour Tests ───────────────────────── */

describe('getRevenuePerEmployeeHour', () => {
  it('calculates revenue per hour per provider', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 20000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const rph = getRevenuePerEmployeeHour('2026-03-01', '2026-03-31');
    const mom = rph.find(r => r.providerName === 'Mom');

    expect(mom).toBeDefined();
    expect(mom!.totalRevenue).toBe(20000);
    expect(mom!.revenuePerHour).toBeGreaterThan(0);
    expect(mom!.totalHours).toBeGreaterThan(0);
  });

  it('calculates compensation per hour', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 20000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const rph = getRevenuePerEmployeeHour('2026-03-01', '2026-03-31');
    const mom = rph.find(r => r.providerName === 'Mom');

    expect(mom!.compensationPerHour).toBeGreaterThan(0);
  });

  it('calculates revenue to compensation ratio', () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 30000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const rph = getRevenuePerEmployeeHour('2026-03-01', '2026-03-31');
    const mom = rph.find(r => r.providerName === 'Mom');

    expect(mom!.revenueToCompRatio).toBeGreaterThan(1); // Revenue should exceed comp
  });

  it('handles providers with no revenue', () => {
    mockGetTransactions.mockReturnValue([]);

    const rph = getRevenuePerEmployeeHour('2026-03-01', '2026-03-31');
    expect(rph[0].totalRevenue).toBe(0);
    expect(rph[0].revenuePerHour).toBe(0);
  });
});

/* ─── Labor Cost Analysis Tests ─────────────────────────────── */

describe('getLaborCostAnalysis', () => {
  it('returns labor cost analysis', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 50000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
      { id: '2', qboId: '2', type: 'income', category: 'service_revenue', amount: 30000, date: '2026-03-15', description: '', className: 'Dr. Rina', syncedAt: '' },
    ]);

    const analysis = await getLaborCostAnalysis('2026-03-01', '2026-03-31');
    expect(analysis.totalRevenue).toBe(80000);
    expect(analysis.totalLaborCost).toBeGreaterThan(0);
    expect(analysis.laborCostRatio).toBeGreaterThan(0);
  });

  it('classifies labor cost status', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 80000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const analysis = await getLaborCostAnalysis('2026-03-01', '2026-03-31');
    expect(['healthy', 'warning', 'critical']).toContain(analysis.status);
  });

  it('includes provider-level breakdown', async () => {
    mockGetTransactions.mockReturnValue([]);

    const analysis = await getLaborCostAnalysis('2026-03-01', '2026-03-31');
    expect(analysis.providers).toHaveLength(2);
    expect(analysis.providers[0]).toHaveProperty('name');
    expect(analysis.providers[0]).toHaveProperty('ratio');
    expect(analysis.providers[0]).toHaveProperty('status');
  });

  it('uses correct target ratio', async () => {
    mockGetTransactions.mockReturnValue([]);

    const analysis = await getLaborCostAnalysis('2026-03-01', '2026-03-31');
    expect(analysis.target).toBe(35);
  });

  it('includes monthly trend data', async () => {
    mockGetTransactions.mockReturnValue([]);

    const analysis = await getLaborCostAnalysis('2026-01-01', '2026-03-31');
    expect(analysis.trend.length).toBeGreaterThan(0);
    expect(analysis.trend[0]).toHaveProperty('month');
    expect(analysis.trend[0]).toHaveProperty('ratio');
  });
});

/* ─── Full Payroll Summary Tests ────────────────────────────── */

describe('getPayrollSummary', () => {
  it('returns complete payroll summary', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 40000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const summary = await getPayrollSummary('2026-03-01', '2026-03-31');

    expect(summary.totalPayroll).toBeGreaterThan(0);
    expect(summary.totalCommissions).toBeGreaterThan(0);
    expect(summary.totalBenefits).toBeGreaterThan(0);
    expect(summary.payrollTaxEstimate).toBeGreaterThan(0);
    expect(summary.providers).toHaveLength(2);
    expect(summary.laborCostRatio).toBeGreaterThan(0);
    expect(summary.revenuePerEmployeeHour).toBeGreaterThanOrEqual(0);
  });

  it('includes per-provider compensation details', async () => {
    mockGetTransactions.mockReturnValue([]);

    const summary = await getPayrollSummary('2026-03-01', '2026-03-31');
    const provider = summary.providers[0];

    expect(provider.providerName).toBe('Mom');
    expect(provider.baseSalary).toBe(8000);
    expect(provider.commissionRate).toBe(15);
    expect(provider.hoursWorked).toBeGreaterThan(0);
    expect(provider.period).toBeDefined();
  });

  it('calculates total payroll including commissions', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 20000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
    ]);

    const summary = await getPayrollSummary('2026-03-01', '2026-03-31');
    // Total payroll should include base salaries + commissions
    expect(summary.totalPayroll).toBeGreaterThan(20000); // Both providers' base salary
  });
});

/* ─── QBO Employee Sync Tests ───────────────────────────────── */

describe('getQBOEmployees', () => {
  it('queries active employees', async () => {
    mockQuery.mockResolvedValue([
      { Id: 'emp-1', DisplayName: 'Mom', Active: true },
    ]);

    const employees = await getQBOEmployees();
    expect(employees).toHaveLength(1);
    expect(mockQuery.mock.calls[0][0]).toContain('Employee');
    expect(mockQuery.mock.calls[0][0]).toContain('Active = true');
  });
});

describe('syncProviderConfigsFromQBO', () => {
  it('updates existing provider configs with QBO IDs', async () => {
    mockQuery.mockResolvedValue([
      { Id: 'emp-1', DisplayName: 'Mom', Active: true },
    ]);
    mockGetClasses.mockReturnValue([
      { Id: 'class-1', Name: 'Mom', FullyQualifiedName: 'Mom', Active: true, MetaData: { CreateTime: '', LastUpdatedTime: '' }, SyncToken: '0' },
    ]);

    await syncProviderConfigsFromQBO();

    const configs = getProviderConfigs();
    const mom = configs.find(c => c.name === 'Mom');
    expect(mom?.qboEmployeeId).toBe('emp-1');
    expect(mom?.qboClassId).toBe('class-1');
  });

  it('adds new providers from QBO', async () => {
    mockQuery.mockResolvedValue([
      { Id: 'emp-3', DisplayName: 'New Provider', Active: true },
    ]);
    mockGetClasses.mockReturnValue([]);

    await syncProviderConfigsFromQBO();

    const configs = getProviderConfigs();
    const newProvider = configs.find(c => c.name === 'New Provider');
    expect(newProvider).toBeDefined();
    expect(newProvider?.qboEmployeeId).toBe('emp-3');
    expect(newProvider?.commissionRate).toBe(10); // Default
  });
});
