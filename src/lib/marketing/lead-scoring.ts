/**
 * Lead Scoring Engine for Rani Beauty Clinic
 *
 * Multi-factor scoring system that evaluates leads based on demographic fit,
 * behavioral signals, engagement depth, and intent indicators. Scores decay
 * over time as leads cool off, and hot leads are auto-routed to frontdesk.
 *
 * Scoring dimensions:
 * 1. Demographic (20%) - Location proximity, age bracket, income signals
 * 2. Behavioral (25%) - Page views, session depth, return visits
 * 3. Engagement (25%) - Chat interactions, downloads, email opens, form fills
 * 4. Intent (30%) - Pricing page, booking page, specific service page visits
 *
 * IMPORTANT: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface LeadProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  sourceDetail?: string; // e.g., specific campaign name, referral name
  utmParams?: UTMParams;
  location?: {
    city?: string;
    state?: string;
    zip?: string;
    distanceMiles?: number;
  };
  createdAt: string; // ISO timestamp
  lastActivityAt: string; // ISO timestamp
  status: LeadStatus;
  assignedTo?: string;
}

export type LeadSource =
  | 'google_organic'
  | 'google_ads'
  | 'meta_ads'
  | 'instagram_organic'
  | 'tiktok'
  | 'yelp'
  | 'referral'
  | 'walk_in'
  | 'phone_call'
  | 'website_chat'
  | 'email'
  | 'direct'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'consult_booked'
  | 'consult_completed'
  | 'treatment_plan_sent'
  | 'deposit_collected'
  | 'converted'
  | 'lost'
  | 'dormant';

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface BehavioralSignals {
  totalPageViews: number;
  uniquePageViews: number;
  totalSessions: number;
  avgSessionDuration: number; // seconds
  pagesPerSession: number;
  returnVisits: number; // sessions after first
  lastSessionDate: string;
  pagesViewed: PageView[];
}

export interface PageView {
  path: string;
  category: PageCategory;
  viewCount: number;
  totalTimeSeconds: number;
  lastViewed: string;
}

export type PageCategory =
  | 'homepage'
  | 'service'
  | 'pricing'
  | 'booking'
  | 'results'
  | 'about'
  | 'blog'
  | 'contact'
  | 'financing'
  | 'membership'
  | 'other';

export interface EngagementSignals {
  chatInteractions: number;
  chatMessages: number;
  formSubmissions: number;
  emailOpens: number;
  emailClicks: number;
  smsReplies: number;
  phoneCallsMade: number;
  downloadedContent: string[];
  quizCompleted: boolean;
  consultFormStarted: boolean;
  consultFormCompleted: boolean;
}

export interface LeadScoringInput {
  lead: LeadProfile;
  behavioral: BehavioralSignals;
  engagement: EngagementSignals;
}

export interface LeadScore {
  totalScore: number; // 0-100
  grade: LeadGrade;
  factors: ScoringFactor[];
  decayApplied: number; // percentage decay applied
  rawScore: number; // score before decay
  recommendation: LeadRecommendation;
  autoAssign: boolean;
  assignTo?: string;
  urgency: 'immediate' | 'today' | 'this_week' | 'nurture' | 'archive';
}

export type LeadGrade = 'A' | 'B' | 'C' | 'D';

export interface LeadGradeInfo {
  grade: LeadGrade;
  label: string;
  description: string;
  color: string;
  minScore: number;
  maxScore: number;
}

export interface ScoringFactor {
  dimension: 'demographic' | 'behavioral' | 'engagement' | 'intent';
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  weightedScore: number;
  detail: string;
}

export interface LeadRecommendation {
  action: string;
  channel: 'phone' | 'sms' | 'email' | 'chat' | 'none';
  template?: string;
  timing: string;
  reason: string;
}

export interface ConversionCalibration {
  gradeConversionRates: Record<LeadGrade, number>;
  sourceConversionRates: Record<string, number>;
  avgDaysToConvert: number;
  modelAccuracy: number; // 0-100 how well model predicts
}

// ── Constants ─────────────────────────────────────────────────────────────

const WEIGHTS = {
  demographic: 0.20,
  behavioral: 0.25,
  engagement: 0.25,
  intent: 0.30,
};

/** Source quality multipliers — higher = better quality leads */
const SOURCE_QUALITY: Record<LeadSource, number> = {
  google_organic: 1.0,
  referral: 0.95,
  phone_call: 0.90,
  walk_in: 0.90,
  website_chat: 0.85,
  yelp: 0.80,
  google_ads: 0.75,
  email: 0.70,
  instagram_organic: 0.65,
  meta_ads: 0.60,
  tiktok: 0.50,
  direct: 0.55,
  other: 0.40,
};

