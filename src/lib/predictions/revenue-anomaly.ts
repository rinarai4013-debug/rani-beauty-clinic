/**
 * Revenue Anomaly Detection Engine
 *
 * Analyzes revenue patterns to detect anomalies and auto-generate alerts.
 * Runs via n8n daily scheduled task and surfaces in the dashboard.
 *
 * Detection methods:
 * 1. Target deviation - Revenue vs daily/weekly/monthly target
 * 2. Rolling average - Today vs 7-day rolling average
 * 3. Day-of-week pattern - Compare to same-day historical average
 * 4. Provider imbalance - One provider carrying disproportionate load
 * 5. Category shift - Sudden drop in a service category
 * 6. Payment method anomaly - Unusual payment mix (financing spike, etc.)
 */

// ── TYPES ──

export interface RevenueDataPoint {
  date: string; // YYYY-MM-DD
  amount: number;
  provider?: string;
  category?: string;
  paymentMethod?: string;
}

export interface AnomalyInput {
  dailyRevenue: RevenueDataPoint[]; // Last 30+ days of revenue, sorted newest first
  todayRevenue: number;
  targets: {
    daily: number; // $4,000
    weekly: number; // $23,000
    monthly: number; // $100,000
  };
  byProvider?: { provider: string; revenue: number }[];
  byCategory?: { category: string; revenue: number }[];
  byPaymentMethod?: { method: string; amount: number; count: number }[];
}

export interface Anomaly {
  type: AnomalyType;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  actual: number;
  expected: number;
  deviation: number; // percentage
  message: string;
  recommendation: string;
}

export type AnomalyType =
  | 'below_target'
  | 'above_target'
  | 'rolling_avg_drop'
  | 'rolling_avg_spike'
  | 'dow_anomaly'
  | 'provider_imbalance'
  | 'category_drop'
  | 'financing_spike';

export interface AnomalyResult {
  anomalies: Anomaly[];
  healthScore: number; // 0-100 (100 = perfect)
  summary: string;
  projectedMonthEnd: number;
}

// ── THRESHOLDS ──

const THRESHOLDS = {
  targetDeviationWarning: -15, // 15% below target
  targetDeviationCritical: -30, // 30% below target
  rollingAvgDropWarning: -20, // 20% below 7-day avg
  rollingAvgDropCritical: -40, // 40% below 7-day avg
  rollingAvgSpike: 50, // 50% above avg (good but flag for review)
  providerImbalance: 75, // One provider > 75% of revenue
  categoryDropThreshold: -50, // Category revenue dropped 50%+
  financingSpikeThreshold: 40, // Financing > 40% of transactions
};

// ── DETECTION FUNCTIONS ──

function detectTargetDeviation(todayRevenue: number, dailyTarget: number): Anomaly | null {
  if (dailyTarget === 0) return null;
  const deviation = ((todayRevenue - dailyTarget) / dailyTarget) * 100;

  if (deviation <= THRESHOLDS.targetDeviationCritical) {
    return {
      type: 'below_target',
      severity: 'critical',
      metric: 'Daily Revenue',
      actual: todayRevenue,
      expected: dailyTarget,
      deviation: Math.round(deviation),
      message: `Revenue is ${Math.abs(Math.round(deviation))}% below the $${dailyTarget.toLocaleString()} daily target`,
      recommendation: 'Review schedule for cancellations. Consider running a same-day promotion or reaching out to clients overdue for visits.',
    };
  }

  if (deviation <= THRESHOLDS.targetDeviationWarning) {
    return {
      type: 'below_target',
      severity: 'warning',
      metric: 'Daily Revenue',
      actual: todayRevenue,
      expected: dailyTarget,
      deviation: Math.round(deviation),
      message: `Revenue is tracking ${Math.abs(Math.round(deviation))}% below the daily target`,
      recommendation: 'Monitor throughout the day. Check for last-minute booking opportunities.',
    };
  }

  if (deviation >= THRESHOLDS.rollingAvgSpike) {
    return {
      type: 'above_target',
      severity: 'info',
      metric: 'Daily Revenue',
      actual: todayRevenue,
      expected: dailyTarget,
      deviation: Math.round(deviation),
      message: `Great day! Revenue is ${Math.round(deviation)}% above target`,
      recommendation: 'Analyze what drove the spike - replicate the winning formula.',
    };
  }

  return null;
}

