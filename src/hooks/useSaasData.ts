'use client';

import useSWR, { SWRConfiguration } from 'swr';

// ─── Fetcher ──────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch');
    (error as Error & { status: number }).status = res.status;
    throw error;
  }
  return res.json();
};

// ─── Base Hook ────────────────────────────────────────────────────

function useSaasData<T>(
  endpoint: string | null,
  config?: SWRConfiguration,
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    endpoint ? `/api/saas${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...config,
    },
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    isEmpty: !isLoading && !data,
  };
}

// ─── API Gateway Hooks ────────────────────────────────────────────

export function useGatewayStats(range?: string) {
  return useSaasData<{
    totalRequests: number;
    avgLatency: number;
    errorRate: number;
    cacheHitRate: number;
    activeCircuitBreakers: number;
    topPaths: { path: string; count: number }[];
  }>(`/admin/gateway/stats${range ? `?range=${range}` : ''}`, { refreshInterval: 30_000 });
}

export function useGatewayHealth() {
  return useSaasData<{
    status: string;
    version: string;
    uptime: number;
    services: Record<string, { name: string; status: string; latency: number; errorRate: number }>;
  }>('/admin/gateway/health', { refreshInterval: 15_000 });
}

export function useGatewayLogs(filter?: {
  tenantId?: string;
  path?: string;
  status?: number;
}) {
  const params = new URLSearchParams();
  if (filter?.tenantId) params.set('tenantId', filter.tenantId);
  if (filter?.path) params.set('path', filter.path);
  if (filter?.status) params.set('status', String(filter.status));
  const query = params.toString();
  return useSaasData(`/admin/gateway/logs${query ? `?${query}` : ''}`, { refreshInterval: 10_000 });
}

// ─── Metering Hooks ───────────────────────────────────────────────

export function useUsageSummary(tenantId: string, period?: string) {
  return useSaasData<{
    metrics: Record<string, { current: number; limit: number; percentage: number; overage: number; overageCost: number }>;
    totalCost: number;
    overageCost: number;
  }>(`/metering/summary?tenantId=${tenantId}${period ? `&period=${period}` : ''}`, { refreshInterval: 60_000 });
}

export function useUsageTrends(tenantId: string, metric: string, days?: number) {
  return useSaasData(`/metering/trends?tenantId=${tenantId}&metric=${metric}${days ? `&days=${days}` : ''}`, { refreshInterval: 300_000 });
}

export function useOverageAlerts(tenantId?: string) {
  return useSaasData(`/metering/alerts${tenantId ? `?tenantId=${tenantId}` : ''}`, { refreshInterval: 30_000 });
}

export function useBilling(tenantId: string) {
  return useSaasData(`/metering/billing?tenantId=${tenantId}`, { refreshInterval: 300_000 });
}

export function useMeteringDashboard(tenantId: string) {
  return useSaasData(`/metering/dashboard?tenantId=${tenantId}`, { refreshInterval: 30_000 });
}

// ─── API Keys Hooks ───────────────────────────────────────────────

export function useApiKeys(tenantId: string) {
  return useSaasData(`/keys?tenantId=${tenantId}`, { refreshInterval: 60_000 });
}

export function useApiKeyUsage(keyId: string, days?: number) {
  return useSaasData(`/keys/${keyId}/usage${days ? `?days=${days}` : ''}`, { refreshInterval: 60_000 });
}

export function useApiKeyAudit(tenantId: string) {
  return useSaasData(`/keys/audit?tenantId=${tenantId}`, { refreshInterval: 60_000 });
}

export function useWebhookKeys(tenantId: string) {
  return useSaasData(`/keys/webhook?tenantId=${tenantId}`);
}

// ─── Notification Hooks ───────────────────────────────────────────

export function useNotifications(tenantId: string, filter?: { userId?: string; category?: string; read?: boolean }) {
  const params = new URLSearchParams({ tenantId });
  if (filter?.userId) params.set('userId', filter.userId);
  if (filter?.category) params.set('category', filter.category);
  if (filter?.read !== undefined) params.set('read', String(filter.read));
  return useSaasData(`/notifications?${params.toString()}`, { refreshInterval: 15_000 });
}

export function useUnreadCount(tenantId: string, userId?: string) {
  return useSaasData<{ unreadCount: number }>(
    `/notifications/unread?tenantId=${tenantId}${userId ? `&userId=${userId}` : ''}`,
    { refreshInterval: 10_000 },
  );
}

export function useNotificationPreferences(tenantId: string, userId: string) {
  return useSaasData(`/notifications/preferences?tenantId=${tenantId}&userId=${userId}`);
}

export function useNotificationTemplates(category?: string) {
  return useSaasData(`/notifications/templates${category ? `?category=${category}` : ''}`);
}

// ─── Feature Flags Hooks ──────────────────────────────────────────

export function useFeatureFlags(filter?: { tag?: string; type?: string; enabled?: boolean }) {
  const params = new URLSearchParams();
  if (filter?.tag) params.set('tag', filter.tag);
  if (filter?.type) params.set('type', filter.type);
  if (filter?.enabled !== undefined) params.set('enabled', String(filter.enabled));
  const query = params.toString();
  return useSaasData(`/flags${query ? `?${query}` : ''}`);
}

export function useFeatureFlag(key: string) {
  return useSaasData(`/flags/${key}`);
}

export function useFlagEvaluation(tenantId: string, tier: string) {
  return useSaasData(`/flags/evaluate?tenantId=${tenantId}&tier=${tier}`, { refreshInterval: 60_000 });
}

export function useFlagDashboard() {
  return useSaasData('/flags/dashboard', { refreshInterval: 30_000 });
}

export function useAbTestResults(flagKey: string) {
  return useSaasData(`/flags/${flagKey}/ab-results`);
}

// ─── Data Export/Import Hooks ─────────────────────────────────────

export function useExportHistory(tenantId: string) {
  return useSaasData(`/data/exports?tenantId=${tenantId}`, { refreshInterval: 30_000 });
}

export function useExportStatus(exportId: string) {
  return useSaasData(`/data/exports/${exportId}`, { refreshInterval: 5_000 });
}

export function useScheduledExports(tenantId: string) {
  return useSaasData(`/data/exports/scheduled?tenantId=${tenantId}`);
}

export function useImportHistory(tenantId: string) {
  return useSaasData(`/data/imports?tenantId=${tenantId}`);
}

export function useGdprRequests(tenantId: string) {
  return useSaasData(`/data/gdpr?tenantId=${tenantId}`);
}

// ─── Audit Log Hooks ──────────────────────────────────────────────

export function useAuditLog(filter?: {
  tenantId?: string;
  userId?: string;
  action?: string;
  severity?: string;
  searchText?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filter?.tenantId) params.set('tenantId', filter.tenantId);
  if (filter?.userId) params.set('userId', filter.userId);
  if (filter?.action) params.set('action', filter.action);
  if (filter?.severity) params.set('severity', filter.severity);
  if (filter?.searchText) params.set('search', filter.searchText);
  if (filter?.limit) params.set('limit', String(filter.limit));
  const query = params.toString();
  return useSaasData(`/audit${query ? `?${query}` : ''}`, { refreshInterval: 15_000 });
}

export function useAuditStats(tenantId: string, days?: number) {
  return useSaasData(`/audit/stats?tenantId=${tenantId}${days ? `&days=${days}` : ''}`);
}

export function useAuditAnomalies(tenantId: string) {
  return useSaasData(`/audit/anomalies?tenantId=${tenantId}`, { refreshInterval: 30_000 });
}

// ─── Marketplace Hooks ────────────────────────────────────────────

export function useMarketplacePlugins(filter?: { category?: string; search?: string; sort?: string }) {
  const params = new URLSearchParams();
  if (filter?.category) params.set('category', filter.category);
  if (filter?.search) params.set('search', filter.search);
  if (filter?.sort) params.set('sort', filter.sort);
  const query = params.toString();
  return useSaasData(`/marketplace/plugins${query ? `?${query}` : ''}`);
}

export function usePluginDetails(pluginId: string) {
  return useSaasData(`/marketplace/plugins/${pluginId}`);
}

export function useTenantPlugins(tenantId: string) {
  return useSaasData(`/marketplace/installations?tenantId=${tenantId}`);
}

export function useMarketplaceStats() {
  return useSaasData('/marketplace/stats', { refreshInterval: 60_000 });
}

export function usePluginReviews(pluginId: string) {
  return useSaasData(`/marketplace/plugins/${pluginId}/reviews`);
}

// ─── White Label Hooks ────────────────────────────────────────────

export function useBrandConfig(tenantId: string) {
  return useSaasData(`/branding?tenantId=${tenantId}`);
}

export function useBrandPreview(tenantId: string) {
  return useSaasData(`/branding/preview?tenantId=${tenantId}`);
}

export function useDomainStatus(tenantId: string) {
  return useSaasData(`/branding/domain?tenantId=${tenantId}`, { refreshInterval: 30_000 });
}

export function useAvailableFonts() {
  return useSaasData('/branding/fonts');
}
