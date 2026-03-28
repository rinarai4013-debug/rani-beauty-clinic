/**
 * API Route: /api/booking/reminders
 *
 * GET - Get due reminders for processing
 * POST - Process and send reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { processDueReminders, generateRebookingNudges } from '@/lib/booking/reminders';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'due';

    if (type === 'rebooking') {
      // TODO: Load completed and upcoming appointments from Airtable
      const nudges = generateRebookingNudges([], []);
      return NextResponse.json({ nudges });
    }

    // TODO: Load reminder configs and appointments from Airtable
    const dueReminders = processDueReminders([], []);
    return NextResponse.json({ reminders: dueReminders });
  } catch (error) {
    console.error('Reminders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId, action } = body;

    if (!reminderId) {
      return NextResponse.json({ error: 'reminderId is required' }, { status: 400 });
    }

    // TODO: Process reminder — send via Resend (email) or Twilio (SMS) via n8n webhook
    // TODO: Update reminder status in Airtable

    return NextResponse.json({
      success: true,
      reminderId,
      action: action ?? 'sent',
    });
  } catch (error) {
    console.error('Reminders POST error:', error);
    return NextResponse.json({ error: 'Failed to process reminder' }, { status: 500 });
  }
}
