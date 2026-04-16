/**
 * GET /api/dashboard/metabolic-funnel
 *
 * Returns aggregate metabolic protocol funnel metrics: submitted → eligible / held /
 * ineligible / completed / unknown, broken down by track.
 *
 * Auth: view_revenue permission (ceo, provider, marketing, operations).
 * Query params:
 *   ?since=YYYY-MM-DD  Optional ISO date — delegated to Airtable CREATED_TIME() filter.
 *                       Invalid format → 400. Absent → all records.
 *
 * SAFETY: Output contains only aggregate counts + Airtable record IDs. No PII.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { withSentry } from '@/lib/sentry-utils';
import { computeMetabolicFunnel } from '@/lib/analytics/metabolic-funnel-report';
import type { MetabolicFunnelRecord } from '@/lib/analytics/metabolic-funnel-report';

// ── Validation ────────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  return withSentry('dashboard/metabolic-funnel', async () => {
    // 401 — unauthenticated
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 403 — authenticated but insufficient role
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since = new URL(request.url).searchParams.get('since');

    // 400 — malformed date
    if (since !== null && !ISO_DATE_RE.test(since)) {
      return NextResponse.json(
        { error: 'Invalid since parameter. Expected YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    try {
      // Fetch only the two fields needed for funnel computation.
      // Since filter is delegated to Airtable CREATED_TIME() — no client-side date math.
      // skipTestFilter=true: Client Intakes has no {Is Test} field.
      const rawRecords = await fetchAll<{
        'Intake Summary (AI)'?: string;
        'Processing Status'?: string;
      }>(
        Tables.intakes(),
        {
          fields: ['Intake Summary (AI)', 'Processing Status'],
          ...(since ? { filterByFormula: `IS_AFTER(CREATED_TIME(), '${since}')` } : {}),
        },
        true,
      );

      const records: MetabolicFunnelRecord[] = rawRecords.map(r => ({
        id: r.id,
        intakeSummary: r.fields['Intake Summary (AI)'] ?? '',
        processingStatus: r.fields['Processing Status'] ?? '',
      }));

      const report = computeMetabolicFunnel(records, since);
      return NextResponse.json(report);
    } catch (error) {
      console.error(
        '[API] /api/dashboard/metabolic-funnel error:',
        error instanceof Error ? error.message : 'unknown',
      );
      return NextResponse.json({ error: 'Failed to compute funnel report' }, { status: 500 });
    }
  });
}
