import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

const urgencyMap: Record<string, 'critical' | 'medium' | 'low'> = {
  Churned: 'critical',
  'Lapsed 90': 'medium',
  'Lapsed 60': 'medium',
  'Lapsed 30': 'low',
};

export async function GET() {
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
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[clients/at-risk]', error);
    return NextResponse.json({ error: 'Failed to load at-risk clients' }, { status: 500 });
  }
}
