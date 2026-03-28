/**
 * RaniOS Automated Sales Funnel
 *
 * Captures leads, scores them, segments by clinic size,
 * drives a 7-email drip sequence, tracks conversions,
 * and supports A/B testing across every touchpoint.
 */

import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────

export const LeadCaptureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  clinicName: z.string().min(1, 'Clinic name is required'),
  providerCount: z.number().int().min(1, 'At least 1 provider'),
  currentSoftware: z.string().optional().default('none'),
  phone: z.string().optional(),
  referralSource: z.string().optional(),
});

export type LeadCaptureInput = z.infer<typeof LeadCaptureSchema>;

// ─── Types ────────────────────────────────────────────────────────

export type ClinicSegment = 'small' | 'medium' | 'large';

export type LeadScoreFactor =
  | 'clinic_size'
  | 'provider_count'
  | 'software_pain'
  | 'engagement'
  | 'urgency';

export type FunnelStage =
  | 'visitor'
  | 'lead'
  | 'marketing_qualified'
  | 'demo_booked'
  | 'demo_completed'
  | 'trial_started'
  | 'trial_active'
  | 'paid'
  | 'churned';

export type EmailSequenceStep =
  | 'welcome'
  | 'case_study'
  | 'feature_highlight'
  | 'roi_calculator'
  | 'free_trial'
  | 'personal_check_in'
  | 'final_offer';

export interface LeadScore {
  total: number; // 0–100
  factors: Record<LeadScoreFactor, number>;
  segment: ClinicSegment;
  qualifiedForDemo: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  clinicName: string;
  providerCount: number;
  currentSoftware: string;
  phone?: string;
  referralSource?: string;
  score: LeadScore;
  segment: ClinicSegment;
  stage: FunnelStage;
  emailSequence: EmailSequenceStatus;
  abVariants: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  lastActivityAt: string;
}

export interface EmailSequenceStatus {
  currentStep: number;
  steps: EmailStepStatus[];
  paused: boolean;
  completedAt?: string;
}

export interface EmailStepStatus {
  step: EmailSequenceStep;
  scheduledAt: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  variant: string;
}

export interface ABTest {
  id: string;
  name: string;
  type: 'email' | 'page' | 'cta' | 'pricing';
  variants: ABVariant[];
  status: 'active' | 'paused' | 'completed';
  winnerVariant?: string;
  startedAt: string;
  endedAt?: string;
}

export interface ABVariant {
  id: string;
  name: string;
  weight: number; // 0–1, total across variants should be 1
  impressions: number;
  conversions: number;
  conversionRate: number;
}

export interface DemoSlot {
  date: string;
  time: string;
  available: boolean;
  duration: number; // minutes
}

export interface FunnelMetrics {
  visitors: number;
  leads: number;
  mqls: number;
  demosBooked: number;
  demosCompleted: number;
  trialsStarted: number;
  trialsActive: number;
  paidCustomers: number;
  conversionRates: {
    visitorToLead: number;
    leadToMql: number;
    mqlToDemo: number;
    demoToTrial: number;
    trialToPaid: number;
    overallVisitorToPaid: number;
  };
  avgTimeToConvert: number; // days
  pipelineValue: number;
  pipelineVelocity: number; // deals per day
}

// ─── Constants ────────────────────────────────────────────────────

export const SOFTWARE_PAIN_SCORES: Record<string, number> = {
  none: 25,        // No software = massive pain, easy sell
  spreadsheets: 22,
  paper: 25,
  jane: 12,
  mindbody: 18,
  vagaro: 16,
  boulevard: 10,
  mangomint: 8,
  zenoti: 14,
  aesthetic_record: 11,
  other: 15,
};

export const EMAIL_SEQUENCE: {
  step: EmailSequenceStep;
  delayDays: number;
  subject: string;
  description: string;
}[] = [
  {
    step: 'welcome',
    delayDays: 0,
    subject: 'Welcome to RaniOS — Your Clinic, Automated',
    description: 'Welcome + demo video link',
  },
  {
    step: 'case_study',
    delayDays: 1,
    subject: 'How Rani Beauty Clinic Saved 20+ Hours/Week',
    description: 'Case study showing real results',
  },
  {
    step: 'feature_highlight',
    delayDays: 3,
    subject: 'The #1 Feature Clinics Like Yours Love',
    description: 'Feature highlight based on pain point',
  },
  {
    step: 'roi_calculator',
    delayDays: 5,
    subject: '{{clinicName}}: Your Projected ROI with RaniOS',
    description: 'Personalized ROI calculation',
  },
  {
    step: 'free_trial',
    delayDays: 7,
    subject: 'Try RaniOS Free for 14 Days — No Card Required',
    description: 'Free trial offer',
  },
  {
    step: 'personal_check_in',
    delayDays: 10,
    subject: 'Quick question about {{clinicName}}',
    description: 'Personal-feeling automated check-in',
  },
  {
    step: 'final_offer',
    delayDays: 14,
    subject: 'Founding Member Pricing Expires Friday',
    description: 'Final offer with urgency',
  },
];

