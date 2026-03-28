'use client';

import { useDashboardData } from './useDashboardData';
import type { MembershipAnalyticsDashboard, MRRMovement } from '@/lib/membership/analytics';
import type { MemberRetentionProfile, RetentionAnalytics, RetentionAction } from '@/lib/membership/retention';
import type { BenefitsAnalyticsSummary } from '@/lib/membership/benefits';
import type { MembershipTier, MembershipStatus } from '@/lib/membership/plans';
import type { MemberBilling } from '@/lib/membership/billing';

/**
 * SWR Hooks for the Membership System — Rani Beauty Clinic
 *
 * All hooks follow the same pattern as useDashboardData:
 * - Returns { data, error, isLoading, isValidating, mutate }
 * - Auto-refreshes at the specified interval
 * - Uses the dashboard auth session cookie
 */

// ── Overview ─────────────────────────────────────────────────────────────

interface MembershipOverview {
  analytics: MembershipAnalyticsDashboard;
  atRiskMembers: MemberRetentionProfile[];
}

export function useMembershipOverview() {
  return useDashboardData<MembershipOverview>('/membership?action=overview', {
    refreshInterval: 60000, // 1 min
  });
}

// ── Plans ────────────────────────────────────────────────────────────────

interface MembershipPlansData {
  tierDistribution: Record<MembershipTier, number>;
  revenueByTier: Record<MembershipTier, number>;
  foundingMemberCounts: Record<MembershipTier, number>;
}

export function useMembershipPlans() {
  return useDashboardData<MembershipPlansData>('/membership?action=plans', {
    refreshInterval: 120000, // 2 min
  });
}

// ── Billing ──────────────────────────────────────────────────────────────

interface MembershipBillingData {
  summary: {
    totalActive: number;
    totalPaused: number;
    totalSuspended: number;
    totalPastDue: number;
    totalMRR: number;
    failedPayments: number;
    expiringCards: number;
    inGracePeriod: number;
  };
  failedPaymentMembers: (MemberBilling & { clientName: string })[];
  expiringCardMembers: (MemberBilling & { clientName: string })[];
  recentInvoices: {
    id: string;
    clientName: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export function useMembershipBilling() {
  return useDashboardData<MembershipBillingData>('/membership?action=billing', {
    refreshInterval: 60000, // 1 min
  });
}

// ── Retention ────────────────────────────────────────────────────────────

interface MembershipRetentionData {
  analytics: RetentionAnalytics;
  atRiskMembers: MemberRetentionProfile[];
  pendingActions: RetentionAction[];
  engagementOverall: {
    score: number;
    breakdown: Record<string, number>;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export function useMembershipRetention() {
  return useDashboardData<MembershipRetentionData>('/membership?action=retention', {
    refreshInterval: 120000, // 2 min
  });
}

// ── Analytics ────────────────────────────────────────────────────────────

interface MembershipAnalyticsData {
  dashboard: MembershipAnalyticsDashboard;
  mrrMovements: MRRMovement[];
  benefitsAnalytics: BenefitsAnalyticsSummary;
}

export function useMembershipAnalytics() {
  return useDashboardData<MembershipAnalyticsData>('/membership?action=analytics', {
    refreshInterval: 300000, // 5 min
  });
}

// ── Members List ─────────────────────────────────────────────────────────

interface MemberListItem {
  memberId: string;
  clientId: string;
  clientName: string;
  email: string;
  tier: MembershipTier;
  status: MembershipStatus;
  joinDate: string;
  monthlyRate: number;
  creditUsageRate: number;
  churnRisk: 'low' | 'moderate' | 'high' | 'critical';
  churnScore: number;
  lastVisitDate?: string;
}

interface MemberListData {
  members: MemberListItem[];
  total: number;
  tierCounts: Record<MembershipTier, number>;
  statusCounts: Record<MembershipStatus, number>;
}

export function useMembershipMembers() {
  return useDashboardData<MemberListData>('/membership?action=members', {
    refreshInterval: 120000, // 2 min
  });
}

// ── Member Detail ────────────────────────────────────────────────────────

export function useMemberDetail(memberId: string | null) {
  return useDashboardData<Record<string, unknown>>(
    memberId ? `/membership/members/${memberId}` : null,
    { refreshInterval: 60000 },
  );
}

// ── At-Risk Members ──────────────────────────────────────────────────────

export function useAtRiskMembers() {
  const { data, ...rest } = useMembershipOverview();
  return {
    data: data?.atRiskMembers,
    ...rest,
  };
}

// ── MRR ──────────────────────────────────────────────────────────────────

export function useMRR() {
  const { data, ...rest } = useMembershipOverview();
  return {
    data: data ? {
      mrr: data.analytics.mrr,
      mrrGrowth: data.analytics.mrrGrowth,
      arr: data.analytics.arr,
      mrrHistory: data.analytics.mrrHistory,
    } : undefined,
    ...rest,
  };
}

// ── Churn ────────────────────────────────────────────────────────────────

export function useChurnMetrics() {
  const { data, ...rest } = useMembershipOverview();
  return {
    data: data ? {
      churnRate: data.analytics.churnRate,
      atRiskCount: data.atRiskMembers.length,
    } : undefined,
    ...rest,
  };
}
