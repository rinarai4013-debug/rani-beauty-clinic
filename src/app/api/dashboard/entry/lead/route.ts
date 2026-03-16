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
    if (!hasPermission(session.role, 'entry_lead')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }
    if (!body.phone && !body.email) {
      return NextResponse.json({ error: 'Phone or email is required' }, { status: 400 });
    }

    // Actual Clients table uses "Client" (full name), not separate First/Last fields
    const fullName = `${body.firstName} ${body.lastName}`.trim();

    const fields: Record<string, string> = {
      'Client': fullName,
      'Email': body.email || '',
      'Phone': body.phone || '',
    };
    // Only set Status if a valid option — Airtable may reject new select options
    // Add 'New Lead' as an option in your Airtable Status field for proper lead funnel tracking
    const recordId = await createRecord(Tables.clients(), fields);

    cache.invalidate('leads');
    cache.invalidate('leads-stats');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
