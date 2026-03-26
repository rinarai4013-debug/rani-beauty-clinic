import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getMessageRouter } from '@/lib/communications';
import type { SendMessageRequest, ClientPreferences, BatchSendRequest } from '@/types/communications';

// POST /api/dashboard/communications/send - Send single or batch messages
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const router = getMessageRouter();

    // Batch send
    if (body.batch && Array.isArray(body.clientIds)) {
      const batchRequest: BatchSendRequest = {
        clientIds: body.clientIds,
        templateId: body.templateId,
        subject: body.subject,
        body: body.body,
        variables: body.variables,
        channel: body.channel,
        isPromotional: body.isPromotional ?? false,
        campaignId: body.campaignId,
      };

      // In production, fetch preferences from Airtable
      const preferencesMap = new Map<string, ClientPreferences>();
      // Placeholder: build from request or database
      for (const clientId of body.clientIds) {
        preferencesMap.set(clientId, {
          clientId,
          clientName: 'Client',
          email: null,
          phone: null,
          smsOptIn: true,
          emailOptIn: true,
          preferredChannel: 'sms',
          messagesToday: 0,
          promotionalThisWeek: 0,
        });
      }

      const result = await router.sendBatch(batchRequest, preferencesMap);
      return NextResponse.json({ success: true, result });
    }

    // Single send
    const sendRequest: SendMessageRequest = {
      clientId: body.clientId,
      channel: body.channel,
      templateId: body.templateId,
      subject: body.subject,
      body: body.body,
      variables: body.variables,
      isPromotional: body.isPromotional ?? false,
      scheduledAt: body.scheduledAt,
      campaignId: body.campaignId,
    };

    // In production, fetch client preferences from Airtable
    const preferences: ClientPreferences = {
      clientId: body.clientId,
      clientName: body.clientName ?? 'Client',
      email: body.email ?? null,
      phone: body.phone ?? null,
      smsOptIn: true,
      emailOptIn: true,
      preferredChannel: body.channel ?? 'sms',
      messagesToday: 0,
      promotionalThisWeek: 0,
    };

    const result = await router.sendMessage(sendRequest, preferences);
    return NextResponse.json({ success: result.success, result });
  } catch (err) {
    console.error('[Send POST]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
