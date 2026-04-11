/**
 * RaniOS Automated Customer Success Bot
 *
 * Health scoring, check-in emails, feature adoption nudges,
 * milestone celebrations, churn risk detection, save offers,
 * NPS surveys, expansion triggers, and referral program.
 */

// ─── Types ────────────────────────────────────────────────────────

export type HealthGrade = 'excellent' | 'good' | 'at_risk' | 'critical';

export interface TenantHealthScore {
  tenantId: string;
  clinicName: string;
  overall: number; // 0–100
  grade: HealthGrade;
  factors: HealthFactors;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: string;
}

export interface HealthFactors {
  loginFrequency: HealthFactor;
  featureAdoption: HealthFactor;
  supportTickets: HealthFactor;
  billingHealth: HealthFactor;
  dataActivity: HealthFactor;
}

export interface HealthFactor {
  name: string;
  score: number; // 0–100
  weight: number; // 0–1, total should be 1
  weightedScore: number;
  details: string;
}

export type CheckInType = 'day_7' | 'day_30' | 'day_60' | 'day_90';

export interface CheckInEmail {
  type: CheckInType;
  subject: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
}

export type FeatureId =
  | 'ai_chat'
  | 'churn_prediction'
  | 'schedule_optimizer'
  | 'consult_copilot'
  | 'social_media_ai'
  | 'meta_ads'
  | 'dynamic_pricing'
  | 'phone_agent'
  | 'knowledge_base'
  | 'pnl_intelligence'
  | 'inventory_manager'
  | 'gamification';

export interface FeatureAdoption {
  featureId: FeatureId;
  name: string;
  enabled: boolean;
  activated: boolean;
  firstUsedAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  adoptionScore: number; // 0–100
}

export interface FeatureNudge {
  featureId: FeatureId;
  subject: string;
  message: string;
  benefit: string;
  ctaText: string;
  ctaUrl: string;
}

export type MilestoneType =
  | 'first_login'
  | 'setup_complete'
  | 'first_appointment'
  | 'appointments_100'
  | 'appointments_500'
  | 'appointments_1000'
  | 'first_month'
  | 'three_months'
  | 'six_months'
  | 'one_year'
  | 'revenue_10k'
  | 'revenue_50k'
  | 'revenue_100k'
  | 'clients_100'
  | 'clients_500'
  | 'first_ai_insight'
  | 'five_star_review'
  | 'team_member_added'
  | 'integration_connected';

export interface Milestone {
  type: MilestoneType;
  name: string;
  description: string;
  celebrationMessage: string;
  reachedAt?: string;
}

export type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ChurnRiskAssessment {
  tenantId: string;
  riskLevel: ChurnRiskLevel;
  riskScore: number; // 0–100
  signals: ChurnSignal[];
  predictedChurnDate?: string;
  recommendedAction: string;
}

export interface ChurnSignal {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  value: number;
  threshold: number;
}

export interface SaveOffer {
  tenantId: string;
  type: 'free_month' | 'downgrade' | 'personal_call' | 'discount' | 'feature_unlock';
  title: string;
  description: string;
  value: string;
  expiresAt: string;
  accepted: boolean;
  declinedAt?: string;
}

export interface NPSSurvey {
  tenantId: string;
  type: 'day_30' | 'day_90' | 'day_365';
  score?: number; // 0–10
  feedback?: string;
  sentAt: string;
  respondedAt?: string;
  followUpSent: boolean;
}

export type NPSCategory = 'promoter' | 'passive' | 'detractor';

export interface ExpansionTrigger {
  tenantId: string;
  trigger: string;
  metric: string;
  currentValue: number;
  threshold: number;
  suggestedAction: 'upgrade' | 'add_on' | 'annual_switch';
  message: string;
}

export interface ReferralProgram {
  tenantId: string;
  referralCode: string;
  referralsCount: number;
  successfulReferrals: number;
  creditsEarned: number; // months of free service
  creditsUsed: number;
  referrals: Referral[];
}

export interface Referral {
  referredClinicName: string;
  referredEmail: string;
  status: 'pending' | 'signed_up' | 'paid' | 'expired';
  createdAt: string;
  convertedAt?: string;
  creditAwarded: boolean;
}

// ─── Health Score Calculation ─────────────────────────────────────

