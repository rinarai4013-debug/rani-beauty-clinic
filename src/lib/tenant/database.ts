/**
 * RaniOS Multi-Tenant Database Layer
 *
 * Wraps the existing Airtable client with tenant-scoped base ID and PAT.
 * All queries are automatically scoped to the tenant's Airtable base.
 * Enforces tenant isolation - a tenant cannot access another tenant's data.
 */

import Airtable from 'airtable';
import type { TenantConfig, TenantAirtableConfig } from './config';

// ─── Types ──────────────────────────────────────────────────────────────────

type AirtableBase = ReturnType<InstanceType<typeof Airtable>['base']>;
type AirtableTable = Airtable.Table<Airtable.FieldSet>;

export interface TenantDatabaseClient {
  tenantId: string;
  base: AirtableBase;
  table: (name: string) => AirtableTable;
  fetchAll: <T = Record<string, unknown>>(
    tableName: string,
    options?: Airtable.SelectOptions<Airtable.FieldSet>,
    skipTestFilter?: boolean
  ) => Promise<{ id: string; fields: T }[]>;
  fetchFirst: <T = Record<string, unknown>>(
    tableName: string,
    maxRecords: number,
    options?: Airtable.SelectOptions<Airtable.FieldSet>,
    skipTestFilter?: boolean
  ) => Promise<{ id: string; fields: T }[]>;
  createRecord: <T = Record<string, unknown>>(
    tableName: string,
    fields: Partial<T>
  ) => Promise<string>;
  updateRecord: <T = Record<string, unknown>>(
    tableName: string,
    recordId: string,
    fields: Partial<T>
  ) => Promise<void>;
  deleteRecord: (tableName: string, recordId: string) => Promise<void>;
  Tables: TenantTables;
}

export interface TenantTables {
  clients: () => AirtableTable;
  appointments: () => AirtableTable;
  transactions: () => AirtableTable;
  kpis: () => AirtableTable;
  alerts: () => AirtableTable;
  packages: () => AirtableTable;
  memberships: () => AirtableTable;
  intakes: () => AirtableTable;
  reviews: () => AirtableTable;
  messagesLog: () => AirtableTable;
  competitorIntel: () => AirtableTable;
  intakeIntelligence: () => AirtableTable;
  treatmentPlans: () => AirtableTable;
}

// ─── Rate Limiting (per-tenant) ─────────────────────────────────────────────

const MAX_RETRIES = 3;

// Per-tenant rate limiter: Airtable allows 5 req/sec per base
const tenantQueues = new Map<string, { queue: (() => void)[]; processing: boolean }>();

function getTenantQueue(tenantId: string) {
  if (!tenantQueues.has(tenantId)) {
    tenantQueues.set(tenantId, { queue: [], processing: false });
  }
  return tenantQueues.get(tenantId)!;
}

async function processQueue(tenantId: string) {
  const tq = getTenantQueue(tenantId);
  if (tq.processing) return;
  tq.processing = true;
  while (tq.queue.length > 0) {
    const next = tq.queue.shift();
    next?.();
    await new Promise((r) => setTimeout(r, 210)); // ~4.7 req/sec
  }
  tq.processing = false;
}

function rateLimitedQuery<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  const tq = getTenantQueue(tenantId);
  if (tq.queue.length >= 100) {
    return Promise.reject(new Error(`Airtable queue overflow for tenant ${tenantId}`));
  }

  return new Promise((resolve, reject) => {
    tq.queue.push(() => {
      withRetry(fn).then(resolve).catch(reject);
    });
    processQueue(tenantId);
  });
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = getStatusCode(err);
      if (status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      if (status && status >= 500 && status < 600 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Retry loop exited unexpectedly');
}

function getStatusCode(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return (err as { statusCode: number }).statusCode;
  }
  return undefined;
}

// ─── Cache (per-tenant) ─────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds
const tenantCaches = new Map<string, Map<string, CacheEntry<unknown>>>();

function getTenantCacheMap(tenantId: string): Map<string, CacheEntry<unknown>> {
  if (!tenantCaches.has(tenantId)) {
    tenantCaches.set(tenantId, new Map());
  }
  return tenantCaches.get(tenantId)!;
}