export const DEMO_DURATION_MINUTES = 30;

export const DEMO_AVAILABLE_HOURS = {
  start: 9,  // 9 AM
  end: 17,   // 5 PM
  slotInterval: 30, // every 30 min
  timezone: 'America/Los_Angeles',
  excludeDays: [0, 6], // Sunday, Saturday
};

// ─── Lead Scoring Engine ──────────────────────────────────────────

export function scoreClinicSize(providerCount: number): number {
  if (providerCount >= 10) return 25;
  if (providerCount >= 6) return 22;
  if (providerCount >= 3) return 18;
  if (providerCount >= 2) return 12;
  return 8;
}

export function scoreProviderCount(count: number): number {
  // Higher provider count = more revenue potential = higher score
  return Math.min(25, count * 4);
}

export function scoreSoftwarePain(currentSoftware: string): number {
  const normalized = currentSoftware.toLowerCase().replace(/\s+/g, '_');
  return SOFTWARE_PAIN_SCORES[normalized] ?? SOFTWARE_PAIN_SCORES['other'];
}

export function scoreEngagement(actions: {
  visitedPricing?: boolean;
  watchedDemo?: boolean;
  downloadedGuide?: boolean;
  visitedCaseStudy?: boolean;
  openedEmails?: number;
  clickedEmails?: number;
}): number {
  let score = 0;
  if (actions.visitedPricing) score += 5;
  if (actions.watchedDemo) score += 8;
  if (actions.downloadedGuide) score += 3;
  if (actions.visitedCaseStudy) score += 4;
  score += Math.min(3, (actions.openedEmails ?? 0)) * 1;
  score += Math.min(3, (actions.clickedEmails ?? 0)) * 2;
  return Math.min(15, score);
}

export function scoreUrgency(signals: {
  mentionedTimeline?: boolean;
  askedAboutPricing?: boolean;
  requestedDemo?: boolean;
  competitorMention?: boolean;
}): number {
  let score = 0;
  if (signals.mentionedTimeline) score += 4;
  if (signals.askedAboutPricing) score += 3;
  if (signals.requestedDemo) score += 5;
  if (signals.competitorMention) score += 3;
  return Math.min(10, score);
}

export function calculateLeadScore(
  input: LeadCaptureInput,
  engagement: Parameters<typeof scoreEngagement>[0] = {},
  urgency: Parameters<typeof scoreUrgency>[0] = {}
): LeadScore {
  const factors: Record<LeadScoreFactor, number> = {
    clinic_size: scoreClinicSize(input.providerCount),
    provider_count: scoreProviderCount(input.providerCount),
    software_pain: scoreSoftwarePain(input.currentSoftware ?? 'none'),
    engagement: scoreEngagement(engagement),
    urgency: scoreUrgency(urgency),
  };

  const total = Object.values(factors).reduce((sum, v) => sum + v, 0);
  const segment = segmentClinic(input.providerCount);

  return {
    total: Math.min(100, total),
    factors,
    segment,
    qualifiedForDemo: total >= 40,
  };
}

// ─── Segmentation ─────────────────────────────────────────────────

export function segmentClinic(providerCount: number): ClinicSegment {
  if (providerCount >= 6) return 'large';
  if (providerCount >= 3) return 'medium';
  return 'small';
}

export const SEGMENT_LABELS: Record<ClinicSegment, string> = {
  small: 'Solo & Boutique (1-2 providers)',
  medium: 'Growing Practice (3-5 providers)',
  large: 'Multi-Provider Clinic (6+ providers)',
};

export const SEGMENT_RECOMMENDED_PLAN: Record<ClinicSegment, string> = {
  small: 'starter',
  medium: 'professional',
  large: 'enterprise',
};

