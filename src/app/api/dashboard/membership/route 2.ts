import { NextRequest, NextResponse } from 'next/server';
import { PLANS, MEMBERSHIP_TIERS, FOUNDING_MEMBER_RATES } from '@/lib/membership/plans';
import type { MembershipTier } from '@/lib/membership/plans';
import { buildBillingSummary } from '@/lib/membership/billing';
import { buildBenefitsAnalytics, calculateUtilizationScore } from '@/lib/membership/benefits';
import type { MemberBenefits } from '@/lib/membership/benefits';
import {
  predictMembershipChurn,
  calculateEngagementScore,
  generateRetentionActions,
  identifyAtRiskMembers,
  buildRetentionAnalytics,
  calculateAggregateNPS,
  getSurveysDue,
} from '@/lib/membership/retention';
import type { MemberRetentionProfile, NPSEntry } from '@/lib/membership/retention';
import {
  buildAnalyticsDashboard,
  buildMRRMovement,
  calculateMRR,
} from '@/lib/membership/analytics';
import type { MemberRecord, RevenueEvent, MRRMovement } from '@/lib/membership/analytics';

/**
 * GET /api/dashboard/membership
 *
 * Unified membership API endpoint.
 * Query param ?action= determines the response:
 *   overview  — Dashboard overview (KPIs, MRR, at-risk)
 *   plans     — Plan management data
 *   billing   — Billing overview
 *   retention — Retention dashboard
 *   analytics — Full analytics
 *   members   — Member list
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    // In production, these would come from Airtable via the rate-limited client.
    // For now, we return structured mock data that matches the real schema.
    switch (action) {
      case 'overview':
        return NextResponse.json(buildOverviewData());
      case 'plans':
        return NextResponse.json(buildPlansData());
      case 'billing':
        return NextResponse.json(buildBillingData());
      case 'retention':
        return NextResponse.json(buildRetentionData());
      case 'analytics':
        return NextResponse.json(buildFullAnalyticsData());
      case 'members':
        return NextResponse.json(buildMemberListData());
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Membership API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership data' },
      { status: 500 },
    );
  }
}

// ── Data Builders (mock data shaped like real Airtable data) ─────────────

function buildOverviewData() {
  const members = getMockMembers();
  const events = getMockEvents();
  const previousMRR = 8500;

  const analytics = buildAnalyticsDashboard({ members, events, previousMonthMRR: previousMRR });
  const retentionProfiles = getMockRetentionProfiles();
  const atRiskMembers = identifyAtRiskMembers(retentionProfiles, 50);

  return { analytics, atRiskMembers };
}

function buildPlansData() {
  const members = getMockMembers();
  const tierDistribution: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };
  const revenueByTier: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };
  const foundingMemberCounts: Record<MembershipTier, number> = { halo: 8, glow: 12, elite: 5 };

  for (const m of members) {
    if (m.status === 'active') {
      tierDistribution[m.tier]++;
      revenueByTier[m.tier] += m.monthlyRate;
    }
  }

  return { tierDistribution, revenueByTier, foundingMemberCounts };
}

function buildBillingData() {
  return {
    summary: {
      totalActive: 42,
      totalPaused: 3,
      totalSuspended: 1,
      totalPastDue: 2,
      totalMRR: 9845,
      failedPayments: 2,
      expiringCards: 3,
      inGracePeriod: 1,
    },
    failedPaymentMembers: [
      { memberId: 'mem_001', clientId: 'c_001', clientName: 'Sarah Mitchell', email: 'sarah@test.com', tier: 'glow' as MembershipTier, failedPaymentCount: 2, monthlyRate: 249, status: 'past_due' as const },
      { memberId: 'mem_002', clientId: 'c_002', clientName: 'James Rodriguez', email: 'james@test.com', tier: 'halo' as MembershipTier, failedPaymentCount: 1, monthlyRate: 149, status: 'past_due' as const },
    ],
    expiringCardMembers: [],
    recentInvoices: [
      { id: 'inv_001', clientName: 'Emily Chen', amount: 449, status: 'paid', date: '2026-03-15' },
      { id: 'inv_002', clientName: 'David Park', amount: 249, status: 'paid', date: '2026-03-15' },
      { id: 'inv_003', clientName: 'Sarah Mitchell', amount: 249, status: 'failed', date: '2026-03-10' },
      { id: 'inv_004', clientName: 'Anika Patel', amount: 149, status: 'paid', date: '2026-03-08' },
    ],
  };
}

function buildRetentionData() {
  const profiles = getMockRetentionProfiles();
  const atRiskMembers = identifyAtRiskMembers(profiles, 40);
  const pendingActions = atRiskMembers.flatMap(p => generateRetentionActions(p)).slice(0, 12);

  const npsEntries: NPSEntry[] = [
    { memberId: 'mem_001', score: 9, category: 'promoter', surveyType: 'milestone', createdAt: '2026-03-01' },
    { memberId: 'mem_002', score: 7, category: 'passive', surveyType: 'milestone', createdAt: '2026-03-05' },
    { memberId: 'mem_003', score: 10, category: 'promoter', surveyType: 'periodic', createdAt: '2026-02-20' },
    { memberId: 'mem_004', score: 5, category: 'detractor', surveyType: 'milestone', createdAt: '2026-03-10' },
  ];

  const memberTiers: Record<string, MembershipTier> = {
    mem_001: 'glow', mem_002: 'halo', mem_003: 'elite', mem_004: 'halo',
  };

  const analytics = buildRetentionAnalytics({
    activeMembers: profiles.filter(p => p.status === 'active'),
    cancelledMembers: [
      { memberId: 'mem_x1', tier: 'halo', joinDate: '2025-09-01', cancelledAt: '2026-02-15', reason: 'too_expensive', voluntary: true },
      { memberId: 'mem_x2', tier: 'glow', joinDate: '2025-11-01', cancelledAt: '2026-01-20', reason: 'not_using_enough', voluntary: true },
    ],
    npsEntries,
    memberTiers,
    saveOffers: { accepted: 3, total: 8 },
    winBacks: { won: 1, total: 4 },
  });

  return {
    analytics,
    atRiskMembers,
    pendingActions,
    engagementOverall: {
      score: 68,
      breakdown: { creditUsage: 72, visitFrequency: 65, recency: 80, addOns: 45, social: 55, tenure: 70 },
      trend: 'stable' as const,
    },
  };
}

function buildFullAnalyticsData() {
  const members = getMockMembers();
  const events = getMockEvents();
  const previousMRR = 8500;

  const dashboard = buildAnalyticsDashboard({ members, events, previousMonthMRR: previousMRR });

  // Build MRR movements for last 6 months
  const now = new Date();
  const mrrMovements: MRRMovement[] = [];
  let runningMRR = 6000;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    mrrMovements.push(buildMRRMovement(month, runningMRR, events));
    runningMRR += 300 + Math.random() * 200;
  }

  const benefitsAnalytics = {
    totalMembers: 42,
    averageCreditUtilization: 68,
    averageDiscountUsage: 45.50,
    totalCreditsIssued: 8400,
    totalCreditsUsed: 5712,
    totalCreditsExpired: 840,
    creditUtilizationRate: 68,
    guestPassesIssued: 24,
    guestPassesUsed: 15,
    guestPassConversionRate: 63,
    eventsHosted: 3,
    averageEventAttendance: 18,
    birthdayBonusesClaimed: 4,
    anniversaryBonusesClaimed: 2,
    referralBonusesPaid: 450,
    topUtilizers: [
      { memberId: 'mem_003', clientName: 'Emily Chen', score: 95 },
      { memberId: 'mem_005', clientName: 'Priya Sharma', score: 88 },
    ],
    underUtilizers: [
      { memberId: 'mem_010', clientName: 'Tom Wilson', score: 15 },
      { memberId: 'mem_011', clientName: 'Lisa Brown', score: 22 },
    ],
    utilizationByTier: { halo: 55, glow: 72, elite: 85 },
  };

  return { dashboard, mrrMovements, benefitsAnalytics };
}

function buildMemberListData() {
  const members = getMockRetentionProfiles().map(p => ({
    memberId: p.memberId,
    clientId: p.clientId,
    clientName: p.clientName,
    email: `${p.clientName.toLowerCase().replace(/\s/g, '.')}@example.com`,
    tier: p.tier,
    status: p.status,
    joinDate: p.joinDate,
    monthlyRate: PLANS[p.tier].monthlyPrice,
    creditUsageRate: p.creditUsageRate,
    churnRisk: p.churnRisk,
    churnScore: p.churnScore,
    lastVisitDate: p.lastVisitDate,
  }));

  const tierCounts: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };
  members.forEach(m => { if (m.status === 'active') tierCounts[m.tier]++; });

  return { members, total: members.length, tierCounts, statusCounts: { active: 42, paused: 3, suspended: 1, past_due: 2, cancelled: 0, pending: 0, trialing: 0 } };
}

// ── Mock Data Generators ─────────────────────────────────────────────────

function getMockMembers(): MemberRecord[] {
  const now = new Date();
  return [
    { memberId: 'mem_001', clientId: 'c_001', clientName: 'Sarah Mitchell', tier: 'glow', billingCycle: 'monthly', status: 'active', monthlyRate: 249, joinDate: '2025-10-15', additionalRevenue: 120 },
    { memberId: 'mem_002', clientId: 'c_002', clientName: 'James Rodriguez', tier: 'halo', billingCycle: 'monthly', status: 'active', monthlyRate: 149, joinDate: '2025-11-01', additionalRevenue: 50 },
    { memberId: 'mem_003', clientId: 'c_003', clientName: 'Emily Chen', tier: 'elite', billingCycle: 'annual', status: 'active', monthlyRate: 449, joinDate: '2025-08-20', additionalRevenue: 300 },
    { memberId: 'mem_004', clientId: 'c_004', clientName: 'Anika Patel', tier: 'halo', billingCycle: 'monthly', status: 'active', monthlyRate: 149, joinDate: '2025-12-01', additionalRevenue: 0 },
    { memberId: 'mem_005', clientId: 'c_005', clientName: 'Priya Sharma', tier: 'elite', billingCycle: 'annual', status: 'active', monthlyRate: 449, joinDate: '2025-07-15', additionalRevenue: 200 },
    { memberId: 'mem_006', clientId: 'c_006', clientName: 'David Park', tier: 'glow', billingCycle: 'monthly', status: 'active', monthlyRate: 249, joinDate: '2025-09-10', additionalRevenue: 80 },
    { memberId: 'mem_007', clientId: 'c_007', clientName: 'Maria Santos', tier: 'glow', billingCycle: 'annual', status: 'active', monthlyRate: 249, joinDate: '2026-01-05', additionalRevenue: 100 },
    { memberId: 'mem_008', clientId: 'c_008', clientName: 'Rachel Kim', tier: 'halo', billingCycle: 'monthly', status: 'paused', monthlyRate: 149, joinDate: '2025-11-20', additionalRevenue: 0 },
    { memberId: 'mem_009', clientId: 'c_009', clientName: 'Tom Wilson', tier: 'halo', billingCycle: 'monthly', status: 'active', monthlyRate: 149, joinDate: '2026-02-01', additionalRevenue: 25 },
    { memberId: 'mem_010', clientId: 'c_010', clientName: 'Lisa Brown', tier: 'glow', billingCycle: 'monthly', status: 'active', monthlyRate: 249, joinDate: '2025-06-15', additionalRevenue: 150 },
  ];
}

function getMockEvents(): RevenueEvent[] {
  return [
    { memberId: 'mem_001', type: 'new', amount: 249, date: '2025-10-15', tier: 'glow' },
    { memberId: 'mem_002', type: 'new', amount: 149, date: '2025-11-01', tier: 'halo' },
    { memberId: 'mem_003', type: 'new', amount: 449, date: '2025-08-20', tier: 'elite' },
    { memberId: 'mem_006', type: 'upgrade', amount: 100, date: '2026-01-15', tier: 'glow', previousTier: 'halo' },
    { memberId: 'mem_007', type: 'new', amount: 249, date: '2026-01-05', tier: 'glow' },
    { memberId: 'mem_009', type: 'new', amount: 149, date: '2026-02-01', tier: 'halo' },
    { memberId: 'mem_003', type: 'add_on', amount: 75, date: '2026-03-10', tier: 'elite' },
  ];
}

function getMockRetentionProfiles(): MemberRetentionProfile[] {
  return [
    {
      memberId: 'mem_001', clientId: 'c_001', clientName: 'Sarah Mitchell', tier: 'glow', status: 'active',
      joinDate: '2025-10-15', monthsAsMember: 5, engagementScore: 72, engagementTrend: 'stable',
      creditUsageRate: 80, visitFrequency: 1.5, addOnPurchases: 2, lastVisitDate: '2026-03-10',
      daysSinceLastVisit: 16, churnRisk: 'low', churnScore: 18,
      riskFactors: [{ factor: 'Engagement', score: 28, weight: 35, detail: 'Good engagement', severity: 'low' }],
      paymentIssues: false, failedPaymentCount: 0, surveysDue: [], retentionActions: [],
    },
    {
      memberId: 'mem_002', clientId: 'c_002', clientName: 'James Rodriguez', tier: 'halo', status: 'active',
      joinDate: '2025-11-01', monthsAsMember: 4, engagementScore: 35, engagementTrend: 'declining',
      creditUsageRate: 25, visitFrequency: 0.5, addOnPurchases: 0, lastVisitDate: '2026-02-05',
      daysSinceLastVisit: 49, churnRisk: 'high', churnScore: 68,
      riskFactors: [
        { factor: 'Engagement', score: 65, weight: 35, detail: 'Low engagement', severity: 'high' },
        { factor: 'Credit Usage', score: 75, weight: 20, detail: 'Only 25% credits used', severity: 'high' },
        { factor: 'Visit Recency', score: 50, weight: 10, detail: '49 days since last visit', severity: 'medium' },
      ],
      paymentIssues: true, failedPaymentCount: 1, surveysDue: [90], retentionActions: [],
    },
    {
      memberId: 'mem_004', clientId: 'c_004', clientName: 'Anika Patel', tier: 'halo', status: 'active',
      joinDate: '2025-12-01', monthsAsMember: 3, engagementScore: 20, engagementTrend: 'declining',
      creditUsageRate: 10, visitFrequency: 0.3, addOnPurchases: 0, lastVisitDate: '2026-01-15',
      daysSinceLastVisit: 70, churnRisk: 'critical', churnScore: 82,
      riskFactors: [
        { factor: 'Engagement', score: 80, weight: 35, detail: 'Very low engagement', severity: 'high' },
        { factor: 'Credit Usage', score: 90, weight: 20, detail: 'Only 10% credits used', severity: 'high' },
        { factor: 'Visit Recency', score: 70, weight: 10, detail: '70 days since last visit', severity: 'high' },
      ],
      paymentIssues: false, failedPaymentCount: 0, surveysDue: [90], retentionActions: [],
    },
    {
      memberId: 'mem_003', clientId: 'c_003', clientName: 'Emily Chen', tier: 'elite', status: 'active',
      joinDate: '2025-08-20', monthsAsMember: 7, engagementScore: 92, engagementTrend: 'improving',
      creditUsageRate: 95, visitFrequency: 2.5, addOnPurchases: 5, lastVisitDate: '2026-03-22',
      daysSinceLastVisit: 4, churnRisk: 'low', churnScore: 8,
      riskFactors: [{ factor: 'Engagement', score: 8, weight: 35, detail: 'Excellent engagement', severity: 'low' }],
      paymentIssues: false, failedPaymentCount: 0, surveysDue: [], retentionActions: [],
    },
    {
      memberId: 'mem_005', clientId: 'c_005', clientName: 'Priya Sharma', tier: 'elite', status: 'active',
      joinDate: '2025-07-15', monthsAsMember: 8, engagementScore: 88, engagementTrend: 'stable',
      creditUsageRate: 90, visitFrequency: 2, addOnPurchases: 3, lastVisitDate: '2026-03-18',
      daysSinceLastVisit: 8, churnRisk: 'low', churnScore: 12,
      riskFactors: [{ factor: 'Engagement', score: 12, weight: 35, detail: 'Strong engagement', severity: 'low' }],
      paymentIssues: false, failedPaymentCount: 0, surveysDue: [], retentionActions: [],
    },
    {
      memberId: 'mem_010', clientId: 'c_010', clientName: 'Lisa Brown', tier: 'glow', status: 'active',
      joinDate: '2025-06-15', monthsAsMember: 9, engagementScore: 45, engagementTrend: 'declining',
      creditUsageRate: 40, visitFrequency: 0.8, addOnPurchases: 1, lastVisitDate: '2026-02-20',
      daysSinceLastVisit: 34, churnRisk: 'moderate', churnScore: 42,
      riskFactors: [
        { factor: 'Visit Recency', score: 30, weight: 10, detail: '34 days since last visit', severity: 'medium' },
        { factor: 'Credit Usage', score: 60, weight: 20, detail: '40% credits used', severity: 'medium' },
      ],
      paymentIssues: false, failedPaymentCount: 0, surveysDue: [365], retentionActions: [],
    },
  ];
}
