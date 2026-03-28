/**
 * Rani Beauty Clinic - CEO Briefing Cron Endpoint
 *
 * Triggered by Vercel Cron at 14:00 UTC (6:00 AM PST) daily.
 * Sends the MEGA Intelligence Briefing as the primary daily email,
 * plus weekly/monthly rollups on appropriate days.
 *
 * Protected by CRON_SECRET header validation.
 * Sends emails via Resend and logs results to Airtable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateDailyBriefing } from '@/lib/briefing/daily-ceo-email';
import { generateWeeklyBriefing } from '@/lib/briefing/weekly-ceo-email';
import { generateMonthlyBriefing } from '@/lib/briefing/monthly-ceo-email';
import { generateAndRenderMegaBriefing } from '@/lib/briefing/mega-briefing';
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
import { Tables, createRecord } from '@/lib/airtable/client';
import type { RenderedBriefing, BriefingLogEntry } from '@/lib/briefing/types';

// ── Config ───────────────────────────────────────────────────

const RECIPIENT_EMAIL = process.env.CONTACT_EMAIL || 'info@ranibeautyclinic.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>';

// ── Auth ─────────────────────────────────────────────────────

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[Cron:Briefing] CRON_SECRET not configured');
    return false;
  }

  return secret === `Bearer ${cronSecret}`;
}

// ── Email sender ─────────────────────────────────────────────

async function sendBriefingEmail(briefing: { subject: string; html: string; text: string }): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [RECIPIENT_EMAIL],
      subject: briefing.subject,
      html: briefing.html,
      text: briefing.text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ── Logging ──────────────────────────────────────────────────

async function logBriefing(entry: BriefingLogEntry): Promise<void> {
  try {
    await createRecord(Tables.alerts(), {
      Type: `briefing_${entry.type}`,
      Severity: entry.status === 'sent' ? 'info' : 'warning',
      Message: `${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} briefing ${entry.status}: ${entry.subject}`,
      'Action Recommended': entry.error || 'None',
      Status: 'Active',
      'Created Date': entry.sentAt,
    });
  } catch (err) {
    console.error('[Cron:Briefing] Failed to log briefing:', err);
  }
}

// ── Mega Briefing Generator ─────────────────────────────────

async function generateMegaBriefingEmail(): Promise<{ subject: string; html: string; text: string; type: 'daily' }> {
  // Gather all intelligence sources in parallel, gracefully handling failures
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

  // Fetch all data sources in parallel
  const [revenue, schedule, alerts, cashFlow, aiHighlights, marketIntel, adsIntel, polyDigest, compIntel] =
    await Promise.allSettled([
      fetchRevenue('yesterday'),
      fetchSchedule(),
      fetchAlerts(),
      fetchCashFlow(),
      fetchAIHighlights(),
      generateMarketIntelligence({ skipRSSFetch: false }).catch(() => null),
      generateAdsIntelligence(adsConfig).catch(() => null),
      generatePolymarketDigest({ apiUrl: polymarketApiUrl }).catch(() => null),
      generateCompetitorIntelligence().catch(() => null),
    ]);

  const briefing = await generateAndRenderMegaBriefing({
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

  return {
    subject: briefing.subject,
    html: briefing.html,
    text: briefing.text,
    type: 'daily',
  };
}

// ── Route handler ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const dayOfWeek = pstDate.getDay(); // 0 = Sunday, 1 = Monday
  const dayOfMonth = pstDate.getDate();

  const results: { type: string; status: string; error?: string }[] = [];

  try {
    // Send MEGA Intelligence Briefing as the primary daily email
    let megaBriefing: { subject: string; html: string; text: string };
    try {
      megaBriefing = await generateMegaBriefingEmail();
    } catch (megaErr) {
      // Fallback to simple daily briefing if mega fails
      console.error('[Cron:Briefing] Mega briefing failed, falling back to simple:', megaErr);
      const simpleBriefing = await generateDailyBriefing();
      megaBriefing = { subject: simpleBriefing.subject, html: simpleBriefing.html, text: simpleBriefing.text };
    }

    const dailyResult = await sendBriefingEmail(megaBriefing);

    results.push({
      type: 'mega-daily',
      status: dailyResult.success ? 'sent' : 'failed',
      error: dailyResult.error,
    });

    await logBriefing({
      date: pstDate.toISOString().split('T')[0],
      type: 'daily',
      status: dailyResult.success ? 'sent' : 'failed',
      recipient: RECIPIENT_EMAIL,
      subject: megaBriefing.subject,
      error: dailyResult.error,
      sentAt: now.toISOString(),
    });

    // Send weekly rollup on Mondays
    if (dayOfWeek === 1) {
      const weeklyBriefing = await generateWeeklyBriefing();
      const weeklyResult = await sendBriefingEmail(weeklyBriefing);

      results.push({
        type: 'weekly',
        status: weeklyResult.success ? 'sent' : 'failed',
        error: weeklyResult.error,
      });

      await logBriefing({
        date: pstDate.toISOString().split('T')[0],
        type: 'weekly',
        status: weeklyResult.success ? 'sent' : 'failed',
        recipient: RECIPIENT_EMAIL,
        subject: weeklyBriefing.subject,
        error: weeklyResult.error,
        sentAt: now.toISOString(),
      });
    }

    // Send monthly summary on the 1st
    if (dayOfMonth === 1) {
      const monthlyBriefing = await generateMonthlyBriefing();
      const monthlyResult = await sendBriefingEmail(monthlyBriefing);

      results.push({
        type: 'monthly',
        status: monthlyResult.success ? 'sent' : 'failed',
        error: monthlyResult.error,
      });

      await logBriefing({
        date: pstDate.toISOString().split('T')[0],
        type: 'monthly',
        status: monthlyResult.success ? 'sent' : 'failed',
        recipient: RECIPIENT_EMAIL,
        subject: monthlyBriefing.subject,
        error: monthlyResult.error,
        sentAt: now.toISOString(),
      });
    }

    const allSuccess = results.every((r) => r.status === 'sent');
    const summary = results.map((r) => `${r.type}: ${r.status}`).join(', ');

    return NextResponse.json({
      success: allSuccess,
      summary,
      results,
      recipient: RECIPIENT_EMAIL,
      timestamp: now.toISOString(),
      dayOfWeek,
      dayOfMonth,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Cron:Briefing] Unhandled error:', err);

    return NextResponse.json(
      {
        success: false,
        error: message,
        results,
        timestamp: now.toISOString(),
      },
      { status: 500 }
    );
  }
}

// ── POST handler for manual triggers ─────────────────────────

export async function POST(request: NextRequest) {
  // POST allows manual triggering with type selection
  try {
    const body = await request.json();
    const { type = 'mega', secret } = body;

    // Verify secret for manual triggers too
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let briefing: { subject: string; html: string; text: string };

    switch (type) {
      case 'weekly': {
        const wb = await generateWeeklyBriefing();
        briefing = { subject: wb.subject, html: wb.html, text: wb.text };
        break;
      }
      case 'monthly': {
        const mb = await generateMonthlyBriefing();
        briefing = { subject: mb.subject, html: mb.html, text: mb.text };
        break;
      }
      case 'simple':
      case 'daily': {
        const db = await generateDailyBriefing();
        briefing = { subject: db.subject, html: db.html, text: db.text };
        break;
      }
      case 'mega':
      default:
        briefing = await generateMegaBriefingEmail();
        break;
    }

    const sendResult = await sendBriefingEmail(briefing);

    await logBriefing({
      date: new Date().toISOString().split('T')[0],
      type: type === 'mega' ? 'daily' : type,
      status: sendResult.success ? 'sent' : 'failed',
      recipient: RECIPIENT_EMAIL,
      subject: briefing.subject,
      error: sendResult.error,
      sentAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: sendResult.success,
      type,
      subject: briefing.subject,
      recipient: RECIPIENT_EMAIL,
      error: sendResult.error,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
