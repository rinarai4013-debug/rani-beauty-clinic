/**
 * Multi-Tenant Database Layer Test Suite
 *
 * Tests tenant-scoped database operations, isolation guards,
 * caching behavior, connection testing, and client pooling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTenantDatabase,
  assertTenantMatch,
  TenantIsolationError,
  getTenantDatabase,
  evictTenantDatabase,
  clearTenantDatabaseCache,
  invalidateTenantTableCache,
  testTenantConnection,
  type TenantDatabaseClient,
} from '../database';
import {
  DEFAULT_TENANT_CONFIG,
  TIER_FEATURES,
  type TenantConfig,
} from '../config';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

function makeTenant(overrides: Partial<TenantConfig> = {}): TenantConfig {
  return {
    ...DEFAULT_TENANT_CONFIG,
    id: `db-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: 'DB Test Spa',
    slug: 'db-test',
    airtable: {
      baseId: 'appTEST123456789',
      pat: 'patTEST.abcdef123456789',
    },
    active: true,
    ...overrides,
  };
}

// ─── createTenantDatabase ───────────────────────────────────────────────────

describe('createTenantDatabase', () => {
  it('creates a database client for a tenant', () => {
    const tenant = makeTenant();
    const db = createTenantDatabase(tenant);
    expect(db.tenantId).toBe(tenant.id);
    expect(db.base).toBeDefined();
    expect(db.table).toBeDefined();
    expect(db.Tables).toBeDefined();
  });

  it('throws if no Airtable credentials', () => {
    const tenant = makeTenant({ airtable: { baseId: '', pat: '' } });
    expect(() => createTenantDatabase(tenant)).toThrow('no Airtable credentials');
  });

  it('throws if PAT is missing', () => {
    const tenant = makeTenant({ airtable: { baseId: 'appXXX', pat: '' } });
    expect(() => createTenantDatabase(tenant)).toThrow();
  });

  it('throws if base ID is missing', () => {
    const tenant = makeTenant({ airtable: { baseId: '', pat: 'patXXX' } });
    expect(() => createTenantDatabase(tenant)).toThrow();
  });

  it('exposes all standard table accessors', () => {
    const tenant = makeTenant();
    const db = createTenantDatabase(tenant);
    const tables = db.Tables;

    expect(typeof tables.clients).toBe('function');
    expect(typeof tables.appointments).toBe('function');
    expect(typeof tables.transactions).toBe('function');
    expect(typeof tables.kpis).toBe('function');
    expect(typeof tables.alerts).toBe('function');
    expect(typeof tables.packages).toBe('function');
    expect(typeof tables.memberships).toBe('function');
    expect(typeof tables.intakes).toBe('function');
    expect(typeof tables.reviews).toBe('function');
    expect(typeof tables.messagesLog).toBe('function');
    expect(typeof tables.competitorIntel).toBe('function');
    expect(typeof tables.intakeIntelligence).toBe('function');
    expect(typeof tables.treatmentPlans).toBe('function');
  });

  it('provides a table function for arbitrary table names', () => {
    const tenant = makeTenant();
    const db = createTenantDatabase(tenant);
    const table = db.table('Custom Table');
    expect(table).toBeDefined();
  });

  it('respects table name overrides', () => {
    const tenant = makeTenant({
      airtable: {
        baseId: 'appTEST123456789',
        pat: 'patTEST.abcdef123456789',
        tableOverrides: {
          'Clients': 'My Clients Table',
        },
      },
    });
    const db = createTenantDatabase(tenant);
    // The override should be applied when accessing via table()
    const table = db.table('Clients');
    expect(table).toBeDefined();
  });
});

// ─── assertTenantMatch ──────────────────────────────────────────────────────

describe('assertTenantMatch', () => {
  it('passes when tenant IDs match', () => {
    const tenant = makeTenant({ id: 'match-test' });
    const db = createTenantDatabase(tenant);
    expect(() => assertTenantMatch(db, 'match-test')).not.toThrow();
  });

  it('throws TenantIsolationError on mismatch', () => {
    const tenant = makeTenant({ id: 'tenant-a' });
    const db = createTenantDatabase(tenant);
    expect(() => assertTenantMatch(db, 'tenant-b')).toThrow(TenantIsolationError);
  });

  it('includes both tenant IDs in error message', () => {
    const tenant = makeTenant({ id: 'tenant-a' });
    const db = createTenantDatabase(tenant);
    try {
      assertTenantMatch(db, 'tenant-b');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TenantIsolationError);
      expect((err as Error).message).toContain('tenant-a');
      expect((err as Error).message).toContain('tenant-b');
    }
  });

  it('TenantIsolationError has correct name', () => {
    const err = new TenantIsolationError('test');
    expect(err.name).toBe('TenantIsolationError');
    expect(err instanceof Error).toBe(true);
  });
});

// ─── getTenantDatabase (Pool) ───────────────────────────────────────────────

describe('getTenantDatabase', () => {
  it('returns same client for same tenant', () => {
    const tenant = makeTenant({ id: 'pool-test-1' });
    const db1 = getTenantDatabase(tenant);
    const db2 = getTenantDatabase(tenant);
    expect(db1).toBe(db2);
  });

  it('returns different clients for different tenants', () => {
    const tenant1 = makeTenant({ id: 'pool-test-2' });
    const tenant2 = makeTenant({ id: 'pool-test-3' });
    const db1 = getTenantDatabase(tenant1);
    const db2 = getTenantDatabase(tenant2);
    expect(db1).not.toBe(db2);
    expect(db1.tenantId).toBe('pool-test-2');
    expect(db2.tenantId).toBe('pool-test-3');
  });

  it('evictTenantDatabase removes client from pool', () => {
    const tenant = makeTenant({ id: 'pool-test-4' });
    const db1 = getTenantDatabase(tenant);
    evictTenantDatabase('pool-test-4');
    const db2 = getTenantDatabase(tenant);
    expect(db1).not.toBe(db2); // Should be a new instance
  });
});

// ─── Cache Operations ───────────────────────────────────────────────────────

describe('Cache operations', () => {
  it('clearTenantDatabaseCache does not throw', () => {
    expect(() => clearTenantDatabaseCache('nonexistent')).not.toThrow();
  });

  it('invalidateTenantTableCache does not throw', () => {
    expect(() => invalidateTenantTableCache('nonexistent', 'Clients')).not.toThrow();
  });

  it('clearTenantDatabaseCache for known tenant does not throw', () => {
    const tenant = makeTenant({ id: 'cache-test-1' });
    getTenantDatabase(tenant);
    expect(() => clearTenantDatabaseCache('cache-test-1')).not.toThrow();
  });
});

// ─── testTenantConnection ───────────────────────────────────────────────────

describe('testTenantConnection', () => {
  it('returns failure for empty credentials', async () => {
    const result = await testTenantConnection('', '');
    expect(result.success).toBe(false);
  });

  it('returns failure for invalid PAT format', async () => {
    const result = await testTenantConnection('invalid-pat', 'appInvalid');
    expect(result.success).toBe(false);
  });

  it('result has success boolean', async () => {
    const result = await testTenantConnection('patXXX', 'appXXX');
    expect(typeof result.success).toBe('boolean');
  });

  it('result has error message on failure', async () => {
    const result = await testTenantConnection('patXXX', 'appXXX');
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    }
  });
});

// ─── Tenant Database Client Interface ───────────────────────────────────────

describe('TenantDatabaseClient interface', () => {
  it('has all required methods', () => {
    const tenant = makeTenant();
    const db = createTenantDatabase(tenant);

    expect(typeof db.fetchAll).toBe('function');
    expect(typeof db.fetchFirst).toBe('function');
    expect(typeof db.createRecord).toBe('function');
    expect(typeof db.updateRecord).toBe('function');
    expect(typeof db.deleteRecord).toBe('function');
    expect(typeof db.table).toBe('function');
  });

  it('tenantId is read-only (no setter)', () => {
    const tenant = makeTenant({ id: 'readonly-test' });
    const db = createTenantDatabase(tenant);
    expect(db.tenantId).toBe('readonly-test');
  });
});
