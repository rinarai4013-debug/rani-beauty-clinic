// ═══════════════════════════════════════════════════════════════
// QuickBooks Sync Engine — Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapToExpenseCategory,
  incrementalSync,
  fullReconciliation,
  getSyncStatus,
  getTransactionCache,
  handleWebhook,
  getTransactionsByDateRange,
  getTransactionsByCategory,
  getTransactionsByType,
} from '../sync';
import type { QBOWebhookNotification } from '../types';

/* ─── Mock the QBO client ───────────────────────────────────── */

vi.mock('../client', () => ({
  qboClient: {
    query: vi.fn().mockResolvedValue([]),
    read: vi.fn().mockResolvedValue({}),
    cdc: vi.fn().mockResolvedValue({
      CDCResponse: [{ QueryResponse: [{}] }],
      time: new Date().toISOString(),
    }),
  },
}));

import { qboClient } from '../client';
const mockQuery = vi.mocked(qboClient.query);
const mockRead = vi.mocked(qboClient.read);
const mockCdc = vi.mocked(qboClient.cdc);

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── Category Mapping Tests ────────────────────────────────── */

describe('mapToExpenseCategory', () => {
  it('maps rent-related accounts', () => {
    expect(mapToExpenseCategory('Office Rent')).toBe('rent');
    expect(mapToExpenseCategory('Building Lease')).toBe('rent');
    expect(mapToExpenseCategory('Occupancy Cost')).toBe('rent');
  });

  it('maps supply-related accounts', () => {
    expect(mapToExpenseCategory('Medical Supplies')).toBe('supplies');
    expect(mapToExpenseCategory('Skincare Products')).toBe('supplies');
    expect(mapToExpenseCategory('Botox Inventory')).toBe('supplies');
    expect(mapToExpenseCategory('Filler Supplies')).toBe('supplies');
  });

  it('maps payroll-related accounts', () => {
    expect(mapToExpenseCategory('Payroll Expenses')).toBe('payroll');
    expect(mapToExpenseCategory('Staff Salary')).toBe('payroll');
    expect(mapToExpenseCategory('Employee Wages')).toBe('payroll');
    expect(mapToExpenseCategory('Commission Payments')).toBe('payroll');
  });

  it('maps marketing-related accounts', () => {
    expect(mapToExpenseCategory('Marketing Expenses')).toBe('marketing');
    expect(mapToExpenseCategory('Google Ads')).toBe('marketing');
    expect(mapToExpenseCategory('Social Media Advertising')).toBe('marketing');
    expect(mapToExpenseCategory('Promotional Materials')).toBe('marketing');
  });

  it('maps insurance-related accounts', () => {
    expect(mapToExpenseCategory('Malpractice Insurance')).toBe('insurance');
    expect(mapToExpenseCategory('Business Liability Insurance')).toBe('insurance');
    expect(mapToExpenseCategory('Workers Comp Insurance')).toBe('insurance');
  });

  it('maps equipment-related accounts', () => {
    expect(mapToExpenseCategory('Laser Equipment')).toBe('equipment');
    expect(mapToExpenseCategory('Sofwave Device')).toBe('equipment');
    expect(mapToExpenseCategory('HydraFacial Machine')).toBe('equipment');
  });

  it('maps utility-related accounts', () => {
    expect(mapToExpenseCategory('Utilities')).toBe('utilities');
    expect(mapToExpenseCategory('Electric Bill')).toBe('utilities');
    expect(mapToExpenseCategory('Internet Service')).toBe('utilities');
  });

  it('maps professional services', () => {
    expect(mapToExpenseCategory('Legal Fees')).toBe('professional_services');
    expect(mapToExpenseCategory('Accounting Services')).toBe('professional_services');
    expect(mapToExpenseCategory('Consulting Fees')).toBe('professional_services');
    expect(mapToExpenseCategory('Continuing Education')).toBe('professional_services');
  });

  it('uses account sub-type when available', () => {
    expect(mapToExpenseCategory('Some Account', 'RentOrLeaseOfBuildings')).toBe('rent');
    expect(mapToExpenseCategory('Some Account', 'PayrollExpenses')).toBe('payroll');
    expect(mapToExpenseCategory('Some Account', 'Insurance')).toBe('insurance');
    expect(mapToExpenseCategory('Some Account', 'Utilities')).toBe('utilities');
    expect(mapToExpenseCategory('Some Account', 'AdvertisingPromotional')).toBe('marketing');
  });

  it('prioritizes sub-type over name', () => {
    expect(mapToExpenseCategory('Marketing Rent Account', 'RentOrLeaseOfBuildings')).toBe('rent');
  });

  it('maps COGS to supplies', () => {
    expect(mapToExpenseCategory('Cost of Goods Sold')).toBe('supplies');
    expect(mapToExpenseCategory('COGS')).toBe('supplies');
  });

  it('defaults to supplies for unrecognized accounts', () => {
    expect(mapToExpenseCategory('Miscellaneous Expense')).toBe('supplies');
  });
});

