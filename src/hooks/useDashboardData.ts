'use client';

import { useCallback, useRef } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

/* ─── Custom Error with status code + response body ────────────────── */

export class FetchError extends Error {
  status: number;
  info?: unknown;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.info = info;
  }
}

/* ─── Fetcher with structured error handling ───────────────────────── */

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    let info: unknown;
    try {
      info = await res.json();
    } catch {
      // Response body isn't JSON
    }

    if (res.status === 401 || res.status === 403) {
      throw new FetchError('Unauthorized - session may have expired', res.status, info);
    }
    if (res.status >= 500) {
      throw new FetchError('Server error - please try again shortly', res.status, info);
    }
    throw new FetchError(
      `Failed to fetch data (${res.status})`,
      res.status,
      info,
    );
  }

  return res.json();
};

/* ─── Core hook with enhanced return shape ─────────────────────────── */

export interface UseDashboardDataReturn<T> {
  data: T | undefined;
  error: FetchError | Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  /** True when we have stale data and are fetching fresh data in the background */
  isRefreshing: boolean;
  /** True when data has loaded at least once (even if currently errored) */
  hasData: boolean;
  /** True when data is empty (undefined/null or empty array/object) */
  isEmpty: boolean;
  /** Trigger a manual revalidation */
  mutate: () => void;
  /** Convenience retry that also resets error state */
  retry: () => void;
}

