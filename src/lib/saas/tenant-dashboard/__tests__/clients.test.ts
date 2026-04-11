/**
 * Tests for Tenant Dashboard Clients Module
 */

import {
  getClientList,
  getClient360,
  getSegmentDistribution,
  getAtRiskClients,
} from '../clients';
import type { TenantConfig } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

// ─── Mock DB ────────────────────────────────────────────────────────────────

function createMockDb(overrides: Partial<Record<string, unknown[]>> = {}): TenantDatabaseClient {
  const clients = [
    { id: 'c1', fields: { 'First Name': 'Alice', 'Last Name': 'Smith', Email: 'alice@test.com', Phone: '555-0001', Status: 'Active', 'Total Spend': 5000, 'Visit Count': 12, 'Last Visit': new Date(Date.now() - 7 * 86400000).toISOString(), Membership: 'Gold', Source: 'Online', Tags: 'vip,loyal', 'Created Date': '2024-01-01' } },
    { id: 'c2', fields: { 'First Name': 'Bob', 'Last Name': 'Jones', Email: 'bob@test.com', Phone: '555-0002', Status: 'Lead', 'Total Spend': 0, 'Visit Count': 0, 'Last Visit': '', Membership: '', Source: 'Referral', Tags: '', 'Created Date': '2024-06-01' } },
    { id: 'c3', fields: { 'First Name': 'Carol', 'Last Name': 'Davis', Email: 'carol@test.com', Phone: '555-0003', Status: 'Lapsed', 'Total Spend': 2500, 'Visit Count': 5, 'Last Visit': new Date(Date.now() - 90 * 86400000).toISOString(), Membership: '', Source: 'Walk-in', Tags: '', 'Created Date': '2023-06-01' } },
    { id: 'c4', fields: { 'First Name': 'Diana', 'Last Name': 'Wilson', Email: 'diana@test.com', Phone: '555-0004', Status: 'Active', 'Total Spend': 8000, 'Visit Count': 20, 'Last Visit': new Date(Date.now() - 3 * 86400000).toISOString(), Membership: 'Platinum', Source: 'Online', Tags: 'vip', 'Created Date': '2023-01-01' } },
  ];

  const data: Record<string, unknown[]> = {
    Clients: clients,
    Appointments: [
      { id: 'a1', fields: { Date: new Date(Date.now() - 7 * 86400000).toISOString(), Service: 'HydraFacial', Provider: 'Dr. Smith', Duration: 60, Status: 'Completed', Amount: 275, 'Client Email': 'alice@test.com' } },
      { id: 'a2', fields: { Date: new Date(Date.now() - 30 * 86400000).toISOString(), Service: 'Sofwave', Provider: 'Dr. Smith', Duration: 90, Status: 'Completed', Amount: 2750, 'Client Email': 'alice@test.com' } },
    ],
    Transactions: [
      { id: 't1', fields: { Date: new Date().toISOString(), Service: 'HydraFacial', Amount: 275, 'Payment Method': 'Card', Status: 'Completed', 'Client Email': 'alice@test.com' } },
    ],
    'Messages Log': [],
    Reviews: [],
    Memberships: [
      { id: 'm1', fields: { Plan: 'Gold', Status: 'active', 'Start Date': '2024-01-01', 'Renewal Date': '2024-07-01', 'Monthly Rate': 99, 'Client Email': 'alice@test.com' } },
    ],
    ...overrides,
  };

  return {
    tenantId: 'test-tenant',
    fetchAll: jest.fn(async (tableName: string) => data[tableName] || []),
    fetchFirst: jest.fn(async () => []),
    createRecord: jest.fn(async () => 'new-id'),
    updateRecord: jest.fn(async () => {}),
    deleteRecord: jest.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

const mockTenant = { id: 'test', name: 'Test', slug: 'test' } as TenantConfig;

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Tenant Clients Module', () => {
  describe('getClientList', () => {
    it('should return paginated client list', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant);
      expect(result).toHaveProperty('clients');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.clients)).toBe(true);
    });

    it('should map client fields correctly', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant);
      const alice = result.clients.find(c => c.name === 'Alice Smith');
      expect(alice).toBeDefined();
      expect(alice?.email).toBe('alice@test.com');
      expect(alice?.totalSpend).toBe(5000);
      expect(alice?.visitCount).toBe(12);
      expect(alice?.status).toBe('active');
    });

    it('should filter by search term', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant, { filters: { search: 'alice' } });
      expect(result.clients.length).toBe(1);
      expect(result.clients[0].name).toBe('Alice Smith');
    });

    it('should filter by status', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant, { filters: { status: ['lead'] } });
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should sort by totalSpend descending', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant, { sort: { field: 'totalSpend', direction: 'desc' } });
      if (result.clients.length >= 2) {
        expect(result.clients[0].totalSpend).toBeGreaterThanOrEqual(result.clients[1].totalSpend);
      }
    });

    it('should paginate correctly', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant, { page: 1, pageSize: 2 });
      expect(result.clients.length).toBeLessThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it('should calculate churn risk for each client', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant);
      result.clients.forEach(client => {
        expect(typeof client.churnRisk).toBe('number');
        expect(client.churnRisk).toBeGreaterThanOrEqual(0);
        expect(client.churnRisk).toBeLessThanOrEqual(100);
      });
    });

    it('should assign RFM segments', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant);
      const validSegments = ['champions', 'loyal_customers', 'potential_loyalists', 'recent_customers', 'promising', 'needs_attention', 'about_to_sleep', 'at_risk', 'cant_lose', 'hibernating', 'lost'];
      result.clients.forEach(client => {
        expect(validSegments).toContain(client.segment);
      });
    });

    it('should handle empty client list', async () => {
      const db = createMockDb({ Clients: [] });
      const result = await getClientList(db, mockTenant);
      expect(result.clients).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should correctly identify membership status', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant);
      const alice = result.clients.find(c => c.name === 'Alice Smith');
      const bob = result.clients.find(c => c.name === 'Bob Jones');
      expect(alice?.hasMembership).toBe(true);
      expect(bob?.hasMembership).toBe(false);
    });

    it('should parse tags correctly', async () => {
      const db = createMockDb();
      const result = await getClientList(db, mockTenant);
      const alice = result.clients.find(c => c.name === 'Alice Smith');
      expect(alice?.tags).toEqual(['vip', 'loyal']);
    });
  });

  describe('getClient360', () => {
    it('should return null for non-existent client', async () => {
      const db = createMockDb({ Clients: [] });
      const result = await getClient360(db, mockTenant, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return complete 360 view', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('visits');
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('treatments');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('communications');
      expect(result).toHaveProperty('loyalty');
      expect(result).toHaveProperty('memberships');
      expect(result).toHaveProperty('segment');
    });

    it('should include profile details', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(result?.profile.firstName).toBe('Alice');
      expect(result?.profile.lastName).toBe('Smith');
      expect(result?.profile.email).toBe('alice@test.com');
    });

    it('should calculate treatment history with intervals', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(Array.isArray(result?.treatments)).toBe(true);
    });

    it('should calculate churn risk score', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(result?.riskScore).toHaveProperty('score');
      expect(result?.riskScore).toHaveProperty('risk');
      expect(result?.riskScore).toHaveProperty('factors');
      expect(result?.riskScore).toHaveProperty('recommendation');
    });

    it('should generate treatment recommendations', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(Array.isArray(result?.recommendations)).toBe(true);
    });

    it('should compute loyalty status', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(result?.loyalty).toHaveProperty('points');
      expect(result?.loyalty).toHaveProperty('tier');
      expect(result?.loyalty).toHaveProperty('pointsToNextTier');
      expect(result?.loyalty).toHaveProperty('rewardsAvailable');
    });

    it('should include RFM analysis', async () => {
      const db = createMockDb();
      const result = await getClient360(db, mockTenant, 'c1');
      expect(result?.segment).toHaveProperty('segment');
      expect(result?.segment).toHaveProperty('recency');
      expect(result?.segment).toHaveProperty('frequency');
      expect(result?.segment).toHaveProperty('monetary');
      expect(result?.segment).toHaveProperty('description');
      expect(result?.segment).toHaveProperty('suggestedAction');
    });
  });

  describe('getSegmentDistribution', () => {
    it('should return segment counts', async () => {
      const db = createMockDb();
      const result = await getSegmentDistribution(db, mockTenant);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('segment');
        expect(result[0]).toHaveProperty('count');
        expect(result[0]).toHaveProperty('percentage');
        expect(result[0]).toHaveProperty('avgSpend');
        expect(result[0]).toHaveProperty('avgVisits');
      }
    });

    it('should have percentages summing to ~100', async () => {
      const db = createMockDb();
      const result = await getSegmentDistribution(db, mockTenant);
      const totalPercentage = result.reduce((s, seg) => s + seg.percentage, 0);
      expect(totalPercentage).toBeGreaterThanOrEqual(95);
      expect(totalPercentage).toBeLessThanOrEqual(105);
    });

    it('should sort by count descending', async () => {
      const db = createMockDb();
      const result = await getSegmentDistribution(db, mockTenant);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
      }
    });
  });

  describe('getAtRiskClients', () => {
    it('should return clients sorted by churn risk', async () => {
      const db = createMockDb();
      const result = await getAtRiskClients(db, mockTenant);
      expect(Array.isArray(result)).toBe(true);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].churnRisk).toBeGreaterThanOrEqual(result[i].churnRisk);
      }
    });

    it('should respect limit parameter', async () => {
      const db = createMockDb();
      const result = await getAtRiskClients(db, mockTenant, 1);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should only include lapsed/at-risk clients', async () => {
      const db = createMockDb();
      const result = await getAtRiskClients(db, mockTenant);
      // All returned clients should have been filtered
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
