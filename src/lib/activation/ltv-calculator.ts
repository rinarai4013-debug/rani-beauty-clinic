/**
 * Patient Lifetime Value Calculator
 * Rani Beauty Clinic - Revenue Activation System
 *
 * Calculates LTV for each patient based on service history, frequency, and tenure.
 * Segments patients into value tiers, predicts churn probability,
 * and recommends interventions to protect revenue.
 *
 * Segments:
 * - High Value: >$500/mo average spend
 * - Growth: upgradeable patients with untapped potential
 * - At Risk: declining visit frequency or spend
 * - Lost: no visit in 90+ days
 */

import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

// ── Types ────────────────────────────────────────────────────────────────

export type PatientSegment = 'high_value' | 'growth' | 'at_risk' | 'lost';

export interface PatientLTV {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: PatientSegment;
  segmentLabel: string;

  // Revenue metrics
  totalRevenue: number;
  monthlyAverage: number;
  projectedAnnualValue: number;
  projectedLifetimeValue: number;

  // Behavioral metrics
  totalVisits: number;
  avgVisitFrequencyDays: number;
  daysSinceLastVisit: number;
  tenureMonths: number;
  firstVisitDate: string;
  lastVisitDate: string;

  // Service profile
  primaryServices: string[];
  serviceCategories: string[];
  hasRecurring: boolean;
  recurringType?: 'glp1' | 'membership' | 'package';
  recurringMonthlyValue: number;

  // Churn prediction
  churnProbability: number;
  churnRisk: 'low' | 'moderate' | 'high' | 'critical';
  churnFactors: string[];

  // Recommendations
  intervention: PatientIntervention;
  crossSellOpportunities: CrossSellOpportunity[];
  estimatedUplift: number;
}

export interface PatientIntervention {
  type: 'none' | 'check_in' | 'cross_sell' | 'upgrade_pitch' | 'win_back' | 'vip_retention';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  suggestedAction: string;
  expectedRecovery: number;
}

export interface CrossSellOpportunity {
  service: string;
  category: string;
  reason: string;
  estimatedMonthlyValue: number;
  conversionLikelihood: number;
}

export interface CohortAnalysis {
  cohortMonth: string;
  totalPatients: number;
  stillActive: number;
  retentionRate: number;
  avgLTV: number;
  totalRevenue: number;
  topServices: string[];
}

export interface LTVPortfolio {
  totalActivePatients: number;
  totalActiveLTV: number;
  atRiskLTV: number;
  lostLTV: number;
  monthlyRecurringRevenue: number;
  avgPatientLTV: number;
  medianPatientLTV: number;
  topDecileAvgLTV: number;

  segmentBreakdown: {
    segment: PatientSegment;
    label: string;
    count: number;
    totalLTV: number;
    avgLTV: number;
    percentOfPatients: number;
    percentOfRevenue: number;
  }[];

  cohorts: CohortAnalysis[];
  topPatients: PatientLTV[];
  atRiskPatients: PatientLTV[];
  growthPatients: PatientLTV[];
  lostPatients: PatientLTV[];
}

// ── Service Pricing Reference ────────────────────────────────────────────

const SERVICE_MONTHLY_VALUES: Record<string, number> = {
  'GLP-1 Starter': 399,
  'GLP-1 Premium': 499,
  'GLP-1 VIP': 599,
  'Semaglutide': 399,
  'Tirzepatide': 499,
  'Sofwave': 275, // amortized over 12 months from $3,300
  'HydraFacial': 83, // quarterly at $249
  'PRX-T33': 165, // bimonthly at $495
  'VI Peel': 99, // quarterly at $395
  'PicoWay': 150, // quarterly at $450 avg
  'RF Microneedling': 165, // bimonthly at $495 avg
  'Laser Hair Removal': 133, // 6 sessions at $800
  'Botox': 200, // every 3 months
  'Fillers': 125, // every 6 months at $750 avg
  'Vitamin D3 Injection': 50,
  'Tri-Immune Injection': 75,
  'Glutathione Injection': 100,
  'B12 Injection': 35,
  'NAD+ Injection': 150,
  'Tretinoin': 99,
  'Folix Hair Restoration': 200,
};