function detectRollingAvgAnomaly(todayRevenue: number, dailyRevenue: RevenueDataPoint[]): Anomaly | null {
  const last7 = dailyRevenue.slice(0, 7);
  if (last7.length < 5) return null; // Need at least 5 days for stable rolling average

  const avg7 = last7.reduce((s, d) => s + d.amount, 0) / last7.length;
  if (avg7 === 0) return null;

  const deviation = ((todayRevenue - avg7) / avg7) * 100;

  if (deviation <= THRESHOLDS.rollingAvgDropCritical) {
    return {
      type: 'rolling_avg_drop',
      severity: 'critical',
      metric: '7-Day Rolling Average',
      actual: todayRevenue,
      expected: Math.round(avg7),
      deviation: Math.round(deviation),
      message: `Revenue is ${Math.abs(Math.round(deviation))}% below the 7-day average ($${Math.round(avg7).toLocaleString()})`,
      recommendation: 'Significant revenue drop detected. Check for scheduling gaps, cancellations, or system issues.',
    };
  }

  if (deviation <= THRESHOLDS.rollingAvgDropWarning) {
    return {
      type: 'rolling_avg_drop',
      severity: 'warning',
      metric: '7-Day Rolling Average',
      actual: todayRevenue,
      expected: Math.round(avg7),
      deviation: Math.round(deviation),
      message: `Revenue is ${Math.abs(Math.round(deviation))}% below the recent average`,
      recommendation: 'Below average day. Check if tomorrow has strong bookings to compensate.',
    };
  }

  if (deviation >= THRESHOLDS.rollingAvgSpike) {
    return {
      type: 'rolling_avg_spike',
      severity: 'info',
      metric: '7-Day Rolling Average',
      actual: todayRevenue,
      expected: Math.round(avg7),
      deviation: Math.round(deviation),
      message: `Revenue is ${Math.round(deviation)}% above the 7-day average - exceptional day!`,
      recommendation: 'Identify what worked (specific treatment, provider, promotion) to replicate.',
    };
  }

  return null;
}

function detectDowAnomaly(todayRevenue: number, dailyRevenue: RevenueDataPoint[]): Anomaly | null {
  const today = new Date();
  const todayDow = today.getDay();

  // Get same day-of-week from last 4 weeks
  const sameDow = dailyRevenue.filter(d => {
    const dow = new Date(d.date).getDay();
    return dow === todayDow;
  }).slice(0, 4);

  if (sameDow.length < 2) return null;

  const dowAvg = sameDow.reduce((s, d) => s + d.amount, 0) / sameDow.length;
  if (dowAvg === 0) return null;

  const deviation = ((todayRevenue - dowAvg) / dowAvg) * 100;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (deviation <= -30) {
    return {
      type: 'dow_anomaly',
      severity: 'warning',
      metric: `${dayNames[todayDow]} Average`,
      actual: todayRevenue,
      expected: Math.round(dowAvg),
      deviation: Math.round(deviation),
      message: `${dayNames[todayDow]} revenue is ${Math.abs(Math.round(deviation))}% below your typical ${dayNames[todayDow]}`,
      recommendation: `Historically, ${dayNames[todayDow]}s average $${Math.round(dowAvg).toLocaleString()}. Check for scheduling gaps.`,
    };
  }

  return null;
}

function detectProviderImbalance(byProvider: { provider: string; revenue: number }[]): Anomaly | null {
  if (byProvider.length < 2) return null;

  // With only 2 providers, a 75% split is normal variation - raise threshold
  const effectiveThreshold = byProvider.length === 2
    ? Math.max(THRESHOLDS.providerImbalance, 85)
    : THRESHOLDS.providerImbalance;

  const total = byProvider.reduce((s, p) => s + p.revenue, 0);
  if (total === 0) return null;

  for (const provider of byProvider) {
    const share = (provider.revenue / total) * 100;
    if (share >= effectiveThreshold) {
      return {
        type: 'provider_imbalance',
        severity: 'warning',
        metric: 'Provider Revenue Split',
        actual: Math.round(share),
        expected: Math.round(100 / byProvider.length),
        deviation: Math.round(share - (100 / byProvider.length)),
        message: `${provider.provider} is generating ${Math.round(share)}% of today's revenue`,
        recommendation: 'Revenue is heavily concentrated. Consider capacity planning and cross-training.',
      };
    }
  }

  return null;
}

function detectFinancingSpike(byPaymentMethod: { method: string; amount: number; count: number }[]): Anomaly | null {
  const totalCount = byPaymentMethod.reduce((s, p) => s + p.count, 0);
  if (totalCount < 3) return null;

  const financingMethods = ['Cherry', 'PatientFi', 'Afterpay'];
  const financingCount = byPaymentMethod
    .filter(p => financingMethods.some(f => p.method.includes(f)))
    .reduce((s, p) => s + p.count, 0);

  const financingRate = (financingCount / totalCount) * 100;

  if (financingRate >= THRESHOLDS.financingSpikeThreshold) {
    return {
      type: 'financing_spike',
      severity: 'info',
      metric: 'Financing Usage',
      actual: Math.round(financingRate),
      expected: 20,
      deviation: Math.round(financingRate - 20),
      message: `${Math.round(financingRate)}% of transactions are using financing today`,
      recommendation: 'Higher financing usage can indicate affordability concerns. Review if package/membership options could provide better value.',
    };
  }

  return null;
}

