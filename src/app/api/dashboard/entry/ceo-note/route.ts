import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'entry_ceo_note')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!body.priority) {
      return NextResponse.json({ error: 'Priority is required' }, { status: 400 });
    }

    const recordId = await createRecord(Tables.alerts(), {
      'Type': 'Custom',
      'Severity': body.priority === 'high' || body.priority === 'urgent' ? 'CRITICAL' : body.priority === 'medium' ? 'WARNING' : 'INFO',
      'Message': `[CEO Note] ${body.message}`,
      'Action Recommended': body.action || '',
      'Status': 'Active',
      'Created Date': new Date().toISOString(),
    });

    cache.invalidate('alerts');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error creating CEO note:', error);
    return NextResponse.json({ error: 'Failed to create CEO note' }, { status: 500 });
  }
}
