/**
 * KPI Targets & Metrics
 * Rani Beauty Clinic
 *
 * Key performance indicators and targets for the medical weight loss program.
 */

import type { KPITarget, KPISnapshot } from '../../lib/medical/types';

// ============================================================
// KPI DEFINITIONS
// ============================================================

/** Monthly Recurring Revenue target */
export const MRR_TARGET: KPITarget = {
  id: 'kpi-mrr',
  name: 'Monthly Recurring Revenue (MRR)',
  metric: 'mrr',
  target: 50000,
  unit: 'dollars',
  direction: 'above',
  description: 'Total monthly recurring revenue from all active medical weight loss and wellness patients.',
  frequency: 'monthly',
};

/** Intake-to-Active conversion rate */
export const CONVERSION_RATE: KPITarget = {
  id: 'kpi-conversion',
  name: 'Intake-to-Active Conversion Rate',
  metric: 'conversion_rate',
  target: 40,
  unit: 'percent',
  direction: 'above',
  description: 'Percentage of new intake patients who become active patients (complete full pipeline).',
  frequency: 'monthly',
};

/** Average days from intake to first dose */
export const DAYS_TO_FIRST_DOSE: KPITarget = {
  id: 'kpi-days-to-dose',
  name: 'Days: Intake to First Dose',
  metric: 'days_to_first_dose',
  target: 14,
  unit: 'days',
  direction: 'below',
  description: 'Average number of days from intake form submission to patient receiving their first dose. Target: 10-14 days.',
  frequency: 'weekly',
};

/** Monthly churn rate */
export const MONTHLY_CHURN: KPITarget = {
  id: 'kpi-churn',
  name: 'Monthly Churn Rate',
  metric: 'monthly_churn',
  target: 10,
  unit: 'percent',
  direction: 'below',
  description: 'Percentage of active patients who cancel or do not refill in a given month.',
  frequency: 'monthly',
};

/** Revenue per patient per month */
export const REVENUE_PER_PATIENT: KPITarget = {
  id: 'kpi-rev-per-patient',
  name: 'Revenue per Patient per Month',
  metric: 'rev_per_patient',
  target: 400,
  unit: 'dollars',
  direction: 'above',
  description: 'Average monthly revenue per active patient across all services.',
  frequency: 'monthly',
};

/** Cost per acquisition */
export const CPA: KPITarget = {
  id: 'kpi-cpa',
  name: 'Cost per Acquisition (CPA)',
  metric: 'cpa',
  target: 30,
  unit: 'dollars',
  direction: 'below',
  description: 'Average cost to acquire one new patient through marketing channels.',
  frequency: 'monthly',
};

/** Cross-sell rate */
export const CROSS_SELL_RATE: KPITarget = {
  id: 'kpi-cross-sell',
  name: 'Cross-Sell Rate',
  metric: 'cross_sell_rate',
  target: 25,
  unit: 'percent',
  direction: 'above',
  description: 'Percentage of patients who purchase an additional service beyond their primary treatment.',
  frequency: 'monthly',
};

/** Google reviews target */
export const GOOGLE_REVIEWS: KPITarget = {
  id: 'kpi-reviews',
  name: 'Google Reviews (90-Day Target)',
  metric: 'google_reviews',
  target: 50,
  unit: 'reviews',
  direction: 'above',
  description: 'Total new Google reviews collected in a 90-day rolling window.',
  frequency: 'quarterly',
};

/** New patients per week */
export const NEW_PATIENTS_WEEKLY: KPITarget = {
  id: 'kpi-new-patients',
  name: 'New Patients per Week',
  metric: 'new_patients_weekly',
  target: 10,
  unit: 'patients',
  direction: 'above',
  description: 'Number of new intake forms processed per week.',
  frequency: 'weekly',
};

/** Refill completion rate */
export const REFILL_RATE: KPITarget = {
  id: 'kpi-refill-rate',
  name: 'Refill Completion Rate',
  metric: 'refill_rate',
  target: 85,
  unit: 'percent',
  direction: 'above',
  description: 'Percentage of due refills that are successfully completed each month.',
  frequency: 'monthly',
};

/** Patient satisfaction */
export const PATIENT_SATISFACTION: KPITarget = {
  id: 'kpi-satisfaction',
  name: 'Patient Satisfaction Score',
  metric: 'satisfaction',
  target: 8,
  unit: 'score (1-10)',
  direction: 'above',
  description: 'Average patient satisfaction score from monthly check-ins.',
  frequency: 'monthly',
};

/** Lab turnaround time */
export const LAB_TURNAROUND: KPITarget = {
  id: 'kpi-lab-turnaround',
  name: 'Lab Turnaround Time',
  metric: 'lab_turnaround_days',
  target: 5,
  unit: 'days',
  direction: 'below',
  description: 'Average days from entering LABS_NEEDED stage to receiving lab results.',
  frequency: 'weekly',
};

/** GFE completion time */
export const GFE_TURNAROUND: KPITarget = {
  id: 'kpi-gfe-turnaround',
  name: 'GFE Turnaround Time',
  metric: 'gfe_turnaround_days',
  target: 4,
  unit: 'days',
  direction: 'below',
  description: 'Average days from entering GFE_PENDING stage to GFE completion.',
  frequency: 'weekly',
};

