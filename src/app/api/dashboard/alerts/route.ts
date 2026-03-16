import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import type { AlertItem } from '@/types/dashboard';

interface AlertFields {
  'Type': string;
  'Severity': string;
  'Metric Name': string;
  'Metric Value': number;
  'Threshold Value': number;
  'Message': string;
  'Action Recommended': string;
  'Status': string;
  'Created Date': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'alerts';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const activeAlerts = await fetchAll<AlertFields>(Tables.alerts(), {
      filterByFormula: `{Status} = "active"`,
      sort: [{ field: 'Created Date', direction: 'desc' }],
    });

    const alerts: AlertItem[] = activeAlerts.map((a) => ({
      id: a.id,
      type: (a.fields['Type'] as AlertItem['type']) || 'custom',
      severity: (a.fields['Severity'] as AlertItem['severity']) || 'info',
      message: a.fields['Message'] || '',
      actionRecommended: a.fields['Action Recommended'] || '',
      metricName: a.fields['Metric Name'] || undefined,
      metricValue: a.fields['Metric Value'] || undefined,
      thresholdValue: a.fields['Threshold Value'] || undefined,
      status: 'active' as const,
      createdAt: a.fields['Created Date'] || new Date().toISOString(),
    }));

    const data = { alerts };

    cache.set(cacheKey, data, TTL.REALTIME);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Alerts route error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
