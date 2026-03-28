/**
 * Ads War Machine - Auto-Scale Cron Endpoint
 *
 * Called on a schedule (e.g., every 6 hours) to:
 * 1. Fetch current campaign performance from Meta + Google
 * 2. Run auto-scaler engine against thresholds
 * 3. Execute scaling decisions (budget adjustments, pauses, kills)
 * 4. Log all decisions for audit trail
 * 5. Return a scaling report
 *
 * CRITICAL: Always "injection" - never "infusion."
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runAutoScaler,
  type AutoScalerInput,
  type CampaignPerformance,
  type AutoScalerResult,
} from '@/lib/ads/auto-scaler';

// ── TYPES ──

interface ScaleLogEntry {
  timestamp: string;
  campaignId: string;
  campaignName: string;
  platform: 'meta' | 'google';
  previousBudget: number;
  newBudget: number;
  direction: 'up' | 'down' | 'hold' | 'pause' | 'kill';
  reason: string;
  metrics: {
    cpa: number;
    roas: number;
    ctr: number;
    conversions: number;
  };
}

interface AutoScaleReport {
  executedAt: string;
  durationMs: number;
  campaignsEvaluated: number;
  decisionsExecuted: number;
  scaledUp: number;
  scaledDown: number;
  paused: number;
  killed: number;
  held: number;
  totalBudgetChange: number;
  killSwitchTriggered: boolean;
  overallHealthScore: number;
  platformSplit: { meta: number; google: number };
  logs: ScaleLogEntry[];
  warnings: string[];
  summary: string;
}

// ── MOCK CAMPAIGN DATA ──
// In production, this fetches from Meta Ads API + Google Ads API

function fetchCampaignPerformance(): CampaignPerformance[] {
  return [
    {
      id: 'camp_glp1_meta', name: 'GLP-1 Weight Loss - Meta', platform: 'meta',
      status: 'active', dailyBudget: 65, spent: 1820, impressions: 84000,
      clicks: 3360, ctr: 4.0, leads: 52, conversions: 38, cpa: 47.89,
      revenue: 7600, roas: 4.18, frequency: 2.1, daysRunning: 28,
      lastScaleDate: '2026-03-19', consecutiveScaleUps: 1, consecutiveScaleDowns: 0,
    },
    {
      id: 'camp_botox_meta', name: 'Botox Confidence - Meta', platform: 'meta',
      status: 'active', dailyBudget: 45, spent: 1260, impressions: 62000,
      clicks: 2170, ctr: 3.5, leads: 34, conversions: 22, cpa: 57.27,
      revenue: 4400, roas: 3.49, frequency: 2.8, daysRunning: 28,
      lastScaleDate: '2026-03-12', consecutiveScaleUps: 0, consecutiveScaleDowns: 0,
    },
    {
      id: 'camp_hydra_meta', name: 'HydraFacial Glow - Meta', platform: 'meta',
      status: 'active', dailyBudget: 30, spent: 840, impressions: 38000,
      clicks: 1520, ctr: 4.0, leads: 24, conversions: 19, cpa: 44.21,
      revenue: 2850, roas: 3.39, frequency: 1.9, daysRunning: 28,
      consecutiveScaleUps: 0, consecutiveScaleDowns: 0,
    },
    {
      id: 'camp_glp1_google', name: 'GLP-1 Weight Loss - Google', platform: 'google',
      status: 'active', dailyBudget: 55, spent: 1540, impressions: 42000,
      clicks: 2520, ctr: 6.0, leads: 42, conversions: 28, cpa: 55.00,
      revenue: 5600, roas: 3.64, frequency: 1.0, daysRunning: 30,
      lastScaleDate: '2026-03-15', consecutiveScaleUps: 0, consecutiveScaleDowns: 0,
    },
    {
      id: 'camp_botox_google', name: 'Botox Local - Google', platform: 'google',
      status: 'active', dailyBudget: 35, spent: 980, impressions: 28000,
      clicks: 1400, ctr: 5.0, leads: 22, conversions: 15, cpa: 65.33,
      revenue: 3000, roas: 3.06, frequency: 1.0, daysRunning: 30,
      consecutiveScaleUps: 0, consecutiveScaleDowns: 0,
    },
    {
      id: 'camp_wellness_meta', name: 'Wellness Injections - Meta', platform: 'meta',
      status: 'active', dailyBudget: 20, spent: 560, impressions: 22000,
      clicks: 660, ctr: 3.0, leads: 11, conversions: 8, cpa: 70.00,
      revenue: 840, roas: 1.50, frequency: 3.1, daysRunning: 28,
      consecutiveScaleUps: 0, consecutiveScaleDowns: 2,
    },
    {
      id: 'camp_laser_meta', name: 'Laser Hair Removal - Meta', platform: 'meta',
      status: 'active', dailyBudget: 25, spent: 700, impressions: 32000,
      clicks: 640, ctr: 2.0, leads: 9, conversions: 4, cpa: 175.00,
      revenue: 600, roas: 0.86, frequency: 4.8, daysRunning: 35,
      consecutiveScaleUps: 0, consecutiveScaleDowns: 3,
    },
  ];
}

// ── AUTO-SCALER CONFIG ──

const SCALER_CONFIG: AutoScalerInput = {
  campaigns: [],
  dailySpendCap: 300,
  monthlyBudget: 8500,
  targetCPA: 50,
  targetROAS: 3.0,
  minCTR: 2.5,
  daysOfData: 28,
  platformSplit: { meta: 0.60, google: 0.40 },
};

// ── EXECUTE SCALING DECISIONS ──

function executeDecisions(result: AutoScalerResult, campaigns: CampaignPerformance[]): ScaleLogEntry[] {
  const logs: ScaleLogEntry[] = [];
  const now = new Date().toISOString();

  for (const decision of result.decisions) {
    const campaign = campaigns.find(c => c.id === decision.campaignId);
    if (!campaign) continue;

    logs.push({
      timestamp: now,
      campaignId: decision.campaignId,
      campaignName: campaign.name,
      platform: campaign.platform,
      previousBudget: campaign.dailyBudget,
      newBudget: decision.newDailyBudget,
      direction: decision.direction,
      reason: decision.reason,
      metrics: {
        cpa: campaign.cpa,
        roas: campaign.roas,
        ctr: campaign.ctr,
        conversions: campaign.conversions,
      },
    });

    // In production: call Meta Ads API / Google Ads API to update budgets
    // await metaAdsApi.updateCampaignBudget(decision.campaignId, decision.newDailyBudget);
    // await googleAdsApi.updateCampaignBudget(decision.campaignId, decision.newDailyBudget);
  }

  return logs;
}

// ── ROUTE HANDLER ──

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Fetch current campaign performance
    const campaigns = fetchCampaignPerformance();

    // 2. Run auto-scaler engine
    const scalerInput: AutoScalerInput = {
      ...SCALER_CONFIG,
      campaigns,
    };

    const scalerResult = runAutoScaler(scalerInput);

    // 3. Execute scaling decisions
    const logs = executeDecisions(scalerResult, campaigns);

    // 4. Calculate summary stats
    const scaledUp = scalerResult.decisions.filter(d => d.direction === 'up').length;
    const scaledDown = scalerResult.decisions.filter(d => d.direction === 'down').length;
    const paused = scalerResult.decisions.filter(d => d.direction === 'pause').length;
    const killed = scalerResult.decisions.filter(d => d.direction === 'kill').length;
    const held = scalerResult.decisions.filter(d => d.direction === 'hold').length;

    const totalBudgetChange = logs.reduce((sum, log) => sum + (log.newBudget - log.previousBudget), 0);

    // 5. Collect warnings
    const warnings: string[] = [];

    if (scalerResult.killSwitchStatus.triggered) {
      warnings.push(`Kill switch triggered for ${scalerResult.killSwitchStatus.affectedCampaigns.length} campaign(s)`);
    }

    for (const alert of scalerResult.diminishingReturns) {
      warnings.push(`Diminishing returns detected on ${alert.campaignId}: ${alert.recommendation}`);
    }

    if (scalerResult.guardrailStatus.dailySpendExceeded) {
      warnings.push('Daily spend cap exceeded - scaling paused');
    }

    if (scalerResult.guardrailStatus.monthlyPaceOver) {
      warnings.push('Monthly budget pacing ahead of schedule');
    }

    // 6. Build report
    const report: AutoScaleReport = {
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      campaignsEvaluated: campaigns.length,
      decisionsExecuted: logs.length,
      scaledUp,
      scaledDown,
      paused,
      killed,
      held,
      totalBudgetChange,
      killSwitchTriggered: scalerResult.killSwitchStatus.triggered,
      overallHealthScore: scalerResult.overallHealthScore,
      platformSplit: {
        meta: scalerResult.platformOptimization.recommendedSplit.meta,
        google: scalerResult.platformOptimization.recommendedSplit.google,
      },
      logs,
      warnings,
      summary: scalerResult.summary,
    };

    // 7. In production: persist to Airtable audit trail
    // await airtable.create('Ads Scaling Log', report);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in auto-scaler';
    console.error('[Ads Auto-Scale] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST allows manual trigger with custom parameters
  try {
    const body = await request.json();

    const {
      dailySpendCap = SCALER_CONFIG.dailySpendCap,
      monthlyBudget = SCALER_CONFIG.monthlyBudget,
      targetCPA = SCALER_CONFIG.targetCPA,
      targetROAS = SCALER_CONFIG.targetROAS,
      dryRun = false,
    } = body;

    const startTime = Date.now();
    const campaigns = fetchCampaignPerformance();

    const scalerInput: AutoScalerInput = {
      ...SCALER_CONFIG,
      campaigns,
      dailySpendCap,
      monthlyBudget,
      targetCPA,
      targetROAS,
    };

    const scalerResult = runAutoScaler(scalerInput);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        decisions: scalerResult.decisions.map(d => ({
          campaignId: d.campaignId,
          direction: d.direction,
          currentBudget: campaigns.find(c => c.id === d.campaignId)?.dailyBudget ?? 0,
          newBudget: d.newDailyBudget,
          reason: d.reason,
        })),
        healthScore: scalerResult.overallHealthScore,
        killSwitchStatus: scalerResult.killSwitchStatus,
        summary: scalerResult.summary,
        durationMs: Date.now() - startTime,
      });
    }

    const logs = executeDecisions(scalerResult, campaigns);

    return NextResponse.json({
      success: true,
      dryRun: false,
      decisionsExecuted: logs.length,
      healthScore: scalerResult.overallHealthScore,
      summary: scalerResult.summary,
      logs,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
