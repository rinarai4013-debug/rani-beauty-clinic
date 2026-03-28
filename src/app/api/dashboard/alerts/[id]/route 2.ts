import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, updateRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

interface AlertUpdateFields {
  'Status': string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'dismiss_alerts')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['dismissed', 'acknowledged'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "dismissed" or "acknowledged".' },
        { status: 400 }
      );
    }

    await updateRecord<AlertUpdateFields>(Tables.alerts(), id, {
      'Status': status,
    });

    // Invalidate alerts cache so next fetch reflects the update
    cache.invalidate('alerts');
    // Also invalidate KPIs cache since it includes alerts
    cache.invalidate('kpis');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
