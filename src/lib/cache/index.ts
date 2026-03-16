// Simple in-memory TTL cache for server-side API route caching
// Prevents hammering Airtable API while keeping dashboard responsive

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
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
  REALTIME: 30_000,     // 30s — schedule, live metrics
  STANDARD: 60_000,     // 60s — KPIs, revenue, score
  MODERATE: 120_000,    // 2min — lead funnel, aggregations
  RELAXED: 300_000,     // 5min — client lists, provider cards
  SLOW: 600_000,        // 10min — finance, inventory
} as const;