/** Score decay rate: percentage points lost per day of inactivity */
const DECAY_RATE_PER_DAY = 1.5;
const MAX_DECAY_PERCENTAGE = 60; // never decay more than 60%
const DECAY_GRACE_PERIOD_DAYS = 3; // no decay for first 3 days

/** Intent signal weights for specific pages */
const INTENT_PAGE_SCORES: Record<PageCategory, number> = {
  booking: 95,
  pricing: 85,
  financing: 80,
  membership: 75,
  service: 60,
  results: 55,
  contact: 70,
  homepage: 15,
  about: 20,
  blog: 25,
  other: 10,
};

/** Rani's high-value service pages (these signal strong intent) */
const HIGH_VALUE_SERVICES = [
  'sofwave', 'glp-1', 'weight-loss', 'laser-hair-removal',
  'rf-microneedling', 'botox', 'fillers',
];

const GRADE_DEFINITIONS: LeadGradeInfo[] = [
  {
    grade: 'A',
    label: 'Hot Lead',
    description: 'High-intent prospect showing strong buying signals. Ready for immediate outreach.',
    color: '#10B981',
    minScore: 75,
    maxScore: 100,
  },
  {
    grade: 'B',
    label: 'Warm Lead',
    description: 'Engaged prospect with moderate interest. Schedule follow-up within 24 hours.',
    color: '#F59E0B',
    minScore: 50,
    maxScore: 74,
  },
  {
    grade: 'C',
    label: 'Cool Lead',
    description: 'Early-stage interest. Add to nurture sequence with educational content.',
    color: '#6B7280',
    minScore: 25,
    maxScore: 49,
  },
  {
    grade: 'D',
    label: 'Cold Lead',
    description: 'Minimal engagement. Low-priority, monitor for re-engagement signals.',
    color: '#DC2626',
    minScore: 0,
    maxScore: 24,
  },
];

// ── Scoring Functions ─────────────────────────────────────────────────────

/**
 * Score demographic fit (0-100).
 * Factors: location proximity, source quality
 */
function scoreDemographic(lead: LeadProfile): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // Location proximity (Renton, WA — closer = better)
  let locationScore = 50; // default if unknown
  let locationDetail = 'Location unknown';
  if (lead.location?.distanceMiles !== undefined) {
    const miles = lead.location.distanceMiles;
    if (miles <= 5) {
      locationScore = 100;
      locationDetail = `${miles.toFixed(1)} mi away — local resident`;
    } else if (miles <= 15) {
      locationScore = 80;
      locationDetail = `${miles.toFixed(1)} mi away — nearby`;
    } else if (miles <= 30) {
      locationScore = 55;
      locationDetail = `${miles.toFixed(1)} mi away — moderate drive`;
    } else if (miles <= 50) {
      locationScore = 30;
      locationDetail = `${miles.toFixed(1)} mi away — far`;
    } else {
      locationScore = 10;
      locationDetail = `${miles.toFixed(1)} mi away — very far`;
    }
  } else if (lead.location?.state === 'WA') {
    locationScore = 60;
    locationDetail = 'In Washington state';
  }

  factors.push({
    dimension: 'demographic',
    name: 'Location Proximity',
    score: locationScore,
    weight: 0.5,
    weightedScore: locationScore * 0.5,
    detail: locationDetail,
  });

  // Source quality
  const sourceQuality = SOURCE_QUALITY[lead.source] ?? 0.40;
  const sourceScore = Math.round(sourceQuality * 100);
  factors.push({
    dimension: 'demographic',
    name: 'Source Quality',
    score: sourceScore,
    weight: 0.5,
    weightedScore: sourceScore * 0.5,
    detail: `${lead.source.replace(/_/g, ' ')} (${Math.round(sourceQuality * 100)}% quality)`,
  });

  return factors;
}

