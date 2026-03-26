import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AirtableCache, TABLE_TTL } from '../cache';

describe('AirtableCache', () => {
  let cache: AirtableCache;

  beforeEach(() => {
    cache = new AirtableCache();
  });

  it('returns null on cache miss', () => {
    const result = cache.get('missing-key', 'Clients');
    expect(result).toBeNull();
  });

  it('stores and retrieves a value', () => {
    cache.set('key1', 'Clients', { name: 'Jane' });
    const result = cache.get<{ name: string }>('key1', 'Clients');
    expect(result).toEqual({ name: 'Jane' });
  });

  it('expires entries after TTL', async () => {
    cache.set('key1', 'Clients', 'data', 50); // 50ms TTL
    expect(cache.get('key1', 'Clients')).toBe('data');

    await new Promise((r) => setTimeout(r, 80));
    expect(cache.get('key1', 'Clients')).toBeNull();
  });

  it('buildKey creates deterministic keys', () => {
    const key1 = AirtableCache.buildKey('Clients', { status: 'Active', limit: 10 });
    const key2 = AirtableCache.buildKey('Clients', { limit: 10, status: 'Active' });
    expect(key1).toBe(key2);
  });

  it('buildKey handles no params', () => {
    const key = AirtableCache.buildKey('Clients');
    expect(key).toBe('Clients:');
  });

  it('invalidateTable removes all entries for that table', () => {
    cache.set('c1', 'Clients', 'data1');
    cache.set('c2', 'Clients', 'data2');
    cache.set('t1', 'Transactions', 'data3');

    cache.invalidateTable('Clients');

    expect(cache.get('c1', 'Clients')).toBeNull();
    expect(cache.get('c2', 'Clients')).toBeNull();
    expect(cache.get('t1', 'Transactions')).toBe('data3');
  });

  it('invalidateKey removes a single entry', () => {
    cache.set('c1', 'Clients', 'data1');
    cache.set('c2', 'Clients', 'data2');

    cache.invalidateKey('c1');

    expect(cache.get('c1', 'Clients')).toBeNull();
    expect(cache.get('c2', 'Clients')).toBe('data2');
  });

  it('getOrFetch returns cached value on hit', async () => {
    cache.set(AirtableCache.buildKey('Clients', { id: '1' }), 'Clients', 'cached');

    const fetcher = vi.fn().mockResolvedValue('fresh');
    const result = await cache.getOrFetch('Clients', { id: '1' }, fetcher);

    expect(result).toBe('cached');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('getOrFetch calls fetcher on miss and caches result', async () => {
    const fetcher = vi.fn().mockResolvedValue('fresh');
    const result = await cache.getOrFetch('Clients', { id: '1' }, fetcher);

    expect(result).toBe('fresh');
    expect(fetcher).toHaveBeenCalledOnce();

    // Should now be cached
    const result2 = await cache.getOrFetch('Clients', { id: '1' }, fetcher);
    expect(result2).toBe('fresh');
    expect(fetcher).toHaveBeenCalledOnce(); // not called again
  });

  it('tracks hit/miss stats', () => {
    cache.set('k1', 'Clients', 'data');
    cache.get('k1', 'Clients'); // hit
    cache.get('k2', 'Clients'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
    expect(stats.size).toBe(1);
  });

  it('tracks per-table stats', () => {
    cache.set('k1', 'Clients', 'data');
    cache.get('k1', 'Clients');              // hit
    cache.get('k2', 'Transactions');          // miss

    const stats = cache.getStats();
    expect(stats.byTable['Clients'].hits).toBe(1);
    expect(stats.byTable['Clients'].entries).toBe(1);
    expect(stats.byTable['Transactions'].misses).toBe(1);
  });

  it('clear resets everything', () => {
    cache.set('k1', 'Clients', 'data');
    cache.get('k1', 'Clients');
    cache.clear();

    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });

  describe('TABLE_TTL configuration', () => {
    it('has KPI Snapshots at 30s', () => {
      expect(TABLE_TTL['KPI Snapshots']).toBe(30_000);
    });

    it('has Clients at 5 minutes', () => {
      expect(TABLE_TTL['Clients']).toBe(300_000);
    });

    it('has Reviews at 10 minutes', () => {
      expect(TABLE_TTL['Reviews']).toBe(600_000);
    });
  });
});