const HEALTH_WEIGHTS = {
  loginFrequency: 0.30,
  featureAdoption: 0.25,
  supportTickets: 0.15,
  billingHealth: 0.20,
  dataActivity: 0.10,
} as const;

export function calculateLoginScore(
  loginsLast30Days: number,
  uniqueDaysLast30: number
): HealthFactor {
  let score: number;

  if (uniqueDaysLast30 >= 20) score = 100;
  else if (uniqueDaysLast30 >= 15) score = 85;
  else if (uniqueDaysLast30 >= 10) score = 70;
  else if (uniqueDaysLast30 >= 5) score = 50;
  else if (uniqueDaysLast30 >= 2) score = 30;
  else if (uniqueDaysLast30 >= 1) score = 15;
  else score = 0;

  return {
    name: 'Login Frequency',
    score,
    weight: HEALTH_WEIGHTS.loginFrequency,
    weightedScore: Math.round(score * HEALTH_WEIGHTS.loginFrequency),
    details: `${uniqueDaysLast30} unique days, ${loginsLast30Days} total logins in last 30 days`,
  };
}

export function calculateFeatureAdoptionScore(
  features: FeatureAdoption[]
): HealthFactor {
  const enabledFeatures = features.filter((f) => f.enabled);
  if (enabledFeatures.length === 0) {
    return {
      name: 'Feature Adoption',
      score: 0,
      weight: HEALTH_WEIGHTS.featureAdoption,
      weightedScore: 0,
      details: 'No features enabled',
    };
  }

  const activatedCount = enabledFeatures.filter((f) => f.activated).length;
  const avgUsageScore =
    enabledFeatures.reduce((sum, f) => sum + f.adoptionScore, 0) /
    enabledFeatures.length;

  const adoptionRate = activatedCount / enabledFeatures.length;
  const score = Math.round(adoptionRate * 50 + avgUsageScore * 0.5);

  return {
    name: 'Feature Adoption',
    score: Math.min(100, score),
    weight: HEALTH_WEIGHTS.featureAdoption,
    weightedScore: Math.round(Math.min(100, score) * HEALTH_WEIGHTS.featureAdoption),
    details: `${activatedCount}/${enabledFeatures.length} features activated, avg usage: ${Math.round(avgUsageScore)}%`,
  };
}

export function calculateSupportScore(
  openTickets: number,
  ticketsLast30Days: number,
  avgResolutionHours: number
): HealthFactor {
  let score = 100;

  // Deduct for open tickets
  score -= openTickets * 15;
  // Deduct for volume (many tickets = frustrated customer)
  if (ticketsLast30Days > 5) score -= 20;
  else if (ticketsLast30Days > 3) score -= 10;
  // Deduct for slow resolution
  if (avgResolutionHours > 48) score -= 15;
  else if (avgResolutionHours > 24) score -= 5;

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Support Health',
    score,
    weight: HEALTH_WEIGHTS.supportTickets,
    weightedScore: Math.round(score * HEALTH_WEIGHTS.supportTickets),
    details: `${openTickets} open tickets, ${ticketsLast30Days} total last 30d, avg resolution: ${Math.round(avgResolutionHours)}h`,
  };
}

export function calculateBillingScore(
  paymentsCurrent: boolean,
  failedPayments30d: number,
  daysUntilRenewal: number,
  cancelRequested: boolean
): HealthFactor {
  let score = 100;

  if (!paymentsCurrent) score -= 40;
  score -= failedPayments30d * 15;
  if (cancelRequested) score -= 50;
  if (daysUntilRenewal <= 7 && !paymentsCurrent) score -= 10;

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Billing Health',
    score,
    weight: HEALTH_WEIGHTS.billingHealth,
    weightedScore: Math.round(score * HEALTH_WEIGHTS.billingHealth),
    details: `Payments current: ${paymentsCurrent}, failed: ${failedPayments30d}, cancel requested: ${cancelRequested}`,
  };
}