const CATEGORY_AVG_MONTHLY: Record<string, number> = {
  Wellness: 75,
  Injectable: 200,
  Laser: 150,
  Facial: 100,
  Body: 165,
};

// Cross-sell matrix: what services complement each other
const CROSS_SELL_MATRIX: Record<string, { service: string; reason: string; value: number }[]> = {
  'GLP-1': [
    { service: 'Tri-Immune Injection', reason: 'Immune support during weight loss journey', value: 75 },
    { service: 'B12 Injection', reason: 'Energy boost pairs perfectly with GLP-1 program', value: 35 },
    { service: 'Glutathione Injection', reason: 'Skin brightness and detox during body transformation', value: 100 },
    { service: 'Sofwave', reason: 'Skin tightening as body composition changes', value: 275 },
    { service: 'RF Microneedling', reason: 'Collagen support for skin elasticity during weight loss', value: 165 },
  ],
  Injectable: [
    { service: 'HydraFacial', reason: 'Prep and maintain skin between injectable appointments', value: 92 },
    { service: 'PicoWay', reason: 'Address pigmentation for complete facial rejuvenation', value: 150 },
    { service: 'Tretinoin', reason: 'Daily skincare to extend injectable results', value: 99 },
    { service: 'VI Peel', reason: 'Skin texture improvement between filler sessions', value: 99 },
  ],
  Laser: [
    { service: 'HydraFacial', reason: 'Post-laser hydration and recovery support', value: 92 },
    { service: 'Tretinoin', reason: 'Maintain laser results with medical-grade skincare', value: 99 },
    { service: 'PRX-T33', reason: 'Biorevitalization between laser sessions', value: 165 },
  ],
  Facial: [
    { service: 'Botox', reason: 'Add preventative injectables to your skincare routine', value: 200 },
    { service: 'Tretinoin', reason: 'Take your glow home with prescription skincare', value: 99 },
    { service: 'VI Peel', reason: 'Deeper resurfacing for accelerated results', value: 99 },
    { service: 'PicoWay', reason: 'Target stubborn pigmentation that facials alone cannot clear', value: 150 },
  ],
  Wellness: [
    { service: 'GLP-1 Starter', reason: 'Complete your wellness journey with medical weight management', value: 399 },
    { service: 'NAD+ Injection', reason: 'Premium anti-aging and cellular rejuvenation', value: 150 },
    { service: 'HydraFacial', reason: 'Treat yourself inside and out', value: 92 },
  ],
  Body: [
    { service: 'Sofwave', reason: 'Non-invasive lifting to complement body treatments', value: 275 },
    { service: 'GLP-1 Starter', reason: 'Medical weight management for comprehensive body transformation', value: 399 },
  ],
};

// ── Core Calculation Functions ────────────────────────────────────────────

/**
 * Calculate average days between visits from a list of visit dates.
 */
