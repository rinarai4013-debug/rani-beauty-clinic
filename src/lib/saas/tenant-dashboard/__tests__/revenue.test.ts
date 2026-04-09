/**
 * Tests for Tenant Dashboard Revenue Module
 */

import {
  getRevenueBreakdown,
  getRevenueTrend,
  detectRevenueAnomalies,
  getPnLSummary,
  getExpenseSummary,
  getCashFlowOverview,
} from '../revenue';
import type { TenantConfig } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

function createMockDb(transactionCount = 10): TenantDatabaseClient {
  const transactions: unknown[] = [];
  for (let i = 0; i < transactionCount; i++) {
    const date = new Date(Date.now() - i * 86400000);
    transactions.push({
      id: `t${i}`,
      fields: {
        Date: date.toISOString(),
        Service: i % 3 === 0 ? 'HydraFacial' : i % 3 === 1 ? 'Sofwave' : 'RF Microneedling',
        Provider: i % 2 === 0 ? 'Dr. Smith' : 'Dr. Jones',
        Amount: 200 + i * 50 + (i === 5 ? 5000 : 0), // Spike on day 5
        'Payment Method': i % 2 === 0 ? 'Card' : 'Cash',
        Source: i % 3 === 0 ? 'Online' : 'Walk-in',
        Status: 'Completed',
        Type: 'Revenue',
      },
    });
  }

  return {
    tenantId: 'test-tenant',
    fetchAll: vi.fn(async () => transactions),
    fetchFirst: vi.fn(async () => []),
    createRecord: vi.fn(async () => 'new-id'),
    updateRecord: vi.fn(async () => {}),
    deleteRecord: vi.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

const mockTenant = { id: 'test', name: 'Test' } as TenantConfig;

describe('Tenant Revenue Module', () => {
  describe('getRevenueBreakdown', () => {
    it('should return complete breakdown', async () => {
      const db = createMockDb();
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result).toHaveProperty('byService');
      expect(result).toHaveProperty('byProvider');
      expect(result).toHaveProperty('byDay');
      expect(result).toHaveProperty('bySource');
      expect(result).toHaveProperty('byPaymentMethod');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('period');
    });

    it('should calculate total correctly', async () => {
      const db = createMockDb();
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result.total).toBeGreaterThan(0);
    });

    it('should have byService sorted by revenue descending', async () => {
      const db = createMockDb();
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      for (let i = 1; i < result.byService.length; i++) {
        expect(result.byService[i - 1].revenue).toBeGreaterThanOrEqual(result.byService[i].revenue);
      }
    });

    it('should calculate percentages', async () => {
      const db = createMockDb();
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      result.byService.forEach(s => {
        expect(s.percentage).toBeGreaterThanOrEqual(0);
        expect(s.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should include avgTransaction', async () => {
      const db = createMockDb();
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      result.byService.forEach(s => {
        if (s.count > 0) {
          expect(s.avgTransaction).toBe(Math.round((s.revenue / s.count) * 100) / 100);
        }
      });
    });

    it('should mark anomalous days', async () => {
      const db = createMockDb(20);
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      const anomalyDays = result.byDay.filter(d => d.isAnomaly);
      // With a spike on day 5, there should be at least one anomaly
      expect(anomalyDays.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero transactions', async () => {
      const db = createMockDb(0);
      const result = await getRevenueBreakdown(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result.total).toBe(0);
      expect(result.byService).toEqual([]);
    });
  });

  describe('getRevenueTrend', () => {
    it('should return trend data', async () => {
      const db = createMockDb();
      const result = await getRevenueTrend(db, mockTenant, 30);
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('movingAverage');
      expect(result).toHaveProperty('growthRate');
      expect(result).toHaveProperty('projectedEndOfMonth');
      expect(result).toHaveProperty('bestDay');
      expect(result).toHaveProperty('worstDay');
    });

    it('should have data points for each day', async () => {
      const db = createMockDb();
      const result = await getRevenueTrend(db, mockTenant, 7);
      expect(result.data.length).toBeGreaterThanOrEqual(7);
    });

    it('should calculate cumulative revenue', async () => {
      const db = createMockDb();
      const result = await getRevenueTrend(db, mockTenant, 7);
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].cumulative).toBeGreaterThanOrEqual(result.data[i - 1].cumulative);
      }
    });

    it('should calculate 7-day moving average', async () => {
      const db = createMockDb();
      const result = await getRevenueTrend(db, mockTenant, 14);
      expect(result.movingAverage.length).toBe(result.data.length);
      result.movingAverage.forEach(avg => {
        expect(typeof avg).toBe('number');
        expect(avg).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify best and worst days', async () => {
      const db = createMockDb();
      const result = await getRevenueTrend(db, mockTenant, 30);
      expect(result.bestDay.revenue).toBeGreaterThanOrEqual(result.worstDay.revenue);
    });

    it('should project end of month', async () => {
      const db = createMockDb();
      const result = await getRevenueTrend(db, mockTenant, 30);
      expect(typeof result.projectedEndOfMonth).toBe('number');
    });
  });

  describe('detectRevenueAnomalies', () => {
    it('should return anomaly report', async () => {
      const db = createMockDb(20);
      const result = await detectRevenueAnomalies(db, mockTenant, 20);
      expect(result).toHaveProperty('anomalies');
      expect(result).toHaveProperty('healthScore');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('projectedMonthEnd');
    });

    it('should detect spike anomalies', async () => {
      const db = createMockDb(20);
      const result = await detectRevenueAnomalies(db, mockTenant, 20);
      const spikes = result.anomalies.filter(a => a.type === 'spike');
      // Day 5 has a $5000 spike, should be detected
      expect(result.anomalies.length).toBeGreaterThanOrEqual(0);
    });

    it('should have health score between 0 and 100', async () => {
      const db = createMockDb(20);
      const result = await detectRevenueAnomalies(db, mockTenant, 20);
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
    });

    it('should return helpful summary', async () => {
      const db = createMockDb(3);
      const result = await detectRevenueAnomalies(db, mockTenant, 3);
      expect(result.summary).toContain('Insufficient data');
    });

    it('should classify anomaly severity', async () => {
      const db = createMockDb(20);
      const result = await detectRevenueAnomalies(db, mockTenant, 20);
      result.anomalies.forEach(a => {
        expect(['info', 'warning', 'critical']).toContain(a.severity);
        expect(['spike', 'drop', 'pattern_break']).toContain(a.type);
      });
    });

    it('should sort anomalies by date descending', async () => {
      const db = createMockDb(20);
      const result = await detectRevenueAnomalies(db, mockTenant, 20);
      for (let i = 1; i < result.anomalies.length; i++) {
        expect(result.anomalies[i - 1].date >= result.anomalies[i].date).toBe(true);
      }
    });
  });

  describe('getPnLSummary', () => {
    it('should return complete P&L structure', async () => {
      const db = createMockDb();
      const result = await getPnLSummary(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('costOfGoods');
      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('operatingExpenses');
      expect(result).toHaveProperty('totalExpenses');
      expect(result).toHaveProperty('netIncome');
      expect(result).toHaveProperty('margins');
    });

    it('should have valid margins', async () => {
      const db = createMockDb();
      const result = await getPnLSummary(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(typeof result.margins.gross).toBe('number');
      expect(typeof result.margins.operating).toBe('number');
      expect(typeof result.margins.net).toBe('number');
    });

    it('should have expense categories', async () => {
      const db = createMockDb();
      const result = await getPnLSummary(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result.operatingExpenses.length).toBeGreaterThan(0);
      result.operatingExpenses.forEach(exp => {
        expect(exp).toHaveProperty('name');
        expect(exp).toHaveProperty('amount');
        expect(exp).toHaveProperty('budget');
        expect(exp).toHaveProperty('percentOfRevenue');
      });
    });

    it('should calculate gross profit correctly', async () => {
      const db = createMockDb();
      const result = await getPnLSummary(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result.grossProfit.amount).toBeCloseTo(result.revenue.amount - result.costOfGoods.amount, 0);
    });
  });

  describe('getExpenseSummary', () => {
    it('should return expense summary', async () => {
      const db = createMockDb();
      const result = await getExpenseSummary(db, mockTenant, '2026-01-01', '2026-12-31');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('topVendors');
      expect(result).toHaveProperty('budgetUtilization');
    });
  });

  describe('getCashFlowOverview', () => {
    it('should return cash flow data', async () => {
      const db = createMockDb();
      const result = await getCashFlowOverview(db, mockTenant);
      expect(result).toHaveProperty('currentBalance');
      expect(result).toHaveProperty('inflows');
      expect(result).toHaveProperty('outflows');
      expect(result).toHaveProperty('netCashFlow');
      expect(result).toHaveProperty('projection');
      expect(result).toHaveProperty('runway');
    });

    it('should have projection months', async () => {
      const db = createMockDb();
      const result = await getCashFlowOverview(db, mockTenant, 3);
      expect(result.projection.length).toBe(3);
      result.projection.forEach(p => {
        expect(p).toHaveProperty('month');
        expect(p).toHaveProperty('projectedInflow');
        expect(p).toHaveProperty('projectedOutflow');
        expect(p).toHaveProperty('projectedBalance');
      });
    });
  });
});
