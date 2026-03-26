/**
 * Rani Beauty Clinic - Briefing Dashboard API
 *
 * GET  - Preview today's briefing (supports mega, daily, weekly, monthly)
 * POST - Send test briefing or update settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/briefing/daily-ceo-email';
import { generateWeeklyBriefing } from '@/lib/briefing/weekly-ceo-email';
import { generateMonthlyBriefing } from '@/lib/briefing/monthly-ceo-email';
import { generateAndRenderMegaBriefing, assembleMegaBriefing } from '@/lib/briefing/mega-briefing';
import { generateMarketIntelligence } from '@/lib/briefing/market-intelligence';
import { generateAdsIntelligence, type AdsIntelligenceConfig } from '@/lib/briefing/ads-intelligence';
import { generatePolymarketDigest } from '@/lib/briefing/polymarket-digest';
import { generateCompetitorIntelligence } from '@/lib/briefing/competitor-tracker';
import {
  fetchRevenue,
  fetchSchedule,
  fetchAlerts,
  fetchCashFlow,
  fetchAIHighlights,
} from '@/lib/briefing/data-fetchers';
import { Tables, fetchAll } from '@/lib/airtable/client';
import type { RenderedBriefing } from '@/lib/briefing/types';

async function generateMegaPreview() {
  const adsConfig: AdsIntelligenceConfig = {
    metaAccessToken: process.env.META_ADS_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN,
    metaAdAccountId: process.env.META_AD_ACCOUNT_ID,
    googleCustomerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
    googleDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    googleRefreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    monthlyBudget: { meta: 3000, google: 2000, total: 5000 },
    targets: { roas: 3.0, cpa: 100, mer: 3.0 },
  };

  const polymarketApiUrl = process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com';

  const [revenue, schedule, alerts, cashFlow, aiHighlights, marketIntel, adsIntel, polyDigest, compIntel] =
    await Promise.allSettled([
      fetchRevenue('yesterday'),
      fetchSchedule(),
      fetchAlerts(),
      fetchCashFlow(),
      fetchAIHighlights(),
      generateMarketIntelligence({ skipRSSFetch: true }).catch(() => null),
      generateAdsIntelligence(adsConfig).catch(() => null),
      generatePolymarketDigest({ apiUrl: polymarketApiUrl }).catch(() => null),
      generateCompetitorIntelligence().catch(() => null),
    ]);

  return generateAndRenderMegaBriefing({
    revenue: revenue.status === 'fulfilled' ? revenue.value : null,
    schedule: schedule.status === 'fulfilled' ? schedule.value : null,
    alerts: alerts.status === 'fulfilled' ? alerts.value : null,
    cashFlow: cashFlow.status === 'fulfilled' ? cashFlow.value : null,
    aiHighlights: aiHighlights.status === 'fulfilled' ? aiHighlights.value : null,
    adsIntelligence: adsIntel.status === 'fulfilled' ? adsIntel.value : null,
    marketIntelligence: marketIntel.status === 'fulfilled' ? marketIntel.value : null,
    polymarketDigest: polyDigest.status === 'fulfilled' ? polyDigest.value : null,
    competitorIntelligence: compIntel.status === 'fulfilled' ? compIntel.value : null,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'preview';
  const type = searchParams.get('type') || 'mega';

  try {
    if (action === 'preview') {
      // Mega briefing is the new default
      if (type === 'mega') {
        const megaBriefing = await generateMegaPreview();
        return NextResponse.json({
          subject: megaBriefing.subject,
          preheader: megaBriefing.preheader,
          html: megaBriefing.html,
          type: 'mega',
          generatedAt: megaBriefing.generatedAt,
          data: megaBriefing.data,
        });
      }

      let briefing: RenderedBriefing;

      switch (type) {
        case 'weekly':
          briefing = await generateWeeklyBriefing();
          break;
        case 'monthly':
          briefing = await generateMonthlyBriefing();
          break;
        case 'daily':
        default:
          briefing = await generateDailyBriefing();
          break;
      }

      return NextResponse.json({
        subject: briefing.subject,
        preheader: briefing.preheader,
        html: briefing.html,
        type: briefing.type,
        generatedAt: briefing.generatedAt,
        data: briefing.data,
      });
    }

    if (action === 'history') {
      // Fetch briefing logs from Alerts table
      const logs = await fetchAll<Record<string, unknown>>(
        Tables.alerts(),
        {
          filterByFormula: `OR({Type} = 'briefing_daily', {Type} = 'briefing_weekly', {Type} = 'briefing_monthly')`,
          sort: [{ field: 'Created Date', direction: 'desc' }],
        }
      );

      const history = logs.slice(0, 30).map((log) => ({
        id: log.id,
        type: String(log.fields['Type'] || '').replace('briefing_', ''),
        status: String(log.fields['Severity'] || '') === 'info' ? 'sent' : 'failed',
        message: String(log.fields['Message'] || ''),
        date: String(log.fields['Created Date'] || ''),
      }));

      return NextResponse.json({ history });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type = 'mega' } = body;

    if (action === 'send-test') {
      // Forward to the cron endpoint for actual sending
      const cronUrl = new URL('/api/cron/daily-briefing', request.url);
      const cronResponse = await fetch(cronUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, secret: process.env.CRON_SECRET }),
      });

      const result = await cronResponse.json();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