export function calculateDataActivityScore(
  recordsCreated30d: number,
  appointmentsLogged30d: number,
  clientsAdded30d: number
): HealthFactor {
  let score = 0;

  if (recordsCreated30d >= 100) score += 40;
  else if (recordsCreated30d >= 50) score += 30;
  else if (recordsCreated30d >= 20) score += 20;
  else if (recordsCreated30d >= 5) score += 10;

  if (appointmentsLogged30d >= 50) score += 35;
  else if (appointmentsLogged30d >= 20) score += 25;
  else if (appointmentsLogged30d >= 10) score += 15;
  else if (appointmentsLogged30d >= 1) score += 5;

  if (clientsAdded30d >= 20) score += 25;
  else if (clientsAdded30d >= 10) score += 20;
  else if (clientsAdded30d >= 5) score += 15;
  else if (clientsAdded30d >= 1) score += 5;

  return {
    name: 'Data Activity',
    score: Math.min(100, score),
    weight: HEALTH_WEIGHTS.dataActivity,
    weightedScore: Math.round(Math.min(100, score) * HEALTH_WEIGHTS.dataActivity),
    details: `${recordsCreated30d} records, ${appointmentsLogged30d} appointments, ${clientsAdded30d} clients in 30d`,
  };
}

export function calculateHealthScore(factors: HealthFactors): {
  overall: number;
  grade: HealthGrade;
} {
  const overall =
    factors.loginFrequency.weightedScore +
    factors.featureAdoption.weightedScore +
    factors.supportTickets.weightedScore +
    factors.billingHealth.weightedScore +
    factors.dataActivity.weightedScore;

  let grade: HealthGrade;
  if (overall >= 80) grade = 'excellent';
  else if (overall >= 60) grade = 'good';
  else if (overall >= 40) grade = 'at_risk';
  else grade = 'critical';

  return { overall: Math.round(overall), grade };
}

