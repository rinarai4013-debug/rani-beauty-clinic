/**
 * Provider Performance Metrics Engine
 *
 * Comprehensive provider analytics: revenue tracking, client metrics,
 * service mix analysis, utilization, quality scoring, trend analysis,
 * peer comparison, and percentile ranking.
 *
 * All metrics calculated from Airtable appointment & transaction data.
 */

import type {
  PerformanceMetrics,
  ProviderRevenue,
  RevenuePerHour,
  ServiceMixAnalysis,
  ServiceMixEntry,
  ProviderComparison,
  ProviderRanking,
  TrendAnalysis,
  TrendPoint,
  TimePeriod,
} from '@/types/providers';

// ── INPUT TYPES ──

export interface PerformanceInput {
  providerId: string;
  providerName: string;
  period: TimePeriod;
  periodStart: string;
  periodEnd: string;
  appointments: AppointmentRecord[];
  transactions: TransactionRecord[];
  reviews: ReviewRecord[];
  previousPeriodRevenue?: number;
  availableHours: number;
  totalClients: number;
  returningClients: number;
  rebookedClients: number;
  newClients: number;
  newClientsThatBooked: number;
  upsellCount: number;
  totalAppointments: number;
}

export interface AppointmentRecord {
  id: string;
  date: string;
  service: string;
  category: string;
  duration: number;
  status: 'completed' | 'no_show' | 'cancelled' | 'scheduled';
  clientId: string;
  revenue: number;
  isNewClient: boolean;
}

export interface TransactionRecord {
  id: string;
  date: string;
  amount: number;
  type: 'service' | 'product' | 'membership' | 'package' | 'tip';
  service?: string;
  clientId?: string;
}

export interface ReviewRecord {
  id: string;
  date: string;
  rating: number;
  providerId: string;
}

// ── REVENUE CALCULATION ──

export function calculateProviderRevenue(input: PerformanceInput): ProviderRevenue {
  const serviceRevenue = input.transactions
    .filter(t => t.type === 'service')
    .reduce((sum, t) => sum + t.amount, 0);

  const productRevenue = input.transactions
    .filter(t => t.type === 'product')
    .reduce((sum, t) => sum + t.amount, 0);

  const membershipRevenue = input.transactions
    .filter(t => t.type === 'membership')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = serviceRevenue + productRevenue + membershipRevenue;
  const previousPeriodRevenue = input.previousPeriodRevenue ?? 0;
  const growthRate = previousPeriodRevenue > 0
    ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : 0;

  return {
    providerId: input.providerId,
    period: input.period,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    totalRevenue,
    serviceRevenue,
    productRevenue,
    membershipRevenue,
    previousPeriodRevenue,
    growthRate: Math.round(growthRate * 10) / 10,
  };
}

// ── REVENUE PER HOUR ──

export function calculateRevenuePerHour(
  revenue: number,
  hoursWorked: number,
  allProviderRates: number[] = [],
): RevenuePerHour {
  const revenuePerHour = hoursWorked > 0 ? revenue / hoursWorked : 0;
  const benchmark = allProviderRates.length > 0
    ? allProviderRates.reduce((a, b) => a + b, 0) / allProviderRates.length
    : revenuePerHour;

  const percentileRank = allProviderRates.length > 0
    ? calculatePercentile(revenuePerHour, allProviderRates)
    : 50;

  return {
    providerId: '',
    period: 'monthly',
    totalRevenue: revenue,
    hoursWorked,
    revenuePerHour: Math.round(revenuePerHour * 100) / 100,
    benchmark: Math.round(benchmark * 100) / 100,
    percentileRank,
  };
}

// ── AVERAGE TICKET SIZE ──

export function calculateAvgTicketSize(transactions: TransactionRecord[]): number {
  const serviceTransactions = transactions.filter(t => t.type === 'service');
  if (serviceTransactions.length === 0) return 0;
  const total = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
  return Math.round((total / serviceTransactions.length) * 100) / 100;
}

// ── SERVICE MIX ANALYSIS ──

