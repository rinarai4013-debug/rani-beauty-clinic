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
    if (!hasPermission(session.role, 'entry_room_issue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 });
    }
    if (!body.issue) {
      return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
    }
    if (!body.severity) {
      return NextResponse.json({ error: 'Severity is required' }, { status: 400 });
    }

    const recordId = await createRecord(Tables.alerts(), {
      'Type': 'System Error',
      'Severity': body.severity === 'high' ? 'CRITICAL' : body.severity === 'medium' ? 'WARNING' : 'INFO',
      'Message': `[Room ${body.room}] ${body.issue}`,
      'Action Recommended': body.action || 'Inspect and resolve',
      'Status': 'Active',
      'Created Date': new Date().toISOString(),
    });

    cache.invalidate('alerts');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error reporting room issue:', error);
    return NextResponse.json({ error: 'Failed to report room issue' }, { status: 500 });
  }
}
