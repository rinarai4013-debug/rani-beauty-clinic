import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

// Actual fields in the live Airtable Clients table
interface ClientFields {
  'Client': string;
  'Email': string;
  'Phone': string;
  'Preferred Contact': string;
  'Status': string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const cacheKey = statusFilter ? `clients-${statusFilter}` : 'clients';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const filterOptions = statusFilter
      ? { filterByFormula: `{Status} = '${statusFilter}'` }
      : undefined;

    // Clients table has no "Is Test" field — pass skipTestFilter=true
    const records = await fetchAll<ClientFields>(Tables.clients(), filterOptions, true);

    const clients = records.map((r) => {
      const fullName = r.fields['Client'] || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: r.id,
        firstName,
        lastName,
        name: fullName,
        email: r.fields['Email'] || '',
        phone: r.fields['Phone'] || '',
        status: r.fields['Status'] || '',
        source: '',
        ltv: 0,
        visitCount: 0,
        lastVisitDate: '',
        membershipTier: '',
        createdDate: '',
      };
    });

    const data = { clients, total: clients.length };
    cache.set(cacheKey, data, TTL.RELAXED);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
