// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cache, TTL } from './index';

beforeEach(() => {
  cache.clear();
});

describe('TTLCache', () => {
  it('set and get returns correct value', () => {
    cache.set('key1', { name: 'test' }, TTL.STANDARD);
    const result = cache.get<{ name: string }>('key1');
    expect(result).toEqual({ name: 'test' });
  });

  it('returns null for missing keys', () => {
    const result = cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('TTL expiration removes entry', () => {
    // Set with very short TTL
    cache.set('expiring', 'value', 1); // 1ms TTL

    // Advance time past the TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(10);

    const result = cache.get('expiring');
    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it('different keys are independent', () => {
    cache.set('a', 'alpha', TTL.STANDARD);
    cache.set('b', 'beta', TTL.STANDARD);

    expect(cache.get('a')).toBe('alpha');
    expect(cache.get('b')).toBe('beta');

    cache.invalidate('a');
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('beta');
  });

  it('invalidate removes a specific entry', () => {
    cache.set('toRemove', 'data', TTL.STANDARD);
    expect(cache.get('toRemove')).toBe('data');

    cache.invalidate('toRemove');
    expect(cache.get('toRemove')).toBeNull();
  });

  it('invalidatePrefix removes matching entries', () => {
    cache.set('dashboard:kpis', 'kpi-data', TTL.STANDARD);
    cache.set('dashboard:revenue', 'revenue-data', TTL.STANDARD);
    cache.set('clients:list', 'client-data', TTL.STANDARD);

    cache.invalidatePrefix('dashboard:');

    expect(cache.get('dashboard:kpis')).toBeNull();
    expect(cache.get('dashboard:revenue')).toBeNull();
    expect(cache.get('clients:list')).toBe('client-data');
  });

  it('clear empties all entries', () => {
    cache.set('a', 1, TTL.STANDARD);
    cache.set('b', 2, TTL.STANDARD);
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeNull();
  });

  it('size returns correct count', () => {
    expect(cache.size()).toBe(0);
    cache.set('x', 1, TTL.STANDARD);
    expect(cache.size()).toBe(1);
    cache.set('y', 2, TTL.STANDARD);
    expect(cache.size()).toBe(2);
  });
});

describe('TTL constants', () => {
  it('REALTIME is 30 seconds', () => {
    expect(TTL.REALTIME).toBe(30_000);
  });

  it('STANDARD is 60 seconds', () => {
    expect(TTL.STANDARD).toBe(60_000);
  });

  it('SLOW is 10 minutes', () => {
    expect(TTL.SLOW).toBe(600_000);
  });
});
