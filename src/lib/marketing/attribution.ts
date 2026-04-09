/**
 * Marketing Attribution Engine for Rani Beauty Clinic
 *
 * Multi-touch attribution system supporting 5 models to understand
 * which marketing channels drive conversions. Tracks the full customer
 * journey from first touch to booking/conversion.
 *
 * Attribution Models:
 * 1. First Touch — 100% credit to first interaction
 * 2. Last Touch — 100% credit to last interaction before conversion
 * 3. Linear — Equal credit across all touchpoints
 * 4. Time Decay — More credit to touchpoints closer to conversion
 * 5. Position-Based (U-shaped) — 40% first, 40% last, 20% spread across middle
 *
 * IMPORTANT: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface Touchpoint {
  id: string;
  timestamp: string; // ISO
  channel: MarketingChannel;
  source: string; // e.g., "google", "facebook", "instagram"
  medium: string; // e.g., "organic", "cpc", "social"
  campaign?: string;
  content?: string;
  term?: string; // search keyword
  landingPage?: string;
  referrer?: string;
}

export type MarketingChannel =
  | 'organic_search'
  | 'paid_search'
  | 'paid_social'
  | 'organic_social'
  | 'referral'
  | 'direct'
  | 'email'
  | 'display'
  | 'affiliate'
  | 'other';

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based';

export interface CustomerJourney {
  leadId: string;
  touchpoints: Touchpoint[];
  convertedAt?: string; // ISO timestamp of conversion
  conversionValue?: number; // revenue from conversion
  converted: boolean;
}

export interface AttributionResult {
  model: AttributionModel;
  channelCredits: ChannelCredit[];
  campaignCredits: CampaignCredit[];
  totalConversions: number;
  totalRevenue: number;
  touchpointBreakdown: TouchpointCredit[];
}

export interface ChannelCredit {
  channel: MarketingChannel;
  conversions: number; // fractional — sum of credit across journeys
  revenue: number; // attributed revenue
  touchpoints: number; // total touchpoints from this channel
  avgPosition: number; // avg position in journey (1 = first)
  conversionRate: number; // conversions / unique leads from channel
  costPerAcquisition?: number;
  roas?: number;
}

export interface CampaignCredit {
  campaign: string;
  channel: MarketingChannel;
  conversions: number;
  revenue: number;
  touchpoints: number;
  spend?: number;
  costPerAcquisition?: number;
  roas?: number;
}

export interface TouchpointCredit {
  touchpoint: Touchpoint;
  credit: number; // 0-1 fractional credit for this touchpoint
  creditRevenue: number;
  position: number; // 1-indexed position in journey
  journeyLength: number;
}

export interface ChannelPerformance {
  channel: MarketingChannel;
  impressions?: number;
  clicks?: number;
  leads: number;
  conversions: number;
  revenue: number;
  spend: number;
  ctr?: number;
  conversionRate: number;
  cpa: number;
  roas: number;
  ltv?: number; // customer lifetime value from this channel
}

export interface AttributionComparison {
  channel: MarketingChannel;
  models: Record<AttributionModel, {
    conversions: number;
    revenue: number;
    share: number; // percentage of total
  }>;
  insight: string;
}

export interface CampaignSpend {
  campaign: string;
  channel: MarketingChannel;
  spend: number;
  startDate: string;
  endDate: string;
}

// ── UTM Parsing ───────────────────────────────────────────────────────────

/**
 * Parse UTM parameters from a URL string.
 */
