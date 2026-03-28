/**
 * Tests for Tenant Dashboard Reports Module
 */

import {
  getReportDefinitions,
  generateReport,
  exportToCSV,
  buildCustomReport,
} from '../reports';
import type { TenantConfig } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

function createMockDb(): TenantDatabaseClient {
  const transactions = Array.from({ length: 15 }, (_, i) => ({
    id: `t${i}`, fields: {
      Date: new Date(Date.now() - i * 86400000).toISOString(),
      Service: i % 3 === 0 ? 'HydraFacial' : 'Sofwave',
      Provider: i % 2 === 0 ? 'Dr. Smith' : 'Dr. Jones',
      Amount: 200 + i * 50, Status: 'Completed', Type: 'Revenue', Source: 'Online',
    },
  }));
  const appointments = Array.from({ length: 10 }, (_, i) => ({
    id: `a${i}`, fields: {
      'Start Time': new Date(Date.now() - i * 86400000).toISOString(),
      Service: 'HydraFacial', Provider: i % 2 === 0 ? 'Dr. Smith' : 'Dr. Jones',
      Status: i < 7 ? 'Completed' : 'No Show', Duration: 60, Amount: 275,
    },
  }));
  const clients = Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`, fields: {
      Status: i < 3 ? 'Active' : 'Lead', Source: 'Online',
      'Created Date': new Date(Date.now() - i * 86400000).toISOString(),
      'Visit Count': i * 2, 'Last Visit': new Date(Date.now() - i * 7 * 86400000).toISOString(),
    },
  }));
  const reviews = [
    { id: 'r1', fields: { Rating: 5, Date: new Date().toISOString(), Text: 'Great!' } },
    { id: 'r2', fields: { Rating: 4, Date: new Date().toISOString(), Text: 'Good' } },
  ];
  const memberships = [
    { id: 'mb1', fields: { Status: 'Active', 'Monthly Rate': 99, Plan: 'Gold' } },
    { id: 'mb2', fields: { Status: 'active', 'Monthly Rate': 49, Plan: 'Silver' } },
  ];

  return {
    tenantId: 'test-tenant',
    fetchAll: jest.fn(async (tableName: string) => {
      const map: Record<string, unknown[]> = { Transactions: transactions, Appointments: appointments, Clients: clients, Reviews: reviews, Memberships: memberships };
      return map[tableName] || [];
    }),
    fetchFirst: jest.fn(async () => []),
    createRecord: jest.fn(async () => 'new-id'),
    updateRecord: jest.fn(async () => {}),
    deleteRecord: jest.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

const mockTenant = { id: 'test', name: 'Test' } as TenantConfig;

describe('Tenant Reports Module', () => {
  describe('getReportDefinitions', () => {
    it('should return 20 report definitions', () => {
      const defs = getReportDefinitions();
      expect(defs.length).toBe(20);
    });

    it('should have unique IDs', () => {
      const defs = getReportDefinitions();
      const ids = defs.map(d => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should include all categories', () => {
      const defs = getReportDefinitions();
      const categories = new Set(defs.map(d => d.category));
      expect(categories.has('financial')).toBe(true);
      expect(categories.has('operational')).toBe(true);
      expect(categories.has('marketing')).toBe(true);
      expect(categories.has('clinical')).toBe(true);
    });

    it('should have required fields on each definition', () => {
      const defs = getReportDefinitions();
      defs.forEach(d => {
        expect(d).toHaveProperty('id');
        expect(d).toHaveProperty('name');
        expect(d).toHaveProperty('description');
        expect(d).toHaveProperty('category');
        expect(d).toHaveProperty('metrics');
        expect(d).toHaveProperty('requiredTier');
        expect(d).toHaveProperty('chartTypes');
        expect(d.chartTypes.length).toBeGreaterThan(0);
      });
    });

    it('should assign tiers correctly', () => {
      const defs = getReportDefinitions();
      const starterReports = defs.filter(d => d.requiredTier === 'starter');
      const proReports = defs.filter(d => d.requiredTier === 'professional');
      const entReports = defs.filter(d => d.requiredTier === 'enterprise');
      expect(starterReports.length).toBeGreaterThan(0);
      expect(proReports.length).toBeGreaterThan(0);
      expect(entReports.length).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    it('should throw for unknown report ID', async () => {
      const db = createMockDb();
      await expect(generateReport(db, mockTenant, 'nonexistent' as never)).rejects.toThrow('Unknown report');
    });

    it('should generate daily summary', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'daily_summary');
      expect(result.reportId).toBe('daily_summary');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('charts');
      expect(result).toHaveProperty('insights');
      expect(result.summary).toHaveProperty('totalRevenue');
      expect(result.summary).toHaveProperty('totalAppointments');
    });

    it('should generate weekly summary', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'weekly_summary');
      expect(result.reportId).toBe('weekly_summary');
      expect(result.summary).toHaveProperty('totalRevenue');
    });

    it('should generate monthly summary', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'monthly_summary');
      expect(result.reportId).toBe('monthly_summary');
    });

    it('should generate revenue by service', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'revenue_by_service');
      expect(result.reportId).toBe('revenue_by_service');
      expect(Array.isArray(result.data)).toBe(true);
      if (result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('name');
        expect(result.data[0]).toHaveProperty('revenue');
      }
    });

    it('should generate revenue by provider', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'revenue_by_provider');
      expect(result.reportId).toBe('revenue_by_provider');
    });

    it('should generate treatment popularity', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'treatment_popularity');
      expect(result.reportId).toBe('treatment_popularity');
      expect(result.summary).toHaveProperty('totalTreatments');
    });

    it('should generate provider utilization', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'provider_utilization');
      expect(result.reportId).toBe('provider_utilization');
    });

    it('should generate client acquisition', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'client_acquisition');
      expect(result.reportId).toBe('client_acquisition');
      expect(result.summary).toHaveProperty('totalLeads');
      expect(result.summary).toHaveProperty('conversionRate');
    });

    it('should generate retention analysis', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'retention_analysis');
      expect(result.summary).toHaveProperty('retentionRate');
      expect(result.summary).toHaveProperty('churnRate');
    });

    it('should generate client satisfaction', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'client_satisfaction');
      expect(result.summary).toHaveProperty('avgRating');
      expect(result.summary).toHaveProperty('totalReviews');
    });

    it('should generate membership metrics', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'membership_metrics');
      expect(result.summary).toHaveProperty('activeMembers');
      expect(result.summary).toHaveProperty('mrr');
    });

    it('should generate financial summary', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'financial_summary');
      expect(result.summary).toHaveProperty('revenue');
      expect(result.summary).toHaveProperty('netIncome');
    });

    it('should generate staff performance', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'staff_performance');
      expect(result.summary).toHaveProperty('totalStaff');
    });

    it('should accept custom date range', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'daily_summary', { start: '2026-03-01', end: '2026-03-31' });
      expect(result.period.start).toBe('2026-03-01');
      expect(result.period.end).toBe('2026-03-31');
    });

    it('should include export formats', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'daily_summary');
      expect(result.exportFormats).toContain('json');
      expect(result.exportFormats).toContain('csv');
    });

    it('should include charts', async () => {
      const db = createMockDb();
      const result = await generateReport(db, mockTenant, 'revenue_by_service');
      expect(result.charts.length).toBeGreaterThan(0);
      result.charts.forEach(chart => {
        expect(chart).toHaveProperty('type');
        expect(chart).toHaveProperty('title');
        expect(chart).toHaveProperty('data');
      });
    });
  });

  describe('exportToCSV', () => {
    it('should export report data to CSV structure', async () => {
      const db = createMockDb();
      const report = await generateReport(db, mockTenant, 'revenue_by_service');
      const csv = exportToCSV(report);
      expect(csv).toHaveProperty('filename');
      expect(csv).toHaveProperty('headers');
      expect(csv).toHaveProperty('rows');
      expect(csv.filename).toContain('revenue_by_service');
      if (report.data.length > 0) {
        expect(csv.headers.length).toBeGreaterThan(0);
        expect(csv.rows.length).toBe(report.data.length);
      }
    });

    it('should handle empty report data', () => {
      const csv = exportToCSV({
        reportId: 'test' as never,
        name: 'Test', generatedAt: '', period: { start: '', end: '' },
        summary: {}, data: [], charts: [], insights: [], exportFormats: [],
      });
      expect(csv.headers).toEqual([]);
      expect(csv.rows).toEqual([]);
    });
  });

  describe('buildCustomReport', () => {
    it('should build a custom report', async () => {
      const db = createMockDb();
      const result = await buildCustomReport(db, mockTenant, {
        name: 'Custom Revenue Report',
        dataSources: ['transactions'],
        metrics: [{ field: 'Amount', aggregation: 'sum', label: 'Total Revenue' }],
        filters: [],
        groupBy: ['Service'],
        dateRange: { start: '2026-01-01', end: '2026-12-31' },
        chartType: 'bar',
      });
      expect(result.reportId).toBe('custom_date_range');
      expect(result.name).toBe('Custom Revenue Report');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should support different aggregations', async () => {
      const db = createMockDb();
      const result = await buildCustomReport(db, mockTenant, {
        name: 'Avg Test',
        dataSources: ['transactions'],
        metrics: [
          { field: 'Amount', aggregation: 'avg', label: 'Avg Amount' },
          { field: 'Amount', aggregation: 'count', label: 'Count' },
          { field: 'Amount', aggregation: 'max', label: 'Max' },
          { field: 'Amount', aggregation: 'min', label: 'Min' },
        ],
        filters: [],
        groupBy: [],
        dateRange: { start: '2026-01-01', end: '2026-12-31' },
        chartType: 'table',
      });
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
