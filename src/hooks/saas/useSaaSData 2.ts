/**
 * SWR Hooks for RaniOS SaaS Dashboard
 *
 * All hooks for the sales funnel, onboarding tracking,
 * billing management, customer health, and analytics.
 */

import useSWR, { SWRConfiguration } from 'swr';

// ─── Fetcher ──────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('API request failed');
    (error as Error & { status: number }).status = res.status;
    throw error;
  }
  return res.json();
};

// ─── Generic Hook ─────────────────────────────────────────────────

function useSaaSData<T>(
  endpoint: string | null,
  config?: SWRConfiguration
) {
  return useSWR<T>(
    endpoint ? `/api/saas${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...config,
    }
  );
}

// ─── Sales Funnel Hooks ───────────────────────────────────────────

export interface FunnelMetricsResponse {
  visitors: number;
  leads: number;
  mqls: number;
  demosBooked: number;
  demosCompleted: number;
  trialsStarted: number;
  trialsActive: number;
  paidCustomers: number;
  conversionRates: Record<string, number>;
  avgTimeToConvert: number;
  pipelineValue: number;
  pipelineVelocity: number;
}

export function useFunnelMetrics(range: string = '30d') {
  return useSaaSData<FunnelMetricsResponse>(`/funnel?range=${range}`, {
    refreshInterval: 60_000, // 1 min
  });
}

// ─── Onboarding Hooks ─────────────────────────────────────────────

export interface ProvisioningStatusResponse {
  tenantId: string;
  status: string;
  steps: { step: string; status: string }[];
}

export function useProvisioningStatus(tenantId: string | null) {
  return useSaaSData<ProvisioningStatusResponse>(
    tenantId ? `/onboarding/provision?tenantId=${tenantId}` : null,
    { refreshInterval: 5_000 } // poll every 5s during provisioning
  );
}

// ─── Billing Hooks ────────────────────────────────────────────────

// Note: Billing data is typically fetched via Stripe.js on the client
// These hooks are for the admin dashboard

export interface BillingOverviewResponse {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  dunningRecords: number;
}

export function useBillingOverview() {
  return useSaaSData<BillingOverviewResponse>('/analytics?metric=mrr', {
    refreshInterval: 120_000, // 2 min
  });
}

// ─── Health Score Hooks ───────────────────────────────────────────

export interface HealthOverviewResponse {
  summary: Record<string, number>;
  avgHealthScore: number;
  nps: number;
  churnRisk: Record<string, { count: number; mrrAtRisk: number }>;
}

export interface TenantHealthResponse {
  tenantId: string;
  healthScore: {
    overall: number;
    grade: string;
    trend: string;
    factors: Record<string, unknown>;
  };
  churnRisk: {
    riskLevel: string;
    riskScore: number;
    signals: unknown[];
    recommendedAction: string;
  };
}

export function useHealthOverview() {
  return useSaaSData<HealthOverviewResponse>('/health', {
    refreshInterval: 300_000, // 5 min
  });
}

export function useTenantHealth(tenantId: string | null) {
  return useSaaSData<TenantHealthResponse>(
    tenantId ? `/health?tenantId=${tenantId}` : null,
    { refreshInterval: 300_000 }
  );
}

// ─── Analytics Hooks ──────────────────────────────────────────────

export interface SaaSAnalyticsResponse {
  mrr: number;
  arr: number;
  nrr: number;
  customerCount: number;
  avgRevenuePerCustomer: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  churn: {
    logoChurnRate: number;
    revenueChurnRate: number;
    customersLost: number;
    mrrLost: number;
  };
  expansion: {
    expansionMRR: number;
    contractionMRR: number;
    netExpansion: number;
    addOnRevenue: number;
  };
  quickRatio: number;
  quickRatioGrade: string;
  funnel: {
    visitors: number;
    leads: number;
    trials: number;
    paidCustomers: number;
    overallConversion: number;
  };
  mrrBreakdown: Record<string, number>;
  calculatedAt: string;
}

export function useSaaSAnalytics() {
  return useSaaSData<SaaSAnalyticsResponse>('/analytics', {
    refreshInterval: 120_000, // 2 min
  });
}

export function useMRR() {
  return useSaaSData<{ mrr: number; arr: number }>('/analytics?metric=mrr', {
    refreshInterval: 60_000,
  });
}

export function useChurnMetrics() {
  return useSaaSData<{
    logoChurn: number;
    revenueChurn: number;
    customersLost: number;
    mrrLost: number;
  }>('/analytics?metric=churn', {
    refreshInterval: 300_000,
  });
}

// ─── Mutation Helpers ─────────────────────────────────────────────

export async function submitLead(data: {
  name: string;
  email: string;
  clinicName: string;
  providerCount: number;
  currentSoftware?: string;
}) {
  const res = await fetch('/api/saas/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to submit lead');
  return res.json();
}

export async function provisionTenant(data: {
  clinicName: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'starter' | 'professional' | 'enterprise';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}) {
  const res = await fetch('/api/saas/onboarding/provision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to provision tenant');
  return res.json();
}
