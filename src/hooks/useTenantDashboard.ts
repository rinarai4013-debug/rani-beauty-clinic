/**
 * RaniOS Tenant Dashboard SWR Hooks
 *
 * All hooks call /api/tenant/* endpoints, scoped to the authenticated tenant.
 * Uses the same FetchError and fetcher pattern as the main dashboard hooks.
 */

'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import type { TenantOverviewData, AlertSummary, ClinicHealthScore } from '@/lib/saas/tenant-dashboard/overview';
import type { ClientListResult, ClientListOptions, Client360, SegmentDistribution, ClientListItem } from '@/lib/saas/tenant-dashboard/clients';
import type { CalendarData, CalendarView, NoShowPrediction, ScheduleOptimization } from '@/lib/saas/tenant-dashboard/schedule';
import type { RevenueBreakdown, RevenueTrend, AnomalyReport, PnLSummary, CashFlowOverview } from '@/lib/saas/tenant-dashboard/revenue';
import type { AIEngineHub, ChurnDashboard, PricingDashboard } from '@/lib/saas/tenant-dashboard/ai-engines';
import type { InboxSummary, MessageTemplate, ReviewSummary } from '@/lib/saas/tenant-dashboard/communications';
import type { ReportDefinition } from '@/lib/saas/tenant-dashboard/reports';
import type { IntegrationHub } from '@/lib/saas/tenant-dashboard/integrations';

// ─── Fetcher ────────────────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`Failed to fetch: ${res.status}`), { status: res.status, info });
  }
  return res.json();
};

function useTenantData<T>(endpoint: string | null, config?: SWRConfiguration) {
  return useSWR<T>(endpoint ? `/api/tenant${endpoint}` : null, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    ...config,
  });
}

// ─── Overview Hooks ─────────────────────────────────────────────────────────

export function useTenantDashboard(endpoint: string) {
  return useTenantData<TenantOverviewData>(endpoint, { refreshInterval: 30000 });
}

export function useTenantAlerts() {
  return useTenantData<AlertSummary>('/alerts', { refreshInterval: 30000 });
}

export function useTenantHealthScore() {
  return useTenantData<ClinicHealthScore>('/health-score', { refreshInterval: 30000 });
}

// ─── Client Hooks ───────────────────────────────────────────────────────────

export function useTenantClients(options?: ClientListOptions) {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));
  if (options?.sort) {
    params.set('sortField', options.sort.field);
    params.set('sortDir', options.sort.direction);
  }
  if (options?.filters?.search) params.set('search', options.filters.search);
  if (options?.filters?.status?.length) params.set('status', options.filters.status.join(','));
  const qs = params.toString();
  return useTenantData<ClientListResult>(`/clients${qs ? `?${qs}` : ''}`, { refreshInterval: 60000 });
}

export function useTenantClient360(clientId: string) {
  return useTenantData<Client360>(clientId ? `/clients/${clientId}` : null, { refreshInterval: 60000 });
}

export function useTenantSegments() {
  return useTenantData<SegmentDistribution[]>('/clients/segments', { refreshInterval: 120000 });
}

export function useTenantAtRiskClients() {
  return useTenantData<ClientListItem[]>('/clients/at-risk', { refreshInterval: 120000 });
}

// ─── Schedule Hooks ─────────────────────────────────────────────────────────

export function useTenantSchedule(view: CalendarView, date: string, provider?: string) {
  const params = new URLSearchParams({ view, date });
  if (provider) params.set('provider', provider);
  return useTenantData<CalendarData>(`/schedule?${params}`, { refreshInterval: 30000 });
}

export function useTenantNoShowPredictions(date?: string) {
  const params = date ? `?date=${date}` : '';
  return useTenantData<NoShowPrediction[]>(`/schedule/no-show-risk${params}`, { refreshInterval: 60000 });
}

export function useTenantScheduleOptimization(date?: string) {
  const params = date ? `?date=${date}` : '';
  return useTenantData<ScheduleOptimization>(`/schedule/optimize${params}`, { refreshInterval: 120000 });
}

// ─── Revenue Hooks ──────────────────────────────────────────────────────────

export function useTenantRevenue(startDate: string, endDate: string) {
  return useTenantData<RevenueBreakdown>(`/revenue?start=${startDate}&end=${endDate}`, { refreshInterval: 60000 });
}

export function useTenantRevenueTrend(days = 30) {
  return useTenantData<RevenueTrend>(`/revenue/trends?days=${days}`, { refreshInterval: 120000 });
}

export function useTenantRevenueAnomalies(days = 30) {
  return useTenantData<AnomalyReport>(`/revenue/anomalies?days=${days}`, { refreshInterval: 120000 });
}

export function useTenantPnL(startDate: string, endDate: string) {
  return useTenantData<PnLSummary>(`/revenue/pnl?start=${startDate}&end=${endDate}`, { refreshInterval: 300000 });
}

export function useTenantCashFlow() {
  return useTenantData<CashFlowOverview>('/revenue/cashflow', { refreshInterval: 300000 });
}

// ─── AI Engine Hooks ────────────────────────────────────────────────────────

export function useTenantAIHub() {
  return useTenantData<AIEngineHub>('/ai/hub', { refreshInterval: 60000 });
}

export function useTenantChurnPredictions() {
  return useTenantData<ChurnDashboard>('/ai/churn', { refreshInterval: 300000 });
}

export function useTenantDynamicPricing() {
  return useTenantData<PricingDashboard>('/ai/pricing', { refreshInterval: 300000 });
}

// ─── Communication Hooks ────────────────────────────────────────────────────

export function useTenantInbox() {
  return useTenantData<InboxSummary>('/communications/inbox', { refreshInterval: 30000 });
}

export function useTenantTemplates() {
  return useTenantData<MessageTemplate[]>('/communications/templates', { refreshInterval: 300000 });
}

export function useTenantReviews() {
  return useTenantData<ReviewSummary>('/communications/reviews', { refreshInterval: 120000 });
}

// ─── Reports Hooks ──────────────────────────────────────────────────────────

export function useTenantReports() {
  return useTenantData<ReportDefinition[]>('/reports/definitions', { refreshInterval: 600000 });
}

// ─── Integration Hooks ──────────────────────────────────────────────────────

export function useTenantIntegrations() {
  return useTenantData<IntegrationHub>('/integrations/hub', { refreshInterval: 60000 });
}
