import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
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
        configured: !!process.env.AIRTABLE_PAT && !!process.env.AIRTABLE_BASE_ID,
        status: !!process.env.AIRTABLE_PAT && !!process.env.AIRTABLE_BASE_ID ? 'healthy' : 'offline',
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
        configured: !!process.env.CHERRY_WEBHOOK_SECRET,
        status: process.env.CHERRY_WEBHOOK_SECRET ? 'healthy' : 'offline',
      },
      {
        id: 'stripe',
        name: 'Stripe',
        configured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
        status: process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET ? 'healthy' : 'offline',
      },
      {
        id: 'email',
        name: 'Resend',
        configured: !!process.env.RESEND_API_KEY,
        status: process.env.RESEND_API_KEY ? 'healthy' : 'offline',
      },
      {
        id: 'n8n',
        name: 'n8n',
        configured: !!process.env.N8N_WEBHOOK_URL,
        status: process.env.N8N_WEBHOOK_URL ? 'healthy' : 'offline',
      },
    ],
    priorityActions: [
      ...mangomint.issues.slice(0, 2),
      'Keep booking, rebooking, and provider-fill decisions anchored to Mangomint schedule truth.',
    ],
  });
}
