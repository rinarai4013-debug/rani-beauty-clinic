import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/dashboard/alerts
 *
 * Returns active alerts from the Airtable Alerts table.
 * Agent: All agents — feeds the cross-agent alert system.
 *
 * The Alerts table stores operational alerts written by:
 * - Entry forms (inventory adjustments, room issues, etc.)
 * - n8n workflows (W12 Alert Engine)
 * - Cron jobs (daily-kpi threshold checks)
 */

interface AlertFields {
  'Type': string;
  'Severity': string;
  'Message': string;
  'Action Recommended': string;
  'Status': string;
  'Created Date': string;
  'Acknowledged By': string;
  'Acknowledged Date': string;
}

export async function GET() {
  return withSentry('dashboard/alerts', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_executive')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const cacheKey = 'active-alerts';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const records = await fetchAll<AlertFields>(Tables.alerts(), {
      filterByFormula: `OR({Status} = 'Active', {Status} = 'New', {Status} = '')`,
      sort: [
        { field: 'Severity', direction: 'asc' },
        { field: 'Created Date', direction: 'desc' },
      ],
    });

    const alerts = records.map(r => ({
      id: r.id,
      type: r.fields['Type'] || 'general',
      severity: normalizeSeverity(r.fields['Severity']),
      message: r.fields['Message'] || '',
      actionRecommended: r.fields['Action Recommended'] || '',
      status: r.fields['Status'] || 'New',
      createdDate: r.fields['Created Date'] || '',
      acknowledgedBy: r.fields['Acknowledged By'] || null,
      acknowledgedDate: r.fields['Acknowledged Date'] || null,
    }));

    const bySeverity = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    };

    const result = {
      success: true,
      data: {
        total: alerts.length,
        bySeverity,
        alerts,
      },
      generatedAt: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.REALTIME);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Alerts fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }
  });
}

function normalizeSeverity(raw: string | undefined): 'critical' | 'high' | 'medium' | 'low' {
  const s = (raw || '').toLowerCase();
  if (s === 'critical' || s === 'urgent') return 'critical';
  if (s === 'high' || s === 'warning') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
}