function getCached<T>(tenantId: string, key: string): T | null {
  const cache = getTenantCacheMap(tenantId);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(tenantId: string, key: string, data: unknown): void {
  const cache = getTenantCacheMap(tenantId);
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateTenantTableCache(tenantId: string, tableName: string): void {
  const cache = getTenantCacheMap(tenantId);
  for (const key of cache.keys()) {
    if (key.startsWith(`${tableName}:`)) {
      cache.delete(key);
    }
  }
}

export function clearTenantDatabaseCache(tenantId: string): void {
  tenantCaches.delete(tenantId);
}

// ─── Base Pool ──────────────────────────────────────────────────────────────

const basePool = new Map<string, AirtableBase>();

function getOrCreateBase(config: TenantAirtableConfig): AirtableBase {
  const key = `${config.baseId}:${config.pat.slice(-8)}`;
  if (!basePool.has(key)) {
    const at = new Airtable({ apiKey: config.pat });
    basePool.set(key, at.base(config.baseId));
  }
  return basePool.get(key)!;
}

// ─── Default Table Name Map ─────────────────────────────────────────────────

const DEFAULT_TABLE_NAMES: Record<keyof TenantTables, string> = {
  clients: 'Clients',
  appointments: 'Appointments',
  transactions: 'Transactions',
  kpis: 'KPI Snapshots',
  alerts: 'Alerts',
  packages: 'Packages',
  memberships: 'Memberships',
  intakes: 'Client Intakes',
  reviews: 'Reviews',
  messagesLog: 'Messages Log',
  competitorIntel: 'Competitor Intelligence',
  intakeIntelligence: 'Intake Intelligence',
  treatmentPlans: 'Treatment Plans',
};

// ─── Client Factory ─────────────────────────────────────────────────────────

/**
 * Create a tenant-scoped database client. All operations go through
 * the tenant's own Airtable base with their own PAT.
 */
export function createTenantDatabase(tenantConfig: TenantConfig): TenantDatabaseClient {
  const { id: tenantId, airtable: airtableConfig } = tenantConfig;

  if (!airtableConfig.pat || !airtableConfig.baseId) {
    throw new Error(`Tenant ${tenantId} has no Airtable credentials configured`);
  }

  const base = getOrCreateBase(airtableConfig);

  // Resolve table name with tenant-specific overrides
  function resolveTableName(name: string): string {
    return airtableConfig.tableOverrides?.[name] || name;
  }

  function table(name: string): AirtableTable {
    return base(resolveTableName(name));
  }

  // Build typed table accessors
  const Tables: TenantTables = {} as TenantTables;
  for (const [key, defaultName] of Object.entries(DEFAULT_TABLE_NAMES)) {
    (Tables as unknown as Record<string, () => AirtableTable>)[key] = () => table(defaultName);
  }

  // fetchAll with tenant scoping
  async function fetchAll<T = Record<string, unknown>>(
    tableName: string,
    options?: Airtable.SelectOptions<Airtable.FieldSet>,
    skipTestFilter?: boolean
  ): Promise<{ id: string; fields: T }[]> {
    const resolved = resolveTableName(tableName);
    const cacheKey = `${resolved}:fetchAll:${JSON.stringify({ options, skipTestFilter })}`;
    const cached = getCached<{ id: string; fields: T }[]>(tenantId, cacheKey);
    if (cached) return cached;

    const records: { id: string; fields: T }[] = [];
    const formula = skipTestFilter
      ? (options?.filterByFormula || '')
      : options?.filterByFormula
        ? `AND(NOT({Is Test}), ${options.filterByFormula})`
        : 'NOT({Is Test})';

    await rateLimitedQuery(tenantId, () =>
      new Promise<void>((resolve, reject) => {
        base(resolved)
          .select({
            ...options,
            ...(formula ? { filterByFormula: formula } : {}),
          })
          .eachPage(
            (pageRecords, fetchNextPage) => {
              pageRecords.forEach((r) => {
                records.push({ id: r.id, fields: r.fields as unknown as T });
              });
              fetchNextPage();
            },
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
      })
    );

    setCache(tenantId, cacheKey, records);
    return records;
  }

  // fetchFirst with tenant scoping
  async function fetchFirst<T = Record<string, unknown>>(
    tableName: string,
    maxRecords: number,
    options?: Airtable.SelectOptions<Airtable.FieldSet>,
    skipTestFilter?: boolean
  ): Promise<{ id: string; fields: T }[]> {
    const resolved = resolveTableName(tableName);
    const cacheKey = `${resolved}:fetchFirst:${JSON.stringify({ maxRecords, options, skipTestFilter })}`;
    const cached = getCached<{ id: string; fields: T }[]>(tenantId, cacheKey);
    if (cached) return cached;

    const formula = skipTestFilter
      ? (options?.filterByFormula || '')
      : options?.filterByFormula
        ? `AND(NOT({Is Test}), ${options.filterByFormula})`
        : 'NOT({Is Test})';

    const result = await rateLimitedQuery(tenantId, async () => {
      const records = await base(resolved)
        .select({
          maxRecords,
          ...options,
          ...(formula ? { filterByFormula: formula } : {}),
        })
        .firstPage();
      return records.map((r) => ({ id: r.id, fields: r.fields as unknown as T }));
    });

    setCache(tenantId, cacheKey, result);
    return result;
  }

  // createRecord with tenant scoping
  async function createRecord<T = Record<string, unknown>>(
    tableName: string,
    fields: Partial<T>
  ): Promise<string> {
    const resolved = resolveTableName(tableName);
    const recordId = await rateLimitedQuery(tenantId, async () => {
      const record = await base(resolved).create(fields as Partial<Airtable.FieldSet>);
      return record.id;
    });
    invalidateTenantTableCache(tenantId, resolved);
    return recordId;
  }

  // updateRecord with tenant scoping
  async function updateRecord<T = Record<string, unknown>>(
    tableName: string,
    recordId: string,
    fields: Partial<T>
  ): Promise<void> {
    const resolved = resolveTableName(tableName);
    await rateLimitedQuery(tenantId, async () => {
      await base(resolved).update(recordId, fields as Partial<Airtable.FieldSet>);
    });
    invalidateTenantTableCache(tenantId, resolved);
  }

  // deleteRecord with tenant scoping
  async function deleteRecord(tableName: string, recordId: string): Promise<void> {
    const resolved = resolveTableName(tableName);
    await rateLimitedQuery(tenantId, async () => {
      await base(resolved).destroy(recordId);
    });
    invalidateTenantTableCache(tenantId, resolved);
  }

  return {
    tenantId,
    base,
    table,
    fetchAll,
    fetchFirst,
    createRecord,
    updateRecord,
    deleteRecord,
    Tables,
  };
}

// ─── Tenant Isolation Guard ─────────────────────────────────────────────────

/**
 * Validates that a database client belongs to the expected tenant.
 * Use this in API route handlers to prevent tenant ID spoofing.
 */
export function assertTenantMatch(client: TenantDatabaseClient, expectedTenantId: string): void {
  if (client.tenantId !== expectedTenantId) {
    throw new TenantIsolationError(
      `Tenant isolation violation: client for "${client.tenantId}" used in context of "${expectedTenantId}"`
    );
  }
}

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

// ─── Client Pool (Singleton per tenant) ─────────────────────────────────────

const clientPool = new Map<string, TenantDatabaseClient>();

/**
 * Get or create a database client for a tenant.
 * Caches clients by tenant ID.
 */
export function getTenantDatabase(tenantConfig: TenantConfig): TenantDatabaseClient {
  const key = tenantConfig.id;
  if (!clientPool.has(key)) {
    clientPool.set(key, createTenantDatabase(tenantConfig));
  }
  return clientPool.get(key)!;
}

/**
 * Remove a tenant's database client from the pool (e.g., after config change).
 */
export function evictTenantDatabase(tenantId: string): void {
  clientPool.delete(tenantId);
  clearTenantDatabaseCache(tenantId);
}

// ─── Test Connection ────────────────────────────────────────────────────────

/**
 * Test whether a tenant's Airtable credentials are valid by
 * fetching a single record from the Clients table.
 */
export async function testTenantConnection(
  pat: string,
  baseId: string
): Promise<{ success: boolean; error?: string; tableCount?: number }> {
  try {
    const at = new Airtable({ apiKey: pat });
    const base = at.base(baseId);

    // Try to list a single record from the first table we can find
    const records = await base('Clients')
      .select({ maxRecords: 1 })
      .firstPage();

    return {
      success: true,
      tableCount: records.length >= 0 ? 1 : 0, // At least Clients table exists
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = getStatusCode(err);

    if (status === 401 || status === 403) {
      return { success: false, error: 'Invalid Personal Access Token. Check your Airtable PAT.' };
    }
    if (status === 404) {
      return { success: false, error: 'Airtable base not found. Check your Base ID.' };
    }

    return { success: false, error: `Connection failed: ${message}` };
  }
}
