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
    if (!hasPermission(session.role, 'entry_eod_recap')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.recap) {
      return NextResponse.json({ error: 'Recap is required' }, { status: 400 });
    }
    if (!body.highlights) {
      return NextResponse.json({ error: 'Highlights are required' }, { status: 400 });
    }
    if (body.issues === undefined || body.issues === null) {
      return NextResponse.json({ error: 'Issues field is required' }, { status: 400 });
    }

    const recordId = await createRecord(Tables.alerts(), {
      'Type': 'Custom',
      'Severity': 'INFO',
      'Message': `[EOD Recap] ${body.recap}`,
      'Action Recommended': body.issues ? `Issues: ${body.issues}` : '',
      'Status': 'Active',
      'Created Date': new Date().toISOString(),
    });

    cache.invalidate('alerts');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error creating EOD recap:', error);
    return NextResponse.json({ error: 'Failed to create EOD recap' }, { status: 500 });
  }
}
