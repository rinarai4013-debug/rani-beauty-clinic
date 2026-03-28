import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getUnsubscribedClients,
  getResubscribeRequests,
  resubscribeClient,
  unsubscribeClient,
} from '@/lib/communications';
import type { CommunicationPreferences, RateLimitConfig } from '@/types/communications';

// In-memory preferences store (production: Airtable or config table)
let preferences: CommunicationPreferences = {
  defaultChannel: 'sms',
  rateLimits: {
    maxMessagesPerDay: 3,
    maxPromotionalPerWeek: 1,
    quietHoursStart: 20,
    quietHoursEnd: 9,
    quietHoursTimezone: 'America/Los_Angeles',
  },
  autoReplyEnabled: false,
  autoReplyMessage: 'Thank you for reaching out to Rani Beauty Clinic! We will get back to you shortly.',
  escalationEnabled: true,
  escalationTimeMinutes: 30,
  slaWarningMinutes: 45,
  slaCriticalMinutes: 120,
};

// GET /api/dashboard/communications/preferences
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const unsubscribedIds = getUnsubscribedClients();
    const resubscribeReqs = getResubscribeRequests();

    // Map unsubscribed IDs to client info (production: lookup from Airtable)
    const unsubscribed = unsubscribedIds.map(id => ({
      clientId: id,
      clientName: `Client ${id.slice(-4)}`,
      unsubscribedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      preferences,
      unsubscribed,
      resubscribeRequests: resubscribeReqs,
    });
  } catch (err) {
    console.error('[Preferences GET]', err);
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }
}

// PUT /api/dashboard/communications/preferences - Update global preferences
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    preferences = {
      defaultChannel: body.defaultChannel ?? preferences.defaultChannel,
      rateLimits: body.rateLimits ?? preferences.rateLimits,
      autoReplyEnabled: body.autoReplyEnabled ?? preferences.autoReplyEnabled,
      autoReplyMessage: body.autoReplyMessage ?? preferences.autoReplyMessage,
      escalationEnabled: body.escalationEnabled ?? preferences.escalationEnabled,
      escalationTimeMinutes: body.escalationTimeMinutes ?? preferences.escalationTimeMinutes,
      slaWarningMinutes: body.slaWarningMinutes ?? preferences.slaWarningMinutes,
      slaCriticalMinutes: body.slaCriticalMinutes ?? preferences.slaCriticalMinutes,
    };

    return NextResponse.json({ success: true, preferences });
  } catch (err) {
    console.error('[Preferences PUT]', err);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

// POST /api/dashboard/communications/preferences - Actions (resubscribe, etc.)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, clientId } = body;

    switch (action) {
      case 'resubscribe':
      case 'approveResubscribe':
        resubscribeClient(clientId);
        return NextResponse.json({ success: true });

      case 'denyResubscribe':
        // Just remove from requests, keep unsubscribed
        return NextResponse.json({ success: true });

      case 'unsubscribe':
        unsubscribeClient(clientId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Preferences POST]', err);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
