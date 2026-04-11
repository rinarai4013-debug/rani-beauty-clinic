/**
 * RaniOS SDK - Revenue Resource
 *
 * Access revenue KPIs, trend data, and anomaly detection.
 */

import type { RaniOSClient, SDKResponse } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RevenueKPIs {
  today: number;
  wtd: number;
  mtd: number;
  ytd: number;
  target: number;
  projectedMonth: number;
  avgDaily: number;
  avgTicket: number;
  topService: { name: string; revenue: number; count: number };
  topProvider: { name: string; revenue: number; count: number };
  byCategory: { category: string; revenue: number; percentage: number }[];
  byPaymentMethod: { method: string; amount: number; count: number }[];
  comparisonPeriod: {
    mtdLastMonth: number;
    mtdChange: number;
    mtdChangePercent: number;
  };
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  transactions: number;
  avgTicket: number;
  bookings: number;
}

export interface RevenueTrendsResponse {
  daily: RevenueTrend[];
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    avgDailyRevenue: number;
    avgTicketSize: number;
    bestDay: { date: string; revenue: number };
    worstDay: { date: string; revenue: number };
    trend: 'up' | 'down' | 'flat';
    trendPercent: number;
  };
}

export interface RevenueAnomaly {
  id: string;
  type: 'target_deviation' | 'rolling_avg' | 'dow_pattern' | 'provider_imbalance' | 'financing_spike';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  expected: number;
  deviation: number;
  date: string;
  details: Record<string, unknown>;
}

export interface RevenueAnomaliesResponse {
  anomalies: RevenueAnomaly[];
  healthScore: number;
  summary: string;
  projectedMonthEnd: number;
  detectionMethods: {
    method: string;
    status: 'normal' | 'warning' | 'critical';
    detail: string;
  }[];
}

export interface RevenueKPIOptions {
  range?: '7d' | '30d' | '90d' | 'mtd' | 'ytd';
}

export interface RevenueTrendOptions {
  days?: number;
  groupBy?: 'day' | 'week' | 'month';
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class RevenueResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Get revenue KPIs including daily, weekly, monthly totals,
   * targets, projections, and breakdowns by category/provider.
   *
   * @example
   * ```ts
   * const { data } = await client.revenue.getKPIs({ range: '30d' });
   * console.log(`MTD Revenue: $${data.mtd} / $${data.target} target`);
   * console.log(`Top service: ${data.topService.name} ($${data.topService.revenue})`);
   * ```
   */
  async getKPIs(options?: RevenueKPIOptions): Promise<SDKResponse<RevenueKPIs>> {
    return this.client.request<RevenueKPIs>('/revenue/kpis', {
      params: { range: options?.range },
    });
  }

  /**
   * Get revenue trend data over time.
   * Returns daily revenue, transaction counts, and average ticket size.
   *
   * @example
   * ```ts
   * const { data } = await client.revenue.getTrends({ days: 30 });
   * console.log(`Trend: ${data.summary.trend} (${data.summary.trendPercent}%)`);
   * ```
   */
  async getTrends(options?: RevenueTrendOptions): Promise<SDKResponse<RevenueTrendsResponse>> {
    return this.client.request<RevenueTrendsResponse>('/revenue/trends', {
      params: { days: options?.days, groupBy: options?.groupBy },
    });
  }

  /**
   * Get revenue anomaly detection results.
   * Uses 5 detection methods: target deviation, rolling average, day-of-week
   * pattern, provider imbalance, and financing spike detection.
   *
   * @example
   * ```ts
   * const { data } = await client.revenue.getAnomalies();
   * console.log(`Health Score: ${data.healthScore}/100`);
   * console.log(`Projected Month End: $${data.projectedMonthEnd}`);
   * data.anomalies.filter(a => a.severity === 'critical').forEach(a => {
   *   console.warn(`CRITICAL: ${a.message}`);
   * });
   * ```
   */
  async getAnomalies(): Promise<SDKResponse<RevenueAnomaliesResponse>> {
    return this.client.request<RevenueAnomaliesResponse>('/revenue/anomalies');
  }
}