/**
 * Score behavioral signals (0-100).
 * Factors: session depth, return visits, time on site
 */
function scoreBehavioral(behavioral: BehavioralSignals): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // Session depth — more pages per session = more interest
  let depthScore = 0;
  if (behavioral.pagesPerSession >= 8) depthScore = 100;
  else if (behavioral.pagesPerSession >= 5) depthScore = 80;
  else if (behavioral.pagesPerSession >= 3) depthScore = 55;
  else if (behavioral.pagesPerSession >= 2) depthScore = 30;
  else depthScore = 10;

  factors.push({
    dimension: 'behavioral',
    name: 'Session Depth',
    score: depthScore,
    weight: 0.30,
    weightedScore: depthScore * 0.30,
    detail: `${behavioral.pagesPerSession.toFixed(1)} pages/session`,
  });

  // Return visits
  let returnScore = 0;
  if (behavioral.returnVisits >= 5) returnScore = 100;
  else if (behavioral.returnVisits >= 3) returnScore = 80;
  else if (behavioral.returnVisits >= 2) returnScore = 60;
  else if (behavioral.returnVisits >= 1) returnScore = 35;
  else returnScore = 5;

  factors.push({
    dimension: 'behavioral',
    name: 'Return Visits',
    score: returnScore,
    weight: 0.35,
    weightedScore: returnScore * 0.35,
    detail: `${behavioral.returnVisits} return visit${behavioral.returnVisits !== 1 ? 's' : ''}`,
  });

  // Time on site (avg session duration)
  let timeScore = 0;
  const avgMins = behavioral.avgSessionDuration / 60;
  if (avgMins >= 10) timeScore = 100;
  else if (avgMins >= 5) timeScore = 80;
  else if (avgMins >= 3) timeScore = 55;
  else if (avgMins >= 1) timeScore = 30;
  else timeScore = 10;

  factors.push({
    dimension: 'behavioral',
    name: 'Time on Site',
    score: timeScore,
    weight: 0.35,
    weightedScore: timeScore * 0.35,
    detail: `${avgMins.toFixed(1)} min avg session`,
  });

  return factors;
}

/**
 * Score engagement signals (0-100).
 * Factors: chat activity, form submissions, content interactions
 */
function scoreEngagement(engagement: EngagementSignals): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // Direct interactions (chat, phone, form)
  const directScore = Math.min(100, (
    (engagement.chatInteractions > 0 ? 30 : 0) +
    (engagement.chatMessages * 5) +
    (engagement.phoneCallsMade * 25) +
    (engagement.formSubmissions * 20)
  ));
  factors.push({
    dimension: 'engagement',
    name: 'Direct Interactions',
    score: directScore,
    weight: 0.40,
    weightedScore: directScore * 0.40,
    detail: `${engagement.chatMessages} chat msgs, ${engagement.phoneCallsMade} calls, ${engagement.formSubmissions} forms`,
  });

  // Email engagement
  const emailScore = Math.min(100, (
    (engagement.emailOpens * 10) +
    (engagement.emailClicks * 25) +
    (engagement.smsReplies * 30)
  ));
  factors.push({
    dimension: 'engagement',
    name: 'Email/SMS Engagement',
    score: emailScore,
    weight: 0.25,
    weightedScore: emailScore * 0.25,
    detail: `${engagement.emailOpens} opens, ${engagement.emailClicks} clicks, ${engagement.smsReplies} SMS replies`,
  });

  // Consultation signals
  let consultScore = 0;
  if (engagement.consultFormCompleted) consultScore = 100;
  else if (engagement.consultFormStarted) consultScore = 70;
  else if (engagement.quizCompleted) consultScore = 45;
  else consultScore = 0;

  factors.push({
    dimension: 'engagement',
    name: 'Consultation Signals',
    score: consultScore,
    weight: 0.35,
    weightedScore: consultScore * 0.35,
    detail: engagement.consultFormCompleted
      ? 'Consult form completed'
      : engagement.consultFormStarted
        ? 'Consult form started (not completed)'
        : engagement.quizCompleted
          ? 'Skin quiz completed'
          : 'No consultation activity',
  });

  return factors;
}

