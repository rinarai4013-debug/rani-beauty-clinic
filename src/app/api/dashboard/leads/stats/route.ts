import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

// Actual fields in the live Airtable Clients table
interface ClientFields {
  'Client': string;
  'Status': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'leads-stats';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Clients table has no "Is Test" or "Created Date" field.
    // Use CREATED_TIME() to filter by record creation date.
    const recentClients = await fetchAll<ClientFields>(Tables.clients(), {
      filterByFormula: `CREATED_TIME() >= DATEADD(TODAY(), -30, 'days')`,
    }, true);

    const newLeads30d = recentClients.length;

    // Conversion rate: clients who became Active out of all new clients in last 30 days
    const convertedClients = recentClients.filter(
      (c) => c.fields['Status'] === 'Active'
    );
    const conversionRate = newLeads30d > 0
      ? Math.round((convertedClients.length / newLeads30d) * 100)
      : 0;

    // Source field doesn't exist in Clients table - return empty sources
    const topSources: { source: string; count: number; rate: number }[] = [];

    const data = {
      newLeads30d,
      conversionRate,
      avgResponseTime: 0,
      topSources,
    };

    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Lead stats route error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead stats' }, { status: 500 });
  }
}