/* ─── Sync Status Tests ─────────────────────────────────────── */

describe('getSyncStatus', () => {
  it('returns initial sync status', () => {
    const status = getSyncStatus();
    expect(status.lastSyncAt).toBeNull();
    expect(status.syncInProgress).toBe(false);
    expect(status.recordsSynced).toBe(0);
    expect(status.errors).toHaveLength(0);
  });
});

/* ─── Incremental Sync Tests ────────────────────────────────── */

describe('incrementalSync', () => {
  it('syncs reference data first', async () => {
    // Mock reference data queries
    mockQuery.mockResolvedValue([]);
    mockCdc.mockResolvedValue({
      CDCResponse: [{ QueryResponse: [{}] }],
      time: new Date().toISOString(),
    });

    await incrementalSync();

    // Should have queried for Accounts, Customers, Vendors, Items, Classes
    expect(mockQuery).toHaveBeenCalledTimes(5);
  });

  it('processes CDC invoice changes', async () => {
    mockQuery.mockResolvedValue([]);
    mockCdc.mockResolvedValue({
      CDCResponse: [{
        QueryResponse: [{
          Invoice: [{
            Id: '101',
            TxnDate: '2026-03-01',
            TotalAmt: 500,
            CustomerRef: { value: '1', name: 'Test Client' },
            Line: [],
            Balance: 0,
            MetaData: { CreateTime: '', LastUpdatedTime: '' },
            SyncToken: '0',
          }],
        }],
      }],
      time: new Date().toISOString(),
    });

    const result = await incrementalSync();
    expect(result.transactionsAdded).toBeGreaterThan(0);
  });

  it('handles CDC errors gracefully', async () => {
    mockQuery.mockResolvedValue([]);
    mockCdc.mockRejectedValue(new Error('CDC failed'));

    const result = await incrementalSync();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Sync failed');
  });

  it('prevents concurrent syncs', async () => {
    mockQuery.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    mockCdc.mockResolvedValue({
      CDCResponse: [{ QueryResponse: [{}] }],
      time: new Date().toISOString(),
    });

    // Start two syncs simultaneously
    const sync1 = incrementalSync();
    const sync2 = incrementalSync();

    const [result1, result2] = await Promise.all([sync1, sync2]);

    // One should succeed, one should report already in progress
    const blocked = [result1, result2].find(r => r.errors.includes('Sync already in progress'));
    expect(blocked).toBeDefined();
  });

  it('updates sync status after successful sync', async () => {
    mockQuery.mockResolvedValue([]);
    mockCdc.mockResolvedValue({
      CDCResponse: [{ QueryResponse: [{}] }],
      time: new Date().toISOString(),
    });

    await incrementalSync();

    const status = getSyncStatus();
    expect(status.lastSyncAt).not.toBeNull();
    expect(status.syncInProgress).toBe(false);
  });
});

/* ─── Full Reconciliation Tests ─────────────────────────────── */

describe('fullReconciliation', () => {
  it('queries all entity types', async () => {
    mockQuery.mockResolvedValue([]);

    await fullReconciliation('2026-01-01', '2026-03-31');

    // 5 reference queries + 4 entity queries
    expect(mockQuery).toHaveBeenCalledTimes(9);
  });

  it('returns total transaction count', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await fullReconciliation();
    expect(result.totalTransactions).toBeDefined();
    expect(typeof result.totalTransactions).toBe('number');
  });

  it('uses current year start if no dates provided', async () => {
    mockQuery.mockResolvedValue([]);

    await fullReconciliation();

    // Verify one of the entity queries uses the current year
    const calls = mockQuery.mock.calls.map(c => c[0] as string);
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const hasYearFilter = calls.some(q => q.includes(yearStart));
    expect(hasYearFilter).toBe(true);
  });

  it('updates lastFullSyncAt', async () => {
    mockQuery.mockResolvedValue([]);

    await fullReconciliation();

    const status = getSyncStatus();
    expect(status.lastFullSyncAt).not.toBeNull();
  });

  it('clears existing cache on full reconciliation', async () => {
    // First sync with data
    mockQuery.mockResolvedValue([]);
    mockCdc.mockResolvedValue({
      CDCResponse: [{
        QueryResponse: [{
          Invoice: [{
            Id: '1',
            TxnDate: '2026-01-15',
            TotalAmt: 100,
            CustomerRef: { value: '1', name: 'Client' },
            Line: [],
            Balance: 0,
            MetaData: { CreateTime: '', LastUpdatedTime: '' },
            SyncToken: '0',
          }],
        }],
      }],
      time: '',
    });
    await incrementalSync();

    // Full reconciliation should start fresh
    mockQuery.mockResolvedValue([]);
    const result = await fullReconciliation();
    expect(result.totalTransactions).toBe(0);
  });
});

