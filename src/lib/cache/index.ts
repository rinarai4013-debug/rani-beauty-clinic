// Simple in-memory TTL cache for server-side API route caching
// Prevents hammering Airtable API while keeping dashboard responsive

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 1000;
const SWEEP_THRESHOLD = 1200;

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    // Periodic cleanup: sweep expired entries when store grows too large
    if (this.store.size > SWEEP_THRESHOLD) {
      const now = Date.now();
      for (const [k, v] of this.store) {
        if (now > v.expiresAt) this.store.delete(k);
      }
    }

    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Evict oldest entries when at capacity
    if (this.store.size >= MAX_CACHE_SIZE && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;
    for (const [k, v] of this.store) {
      if (v.expiresAt < oldestExpiry) {
        oldestExpiry = v.expiresAt;
        oldestKey = k;
      }
    }
    if (oldestKey) this.store.delete(oldestKey);
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// Singleton cache instance
export const cache = new TTLCache();

// TTL constants (milliseconds)
export const TTL = {
  REALTIME: 30_000,     // 30s - schedule, live metrics
  STANDARD: 60_000,     // 60s - KPIs, revenue, score
  MODERATE: 120_000,    // 2min - lead funnel, aggregations
  RELAXED: 300_000,     // 5min - client lists, provider cards
  SLOW: 600_000,        // 10min - finance, inventory
  HOURLY: 3_600_000,    // 60min - strategic snapshots
} as const;
