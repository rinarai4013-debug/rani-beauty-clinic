import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { analyzeMetaAds, type MetaAdsInput } from '@/lib/ads/meta-ads-manager';

/**
 * GET /api/dashboard/meta-ads/optimize
 *
 * Returns AI-powered ad optimization recommendations.
 * Engine: src/lib/ads/meta-ads-manager.ts — analyzeMetaAds()
 * Agent: Meta Commander
 *
 * Fetches campaign data from Meta Marketing API, then runs through
 * the optimization engine for grading, fatigue detection, budget
 * recommendations, and ad copy variants.
 *
 * Requires: META_ACCESS_TOKEN, META_AD_ACCOUNT_ID env vars
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'meta-ads-optimize';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      // Meta not configured — run engine with empty input for structural recommendations
      const fallbackInput: MetaAdsInput = {
        campaigns: [],
        adSets: [],
        ads: [],
        monthlyBudget: 3000,
        targetCPA: 50,
        targetROAS: 3.0,
        services: [],
      };

      const intelligence = analyzeMetaAds(fallbackInput);

      return NextResponse.json({
        success: true,
        data: intelligence,
        configured: false,
        message: 'Meta Ads not configured. Showing structural recommendations only.',
        generatedAt: new Date().toISOString(),
      });
    }

    // Fetch campaign data from Meta Marketing API
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const until = new Date().toISOString().split('T')[0];

    const [campaignRes, adSetRes, adRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,objective,budget_remaining,daily_budget,lifetime_budget,start_time,stop_time,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,reach,actions,cost_per_action_type,ctr,cpc,frequency}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
      fetch(
        `https://graph.facebook.com/v19.0/${adAccountId}/adsets?fields=id,name,status,campaign_id,targeting,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,cost_per_action_type}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
      fetch(
        `https://graph.facebook.com/v19.0/${adAccountId}/ads?fields=id,name,status,adset_id,creative,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,ctr,frequency}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
    ]);

    // Parse API responses gracefully — don't fail on partial data
    const campaignData = campaignRes.ok ? await campaignRes.json() : { data: [] };
    const adSetData = adSetRes.ok ? await adSetRes.json() : { data: [] };
    const adData = adRes.ok ? await adRes.json() : { data: [] };

    // Transform Meta API format → engine input format
    const campaigns = (campaignData.data || []).map((c: Record<string, unknown>) => {
      const insights = (c.insights as { data?: Record<string, unknown>[] })?.data?.[0] || {};
      return {
        id: c.id as string,
        name: c.name as string,
        status: mapMetaStatus(c.status as string),
        objective: mapMetaObjective(c.objective as string),
        budget: Number(c.daily_budget || c.lifetime_budget || 0) / 100,
        spent: Number(insights.spend || 0),
        startDate: (c.start_time as string || '').split('T')[0],
        endDate: c.stop_time ? (c.stop_time as string).split('T')[0] : undefined,
      };
    });

    const adSets = (adSetData.data || []).map((as: Record<string, unknown>) => {
      const insights = (as.insights as { data?: Record<string, unknown>[] })?.data?.[0] || {};
      return {
        id: as.id as string,
        name: as.name as string,
        campaignId: as.campaign_id as string,
        status: mapMetaStatus(as.status as string),
        spent: Number(insights.spend || 0),
        impressions: Number(insights.impressions || 0),
        clicks: Number(insights.clicks || 0),
        leads: extractActionCount(insights.actions, 'lead'),
        conversions: extractActionCount(insights.actions, 'offsite_conversion'),
        audience: 'auto',
      };
    });

    const ads = (adData.data || []).map((ad: Record<string, unknown>) => {
      const insights = (ad.insights as { data?: Record<string, unknown>[] })?.data?.[0] || {};
      return {
        id: ad.id as string,
        name: ad.name as string,
        adSetId: ad.adset_id as string,
        status: mapMetaStatus(ad.status as string),
        spent: Number(insights.spend || 0),
        impressions: Number(insights.impressions || 0),
        clicks: Number(insights.clicks || 0),
        ctr: Number(insights.ctr || 0),
        frequency: Number(insights.frequency || 0),
        creative: typeof ad.creative === 'object' ? 'image' : 'unknown',
        daysRunning: 14,
      };
    });

    const metaAdsInput: MetaAdsInput = {
      campaigns,
      adSets,
      ads,
      monthlyBudget: 3000,
      targetCPA: 50,
      targetROAS: 3.0,
      services: [],
    };

    const intelligence = analyzeMetaAds(metaAdsInput);

    const result = {
      success: true,
      data: intelligence,
      configured: true,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.SLOW);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Meta Ads optimization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Meta Ads optimization' },
      { status: 500 }
    );
  }
}

function mapMetaStatus(s: string): 'active' | 'paused' | 'completed' {
  if (s === 'ACTIVE') return 'active';
  if (s === 'PAUSED') return 'paused';
  return 'completed';
}

function mapMetaObjective(o: string): 'leads' | 'conversions' | 'traffic' | 'awareness' | 'engagement' {
  if (o?.includes('LEAD')) return 'leads';
  if (o?.includes('CONVERSION')) return 'conversions';
  if (o?.includes('TRAFFIC') || o?.includes('LINK_CLICKS')) return 'traffic';
  if (o?.includes('AWARENESS') || o?.includes('REACH')) return 'awareness';
  return 'engagement';
}

function extractActionCount(actions: unknown, type: string): number {
  if (!Array.isArray(actions)) return 0;
  const match = actions.find((a: { action_type?: string }) => a.action_type === type);
  return match ? Number(match.value || 0) : 0;
}
