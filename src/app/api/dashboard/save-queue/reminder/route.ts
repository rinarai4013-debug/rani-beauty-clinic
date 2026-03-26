import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

/**
 * POST /api/dashboard/save-queue/reminder
 *
 * Triggers an SMS reminder via n8n webhook for a high-risk appointment.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_schedule')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentId, clientName, service, time, provider, riskScore } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.warn('N8N_WEBHOOK_URL not configured - skipping webhook');
      return NextResponse.json({ success: true, message: 'Reminder logged (webhook not configured)' });
    }

    // Trigger n8n webhook for SMS reminder
    const webhookPayload = {
      type: 'save_queue_reminder',
      appointmentId,
      clientName,
      service,
      time,
      provider,
      riskScore,
      triggeredBy: session.displayName || session.username,
      triggeredAt: new Date().toISOString(),
    };

    await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    }).catch(err => {
      console.error('n8n webhook call failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Reminder triggered for ${clientName}`,
    });
  } catch (error) {
    console.error('Save queue reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
