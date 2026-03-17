import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

/**
 * GET /api/dashboard/clients/at-risk
 *
 * Returns clients who are lapsing or at risk of churning,
 * based on their Airtable Status field (Lapsed 30/60/90, Churned).
 * Simple and fast — doesn't run full churn engine per client.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'clients-at-risk';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch clients with at-risk statuses
    const records = await fetchAll<{
      Client: string;
      Email: string;
      Phone: string;
      Status: string;
    }>(Tables.clients(), {
      filterByFormula: `OR({Status} = 'Lapsed 30', {Status} = 'Lapsed 60', {Status} = 'Lapsed 90', {Status} = 'Churned')`,
    }, true);

    const atRiskClients = records.map(r => {
      const status = r.fields['Status'] || '';
      const urgency: 'critical' | 'high' | 'medium' | 'low' = status === 'Churned' ? 'critical'
        : status === 'Lapsed 90' ? 'high'
        : status === 'Lapsed 60' ? 'medium'
        : 'low';

      return {
        id: r.id,
        name: r.fields['Client'] || '',
        email: r.fields['Email'] || '',
        phone: r.fields['Phone'] || '',
        status,
        urgency,
      };
    });

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    atRiskClients.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    const data = {
      clients: atRiskClients,
      total: atRiskClients.length,
      breakdown: {
        lapsed30: atRiskClients.filter(c => c.status === 'Lapsed 30').length,
        lapsed60: atRiskClients.filter(c => c.status === 'Lapsed 60').length,
        lapsed90: atRiskClients.filter(c => c.status === 'Lapsed 90').length,
        churned: atRiskClients.filter(c => c.status === 'Churned').length,
      },
    };

    cache.set(cacheKey, data, TTL.RELAXED);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching at-risk clients:', error);
    return NextResponse.json({ error: 'Failed to fetch at-risk clients' }, { status: 500 });
  }
}
