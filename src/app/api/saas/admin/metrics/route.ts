import { NextResponse } from 'next/server';

export async function GET() {
  // In production: aggregate from Stripe, Airtable, usage tracking tables
  const metrics = {
    timestamp: new Date().toISOString(),

    // Tenant Metrics
    tenants: {
      total: 47,
      active: 34,
      trial: 8,
      suspended: 3,
      churned: 2,
      newThisMonth: 12,
      newLastMonth: 8,
      growthRate: 50, // %
    },

    // Revenue Metrics
    revenue: {
      mrr: 42800,
      arr: 513600,
      mrrGrowthRate: 23.7, // %
      avgRevenuePerTenant: 910,
      ltv: 10920, // 12 months avg
      mrrByPlan: {
        starter: 3800,
        growth: 17600,
        enterprise: 10000,
      },
      mrrHistory: [
        { month: '2025-09', mrr: 12400 },
        { month: '2025-10', mrr: 15800 },
        { month: '2025-11', mrr: 19600 },
        { month: '2025-12', mrr: 23200 },
        { month: '2026-01', mrr: 28400 },
        { month: '2026-02', mrr: 34600 },
        { month: '2026-03', mrr: 42800 },
      ],
    },

    // Churn Metrics
    churn: {
      monthlyChurnRate: 3.2,
      revenueChurnRate: 2.1,
      netRevenueRetention: 118, // % (>100 = expansion > churn)
      avgChurnedMRR: 1600,
      atRiskTenants: 7,
      atRiskMRR: 3196,
    },

    // Usage Metrics
    usage: {
      totalAICallsThisMonth: 189400,
      avgAICallsPerTenant: 4030,
      totalSMSSent: 12400,
      totalEmailsSent: 18200,
      totalTokensConsumed: 47800000,
      peakHour: '10:00 AM',
      avgDailyActiveTenants: 34,
    },

    // System Health
    system: {
      services: [
        { name: 'Airtable API', status: 'operational', latency: 45, uptime: 99.98 },
        { name: 'Stripe Billing', status: 'operational', latency: 120, uptime: 99.99 },
        { name: 'Claude AI API', status: 'operational', latency: 890, uptime: 99.95 },
        { name: 'Vapi Voice AI', status: 'operational', latency: 210, uptime: 99.90 },
        { name: 'Twilio SMS', status: 'operational', latency: 95, uptime: 99.97 },
        { name: 'n8n Workflows', status: 'degraded', latency: 1200, uptime: 99.80 },
      ],
      overallUptime: 99.93,
      incidentsThisMonth: 1,
      avgResponseTime: 430,
    },

    // Growth Metrics
    growth: {
      trialToPayingConversion: 62, // %
      avgTrialDuration: 9.2, // days
      avgTimeToFirstValue: 2.4, // days
      nps: 72,
      csat: 4.6, // out of 5
    },
  };

  return NextResponse.json(metrics);
}