// ─── Email Sequence Engine ────────────────────────────────────────

export function buildEmailSequence(
  lead: LeadCaptureInput,
  startDate: Date = new Date()
): EmailSequenceStatus {
  const steps: EmailStepStatus[] = EMAIL_SEQUENCE.map((seq) => {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + seq.delayDays);
    scheduledDate.setHours(9, 0, 0, 0); // 9 AM send time

    return {
      step: seq.step,
      scheduledAt: scheduledDate.toISOString(),
      variant: 'A', // default variant
    };
  });

  return {
    currentStep: 0,
    steps,
    paused: false,
  };
}

export function getNextEmailToSend(
  sequence: EmailSequenceStatus
): EmailStepStatus | null {
  if (sequence.paused || sequence.completedAt) return null;

  const now = new Date();
  for (const step of sequence.steps) {
    if (!step.sentAt && new Date(step.scheduledAt) <= now) {
      return step;
    }
  }
  return null;
}

export function shouldPauseSequence(
  stage: FunnelStage,
  sequence: EmailSequenceStatus
): boolean {
  // Pause if they've already converted or booked a demo
  if (['paid', 'trial_started', 'trial_active'].includes(stage)) return true;
  // Pause if demo is booked (switch to demo-specific sequence)
  if (stage === 'demo_booked') return true;
  return false;
}

export function personalizeEmailSubject(
  subject: string,
  lead: LeadCaptureInput
): string {
  return subject
    .replace(/\{\{clinicName\}\}/g, lead.clinicName)
    .replace(/\{\{name\}\}/g, lead.name)
    .replace(/\{\{providerCount\}\}/g, String(lead.providerCount));
}

// ─── Feature Highlight Selection ──────────────────────────────────

export type PainPoint =
  | 'scheduling'
  | 'no_shows'
  | 'manual_processes'
  | 'client_retention'
  | 'revenue_tracking'
  | 'marketing'
  | 'compliance'
  | 'multi_location';

export function detectPainPoints(
  currentSoftware: string,
  providerCount: number
): PainPoint[] {
  const points: PainPoint[] = [];
  const sw = currentSoftware.toLowerCase();

  if (['none', 'paper', 'spreadsheets'].includes(sw)) {
    points.push('manual_processes', 'scheduling', 'revenue_tracking');
  }
  if (['mindbody', 'vagaro'].includes(sw)) {
    points.push('client_retention', 'no_shows');
  }
  if (providerCount >= 3) {
    points.push('scheduling', 'revenue_tracking');
  }
  if (providerCount >= 6) {
    points.push('multi_location', 'compliance');
  }

  // Everyone benefits from these
  if (!points.includes('client_retention')) {
    points.push('client_retention');
  }
  if (!points.includes('marketing')) {
    points.push('marketing');
  }

  return [...new Set(points)];
}

export const FEATURE_BY_PAIN_POINT: Record<
  PainPoint,
  { feature: string; headline: string; benefit: string }
> = {
  scheduling: {
    feature: 'AI Schedule Optimizer',
    headline: 'Fill Every Time Slot, Automatically',
    benefit:
      'Our AI detects gaps in your schedule and suggests optimal booking strategies to maximize revenue per hour.',
  },
  no_shows: {
    feature: 'No-Show Prediction Engine',
    headline: 'Predict No-Shows Before They Happen',
    benefit:
      'AI scores every appointment for no-show risk. Auto-send reminders, require deposits, or overbook strategically.',
  },
  manual_processes: {
    feature: '19-Workflow Automation Suite',
    headline: 'Stop Doing Manually What AI Can Automate',
    benefit:
      'From intake processing to follow-up emails, 19 automated workflows handle the busy work so your team focuses on patients.',
  },
  client_retention: {
    feature: 'Churn Prediction + Reactivation',
    headline: 'Save Clients Before They Leave',
    benefit:
      'AI identifies at-risk clients 30 days before they churn. Automated reactivation campaigns bring them back.',
  },
  revenue_tracking: {
    feature: 'Real-Time P&L Intelligence',
    headline: 'Know Your Numbers in Real Time',
    benefit:
      'Live revenue tracking, expense categorization, and cash flow projections — no accountant required.',
  },
  marketing: {
    feature: 'AI Content & Ads Manager',
    headline: 'Marketing That Runs Itself',
    benefit:
      'Auto-generated social content, Meta Ads optimization, and competitor intelligence — all on autopilot.',
  },
  compliance: {
    feature: 'RBAC + Audit Trails',
    headline: 'Compliance Without the Headache',
    benefit:
      'Role-based access, complete audit trails, and automated compliance checks for every transaction.',
  },
  multi_location: {
    feature: 'Multi-Tenant Dashboard',
    headline: 'One Dashboard, Every Location',
    benefit:
      'See every clinic from one login. Compare performance, share staff, and standardize operations.',
  },
};

