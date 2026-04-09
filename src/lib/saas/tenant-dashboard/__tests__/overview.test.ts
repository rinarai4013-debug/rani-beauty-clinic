/**
 * Tests for Tenant Dashboard Overview Module
 */

import {
  getRevenueKPIs,
  getAppointmentKPIs,
  getNewClientKPIs,
  getTopServices,
  getProviderSummary,
  getAlertSummary,
  getQuickActions,
  getClinicHealthScore,
  getTenantOverview,
} from '../overview';
import type { TenantConfig } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

// ─── Mock DB ────────────────────────────────────────────────────────────────

function createMockDb(overrides: Partial<Record<string, unknown[]>> = {}): TenantDatabaseClient {
  const defaultData: Record<string, unknown[]> = {
    Transactions: [
      { id: 't1', fields: { Amount: 500, Date: new Date().toISOString(), Status: 'Completed', Service: 'HydraFacial', Provider: 'Dr. Smith', Source: 'Online', 'Payment Method': 'Card' } },
      { id: 't2', fields: { Amount: 2750, Date: new Date().toISOString(), Status: 'Completed', Service: 'Sofwave', Provider: 'Dr. Smith', Source: 'Walk-in', 'Payment Method': 'Card' } },
      { id: 't3', fields: { Amount: 495, Date: new Date().toISOString(), Status: 'Completed', Service: 'RF Microneedling', Provider: 'Dr. Jones', Source: 'Referral', 'Payment Method': 'Cash' } },
    ],
    Appointments: [
      { id: 'a1', fields: { Status: 'Completed', Duration: 60, 'Start Time': new Date().toISOString(), Provider: 'Dr. Smith', Service: 'HydraFacial' } },
      { id: 'a2', fields: { Status: 'Scheduled', Duration: 45, 'Start Time': new Date().toISOString(), Provider: 'Dr. Jones', Service: 'Sofwave' } },
      { id: 'a3', fields: { Status: 'No Show', Duration: 30, 'Start Time': new Date().toISOString(), Provider: 'Dr. Smith', Service: 'Consultation' } },
    ],
    Clients: [
      { id: 'c1', fields: { 'Created Date': new Date().toISOString(), Status: 'Active', Source: 'Online' } },
      { id: 'c2', fields: { 'Created Date': new Date().toISOString(), Status: 'Lead', Source: 'Online' } },
    ],
    Alerts: [
      { id: 'al1', fields: { Type: 'no_show', Severity: 'warning', Title: 'No-show', Message: 'Client missed appointment', 'Created At': new Date().toISOString(), Acknowledged: false } },
      { id: 'al2', fields: { Type: 'churn_risk', Severity: 'critical', Title: 'Churn Risk', Message: 'High-value client at risk', 'Created At': new Date().toISOString(), Acknowledged: false } },
    ],
    Reviews: [
      { id: 'r1', fields: { Rating: 5, Provider: 'Dr. Smith', Date: new Date().toISOString() } },
      { id: 'r2', fields: { Rating: 4, Provider: 'Dr. Jones', Date: new Date().toISOString() } },
    ],
    ...overrides,
  };

  return {
    tenantId: 'test-tenant',
    fetchAll: vi.fn(async (tableName: string) => defaultData[tableName] || []),
    fetchFirst: vi.fn(async () => []),
    createRecord: vi.fn(async () => 'new-id'),
    updateRecord: vi.fn(async () => {}),
    deleteRecord: vi.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

const mockTenant: TenantConfig = {
  id: 'test-tenant',
  name: 'Test Clinic',
  slug: 'test',
  ownerId: 'owner',
  airtable: { baseId: 'app123', pat: 'pat123' },
  branding: {
    clinicName: 'Test Clinic',
    logoUrl: '/logo.png',
    colors: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#eee', text: '#111', muted: '#999' },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  features: {
    churn: true, noShow: true, pricing: true, pnl: true, schedule: true,
    inventory: true, social: true, ads: true, consult: true, rag: true,
    phone: true, gamification: true, templates: true, plaid: true, whiteLabel: true,
  },
  subscription: {
    tier: 'enterprise', stripePriceId: '', stripeCustomerId: '', stripeSubscriptionId: '',
    status: 'active', currentPeriodEnd: '2099-12-31', cancelAtPeriodEnd: false,
  },
  integrations: {},
  usage: { apiCalls: 0, aiTokens: 0, smsSent: 0, emailsSent: 0, storageBytes: 0, period: '2026-03' },
  onboardingStep: 7,
  onboardingComplete: true,
  timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  active: true,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Tenant Overview Module', () => {
  describe('getRevenueKPIs', () => {
    it('should return revenue KPIs with today, wtd, mtd, ytd', async () => {
      const db = createMockDb();
      const result = await getRevenueKPIs(db, mockTenant);
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('wtd');
      expect(result).toHaveProperty('mtd');
      expect(result).toHaveProperty('ytd');
      expect(result).toHaveProperty('currency', 'USD');
      expect(typeof result.today).toBe('number');
      expect(typeof result.ytd).toBe('number');
    });

    it('should calculate ytd as sum of all transactions', async () => {
      const db = createMockDb();
      const result = await getRevenueKPIs(db, mockTenant);
      expect(result.ytd).toBe(3745); // 500 + 2750 + 495
    });

    it('should handle empty transactions', async () => {
      const db = createMockDb({ Transactions: [] });
      const result = await getRevenueKPIs(db, mockTenant);
      expect(result.today).toBe(0);
      expect(result.ytd).toBe(0);
    });

    it('should return todayChange percentage', async () => {
      const db = createMockDb();
      const result = await getRevenueKPIs(db, mockTenant);
      expect(typeof result.todayChange).toBe('number');
    });
  });

  describe('getAppointmentKPIs', () => {
    it('should return appointment counts by status', async () => {
      const db = createMockDb();
      const result = await getAppointmentKPIs(db, mockTenant);
      expect(result).toHaveProperty('todayCount');
      expect(result).toHaveProperty('todayCompleted');
      expect(result).toHaveProperty('todayCancelled');
      expect(result).toHaveProperty('todayNoShow');
      expect(result).toHaveProperty('utilizationRate');
      expect(result).toHaveProperty('avgDuration');
    });

    it('should count completed appointments', async () => {
      const db = createMockDb();
      const result = await getAppointmentKPIs(db, mockTenant);
      expect(result.todayCompleted).toBe(1);
      expect(result.todayNoShow).toBe(1);
    });

    it('should calculate utilization rate', async () => {
      const db = createMockDb();
      const result = await getAppointmentKPIs(db, mockTenant);
      expect(result.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(result.utilizationRate).toBeLessThanOrEqual(100);
    });

    it('should handle no appointments', async () => {
      const db = createMockDb({ Appointments: [] });
      const result = await getAppointmentKPIs(db, mockTenant);
      expect(result.todayCount).toBe(0);
      expect(result.avgDuration).toBe(0);
    });
  });

  describe('getNewClientKPIs', () => {
    it('should return new client counts', async () => {
      const db = createMockDb();
      const result = await getNewClientKPIs(db, mockTenant);
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('wtd');
      expect(result).toHaveProperty('mtd');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('topSource');
    });

    it('should calculate conversion rate', async () => {
      const db = createMockDb();
      const result = await getNewClientKPIs(db, mockTenant);
      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeLessThanOrEqual(100);
    });

    it('should identify top source', async () => {
      const db = createMockDb();
      const result = await getNewClientKPIs(db, mockTenant);
      expect(result.topSource).toBe('Online');
    });
  });

  describe('getTopServices', () => {
    it('should return services sorted by revenue', async () => {
      const db = createMockDb();
      const result = await getTopServices(db, mockTenant);
      expect(Array.isArray(result)).toBe(true);
      if (result.length >= 2) {
        expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue);
      }
    });

    it('should include name, revenue, count, avgPrice', async () => {
      const db = createMockDb();
      const result = await getTopServices(db, mockTenant);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('revenue');
        expect(result[0]).toHaveProperty('count');
        expect(result[0]).toHaveProperty('avgPrice');
        expect(result[0]).toHaveProperty('trend');
      }
    });

    it('should respect limit parameter', async () => {
      const db = createMockDb();
      const result = await getTopServices(db, mockTenant, 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle no transactions', async () => {
      const db = createMockDb({ Transactions: [] });
      const result = await getTopServices(db, mockTenant);
      expect(result).toEqual([]);
    });
  });

  describe('getProviderSummary', () => {
    it('should return provider performance data', async () => {
      const db = createMockDb();
      const result = await getProviderSummary(db, mockTenant);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('revenue');
        expect(result[0]).toHaveProperty('appointments');
        expect(result[0]).toHaveProperty('utilization');
        expect(result[0]).toHaveProperty('avgRating');
        expect(result[0]).toHaveProperty('noShowRate');
      }
    });

    it('should sort by revenue descending', async () => {
      const db = createMockDb();
      const result = await getProviderSummary(db, mockTenant);
      if (result.length >= 2) {
        expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue);
      }
    });
  });

  describe('getAlertSummary', () => {
    it('should return alert counts by severity', async () => {
      const db = createMockDb();
      const result = await getAlertSummary(db, mockTenant);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('critical');
      expect(result).toHaveProperty('warning');
      expect(result).toHaveProperty('noShows');
      expect(result).toHaveProperty('churnRisks');
      expect(result.total).toBe(2);
      expect(result.critical).toBe(1);
      expect(result.warning).toBe(1);
    });

    it('should include recent alerts', async () => {
      const db = createMockDb();
      const result = await getAlertSummary(db, mockTenant);
      expect(Array.isArray(result.recentAlerts)).toBe(true);
      expect(result.recentAlerts.length).toBeLessThanOrEqual(5);
    });

    it('should handle no alerts', async () => {
      const db = createMockDb({ Alerts: [] });
      const result = await getAlertSummary(db, mockTenant);
      expect(result.total).toBe(0);
    });
  });

  describe('getQuickActions', () => {
    it('should return 8 quick actions', () => {
      const result = getQuickActions(mockTenant);
      expect(result.length).toBe(8);
    });

    it('should include required action properties', () => {
      const result = getQuickActions(mockTenant);
      result.forEach(action => {
        expect(action).toHaveProperty('type');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('description');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('href');
      });
    });

    it('should have valid action types', () => {
      const result = getQuickActions(mockTenant);
      const validTypes = ['log_sale', 'add_lead', 'view_schedule', 'send_message', 'add_appointment', 'run_report', 'check_inventory', 'view_reviews'];
      result.forEach(action => {
        expect(validTypes).toContain(action.type);
      });
    });
  });

  describe('getClinicHealthScore', () => {
    it('should return overall score between 0 and 100', async () => {
      const db = createMockDb();
      const result = await getClinicHealthScore(db, mockTenant);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should include 5 health components', async () => {
      const db = createMockDb();
      const result = await getClinicHealthScore(db, mockTenant);
      expect(result.components.length).toBe(5);
      expect(result.components.map(c => c.name)).toEqual(['Revenue', 'Bookings', 'Retention', 'Growth', 'Reputation']);
    });

    it('should assign correct level based on score', async () => {
      const db = createMockDb();
      const result = await getClinicHealthScore(db, mockTenant);
      const validLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      expect(validLevels).toContain(result.level);
    });

    it('should calculate XP', async () => {
      const db = createMockDb();
      const result = await getClinicHealthScore(db, mockTenant);
      expect(result.xp).toBe(result.overall * 100);
    });

    it('should have component weights summing to 100', async () => {
      const db = createMockDb();
      const result = await getClinicHealthScore(db, mockTenant);
      const totalWeight = result.components.reduce((s, c) => s + c.weight, 0);
      expect(totalWeight).toBe(100);
    });
  });

  describe('getTenantOverview', () => {
    it('should return complete overview data', async () => {
      const db = createMockDb();
      const result = await getTenantOverview(db, mockTenant);
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('newClients');
      expect(result).toHaveProperty('topServices');
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('quickActions');
      expect(result).toHaveProperty('healthScore');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should return valid ISO timestamp for lastUpdated', async () => {
      const db = createMockDb();
      const result = await getTenantOverview(db, mockTenant);
      expect(new Date(result.lastUpdated).toISOString()).toBe(result.lastUpdated);
    });
  });
});