/**
 * Score intent signals (0-100).
 * Factors: high-intent page visits, service page depth, booking attempts
 */
function scoreIntent(behavioral: BehavioralSignals, engagement: EngagementSignals): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // High-intent pages visited
  const intentPages = behavioral.pagesViewed.filter(
    p => ['booking', 'pricing', 'financing', 'contact'].includes(p.category)
  );
  const maxIntentPageScore = intentPages.reduce(
    (max, p) => Math.max(max, INTENT_PAGE_SCORES[p.category] || 0),
    0,
  );
  const intentPageCount = intentPages.length;
  const intentMultiplier = Math.min(1.3, 1 + (intentPageCount - 1) * 0.1);
  const highIntentScore = Math.min(100, Math.round(maxIntentPageScore * intentMultiplier));

  factors.push({
    dimension: 'intent',
    name: 'High-Intent Pages',
    score: highIntentScore,
    weight: 0.40,
    weightedScore: highIntentScore * 0.40,
    detail: intentPageCount > 0
      ? `Viewed ${intentPageCount} intent page${intentPageCount > 1 ? 's' : ''} (${intentPages.map(p => p.category).join(', ')})`
      : 'No high-intent pages viewed',
  });

  // Service page interest depth
  const servicePages = behavioral.pagesViewed.filter(p => p.category === 'service');
  const highValueViews = servicePages.filter(p =>
    HIGH_VALUE_SERVICES.some(s => p.path.toLowerCase().includes(s))
  );
  let serviceScore = 0;
  if (highValueViews.length >= 3) serviceScore = 95;
  else if (highValueViews.length >= 2) serviceScore = 75;
  else if (highValueViews.length >= 1) serviceScore = 55;
  else if (servicePages.length >= 3) serviceScore = 45;
  else if (servicePages.length >= 1) serviceScore = 25;
  else serviceScore = 0;

  factors.push({
    dimension: 'intent',
    name: 'Service Interest',
    score: serviceScore,
    weight: 0.35,
    weightedScore: serviceScore * 0.35,
    detail: highValueViews.length > 0
      ? `${highValueViews.length} high-value service page${highValueViews.length > 1 ? 's' : ''} viewed`
      : `${servicePages.length} service page${servicePages.length !== 1 ? 's' : ''} viewed`,
  });

  // Booking/conversion attempt
  let conversionScore = 0;
  if (engagement.consultFormCompleted) conversionScore = 100;
  else if (engagement.consultFormStarted) conversionScore = 80;
  else if (intentPages.some(p => p.category === 'booking')) conversionScore = 70;
  else if (engagement.phoneCallsMade > 0) conversionScore = 65;
  else conversionScore = 0;

  factors.push({
    dimension: 'intent',
    name: 'Conversion Attempt',
    score: conversionScore,
    weight: 0.25,
    weightedScore: conversionScore * 0.25,
    detail: conversionScore >= 80
      ? 'Active conversion attempt'
      : conversionScore >= 65
        ? 'Booking page or phone contact'
        : 'No conversion attempt yet',
  });

  return factors;
}

/**
 * Calculate score decay based on days since last activity.
 * Leads cool off over time — recent activity keeps the score fresh.
 */
export function calculateDecay(lastActivityAt: string): number {
  const now = Date.now();
  const lastActivity = new Date(lastActivityAt).getTime();
  const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);

  if (daysSinceActivity <= DECAY_GRACE_PERIOD_DAYS) return 0;

  const decayDays = daysSinceActivity - DECAY_GRACE_PERIOD_DAYS;
  const decayPercentage = Math.min(MAX_DECAY_PERCENTAGE, decayDays * DECAY_RATE_PER_DAY);
  return Math.round(decayPercentage);
}

/**
 * Assign lead grade based on final score.
 */
export function assignGrade(score: number): LeadGradeInfo {
  return GRADE_DEFINITIONS.find(g => score >= g.minScore && score <= g.maxScore) || GRADE_DEFINITIONS[3];
}

/**
 * Get all grade definitions.
 */
export function getGradeDefinitions(): LeadGradeInfo[] {
  return [...GRADE_DEFINITIONS];
}

/**
 * Generate recommendation based on lead score and profile.
 */
