import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, updateRecord, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'entry_consult_notes')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.outcome) {
      return NextResponse.json({ error: 'Outcome is required' }, { status: 400 });
    }

    // If appointmentId provided, update the appointment directly
    if (body.appointmentId) {
      await updateRecord(Tables.appointments(), body.appointmentId, {
        'Consult Outcome': body.outcome,
        'Amount Quoted': body.amountQuoted || 0,
      });
      cache.invalidate('schedule-today');
      cache.invalidate('kpis');
      return NextResponse.json({ success: true, recordId: body.appointmentId });
    }

    // Otherwise create a consult log entry in Alerts
    const clientName = body.clientName || 'Unknown';
    const consultType = body.consultType || 'initial';
    const plan = body.planPresented || '';
    const objections = body.objections || '';
    const followUp = body.followUpDate ? ` | Follow-up: ${body.followUpDate}` : '';

    const recordId = await createRecord(Tables.alerts(), {
      'Type': 'Custom',
      'Severity': body.outcome === 'booked_package' ? 'INFO' : 'WARNING',
      'Message': `[Consult - ${clientName}] ${consultType} | Outcome: ${body.outcome} | Plan: ${plan}${objections ? ` | Objections: ${objections}` : ''}${followUp}`,
      'Action Recommended': body.notes || '',
      'Status': 'Active',
      'Created Date': new Date().toISOString(),
    });

    cache.invalidate('alerts');
    cache.invalidate('kpis');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error updating consult notes:', error);
    return NextResponse.json({ error: 'Failed to update consult notes' }, { status: 500 });
  }
}
