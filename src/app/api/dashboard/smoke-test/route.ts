import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function airtableBaseUrl() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) {
    throw new Error('AIRTABLE_BASE_ID missing');
  }

  return `https://api.airtable.com/v0/${baseId}`;
}

function airtableHeaders() {
  const token = process.env.AIRTABLE_PAT;
  if (!token) {
    throw new Error('AIRTABLE_PAT missing');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function buildSmokeTestUrl(params: Record<string, string | number>) {
  const url = new URL(`${airtableBaseUrl()}/${encodeURIComponent('Smoke Test Runs')}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function parseChecksField(value: unknown) {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const response = await fetch(
      buildSmokeTestUrl({
        maxRecords: 1,
        sort: JSON.stringify([{ field: 'Timestamp', direction: 'desc' }]),
      }),
      { headers: airtableHeaders() }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Airtable read failed', details: payload },
        { status: 502 }
      );
    }

    const record = Array.isArray(payload?.records) ? payload.records[0] : null;
    if (!record) {
      return NextResponse.json({ success: true, run: null, checks: [] }, { status: 200 });
    }

    const fields = (record.fields || {}) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      run: {
        id: record.id,
        runId: fields['Run ID'],
        status: fields.Status,
        timestamp: fields.Timestamp,
        durationMs: fields['Duration ms'],
        triggeredBy: fields['Triggered By'],
        checks: parseChecksField(fields['Checks JSON']),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Smoke test lookup failed' },
      { status: 500 }
    );
  }
}