function generateRecommendation(
  score: number,
  grade: LeadGrade,
  lead: LeadProfile,
  engagement: EngagementSignals,
): LeadRecommendation {
  if (grade === 'A') {
    if (engagement.consultFormCompleted) {
      return {
        action: 'Call immediately — consult form completed. Confirm appointment and answer questions.',
        channel: 'phone',
        template: 'hot-lead-consult-followup',
        timing: 'Within 5 minutes',
        reason: 'Completed consultation form with high engagement score',
      };
    }
    return {
      action: 'Priority outreach — this lead is showing strong buying signals. Personal call recommended.',
      channel: 'phone',
      template: 'hot-lead-outreach',
      timing: 'Within 15 minutes',
      reason: `Score ${score}/100 — high intent with ${lead.source.replace(/_/g, ' ')} source`,
    };
  }

  if (grade === 'B') {
    if (engagement.chatMessages > 0) {
      return {
        action: 'Follow up on chat conversation. Address any unanswered questions and offer consultation.',
        channel: 'sms',
        template: 'warm-lead-chat-followup',
        timing: 'Within 2 hours',
        reason: 'Active chat engagement, ready for deeper conversation',
      };
    }
    return {
      action: 'Send personalized SMS with consultation offer. Mention specific services they viewed.',
      channel: 'sms',
      template: 'warm-lead-service-interest',
      timing: 'Within 24 hours',
      reason: 'Moderate engagement — service interest detected',
    };
  }

  if (grade === 'C') {
    return {
      action: 'Add to email nurture sequence. Send educational content about services they browsed.',
      channel: 'email',
      template: 'nurture-educational',
      timing: 'Within 48 hours',
      reason: 'Early-stage interest — needs more information before committing',
    };
  }

  return {
    action: 'Add to monthly newsletter. Monitor for re-engagement signals.',
    channel: 'email',
    template: 'cold-lead-newsletter',
    timing: 'Next newsletter cycle',
    reason: 'Low engagement — not ready for direct outreach',
  };
}

/**
 * Determine urgency level for lead follow-up.
 */
function determineUrgency(grade: LeadGrade, engagement: EngagementSignals): LeadScore['urgency'] {
  if (grade === 'A') {
    if (engagement.consultFormCompleted || engagement.phoneCallsMade > 0) return 'immediate';
    return 'today';
  }
  if (grade === 'B') return 'today';
  if (grade === 'C') return 'this_week';
  return 'nurture';
}

// ── Main Scoring Function ─────────────────────────────────────────────────

/**
 * Score a lead across all dimensions and return a comprehensive score.
 */
export function scoreLead(input: LeadScoringInput): LeadScore {
  const { lead, behavioral, engagement } = input;

  // Collect all factor scores
  const demographicFactors = scoreDemographic(lead);
  const behavioralFactors = scoreBehavioral(behavioral);
  const engagementFactors = scoreEngagement(engagement);
  const intentFactors = scoreIntent(behavioral, engagement);

  // Calculate dimension scores (average of weighted sub-factors)
  const dimScore = (factors: ScoringFactor[]) =>
    factors.reduce((sum, f) => sum + f.weightedScore, 0);

  const demographicScore = dimScore(demographicFactors);
  const behavioralScore = dimScore(behavioralFactors);
  const engagementScore = dimScore(engagementFactors);
  const intentScore = dimScore(intentFactors);

  // Weighted total
  const rawScore = Math.round(
    demographicScore * WEIGHTS.demographic +
    behavioralScore * WEIGHTS.behavioral +
    engagementScore * WEIGHTS.engagement +
    intentScore * WEIGHTS.intent
  );

  // Apply time decay
  const decayPercentage = calculateDecay(lead.lastActivityAt);
  const decayMultiplier = 1 - (decayPercentage / 100);
  const totalScore = Math.max(0, Math.min(100, Math.round(rawScore * decayMultiplier)));

  // Assign grade
  const gradeInfo = assignGrade(totalScore);

  // Generate recommendation
  const recommendation = generateRecommendation(totalScore, gradeInfo.grade, lead, engagement);

  // Auto-assignment rules
  const autoAssign = gradeInfo.grade === 'A';
  const urgency = determineUrgency(gradeInfo.grade, engagement);

  return {
    totalScore,
    grade: gradeInfo.grade,
    factors: [...demographicFactors, ...behavioralFactors, ...engagementFactors, ...intentFactors],
    decayApplied: decayPercentage,
    rawScore,
    recommendation,
    autoAssign,
    assignTo: autoAssign ? 'frontdesk' : undefined,
    urgency,
  };
}

