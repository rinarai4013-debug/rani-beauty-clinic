import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';

interface ClientPreferenceFields {
  'Client': string;
  'Email': string;
  'Phone': string;
  'Preferred Contact': string;
  'Status': string;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = req.nextUrl.searchParams.get('clientId');
  const cacheKey = `comms:preferences:${clientId || 'all'}`;

  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const filter = clientId
      ? `RECORD_ID() = '${clientId}'`
      : '';

    const clients = await fetchAll<ClientPreferenceFields>(
      Tables.clients(),
      {
        filterByFormula: filter,
        fields: ['Client', 'Email', 'Phone', 'Preferred Contact', 'Status'],
      },
      true // skipTestFilter - Clients table has no "Is Test" field
    );

    const preferences = clients.map(c => ({
      id: c.id,
      name: c.fields['Client'],
      email: c.fields['Email'],
      phone: c.fields['Phone'],
      preferredContact: c.fields['Preferred Contact'] || 'email',
      status: c.fields['Status'],
    }));

    const result = {
      preferences: clientId ? preferences[0] || null : preferences,
      total: preferences.length,
      asOf: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.RELAXED);

    // HIPAA §164.312(b): communications preferences expose contact
    // info (email/phone) for a single client (when ?clientId= is
    // passed) or the entire list. Log as a targeted access when
    // individual, aggregate when listing.
    if (clientId && preferences[0]) {
      logPhiAccessFromRequest(req, session, {
        patientId: clientId,
        patientName: preferences[0].name || 'Unknown',
        action: 'view',
        dataCategory: 'demographics',
        details: 'Communications preferences — contact info lookup',
      });
    } else {
      logPhiAccessFromRequest(req, session, {
        patientId: '__LIST__',
        patientName: `Communications preferences list (${preferences.length} clients)`,
        action: 'view',
        dataCategory: 'demographics',
        details: 'Communications preferences list view',
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[dashboard/communications/preferences]', err);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}
