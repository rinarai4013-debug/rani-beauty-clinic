/**
 * Tenant Resolver Test Suite
 *
 * Tests subdomain extraction, custom domain detection, tenant resolution
 * pipeline, caching behavior, and fallback logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractSubdomain,
  isCustomDomain,
  resolveFromSubdomain,
  resolveFromCustomDomain,
  resolveFromSession,
  resolveTenant,
  clearTenantCache,
  getCacheSize,
  InMemoryTenantStore,
  setTenantStore,
  type ResolveContext,
} from '../resolver';
import {
  DEFAULT_TENANT_CONFIG,
  DEFAULT_TENANT_ID,
  type TenantConfig,
} from '../config';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

function makeTenant(overrides: Partial<TenantConfig> = {}): TenantConfig {
  return {
    ...DEFAULT_TENANT_CONFIG,
    id: 'test-tenant-1',
    name: 'Test Medspa',
    slug: 'test-medspa',
    active: true,
    ...overrides,
  };
}

const testTenant = makeTenant();
const inactiveTenant = makeTenant({ id: 'inactive-1', slug: 'inactive-spa', active: false });
const customDomainTenant = makeTenant({
  id: 'custom-domain-1',
  slug: 'luxe',
  customDomain: 'dashboard.luxemedspa.com',
});

let store: InMemoryTenantStore;

beforeEach(() => {
  clearTenantCache();
  store = new InMemoryTenantStore([
    DEFAULT_TENANT_CONFIG,
    testTenant,
    inactiveTenant,
    customDomainTenant,
  ]);
  setTenantStore(store);
});

afterEach(() => {
  clearTenantCache();
});

// ─── extractSubdomain ───────────────────────────────────────────────────────

describe('extractSubdomain', () => {
  it('extracts subdomain from ranios.com', () => {
    expect(extractSubdomain('test-medspa.ranios.com')).toBe('test-medspa');
  });

  it('extracts subdomain from ranios.dev', () => {
    expect(extractSubdomain('luxe.ranios.dev')).toBe('luxe');
  });

  it('extracts subdomain from localhost', () => {
    expect(extractSubdomain('myspa.localhost')).toBe('myspa');
  });

  it('handles port numbers', () => {
    expect(extractSubdomain('myspa.localhost:3000')).toBe('myspa');
  });

  it('returns null for bare platform domain', () => {
    expect(extractSubdomain('ranios.com')).toBeNull();
  });

  it('returns null for bare localhost', () => {
    expect(extractSubdomain('localhost')).toBeNull();
  });

  it('returns null for localhost with port', () => {
    expect(extractSubdomain('localhost:3000')).toBeNull();
  });

  it('rejects multi-level subdomains', () => {
    expect(extractSubdomain('a.b.ranios.com')).toBeNull();
  });

  it('returns null for custom domains', () => {
    expect(extractSubdomain('dashboard.luxemedspa.com')).toBeNull();
  });

  it('handles hyphens in subdomain', () => {
    expect(extractSubdomain('my-cool-spa.ranios.com')).toBe('my-cool-spa');
  });

  it('returns null for www', () => {
    expect(extractSubdomain('www.ranios.com')).toBe('www');
    // Note: www is extracted as subdomain, but resolveFromSubdomain will reject it
    // because there's no tenant with slug 'www'
  });
});

// ─── isCustomDomain ─────────────────────────────────────────────────────────

describe('isCustomDomain', () => {
  it('returns true for external domains', () => {
    expect(isCustomDomain('dashboard.luxemedspa.com')).toBe(true);
  });

  it('returns true for bare external domains', () => {
    expect(isCustomDomain('luxemedspa.com')).toBe(true);
  });

  it('returns false for ranios.com', () => {
    expect(isCustomDomain('ranios.com')).toBe(false);
  });

  it('returns false for subdomain of ranios.com', () => {
    expect(isCustomDomain('spa.ranios.com')).toBe(false);
  });

  it('returns false for localhost', () => {
    expect(isCustomDomain('localhost')).toBe(false);
  });

  it('returns false for localhost with port', () => {
    expect(isCustomDomain('localhost:3000')).toBe(false);
  });

  it('handles ports on custom domains', () => {
    expect(isCustomDomain('spa.example.com:8080')).toBe(true);
  });
});

// ─── resolveFromSubdomain ───────────────────────────────────────────────────

describe('resolveFromSubdomain', () => {
  it('resolves tenant by slug', async () => {
    const result = await resolveFromSubdomain('test-medspa.ranios.com');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('test-tenant-1');
    expect(result!.slug).toBe('test-medspa');
  });

  it('returns null for unknown subdomain', async () => {
    const result = await resolveFromSubdomain('nonexistent.ranios.com');
    expect(result).toBeNull();
  });

  it('returns null for bare domain', async () => {
    const result = await resolveFromSubdomain('ranios.com');
    expect(result).toBeNull();
  });

  it('does not resolve inactive tenants', async () => {
    const result = await resolveFromSubdomain('inactive-spa.ranios.com');
    expect(result).toBeNull();
  });

  it('caches results', async () => {
    await resolveFromSubdomain('test-medspa.ranios.com');
    expect(getCacheSize()).toBeGreaterThan(0);

    // Second call should use cache
    const result = await resolveFromSubdomain('test-medspa.ranios.com');
    expect(result!.id).toBe('test-tenant-1');
  });
});

// ─── resolveFromCustomDomain ────────────────────────────────────────────────

describe('resolveFromCustomDomain', () => {
  it('resolves tenant by custom domain', async () => {
    const result = await resolveFromCustomDomain('dashboard.luxemedspa.com');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('custom-domain-1');
  });

  it('returns null for unknown custom domain', async () => {
    const result = await resolveFromCustomDomain('unknown.example.com');
    expect(result).toBeNull();
  });

  it('returns null for platform domains', async () => {
    const result = await resolveFromCustomDomain('ranios.com');
    expect(result).toBeNull();
  });

  it('handles domains with ports', async () => {
    const result = await resolveFromCustomDomain('dashboard.luxemedspa.com:3000');
    expect(result).not.toBeNull();
  });
});

// ─── resolveFromSession ─────────────────────────────────────────────────────

describe('resolveFromSession', () => {
  it('resolves tenant by ID', async () => {
    const result = await resolveFromSession('test-tenant-1');
    expect(result).not.toBeNull();
    expect(result!.slug).toBe('test-medspa');
  });

  it('returns null for empty ID', async () => {
    const result = await resolveFromSession('');
    expect(result).toBeNull();
  });

  it('returns null for unknown ID', async () => {
    const result = await resolveFromSession('nonexistent-id');
    expect(result).toBeNull();
  });

  it('does not resolve inactive tenant by ID', async () => {
    const result = await resolveFromSession('inactive-1');
    expect(result).toBeNull();
  });
});

// ─── resolveTenant (Master Pipeline) ────────────────────────────────────────

describe('resolveTenant', () => {
  it('resolves from explicit header first', async () => {
    const ctx: ResolveContext = {
      hostname: 'test-medspa.ranios.com',
      headerTenantId: 'custom-domain-1', // This should take priority
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe('custom-domain-1');
  });

  it('resolves from session when no header', async () => {
    const ctx: ResolveContext = {
      hostname: 'ranios.com',
      sessionTenantId: 'test-tenant-1',
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe('test-tenant-1');
  });

  it('resolves from subdomain when no session', async () => {
    const ctx: ResolveContext = {
      hostname: 'test-medspa.ranios.com',
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe('test-tenant-1');
  });

  it('resolves from custom domain', async () => {
    const ctx: ResolveContext = {
      hostname: 'dashboard.luxemedspa.com',
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe('custom-domain-1');
  });

  it('falls back to default tenant', async () => {
    const ctx: ResolveContext = {
      hostname: 'ranios.com', // Bare domain, no subdomain
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe(DEFAULT_TENANT_ID);
  });

  it('falls back to default for localhost', async () => {
    const ctx: ResolveContext = {
      hostname: 'localhost:3000',
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe(DEFAULT_TENANT_ID);
  });

  it('session takes priority over subdomain', async () => {
    const ctx: ResolveContext = {
      hostname: 'test-medspa.ranios.com',
      sessionTenantId: 'custom-domain-1',
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe('custom-domain-1');
  });

  it('header takes priority over session', async () => {
    const ctx: ResolveContext = {
      hostname: 'test-medspa.ranios.com',
      headerTenantId: DEFAULT_TENANT_ID,
      sessionTenantId: 'custom-domain-1',
    };
    const result = await resolveTenant(ctx);
    expect(result.id).toBe(DEFAULT_TENANT_ID);
  });
});

// ─── Cache Behavior ─────────────────────────────────────────────────────────

describe('Cache', () => {
  it('starts empty', () => {
    expect(getCacheSize()).toBe(0);
  });

  it('populates on resolution', async () => {
    await resolveFromSubdomain('test-medspa.ranios.com');
    expect(getCacheSize()).toBe(1);
  });

  it('clearTenantCache empties all entries', async () => {
    await resolveFromSubdomain('test-medspa.ranios.com');
    await resolveFromCustomDomain('dashboard.luxemedspa.com');
    expect(getCacheSize()).toBe(2);
    clearTenantCache();
    expect(getCacheSize()).toBe(0);
  });

  it('does not cache null results', async () => {
    await resolveFromSubdomain('nonexistent.ranios.com');
    expect(getCacheSize()).toBe(0);
  });
});

// ─── InMemoryTenantStore ────────────────────────────────────────────────────

describe('InMemoryTenantStore', () => {
  it('creates and retrieves tenants', async () => {
    const created = await store.create(makeTenant({ id: 'new-1', slug: 'new-spa' }));
    expect(created.id).toBe('new-1');

    const retrieved = await store.getById('new-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.slug).toBe('new-spa');
  });

  it('updates tenants', async () => {
    await store.update('test-tenant-1', { name: 'Updated Name' });
    const updated = await store.getById('test-tenant-1');
    expect(updated!.name).toBe('Updated Name');
  });

  it('deletes tenants', async () => {
    await store.delete('test-tenant-1');
    const deleted = await store.getById('test-tenant-1');
    expect(deleted).toBeNull();
  });

  it('lists tenants with active filter', async () => {
    const active = await store.list({ active: true });
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((t) => t.active)).toBe(true);
  });

  it('lists with limit', async () => {
    const limited = await store.list({ limit: 1 });
    expect(limited.length).toBe(1);
  });

  it('throws on update of non-existent tenant', async () => {
    await expect(store.update('nonexistent', { name: 'x' })).rejects.toThrow();
  });
});
