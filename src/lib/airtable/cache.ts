// Read-through TTL cache for Airtable queries
// Per-table configurable TTLs with cache invalidation on writes

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  byTable: Record<string, { hits: number; misses: number; entries: number }>;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  table: string;
}

// Per-table TTL configuration (milliseconds)
export const TABLE_TTL: Record<string, number> = {
  'Clients': 300_000,               // 5 minutes
  'Client Intakes': 300_000,        // 5 minutes
  'Intake Intelligence': 300_000,   // 5 minutes
  'Appointments': 60_000,           // 1 minute
  'Packages': 300_000,              // 5 minutes
  'Memberships': 300_000,           // 5 minutes
  'Transactions': 120_000,          // 2 minutes
  'Messages Log': 120_000,          // 2 minutes
  'Reviews': 600_000,               // 10 minutes
  'KPI Snapshots': 30_000,          // 30 seconds (hot data)
  'Alerts': 30_000,                 // 30 seconds
  'Competitor Intelligence': 600_000, // 10 minutes
  'Treatment Plans': 300_000,       // 5 minutes
};

const DEFAULT_TTL = 60_000; // 1 minute fallback
const MAX_CACHE_SIZE = 500;

class AirtableCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;
  private tableStats = new Map<string, { hits: number; misses: number }>();

  /**
   * Build a cache key from table name and query parameters.
   */
  static buildKey(table: string, params?: Record<string, unknown>): string {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${table}:${paramStr}`;
  }

  /**
   * Get a cached value. Returns null on miss or expiry.
   */
  get<T>(key: string, table: string): T | null {
    const entry = this.store.get(key);

    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.store.delete(key);
      this.misses++;
      this.trackTableStat(table, 'miss');
      return null;
    }

    this.hits++;
    this.trackTableStat(table, 'hit');
    return entry.data as T;
  }

  /**
   * Store a value in the cache with the table's configured TTL.
   */
  set<T>(key: string, table: string, data: T, customTtl?: number): void {
    // Evict expired entries if at capacity
    if (this.store.size >= MAX_CACHE_SIZE && !this.store.has(key)) {
      this.evictExpired();
      // If still full, evict oldest
      if (this.store.size >= MAX_CACHE_SIZE) {
        this.evictOldest();
      }
    }

    const ttl = customTtl ?? TABLE_TTL[table] ?? DEFAULT_TTL;
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      table,
    });
  }

  /**
   * Read-through cache: returns cached data or calls fetcher and caches the result.
   */
  async getOrFetch<T>(
    table: string,
    params: Record<string, unknown> | undefined,
    fetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const key = AirtableCache.buildKey(table, params);
    const cached = this.get<T>(key, table);
    if (cached !== null) return cached;

    const data = await fetcher();
    this.set(key, table, data, customTtl);
    return data;
  }

  /**
   * Invalidate all cache entries for a given table.
   * Call this on any write to that table.
   */
  invalidateTable(table: string): void {
    for (const [key, entry] of this.store) {
      if (entry.table === table) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidateKey(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.tableStats.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const byTable: CacheStats['byTable'] = {};
    // Count entries per table
    const tableCounts = new Map<string, number>();
    for (const entry of this.store.values()) {
      tableCounts.set(entry.table, (tableCounts.get(entry.table) || 0) + 1);
    }

    for (const [table, stats] of this.tableStats) {
      byTable[table] = {
        hits: stats.hits,
        misses: stats.misses,
        entries: tableCounts.get(table) || 0,
      };
    }

    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: total > 0 ? this.hits / total : 0,
      byTable,
    };
  }

  private trackTableStat(table: string, type: 'hit' | 'miss'): void {
    const existing = this.tableStats.get(table) || { hits: 0, misses: 0 };
    if (type === 'hit') existing.hits++;
    else existing.misses++;
    this.tableStats.set(table, existing);
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < oldestExpiry) {
        oldestExpiry = entry.expiresAt;
        oldestKey = key;
      }
    }
    if (oldestKey) this.store.delete(oldestKey);
  }
}

// Singleton instance
export const airtableCache = new AirtableCache();
export { AirtableCache, MAX_CACHE_SIZE, DEFAULT_TTL };
