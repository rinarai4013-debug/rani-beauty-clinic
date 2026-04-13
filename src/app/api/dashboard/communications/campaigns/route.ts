import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getAllCampaigns, createCampaign, getCampaignTypeDefaults } from '@/lib/communications';
import { withSentry } from '@/lib/sentry-utils';
import type { MessageChannel } from '@/types/communications';

const CampaignCreateSchema = z.object({
  name: z.string().min(1, 'name is required'),
  type: z.enum(['promotional', 'educational', 'reactivation', 'event', 'seasonal', 'birthday', 'direct']),
  channel: z.enum(['sms', 'email', 'both']).optional(),
  subject: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1).optional(),
});

const DEFAULT_AUDIENCE_FILTER = {
  groups: [],
  logic: 'OR' as const,
  excludeUnsubscribed: true,
  excludeRecentlyContacted: false,
};

export async function GET() {
  return withSentry('dashboard/communications/campaigns:get', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'comms:campaigns';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const campaigns = getAllCampaigns();

      const result = {
        campaigns,
        total: campaigns.length,
        asOf: new Date().toISOString(),
      };

      cache.set(cacheKey, result, TTL.STANDARD);
      return NextResponse.json(result);
    } catch (err) {
      console.error('[dashboard/communications/campaigns]', err);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withSentry('dashboard/communications/campaigns:post', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const parsed = CampaignCreateSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
          { status: 400 }
        );
      }

      const { name, type, channel, subject, body } = parsed.data;
      const defaults = getCampaignTypeDefaults(type);
      const defaultChannel = defaults.defaultChannel as MessageChannel | 'both';
      const campaign = createCampaign({
        name,
        type,
        channel: (channel || defaultChannel) as MessageChannel | 'both',
        subject: subject ?? defaults.suggestedSubject,
        body: body ?? defaults.suggestedBody,
        audienceFilter: DEFAULT_AUDIENCE_FILTER,
        createdBy: session.username,
      });

      cache.invalidatePrefix('comms:campaigns');

      return NextResponse.json({
        success: true,
        campaign,
      });
    } catch (err) {
      console.error('[dashboard/communications/campaigns:POST]', err);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
  });
}