/**
 * Batch score multiple leads and sort by score descending.
 */
export function scoreLeads(leads: LeadScoringInput[]): (LeadScore & { leadId: string })[] {
  return leads
    .map(input => ({
      leadId: input.lead.id,
      ...scoreLead(input),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Calibrate scoring model against actual conversion data.
 * Compares predicted grades to actual conversions to measure accuracy.
 */
export function calibrateModel(
  scoredLeads: { grade: LeadGrade; converted: boolean; source: LeadSource }[],
): ConversionCalibration {
  const gradeGroups: Record<LeadGrade, { total: number; converted: number }> = {
    A: { total: 0, converted: 0 },
    B: { total: 0, converted: 0 },
    C: { total: 0, converted: 0 },
    D: { total: 0, converted: 0 },
  };

  const sourceGroups: Record<string, { total: number; converted: number }> = {};

  let correctPredictions = 0;

  for (const lead of scoredLeads) {
    gradeGroups[lead.grade].total++;
    if (lead.converted) gradeGroups[lead.grade].converted++;

    if (!sourceGroups[lead.source]) {
      sourceGroups[lead.source] = { total: 0, converted: 0 };
    }
    sourceGroups[lead.source].total++;
    if (lead.converted) sourceGroups[lead.source].converted++;

    // A/B grades that convert or C/D grades that don't = correct prediction
    const predictedConvert = lead.grade === 'A' || lead.grade === 'B';
    if (predictedConvert === lead.converted) correctPredictions++;
  }

  const gradeConversionRates: Record<LeadGrade, number> = {
    A: gradeGroups.A.total > 0 ? (gradeGroups.A.converted / gradeGroups.A.total) * 100 : 0,
    B: gradeGroups.B.total > 0 ? (gradeGroups.B.converted / gradeGroups.B.total) * 100 : 0,
    C: gradeGroups.C.total > 0 ? (gradeGroups.C.converted / gradeGroups.C.total) * 100 : 0,
    D: gradeGroups.D.total > 0 ? (gradeGroups.D.converted / gradeGroups.D.total) * 100 : 0,
  };

  const sourceConversionRates: Record<string, number> = {};
  for (const [source, data] of Object.entries(sourceGroups)) {
    sourceConversionRates[source] = data.total > 0 ? (data.converted / data.total) * 100 : 0;
  }

  return {
    gradeConversionRates,
    sourceConversionRates,
    avgDaysToConvert: 14, // placeholder — would calculate from actual data
    modelAccuracy: scoredLeads.length > 0
      ? Math.round((correctPredictions / scoredLeads.length) * 100)
      : 0,
  };
}

/**
 * Get source quality ranking for display.
 */
export function getSourceQualityRanking(): { source: LeadSource; quality: number }[] {
  return (Object.entries(SOURCE_QUALITY) as [LeadSource, number][])
    .map(([source, quality]) => ({ source, quality: Math.round(quality * 100) }))
    .sort((a, b) => b.quality - a.quality);
}

/**
 * Pipeline summary from scored leads.
 */
export function getPipelineSummary(
  scores: (LeadScore & { leadId: string })[],
): {
  total: number;
  byGrade: Record<LeadGrade, number>;
  byUrgency: Record<string, number>;
  avgScore: number;
  hotLeads: number;
  autoAssigned: number;
} {
  const byGrade: Record<LeadGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
  const byUrgency: Record<string, number> = {};
  let totalScore = 0;
  let autoAssigned = 0;

  for (const score of scores) {
    byGrade[score.grade]++;
    byUrgency[score.urgency] = (byUrgency[score.urgency] || 0) + 1;
    totalScore += score.totalScore;
    if (score.autoAssign) autoAssigned++;
  }

  return {
    total: scores.length,
    byGrade,
    byUrgency,
    avgScore: scores.length > 0 ? Math.round(totalScore / scores.length) : 0,
    hotLeads: byGrade.A,
    autoAssigned,
  };
}
