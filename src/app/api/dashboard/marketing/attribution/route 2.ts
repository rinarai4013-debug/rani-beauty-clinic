import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import {
  runAttribution, compareModels, calculateChannelPerformance,
  getJourneyStats, type CustomerJourney, type MarketingChannel,
} from '@/lib/marketing/attribution';

/**
 * GET /api/dashboard/marketing/attribution
 * Attribution analysis — channel performance, model comparison, journey stats.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Sample journey data — in production, aggregated from Airtable + analytics
    const journeys: CustomerJourney[] = [
      {
        leadId: 'j1', converted: true, convertedAt: '2026-03-20T14:00:00Z', conversionValue: 2750,
        touchpoints: [
          { id: 't1', timestamp: '2026-03-05T10:00:00Z', channel: 'organic_search', source: 'google', medium: 'organic', landingPage: '/services/sofwave' },
          { id: 't2', timestamp: '2026-03-10T15:00:00Z', channel: 'paid_social', source: 'facebook', medium: 'cpc', campaign: 'spring-refresh' },
          { id: 't3', timestamp: '2026-03-18T09:00:00Z', channel: 'email', source: 'email', medium: 'email', campaign: 'nurture-sofwave' },
          { id: 't4', timestamp: '2026-03-19T16:00:00Z', channel: 'direct', source: 'direct', medium: '(none)' },
        ],
      },
      {
        leadId: 'j2', converted: true, convertedAt: '2026-03-22T11:00:00Z', conversionValue: 495,
        touchpoints: [
          { id: 't5', timestamp: '2026-03-15T08:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc', campaign: 'hydrafacial-renton' },
          { id: 't6', timestamp: '2026-03-21T14:00:00Z', channel: 'direct', source: 'direct', medium: '(none)' },
        ],
      },
      {
        leadId: 'j3', converted: true, convertedAt: '2026-03-24T10:00:00Z', conversionValue: 1200,
        touchpoints: [
          { id: 't7', timestamp: '2026-03-01T12:00:00Z', channel: 'organic_social', source: 'instagram', medium: 'social' },
          { id: 't8', timestamp: '2026-03-08T09:00:00Z', channel: 'organic_search', source: 'google', medium: 'organic' },
          { id: 't9', timestamp: '2026-03-15T11:00:00Z', channel: 'referral', source: 'yelp', medium: 'referral' },
          { id: 't10', timestamp: '2026-03-20T16:00:00Z', channel: 'email', source: 'email', medium: 'email', campaign: 'consult-followup' },
          { id: 't11', timestamp: '2026-03-23T10:00:00Z', channel: 'direct', source: 'direct', medium: '(none)' },
        ],
      },
      {
        leadId: 'j4', converted: false,
        touchpoints: [
          { id: 't12', timestamp: '2026-03-18T10:00:00Z', channel: 'paid_social', source: 'facebook', medium: 'cpc', campaign: 'botox-seattle' },
          { id: 't13', timestamp: '2026-03-19T08:00:00Z', channel: 'organic_search', source: 'google', medium: 'organic' },
        ],
      },
      {
        leadId: 'j5', converted: true, convertedAt: '2026-03-25T09:00:00Z', conversionValue: 850,
        touchpoints: [
          { id: 't14', timestamp: '2026-03-10T14:00:00Z', channel: 'referral', source: 'friend', medium: 'referral' },
          { id: 't15', timestamp: '2026-03-22T11:00:00Z', channel: 'organic_search', source: 'google', medium: 'organic' },
          { id: 't16', timestamp: '2026-03-24T16:00:00Z', channel: 'direct', source: 'direct', medium: '(none)' },
        ],
      },
    ];

    const channelSpend: Record<MarketingChannel, number> = {
      organic_search: 0,
      paid_search: 1450,
      paid_social: 2800,
      organic_social: 0,
      referral: 0,
      direct: 0,
      email: 200,
      display: 0,
      affiliate: 0,
      other: 0,
    };

    const channelPerformance = calculateChannelPerformance(journeys, channelSpend, 'position_based');
    const modelComparison = compareModels(journeys);
    const journeyStats = getJourneyStats(journeys);

    const totalRevenue = journeys.filter(j => j.converted).reduce((s, j) => s + (j.conversionValue || 0), 0);
    const totalSpend = Object.values(channelSpend).reduce((s, v) => s + v, 0);

    return NextResponse.json({
      channelPerformance,
      modelComparison,
      journeyStats,
      kpis: {
        totalConversions: journeys.filter(j => j.converted).length,
        totalRevenue,
        avgCPA: totalSpend > 0 ? Math.round(totalSpend / journeys.filter(j => j.converted).length) : 0,
        overallROAS: totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error('[Marketing Attribution]', error);
    return NextResponse.json({ error: 'Failed to load attribution data' }, { status: 500 });
  }
}