export function selectFeatureHighlight(
  currentSoftware: string,
  providerCount: number
): (typeof FEATURE_BY_PAIN_POINT)[PainPoint] {
  const painPoints = detectPainPoints(currentSoftware, providerCount);
  const primary = painPoints[0] ?? 'client_retention';
  return FEATURE_BY_PAIN_POINT[primary];
}

// ─── ROI Calculator ───────────────────────────────────────────────

export interface ROICalculation {
  currentCosts: {
    software: number;
    manualLabor: number;
    lostRevenue: number;
    marketingWaste: number;
    total: number;
  };
  withRaniOS: {
    subscriptionCost: number;
    laborSavings: number;
    revenueGain: number;
    marketingSavings: number;
    netBenefit: number;
  };
  roi: {
    monthlySavings: number;
    annualSavings: number;
    roiPercentage: number;
    paybackDays: number;
  };
}

export function calculateROI(
  providerCount: number,
  currentSoftware: string,
  avgRevenuePerProvider: number = 15000
): ROICalculation {
  const segment = segmentClinic(providerCount);

  // Estimate current software costs
  const softwareCosts: Record<string, number> = {
    none: 0,
    spreadsheets: 0,
    paper: 0,
    jane: 89 * providerCount,
    mindbody: 139 + 59 * (providerCount - 1),
    vagaro: 25 + 10 * (providerCount - 1),
    boulevard: 175 + 75 * (providerCount - 1),
    mangomint: 165 + 55 * (providerCount - 1),
    zenoti: 200 + 80 * (providerCount - 1),
    aesthetic_record: 150 + 50 * (providerCount - 1),
    other: 100 * providerCount,
  };

  const swNorm = currentSoftware.toLowerCase().replace(/\s+/g, '_');
  const currentSoftwareCost = softwareCosts[swNorm] ?? 100 * providerCount;

  // Manual labor cost estimates (hours/month * $25/hr)
  const manualHoursPerProvider = ['none', 'paper', 'spreadsheets'].includes(swNorm) ? 40 : 15;
  const manualLaborCost = providerCount * manualHoursPerProvider * 25;

  // Lost revenue from no-shows, gaps, churn
  const noShowRate = 0.12; // 12% industry average
  const monthlyRevenue = providerCount * avgRevenuePerProvider;
  const lostRevenue = monthlyRevenue * noShowRate * 0.5; // assume 50% preventable

  // Marketing waste (no optimization)
  const marketingWaste = providerCount >= 3 ? 500 : 200;

  // RaniOS pricing
  const planPrices = { small: 199, medium: 499, large: 999 };
  const subscriptionCost = planPrices[segment];

  // Savings with RaniOS
  const laborSavings = manualLaborCost * 0.6; // 60% reduction
  const revenueGain = lostRevenue * 0.7; // 70% no-show reduction
  const marketingSavings = marketingWaste * 0.5;

  const netBenefit =
    laborSavings + revenueGain + marketingSavings - subscriptionCost + currentSoftwareCost;

  const monthlySavings = netBenefit;
  const annualSavings = monthlySavings * 12;
  const roiPercentage = subscriptionCost > 0 ? ((monthlySavings / subscriptionCost) * 100) : 0;
  const paybackDays = monthlySavings > 0 ? Math.ceil((subscriptionCost / monthlySavings) * 30) : 999;

  return {
    currentCosts: {
      software: currentSoftwareCost,
      manualLabor: manualLaborCost,
      lostRevenue: Math.round(lostRevenue),
      marketingWaste,
      total: Math.round(currentSoftwareCost + manualLaborCost + lostRevenue + marketingWaste),
    },
    withRaniOS: {
      subscriptionCost,
      laborSavings: Math.round(laborSavings),
      revenueGain: Math.round(revenueGain),
      marketingSavings: Math.round(marketingSavings),
      netBenefit: Math.round(netBenefit),
    },
    roi: {
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      roiPercentage: Math.round(roiPercentage),
      paybackDays,
    },
  };
}

