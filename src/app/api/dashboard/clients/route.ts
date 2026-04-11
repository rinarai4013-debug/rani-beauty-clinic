import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache, TTL } from '@/lib/cache';

function splitName(name: string) {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const statusFilter = searchParams.get('status');
  const cacheKey = `clients-list:${statusFilter ?? 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);
  const sanitizedStatusFilter = statusFilter ? sanitizeFormulaValue(statusFilter) : null;
  const filterByFormula = sanitizedStatusFilter ? `{Status} = '${sanitizedStatusFilter}'` : undefined;

  try {
    const clients = await fetchAll<{ Client?: string; Email?: string; Phone?: string; Status?: string; 'Preferred Contact'?: string }>(
      Tables.clients(),
      filterByFormula ? { filterByFormula } : undefined,
      true
    );

    const payload = {
      clients: clients.map((record) => {
        const name = record.fields.Client ?? '';
        const { firstName, lastName } = splitName(name);
        return {
          id: record.id,
          name,
          firstName,
          lastName,
          email: record.fields.Email ?? '',
          phone: record.fields.Phone ?? '',
          status: record.fields.Status ?? '',
          preferredContact: record.fields['Preferred Contact'] ?? '',
        };
      }),
      total: clients.length,
    };

    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[clients/list]', error);
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }
}
