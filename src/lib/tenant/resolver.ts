/**
 * RaniOS Tenant Resolver
 *
 * Resolves tenant configuration from multiple sources:
 * 1. Subdomain: clinic-name.ranios.com
 * 2. Custom domain: dashboard.luxmedspa.com (CNAME lookup)
 * 3. JWT session: tenant ID embedded in auth token
 * 4. Explicit tenant ID (API calls, admin)
 *
 * Includes a 5-minute TTL cache to minimize database lookups.
 */

import { type TenantConfig, DEFAULT_TENANT_CONFIG, DEFAULT_TENANT_ID } from './config';

// ─── Cache ──────────────────────────────────────────────────────────────────

interface CacheEntry {
  config: TenantConfig;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const tenantCache = new Map<string, CacheEntry>();

function getCached(key: string): TenantConfig | null {
  const entry = tenantCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tenantCache.delete(key);
    return null;
  }
  return entry.config;
}

function setCache(key: string, config: TenantConfig): void {
  tenantCache.set(key, {
    config,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateTenantCache(tenantId: string): void {
  // Delete all cache entries that reference this tenant
  for (const [key, entry] of tenantCache.entries()) {
    if (entry.config.id === tenantId) {
      tenantCache.delete(key);
    }
  }
}

export function clearTenantCache(): void {
  tenantCache.clear();
}

/** Exposed for testing */
export function getCacheSize(): number {
  return tenantCache.size;
}

// ─── Tenant Store Interface ─────────────────────────────────────────────────

/**
 * Abstract tenant store - allows swapping between Airtable, Postgres, etc.
 * The platform stores tenant configs in a "Tenants" Airtable table within
 * a master/platform Airtable base (separate from any tenant's own base).
 */
export interface TenantStore {
  getById(id: string): Promise<TenantConfig | null>;
  getBySlug(slug: string): Promise<TenantConfig | null>;
  getByCustomDomain(domain: string): Promise<TenantConfig | null>;
  create(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): Promise<TenantConfig>;
  update(id: string, partial: Partial<TenantConfig>): Promise<TenantConfig>;
  delete(id: string): Promise<void>;
  list(options?: { active?: boolean; limit?: number; offset?: number }): Promise<TenantConfig[]>;
}

// ─── Airtable Tenant Store ──────────────────────────────────────────────────

/**
 * Production tenant store backed by a master Airtable base.
 * The "Tenants" table holds all tenant configs as JSON in a long-text field.
 *
 * Schema:
 * - ID (formula: autonumber or manually set UUID)
 * - Slug (single line text, unique)
 * - Custom Domain (single line text, nullable)
 * - Config JSON (long text - full TenantConfig serialized)
 * - Active (checkbox)
 * - Created At (created time)
 * - Updated At (last modified time)
 */

import Airtable from 'airtable';

function getMasterBase(): ReturnType<InstanceType<typeof Airtable>['base']> {
  const pat = process.env.RANIOS_MASTER_PAT || process.env.AIRTABLE_PAT;
  const baseId = process.env.RANIOS_MASTER_BASE_ID || process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) {
    throw new Error('Master Airtable credentials not configured (RANIOS_MASTER_PAT / RANIOS_MASTER_BASE_ID)');
  }
  const at = new Airtable({ apiKey: pat });
  return at.base(baseId);
}

function parseConfigFromRecord(record: { id: string; fields: Record<string, unknown> }): TenantConfig | null {
  try {
    const json = record.fields['Config JSON'] as string;
    if (!json) return null;
    const config = JSON.parse(json) as TenantConfig;
    return config;
  } catch {
    console.error(`[TenantStore] Failed to parse config for record ${record.id}`);
    return null;
  }
}

export class AirtableTenantStore implements TenantStore {
  private tableName = 'Tenants';

  private table() {
    return getMasterBase()(this.tableName);
  }

  async getById(id: string): Promise<TenantConfig | null> {
    try {
      const records = await this.table()
        .select({
          filterByFormula: `{Tenant ID} = "${id}"`,
          maxRecords: 1,
        })
        .firstPage();
      if (records.length === 0) return null;
      return parseConfigFromRecord({ id: records[0].id, fields: records[0].fields as Record<string, unknown> });
    } catch (err) {
      console.error('[TenantStore] getById failed:', err);
      return null;
    }
  }

  async getBySlug(slug: string): Promise<TenantConfig | null> {
    try {
      const records = await this.table()
        .select({
          filterByFormula: `{Slug} = "${slug}"`,
          maxRecords: 1,
        })
        .firstPage();
      if (records.length === 0) return null;
      return parseConfigFromRecord({ id: records[0].id, fields: records[0].fields as Record<string, unknown> });
    } catch (err) {
      console.error('[TenantStore] getBySlug failed:', err);
      return null;
    }
  }

  async getByCustomDomain(domain: string): Promise<TenantConfig | null> {
    try {
      const records = await this.table()
        .select({
          filterByFormula: `{Custom Domain} = "${domain}"`,
          maxRecords: 1,
        })
        .firstPage();
      if (records.length === 0) return null;
      return parseConfigFromRecord({ id: records[0].id, fields: records[0].fields as Record<string, unknown> });
    } catch (err) {
      console.error('[TenantStore] getByCustomDomain failed:', err);
      return null;
    }
  }

  async create(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): Promise<TenantConfig> {
    const now = new Date().toISOString();
    const fullConfig: TenantConfig = {
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    await (this.table().create as any)({
      'Tenant ID': fullConfig.id,
      Slug: fullConfig.slug,
      'Custom Domain': fullConfig.customDomain || '',
      'Config JSON': JSON.stringify(fullConfig),
      Active: fullConfig.active,
    });

    return fullConfig;
  }

  async update(id: string, partial: Partial<TenantConfig>): Promise<TenantConfig> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Tenant ${id} not found`);

    const updated: TenantConfig = {
      ...existing,
      ...partial,
      id: existing.id, // prevent ID mutation
      updatedAt: new Date().toISOString(),
    };

    // Find the Airtable record ID
    const records = await this.table()
      .select({
        filterByFormula: `{Tenant ID} = "${id}"`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) throw new Error(`Tenant record not found for ${id}`);

    await (this.table().update as any)(records[0].id, {
      Slug: updated.slug,
      'Custom Domain': updated.customDomain || '',
      'Config JSON': JSON.stringify(updated),
      Active: updated.active,
    });

    invalidateTenantCache(id);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const records = await this.table()
      .select({
        filterByFormula: `{Tenant ID} = "${id}"`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      await this.table().destroy(records[0].id);
    }
    invalidateTenantCache(id);
  }

  async list(options?: { active?: boolean; limit?: number; offset?: number }): Promise<TenantConfig[]> {
    const formula = options?.active !== undefined
      ? options.active ? '{Active} = TRUE()' : '{Active} = FALSE()'
      : '';

    const records = await this.table()
      .select({
        ...(formula ? { filterByFormula: formula } : {}),
        maxRecords: options?.limit || 100,
      })
      .firstPage();

    return records
      .map((r) => parseConfigFromRecord({ id: r.id, fields: r.fields as Record<string, unknown> }))
      .filter((c): c is TenantConfig => c !== null);
  }
}

// ─── In-Memory Store (Dev/Test) ─────────────────────────────────────────────

export class InMemoryTenantStore implements TenantStore {
  private tenants = new Map<string, TenantConfig>();

  constructor(initial?: TenantConfig[]) {
    if (initial) {
      for (const t of initial) this.tenants.set(t.id, t);
    }
  }

  async getById(id: string): Promise<TenantConfig | null> {
    return this.tenants.get(id) || null;
  }

  async getBySlug(slug: string): Promise<TenantConfig | null> {
    for (const t of this.tenants.values()) {
      if (t.slug === slug) return t;
    }
    return null;
  }

  async getByCustomDomain(domain: string): Promise<TenantConfig | null> {
    for (const t of this.tenants.values()) {
      if (t.customDomain === domain) return t;
    }
    return null;
  }

  async create(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): Promise<TenantConfig> {
    const now = new Date().toISOString();
    const full: TenantConfig = { ...config, createdAt: now, updatedAt: now };
    this.tenants.set(full.id, full);
    return full;
  }

  async update(id: string, partial: Partial<TenantConfig>): Promise<TenantConfig> {
    const existing = this.tenants.get(id);
    if (!existing) throw new Error(`Tenant ${id} not found`);
    const updated = { ...existing, ...partial, id: existing.id, updatedAt: new Date().toISOString() };
    this.tenants.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.tenants.delete(id);
  }

  async list(options?: { active?: boolean; limit?: number }): Promise<TenantConfig[]> {
    let results = [...this.tenants.values()];
    if (options?.active !== undefined) {
      results = results.filter((t) => t.active === options.active);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return results;
  }
}

// ─── Singleton Store ────────────────────────────────────────────────────────

let _store: TenantStore | null = null;

export function getTenantStore(): TenantStore {
  if (!_store) {
    if (process.env.NODE_ENV === 'test') {
      _store = new InMemoryTenantStore([DEFAULT_TENANT_CONFIG]);
    } else {
      _store = new AirtableTenantStore();
    }
  }
  return _store;
}

export function setTenantStore(store: TenantStore): void {
  _store = store;
}

// ─── Resolution Functions ───────────────────────────────────────────────────

const parseDomainCsv = (input: string | undefined, fallback: string[]): string[] =>
  (input ?? fallback.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const PLATFORM_DOMAINS = parseDomainCsv(process.env.PLATFORM_DOMAINS, ['ranios.com', 'ranios.dev', 'localhost']);

/**
 * Extract subdomain from hostname.
 * e.g., 'luxspa.ranios.com' → 'luxspa'
 *       'ranios.com' → null
 *       'localhost:3000' → null
 */
export function extractSubdomain(hostname: string): string | null {
  // Strip port
  const host = hostname.split(':')[0];

  for (const domain of PLATFORM_DOMAINS) {
    if (host === domain) return null; // bare platform domain
    if (host.endsWith(`.${domain}`)) {
      const sub = host.slice(0, -(domain.length + 1));
      // Reject multi-level subdomains (e.g., 'a.b.ranios.com')
      if (sub.includes('.')) return null;
      return sub;
    }
  }

  return null;
}

/**
 * Check if a hostname is a custom domain (not a platform subdomain).
 */
export function isCustomDomain(hostname: string): boolean {
  const host = hostname.split(':')[0];
  for (const domain of PLATFORM_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return false;
  }
  // Must contain a dot (actual domain, not 'localhost')
  return host.includes('.');
}

/**
 * Resolve tenant from subdomain (e.g., clinic-name.ranios.com).
 */
export async function resolveFromSubdomain(hostname: string): Promise<TenantConfig | null> {
  const slug = extractSubdomain(hostname);
  if (!slug) return null;

  // Check cache first
  const cacheKey = `slug:${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const store = getTenantStore();
  const config = await store.getBySlug(slug);
  if (config && config.active) {
    setCache(cacheKey, config);
    return config;
  }

  return null;
}

/**
 * Resolve tenant from custom domain (e.g., dashboard.luxmedspa.com via CNAME).
 */
export async function resolveFromCustomDomain(hostname: string): Promise<TenantConfig | null> {
  if (!isCustomDomain(hostname)) return null;

  const domain = hostname.split(':')[0];
  const cacheKey = `domain:${domain}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const store = getTenantStore();
  const config = await store.getByCustomDomain(domain);
  if (config && config.active) {
    setCache(cacheKey, config);
    return config;
  }

  return null;
}

/**
 * Resolve tenant from JWT session payload (tenant ID embedded in token).
 */
export async function resolveFromSession(tenantId: string): Promise<TenantConfig | null> {
  if (!tenantId) return null;

  const cacheKey = `id:${tenantId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const store = getTenantStore();
  const config = await store.getById(tenantId);
  if (config && config.active) {
    setCache(cacheKey, config);
    return config;
  }

  return null;
}

/**
 * Resolve tenant from an explicit tenant ID.
 */
export async function resolveById(tenantId: string): Promise<TenantConfig | null> {
  return resolveFromSession(tenantId); // Same logic
}

// ─── Master Resolution Pipeline ────────────────────────────────────────────

export interface ResolveContext {
  hostname: string;
  sessionTenantId?: string;
  headerTenantId?: string; // X-Tenant-ID header
}

/**
 * Master tenant resolution - tries all strategies in priority order:
 * 1. Explicit header (X-Tenant-ID) - for API/admin calls
 * 2. JWT session tenant ID
 * 3. Subdomain
 * 4. Custom domain
 * 5. Default tenant (backward compatibility)
 */
export async function resolveTenant(ctx: ResolveContext): Promise<TenantConfig> {
  // 1. Explicit header
  if (ctx.headerTenantId) {
    const config = await resolveById(ctx.headerTenantId);
    if (config) return config;
  }

  // 2. JWT session
  if (ctx.sessionTenantId) {
    const config = await resolveFromSession(ctx.sessionTenantId);
    if (config) return config;
  }

  // 3. Subdomain
  const subdomainConfig = await resolveFromSubdomain(ctx.hostname);
  if (subdomainConfig) return subdomainConfig;

  // 4. Custom domain
  const customDomainConfig = await resolveFromCustomDomain(ctx.hostname);
  if (customDomainConfig) return customDomainConfig;

  // 5. Default - Rani Beauty Clinic (backward compatibility)
  return DEFAULT_TENANT_CONFIG;
}
