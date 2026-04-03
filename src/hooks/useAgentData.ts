'use client';

/**
 * Agent Data Hooks
 *
 * SWR-based hooks for the agent command system.
 * Follows the exact same pattern as useDashboardData.ts.
 */

import useSWR from 'swr';
import type { AgentId, AgentReport, AgentFeed } from '@/types/agent';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Agent fetch failed: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
};

/**
 * Fetch a single agent's report.
 * Calls: GET /api/dashboard/agents/[agentId]
 */
export function useAgentReport(agentId: AgentId | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<AgentReport>(
    agentId ? `/api/dashboard/agents/${agentId}` : null,
    fetcher,
    { refreshInterval: 120_000, dedupingInterval: 30_000 }
  );

  return {
    report: data,
    error,
    isLoading,
    isRefreshing: isValidating && !!data,
    hasData: !!data,
    mutate,
    retry: () => mutate(),
  };
}

/**
 * Fetch the aggregated feed from all 12 agents.
 * Calls: GET /api/dashboard/agents/feed
 */
export function useAgentFeed() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<AgentFeed>(
    '/api/dashboard/agents/feed',
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 30_000 }
  );

  return {
    feed: data,
    error,
    isLoading,
    isRefreshing: isValidating && !!data,
    hasData: !!data,
    mutate,
    retry: () => mutate(),
  };
}