function detectCategoryDrop(
  byCategory: { category: string; revenue: number }[],
  dailyRevenue: RevenueDataPoint[]
): Anomaly | null {
  if (byCategory.length === 0) return null;

  // Build 30-day average per category from historical data
  const categoryTotals = new Map<string, { total: number; days: number }>();
  const last30 = dailyRevenue.slice(0, 30);
  if (last30.length < 7) return null; // Not enough history

  for (const dp of last30) {
    if (!dp.category) continue;
    const entry = categoryTotals.get(dp.category) || { total: 0, days: 0 };
    entry.total += dp.amount;
    entry.days++;
    categoryTotals.set(dp.category, entry);
  }

  // Compare today's category mix vs 30-day daily average
  for (const todayCat of byCategory) {
    const historical = categoryTotals.get(todayCat.category);
    if (!historical || historical.days < 3) continue;

    const avgDaily = historical.total / last30.length;
    if (avgDaily === 0) continue;

    const deviation = ((todayCat.revenue - avgDaily) / avgDaily) * 100;

    if (deviation <= THRESHOLDS.categoryDropThreshold) {
      return {
        type: 'category_drop',
        severity: deviation <= -75 ? 'critical' : 'warning',
        metric: `${todayCat.category} Revenue`,
        actual: Math.round(todayCat.revenue),
        expected: Math.round(avgDaily),
        deviation: Math.round(deviation),
        message: `${todayCat.category} revenue is ${Math.abs(Math.round(deviation))}% below the 30-day daily average ($${Math.round(avgDaily).toLocaleString()})`,
        recommendation: `Review ${todayCat.category} bookings. Check for cancellations, provider availability, or marketing campaign changes.`,
      };
    }
  }

  return null;
}

// ── MAIN ENGINE ──

export function detectRevenueAnomalies(input: AnomalyInput): AnomalyResult {
  const anomalies: Anomaly[] = [];

  // 1. Target deviation
  const targetAnomaly = detectTargetDeviation(input.todayRevenue, input.targets.daily);
  if (targetAnomaly) anomalies.push(targetAnomaly);

  // 2. Rolling average
  const rollingAnomaly = detectRollingAvgAnomaly(input.todayRevenue, input.dailyRevenue);
  if (rollingAnomaly) anomalies.push(rollingAnomaly);

  // 3. Day-of-week pattern
  const dowAnomaly = detectDowAnomaly(input.todayRevenue, input.dailyRevenue);
  if (dowAnomaly) anomalies.push(dowAnomaly);

  // 4. Provider imbalance
  if (input.byProvider) {
    const providerAnomaly = detectProviderImbalance(input.byProvider);
    if (providerAnomaly) anomalies.push(providerAnomaly);
  }

  // 5. Category drop
  if (input.byCategory) {
    const categoryAnomaly = detectCategoryDrop(input.byCategory, input.dailyRevenue);
    if (categoryAnomaly) anomalies.push(categoryAnomaly);
  }

  // 6. Financing spike
  if (input.byPaymentMethod) {
    const financingAnomaly = detectFinancingSpike(input.byPaymentMethod);
    if (financingAnomaly) anomalies.push(financingAnomaly);
  }

  // Calculate health score
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;
  const healthScore = Math.max(0, 100 - (criticalCount * 30) - (warningCount * 15));

  // Project month-end
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const last7Avg = input.dailyRevenue.slice(0, 7).reduce((s, d) => s + d.amount, 0) / Math.max(input.dailyRevenue.slice(0, 7).length, 1);
  const mtdRevenue = input.dailyRevenue
    .filter(d => {
      const dt = new Date(d.date);
      return dt.getMonth() === new Date().getMonth() && dt.getFullYear() === new Date().getFullYear();
    })
    .reduce((s, d) => s + d.amount, 0);
  const remainingDays = daysInMonth - dayOfMonth;
  const projectedMonthEnd = mtdRevenue + (last7Avg * remainingDays);

  // Summary
  let summary: string;
  if (criticalCount > 0) {
    summary = `${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} detected. Immediate attention needed.`;
  } else if (warningCount > 0) {
    summary = `${warningCount} warning${warningCount > 1 ? 's' : ''} flagged. Review recommended.`;
  } else if (anomalies.length > 0) {
    summary = 'Revenue is tracking well with some noteworthy patterns.';
  } else {
    summary = 'Revenue is healthy. No anomalies detected.';
  }

  return {
    anomalies,
    healthScore,
    summary,
    projectedMonthEnd: Math.round(projectedMonthEnd),
  };
}
