import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';

const sendMessageSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(7).optional(),
  channel: z.enum(['sms', 'email']),
  subject: z.string().optional(),
  body: z.string().min(1),
  templateId: z.string().optional(),
  campaignId: z.string().optional(),
  sendMode: z.enum(['queue']).optional().default('queue'),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'entry_lead')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    deliveryMode: 'queue',
    message: 'Outbound messages are queued to Airtable Messages Log for review and manual/live delivery.',
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'entry_lead')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const parsed = sendMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid outbound message payload' }, { status: 400 });
    }

    const payload = parsed.data;
    if (payload.channel === 'sms' && !payload.clientPhone) {
      return NextResponse.json({ error: 'Phone number is required for SMS' }, { status: 400 });
    }
    if (payload.channel === 'email' && !payload.clientEmail) {
      return NextResponse.json({ error: 'Email is required for email delivery' }, { status: 400 });
    }

    const recordId = await createRecord(Tables.messagesLog(), {
      Type: payload.channel,
      Direction: 'Outbound',
      Status: 'Queued',
      Subject: payload.subject || '',
      Message: payload.body,
      Date: new Date().toISOString(),
      'Client Name': payload.clientName,
      'Client Email': payload.clientEmail || '',
      'Client Phone': payload.clientPhone || '',
      'Template ID': payload.templateId || '',
      'Campaign ID': payload.campaignId || '',
      'Queued By': session.displayName,
    });

    return NextResponse.json({
      success: true,
      queued: true,
      recordId,
      deliveryMode: 'queue',
    });
  } catch (error) {
    console.error('[dashboard/communications/send]', error);
    return NextResponse.json({ error: 'Failed to queue outbound message' }, { status: 500 });
  }
}
