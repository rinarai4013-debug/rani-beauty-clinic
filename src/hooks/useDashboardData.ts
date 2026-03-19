'use client';

import useSWR, { SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch dashboard data');
    throw error;
  }
  return res.json();
};

export function useDashboardData<T>(
  endpoint: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    endpoint ? `/api/dashboard${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      ...config,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

// Pre-configured hooks for specific data needs

export function useKPIs(range: string = 'today') {
  return useDashboardData(`/kpis?range=${range}`, {
    refreshInterval: 30000, // 30s refresh
  });
}

export function useRevenueData(range: string = 'mtd') {
  return useDashboardData(`/revenue?range=${range}`, {
    refreshInterval: 60000,
  });
}

export function useLeadData() {
  return useDashboardData('/leads', {
    refreshInterval: 60000,
  });
}

export function useScheduleData() {
  return useDashboardData('/schedule', {
    refreshInterval: 30000,
  });
}

export function useAlerts() {
  return useDashboardData('/alerts', {
    refreshInterval: 30000,
  });
}

export function useClinicScore() {
  return useDashboardData('/gamification/score', {
    refreshInterval: 30000,
  });
}

export function useGamification() {
  return useDashboardData('/gamification/achievements', {
    refreshInterval: 60000,
  });
}

export function useLeaderboard() {
  return useDashboardData('/gamification/leaderboard', {
    refreshInterval: 120000,
  });
}

export function useIntegrationStatus() {
  return useDashboardData('/integrations/sync-all', {
    refreshInterval: 300000, // 5 min
  });
}

export function useClientProfile(id: string | null) {
  return useDashboardData(id ? `/clients/${id}?full=true` : null, {
    refreshInterval: 60000,
  });
}

export function useClientChurn(id: string | null) {
  return useDashboardData(id ? `/clients/${id}/churn` : null, {
    refreshInterval: 300000, // 5 min
  });
}

export function useAtRiskClients() {
  return useDashboardData('/clients/at-risk', {
    refreshInterval: 120000, // 2 min
  });
}

export function useClientRecommendations(id: string | null) {
  return useDashboardData(id ? `/clients/${id}/recommend` : null, {
    refreshInterval: 300000, // 5 min
  });
}

export function useNoShowRisk(date?: string) {
  const dateParam = date || new Date().toISOString().split('T')[0];
  return useDashboardData(`/schedule/no-show-risk?date=${dateParam}`, {
    refreshInterval: 60000,
  });
}

export function useRevenueAnomalies() {
  return useDashboardData('/revenue/anomalies', {
    refreshInterval: 120000, // 2 min
  });
}

// ── Intelligence Engine Hooks ──

export function usePricingAnalysis() {
  return useDashboardData('/pricing', {
    refreshInterval: 300000, // 5 min
  });
}

export function usePnL() {
  return useDashboardData('/finance/pnl', {
    refreshInterval: 300000, // 5 min
  });
}

export function useScheduleOptimization() {
  return useDashboardData('/schedule/optimize', {
    refreshInterval: 120000, // 2 min
  });
}

export function useInventoryIntelligence() {
  return useDashboardData('/inventory', {
    refreshInterval: 300000, // 5 min
  });
}

export function useSocialPlan() {
  return useDashboardData('/social', {
    refreshInterval: 300000, // 5 min
  });
}

export function useMetaAdsOptimizer() {
  return useDashboardData('/meta-ads/optimize', {
    refreshInterval: 300000, // 5 min
  });
}

export function useConsultCopilot() {
  return useDashboardData('/consult', {
    refreshInterval: 300000, // 5 min
  });
}

export function useKnowledgeBase() {
  return useDashboardData('/knowledge-base', {
    refreshInterval: 300000, // 5 min
  });
}

export function usePhoneAgent() {
  return useDashboardData('/phone-agent', {
    refreshInterval: 300000, // 5 min
  });
}

export function useFunnelHealth() {
  return useDashboardData('/funnel-health', {
    revalidateOnFocus: false,
    refreshInterval: 0, // Manual refresh only
  });
}

export function useReactivationList() {
  return useDashboardData('/reactivation', {
    refreshInterval: 300000, // 5 min
  });
}
