import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { calculateComplianceScore } from '@/lib/compliance';
import { withSentry } from '@/lib/sentry-utils';

/**
 * GET /api/dashboard/compliance
 *
 * Returns the overall compliance score and category breakdown.
 * Engine: src/lib/compliance/index.ts — calculateComplianceScore()
 * Agent: Compliance Guardian
 *
 * Note: The compliance engine currently uses in-memory data structures
 * for sub-module scores (HIPAA, OSHA, licensing, DEA, devices, consents).
 * Future: wire sub-modules to Airtable compliance tables.
 */
export async function GET() {
  return withSentry('dashboard/compliance', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_executive')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const cacheKey = 'compliance-score';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const complianceScore = calculateComplianceScore();

    const result = {
      success: true,
      data: complianceScore,
      generatedAt: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.SLOW);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Compliance score error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to calculate compliance score' },
        { status: 500 }
      );
    }
  });
}