/* ─── Webhook Handler Tests ─────────────────────────────────── */

describe('handleWebhook', () => {
  it('processes create/update notifications', async () => {
    mockRead.mockResolvedValue({
      Id: '200',
      TxnDate: '2026-03-20',
      TotalAmt: 750,
      CustomerRef: { value: '5', name: 'Webhook Client' },
      Line: [],
      Balance: 0,
      MetaData: { CreateTime: '', LastUpdatedTime: '' },
      SyncToken: '0',
    });

    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'test-realm-123',
        dataChangeEvent: {
          entities: [{
            name: 'Invoice',
            id: '200',
            operation: 'Create',
            lastUpdated: '2026-03-20T10:00:00Z',
          }],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('handles delete operations', async () => {
    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'test-realm-123',
        dataChangeEvent: {
          entities: [{
            name: 'Invoice',
            id: '999',
            operation: 'Delete',
            lastUpdated: '2026-03-20T10:00:00Z',
          }],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.processed).toBe(1);
  });

  it('handles void operations', async () => {
    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'test-realm-123',
        dataChangeEvent: {
          entities: [{
            name: 'Payment',
            id: '888',
            operation: 'Void',
            lastUpdated: '2026-03-20T10:00:00Z',
          }],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.processed).toBe(1);
  });

  it('skips entities with mismatched realm ID', async () => {
    vi.stubEnv('QBO_REALM_ID', 'expected-realm');

    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'wrong-realm',
        dataChangeEvent: {
          entities: [{
            name: 'Invoice',
            id: '1',
            operation: 'Create',
            lastUpdated: '',
          }],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Realm ID mismatch');

    vi.unstubAllEnvs();
  });

  it('handles errors for individual entities', async () => {
    mockRead.mockRejectedValue(new Error('Entity not found'));

    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'test-realm-123',
        dataChangeEvent: {
          entities: [{
            name: 'Invoice',
            id: '404',
            operation: 'Update',
            lastUpdated: '',
          }],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.errors).toHaveLength(1);
  });

  it('processes multiple entity types', async () => {
    mockRead.mockResolvedValue({
      Id: '1',
      TxnDate: '2026-03-20',
      TotalAmt: 100,
      CustomerRef: { value: '1', name: 'Client' },
      VendorRef: { value: '1', name: 'Vendor' },
      Line: [],
      Balance: 0,
      MetaData: { CreateTime: '', LastUpdatedTime: '' },
      SyncToken: '0',
    });

    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'test-realm-123',
        dataChangeEvent: {
          entities: [
            { name: 'Invoice', id: '1', operation: 'Create', lastUpdated: '' },
            { name: 'Payment', id: '2', operation: 'Create', lastUpdated: '' },
            { name: 'Bill', id: '3', operation: 'Create', lastUpdated: '' },
          ],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.processed).toBe(3);
  });

  it('skips untracked entity types gracefully', async () => {
    const notification: QBOWebhookNotification = {
      eventNotifications: [{
        realmId: 'test-realm-123',
        dataChangeEvent: {
          entities: [{
            name: 'Customer',
            id: '1',
            operation: 'Update',
            lastUpdated: '',
          }],
        },
      }],
    };

    const result = await handleWebhook(notification);
    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});

/* ─── Data Access Helper Tests ──────────────────────────────── */

describe('Data Access Helpers', () => {
  it('getTransactionCache returns a copy', () => {
    const cache1 = getTransactionCache();
    const cache2 = getTransactionCache();
    expect(cache1).not.toBe(cache2);
  });

  it('getTransactionsByDateRange filters by date', () => {
    const txns = getTransactionsByDateRange('2026-01-01', '2026-01-31');
    expect(Array.isArray(txns)).toBe(true);
  });

  it('getTransactionsByCategory filters by category', () => {
    const txns = getTransactionsByCategory('supplies');
    expect(Array.isArray(txns)).toBe(true);
  });

  it('getTransactionsByType filters by type', () => {
    const income = getTransactionsByType('income');
    const expenses = getTransactionsByType('expense');
    expect(Array.isArray(income)).toBe(true);
    expect(Array.isArray(expenses)).toBe(true);
  });
});
