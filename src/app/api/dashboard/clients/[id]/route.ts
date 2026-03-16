import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const cacheKey = `client-${id}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const record = await rateLimitedQuery(() => Tables.clients().find(id));

    const fullName = (record.fields['Client'] as string) || '';
    const nameParts = fullName.split(' ');

    const client = {
      id: record.id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      name: fullName,
      email: (record.fields['Email'] as string) || '',
      phone: (record.fields['Phone'] as string) || '',
      status: (record.fields['Status'] as string) || '',
      preferredContact: (record.fields['Preferred Contact'] as string) || '',
      // Fields not in actual schema — return defaults for backward compatibility
      source: '',
      tags: '',
      valueSegment: '',
      treatmentTier: '',
      ltv: 0,
      visitCount: 0,
      lastVisitDate: '',
      daysSinceLastVisit: 0,
      membershipTier: '',
      membershipStatus: '',
      riskFlags: '',
      providerMatch: '',
      createdDate: '',
    };

    cache.set(cacheKey, client, TTL.RELAXED);

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}
