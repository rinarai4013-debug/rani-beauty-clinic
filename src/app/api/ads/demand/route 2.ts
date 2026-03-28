/**
 * Ads War Machine - Demand Engine Cron Endpoint
 *
 * Called on a schedule (e.g., every 4 hours) to:
 * 1. Check seasonal demand signals for the current date
 * 2. Evaluate inventory/appointment utilization
 * 3. Check weather-based triggers for PNW area
 * 4. Detect revenue gaps against monthly targets
 * 5. Process competitor activity signals
 * 6. Build priority queue and trigger campaigns as needed
 * 7. Return demand report
 *
 * Geo: Renton, WA (PNW area)
 * CRITICAL: Always "injection" - never "infusion."
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSeasonalDemand,
  checkEventTriggers,
  checkWeatherTriggers,
  checkInventorySignals,
  detectRevenueGap,
  checkCompetitorSignals,
  buildPriorityQueue,
  calculateBudgetAdjustment,
  calculateDemandScore,
  type DemandSignal,
  type DemandPriority,
  type AppointmentUtilization,
  type RevenueGapData,
  type CompetitorSignalData,
  type WeatherData,
} from '@/lib/ads/demand-engine';

// ── TYPES ──

interface DemandReport {
  executedAt: string;
  durationMs: number;
  demandScore: number;
  signalsDetected: number;
  signalsByPriority: Record<DemandPriority, number>;
  priorityQueue: DemandSignal[];
  budgetAdjustments: BudgetAdjustment[];
  campaignsTriggered: TriggeredCampaign[];
  emergencyLaunches: number;
  weatherCondition: string;
  seasonalMultiplier: number;
  upcomingEvents: string[];
  revenueGapStatus: 'on_track' | 'behind' | 'critical';
  summary: string;
}

interface BudgetAdjustment {
  service: string;
  currentDailyBudget: number;
  recommendedDailyBudget: number;
  changePercent: number;
  reason: string;
  signalId: string;
}

interface TriggeredCampaign {
  type: 'new' | 'reactivated' | 'boosted';
  name: string;
  service: string;
  platform: 'meta' | 'google' | 'both';
  dailyBudget: number;
  reason: string;
  duration: string;
}

// ── MOCK DATA FETCHERS ──
// In production, these pull from Airtable, weather APIs, and ad platform APIs

function fetchAppointmentUtilization(): AppointmentUtilization {
  return {
    date: new Date().toISOString().split('T')[0],
    totalSlots: 24,
    bookedSlots: 16,
    utilizationRate: 0.667,
    gapHours: [10, 14, 16],
    serviceBreakdown: {
      'glp1': { booked: 4, capacity: 6, utilization: 0.667 },
      'botox': { booked: 3, capacity: 5, utilization: 0.600 },
      'hydrafacial': { booked: 3, capacity: 4, utilization: 0.750 },
      'sofwave': { booked: 1, capacity: 2, utilization: 0.500 },
      'wellness': { booked: 3, capacity: 4, utilization: 0.750 },
      'laser_hair': { booked: 2, capacity: 3, utilization: 0.667 },
    },
  };
}

function fetchRevenueData(): RevenueGapData {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedPace = dayOfMonth / daysInMonth;

  return {
    monthlyTarget: 85000,
    currentRevenue: 58000,
    daysElapsed: dayOfMonth,
    daysRemaining: daysInMonth - dayOfMonth,
    pacePercent: 58000 / 85000,
    expectedPacePercent: expectedPace,
    gapAmount: Math.max(0, (85000 * expectedPace) - 58000),
    serviceGaps: {
      'glp1': { target: 30000, actual: 22000, gap: 8000 },
      'botox': { target: 18000, actual: 14000, gap: 4000 },
      'hydrafacial': { target: 10000, actual: 8500, gap: 1500 },
      'sofwave': { target: 12000, actual: 7000, gap: 5000 },
      'wellness': { target: 8000, actual: 4500, gap: 3500 },
      'laser_hair': { target: 7000, actual: 2000, gap: 5000 },
    },
  };
}

function fetchWeatherData(): WeatherData {
  // In production: call OpenWeather or WeatherAPI for Renton, WA
  return {
    location: 'Renton, WA',
    currentTemp: 52,
    condition: 'overcast',
    forecast: [
      { date: '2026-03-26', high: 54, low: 42, condition: 'rain', precipChance: 80 },
      { date: '2026-03-27', high: 52, low: 40, condition: 'rain', precipChance: 75 },
      { date: '2026-03-28', high: 56, low: 43, condition: 'cloudy', precipChance: 40 },
      { date: '2026-03-29', high: 60, low: 45, condition: 'partly_sunny', precipChance: 20 },
      { date: '2026-03-30', high: 62, low: 46, condition: 'sunny', precipChance: 10 },
    ],
    rainyStreak: 3,
    sunnyStreak: 0,
  };
}

function fetchCompetitorActivity(): CompetitorSignalData[] {
  return [
    {
      competitorId: 'skinlogic',
      competitorName: 'Skinlogic Med Spa',
      signal: 'new_promotion',
      details: '20% off HydraFacial this week',
      detectedAt: '2026-03-25T14:00:00Z',
      threatLevel: 'medium',
      affectedServices: ['hydrafacial'],
    },
    {
      competitorId: 'seattle_weight_loss',
      competitorName: 'Seattle Weight Loss',
      signal: 'increased_ad_spend',
      details: 'Estimated 40% budget increase on GLP-1 keywords',
      detectedAt: '2026-03-24T09:00:00Z',
      threatLevel: 'high',
      affectedServices: ['glp1'],
    },
  ];
}

// ── CURRENT BUDGET MAP ──

const CURRENT_BUDGETS: Record<string, number> = {
  'glp1': 120,
  'botox': 80,
  'hydrafacial': 50,
  'sofwave': 40,
  'wellness': 30,
  'laser_hair': 25,
  'peptides': 25,
  'brand': 15,
};

// ── ROUTE HANDLER ──

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const now = new Date();
    const currentMonth = now.getMonth();

    // 1. Check seasonal demand
    const seasonalDemand = getSeasonalDemand(currentMonth);

    // 2. Check event triggers
    const eventSignals = checkEventTriggers(now);

    // 3. Check weather triggers
    const weatherData = fetchWeatherData();
    const weatherSignals = checkWeatherTriggers(weatherData);

    // 4. Check appointment utilization
    const utilization = fetchAppointmentUtilization();
    const inventorySignals = checkInventorySignals(utilization);

    // 5. Detect revenue gaps
    const revenueData = fetchRevenueData();
    const revenueSignals = detectRevenueGap(revenueData);

    // 6. Check competitor activity
    const competitorData = fetchCompetitorActivity();
    const competitorSignals = checkCompetitorSignals(competitorData);

    // 7. Combine all signals
    const allSignals: DemandSignal[] = [
      ...seasonalDemand,
      ...eventSignals,
      ...weatherSignals,
      ...inventorySignals,
      ...revenueSignals,
      ...competitorSignals,
    ];

    // 8. Build priority queue
    const priorityQueue = buildPriorityQueue(allSignals);

    // 9. Calculate demand score
    const demandScore = calculateDemandScore(allSignals);

    // 10. Calculate budget adjustments
    const budgetAdjustments: BudgetAdjustment[] = [];
    const triggeredCampaigns: TriggeredCampaign[] = [];
    let emergencyLaunches = 0;

    for (const signal of priorityQueue) {
      const adjustment = calculateBudgetAdjustment(signal);

      for (const service of signal.affectedServices) {
        const currentBudget = CURRENT_BUDGETS[service] || 30;
        const changePercent = adjustment.budgetMultiplier - 1;
        const recommendedBudget = Math.round(currentBudget * adjustment.budgetMultiplier);

        budgetAdjustments.push({
          service,
          currentDailyBudget: currentBudget,
          recommendedDailyBudget: recommendedBudget,
          changePercent: Math.round(changePercent * 100),
          reason: signal.description,
          signalId: signal.id,
        });
      }

      // Check for emergency launches
      if (signal.recommendedAction.type === 'emergency_launch' && signal.recommendedAction.newCampaignConfig) {
        emergencyLaunches++;
        const config = signal.recommendedAction.newCampaignConfig;
        triggeredCampaigns.push({
          type: 'new',
          name: config.name,
          service: signal.affectedServices[0] || 'general',
          platform: 'both',
          dailyBudget: config.dailyBudget,
          reason: signal.description,
          duration: `${config.durationDays} days`,
        });
      }

      // Check for campaign reactivations
      if (signal.recommendedAction.type === 'launch_campaign') {
        triggeredCampaigns.push({
          type: 'reactivated',
          name: `${signal.title} - Response Campaign`,
          service: signal.affectedServices[0] || 'general',
          platform: 'both',
          dailyBudget: Math.round(signal.budgetImpact * 0.5),
          reason: signal.description,
          duration: '14 days',
        });
      }
    }

    // 11. Determine revenue gap status
    let revenueGapStatus: 'on_track' | 'behind' | 'critical' = 'on_track';
    if (revenueData.pacePercent < revenueData.expectedPacePercent * 0.85) {
      revenueGapStatus = 'critical';
    } else if (revenueData.pacePercent < revenueData.expectedPacePercent * 0.95) {
      revenueGapStatus = 'behind';
    }

    // 12. Count signals by priority
    const signalsByPriority: Record<DemandPriority, number> = {
      critical: allSignals.filter(s => s.priority === 'critical').length,
      high: allSignals.filter(s => s.priority === 'high').length,
      medium: allSignals.filter(s => s.priority === 'medium').length,
      low: allSignals.filter(s => s.priority === 'low').length,
    };

    // 13. Get upcoming events from signals
    const upcomingEvents = eventSignals.map(s => s.title);

    // 14. Build summary
    const summaryParts: string[] = [];
    summaryParts.push(`Demand score: ${demandScore}/100.`);
    summaryParts.push(`${allSignals.length} signals detected (${signalsByPriority.critical} critical, ${signalsByPriority.high} high).`);

    if (revenueGapStatus === 'critical') {
      summaryParts.push(`Revenue pacing is CRITICAL - ${Math.round((1 - revenueData.pacePercent / revenueData.expectedPacePercent) * 100)}% behind target.`);
    } else if (revenueGapStatus === 'behind') {
      summaryParts.push('Revenue pacing slightly behind target.');
    }

    if (emergencyLaunches > 0) {
      summaryParts.push(`${emergencyLaunches} emergency campaign(s) recommended.`);
    }

    if (weatherData.rainyStreak >= 3) {
      summaryParts.push(`${weatherData.rainyStreak}-day rain streak in PNW - indoor service demand likely up.`);
    }

    // 15. Build report
    const report: DemandReport = {
      executedAt: now.toISOString(),
      durationMs: Date.now() - startTime,
      demandScore,
      signalsDetected: allSignals.length,
      signalsByPriority,
      priorityQueue: priorityQueue.slice(0, 10), // Top 10 signals
      budgetAdjustments,
      campaignsTriggered: triggeredCampaigns,
      emergencyLaunches,
      weatherCondition: weatherData.condition,
      seasonalMultiplier: seasonalDemand.length > 0 ? seasonalDemand[0].confidence / 100 : 1.0,
      upcomingEvents,
      revenueGapStatus,
      summary: summaryParts.join(' '),
    };

    // 16. In production: persist to Airtable + execute via ad platform APIs
    // await airtable.create('Demand Engine Log', report);
    // for (const campaign of triggeredCampaigns) {
    //   await launchCampaign(campaign);
    // }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in demand engine';
    console.error('[Ads Demand Engine] Error:', errorMessage);

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
  // POST allows manual trigger with overrides
  try {
    const body = await request.json();

    const {
      forceMonth,
      overrideWeather,
      overrideUtilization,
      monthlyTarget,
      currentRevenue,
      dryRun = false,
    } = body;

    const startTime = Date.now();
    const now = new Date();
    const month = forceMonth !== undefined ? forceMonth : now.getMonth();

    // Run seasonal + event signals
    const seasonalDemand = getSeasonalDemand(month);
    const eventSignals = checkEventTriggers(now);

    // Use overrides if provided
    const weatherData = overrideWeather || fetchWeatherData();
    const weatherSignals = checkWeatherTriggers(weatherData);

    const utilization = overrideUtilization || fetchAppointmentUtilization();
    const inventorySignals = checkInventorySignals(utilization);

    const revenueData = fetchRevenueData();
    if (monthlyTarget) revenueData.monthlyTarget = monthlyTarget;
    if (currentRevenue) revenueData.currentRevenue = currentRevenue;
    const revenueSignals = detectRevenueGap(revenueData);

    const allSignals = [
      ...seasonalDemand,
      ...eventSignals,
      ...weatherSignals,
      ...inventorySignals,
      ...revenueSignals,
    ];

    const priorityQueue = buildPriorityQueue(allSignals);
    const demandScore = calculateDemandScore(allSignals);

    return NextResponse.json({
      success: true,
      dryRun,
      demandScore,
      signalsDetected: allSignals.length,
      priorityQueue: priorityQueue.slice(0, 10),
      summary: `Demand score: ${demandScore}/100 with ${allSignals.length} active signals.`,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