export function parseUTMParams(url: string): Partial<Touchpoint> {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      content: params.get('utm_content') || undefined,
      term: params.get('utm_term') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Classify a touchpoint into a marketing channel based on source/medium.
 */
export function classifyChannel(source: string, medium: string, referrer?: string): MarketingChannel {
  const src = (source || '').toLowerCase();
  const med = (medium || '').toLowerCase();
  const ref = (referrer || '').toLowerCase();

  // Paid social should win over generic cpc handling for social platforms
  if ((src === 'facebook' || src === 'instagram' || src === 'meta') && (med === 'cpc' || med === 'paid' || med === 'paid_social')) {
    return 'paid_social';
  }

  // Paid search
  if (med === 'cpc' || med === 'ppc' || med === 'paid_search') return 'paid_search';
  if (src === 'google' && med === 'cpc') return 'paid_search';

  // Paid social
  if (med === 'paid_social' || med === 'cpm') return 'paid_social';
  if ((src === 'facebook' || src === 'instagram' || src === 'meta') && (med === 'cpc' || med === 'paid')) {
    return 'paid_social';
  }

  // Organic search
  if (med === 'organic' || med === 'organic_search') return 'organic_search';
  if (['google', 'bing', 'yahoo', 'duckduckgo'].includes(src) && !med) return 'organic_search';
  if (ref.includes('google.com') || ref.includes('bing.com')) return 'organic_search';

  // Organic social
  if (med === 'social' || med === 'organic_social') return 'organic_social';
  if (['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'pinterest'].includes(src)) {
    return 'organic_social';
  }
  if (ref.includes('facebook.com') || ref.includes('instagram.com') || ref.includes('tiktok.com')) {
    return 'organic_social';
  }

  // Email
  if (med === 'email' || src === 'email' || src === 'newsletter') return 'email';

  // Display
  if (med === 'display' || med === 'banner' || med === 'cpm') return 'display';

  // Referral
  if (med === 'referral' || src === 'referral') return 'referral';
  if (ref && !ref.includes('ranibeautyclinic.com')) return 'referral';

  // Affiliate
  if (med === 'affiliate' || src === 'affiliate') return 'affiliate';

  // Direct
  if (src === '(direct)' || src === 'direct' || (!src && !med && !ref)) return 'direct';

  return 'other';
}

// ── Attribution Models ────────────────────────────────────────────────────

/**
 * First Touch: 100% credit to the first touchpoint.
 */
function attributeFirstTouch(journey: CustomerJourney): TouchpointCredit[] {
  if (journey.touchpoints.length === 0) return [];
  const value = journey.conversionValue || 0;

  return journey.touchpoints.map((tp, i) => ({
    touchpoint: tp,
    credit: i === 0 ? 1 : 0,
    creditRevenue: i === 0 ? value : 0,
    position: i + 1,
    journeyLength: journey.touchpoints.length,
  }));
}

/**
 * Last Touch: 100% credit to the last touchpoint before conversion.
 */
function attributeLastTouch(journey: CustomerJourney): TouchpointCredit[] {
  if (journey.touchpoints.length === 0) return [];
  const value = journey.conversionValue || 0;
  const lastIdx = journey.touchpoints.length - 1;

  return journey.touchpoints.map((tp, i) => ({
    touchpoint: tp,
    credit: i === lastIdx ? 1 : 0,
    creditRevenue: i === lastIdx ? value : 0,
    position: i + 1,
    journeyLength: journey.touchpoints.length,
  }));
}

/**
 * Linear: Equal credit across all touchpoints.
 */
function attributeLinear(journey: CustomerJourney): TouchpointCredit[] {
  if (journey.touchpoints.length === 0) return [];
  const value = journey.conversionValue || 0;
  const creditPerTouch = 1 / journey.touchpoints.length;
  const revenuePerTouch = value / journey.touchpoints.length;

  return journey.touchpoints.map((tp, i) => ({
    touchpoint: tp,
    credit: creditPerTouch,
    creditRevenue: revenuePerTouch,
    position: i + 1,
    journeyLength: journey.touchpoints.length,
  }));
}

/**
 * Time Decay: More credit to touchpoints closer to conversion.
 * Uses a 7-day half-life decay function.
 */
function attributeTimeDecay(journey: CustomerJourney): TouchpointCredit[] {
  if (journey.touchpoints.length === 0) return [];
  const value = journey.conversionValue || 0;
  const conversionTime = journey.convertedAt
    ? new Date(journey.convertedAt).getTime()
    : new Date(journey.touchpoints[journey.touchpoints.length - 1].timestamp).getTime();

  const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  // Calculate raw weights based on time decay
  const rawWeights = journey.touchpoints.map(tp => {
    const daysBefore = (conversionTime - new Date(tp.timestamp).getTime()) / halfLife;
    return Math.pow(0.5, daysBefore);
  });

  const totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);

  return journey.touchpoints.map((tp, i) => {
    const credit = totalWeight > 0 ? rawWeights[i] / totalWeight : 0;
    return {
      touchpoint: tp,
      credit,
      creditRevenue: value * credit,
      position: i + 1,
      journeyLength: journey.touchpoints.length,
    };
  });
}

/**
 * Position-Based (U-shaped): 40% first, 40% last, 20% distributed middle.
 */
function attributePositionBased(journey: CustomerJourney): TouchpointCredit[] {
  if (journey.touchpoints.length === 0) return [];
  const value = journey.conversionValue || 0;

  if (journey.touchpoints.length === 1) {
    return [{
      touchpoint: journey.touchpoints[0],
      credit: 1,
      creditRevenue: value,
      position: 1,
      journeyLength: 1,
    }];
  }

  if (journey.touchpoints.length === 2) {
    return journey.touchpoints.map((tp, i) => ({
      touchpoint: tp,
      credit: 0.5,
      creditRevenue: value * 0.5,
      position: i + 1,
      journeyLength: 2,
    }));
  }

  const middleCount = journey.touchpoints.length - 2;
  const middleCredit = 0.20 / middleCount;

  return journey.touchpoints.map((tp, i) => {
    let credit: number;
    if (i === 0) credit = 0.40;
    else if (i === journey.touchpoints.length - 1) credit = 0.40;
    else credit = middleCredit;

    return {
      touchpoint: tp,
      credit,
      creditRevenue: value * credit,
      position: i + 1,
      journeyLength: journey.touchpoints.length,
    };
  });
}

// ── Model Router ──────────────────────────────────────────────────────────

const MODEL_FN: Record<AttributionModel, (j: CustomerJourney) => TouchpointCredit[]> = {
  first_touch: attributeFirstTouch,
  last_touch: attributeLastTouch,
  linear: attributeLinear,
  time_decay: attributeTimeDecay,
  position_based: attributePositionBased,
};

// ── Main Attribution Function ─────────────────────────────────────────────

/**
 * Run attribution across all converted journeys using a specific model.
 */
export function runAttribution(
  journeys: CustomerJourney[],
  model: AttributionModel,
  campaignSpends?: CampaignSpend[],
): AttributionResult {
  const convertedJourneys = journeys.filter(j => j.converted);
  const attributeFn = MODEL_FN[model];

  // Attribute each journey
  const allCredits: TouchpointCredit[] = [];
  for (const journey of convertedJourneys) {
    allCredits.push(...attributeFn(journey));
  }

  // Aggregate by channel
  const channelMap = new Map<MarketingChannel, {
    conversions: number;
    revenue: number;
    touchpoints: number;
    positionSum: number;
    uniqueLeads: Set<string>;
  }>();

  // Track unique leads per channel (including non-converted)
  const channelLeadMap = new Map<MarketingChannel, Set<string>>();
  for (const journey of journeys) {
    for (const tp of journey.touchpoints) {
      if (!channelLeadMap.has(tp.channel)) channelLeadMap.set(tp.channel, new Set());
      channelLeadMap.get(tp.channel)!.add(journey.leadId);
    }
  }

  for (const credit of allCredits) {
    const ch = credit.touchpoint.channel;
    if (!channelMap.has(ch)) {
      channelMap.set(ch, { conversions: 0, revenue: 0, touchpoints: 0, positionSum: 0, uniqueLeads: new Set() });
    }
    const entry = channelMap.get(ch)!;
    entry.conversions += credit.credit;
    entry.revenue += credit.creditRevenue;
    entry.touchpoints++;
    entry.positionSum += credit.position;
  }

  const channelCredits: ChannelCredit[] = Array.from(channelMap.entries()).map(([channel, data]) => {
    const totalLeads = channelLeadMap.get(channel)?.size || 1;
    return {
      channel,
      conversions: Math.round(data.conversions * 100) / 100,
      revenue: Math.round(data.revenue * 100) / 100,
      touchpoints: data.touchpoints,
      avgPosition: data.touchpoints > 0 ? Math.round((data.positionSum / data.touchpoints) * 10) / 10 : 0,
      conversionRate: totalLeads > 0 ? Math.round((data.conversions / totalLeads) * 10000) / 100 : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Aggregate by campaign
  const campaignMap = new Map<string, {
    channel: MarketingChannel;
    conversions: number;
    revenue: number;
    touchpoints: number;
  }>();

  for (const credit of allCredits) {
    const campaignKey = credit.touchpoint.campaign || '(no campaign)';
    if (!campaignMap.has(campaignKey)) {
      campaignMap.set(campaignKey, {
        channel: credit.touchpoint.channel,
        conversions: 0,
        revenue: 0,
        touchpoints: 0,
      });
    }
    const entry = campaignMap.get(campaignKey)!;
    entry.conversions += credit.credit;
    entry.revenue += credit.creditRevenue;
    entry.touchpoints++;
  }

  const campaignCredits: CampaignCredit[] = Array.from(campaignMap.entries()).map(([campaign, data]) => {
    const spend = campaignSpends?.find(s => s.campaign === campaign)?.spend;
    return {
      campaign,
      channel: data.channel,
      conversions: Math.round(data.conversions * 100) / 100,
      revenue: Math.round(data.revenue * 100) / 100,
      touchpoints: data.touchpoints,
      spend,
      costPerAcquisition: spend && data.conversions > 0 ? Math.round((spend / data.conversions) * 100) / 100 : undefined,
      roas: spend && spend > 0 ? Math.round((data.revenue / spend) * 100) / 100 : undefined,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Apply spend data to channel credits
  if (campaignSpends) {
    const channelSpendMap = new Map<MarketingChannel, number>();
    for (const cs of campaignSpends) {
      const ch = cs.channel;
      channelSpendMap.set(ch, (channelSpendMap.get(ch) || 0) + cs.spend);
    }
    for (const cc of channelCredits) {
      const spend = channelSpendMap.get(cc.channel);
      if (spend) {
        cc.costPerAcquisition = cc.conversions > 0 ? Math.round((spend / cc.conversions) * 100) / 100 : undefined;
        cc.roas = spend > 0 ? Math.round((cc.revenue / spend) * 100) / 100 : undefined;
      }
    }
  }

  return {
    model,
    channelCredits,
    campaignCredits,
    totalConversions: convertedJourneys.length,
    totalRevenue: convertedJourneys.reduce((sum, j) => sum + (j.conversionValue || 0), 0),
    touchpointBreakdown: allCredits,
  };
}

/**
 * Compare all attribution models side-by-side for each channel.
 */
export function compareModels(
  journeys: CustomerJourney[],
  campaignSpends?: CampaignSpend[],
): AttributionComparison[] {
  const models: AttributionModel[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];
  const results = models.map(model => runAttribution(journeys, model, campaignSpends));

  // Collect all channels
  const allChannels = new Set<MarketingChannel>();
  for (const result of results) {
    for (const cc of result.channelCredits) {
      allChannels.add(cc.channel);
    }
  }

  const totalRevenue = results[0]?.totalRevenue || 1;

  const comparisons: AttributionComparison[] = Array.from(allChannels).map(channel => {
    const modelData: Record<AttributionModel, { conversions: number; revenue: number; share: number }> = {} as never;

    for (const result of results) {
      const cc = result.channelCredits.find(c => c.channel === channel);
      modelData[result.model] = {
        conversions: cc?.conversions || 0,
        revenue: cc?.revenue || 0,
        share: cc ? Math.round((cc.revenue / totalRevenue) * 10000) / 100 : 0,
      };
    }

    // Generate insight
    const firstTouchShare = modelData.first_touch?.share || 0;
    const lastTouchShare = modelData.last_touch?.share || 0;
    let insight: string;

    if (firstTouchShare > lastTouchShare * 1.5) {
      insight = `Strong awareness driver — ${channel.replace(/_/g, ' ')} brings people in but other channels close.`;
    } else if (lastTouchShare > firstTouchShare * 1.5) {
      insight = `Strong closer — ${channel.replace(/_/g, ' ')} converts leads that other channels discovered.`;
    } else if (Math.abs(firstTouchShare - lastTouchShare) < 5) {
      insight = `Balanced performer — ${channel.replace(/_/g, ' ')} contributes evenly across the funnel.`;
    } else {
      insight = `Mixed role — ${channel.replace(/_/g, ' ')} plays different roles depending on the attribution model.`;
    }

    return { channel, models: modelData, insight };
  });

  return comparisons.sort((a, b) => {
    const aMax = Math.max(...Object.values(a.models).map(m => m.revenue));
    const bMax = Math.max(...Object.values(b.models).map(m => m.revenue));
    return bMax - aMax;
  });
}

/**
 * Map a customer's full journey as an ordered sequence of touchpoints.
 */
export function mapCustomerJourney(journey: CustomerJourney): {
  leadId: string;
  touchSequence: {
    step: number;
    channel: MarketingChannel;
    source: string;
    campaign?: string;
    timestamp: string;
    daysFromFirst: number;
    daysToConversion?: number;
  }[];
  totalTouchpoints: number;
  journeyDuration: number; // days
  converted: boolean;
} {
  const sorted = [...journey.touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstTime = sorted.length > 0 ? new Date(sorted[0].timestamp).getTime() : Date.now();
  const conversionTime = journey.convertedAt ? new Date(journey.convertedAt).getTime() : undefined;

  const touchSequence = sorted.map((tp, i) => {
    const tpTime = new Date(tp.timestamp).getTime();
    return {
      step: i + 1,
      channel: tp.channel,
      source: tp.source,
      campaign: tp.campaign,
      timestamp: tp.timestamp,
      daysFromFirst: Math.round((tpTime - firstTime) / (1000 * 60 * 60 * 24) * 10) / 10,
      daysToConversion: conversionTime
        ? Math.round((conversionTime - tpTime) / (1000 * 60 * 60 * 24) * 10) / 10
        : undefined,
    };
  });

  const lastTime = sorted.length > 0 ? new Date(sorted[sorted.length - 1].timestamp).getTime() : firstTime;
  const journeyDuration = Math.round((lastTime - firstTime) / (1000 * 60 * 60 * 24) * 10) / 10;

  return {
    leadId: journey.leadId,
    touchSequence,
    totalTouchpoints: sorted.length,
    journeyDuration,
    converted: journey.converted,
  };
}

/**
 * Calculate channel performance with spend data.
 */
export function calculateChannelPerformance(
  journeys: CustomerJourney[],
  channelSpend: Record<MarketingChannel, number>,
  model: AttributionModel = 'position_based',
): ChannelPerformance[] {
  const attribution = runAttribution(journeys, model);

  return attribution.channelCredits.map(cc => {
    const spend = channelSpend[cc.channel] || 0;
    return {
      channel: cc.channel,
      leads: cc.touchpoints,
      conversions: Math.round(cc.conversions),
      revenue: cc.revenue,
      spend,
      conversionRate: cc.conversionRate,
      cpa: cc.conversions > 0 ? Math.round(spend / cc.conversions) : 0,
      roas: spend > 0 ? Math.round((cc.revenue / spend) * 100) / 100 : 0,
    };
  });
}

/**
 * Get the average journey length (touchpoints) for converted vs non-converted.
 */
export function getJourneyStats(journeys: CustomerJourney[]): {
  avgTouchpointsConverted: number;
  avgTouchpointsNonConverted: number;
  avgDaysToConvert: number;
  medianTouchpointsConverted: number;
  mostCommonFirstChannel: MarketingChannel | null;
  mostCommonLastChannel: MarketingChannel | null;
} {
  const converted = journeys.filter(j => j.converted);
  const nonConverted = journeys.filter(j => !j.converted);

  const avgTouchConverted = converted.length > 0
    ? Math.round(converted.reduce((s, j) => s + j.touchpoints.length, 0) / converted.length * 10) / 10
    : 0;

  const avgTouchNonConverted = nonConverted.length > 0
    ? Math.round(nonConverted.reduce((s, j) => s + j.touchpoints.length, 0) / nonConverted.length * 10) / 10
    : 0;

  // Avg days to convert
  const convDays = converted
    .filter(j => j.convertedAt && j.touchpoints.length > 0)
    .map(j => {
      const first = new Date(j.touchpoints[0].timestamp).getTime();
      const conv = new Date(j.convertedAt!).getTime();
      return (conv - first) / (1000 * 60 * 60 * 24);
    });
  const avgDays = convDays.length > 0
    ? Math.round(convDays.reduce((s, d) => s + d, 0) / convDays.length * 10) / 10
    : 0;

  // Median touchpoints
  const touchCounts = converted.map(j => j.touchpoints.length).sort((a, b) => a - b);
  const median = touchCounts.length > 0
    ? touchCounts[Math.floor(touchCounts.length / 2)]
    : 0;

  // Most common first/last channels
  const firstChannels: Record<string, number> = {};
  const lastChannels: Record<string, number> = {};
  for (const j of converted) {
    if (j.touchpoints.length > 0) {
      const first = j.touchpoints[0].channel;
      firstChannels[first] = (firstChannels[first] || 0) + 1;
      const last = j.touchpoints[j.touchpoints.length - 1].channel;
      lastChannels[last] = (lastChannels[last] || 0) + 1;
    }
  }

  const topFirst = Object.entries(firstChannels).sort((a, b) => b[1] - a[1])[0];
  const topLast = Object.entries(lastChannels).sort((a, b) => b[1] - a[1])[0];

  return {
    avgTouchpointsConverted: avgTouchConverted,
    avgTouchpointsNonConverted: avgTouchNonConverted,
    avgDaysToConvert: avgDays,
    medianTouchpointsConverted: median,
    mostCommonFirstChannel: topFirst ? topFirst[0] as MarketingChannel : null,
    mostCommonLastChannel: topLast ? topLast[0] as MarketingChannel : null,
  };
}