/** Referral rate */
export const REFERRAL_RATE: KPITarget = {
  id: 'kpi-referral-rate',
  name: 'Referral Rate',
  metric: 'referral_rate',
  target: 15,
  unit: 'percent',
  direction: 'above',
  description: 'Percentage of active patients who refer at least one new patient.',
  frequency: 'monthly',
};

// ============================================================
// ALL KPIs
// ============================================================

/** Complete list of all KPI targets */
export const ALL_KPIS: KPITarget[] = [
  MRR_TARGET,
  CONVERSION_RATE,
  DAYS_TO_FIRST_DOSE,
  MONTHLY_CHURN,
  REVENUE_PER_PATIENT,
  CPA,
  CROSS_SELL_RATE,
  GOOGLE_REVIEWS,
  NEW_PATIENTS_WEEKLY,
  REFILL_RATE,
  PATIENT_SATISFACTION,
  LAB_TURNAROUND,
  GFE_TURNAROUND,
  REFERRAL_RATE,
];

/** KPIs grouped by frequency */
export const KPIS_BY_FREQUENCY: Record<string, KPITarget[]> = {
  daily: [],
  weekly: ALL_KPIS.filter((k) => k.frequency === 'weekly'),
  monthly: ALL_KPIS.filter((k) => k.frequency === 'monthly'),
  quarterly: ALL_KPIS.filter((k) => k.frequency === 'quarterly'),
};

// ============================================================
// KPI EVALUATION
// ============================================================

/**
 * Evaluates a KPI value against its target.
 */
export function evaluateKPI(kpi: KPITarget, value: number): KPISnapshot {
  const onTrack = kpi.direction === 'above' ? value >= kpi.target : value <= kpi.target;
  const delta = value - kpi.target;

  return {
    kpiId: kpi.id,
    value,
    target: kpi.target,
    date: new Date(),
    onTrack,
    delta,
    trend: 'flat', // caller should set based on historical data
  };
}

/**
 * Evaluates all KPIs with provided values.
 */
export function evaluateAllKPIs(
  values: Record<string, number>
): KPISnapshot[] {
  const snapshots: KPISnapshot[] = [];

  for (const kpi of ALL_KPIS) {
    const value = values[kpi.metric];
    if (value !== undefined) {
      snapshots.push(evaluateKPI(kpi, value));
    }
  }

  return snapshots;
}

/**
 * Calculates the percentage of KPIs on track.
 */
export function getKPIHealthScore(snapshots: KPISnapshot[]): {
  onTrack: number;
  offTrack: number;
  healthPercent: number;
} {
  const onTrack = snapshots.filter((s) => s.onTrack).length;
  const offTrack = snapshots.filter((s) => !s.onTrack).length;
  const healthPercent = snapshots.length > 0
    ? Math.round((onTrack / snapshots.length) * 100)
    : 0;

  return { onTrack, offTrack, healthPercent };
}

/**
 * Determines trend by comparing current to previous snapshot.
 */
export function determineTrend(
  current: number,
  previous: number,
  direction: 'above' | 'below'
): 'up' | 'down' | 'flat' {
  const diff = current - previous;
  const threshold = Math.abs(previous * 0.02); // 2% change threshold

  if (Math.abs(diff) < threshold) return 'flat';

  if (direction === 'above') {
    return diff > 0 ? 'up' : 'down';
  }
  // For "below" metrics (churn, days), down is good
  return diff < 0 ? 'up' : 'down';
}

// ============================================================
// REPORTING
// ============================================================

/**
 * Formats KPI snapshots as a readable dashboard.
 */
export function formatKPIDashboard(snapshots: KPISnapshot[]): string {
  const health = getKPIHealthScore(snapshots);
  const lines = [
    'KPI Dashboard',
    '='.repeat(60),
    `Health Score: ${health.healthPercent}% (${health.onTrack}/${health.onTrack + health.offTrack} on track)`,
    '',
    'Metric'.padEnd(35) + 'Value'.padEnd(12) + 'Target'.padEnd(12) + 'Status',
    '-'.repeat(65),
  ];

  for (const snapshot of snapshots) {
    const kpi = ALL_KPIS.find((k) => k.id === snapshot.kpiId);
    if (!kpi) continue;

    const status = snapshot.onTrack ? 'ON TRACK' : 'OFF TRACK';
    const name = kpi.name.padEnd(35);
    const value = `${snapshot.value} ${kpi.unit}`.padEnd(12);
    const target = `${kpi.target} ${kpi.unit}`.padEnd(12);

    lines.push(`${name}${value}${target}${status}`);
  }

  return lines.join('\n');
}

/**
 * Returns KPIs that are off track (need attention).
 */
export function getOffTrackKPIs(snapshots: KPISnapshot[]): Array<{
  kpi: KPITarget;
  snapshot: KPISnapshot;
  gapPercent: number;
}> {
  const offTrack: Array<{ kpi: KPITarget; snapshot: KPISnapshot; gapPercent: number }> = [];

  for (const snapshot of snapshots) {
    if (snapshot.onTrack) continue;
    const kpi = ALL_KPIS.find((k) => k.id === snapshot.kpiId);
    if (!kpi) continue;

    const gapPercent = kpi.target !== 0
      ? Math.abs((snapshot.delta / kpi.target) * 100)
      : 100;

    offTrack.push({ kpi, snapshot, gapPercent: Math.round(gapPercent * 10) / 10 });
  }

  // Sort by gap percentage (biggest gap first)
  offTrack.sort((a, b) => b.gapPercent - a.gapPercent);
  return offTrack;
}