// ─── Demo Scheduling ──────────────────────────────────────────────

export function generateDemoSlots(
  startDate: Date = new Date(),
  daysOut: number = 14
): DemoSlot[] {
  const slots: DemoSlot[] = [];
  const { start, end, slotInterval, excludeDays } = DEMO_AVAILABLE_HOURS;

  for (let d = 1; d <= daysOut; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);

    if (excludeDays.includes(date.getDay())) continue;

    for (let hour = start; hour < end; hour++) {
      for (let min = 0; min < 60; min += slotInterval) {
        slots.push({
          date: date.toISOString().split('T')[0],
          time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
          available: true,
          duration: DEMO_DURATION_MINUTES,
        });
      }
    }
  }

  return slots;
}

export function bookDemoSlot(
  slots: DemoSlot[],
  date: string,
  time: string
): DemoSlot | null {
  const slot = slots.find(
    (s) => s.date === date && s.time === time && s.available
  );
  if (slot) {
    slot.available = false;
    return slot;
  }
  return null;
}

// ─── Sandbox / Self-Serve Demo ────────────────────────────────────

export interface SandboxCredentials {
  email: string;
  password: string;
  subdomain: string;
  expiresAt: string;
  sampleDataLoaded: boolean;
}

export function generateSandboxCredentials(
  leadEmail: string
): SandboxCredentials {
  const slug = leadEmail.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 20);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 7-day sandbox

  return {
    email: `demo+${slug}@ranios.com`,
    password: `Demo${Math.random().toString(36).slice(2, 10)}!`,
    subdomain: `${slug}-demo.ranios.com`,
    expiresAt: expiry.toISOString(),
    sampleDataLoaded: true,
  };
}

// ─── A/B Testing Engine ───────────────────────────────────────────

export function assignVariant(
  test: ABTest,
  userId: string
): string {
  // Deterministic assignment based on userId hash
  let hash = 0;
  const key = `${test.id}:${userId}`;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const normalized = Math.abs(hash) / 2147483647; // normalize to 0–1

  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (normalized <= cumulative) {
      return variant.id;
    }
  }

  return test.variants[test.variants.length - 1]?.id ?? 'A';
}

export function recordImpression(test: ABTest, variantId: string): void {
  const variant = test.variants.find((v) => v.id === variantId);
  if (variant) {
    variant.impressions += 1;
    variant.conversionRate =
      variant.impressions > 0
        ? variant.conversions / variant.impressions
        : 0;
  }
}

export function recordConversion(test: ABTest, variantId: string): void {
  const variant = test.variants.find((v) => v.id === variantId);
  if (variant) {
    variant.conversions += 1;
    variant.conversionRate =
      variant.impressions > 0
        ? variant.conversions / variant.impressions
        : 0;
  }
}

export function determineWinner(
  test: ABTest,
  minImpressions: number = 100,
  minConfidence: number = 0.95
): string | null {
  const eligible = test.variants.filter(
    (v) => v.impressions >= minImpressions
  );
  if (eligible.length < 2) return null;

  // Simple z-test for two proportions
  const [a, b] = eligible.sort(
    (x, y) => y.conversionRate - x.conversionRate
  );

  const pA = a.conversionRate;
  const pB = b.conversionRate;
  const nA = a.impressions;
  const nB = b.impressions;

  const pPooled = (a.conversions + b.conversions) / (nA + nB);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / nA + 1 / nB));

  if (se === 0) return null;

  const zScore = (pA - pB) / se;
  // z = 1.96 for 95% confidence
  const zThreshold = minConfidence >= 0.99 ? 2.576 : minConfidence >= 0.95 ? 1.96 : 1.645;

  if (zScore >= zThreshold) {
    return a.id;
  }
  return null;
}

// ─── Funnel Metrics ───────────────────────────────────────────────

