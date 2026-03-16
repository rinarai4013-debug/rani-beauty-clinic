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
    if (!hasPermission(session.role, 'entry_staff_note')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!body.staffName) {
      return NextResponse.json({ error: 'Staff name is required' }, { status: 400 });
    }

    const recordId = await createRecord(Tables.alerts(), {
      'Type': 'Custom',
      'Severity': 'INFO',
      'Message': `[Staff Note - ${body.staffName}] ${body.message}`,
      'Action Recommended': body.action || '',
      'Status': 'Active',
      'Created Date': new Date().toISOString(),
    });

    cache.invalidate('alerts');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error creating staff note:', error);
    return NextResponse.json({ error: 'Failed to create staff note' }, { status: 500 });
  }
}
