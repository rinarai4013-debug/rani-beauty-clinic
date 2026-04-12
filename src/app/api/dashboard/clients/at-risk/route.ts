import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import { withSentry } from '@/lib/sentry-utils';

const urgencyMap: Record<string, 'critical' | 'medium' | 'low'> = {
  Churned: 'critical',
  'Lapsed 90': 'medium',
  'Lapsed 60': 'medium',
  'Lapsed 30': 'low',
};

export async function GET(request: NextRequest) {
  return withSentry('dashboard/clients/at-risk', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'clients-at-risk';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const clients = await fetchAll<{ Client?: string; Email?: string; Phone?: string; Status?: string }>(
        Tables.clients(),
        undefined,
        true
      );

      const filtered = clients
        .filter((record) => ['Lapsed 30', 'Lapsed 60', 'Lapsed 90', 'Churned'].includes(record.fields.Status ?? ''))
        .map((record) => ({
          id: record.id,
          name: record.fields.Client ?? '',
          email: record.fields.Email ?? '',
          phone: record.fields.Phone ?? '',
          status: record.fields.Status ?? '',
          urgency: urgencyMap[record.fields.Status ?? ''] ?? 'low',
        }))
        .sort((left, right) => {
          const order = { critical: 0, medium: 1, low: 2 };
          return order[left.urgency] - order[right.urgency];
        });

      const payload = {
        clients: filtered,
        total: filtered.length,
        breakdown: filtered.reduce<Record<string, number>>((acc, client) => {
          const key =
            client.status === 'Lapsed 30' ? 'lapsed30' :
            client.status === 'Lapsed 60' ? 'lapsed60' :
            client.status === 'Lapsed 90' ? 'lapsed90' :
            client.status === 'Churned' ? 'churned' :
            client.status;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
      };

      cache.set(cacheKey, payload, TTL.STANDARD);

      // HIPAA §164.312(b): log the at-risk list view as an aggregate
      // event. The at-risk list exposes names, emails, phones, and
      // lapse status for every churned/lapsed client — sensitive enough
      // to track even without individual per-record entries.
      logPhiAccessFromRequest(request, session, {
        patientId: '__LIST__',
        patientName: `At-risk client list (${payload.total} records)`,
        action: 'view',
        dataCategory: 'demographics',
        details: `Lapsed30=${payload.breakdown.lapsed30 ?? 0} Lapsed60=${payload.breakdown.lapsed60 ?? 0} Lapsed90=${payload.breakdown.lapsed90 ?? 0} Churned=${payload.breakdown.churned ?? 0}`,
      });

      return NextResponse.json(payload);
    } catch (error) {
      console.error('[clients/at-risk]', error);
      return NextResponse.json({ error: 'Failed to load at-risk clients' }, { status: 500 });
    }
  });
}