export function detectHealthTrend(
  scores: number[],
  window: number = 4
): 'improving' | 'stable' | 'declining' {
  if (scores.length < 2) return 'stable';

  const recent = scores.slice(-window);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const older = scores.slice(-window * 2, -window);
  if (older.length === 0) return 'stable';
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = avgRecent - avgOlder;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

// ─── Automated Check-Ins ──────────────────────────────────────────

export function generateCheckInEmail(
  type: CheckInType,
  clinicName: string,
  ownerName: string,
  healthScore: number,
  topFeature?: string
): CheckInEmail {
  const checkIns: Record<CheckInType, () => CheckInEmail> = {
    day_7: () => ({
      type: 'day_7',
      subject: `How's your first week going, ${ownerName}?`,
      body: `Hi ${ownerName},\n\nYou've been using RaniOS for a week now! We hope ${clinicName} is already seeing the difference.\n\nHere are some quick wins for your second week:\n- Set up your first AI-powered client recommendation\n- Try the schedule optimizer to find hidden revenue\n- Explore the gamification dashboard with your team\n\nHave questions? Just reply to this email.`,
      ctaText: 'Open Dashboard',
      ctaUrl: `https://${clinicName.toLowerCase().replace(/\s+/g, '-')}.ranios.com/dashboard`,
    }),
    day_30: () => ({
      type: 'day_30',
      subject: `Your first month with RaniOS — here's your impact`,
      body: `Hi ${ownerName},\n\nCongrats on one month with RaniOS! Here's what ${clinicName} has achieved:\n\nYour health score is ${healthScore}/100.${topFeature ? `\n\nMost popular feature: ${topFeature}` : ''}\n\nNext level: Have you tried the churn prediction engine? It identifies at-risk clients before they leave.\n\nWe'd love your feedback — a quick 2-minute survey helps us build what you need.`,
      ctaText: 'Take Quick Survey',
      ctaUrl: 'https://ranios.com/nps',
    }),
    day_60: () => ({
      type: 'day_60',
      subject: `2 months in — let's level up ${clinicName}`,
      body: `Hi ${ownerName},\n\nTwo months of RaniOS! You're in the top tier of engaged clinics.\n\nHere's what power users are doing right now:\n- Using the consult co-pilot for every consultation\n- Running Meta Ads AI to optimize their ad spend\n- Setting up the AI phone agent for after-hours calls\n\nWant a personalized strategy session? Book a free 15-minute call with our success team.`,
      ctaText: 'Book Strategy Call',
      ctaUrl: 'https://ranios.com/strategy',
    }),
    day_90: () => ({
      type: 'day_90',
      subject: `3 months with RaniOS — you're a pro!`,
      body: `Hi ${ownerName},\n\nThree months in and ${clinicName} is running like a well-oiled machine.\n\nDid you know? Clinics that refer other practices get a free month of service. Know another medspa that could use AI-powered management?\n\nYour referral link is ready in your dashboard.\n\nKeep crushing it!`,
      ctaText: 'Share Your Referral Link',
      ctaUrl: 'https://ranios.com/referral',
    }),
  };

  return checkIns[type]();
}

// ─── Feature Adoption Nudges ──────────────────────────────────────

export const FEATURE_NUDGES: Record<FeatureId, {
  name: string;
  benefit: string;
  ctaText: string;
}> = {
  ai_chat: {
    name: 'AI Chat Widget',
    benefit: 'Clinics with the chat widget capture 3x more leads from their website.',
    ctaText: 'Enable AI Chat',
  },
  churn_prediction: {
    name: 'Churn Prediction',
    benefit: 'Identify at-risk clients 30 days before they leave. Save $500+/month in lost revenue.',
    ctaText: 'View At-Risk Clients',
  },
  schedule_optimizer: {
    name: 'Schedule Optimizer',
    benefit: 'Fill gaps in your schedule automatically. Clinics recover an average of $2,000/month.',
    ctaText: 'Optimize Schedule',
  },
  consult_copilot: {
    name: 'Consult Co-Pilot',
    benefit: 'AI-powered talking points and closing strategies increase close rates by 25%.',
    ctaText: 'Try Consult Co-Pilot',
  },
  social_media_ai: {
    name: 'Social Media AI',
    benefit: 'Generate a full week of content in 5 minutes. Posts optimized for engagement.',
    ctaText: 'Generate Content',
  },
  meta_ads: {
    name: 'Meta Ads Manager',
    benefit: 'AI optimizes your ad spend. Average 40% reduction in cost per acquisition.',
    ctaText: 'Connect Meta Ads',
  },
  dynamic_pricing: {
    name: 'Dynamic Pricing',
    benefit: 'Optimize service pricing based on demand, competition, and margins.',
    ctaText: 'View Pricing Insights',
  },
  phone_agent: {
    name: 'AI Phone Agent',
    benefit: 'Never miss a call. AI answers 24/7, books appointments, and handles inquiries.',
    ctaText: 'Set Up Phone Agent',
  },
  knowledge_base: {
    name: 'RAG Knowledge Base',
    benefit: 'Power your AI with clinic-specific knowledge for accurate, on-brand responses.',
    ctaText: 'Build Knowledge Base',
  },
  pnl_intelligence: {
    name: 'P&L Intelligence',
    benefit: 'Real-time profit & loss with auto expense categorization and margin analysis.',
    ctaText: 'View P&L Dashboard',
  },
  inventory_manager: {
    name: 'Inventory Auto-Manager',
    benefit: 'Auto reorder points, waste analysis, and par level optimization.',
    ctaText: 'Manage Inventory',
  },
  gamification: {
    name: 'Gamification Engine',
    benefit: 'Motivate your team with scores, levels, and leaderboards. Engagement up 40%.',
    ctaText: 'Enable Gamification',
  },
};

export function generateFeatureNudge(
  featureId: FeatureId,
  clinicName: string
): FeatureNudge {
  const nudge = FEATURE_NUDGES[featureId];
  return {
    featureId,
    subject: `${clinicName}: You haven't tried ${nudge.name} yet!`,
    message: `The ${nudge.name} feature is included in your plan but hasn't been activated yet.`,
    benefit: nudge.benefit,
    ctaText: nudge.ctaText,
    ctaUrl: `https://ranios.com/dashboard/${featureId.replace(/_/g, '-')}`,
  };
}

export function getUnusedFeatures(
  features: FeatureAdoption[]
): FeatureAdoption[] {
  return features.filter((f) => f.enabled && !f.activated);
}

export function getUnderusedFeatures(
  features: FeatureAdoption[],
  threshold: number = 20
): FeatureAdoption[] {
  return features.filter(
    (f) => f.enabled && f.activated && f.adoptionScore < threshold
  );
}

// ─── Milestone Celebrations ───────────────────────────────────────

export const MILESTONES: Record<MilestoneType, Omit<Milestone, 'reachedAt'>> = {
  first_login: {
    type: 'first_login',
    name: 'First Login',
    description: 'Logged into your dashboard for the first time',
    celebrationMessage: 'Welcome to the future of clinic management!',
  },
  setup_complete: {
    type: 'setup_complete',
    name: 'Setup Complete',
    description: 'Completed all onboarding steps',
    celebrationMessage: 'Your clinic is fully configured and ready to go!',
  },
  first_appointment: {
    type: 'first_appointment',
    name: 'First Appointment',
    description: 'Logged your first appointment',
    celebrationMessage: 'Your digital journey has officially begun!',
  },
  appointments_100: {
    type: 'appointments_100',
    name: '100 Appointments',
    description: 'Logged 100 appointments through RaniOS',
    celebrationMessage: 'Century club! 100 appointments managed like a pro.',
  },
  appointments_500: {
    type: 'appointments_500',
    name: '500 Appointments',
    description: 'Logged 500 appointments through RaniOS',
    celebrationMessage: '500 appointments! Your clinic is thriving.',
  },
  appointments_1000: {
    type: 'appointments_1000',
    name: '1,000 Appointments',
    description: 'Logged 1,000 appointments through RaniOS',
    celebrationMessage: '1,000 appointments! You are a RaniOS power user.',
  },
  first_month: {
    type: 'first_month',
    name: 'First Month',
    description: 'Completed your first month on RaniOS',
    celebrationMessage: 'One month down! Here is to many more.',
  },
  three_months: {
    type: 'three_months',
    name: 'Three Months',
    description: 'Three months on RaniOS',
    celebrationMessage: 'Quarter milestone! You are in the groove.',
  },
  six_months: {
    type: 'six_months',
    name: 'Six Months',
    description: 'Six months on RaniOS',
    celebrationMessage: 'Half a year of AI-powered clinic management!',
  },
  one_year: {
    type: 'one_year',
    name: 'One Year',
    description: 'One full year on RaniOS',
    celebrationMessage: 'Happy Anniversary! A full year of growth.',
  },
  revenue_10k: {
    type: 'revenue_10k',
    name: '$10K Revenue',
    description: 'Tracked $10,000 in revenue',
    celebrationMessage: '$10K tracked! Your revenue insights are getting powerful.',
  },
  revenue_50k: {
    type: 'revenue_50k',
    name: '$50K Revenue',
    description: 'Tracked $50,000 in revenue',
    celebrationMessage: '$50K milestone! Your business intelligence is elite.',
  },
  revenue_100k: {
    type: 'revenue_100k',
    name: '$100K Revenue',
    description: 'Tracked $100,000 in revenue',
    celebrationMessage: 'Six figures tracked! You are running a powerhouse.',
  },
  clients_100: {
    type: 'clients_100',
    name: '100 Clients',
    description: 'Added 100 clients to your CRM',
    celebrationMessage: '100 clients in your CRM! Your network is growing.',
  },
  clients_500: {
    type: 'clients_500',
    name: '500 Clients',
    description: 'Added 500 clients to your CRM',
    celebrationMessage: '500 clients! You have built a thriving practice.',
  },
  first_ai_insight: {
    type: 'first_ai_insight',
    name: 'First AI Insight',
    description: 'Received your first AI-powered insight',
    celebrationMessage: 'Your AI assistant just delivered its first insight!',
  },
  five_star_review: {
    type: 'five_star_review',
    name: 'Five-Star Review',
    description: 'Received a 5-star review',
    celebrationMessage: 'Five stars! Your patients love what you do.',
  },
  team_member_added: {
    type: 'team_member_added',
    name: 'Team Member Added',
    description: 'Added a team member to your account',
    celebrationMessage: 'Your team is growing! Collaboration unlocked.',
  },
  integration_connected: {
    type: 'integration_connected',
    name: 'Integration Connected',
    description: 'Connected an external integration',
    celebrationMessage: 'Connected! Your tools are now working together.',
  },
};

export function checkMilestones(
  metrics: {
    appointmentCount: number;
    clientCount: number;
    totalRevenue: number;
    daysSinceSignup: number;
    loginCount: number;
    teamSize: number;
    integrationsConnected: number;
    aiInsightsViewed: number;
    fiveStarReviews: number;
    setupComplete: boolean;
  },
  existingMilestones: MilestoneType[]
): MilestoneType[] {
  const newMilestones: MilestoneType[] = [];
  const has = (t: MilestoneType) => existingMilestones.includes(t);

  if (metrics.loginCount >= 1 && !has('first_login'))
    newMilestones.push('first_login');
  if (metrics.setupComplete && !has('setup_complete'))
    newMilestones.push('setup_complete');
  if (metrics.appointmentCount >= 1 && !has('first_appointment'))
    newMilestones.push('first_appointment');
  if (metrics.appointmentCount >= 100 && !has('appointments_100'))
    newMilestones.push('appointments_100');
  if (metrics.appointmentCount >= 500 && !has('appointments_500'))
    newMilestones.push('appointments_500');
  if (metrics.appointmentCount >= 1000 && !has('appointments_1000'))
    newMilestones.push('appointments_1000');
  if (metrics.daysSinceSignup >= 30 && !has('first_month'))
    newMilestones.push('first_month');
  if (metrics.daysSinceSignup >= 90 && !has('three_months'))
    newMilestones.push('three_months');
  if (metrics.daysSinceSignup >= 180 && !has('six_months'))
    newMilestones.push('six_months');
  if (metrics.daysSinceSignup >= 365 && !has('one_year'))
    newMilestones.push('one_year');
  if (metrics.totalRevenue >= 10000 && !has('revenue_10k'))
    newMilestones.push('revenue_10k');
  if (metrics.totalRevenue >= 50000 && !has('revenue_50k'))
    newMilestones.push('revenue_50k');
  if (metrics.totalRevenue >= 100000 && !has('revenue_100k'))
    newMilestones.push('revenue_100k');
  if (metrics.clientCount >= 100 && !has('clients_100'))
    newMilestones.push('clients_100');
  if (metrics.clientCount >= 500 && !has('clients_500'))
    newMilestones.push('clients_500');
  if (metrics.aiInsightsViewed >= 1 && !has('first_ai_insight'))
    newMilestones.push('first_ai_insight');
  if (metrics.fiveStarReviews >= 1 && !has('five_star_review'))
    newMilestones.push('five_star_review');
  if (metrics.teamSize >= 2 && !has('team_member_added'))
    newMilestones.push('team_member_added');
  if (metrics.integrationsConnected >= 1 && !has('integration_connected'))
    newMilestones.push('integration_connected');

  return newMilestones;
}

// ─── Churn Risk Detection ─────────────────────────────────────────

export function assessChurnRisk(
  healthScore: number,
  signals: {
    loginDecline: number; // percentage decline in logins
    supportComplaints: number;
    failedPayments: number;
    daysWithoutLogin: number;
    cancelPageVisits: number;
    downgradedRecently: boolean;
    npsScore?: number;
  }
): ChurnRiskAssessment {
  const churnSignals: ChurnSignal[] = [];
  let riskScore = 0;

  if (signals.daysWithoutLogin >= 14) {
    const severity = signals.daysWithoutLogin >= 30 ? 'high' : signals.daysWithoutLogin >= 21 ? 'medium' : 'low';
    churnSignals.push({
      type: 'inactivity',
      severity,
      description: `No login for ${signals.daysWithoutLogin} days`,
      value: signals.daysWithoutLogin,
      threshold: 14,
    });
    riskScore += signals.daysWithoutLogin >= 30 ? 30 : signals.daysWithoutLogin >= 21 ? 20 : 10;
  }

  if (signals.loginDecline >= 30) {
    churnSignals.push({
      type: 'declining_usage',
      severity: signals.loginDecline >= 60 ? 'high' : 'medium',
      description: `Login frequency dropped ${signals.loginDecline}%`,
      value: signals.loginDecline,
      threshold: 30,
    });
    riskScore += signals.loginDecline >= 60 ? 25 : 15;
  }

  if (signals.supportComplaints >= 2) {
    churnSignals.push({
      type: 'support_complaints',
      severity: signals.supportComplaints >= 5 ? 'high' : 'medium',
      description: `${signals.supportComplaints} support complaints recently`,
      value: signals.supportComplaints,
      threshold: 2,
    });
    riskScore += signals.supportComplaints >= 5 ? 20 : 10;
  }

  if (signals.failedPayments >= 1) {
    churnSignals.push({
      type: 'payment_issues',
      severity: signals.failedPayments >= 3 ? 'high' : 'medium',
      description: `${signals.failedPayments} failed payment(s)`,
      value: signals.failedPayments,
      threshold: 1,
    });
    riskScore += signals.failedPayments >= 3 ? 20 : 10;
  }

  if (signals.cancelPageVisits >= 1) {
    churnSignals.push({
      type: 'cancel_intent',
      severity: 'high',
      description: `Visited cancellation page ${signals.cancelPageVisits} time(s)`,
      value: signals.cancelPageVisits,
      threshold: 1,
    });
    riskScore += 15;
  }

  if (signals.downgradedRecently) {
    churnSignals.push({
      type: 'downgrade',
      severity: 'medium',
      description: 'Recently downgraded their plan',
      value: 1,
      threshold: 1,
    });
    riskScore += 10;
  }

  if (signals.npsScore !== undefined && signals.npsScore <= 6) {
    churnSignals.push({
      type: 'low_nps',
      severity: signals.npsScore <= 3 ? 'high' : 'medium',
      description: `NPS score: ${signals.npsScore}/10`,
      value: signals.npsScore,
      threshold: 7,
    });
    riskScore += signals.npsScore <= 3 ? 15 : 10;
  }

  // Factor in health score
  if (healthScore < 40) riskScore += 15;
  else if (healthScore < 60) riskScore += 5;

  riskScore = Math.min(100, riskScore);

  let riskLevel: ChurnRiskLevel;
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'medium';
  else riskLevel = 'low';

  const recommendedAction = getChurnAction(riskLevel, churnSignals);

  return {
    tenantId: '',
    riskLevel,
    riskScore,
    signals: churnSignals,
    recommendedAction,
  };
}

function getChurnAction(level: ChurnRiskLevel, signals: ChurnSignal[]): string {
  if (level === 'critical') {
    return 'Immediate personal outreach: call the owner. Offer free month or personal onboarding session.';
  }
  if (level === 'high') {
    const hasPaymentIssue = signals.some((s) => s.type === 'payment_issues');
    if (hasPaymentIssue) {
      return 'Send payment recovery email. Offer temporary pause instead of cancel.';
    }
    return 'Send personal check-in email from success team. Offer strategy call.';
  }
  if (level === 'medium') {
    return 'Send feature adoption nudge. Highlight unused features that address their needs.';
  }
  return 'No immediate action. Continue monitoring.';
}

// ─── Save Offers ──────────────────────────────────────────────────

export function generateSaveOffer(
  tenantId: string,
  riskLevel: ChurnRiskLevel,
  plan: string
): SaveOffer[] {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const expires = expiresAt.toISOString();

  const offers: SaveOffer[] = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    offers.push({
      tenantId,
      type: 'free_month',
      title: 'Stay with us — next month is on the house',
      description: 'We want to make sure RaniOS is the right fit. Enjoy next month free while we work together to maximize your results.',
      value: 'Free month of service',
      expiresAt: expires,
      accepted: false,
    });

    offers.push({
      tenantId,
      type: 'personal_call',
      title: 'Let us help — free strategy session',
      description: 'Book a 30-minute call with our success team. We will review your setup and create a personalized action plan.',
      value: '30-min strategy session',
      expiresAt: expires,
      accepted: false,
    });
  }

  if (plan !== 'starter') {
    offers.push({
      tenantId,
      type: 'downgrade',
      title: 'Not using all the features? Try a smaller plan',
      description: 'Switch to a lower tier and save money. You can always upgrade again later.',
      value: 'Lower monthly cost',
      expiresAt: expires,
      accepted: false,
    });
  }

  if (riskLevel === 'critical') {
    offers.push({
      tenantId,
      type: 'discount',
      title: 'Exclusive: 50% off for 3 months',
      description: 'As a valued customer, enjoy half off for the next 3 months while you get the most out of RaniOS.',
      value: '50% off for 3 months',
      expiresAt: expires,
      accepted: false,
    });
  }

  return offers;
}

