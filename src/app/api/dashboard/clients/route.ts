import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache, TTL } from '@/lib/cache';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import { withSentry } from '@/lib/sentry-utils';

function splitName(name: string) {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

export async function GET(request: NextRequest) {
  return withSentry('dashboard/clients', async () => {
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

    try {
      // CRITICAL (codebase audit 2026-04-10): sanitize statusFilter before
      // interpolating into the Airtable filterByFormula string. Without
      // this, a caller could inject `' OR TRUE() OR '` into ?status= and
      // bypass the status filter entirely, leaking every client record.
      // sanitizeFormulaValue escapes quotes and strips formula control chars.
      const clients = await fetchAll<{ Client?: string; Email?: string; Phone?: string; Status?: string; 'Preferred Contact'?: string }>(
        Tables.clients(),
        statusFilter
          ? { filterByFormula: `{Status} = '${sanitizeFormulaValue(statusFilter)}'` }
          : undefined,
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

      // HIPAA §164.312(b): log the list view as a single aggregate event.
      // We deliberately don't create one log entry per returned record —
      // that would generate dozens of entries per page load and pollute
      // the audit stream. The aggregate entry captures scope (count,
      // filter) which is enough for an OCR auditor to reconstruct what
      // the user saw.
      logPhiAccessFromRequest(request, session, {
        patientId: '__LIST__',
        patientName: `Client list (${payload.total} records)`,
        action: 'view',
        dataCategory: 'demographics',
        details: `Clients list view${statusFilter ? `, filter=${statusFilter}` : ''}`,
      });

      return NextResponse.json(payload);
    } catch (error) {
      console.error('[clients/list]', error);
      return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
    }
  });
}