export function calculateFunnelMetrics(leads: Lead[]): FunnelMetrics {
  const stages: Record<FunnelStage, number> = {
    visitor: 0,
    lead: 0,
    marketing_qualified: 0,
    demo_booked: 0,
    demo_completed: 0,
    trial_started: 0,
    trial_active: 0,
    paid: 0,
    churned: 0,
  };

  let totalConversionDays = 0;
  let convertedCount = 0;

  for (const lead of leads) {
    stages[lead.stage] += 1;

    if (lead.convertedAt) {
      const created = new Date(lead.createdAt).getTime();
      const converted = new Date(lead.convertedAt).getTime();
      totalConversionDays += (converted - created) / (1000 * 60 * 60 * 24);
      convertedCount += 1;
    }
  }

  const totalLeads =
    stages.lead +
    stages.marketing_qualified +
    stages.demo_booked +
    stages.demo_completed +
    stages.trial_started +
    stages.trial_active +
    stages.paid;

  const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

  // Pipeline value: trials * avg deal value + demos * lower probability
  const avgDealValue = 499 * 12; // Professional plan annual
  const pipelineValue =
    stages.trial_active * avgDealValue * 0.6 +
    stages.trial_started * avgDealValue * 0.4 +
    stages.demo_completed * avgDealValue * 0.25 +
    stages.demo_booked * avgDealValue * 0.15 +
    stages.marketing_qualified * avgDealValue * 0.05;

  return {
    visitors: stages.visitor,
    leads: totalLeads,
    mqls: stages.marketing_qualified,
    demosBooked: stages.demo_booked,
    demosCompleted: stages.demo_completed,
    trialsStarted: stages.trial_started,
    trialsActive: stages.trial_active,
    paidCustomers: stages.paid,
    conversionRates: {
      visitorToLead: safeDiv(totalLeads, stages.visitor + totalLeads),
      leadToMql: safeDiv(
        stages.marketing_qualified + stages.demo_booked + stages.demo_completed + stages.trial_started + stages.trial_active + stages.paid,
        totalLeads
      ),
      mqlToDemo: safeDiv(
        stages.demo_booked + stages.demo_completed + stages.trial_started + stages.trial_active + stages.paid,
        stages.marketing_qualified + stages.demo_booked + stages.demo_completed + stages.trial_started + stages.trial_active + stages.paid
      ),
      demoToTrial: safeDiv(
        stages.trial_started + stages.trial_active + stages.paid,
        stages.demo_completed + stages.trial_started + stages.trial_active + stages.paid
      ),
      trialToPaid: safeDiv(
        stages.paid,
        stages.trial_started + stages.trial_active + stages.paid
      ),
      overallVisitorToPaid: safeDiv(
        stages.paid,
        stages.visitor + totalLeads
      ),
    },
    avgTimeToConvert: convertedCount > 0 ? Math.round(totalConversionDays / convertedCount) : 0,
    pipelineValue: Math.round(pipelineValue),
    pipelineVelocity: convertedCount > 0 ? convertedCount / 30 : 0, // per day over last 30 days
  };
}

// ─── Conversion Tracking ──────────────────────────────────────────

export type ConversionEvent =
  | 'page_view'
  | 'form_submit'
  | 'email_open'
  | 'email_click'
  | 'demo_book'
  | 'demo_attend'
  | 'trial_start'
  | 'trial_activate'
  | 'purchase'
  | 'upgrade';

export interface ConversionTrackingEvent {
  leadId: string;
  event: ConversionEvent;
  properties: Record<string, string | number | boolean>;
  timestamp: string;
  source: string;
  abVariant?: string;
}

export function trackConversion(
  leadId: string,
  event: ConversionEvent,
  properties: Record<string, string | number | boolean> = {},
  source: string = 'web'
): ConversionTrackingEvent {
  return {
    leadId,
    event,
    properties,
    timestamp: new Date().toISOString(),
    source,
  };
}

export function advanceStage(
  currentStage: FunnelStage,
  event: ConversionEvent
): FunnelStage {
  const stageMap: Partial<Record<ConversionEvent, FunnelStage>> = {
    form_submit: 'lead',
    demo_book: 'demo_booked',
    demo_attend: 'demo_completed',
    trial_start: 'trial_started',
    trial_activate: 'trial_active',
    purchase: 'paid',
  };

  const nextStage = stageMap[event];
  if (!nextStage) return currentStage;

  // Only advance forward
  const stageOrder: FunnelStage[] = [
    'visitor',
    'lead',
    'marketing_qualified',
    'demo_booked',
    'demo_completed',
    'trial_started',
    'trial_active',
    'paid',
  ];

  const currentIdx = stageOrder.indexOf(currentStage);
  const nextIdx = stageOrder.indexOf(nextStage);

  return nextIdx > currentIdx ? nextStage : currentStage;
}
