// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cache, TTL } from '../index';

beforeEach(() => {
  cache.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Basic set/get ──

describe('TTLCache set and get', () => {
  it('stores and retrieves a string value', () => {
    cache.set('key1', 'hello', TTL.STANDARD);
    expect(cache.get('key1')).toBe('hello');
  });

  it('stores and retrieves an object value', () => {
    cache.set('key2', { name: 'test', value: 42 }, TTL.STANDARD);
    expect(cache.get<{ name: string; value: number }>('key2')).toEqual({ name: 'test', value: 42 });
  });

  it('stores and retrieves a number value', () => {
    cache.set('num', 99, TTL.STANDARD);
    expect(cache.get<number>('num')).toBe(99);
  });

  it('stores and retrieves an array value', () => {
    cache.set('arr', [1, 2, 3], TTL.STANDARD);
    expect(cache.get<number[]>('arr')).toEqual([1, 2, 3]);
  });

  it('returns null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('overwrites existing keys with new values', () => {
    cache.set('overwrite', 'old', TTL.STANDARD);
    cache.set('overwrite', 'new', TTL.STANDARD);
    expect(cache.get('overwrite')).toBe('new');
  });

  it('handles boolean values correctly', () => {
    cache.set('bool-true', true, TTL.STANDARD);
    cache.set('bool-false', false, TTL.STANDARD);
    expect(cache.get('bool-true')).toBe(true);
    expect(cache.get('bool-false')).toBe(false);
  });

  it('handles null as a stored value', () => {
    cache.set('null-val', null, TTL.STANDARD);
    // get returns null for both missing AND null-stored values
    expect(cache.get('null-val')).toBeNull();
  });
});

// ── TTL expiration ──

describe('TTLCache expiration', () => {
  it('entry expires after TTL elapses', () => {
    vi.useFakeTimers();
    cache.set('expiring', 'value', 100);
    expect(cache.get('expiring')).toBe('value');

    vi.advanceTimersByTime(101);
    expect(cache.get('expiring')).toBeNull();
  });

  it('entry is still valid just before TTL', () => {
    vi.useFakeTimers();
    cache.set('alive', 'value', 1000);

    vi.advanceTimersByTime(999);
    expect(cache.get('alive')).toBe('value');
  });

  it('different keys can have different TTLs', () => {
    vi.useFakeTimers();
    cache.set('short', 'a', 50);
    cache.set('long', 'b', 200);

    vi.advanceTimersByTime(100);
    expect(cache.get('short')).toBeNull();
    expect(cache.get('long')).toBe('b');
  });

  it('expired entries are removed from size count on access', () => {
    vi.useFakeTimers();
    cache.set('temp', 'data', 10);
    expect(cache.size()).toBe(1);

    vi.advanceTimersByTime(20);
    cache.get('temp'); // triggers cleanup
    expect(cache.size()).toBe(0);
  });
});

// ── Invalidation ──

describe('TTLCache invalidation', () => {
  it('invalidate removes a specific entry', () => {
    cache.set('toRemove', 'data', TTL.STANDARD);
    expect(cache.get('toRemove')).toBe('data');
    cache.invalidate('toRemove');
    expect(cache.get('toRemove')).toBeNull();
  });

  it('invalidate on non-existent key does not throw', () => {
    expect(() => cache.invalidate('ghost')).not.toThrow();
  });

  it('invalidatePrefix removes all matching entries', () => {
    cache.set('dashboard:kpis', 'kpi-data', TTL.STANDARD);
    cache.set('dashboard:revenue', 'revenue-data', TTL.STANDARD);
    cache.set('clients:list', 'client-data', TTL.STANDARD);

    cache.invalidatePrefix('dashboard:');

    expect(cache.get('dashboard:kpis')).toBeNull();
    expect(cache.get('dashboard:revenue')).toBeNull();
    expect(cache.get('clients:list')).toBe('client-data');
  });

  it('invalidatePrefix with no matches does not affect other entries', () => {
    cache.set('a', 1, TTL.STANDARD);
    cache.invalidatePrefix('zzz:');
    expect(cache.get('a')).toBe(1);
  });

  it('clear empties all entries', () => {
    cache.set('a', 1, TTL.STANDARD);
    cache.set('b', 2, TTL.STANDARD);
    cache.set('c', 3, TTL.STANDARD);
    expect(cache.size()).toBe(3);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeNull();
  });
});

// ── Size ──

describe('TTLCache size', () => {
  it('returns 0 for empty cache', () => {
    expect(cache.size()).toBe(0);
  });

  it('increments with each new key', () => {
    cache.set('x', 1, TTL.STANDARD);
    expect(cache.size()).toBe(1);
    cache.set('y', 2, TTL.STANDARD);
    expect(cache.size()).toBe(2);
  });

  it('does not increment when overwriting same key', () => {
    cache.set('x', 1, TTL.STANDARD);
    cache.set('x', 2, TTL.STANDARD);
    expect(cache.size()).toBe(1);
  });

  it('decrements on invalidate', () => {
    cache.set('a', 1, TTL.STANDARD);
    cache.set('b', 2, TTL.STANDARD);
    cache.invalidate('a');
    expect(cache.size()).toBe(1);
  });
});

// ── TTL constants (presets) ──

describe('TTL presets', () => {
  it('REALTIME is 30 seconds', () => {
    expect(TTL.REALTIME).toBe(30_000);
  });

  it('STANDARD is 60 seconds', () => {
    expect(TTL.STANDARD).toBe(60_000);
  });

  it('MODERATE is 2 minutes', () => {
    expect(TTL.MODERATE).toBe(120_000);
  });

  it('RELAXED is 5 minutes', () => {
    expect(TTL.RELAXED).toBe(300_000);
  });

  it('SLOW is 10 minutes', () => {
    expect(TTL.SLOW).toBe(600_000);
  });

  it('presets are in ascending order', () => {
    expect(TTL.REALTIME).toBeLessThan(TTL.STANDARD);
    expect(TTL.STANDARD).toBeLessThan(TTL.MODERATE);
    expect(TTL.MODERATE).toBeLessThan(TTL.RELAXED);
    expect(TTL.RELAXED).toBeLessThan(TTL.SLOW);
  });
});