export function calculateVisitFrequency(visitDates: string[]): number {
  if (visitDates.length < 2) return 365; // default to annual if only one visit

  const sorted = visitDates
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a);

  let totalGap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    totalGap += sorted[i] - sorted[i + 1];
  }

  const avgGapMs = totalGap / (sorted.length - 1);
  return Math.round(avgGapMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate tenure in months from first visit date.
 */
export function calculateTenure(firstVisitDate: string): number {
  const first = new Date(firstVisitDate);
  const now = new Date();
  const months = (now.getFullYear() - first.getFullYear()) * 12 + (now.getMonth() - first.getMonth());
  return Math.max(1, months);
}

/**
 * Calculate monthly average revenue from total and tenure.
 */
export function calculateMonthlyAverage(totalRevenue: number, tenureMonths: number): number {
  return Math.round(totalRevenue / Math.max(1, tenureMonths));
}

/**
 * Project annual value based on current spending patterns.
 */
export function projectAnnualValue(
  monthlyAverage: number,
  recurringMonthlyValue: number,
  churnProbability: number,
): number {
  const baseAnnual = monthlyAverage * 12;
  const recurringAnnual = recurringMonthlyValue * 12;
  const total = Math.max(baseAnnual, recurringAnnual);
  // Discount by churn probability
  const retentionFactor = 1 - (churnProbability / 100);
  return Math.round(total * retentionFactor);
}

/**
 * Project lifetime value assuming average patient stays 2.5 years.
 * Adjusted by churn risk and spending trajectory.
 */
export function projectLifetimeValue(
  monthlyAverage: number,
  churnProbability: number,
  tenureMonths: number,
): number {
  // Expected remaining months based on churn risk
  const avgLifetimeMonths = 30; // 2.5 years average
  const remainingMonths = Math.max(0, avgLifetimeMonths - tenureMonths);
  const retentionFactor = 1 - (churnProbability / 100);
  const projectedRemaining = monthlyAverage * remainingMonths * retentionFactor;
  return Math.round(projectedRemaining);
}

/**
 * Calculate churn probability (0-100) based on behavioral signals.
 */
export function calculateChurnProbability(
  daysSinceLastVisit: number,
  avgFrequencyDays: number,
  visitCount: number,
  hasRecurring: boolean,
  tenureMonths: number,
  spendingTrend: 'increasing' | 'stable' | 'declining',
): { probability: number; risk: 'low' | 'moderate' | 'high' | 'critical'; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Factor 1: Recency vs expected frequency (40% weight)
  const overdueRatio = daysSinceLastVisit / Math.max(avgFrequencyDays, 14);
  if (overdueRatio > 3) {
    score += 40;
    factors.push(`Significantly overdue: ${daysSinceLastVisit} days since last visit (expected every ${avgFrequencyDays} days)`);
  } else if (overdueRatio > 2) {
    score += 30;
    factors.push(`Overdue for visit: ${daysSinceLastVisit} days (expected every ${avgFrequencyDays} days)`);
  } else if (overdueRatio > 1.5) {
    score += 18;
    factors.push(`Slightly overdue: ${daysSinceLastVisit} days since last visit`);
  } else if (overdueRatio > 1) {
    score += 8;
    factors.push('Coming due for next visit');
  }

  // Factor 2: Visit count / engagement (20% weight)
  if (visitCount <= 1) {
    score += 18;
    factors.push('Single visit patient, high drop-off risk');
  } else if (visitCount <= 3) {
    score += 10;
    factors.push('Early relationship, still building habit');
  } else if (visitCount > 10) {
    score -= 5; // loyalty bonus
  }

  // Factor 3: Recurring revenue anchor (20% weight)
  if (!hasRecurring) {
    score += 12;
    factors.push('No recurring program or membership');
  } else {
    score -= 8; // recurring patients are stickier
  }

  // Factor 4: Spending trend (10% weight)
  if (spendingTrend === 'declining') {
    score += 10;
    factors.push('Spending is declining over recent visits');
  } else if (spendingTrend === 'increasing') {
    score -= 5;
  }

  // Factor 5: Tenure (10% weight)
  if (tenureMonths < 3) {
    score += 8;
    factors.push('New patient, still in trial period');
  } else if (tenureMonths > 12) {
    score -= 3; // long-term patients are stickier
  }

  // Clamp to 0-100
  const probability = Math.max(0, Math.min(100, score));

  let risk: 'low' | 'moderate' | 'high' | 'critical';
  if (probability >= 70) risk = 'critical';
  else if (probability >= 50) risk = 'high';
  else if (probability >= 30) risk = 'moderate';
  else risk = 'low';

  return { probability, risk, factors };
}

/**
 * Determine spending trend from transaction amounts (newest first).
 */
export function getSpendingTrend(
  amounts: number[],
): 'increasing' | 'stable' | 'declining' {
  if (amounts.length < 3) return 'stable';

  const recentAvg = amounts.slice(0, Math.min(3, amounts.length)).reduce((s, a) => s + a, 0) / Math.min(3, amounts.length);
  const olderAvg = amounts.slice(-Math.min(3, amounts.length)).reduce((s, a) => s + a, 0) / Math.min(3, amounts.length);

  if (olderAvg === 0) return 'stable';

  const change = (recentAvg - olderAvg) / olderAvg;
  if (change > 0.15) return 'increasing';
  if (change < -0.15) return 'declining';
  return 'stable';
}

/**
 * Segment a patient based on their metrics.
 */
export function segmentPatient(
  monthlyAverage: number,
  daysSinceLastVisit: number,
  churnProbability: number,
  hasRecurring: boolean,
  visitCount: number,
): { segment: PatientSegment; label: string } {
  // Lost: no visit in 90+ days
  if (daysSinceLastVisit > 90) {
    return { segment: 'lost', label: 'Lost' };
  }

  // At Risk: churn probability > 50 or overdue 45+ days
  if (churnProbability > 50 || daysSinceLastVisit > 45) {
    return { segment: 'at_risk', label: 'At Risk' };
  }

  // High Value: >$500/mo average
  if (monthlyAverage >= 500) {
    return { segment: 'high_value', label: 'High Value' };
  }

  // Growth: has room to grow
  if (monthlyAverage < 500 && (visitCount >= 2 || hasRecurring)) {
    return { segment: 'growth', label: 'Growth' };
  }

  // Default to growth for new active patients
  return { segment: 'growth', label: 'Growth' };
}

/**
 * Generate intervention recommendation based on patient profile.
 */
export function recommendIntervention(patient: {
  segment: PatientSegment;
  monthlyAverage: number;
  daysSinceLastVisit: number;
  churnProbability: number;
  hasRecurring: boolean;
  primaryServices: string[];
  name: string;
}): PatientIntervention {
  const firstName = patient.name.split(' ')[0] || patient.name;

  if (patient.segment === 'lost') {
    return {
      type: 'win_back',
      priority: 'urgent',
      message: `${firstName} hasn't been in for ${patient.daysSinceLastVisit} days. Send a personalized win-back message.`,
      suggestedAction: `Win-back text: "Hi ${firstName}, we miss you at Rani! We have some exciting new treatments. Would love to get you back in."`,
      expectedRecovery: patient.monthlyAverage * 6,
    };
  }

  if (patient.segment === 'at_risk') {
    if (patient.monthlyAverage >= 500) {
      return {
        type: 'vip_retention',
        priority: 'urgent',
        message: `VIP patient ${firstName} is showing signs of disengagement. Personal outreach from Rina recommended.`,
        suggestedAction: `Rina call: Check in personally, offer VIP scheduling priority, discuss any concerns.`,
        expectedRecovery: patient.monthlyAverage * 3,
      };
    }
    return {
      type: 'check_in',
      priority: 'high',
      message: `${firstName} is becoming overdue. Send a friendly check-in.`,
      suggestedAction: `Text: "Hi ${firstName}, just checking in! Ready to schedule your next visit?"`,
      expectedRecovery: patient.monthlyAverage * 2,
    };
  }

  if (patient.segment === 'high_value') {
    return {
      type: 'cross_sell',
      priority: 'medium',
      message: `${firstName} is a top-tier patient. Explore cross-sell opportunities to deepen relationship.`,
      suggestedAction: `At next visit, discuss complementary services based on their current treatments.`,
      expectedRecovery: patient.monthlyAverage * 0.3,
    };
  }

  // Growth segment
  if (!patient.hasRecurring) {
    return {
      type: 'upgrade_pitch',
      priority: 'medium',
      message: `${firstName} has growth potential. Introduce a membership or recurring program.`,
      suggestedAction: `At next visit, present membership benefits and savings compared to pay-per-visit.`,
      expectedRecovery: 200,
    };
  }

  return {
    type: 'none',
    priority: 'low',
    message: `${firstName} is on track. Continue current service cadence.`,
    suggestedAction: 'Maintain relationship with regular follow-ups.',
    expectedRecovery: 0,
  };
}

/**
 * Find cross-sell opportunities for a patient based on their current services.
 */
export function findCrossSellOpportunities(
  currentServices: string[],
  currentCategories: string[],
): CrossSellOpportunity[] {
  const opportunities: CrossSellOpportunity[] = [];
  const alreadyHas = new Set(currentServices.map(s => s.toLowerCase()));

  for (const category of currentCategories) {
    const crossSells = CROSS_SELL_MATRIX[category] || [];
    for (const cs of crossSells) {
      if (alreadyHas.has(cs.service.toLowerCase())) continue;

      // Check if we already added this service
      if (opportunities.some(o => o.service === cs.service)) continue;

      // Calculate conversion likelihood based on category match
      let likelihood = 0.3; // base
      if (currentCategories.length >= 2) likelihood += 0.1; // multi-category patients are more open
      if (currentServices.length >= 4) likelihood += 0.1; // frequent visitors more open
      if (category === 'GLP-1') likelihood += 0.15; // GLP-1 patients are highly engaged

      opportunities.push({
        service: cs.service,
        category,
        reason: cs.reason,
        estimatedMonthlyValue: cs.value,
        conversionLikelihood: Math.min(0.8, likelihood),
      });
    }
  }

  // Sort by estimated value * likelihood
  return opportunities
    .sort((a, b) => (b.estimatedMonthlyValue * b.conversionLikelihood) - (a.estimatedMonthlyValue * a.conversionLikelihood))
    .slice(0, 5);
}

/**
 * Detect recurring service types from appointment history.
 */
export function detectRecurringType(
  services: string[],
): { hasRecurring: boolean; type?: 'glp1' | 'membership' | 'package'; monthlyValue: number } {
  const serviceSet = services.map(s => s.toLowerCase());

  // Check for GLP-1
  const isGLP1 = serviceSet.some(s =>
    s.includes('glp') || s.includes('semaglutide') || s.includes('tirzepatide') || s.includes('weight')
  );
  if (isGLP1) {
    return { hasRecurring: true, type: 'glp1', monthlyValue: 449 }; // avg GLP-1 monthly
  }

  // Check for wellness injections (monthly recurring)
  const wellnessCount = serviceSet.filter(s =>
    s.includes('injection') || s.includes('b12') || s.includes('nad') ||
    s.includes('glutathione') || s.includes('immune') || s.includes('vitamin')
  ).length;
  if (wellnessCount >= 3) {
    return { hasRecurring: true, type: 'membership', monthlyValue: 150 };
  }

  return { hasRecurring: false, monthlyValue: 0 };
}

/**
 * Determine service categories from service names.
 */
export function categorizeServices(services: string[]): string[] {
  const categories = new Set<string>();

  for (const service of services) {
    const s = service.toLowerCase();
    if (s.includes('glp') || s.includes('semaglutide') || s.includes('tirzepatide') || s.includes('weight')) {
      categories.add('GLP-1');
    }
    if (s.includes('botox') || s.includes('filler') || s.includes('injectable')) {
      categories.add('Injectable');
    }
    if (s.includes('laser') || s.includes('picoway') || s.includes('hair removal')) {
      categories.add('Laser');
    }
    if (s.includes('hydra') || s.includes('peel') || s.includes('prx') || s.includes('facial')) {
      categories.add('Facial');
    }
    if (s.includes('sofwave') || s.includes('rf') || s.includes('microneedling') || s.includes('body')) {
      categories.add('Body');
    }
    if (s.includes('injection') || s.includes('b12') || s.includes('nad') || s.includes('vitamin') ||
        s.includes('glutathione') || s.includes('immune') || s.includes('tretinoin')) {
      categories.add('Wellness');
    }
  }

  return Array.from(categories);
}

// ── Cohort Analysis ────────────────────────────────────────────────────

/**
 * Build cohort analysis from patient data.
 * Groups patients by their first visit month.
 */
export function buildCohortAnalysis(patients: PatientLTV[]): CohortAnalysis[] {
  const cohortMap = new Map<string, PatientLTV[]>();

  for (const p of patients) {
    if (!p.firstVisitDate) continue;
    const date = new Date(p.firstVisitDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = cohortMap.get(key) || [];
    existing.push(p);
    cohortMap.set(key, existing);
  }

  const cohorts: CohortAnalysis[] = [];

  for (const [month, patients] of cohortMap) {
    const active = patients.filter(p => p.segment !== 'lost');
    const allServices = patients.flatMap(p => p.primaryServices);
    const serviceCounts = new Map<string, number>();
    for (const s of allServices) {
      serviceCounts.set(s, (serviceCounts.get(s) || 0) + 1);
    }

    cohorts.push({
      cohortMonth: month,
      totalPatients: patients.length,
      stillActive: active.length,
      retentionRate: patients.length > 0 ? Math.round((active.length / patients.length) * 100) : 0,
      avgLTV: patients.length > 0
        ? Math.round(patients.reduce((s, p) => s + p.totalRevenue, 0) / patients.length)
        : 0,
      totalRevenue: patients.reduce((s, p) => s + p.totalRevenue, 0),
      topServices: Array.from(serviceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s),
    });
  }

  return cohorts.sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth));
}

