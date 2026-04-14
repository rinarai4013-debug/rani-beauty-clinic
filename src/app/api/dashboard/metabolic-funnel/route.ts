/**
 * GET /api/dashboard/metabolic-funnel
 *
 * Staff dashboard funnel summary for metabolic programs:
 * started / held-for-provider-review / completed, split by track.
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getAllSessionsAsync } from '@/lib/mastermind/session';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { unauthorized } from '@/lib/auth/middleware';
import { apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import { buildMetabolicFunnelReport } from '@/lib/analytics/metabolic-funnel-report';
import { logEvent } from '@/lib/logging/structured-logger';
import { withSentry } from '@/lib/sentry-utils';

export async function GET(request: NextRequest) {
  return withSentry('dashboard/metabolic-funnel', async () => {
    try {
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) return unauthorized();

      const [sessions, intakeRecords] = await Promise.all([
        getAllSessionsAsync(),
        fetchAll(Tables.intakes()),
      ]);

      const report = buildMetabolicFunnelReport(sessions, intakeRecords as Array<{ fields?: Record<string, unknown> }>);

      return apiSuccess({
        generatedAt: new Date().toISOString(),
        ...report,
      });
    } catch (error) {
      logEvent('api', 'error', '[Dashboard Metabolic Funnel] Error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return apiError('Failed to build metabolic funnel report', 500);
    }
  });
}
