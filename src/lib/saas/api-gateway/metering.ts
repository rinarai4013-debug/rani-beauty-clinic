/**
 * RaniOS Usage Metering
 *
 * Tracks API calls, AI engine usage, SMS/email sends, storage,
 * active users, overage detection, billing calculation,
 * historical trends, and usage forecasting per tenant.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type MetricType =
  | 'api_calls'
  | 'ai_tokens'
  | 'sms_sends'
  | 'email_sends'
  | 'storage_bytes'
  | 'active_users'
  | 'webhook_deliveries'
  | 'file_uploads'
  | 'report_generations'
  | 'integrations_syncs';

export type TenantTier = 'starter' | 'pro' | 'enterprise';

export type UsagePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

export type OverageAction = 'throttle' | 'block' | 'charge' | 'notify_only';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface TierLimits {
  api_calls: number;
  ai_tokens: number;
  sms_sends: number;
  email_sends: number;
  storage_bytes: number;
  active_users: number;
  webhook_deliveries: number;
  file_uploads: number;
  report_generations: number;
  integrations_syncs: number;
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  metric: MetricType;
  value: number;
  metadata: Record<string, unknown>;
  timestamp: number;
  period: UsagePeriod;
}

export interface UsageSummary {
  tenantId: string;
  period: UsagePeriod;
  periodStart: number;
  periodEnd: number;
  metrics: Record<MetricType, {
    current: number;
    limit: number;
    percentage: number;
    overage: number;
    overageCost: number;
  }>;
  totalCost: number;
  overageCost: number;
}

export interface UsageTrend {
  metric: MetricType;
  dataPoints: { timestamp: number; value: number }[];
  average: number;
  peak: number;
  growth: number; // percentage change from start to end
  forecast: number[]; // next 7 data points
}

export interface OverageAlert {
  id: string;
  tenantId: string;
  metric: MetricType;
  threshold: number; // percentage of limit
  currentUsage: number;
  limit: number;
  severity: AlertSeverity;
  action: OverageAction;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface BillingLineItem {
  metric: MetricType;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  included: number;
  overage: number;
}

export interface UsageBill {
  tenantId: string;
  tier: TenantTier;
  period: { start: number; end: number };
  baseFee: number;
  lineItems: BillingLineItem[];
  overageTotal: number;
  totalDue: number;
  generatedAt: number;
}

export interface RealTimeDashboard {
  tenantId: string;
  currentPeriod: UsageSummary;
  alerts: OverageAlert[];
  topEndpoints: { path: string; calls: number; avgLatency: number }[];
  aiUsage: {
    totalTokens: number;
    byEngine: Record<string, number>;
    avgTokensPerCall: number;
    estimatedCost: number;
  };
  trends: UsageTrend[];
  projectedOverages: { metric: MetricType; projectedUsage: number; limit: number }[];
}

// ─── Schemas ──────────────────────────────────────────────────────

export const RecordUsageSchema = z.object({
  tenantId: z.string().min(1),
  metric: z.enum([
    'api_calls', 'ai_tokens', 'sms_sends', 'email_sends',
    'storage_bytes', 'active_users', 'webhook_deliveries',
    'file_uploads', 'report_generations', 'integrations_syncs',
  ]),
  value: z.number().min(0),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type RecordUsageInput = z.infer<typeof RecordUsageSchema>;

// ─── Constants ────────────────────────────────────────────────────

export const TIER_LIMITS: Record<TenantTier, TierLimits> = {
  starter: {
    api_calls: 10_000,
    ai_tokens: 500_000,
    sms_sends: 500,
    email_sends: 5_000,
    storage_bytes: 5 * 1024 * 1024 * 1024, // 5 GB
    active_users: 5,
    webhook_deliveries: 1_000,
    file_uploads: 100,
    report_generations: 50,
    integrations_syncs: 500,
  },
  pro: {
    api_calls: 100_000,
    ai_tokens: 2_000_000,
    sms_sends: 2_000,
    email_sends: 25_000,
    storage_bytes: 25 * 1024 * 1024 * 1024, // 25 GB
    active_users: 25,
    webhook_deliveries: 10_000,
    file_uploads: 1_000,
    report_generations: 500,
    integrations_syncs: 5_000,
  },
  enterprise: {
    api_calls: 1_000_000,
    ai_tokens: 10_000_000,
    sms_sends: 10_000,
    email_sends: 100_000,
    storage_bytes: 100 * 1024 * 1024 * 1024, // 100 GB
    active_users: -1, // unlimited
    webhook_deliveries: 100_000,
    file_uploads: 10_000,
    report_generations: -1, // unlimited
    integrations_syncs: -1, // unlimited
  },
};

export const OVERAGE_PRICING: Record<MetricType, number> = {
  api_calls: 0.001, // $0.001 per call
  ai_tokens: 0.00002, // $0.00002 per token
  sms_sends: 0.05, // $0.05 per SMS
  email_sends: 0.001, // $0.001 per email
  storage_bytes: 0.0000000001, // $0.10 per GB
  active_users: 10, // $10 per user
  webhook_deliveries: 0.0005, // $0.0005 per delivery
  file_uploads: 0.01, // $0.01 per upload
  report_generations: 0.50, // $0.50 per report
  integrations_syncs: 0.002, // $0.002 per sync
};

export const BASE_FEES: Record<TenantTier, number> = {
  starter: 199,
  pro: 499,
  enterprise: 999,
};

const OVERAGE_THRESHOLDS = [
  { percentage: 80, severity: 'info' as AlertSeverity },
  { percentage: 90, severity: 'warning' as AlertSeverity },
  { percentage: 100, severity: 'critical' as AlertSeverity },
];

// ─── In-Memory Store ──────────────────────────────────────────────

const usageRecords: UsageRecord[] = [];
const overageAlerts: OverageAlert[] = [];
const tenantTiers = new Map<string, TenantTier>();

// ─── Usage Recording ──────────────────────────────────────────────

export function recordUsage(input: RecordUsageInput): UsageRecord {
  const record: UsageRecord = {
    id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    metric: input.metric,
    value: input.value,
    metadata: input.metadata || {},
    timestamp: Date.now(),
    period: 'monthly',
  };

  usageRecords.push(record);

  // Keep last 100K records in memory
  if (usageRecords.length > 100_000) {
    usageRecords.splice(0, usageRecords.length - 100_000);
  }

  // Check for overage
  checkOverage(input.tenantId, input.metric);

  return record;
}

export function recordApiCall(
  tenantId: string,
  path: string,
  latency: number,
): void {
  recordUsage({
    tenantId,
    metric: 'api_calls',
    value: 1,
    metadata: { path, latency },
  });
}

export function recordAiUsage(
  tenantId: string,
  engine: string,
  tokensConsumed: number,
  cost: number,
): void {
  recordUsage({
    tenantId,
    metric: 'ai_tokens',
    value: tokensConsumed,
    metadata: { engine, cost },
  });
}

export function recordSmsSend(
  tenantId: string,
  recipient: string,
  segments: number,
): void {
  recordUsage({
    tenantId,
    metric: 'sms_sends',
    value: segments,
    metadata: { recipient: recipient.substring(0, 6) + '***' },
  });
}

export function recordEmailSend(
  tenantId: string,
  templateId: string,
  recipientCount: number,
): void {
  recordUsage({
    tenantId,
    metric: 'email_sends',
    value: recipientCount,
    metadata: { templateId },
  });
}

export function recordStorageUsage(
  tenantId: string,
  bytes: number,
  operation: 'upload' | 'delete',
): void {
  recordUsage({
    tenantId,
    metric: 'storage_bytes',
    value: operation === 'upload' ? bytes : -bytes,
    metadata: { operation },
  });
}

export function recordActiveUser(
  tenantId: string,
  userId: string,
): void {
  recordUsage({
    tenantId,
    metric: 'active_users',
    value: 1,
    metadata: { userId },
  });
}

// ─── Usage Queries ────────────────────────────────────────────────

export function getCurrentUsage(
  tenantId: string,
  metric: MetricType,
  periodStart?: number,
): number {
  const start = periodStart || getMonthStart();
  return usageRecords
    .filter(r => r.tenantId === tenantId && r.metric === metric && r.timestamp >= start)
    .reduce((sum, r) => sum + r.value, 0);
}

export function getUsageSummary(
  tenantId: string,
  period: UsagePeriod = 'monthly',
): UsageSummary {
  const tier = tenantTiers.get(tenantId) || 'starter';
  const limits = TIER_LIMITS[tier];
  const { start, end } = getPeriodBounds(period);

  const metrics = {} as UsageSummary['metrics'];
  const allMetrics: MetricType[] = [
    'api_calls', 'ai_tokens', 'sms_sends', 'email_sends',
    'storage_bytes', 'active_users', 'webhook_deliveries',
    'file_uploads', 'report_generations', 'integrations_syncs',
  ];

  let totalOverageCost = 0;

  for (const metric of allMetrics) {
    const current = getCurrentUsage(tenantId, metric, start);
    const limit = limits[metric];
    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 0 : limit > 0 ? (current / limit) * 100 : 0;
    const overage = isUnlimited ? 0 : Math.max(0, current - limit);
    const overageCost = overage * OVERAGE_PRICING[metric];
    totalOverageCost += overageCost;

    metrics[metric] = {
      current,
      limit: isUnlimited ? Infinity : limit,
      percentage: Math.round(percentage * 100) / 100,
      overage,
      overageCost: Math.round(overageCost * 100) / 100,
    };
  }

  return {
    tenantId,
    period,
    periodStart: start,
    periodEnd: end,
    metrics,
    totalCost: BASE_FEES[tier] + totalOverageCost,
    overageCost: Math.round(totalOverageCost * 100) / 100,
  };
}

export function getUsageByTenant(
  metric: MetricType,
  limit: number = 20,
): { tenantId: string; usage: number }[] {
  const tenantUsage = new Map<string, number>();
  const start = getMonthStart();

  usageRecords
    .filter(r => r.metric === metric && r.timestamp >= start)
    .forEach(r => {
      tenantUsage.set(r.tenantId, (tenantUsage.get(r.tenantId) || 0) + r.value);
    });

  return Array.from(tenantUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tenantId, usage]) => ({ tenantId, usage }));
}

// ─── Overage Detection ────────────────────────────────────────────

function checkOverage(tenantId: string, metric: MetricType): void {
  const tier = tenantTiers.get(tenantId) || 'starter';
  const limits = TIER_LIMITS[tier];
  const limit = limits[metric];

  if (limit === -1) return; // Unlimited

  const current = getCurrentUsage(tenantId, metric);
  const percentage = (current / limit) * 100;

  for (const threshold of OVERAGE_THRESHOLDS) {
    if (percentage >= threshold.percentage) {
      const existingAlert = overageAlerts.find(
        a => a.tenantId === tenantId &&
             a.metric === metric &&
             a.threshold === threshold.percentage &&
             !a.acknowledged,
      );

      if (!existingAlert) {
        const alert: OverageAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          tenantId,
          metric,
          threshold: threshold.percentage,
          currentUsage: current,
          limit,
          severity: threshold.severity,
          action: threshold.percentage >= 100 ? 'charge' : 'notify_only',
          message: `${metric} usage at ${Math.round(percentage)}% of ${limit} limit`,
          timestamp: Date.now(),
          acknowledged: false,
        };
        overageAlerts.push(alert);
      }
    }
  }
}

export function getOverageAlerts(
  tenantId?: string,
  acknowledged?: boolean,
): OverageAlert[] {
  let alerts = [...overageAlerts];
  if (tenantId) alerts = alerts.filter(a => a.tenantId === tenantId);
  if (acknowledged !== undefined) alerts = alerts.filter(a => a.acknowledged === acknowledged);
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = overageAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

// ─── Billing Calculation ──────────────────────────────────────────

export function calculateBill(
  tenantId: string,
  periodStart?: number,
  periodEnd?: number,
): UsageBill {
  const tier = tenantTiers.get(tenantId) || 'starter';
  const limits = TIER_LIMITS[tier];
  const start = periodStart || getMonthStart();
  const end = periodEnd || Date.now();

  const allMetrics: MetricType[] = [
    'api_calls', 'ai_tokens', 'sms_sends', 'email_sends',
    'storage_bytes', 'active_users', 'webhook_deliveries',
    'file_uploads', 'report_generations', 'integrations_syncs',
  ];

  const lineItems: BillingLineItem[] = [];
  let overageTotal = 0;

  for (const metric of allMetrics) {
    const quantity = getCurrentUsage(tenantId, metric, start);
    const limit = limits[metric];
    const isUnlimited = limit === -1;
    const included = isUnlimited ? quantity : limit;
    const overage = isUnlimited ? 0 : Math.max(0, quantity - limit);
    const total = overage * OVERAGE_PRICING[metric];
    overageTotal += total;

    lineItems.push({
      metric,
      description: formatMetricName(metric),
      quantity,
      unitPrice: OVERAGE_PRICING[metric],
      total: Math.round(total * 100) / 100,
      included,
      overage,
    });
  }

  return {
    tenantId,
    tier,
    period: { start, end },
    baseFee: BASE_FEES[tier],
    lineItems,
    overageTotal: Math.round(overageTotal * 100) / 100,
    totalDue: BASE_FEES[tier] + Math.round(overageTotal * 100) / 100,
    generatedAt: Date.now(),
  };
}

// ─── Historical Trends ────────────────────────────────────────────

export function getUsageTrend(
  tenantId: string,
  metric: MetricType,
  days: number = 30,
): UsageTrend {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const dataPoints: { timestamp: number; value: number }[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = startTime + i * dayMs;
    const dayEnd = dayStart + dayMs;
    const value = usageRecords
      .filter(
        r => r.tenantId === tenantId &&
             r.metric === metric &&
             r.timestamp >= dayStart &&
             r.timestamp < dayEnd,
      )
      .reduce((sum, r) => sum + r.value, 0);

    dataPoints.push({ timestamp: dayStart, value });
  }

  const values = dataPoints.map(d => d.value);
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const peak = Math.max(...values, 0);

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
  const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  // Simple linear forecast
  const forecast = generateForecast(values, 7);

  return {
    metric,
    dataPoints,
    average: Math.round(average),
    peak,
    growth: Math.round(growth * 10) / 10,
    forecast,
  };
}

function generateForecast(values: number[], periods: number): number[] {
  if (values.length < 2) return Array(periods).fill(0);

  // Simple moving average + trend
  const n = values.length;
  const avgStep = (values[n - 1] - values[0]) / (n - 1);
  const lastValue = values[n - 1];

  return Array.from({ length: periods }, (_, i) =>
    Math.max(0, Math.round(lastValue + avgStep * (i + 1))),
  );
}

// ─── Usage Forecasting ────────────────────────────────────────────

export function forecastMonthEndUsage(
  tenantId: string,
  metric: MetricType,
): { projected: number; limit: number; willExceed: boolean; projectedOverageCost: number } {
  const tier = tenantTiers.get(tenantId) || 'starter';
  const limit = TIER_LIMITS[tier][metric];
  const monthStart = getMonthStart();
  const now = Date.now();
  const monthEnd = getMonthEnd();
  const elapsed = now - monthStart;
  const total = monthEnd - monthStart;
  const current = getCurrentUsage(tenantId, metric, monthStart);

  if (elapsed <= 0 || total <= 0) {
    return { projected: current, limit, willExceed: false, projectedOverageCost: 0 };
  }

  const rate = current / elapsed;
  const projected = Math.round(rate * total);
  const isUnlimited = limit === -1;
  const willExceed = !isUnlimited && projected > limit;
  const projectedOverage = willExceed ? projected - limit : 0;
  const projectedOverageCost = projectedOverage * OVERAGE_PRICING[metric];

  return {
    projected,
    limit: isUnlimited ? Infinity : limit,
    willExceed,
    projectedOverageCost: Math.round(projectedOverageCost * 100) / 100,
  };
}

// ─── Real-Time Dashboard ──────────────────────────────────────────

export function getDashboardData(tenantId: string): RealTimeDashboard {
  const currentPeriod = getUsageSummary(tenantId, 'monthly');
  const alerts = getOverageAlerts(tenantId, false);
  const monthStart = getMonthStart();

  // Top endpoints
  const endpointMap = new Map<string, { calls: number; totalLatency: number }>();
  usageRecords
    .filter(r => r.tenantId === tenantId && r.metric === 'api_calls' && r.timestamp >= monthStart)
    .forEach(r => {
      const path = (r.metadata.path as string) || 'unknown';
      const existing = endpointMap.get(path) || { calls: 0, totalLatency: 0 };
      existing.calls += 1;
      existing.totalLatency += (r.metadata.latency as number) || 0;
      endpointMap.set(path, existing);
    });

  const topEndpoints = Array.from(endpointMap.entries())
    .sort((a, b) => b[1].calls - a[1].calls)
    .slice(0, 10)
    .map(([path, data]) => ({
      path,
      calls: data.calls,
      avgLatency: Math.round(data.calls > 0 ? data.totalLatency / data.calls : 0),
    }));

  // AI usage breakdown
  const aiRecords = usageRecords.filter(
    r => r.tenantId === tenantId && r.metric === 'ai_tokens' && r.timestamp >= monthStart,
  );
  const byEngine = new Map<string, number>();
  let totalTokens = 0;
  let totalAiCost = 0;
  aiRecords.forEach(r => {
    const engine = (r.metadata.engine as string) || 'unknown';
    byEngine.set(engine, (byEngine.get(engine) || 0) + r.value);
    totalTokens += r.value;
    totalAiCost += (r.metadata.cost as number) || 0;
  });

  // Projected overages
  const allMetrics: MetricType[] = [
    'api_calls', 'ai_tokens', 'sms_sends', 'email_sends',
    'storage_bytes', 'active_users',
  ];
  const projectedOverages = allMetrics
    .map(metric => {
      const forecast = forecastMonthEndUsage(tenantId, metric);
      return { metric, projectedUsage: forecast.projected, limit: forecast.limit as number };
    })
    .filter(p => p.limit !== Infinity && p.projectedUsage > p.limit * 0.8);

  // Trends for key metrics
  const trends = ['api_calls', 'ai_tokens', 'sms_sends', 'email_sends'].map(
    metric => getUsageTrend(tenantId, metric as MetricType, 14),
  );

  return {
    tenantId,
    currentPeriod,
    alerts,
    topEndpoints,
    aiUsage: {
      totalTokens,
      byEngine: Object.fromEntries(byEngine),
      avgTokensPerCall: aiRecords.length > 0 ? Math.round(totalTokens / aiRecords.length) : 0,
      estimatedCost: Math.round(totalAiCost * 100) / 100,
    },
    trends,
    projectedOverages,
  };
}

// ─── Tenant Tier Management ───────────────────────────────────────

export function setTenantTier(tenantId: string, tier: TenantTier): void {
  tenantTiers.set(tenantId, tier);
}

export function getTenantTier(tenantId: string): TenantTier {
  return tenantTiers.get(tenantId) || 'starter';
}

// ─── Utility Functions ────────────────────────────────────────────

function getMonthStart(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function getMonthEnd(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
}

function getPeriodBounds(period: UsagePeriod): { start: number; end: number } {
  const now = Date.now();
  const d = new Date();
  switch (period) {
    case 'hourly':
      return { start: now - 60 * 60 * 1000, end: now };
    case 'daily':
      return { start: now - 24 * 60 * 60 * 1000, end: now };
    case 'weekly':
      return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
    case 'monthly':
      return { start: getMonthStart(), end: now };
    default:
      return { start: getMonthStart(), end: now };
  }
}

function formatMetricName(metric: MetricType): string {
  const names: Record<MetricType, string> = {
    api_calls: 'API Calls',
    ai_tokens: 'AI Tokens',
    sms_sends: 'SMS Messages',
    email_sends: 'Email Sends',
    storage_bytes: 'Storage',
    active_users: 'Active Users',
    webhook_deliveries: 'Webhook Deliveries',
    file_uploads: 'File Uploads',
    report_generations: 'Report Generations',
    integrations_syncs: 'Integration Syncs',
  };
  return names[metric] || metric;
}

// ─── Reset (for testing) ─────────────────────────────────────────

export function resetMetering(): void {
  usageRecords.length = 0;
  overageAlerts.length = 0;
  tenantTiers.clear();
}