export function useDashboardData<T>(
  endpoint: string | null,
  config?: SWRConfiguration,
): UseDashboardDataReturn<T> {
  const hadDataRef = useRef(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    endpoint ? `/api/dashboard${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      // Keep showing stale data while revalidating
      keepPreviousData: true,
      // Exponential back-off retry: 1s, 3s, 10s then stop
      errorRetryCount: 3,
      onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
        // Don't retry on auth errors
        if (err instanceof FetchError && (err.status === 401 || err.status === 403)) return;
        // Exponential back-off
        const delay = Math.min(1000 * Math.pow(3, retryCount), 10000);
        setTimeout(() => revalidate({ retryCount }), delay);
      },
      ...config,
    },
  );

  // Track whether we ever had data
  if (data !== undefined) hadDataRef.current = true;

  const isRefreshing = isValidating && !isLoading && data !== undefined;

  // Detect empty data
  const isEmpty = data !== undefined && (
    data === null ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && data !== null && Object.keys(data).length === 0)
  );

  const retry = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    isRefreshing,
    hasData: hadDataRef.current,
    isEmpty,
    mutate: retry,
    retry,
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

export function useAgentCouncil() {
  return useDashboardData('/agents', {
    refreshInterval: 300000,
  });
}

export function useAgentCouncilAgent(agentId: string | null) {
  return useDashboardData(agentId ? `/agents/${agentId}` : null, {
    refreshInterval: 300000,
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

export function useGLP1Program() {
  return useDashboardData('/glp1', {
    refreshInterval: 60000, // 1 min
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

// ── Loyalty & Referral Hooks ──

export function useLoyaltyAnalytics() {
  return useDashboardData('/loyalty?action=analytics', {
    refreshInterval: 120000, // 2 min
  });
}

export function useLoyaltyMember(clientId: string | null) {
  return useDashboardData(clientId ? `/loyalty?action=member&clientId=${clientId}` : null, {
    refreshInterval: 300000, // 5 min
  });
}

export function useReferralDashboard() {
  return useDashboardData('/referrals', {
    refreshInterval: 120000, // 2 min
  });
}

export function useReferrerData(referrerId: string | null) {
  return useDashboardData(referrerId ? `/referrals?referrerId=${referrerId}` : null, {
    refreshInterval: 120000, // 2 min
  });
}

// ── Communication Hub Hooks ──

export function useInbox(filters?: { status?: string; channel?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.channel) params.set('channel', filters.channel);
  const query = params.toString();
  return useDashboardData(`/communications/inbox${query ? `?${query}` : ''}`, {
    refreshInterval: 15000, // 15s for real-time inbox
  });
}

export function useCampaigns(status?: string) {
  return useDashboardData(`/communications/campaigns${status ? `?status=${status}` : ''}`, {
    refreshInterval: 60000,
  });
}

export function useCampaignDetail(id: string | null) {
  return useDashboardData(id ? `/communications/campaigns/${id}` : null, {
    refreshInterval: 30000,
  });
}

export function useTemplates(category?: string) {
  return useDashboardData(`/communications/templates${category ? `?category=${category}` : ''}`, {
    refreshInterval: 300000, // 5 min
  });
}

export function useCommunicationAnalytics(range?: string) {
  return useDashboardData(`/communications/analytics${range ? `?range=${range}` : ''}`, {
    refreshInterval: 120000, // 2 min
  });
}

export function useCommunicationPreferences() {
  return useDashboardData('/communications/preferences', {
    refreshInterval: 300000, // 5 min
  });
}

// ── Financial Command Center Hooks ──

export function useFinanceOverview() {
  return useDashboardData('/finance/overview', {
    refreshInterval: 120000, // 2 min
  });
}

export function useRevenueForecast(horizon?: number) {
  const params = horizon ? `?horizon=${horizon}` : '';
  return useDashboardData(`/finance/forecast${params}`, {
    refreshInterval: 300000, // 5 min
  });
}

export function useCashFlow() {
  return useDashboardData('/finance/cash-flow', {
    refreshInterval: 300000, // 5 min
  });
}

export function useTaxPlanning() {
  return useDashboardData('/finance/tax', {
    refreshInterval: 300000, // 5 min
  });
}

export function usePricingIntelligence() {
  return useDashboardData('/finance/pricing-intel', {
    refreshInterval: 300000, // 5 min
  });
}

export function useInvestmentAnalysis(type?: string) {
  const params = type ? `?type=${type}` : '';
  return useDashboardData(`/finance/investments${params}`, {
    refreshInterval: 300000, // 5 min
  });
}

// ── QuickBooks Online Integration Hooks ──

export function useQBOConnectionStatus() {
  return useDashboardData('/integrations/quickbooks/auth?action=status', {
    refreshInterval: 60000, // 1 min
  });
}

export function useQBOSyncStatus() {
  return useDashboardData('/integrations/quickbooks/sync?action=status', {
    refreshInterval: 10000, // 10s while syncing
  });
}

export function useQBOTransactions(filters?: {
  type?: 'income' | 'expense';
  category?: string;
  start?: string;
  end?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({ action: 'transactions' });
  if (filters?.type) params.set('type', filters.type);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.start) params.set('start', filters.start);
  if (filters?.end) params.set('end', filters.end);
  if (filters?.limit) params.set('limit', String(filters.limit));
  return useDashboardData(`/integrations/quickbooks/sync?${params.toString()}`, {
    refreshInterval: 60000,
  });
}

export function useQBOReport(
  report: string,
  options?: { period?: string; offset?: number; startDate?: string; endDate?: string },
) {
  const params = new URLSearchParams({ report });
  if (options?.period) params.set('period', options.period);
  if (options?.offset !== undefined) params.set('offset', String(options.offset));
  if (options?.startDate) params.set('startDate', options.startDate);
  if (options?.endDate) params.set('endDate', options.endDate);
  return useDashboardData(`/integrations/quickbooks/reports?${params.toString()}`, {
    refreshInterval: 300000, // 5 min
  });
}

export function useQBOPnL(period: 'monthly' | 'quarterly' | 'annual' = 'monthly', offset = 0) {
  return useQBOReport('pnl', { period, offset });
}

export function useQBOBalanceSheet(asOfDate?: string) {
  return useQBOReport('balance-sheet', { endDate: asOfDate });
}

export function useQBOCashFlow(period: 'monthly' | 'quarterly' | 'annual' = 'monthly') {
  return useQBOReport('cash-flow', { period });
}

export function useQBOExpenseBreakdown(period: 'monthly' | 'quarterly' | 'annual' = 'monthly') {
  return useQBOReport('expenses', { period });
}

export function useQBOBudgetVsActual(months = 6) {
  return useDashboardData(`/integrations/quickbooks/reports?report=budget&months=${months}`, {
    refreshInterval: 300000,
  });
}

export function useQBOPayroll(startDate?: string, endDate?: string) {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || now.toISOString().split('T')[0];
  return useQBOReport('payroll', { startDate: start, endDate: end });
}

export function useQBOProviderProfitability(period: 'monthly' | 'quarterly' | 'annual' = 'monthly') {
  return useQBOReport('providers', { period });
}

export function useQBOFinancialSummary(startDate?: string, endDate?: string) {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || now.toISOString().split('T')[0];
  return useQBOReport('summary', { startDate: start, endDate: end });
}

// ── Marketing Intelligence Hooks ──

export function useMarketingOverview() {
  return useDashboardData('/marketing', {
    refreshInterval: 120000, // 2 min
  });
}

export function useLeadScoring() {
  return useDashboardData('/marketing/leads', {
    refreshInterval: 60000, // 1 min
  });
}

export function useMarketingAttribution() {
  return useDashboardData('/marketing/attribution', {
    refreshInterval: 300000, // 5 min
  });
}

export function useContentCalendar(period: '30_day' | '60_day' | '90_day' = '30_day') {
  return useDashboardData(`/marketing/content?period=${period}`, {
    refreshInterval: 300000, // 5 min
  });
}

export function useReviewManagement() {
  return useDashboardData('/marketing/reviews', {
    refreshInterval: 300000, // 5 min
  });
}

export function useSEOMonitor() {
  return useDashboardData('/marketing/seo', {
    refreshInterval: 300000, // 5 min
  });
}

// ── Revenue Optimizer Hooks ──

export function useRevenueGaps(range: '7' | '14' | '30' = '14') {
  return useDashboardData(`/revenue-optimizer/gaps?range=${range}`, {
    refreshInterval: 120000, // 2 min
  });
}

export function useUpsellAnalysis(clientId?: string) {
  return useDashboardData(
    clientId ? `/revenue-optimizer/upsells?clientId=${clientId}` : '/revenue-optimizer/upsells',
    { refreshInterval: 300000 },
  );
}

export function usePricingOptimizer() {
  return useDashboardData('/revenue-optimizer/pricing', {
    refreshInterval: 300000, // 5 min
  });
}

export function useRetentionAnalysis() {
  return useDashboardData('/revenue-optimizer/retention', {
    refreshInterval: 120000, // 2 min
  });
}

export function useRevenueOptimizerForecast() {
  return useDashboardData('/revenue-optimizer/forecast', {
    refreshInterval: 300000, // 5 min
  });
}

export function useOpportunityScorer() {
  return useDashboardData('/revenue-optimizer/opportunities', {
    refreshInterval: 60000, // 1 min
  });
}

export function useRevenueOptimizerSummary() {
  return useDashboardData('/revenue-optimizer', {
    refreshInterval: 60000, // 1 min
  });
}

export function useDailyActions() {
  return useDashboardData('/revenue-optimizer/actions', {
    refreshInterval: 60000, // 1 min
  });
}
