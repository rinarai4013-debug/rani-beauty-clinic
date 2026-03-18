import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { analyzeMetaAds, type MetaAdsInput, type Campaign, type AdSet, type Ad } from '@/lib/ads/meta-ads-manager';

// Rani's service ad data (static reference)
const RANI_SERVICE_AD_DATA = [
  { service: 'Botox', avgBookingValue: 400, ltv: 2400, targetAudience: 'Women 25-55', bestPerformingAngle: 'Natural results' },
  { service: 'HydraFacial', avgBookingValue: 275, ltv: 1350, targetAudience: 'Women 22-45', bestPerformingAngle: 'Instant glow' },
  { service: 'GLP-1', avgBookingValue: 499, ltv: 5988, targetAudience: 'Adults 30-60', bestPerformingAngle: 'Medical weight loss' },
  { service: 'Laser Hair Removal', avgBookingValue: 225, ltv: 1800, targetAudience: 'Women 18-45', bestPerformingAngle: 'Summer ready' },
  { service: 'Sofwave', avgBookingValue: 2750, ltv: 5500, targetAudience: 'Women 40-65', bestPerformingAngle: 'Non-surgical facelift' },
  { service: 'RF Microneedling', avgBookingValue: 495, ltv: 2970, targetAudience: 'Women 28-55', bestPerformingAngle: 'Acne scar treatment' },
  { service: 'VI Peel', avgBookingValue: 395, ltv: 1580, targetAudience: 'Women 25-50', bestPerformingAngle: 'Clear, even skin' },
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    let campaigns: Campaign[] = [];
    let adSets: AdSet[] = [];
    let ads: Ad[] = [];
    let metaApiAvailable = false;

    // First try to fetch from Meta API
    if (accessToken && adAccountId) {
      try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const until = new Date().toISOString().split('T')[0];

        // Fetch campaigns
        const campaignsUrl = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,cost_per_action_type,action_values}&access_token=${accessToken}`;
        const campaignsRes = await fetch(campaignsUrl);

        if (campaignsRes.ok) {
          const campaignsJson = await campaignsRes.json();
          metaApiAvailable = true;

          for (const c of (campaignsJson.data || [])) {
            const insights = c.insights?.data?.[0];
            const spent = insights ? parseFloat(insights.spend || '0') : 0;
            const budget = parseFloat(c.daily_budget || c.lifetime_budget || '0') / 100;

            campaigns.push({
              id: c.id,
              name: c.name,
              status: c.status === 'ACTIVE' ? 'active' : c.status === 'PAUSED' ? 'paused' : 'completed',
              objective: mapMetaObjective(c.objective),
              budget: budget || spent * 1.2, // estimate budget from spend if not available
              spent: Math.round(spent * 100) / 100,
              startDate: c.start_time ? c.start_time.split('T')[0] : since,
              endDate: c.stop_time ? c.stop_time.split('T')[0] : undefined,
            });
          }

          // Fetch ad sets
          const adSetsUrl = `https://graph.facebook.com/v19.0/${adAccountId}/adsets?fields=id,campaign_id,name,targeting,daily_budget,lifetime_budget,status,insights.time_range({"since":"${since}","until":"${until}"}){spend}&access_token=${accessToken}`;
          const adSetsRes = await fetch(adSetsUrl);

          if (adSetsRes.ok) {
            const adSetsJson = await adSetsRes.json();
            for (const as of (adSetsJson.data || [])) {
              const insights = as.insights?.data?.[0];
              const spent = insights ? parseFloat(insights.spend || '0') : 0;
              const budget = parseFloat(as.daily_budget || as.lifetime_budget || '0') / 100;
              const targeting = as.targeting || {};

              adSets.push({
                id: as.id,
                campaignId: as.campaign_id,
                name: as.name,
                targeting: {
                  ageMin: targeting.age_min || 25,
                  ageMax: targeting.age_max || 55,
                  genders: targeting.genders?.includes(1) ? ['female'] : ['all'],
                  locations: (targeting.geo_locations?.cities || []).map((loc: { name: string }) => loc.name || 'Renton, WA'),
                  interests: (targeting.flexible_spec?.[0]?.interests || []).map((i: { name: string }) => i.name),
                  radius: targeting.geo_locations?.cities?.[0]?.radius || 15,
                },
                budget: budget || spent * 1.2,
                spent: Math.round(spent * 100) / 100,
                status: as.status === 'ACTIVE' ? 'active' : 'paused',
              });
            }
          }

          // Fetch ads with metrics
          const adsUrl = `https://graph.facebook.com/v19.0/${adAccountId}/ads?fields=id,adset_id,name,creative{title,body,call_to_action_type,object_type},status,created_time,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,reach,clicks,ctr,cpc,actions,cost_per_action_type,action_values,frequency}&access_token=${accessToken}`;
          const adsRes = await fetch(adsUrl);

          if (adsRes.ok) {
            const adsJson = await adsRes.json();
            for (const ad of (adsJson.data || [])) {
              const insights = ad.insights?.data?.[0];
              if (!insights) continue;

              const spent = parseFloat(insights.spend || '0');
              const impressions = parseInt(insights.impressions || '0');
              const reach = parseInt(insights.reach || '0');
              const clicks = parseInt(insights.clicks || '0');
              const ctr = parseFloat(insights.ctr || '0');
              const cpc = parseFloat(insights.cpc || '0');
              const frequency = parseFloat(insights.frequency || '0');

              const actions = insights.actions || [];
              const leadAction = actions.find((a: { action_type: string; value: string }) =>
                a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
              );
              const leads = parseInt(leadAction?.value || '0');
              const conversionAction = actions.find((a: { action_type: string; value: string }) =>
                a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase'
              );
              const conversions = parseInt(conversionAction?.value || leads.toString());

              const actionValues = insights.action_values || [];
              const revenueAction = actionValues.find((a: { action_type: string; value: string }) =>
                a.action_type === 'offsite_conversion.fb_pixel_purchase'
              );
              const revenue = parseFloat(revenueAction?.value || '0');

              const cpl = leads > 0 ? spent / leads : 0;
              const cpa = conversions > 0 ? spent / conversions : 0;
              const roas = spent > 0 ? revenue / spent : 0;

              ads.push({
                id: ad.id,
                adSetId: ad.adset_id,
                name: ad.name,
                type: ad.creative?.object_type === 'VIDEO' ? 'video' : 'image',
                headline: ad.creative?.title || ad.name,
                body: ad.creative?.body || '',
                callToAction: ad.creative?.call_to_action_type || 'Book Now',
                metrics: {
                  impressions,
                  reach,
                  clicks,
                  ctr: Math.round(ctr * 100) / 100,
                  cpc: Math.round(cpc * 100) / 100,
                  leads,
                  cpl: Math.round(cpl * 100) / 100,
                  conversions,
                  cpa: Math.round(cpa * 100) / 100,
                  spent: Math.round(spent * 100) / 100,
                  revenue: Math.round(revenue * 100) / 100,
                  roas: Math.round(roas * 100) / 100,
                  frequency: Math.round(frequency * 100) / 100,
                },
                createdDate: ad.created_time ? ad.created_time.split('T')[0] : since,
                status: ad.status === 'ACTIVE' ? 'active' : 'paused',
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching from Meta API:', err);
        // Fall through to fallback
      }
    }

    // If Meta API not configured or returned no data, return a graceful "not configured" response
    if (!metaApiAvailable || campaigns.length === 0) {
      // Return an analysis with empty campaigns — engine will produce baseline recommendations
      const fallbackInput: MetaAdsInput = {
        campaigns: [],
        adSets: [],
        ads: [],
        monthlyBudget: 5000,
        targetCPA: 100,
        targetROAS: 3.0,
        services: RANI_SERVICE_AD_DATA,
      };

      const result = analyzeMetaAds(fallbackInput);

      return NextResponse.json({
        success: true,
        data: result,
        metaApiConnected: false,
        message: metaApiAvailable
          ? 'Meta API connected but no active campaigns found.'
          : 'Meta Ads API not configured. Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID. Showing baseline recommendations.',
        generatedAt: new Date().toISOString(),
      });
    }

    // Calculate monthly budget from campaign data
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const monthlyBudget = Math.max(totalSpent * 1.1, campaigns.reduce((sum, c) => sum + c.budget, 0));

    const metaAdsInput: MetaAdsInput = {
      campaigns,
      adSets,
      ads,
      monthlyBudget: Math.round(monthlyBudget),
      targetCPA: 100,
      targetROAS: 3.0,
      services: RANI_SERVICE_AD_DATA,
    };

    const result = analyzeMetaAds(metaAdsInput);

    return NextResponse.json({
      success: true,
      data: result,
      metaApiConnected: true,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Meta Ads analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze Meta Ads performance' },
      { status: 500 }
    );
  }
}

/** Map Meta API objective strings to engine format */
function mapMetaObjective(objective: string): 'leads' | 'conversions' | 'traffic' | 'awareness' | 'engagement' {
  const obj = (objective || '').toUpperCase();
  if (obj.includes('LEAD') || obj.includes('LEAD_GENERATION')) return 'leads';
  if (obj.includes('CONVERSIONS') || obj.includes('OUTCOME_SALES')) return 'conversions';
  if (obj.includes('TRAFFIC') || obj.includes('LINK_CLICKS')) return 'traffic';
  if (obj.includes('AWARENESS') || obj.includes('REACH') || obj.includes('BRAND')) return 'awareness';
  if (obj.includes('ENGAGEMENT') || obj.includes('POST_ENGAGEMENT')) return 'engagement';
  return 'leads'; // default
}