// ─── NPS Surveys ──────────────────────────────────────────────────

export function categorizeNPS(score: number): NPSCategory {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export function calculateNPSScore(surveys: NPSSurvey[]): number {
  const responded = surveys.filter((s) => s.score !== undefined);
  if (responded.length === 0) return 0;

  const promoters = responded.filter((s) => s.score! >= 9).length;
  const detractors = responded.filter((s) => s.score! <= 6).length;

  return Math.round(((promoters - detractors) / responded.length) * 100);
}

export function shouldSendNPS(
  daysSinceSignup: number,
  existingSurveys: NPSSurvey[]
): 'day_30' | 'day_90' | 'day_365' | null {
  const hasSurvey = (type: NPSSurvey['type']) =>
    existingSurveys.some((s) => s.type === type);

  if (daysSinceSignup >= 365 && !hasSurvey('day_365')) return 'day_365';
  if (daysSinceSignup >= 90 && !hasSurvey('day_90')) return 'day_90';
  if (daysSinceSignup >= 30 && !hasSurvey('day_30')) return 'day_30';
  return null;
}

// ─── Expansion Revenue Triggers ───────────────────────────────────

export function checkExpansionTriggers(
  tenantId: string,
  plan: string,
  usage: {
    aiCalls: { used: number; limit: number };
    smsCredits: { used: number; limit: number };
    providers: { used: number; limit: number };
    storageGB: { used: number; limit: number };
  },
  billingCycle: 'monthly' | 'annual'
): ExpansionTrigger[] {
  const triggers: ExpansionTrigger[] = [];

  // Usage approaching limits
  for (const [key, data] of Object.entries(usage)) {
    const pct = data.limit > 0 ? (data.used / data.limit) * 100 : 0;
    if (pct >= 80) {
      triggers.push({
        tenantId,
        trigger: `${key}_approaching_limit`,
        metric: key,
        currentValue: data.used,
        threshold: data.limit,
        suggestedAction: plan === 'enterprise' ? 'add_on' : 'upgrade',
        message: `You've used ${Math.round(pct)}% of your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} limit. ${plan !== 'enterprise' ? 'Upgrade for more capacity.' : 'Add extra capacity.'}`,
      });
    }
  }

  // Switch to annual billing suggestion
  if (billingCycle === 'monthly') {
    triggers.push({
      tenantId,
      trigger: 'annual_savings',
      metric: 'billing_cycle',
      currentValue: 12,
      threshold: 10,
      suggestedAction: 'annual_switch',
      message: 'Switch to annual billing and save 2 months. That is a 17% discount!',
    });
  }

  return triggers;
}

// ─── Referral Program ─────────────────────────────────────────────

export function createReferralCode(tenantId: string, clinicName: string): string {
  const slug = clinicName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  return `REF-${slug}-${tenantId.slice(-4).toUpperCase()}`;
}

export function initializeReferralProgram(
  tenantId: string,
  clinicName: string
): ReferralProgram {
  return {
    tenantId,
    referralCode: createReferralCode(tenantId, clinicName),
    referralsCount: 0,
    successfulReferrals: 0,
    creditsEarned: 0,
    creditsUsed: 0,
    referrals: [],
  };
}

export function processReferral(
  program: ReferralProgram,
  referredClinicName: string,
  referredEmail: string
): ReferralProgram {
  const updated = { ...program, referrals: [...program.referrals] };
  updated.referrals.push({
    referredClinicName,
    referredEmail,
    status: 'pending',
    createdAt: new Date().toISOString(),
    creditAwarded: false,
  });
  updated.referralsCount += 1;
  return updated;
}

export function convertReferral(
  program: ReferralProgram,
  referredEmail: string
): ReferralProgram {
  const updated = { ...program, referrals: [...program.referrals] };
  const idx = updated.referrals.findIndex(
    (r) => r.referredEmail === referredEmail && r.status !== 'paid'
  );

  if (idx >= 0) {
    updated.referrals[idx] = {
      ...updated.referrals[idx],
      status: 'paid',
      convertedAt: new Date().toISOString(),
      creditAwarded: true,
    };
    updated.successfulReferrals += 1;
    updated.creditsEarned += 1; // 1 free month per successful referral
  }

  return updated;
}

export function getReferralStats(program: ReferralProgram): {
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  creditsAvailable: number;
  totalValueEarned: number;
} {
  const creditsAvailable = program.creditsEarned - program.creditsUsed;
  return {
    totalReferrals: program.referralsCount,
    successfulReferrals: program.successfulReferrals,
    conversionRate: program.referralsCount > 0
      ? Math.round((program.successfulReferrals / program.referralsCount) * 100)
      : 0,
    creditsAvailable,
    totalValueEarned: program.creditsEarned * 499, // assume Professional plan value
  };
}