export function analyzeServiceMix(appointments: AppointmentRecord[]): ServiceMixAnalysis {
  const completed = appointments.filter(a => a.status === 'completed');
  const totalRevenue = completed.reduce((sum, a) => sum + a.revenue, 0);
  const totalCount = completed.length;

  // Group by service
  const serviceMap = new Map<string, { count: number; revenue: number; category: string }>();
  for (const appt of completed) {
    const existing = serviceMap.get(appt.service) || { count: 0, revenue: 0, category: appt.category };
    existing.count += 1;
    existing.revenue += appt.revenue;
    serviceMap.set(appt.service, existing);
  }

  const topServices: ServiceMixEntry[] = Array.from(serviceMap.entries())
    .map(([service, data]) => ({
      service,
      category: data.category,
      count: data.count,
      revenue: data.revenue,
      percentOfTotal: totalCount > 0 ? Math.round((data.count / totalCount) * 1000) / 10 : 0,
      avgTicket: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Category breakdown
  const categoryMap = new Map<string, { count: number; revenue: number }>();
  for (const appt of completed) {
    const existing = categoryMap.get(appt.category) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += appt.revenue;
    categoryMap.set(appt.category, existing);
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      revenue: data.revenue,
      percent: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Diversity score: Shannon entropy normalized to 0-100
  const diversityScore = calculateDiversityScore(topServices.map(s => s.count));

  return {
    providerId: '',
    topServices,
    categoryBreakdown,
    diversityScore,
  };
}

function calculateDiversityScore(counts: number[]): number {
  if (counts.length <= 1) return 0;
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  const proportions = counts.map(c => c / total);
  const entropy = -proportions
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);

  const maxEntropy = Math.log2(counts.length);
  return maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;
}

// ── CLIENT METRICS ──

export function calculateClientRetentionRate(returningClients: number, totalClients: number): number {
  if (totalClients === 0) return 0;
  return Math.round((returningClients / totalClients) * 1000) / 10;
}

export function calculateRebookRate(rebookedClients: number, appointmentsCompleted: number): number {
  if (appointmentsCompleted === 0) return 0;
  return Math.round((rebookedClients / appointmentsCompleted) * 1000) / 10;
}

export function calculateNoShowRate(appointments: AppointmentRecord[]): number {
  const total = appointments.filter(a => a.status !== 'cancelled').length;
  if (total === 0) return 0;
  const noShows = appointments.filter(a => a.status === 'no_show').length;
  return Math.round((noShows / total) * 1000) / 10;
}

export function calculateNewClientConversionRate(newClientsThatBooked: number, newClients: number): number {
  if (newClients === 0) return 0;
  return Math.round((newClientsThatBooked / newClients) * 1000) / 10;
}

export function calculateUpsellRate(upsellCount: number, totalAppointments: number): number {
  if (totalAppointments === 0) return 0;
  return Math.round((upsellCount / totalAppointments) * 1000) / 10;
}

// ── UTILIZATION ──

export function calculateUtilizationRate(
  appointments: AppointmentRecord[],
  availableMinutes: number,
): number {
  if (availableMinutes <= 0) return 0;
  const bookedMinutes = appointments
    .filter(a => a.status === 'completed' || a.status === 'scheduled')
    .reduce((sum, a) => sum + a.duration, 0);
  return Math.round((bookedMinutes / availableMinutes) * 1000) / 10;
}

// ── QUALITY METRICS ──

export function calculateAvgReviewRating(reviews: ReviewRecord[]): { avg: number; count: number } {
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 100) / 100, count: reviews.length };
}

export function calculateTreatmentOutcomeScore(appointments: AppointmentRecord[]): number {
  const completed = appointments.filter(a => a.status === 'completed').length;
  const total = appointments.filter(a => a.status !== 'cancelled').length;
  if (total === 0) return 100;

  const noShows = appointments.filter(a => a.status === 'no_show').length;
  const completionRate = completed / total;
  const noShowPenalty = noShows / total;

  return Math.round(Math.max(0, Math.min(100, completionRate * 100 - noShowPenalty * 20)));
}

// ── FULL PERFORMANCE CALCULATION ──

export function calculatePerformanceMetrics(input: PerformanceInput): PerformanceMetrics {
  const revenue = calculateProviderRevenue(input);

  const completedAppts = input.appointments.filter(a => a.status === 'completed');
  const bookedHours = completedAppts.reduce((sum, a) => sum + a.duration, 0) / 60;

  const rph = calculateRevenuePerHour(revenue.totalRevenue, bookedHours);
  rph.providerId = input.providerId;
  rph.period = input.period;

  const avgTicketSize = calculateAvgTicketSize(input.transactions);
  const serviceMix = analyzeServiceMix(input.appointments);
  serviceMix.providerId = input.providerId;

  const clientRetentionRate = calculateClientRetentionRate(input.returningClients, input.totalClients);
  const rebookRate = calculateRebookRate(input.rebookedClients, completedAppts.length);
  const noShowRate = calculateNoShowRate(input.appointments);
  const newClientConversionRate = calculateNewClientConversionRate(input.newClientsThatBooked, input.newClients);
  const upsellRate = calculateUpsellRate(input.upsellCount, input.totalAppointments);
  const utilizationRate = calculateUtilizationRate(input.appointments, input.availableHours * 60);
  const { avg: avgReviewRating, count: reviewCount } = calculateAvgReviewRating(input.reviews);
  const treatmentOutcomeScore = calculateTreatmentOutcomeScore(input.appointments);

  const avgDuration = completedAppts.length > 0
    ? Math.round(completedAppts.reduce((sum, a) => sum + a.duration, 0) / completedAppts.length)
    : 0;

  return {
    providerId: input.providerId,
    providerName: input.providerName,
    period: input.period,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    revenue,
    revenuePerHour: rph,
    avgTicketSize,
    clientRetentionRate,
    rebookRate,
    noShowRate,
    newClientConversionRate,
    upsellRate,
    utilizationRate,
    avgAppointmentDuration: avgDuration,
    appointmentsCompleted: completedAppts.length,
    avgReviewRating,
    reviewCount,
    treatmentOutcomeScore,
    serviceMix,
  };
}

// ── PEER COMPARISON ──

export function compareProviders(metricsArray: PerformanceMetrics[]): ProviderComparison {
  if (metricsArray.length === 0) {
    return { providers: [], rankings: [], insights: [] };
  }

  const metricKeys: { key: keyof PerformanceMetrics; label: string; higherBetter: boolean }[] = [
    { key: 'avgTicketSize', label: 'Average Ticket Size', higherBetter: true },
    { key: 'clientRetentionRate', label: 'Client Retention Rate', higherBetter: true },
    { key: 'rebookRate', label: 'Rebook Rate', higherBetter: true },
    { key: 'noShowRate', label: 'No-Show Rate', higherBetter: false },
    { key: 'utilizationRate', label: 'Utilization Rate', higherBetter: true },
    { key: 'avgReviewRating', label: 'Average Review Rating', higherBetter: true },
    { key: 'newClientConversionRate', label: 'New Client Conversion', higherBetter: true },
    { key: 'upsellRate', label: 'Upsell Rate', higherBetter: true },
    { key: 'treatmentOutcomeScore', label: 'Treatment Outcome Score', higherBetter: true },
  ];

  const rankings: ProviderRanking[] = [];

  for (const { key, label, higherBetter } of metricKeys) {
    const sorted = [...metricsArray].sort((a, b) => {
      const aVal = a[key] as number;
      const bVal = b[key] as number;
      return higherBetter ? bVal - aVal : aVal - bVal;
    });

    const values = sorted.map(m => m[key] as number);

    sorted.forEach((m, i) => {
      rankings.push({
        providerId: m.providerId,
        providerName: m.providerName,
        metric: label,
        value: m[key] as number,
        rank: i + 1,
        percentile: calculatePercentile(m[key] as number, values),
      });
    });
  }

  // Revenue ranking (from nested object)
  const revSorted = [...metricsArray].sort(
    (a, b) => b.revenue.totalRevenue - a.revenue.totalRevenue,
  );
  const revValues = revSorted.map(m => m.revenue.totalRevenue);
  revSorted.forEach((m, i) => {
    rankings.push({
      providerId: m.providerId,
      providerName: m.providerName,
      metric: 'Total Revenue',
      value: m.revenue.totalRevenue,
      rank: i + 1,
      percentile: calculatePercentile(m.revenue.totalRevenue, revValues),
    });
  });

  const insights = generateComparisonInsights(metricsArray);

  return {
    providers: metricsArray,
    rankings,
    insights,
  };
}

function generateComparisonInsights(metrics: PerformanceMetrics[]): string[] {
  const insights: string[] = [];
  if (metrics.length < 2) return insights;

  // Top revenue
  const topRevenue = [...metrics].sort(
    (a, b) => b.revenue.totalRevenue - a.revenue.totalRevenue,
  )[0];
  insights.push(`${topRevenue.providerName} leads in revenue with $${topRevenue.revenue.totalRevenue.toLocaleString()}`);

  // Best retention
  const bestRetention = [...metrics].sort((a, b) => b.clientRetentionRate - a.clientRetentionRate)[0];
  insights.push(`${bestRetention.providerName} has the strongest client retention at ${bestRetention.clientRetentionRate}%`);

  // Utilization spread
  const utilRates = metrics.map(m => m.utilizationRate);
  const utilSpread = Math.max(...utilRates) - Math.min(...utilRates);
  if (utilSpread > 20) {
    insights.push(`Significant utilization gap of ${utilSpread.toFixed(1)}% between providers — consider rebalancing`);
  }

  // No-show comparison
  const worstNoShow = [...metrics].sort((a, b) => b.noShowRate - a.noShowRate)[0];
  if (worstNoShow.noShowRate > 10) {
    insights.push(`${worstNoShow.providerName} has a ${worstNoShow.noShowRate}% no-show rate — review booking deposit requirements`);
  }

  return insights;
}

// ── TREND ANALYSIS ──

export function analyzeTrend(dataPoints: TrendPoint[]): TrendAnalysis {
  if (dataPoints.length < 2) {
    return {
      providerId: '',
      metric: '',
      dataPoints,
      direction: 'stable',
      changeRate: 0,
      forecast: dataPoints[0]?.value ?? 0,
    };
  }

  const sorted = [...dataPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const values = sorted.map(d => d.value);

  // Linear regression for trend
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Forecast next point
  const forecast = Math.max(0, Math.round((slope * n + intercept) * 100) / 100);

  // Change rate (last vs first)
  const first = values[0];
  const last = values[values.length - 1];
  const changeRate = first !== 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0;

  // Direction based on slope significance
  const avgValue = yMean;
  const slopePercent = avgValue !== 0 ? (slope / avgValue) * 100 : 0;

  let direction: 'improving' | 'stable' | 'declining';
  if (slopePercent > 2) direction = 'improving';
  else if (slopePercent < -2) direction = 'declining';
  else direction = 'stable';

  return {
    providerId: '',
    metric: '',
    dataPoints: sorted,
    direction,
    changeRate,
    forecast,
  };
}

// ── PERCENTILE RANKING ──

export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  if (allValues.length === 1) return 50;

  const sorted = [...allValues].sort((a, b) => a - b);
  const belowCount = sorted.filter(v => v < value).length;
  const equalCount = sorted.filter(v => v === value).length;

  const percentile = ((belowCount + equalCount * 0.5) / sorted.length) * 100;
  return Math.round(percentile);
}

export function getPercentileRankings(
  providerId: string,
  providerName: string,
  metrics: PerformanceMetrics,
  allMetrics: PerformanceMetrics[],
): ProviderRanking[] {
  const rankings: ProviderRanking[] = [];
  const keys: { key: keyof PerformanceMetrics; label: string }[] = [
    { key: 'avgTicketSize', label: 'Average Ticket Size' },
    { key: 'clientRetentionRate', label: 'Client Retention' },
    { key: 'rebookRate', label: 'Rebook Rate' },
    { key: 'utilizationRate', label: 'Utilization' },
    { key: 'avgReviewRating', label: 'Review Rating' },
    { key: 'upsellRate', label: 'Upsell Rate' },
  ];

  for (const { key, label } of keys) {
    const allValues = allMetrics.map(m => m[key] as number);
    const value = metrics[key] as number;
    const sorted = [...allValues].sort((a, b) => b - a);
    const rank = sorted.indexOf(value) + 1;

    rankings.push({
      providerId,
      providerName,
      metric: label,
      value,
      rank: rank > 0 ? rank : allValues.length,
      percentile: calculatePercentile(value, allValues),
    });
  }

  return rankings;
}
