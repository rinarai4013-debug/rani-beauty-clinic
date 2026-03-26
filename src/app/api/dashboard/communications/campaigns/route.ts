import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  createCampaign,
  getAllCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
  updateCampaignStatus,
} from '@/lib/communications';
import type { CampaignStatus } from '@/types/communications';

// GET /api/dashboard/communications/campaigns
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as CampaignStatus | null;
  const id = searchParams.get('id');

  try {
    // Single campaign
    if (id) {
      const campaign = getCampaign(id);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, campaign });
    }

    // All campaigns
    let campaigns = getAllCampaigns();
    if (status) {
      campaigns = campaigns.filter(c => c.status === status);
    }

    return NextResponse.json({ success: true, campaigns });
  } catch (err) {
    console.error('[Campaigns GET]', err);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}

// POST /api/dashboard/communications/campaigns
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Duplicate action
    if (body.action === 'duplicate' && body.campaignId) {
      const duplicated = duplicateCampaign(body.campaignId);
      if (!duplicated) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, campaign: duplicated });
    }

    // Create new campaign
    const campaign = createCampaign({
      name: body.name,
      type: body.type,
      channel: body.channel,
      subject: body.subject,
      body: body.body,
      templateId: body.templateId,
      audienceFilter: body.audienceFilter ?? { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
      audienceSize: body.audienceSize,
      abTest: body.abTest,
      scheduledAt: body.scheduledAt,
      isDrip: body.isDrip,
      dripSteps: body.dripSteps,
      createdBy: session.displayName || 'Staff',
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err) {
    console.error('[Campaigns POST]', err);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

// PATCH /api/dashboard/communications/campaigns
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { campaignId, ...updates } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
    }

    // Status change
    if (updates.status) {
      const updated = updateCampaignStatus(campaignId, updates.status);
      if (!updated) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, campaign: updated });
    }

    const updated = updateCampaign(campaignId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err) {
    console.error('[Campaigns PATCH]', err);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

// DELETE /api/dashboard/communications/campaigns
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
    }

    const deleted = deleteCampaign(campaignId);
    if (!deleted) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Campaigns DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