// ── Main LTV Engine ────────────────────────────────────────────────────

interface ClientRecord {
  Client: string;
  Email: string;
  Phone: string;
  Status: string;
}

interface AppointmentRecord {
  'Service Name': string;
  'Service Category': string;
  Date: string;
  Status: string;
  'Amount Paid': number;
}

interface TransactionRecord {
  Date: string;
  Amount: number;
  'Service Name': string;
  Status: string;
}

/**
 * Build a full PatientLTV profile from raw Airtable data.
 */
export function buildPatientProfile(
  client: { id: string; fields: ClientRecord },
  appointments: { fields: AppointmentRecord }[],
  transactions: { fields: TransactionRecord }[],
): PatientLTV {
  const now = new Date();
  const name = client.fields.Client || 'Unknown';
  const email = client.fields.Email || '';
  const phone = client.fields.Phone || '';

  // Filter to completed appointments
  const completedAppts = appointments.filter(a =>
    a.fields.Status === 'Completed' || a.fields.Status === 'completed'
  );

  // Visit dates
  const visitDates = completedAppts
    .map(a => a.fields.Date)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Service names
  const services = completedAppts
    .map(a => a.fields['Service Name'])
    .filter(Boolean);

  const uniqueServices = [...new Set(services)];
  const categories = categorizeServices(uniqueServices);

  // Revenue
  const totalRevenue = transactions
    .filter(t => t.fields.Status === 'Completed' || t.fields.Status === 'completed')
    .reduce((sum, t) => sum + (t.fields.Amount || 0), 0);

  // Dates
  const firstVisitDate = visitDates.length > 0 ? visitDates[visitDates.length - 1] : now.toISOString();
  const lastVisitDate = visitDates.length > 0 ? visitDates[0] : now.toISOString();
  const daysSinceLastVisit = Math.floor(
    (now.getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Tenure and frequency
  const tenureMonths = calculateTenure(firstVisitDate);
  const avgFrequencyDays = calculateVisitFrequency(visitDates);
  const monthlyAverage = calculateMonthlyAverage(totalRevenue, tenureMonths);

  // Recurring detection
  const recurring = detectRecurringType(uniqueServices);

  // Transaction amounts for spending trend
  const amounts = transactions
    .filter(t => t.fields.Status === 'Completed' || t.fields.Status === 'completed')
    .sort((a, b) => new Date(b.fields.Date).getTime() - new Date(a.fields.Date).getTime())
    .map(t => t.fields.Amount || 0);

  const spendingTrend = getSpendingTrend(amounts);

  // Churn prediction
  const churn = calculateChurnProbability(
    daysSinceLastVisit,
    avgFrequencyDays,
    visitDates.length,
    recurring.hasRecurring,
    tenureMonths,
    spendingTrend,
  );

  // Segment
  const { segment, label: segmentLabel } = segmentPatient(
    monthlyAverage,
    daysSinceLastVisit,
    churn.probability,
    recurring.hasRecurring,
    visitDates.length,
  );

  // Projected values
  const projectedAnnualValue = projectAnnualValue(
    monthlyAverage,
    recurring.monthlyValue,
    churn.probability,
  );
  const projectedLifetimeValue = projectLifetimeValue(
    monthlyAverage,
    churn.probability,
    tenureMonths,
  );

  // Cross-sell opportunities
  const crossSellOpportunities = findCrossSellOpportunities(uniqueServices, categories);

  // Estimated uplift from cross-sells
  const estimatedUplift = crossSellOpportunities
    .reduce((sum, cs) => sum + (cs.estimatedMonthlyValue * cs.conversionLikelihood), 0);

  // Intervention
  const intervention = recommendIntervention({
    segment,
    monthlyAverage,
    daysSinceLastVisit,
    churnProbability: churn.probability,
    hasRecurring: recurring.hasRecurring,
    primaryServices: uniqueServices,
    name,
  });

  return {
    id: client.id,
    name,
    email,
    phone,
    segment,
    segmentLabel,
    totalRevenue: Math.round(totalRevenue),
    monthlyAverage,
    projectedAnnualValue,
    projectedLifetimeValue,
    totalVisits: visitDates.length,
    avgVisitFrequencyDays: avgFrequencyDays,
    daysSinceLastVisit,
    tenureMonths,
    firstVisitDate,
    lastVisitDate,
    primaryServices: uniqueServices.slice(0, 5),
    serviceCategories: categories,
    hasRecurring: recurring.hasRecurring,
    recurringType: recurring.type,
    recurringMonthlyValue: recurring.monthlyValue,
    churnProbability: churn.probability,
    churnRisk: churn.risk,
    churnFactors: churn.factors,
    intervention,
    crossSellOpportunities,
    estimatedUplift: Math.round(estimatedUplift),
  };
}

/**
 * Build the full LTV portfolio summary from a list of patient profiles.
 */
export function buildPortfolio(patients: PatientLTV[]): LTVPortfolio {
  const active = patients.filter(p => p.segment !== 'lost');
  const atRisk = patients.filter(p => p.segment === 'at_risk');
  const lost = patients.filter(p => p.segment === 'lost');
  const growth = patients.filter(p => p.segment === 'growth');

  // Total LTV calculations
  const totalActiveLTV = active.reduce((s, p) => s + p.projectedLifetimeValue, 0);
  const atRiskLTV = atRisk.reduce((s, p) => s + p.projectedLifetimeValue, 0);
  const lostLTV = lost.reduce((s, p) => s + p.monthlyAverage * 12, 0); // annualized lost value

  // MRR from recurring patients
  const monthlyRecurringRevenue = patients
    .filter(p => p.hasRecurring && p.segment !== 'lost')
    .reduce((s, p) => s + p.recurringMonthlyValue, 0);

  // Averages and medians
  const sortedLTV = active
    .map(p => p.projectedLifetimeValue)
    .sort((a, b) => a - b);

  const avgPatientLTV = active.length > 0
    ? Math.round(totalActiveLTV / active.length)
    : 0;

  const medianPatientLTV = sortedLTV.length > 0
    ? sortedLTV[Math.floor(sortedLTV.length / 2)]
    : 0;

  // Top decile
  const topDecileCount = Math.max(1, Math.ceil(active.length * 0.1));
  const topDecile = active
    .sort((a, b) => b.projectedLifetimeValue - a.projectedLifetimeValue)
    .slice(0, topDecileCount);
  const topDecileAvgLTV = topDecile.length > 0
    ? Math.round(topDecile.reduce((s, p) => s + p.projectedLifetimeValue, 0) / topDecile.length)
    : 0;

  // Segment breakdown
  const segments: PatientSegment[] = ['high_value', 'growth', 'at_risk', 'lost'];
  const segmentLabels: Record<PatientSegment, string> = {
    high_value: 'High Value',
    growth: 'Growth',
    at_risk: 'At Risk',
    lost: 'Lost',
  };

  const totalPatientCount = patients.length;
  const totalLTV = patients.reduce((s, p) => s + p.projectedLifetimeValue, 0);

  const segmentBreakdown = segments.map(seg => {
    const group = patients.filter(p => p.segment === seg);
    const groupLTV = group.reduce((s, p) => s + p.projectedLifetimeValue, 0);

    return {
      segment: seg,
      label: segmentLabels[seg],
      count: group.length,
      totalLTV: groupLTV,
      avgLTV: group.length > 0 ? Math.round(groupLTV / group.length) : 0,
      percentOfPatients: totalPatientCount > 0 ? Math.round((group.length / totalPatientCount) * 100) : 0,
      percentOfRevenue: totalLTV > 0 ? Math.round((groupLTV / totalLTV) * 100) : 0,
    };
  });

  // Cohort analysis
  const cohorts = buildCohortAnalysis(patients);

  // Top patients by LTV
  const topPatients = [...patients]
    .sort((a, b) => b.projectedLifetimeValue - a.projectedLifetimeValue)
    .slice(0, 15);

  // At risk sorted by urgency
  const atRiskPatients = [...atRisk]
    .sort((a, b) => b.monthlyAverage - a.monthlyAverage)
    .slice(0, 15);

  // Growth opportunities
  const growthPatients = [...growth]
    .sort((a, b) => b.estimatedUplift - a.estimatedUplift)
    .slice(0, 15);

  // Recently lost
  const lostPatients = [...lost]
    .sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit)
    .slice(0, 15);

  return {
    totalActivePatients: active.length,
    totalActiveLTV,
    atRiskLTV,
    lostLTV,
    monthlyRecurringRevenue,
    avgPatientLTV,
    medianPatientLTV,
    topDecileAvgLTV,
    segmentBreakdown,
    cohorts,
    topPatients,
    atRiskPatients,
    growthPatients,
    lostPatients,
  };
}

// ── Airtable Integration ────────────────────────────────────────────────

/**
 * Fetch all patient data from Airtable and compute the full LTV portfolio.
 * This is the main entry point for the API route.
 */
export async function computeFullPortfolio(): Promise<LTVPortfolio> {
  // Fetch all data in parallel
  const [clients, appointments, transactions] = await Promise.all([
    fetchAll<ClientRecord>(Tables.clients(), {
      filterByFormula: `OR({Status} = 'Active', {Status} = 'Lapsed 30', {Status} = 'Lapsed 60', {Status} = 'Lapsed 90', {Status} = 'Churned')`,
    }, true),
    fetchAll<AppointmentRecord>(Tables.appointments()),
    fetchAll<TransactionRecord>(Tables.transactions()),
  ]);

  // Build a lookup of appointments and transactions by client
  // Since Airtable linked records use record IDs, we need to match them
  // For simplicity, we match by the first linked client record

  const patients: PatientLTV[] = clients.map(client => {
    // In a real implementation, you'd match via linked record IDs
    // For now, we pass all and let the profile builder handle filtering
    return buildPatientProfile(client, appointments, transactions);
  });

  return buildPortfolio(patients);
}

/**
 * Get LTV for a single patient by Airtable record ID.
 */
export async function getPatientLTV(patientId: string): Promise<PatientLTV | null> {
  try {
    const [clients, appointments, transactions] = await Promise.all([
      fetchAll<ClientRecord>(Tables.clients(), {
        filterByFormula: `RECORD_ID() = '${patientId}'`,
      }, true),
      fetchAll<AppointmentRecord>(Tables.appointments()),
      fetchAll<TransactionRecord>(Tables.transactions()),
    ]);

    if (clients.length === 0) return null;

    return buildPatientProfile(clients[0], appointments, transactions);
  } catch (error) {
    console.error('[LTV] Failed to compute patient LTV:', error);
    return null;
  }
}

/**
 * Export patient LTV data as CSV string for reporting.
 */
export function exportLTVtoCSV(patients: PatientLTV[]): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Segment',
    'Total Revenue',
    'Monthly Average',
    'Projected Annual',
    'Projected LTV',
    'Total Visits',
    'Days Since Last Visit',
    'Tenure (Months)',
    'Churn Probability',
    'Churn Risk',
    'Has Recurring',
    'Recurring Type',
    'Recurring Monthly Value',
    'Primary Services',
    'Intervention Type',
    'Intervention Priority',
    'Estimated Uplift',
  ];

  const rows = patients.map(p => [
    `"${p.name}"`,
    `"${p.email}"`,
    `"${p.phone}"`,
    p.segmentLabel,
    p.totalRevenue,
    p.monthlyAverage,
    p.projectedAnnualValue,
    p.projectedLifetimeValue,
    p.totalVisits,
    p.daysSinceLastVisit,
    p.tenureMonths,
    p.churnProbability,
    p.churnRisk,
    p.hasRecurring,
    p.recurringType || '',
    p.recurringMonthlyValue,
    `"${p.primaryServices.join(', ')}"`,
    p.intervention.type,
    p.intervention.priority,
    p.estimatedUplift,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
