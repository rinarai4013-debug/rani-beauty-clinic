import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { env } from '@/lib/env';
import { getMangomintHealth } from '@/lib/dashboard/mangomint-intelligence';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const mangomint = await getMangomintHealth();

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    integrations: [
      {
        id: 'airtable',
        name: 'Airtable',
        configured: !!env.AIRTABLE_PAT && !!env.AIRTABLE_BASE_ID,
        status: !!env.AIRTABLE_PAT && !!env.AIRTABLE_BASE_ID ? 'healthy' : 'offline',
      },
      {
        id: 'mangomint',
        name: 'Mangomint',
        configured: mangomint.configured,
        status: mangomint.lastSyncStatus,
        metadata: {
          todayBookingCount: mangomint.todayBookingCount,
          serviceCount: mangomint.serviceCount,
          webhookConfigured: mangomint.webhookConfigured,
          syncMode: mangomint.syncMode,
        },
      },
      {
        id: 'cherry',
        name: 'Cherry',
        configured: !!env.CHERRY_WEBHOOK_SECRET,
        status: env.CHERRY_WEBHOOK_SECRET ? 'healthy' : 'offline',
      },
      {
        id: 'stripe',
        name: 'Stripe',
        configured: !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET,
        status: env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET ? 'healthy' : 'offline',
      },
      {
        id: 'email',
        name: 'Resend',
        configured: !!env.RESEND_API_KEY,
        status: env.RESEND_API_KEY ? 'healthy' : 'offline',
      },
      {
        id: 'n8n',
        name: 'n8n',
        configured: !!env.N8N_WEBHOOK_URL,
        status: env.N8N_WEBHOOK_URL ? 'healthy' : 'offline',
      },
    ],
    priorityActions: [
      ...mangomint.issues.slice(0, 2),
      'Keep booking, rebooking, and provider-fill decisions anchored to Mangomint schedule truth.',
    ],
  });
}
