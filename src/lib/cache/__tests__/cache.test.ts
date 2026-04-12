import { describe, it, expect, beforeEach } from 'vitest';
import { cache, TTL } from '../index';

describe('TTLCache', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('returns null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('stores and retrieves a value within TTL', () => {
    cache.set('key1', { hello: 'world' }, TTL.STANDARD);
    expect(cache.get('key1')).toEqual({ hello: 'world' });
  });

  it('returns null after TTL expires', async () => {
    cache.set('short', 42, 1); // 1ms TTL
    await new Promise((r) => setTimeout(r, 10));
    expect(cache.get('short')).toBeNull();
  });

  it('tracks size correctly', () => {
    expect(cache.size()).toBe(0);
    cache.set('a', 1, TTL.STANDARD);
    cache.set('b', 2, TTL.STANDARD);
    expect(cache.size()).toBe(2);
  });

  it('overwrites existing key without growing size', () => {
    cache.set('x', 'first', TTL.STANDARD);
    cache.set('x', 'second', TTL.STANDARD);
    expect(cache.size()).toBe(1);
    expect(cache.get('x')).toBe('second');
  });

  it('invalidates a single key', () => {
    cache.set('del', 'value', TTL.STANDARD);
    cache.invalidate('del');
    expect(cache.get('del')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('invalidates keys by prefix', () => {
    cache.set('clients:list', [], TTL.STANDARD);
    cache.set('clients:detail:1', {}, TTL.STANDARD);
    cache.set('revenue:total', 100, TTL.STANDARD);

    cache.invalidatePrefix('clients:');
    expect(cache.get('clients:list')).toBeNull();
    expect(cache.get('clients:detail:1')).toBeNull();
    expect(cache.get('revenue:total')).toBe(100);
  });

  it('clears all entries', () => {
    cache.set('a', 1, TTL.STANDARD);
    cache.set('b', 2, TTL.STANDARD);
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeNull();
  });

  it('evicts oldest entry when at capacity', () => {
    // MAX_CACHE_SIZE is 1000 — fill it up
    for (let i = 0; i < 1000; i++) {
      cache.set(`fill-${i}`, i, TTL.SLOW);
    }
    expect(cache.size()).toBe(1000);

    // Adding one more should evict the oldest (fill-0 has earliest expiresAt)
    cache.set('overflow', 'new', TTL.SLOW);
    expect(cache.size()).toBe(1000);
    expect(cache.get('overflow')).toBe('new');
  });

  it('exports expected TTL constants', () => {
    expect(TTL.REALTIME).toBe(30_000);
    expect(TTL.STANDARD).toBe(60_000);
    expect(TTL.MODERATE).toBe(120_000);
    expect(TTL.RELAXED).toBe(300_000);
    expect(TTL.SLOW).toBe(600_000);
  });
});
