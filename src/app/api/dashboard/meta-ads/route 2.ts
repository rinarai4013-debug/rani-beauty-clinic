import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  roas: number;
  ctr: number;
  cpc: number;
}

interface MetaAdsData {
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCPA: number;
    avgROAS: number;
    avgCTR: number;
  };
  campaigns: MetaCampaign[];
  dateRange: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'meta-ads';
  const cached = cache.get<MetaAdsData>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return NextResponse.json({
      error: 'Meta Ads not configured',
      message: 'Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID environment variables',
      summary: null,
      campaigns: [],
    });
  }

  try {
    // Fetch campaign insights from Meta Marketing API
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const until = new Date().toISOString().split('T')[0];

    const url = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,cost_per_action_type,action_values}&access_token=${accessToken}`;

    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      console.error('Meta API error:', err);
      return NextResponse.json({ error: 'Meta API error', details: err.error?.message }, { status: 502 });
    }

    const json = await res.json();

    const campaigns: MetaCampaign[] = (json.data || [])
      .filter((c: Record<string, unknown>) => c.insights)
      .map((c: Record<string, unknown>) => {
        const insights = (c.insights as Record<string, unknown[]>)?.data?.[0] as Record<string, unknown> | undefined;
        if (!insights) return null;

        const spend = parseFloat(insights.spend as string) || 0;
        const impressions = parseInt(insights.impressions as string) || 0;
        const clicks = parseInt(insights.clicks as string) || 0;

        // Extract conversions (leads, purchases) from actions
        const actions = (insights.actions as Array<{ action_type: string; value: string }>) || [];
        const leadAction = actions.find(a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead');
        const conversions = parseInt(leadAction?.value || '0');

        // Extract revenue from action_values
        const actionValues = (insights.action_values as Array<{ action_type: string; value: string }>) || [];
        const revenueAction = actionValues.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase');
        const revenue = parseFloat(revenueAction?.value || '0');

        const cpa = conversions > 0 ? spend / conversions : 0;
        const roas = spend > 0 ? revenue / spend : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;

        return {
          id: c.id as string,
          name: c.name as string,
          status: c.status as string,
          spend: Math.round(spend * 100) / 100,
          impressions,
          clicks,
          conversions,
          cpa: Math.round(cpa * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          ctr: Math.round(ctr * 100) / 100,
          cpc: Math.round(cpc * 100) / 100,
        };
      })
      .filter(Boolean) as MetaCampaign[];

    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    const data: MetaAdsData = {
      summary: {
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        totalConversions,
        avgCPA: totalConversions > 0 ? Math.round((totalSpend / totalConversions) * 100) / 100 : 0,
        avgROAS: campaigns.length > 0 ? Math.round((campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length) * 100) / 100 : 0,
        avgCTR: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      },
      campaigns: campaigns.sort((a, b) => b.spend - a.spend),
      dateRange: `${since} to ${until}`,
    };

    cache.set(cacheKey, data, TTL.RELAXED);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Meta Ads fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch Meta Ads data' }, { status: 500 });
  }
}
