import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getAllCampaigns, createCampaign, getCampaignTypeDefaults } from '@/lib/communications';

export async function GET() {
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
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, type, channel } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    const defaults = getCampaignTypeDefaults(type);
    const campaign = createCampaign({
      name,
      type,
      channel: channel || 'email',
      ...defaults,
      ...body,
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
}
