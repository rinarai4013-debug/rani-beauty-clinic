import { NextResponse } from 'next/server';
import { airtableCircuitBreaker } from '@/lib/airtable/circuit-breaker';
import { airtableCache } from '@/lib/airtable/cache';
import { writeQueue } from '@/lib/airtable/write-queue';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/airtable
 *
 * Health check endpoint for the Airtable integration.
 * Returns circuit breaker state, cache stats, write queue stats,
 * and optionally pings Airtable with a lightweight query.
 *
 * Query params:
 *   ?ping=true  - actually query Airtable to verify connectivity (adds latency)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldPing = searchParams.get('ping') === 'true';

  const circuitBreaker = airtableCircuitBreaker.getStats();
  const cache = airtableCache.getStats();
  const queue = writeQueue.getStats();

  let ping: { ok: boolean; latencyMs: number; error?: string } | null = null;

  if (shouldPing) {
    const start = Date.now();
    try {
      // Lightweight probe: fetch 1 record from KPI Snapshots
      await rateLimitedQuery(async () => {
        await Tables.kpis()
          .select({ maxRecords: 1, fields: ['Date'] })
          .firstPage();
      });
      ping = { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      ping = {
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  const isHealthy =
    circuitBreaker.state !== 'OPEN' &&
    queue.size < queue.maxSize * 0.8 && // queue < 80% full
    (ping === null || ping.ok);

  const status = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      circuitBreaker,
      cache,
      writeQueue: queue,
      ...(ping && { ping }),
      env: {
        hasApiKey: !!process.env.AIRTABLE_PAT,
        hasBaseId: !!process.env.AIRTABLE_BASE_ID,
      },
    },
    { status }
  );
}
