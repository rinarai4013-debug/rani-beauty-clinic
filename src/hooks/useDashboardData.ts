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
