/**
 * RaniOS Tenant Dashboard — AI Engines Module
 *
 * Tenant-scoped AI: churn prediction, no-show prediction, revenue anomaly,
 * treatment recommendations, dynamic pricing, schedule optimization,
 * content generation, and consult copilot.
 * All queries scoped to tenant via TenantDatabaseClient.
 */

import type { TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig, FeatureFlags } from '@/lib/tenant/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AIEngineStatus {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiredTier: string;
  lastRun?: string;
  status: 'active' | 'disabled' | 'error' | 'upgrade_required';
  usage: { current: number; limit: number; unit: string };
}

export interface AIEngineHub {
  engines: AIEngineStatus[];
  totalAICredits: number;
  usedAICredits: number;
  tier: string;
}

// ─── Churn Prediction ───────────────────────────────────────────────────────

export interface TenantChurnPrediction {
  clientId: string;
  clientName: string;
  score: number;           // 0–100
  risk: 'low' | 'moderate' | 'high' | 'critical';
  factors: { name: string; score: number; weight: number; detail: string }[];
  recommendation: string;
  predictedChurnDate?: string;
  suggestedAction: string;
  automationAvailable: boolean;
}

export interface ChurnDashboard {
  predictions: TenantChurnPrediction[];
  summary: {
    totalAtRisk: number;
    criticalCount: number;
    highCount: number;
    moderateCount: number;
    avgChurnScore: number;
    revenueAtRisk: number;
  };
}

// ─── No-Show Prediction ─────────────────────────────────────────────────────

export interface TenantNoShowPrediction {
  appointmentId: string;
  clientName: string;
  service: string;
  scheduledTime: string;
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  factors: { name: string; score: number; weight: number; detail: string }[];
  recommendation: string;
  automatedAction?: string;
}

// ─── Dynamic Pricing ────────────────────────────────────────────────────────

export interface PricingSuggestion {
  service: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  strategy: 'demand' | 'temporal' | 'competitor' | 'cost_plus' | 'penetration' | 'bundle';
  confidence: number;      // 0–100
  reasoning: string;
  estimatedRevenueImpact: number;
  effectivePeriod?: { start: string; end: string };
}

export interface PricingDashboard {
  suggestions: PricingSuggestion[];
  overallImpact: number;
  competitorComparison: { competitor: string; avgPriceDiff: number }[];
}

// ─── Schedule Optimization ──────────────────────────────────────────────────

export interface ScheduleAISuggestion {
  type: 'fill_gap' | 'resolve_conflict' | 'balance_load' | 'optimize_revenue';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action: string;
  revenuePotential: number;
  automated: boolean;
  affectedProviders: string[];
}

// ─── Content Generation ─────────────────────────────────────────────────────

export type ContentType = 'social_post' | 'email_campaign' | 'sms' | 'blog' | 'ad_copy' | 'review_response';

export interface ContentRequest {
  type: ContentType;
  topic: string;
  tone?: 'professional' | 'casual' | 'luxurious' | 'urgent' | 'educational';
  targetAudience?: string;
  keywords?: string[];
  maxLength?: number;
  platform?: string;
}

export interface GeneratedContent {
  id: string;
  type: ContentType;
  content: string;
  variants: string[];
  hashtags?: string[];
  suggestedSchedule?: string;
  score: number;           // 0–100 quality score
  metadata: {
    wordCount: number;
    readingTime: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

// ─── Consult Copilot ────────────────────────────────────────────────────────

export interface ConsultBriefing {
  clientId: string;
  clientName: string;
  segment: string;
  visitHistory: string;
  topConcerns: string[];
  treatmentPlan: ConsultTreatmentPlan;
  talkingPoints: TalkingPoint[];
  objectionHandlers: ObjectionHandler[];
  crossSellOpportunities: CrossSellOpp[];
  closingStrategy: ClosingStrategy;
}

export interface ConsultTreatmentPlan {
  primary: { service: string; price: number; reason: string };
  addons: { service: string; price: number; reason: string }[];
  totalEstimate: number;
}

export interface TalkingPoint {
  timing: 'opening' | 'during' | 'closing';
  priority: 'must_say' | 'should_say' | 'nice_to_say';
  text: string;
}

export interface ObjectionHandler {
  objection: string;
  technique: string;
  response: string;
}

export interface CrossSellOpp {
  service: string;
  reason: string;
  likelihood: number;
  discount?: number;
}

export interface ClosingStrategy {
  type: 'assumptive' | 'choice' | 'urgency' | 'value' | 'trial';
  script: string;
  financingPitch?: string;
  membershipPitch?: string;
}

// ─── AI Engine Hub ──────────────────────────────────────────────────────────

export function getAIEngineHub(tenant: TenantConfig): AIEngineHub {
  const featureToEngine: { id: string; name: string; description: string; feature: keyof FeatureFlags; tier: string }[] = [
    { id: 'churn', name: 'Churn Prediction', description: 'Identify at-risk clients before they leave', feature: 'churn', tier: 'professional' },
    { id: 'no-show', name: 'No-Show Prediction', description: 'Score appointment no-show risk and automate reminders', feature: 'noShow', tier: 'professional' },
    { id: 'pricing', name: 'Dynamic Pricing', description: 'AI-powered pricing suggestions based on demand and competition', feature: 'pricing', tier: 'professional' },
    { id: 'pnl', name: 'P&L Intelligence', description: 'Financial health scoring and expense optimization', feature: 'pnl', tier: 'professional' },
    { id: 'schedule', name: 'Schedule Optimizer', description: 'Fill gaps, resolve conflicts, and balance provider workloads', feature: 'schedule', tier: 'starter' },
    { id: 'inventory', name: 'Inventory Manager', description: 'Auto-reorder points, waste analysis, and par levels', feature: 'inventory', tier: 'professional' },
    { id: 'social', name: 'Social Content AI', description: 'Generate social media posts, stories, and content calendars', feature: 'social', tier: 'professional' },
    { id: 'ads', name: 'Meta Ads Manager', description: 'AI campaign analysis, ad copy generation, budget optimization', feature: 'ads', tier: 'professional' },
    { id: 'consult', name: 'Consult Co-pilot', description: 'Client briefings, treatment plans, and closing strategies', feature: 'consult', tier: 'professional' },
    { id: 'rag', name: 'Knowledge Base', description: 'Semantic search across clinic documents and protocols', feature: 'rag', tier: 'enterprise' },
    { id: 'phone', name: 'AI Phone Agent', description: 'Voice AI receptionist with booking and FAQ handling', feature: 'phone', tier: 'enterprise' },
    { id: 'templates', name: 'Smart Templates', description: 'AI-powered communication templates for follow-ups and campaigns', feature: 'templates', tier: 'professional' },
  ];

  const engines: AIEngineStatus[] = featureToEngine.map(engine => {
    const enabled = tenant.features[engine.feature];
    return {
      id: engine.id,
      name: engine.name,
      description: engine.description,
      enabled,
      requiredTier: engine.tier,
      status: enabled ? 'active' : 'upgrade_required',
      usage: { current: 0, limit: getUsageLimit(tenant.subscription.tier, engine.id), unit: 'requests' },
    };
  });

  return {
    engines,
    totalAICredits: getAICredits(tenant.subscription.tier),
    usedAICredits: 0,
    tier: tenant.subscription.tier,
  };
}

// ─── Churn Prediction (Tenant-Scoped) ───────────────────────────────────────

export async function runChurnPrediction(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  limit = 20
): Promise<ChurnDashboard> {
  const clients = await db.fetchAll<{
    'First Name': string;
    'Last Name': string;
    'Total Spend': number;
    'Visit Count': number;
    'Last Visit': string;
    Membership: string;
    Status: string;
  }>('Clients', {
    filterByFormula: `OR({Status} = 'Active', {Status} = 'active', {Status} = 'Lapsed', {Status} = 'lapsed')`,
    fields: ['First Name', 'Last Name', 'Total Spend', 'Visit Count', 'Last Visit', 'Membership', 'Status'],
  });

  const predictions: TenantChurnPrediction[] = clients.map(c => {
    const daysSince = c.fields['Last Visit']
      ? Math.floor((Date.now() - new Date(c.fields['Last Visit']).getTime()) / 86400000)
      : 999;
    const visitCount = c.fields['Visit Count'] || 0;
    const totalSpend = c.fields['Total Spend'] || 0;
    const hasMembership = !!c.fields.Membership;

    // Weighted scoring
    const recencyScore = daysSince <= 14 ? 5 : daysSince <= 30 ? 15 : daysSince <= 60 ? 45 : daysSince <= 90 ? 75 : 95;
    const freqScore = visitCount >= 10 ? 5 : visitCount >= 5 ? 20 : visitCount >= 3 ? 40 : 60;
    const moneyScore = totalSpend >= 5000 ? 5 : totalSpend >= 2000 ? 20 : totalSpend >= 500 ? 40 : 70;
    const memScore = hasMembership ? 10 : 60;

    const score = Math.round(recencyScore * 0.4 + freqScore * 0.2 + moneyScore * 0.15 + memScore * 0.15 + 30 * 0.1);
    const risk = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'moderate' : 'low';

    const actions: Record<string, string> = {
      critical: 'Immediate personal call from provider',
      high: 'Send targeted reactivation with premium offer',
      moderate: 'Automated re-engagement email sequence',
      low: 'Maintain regular communication cadence',
    };

    return {
      clientId: c.id,
      clientName: `${c.fields['First Name'] || ''} ${c.fields['Last Name'] || ''}`.trim(),
      score,
      risk,
      factors: [
        { name: 'Recency', score: recencyScore, weight: 40, detail: `${daysSince}d since last visit` },
        { name: 'Frequency', score: freqScore, weight: 20, detail: `${visitCount} total visits` },
        { name: 'Monetary', score: moneyScore, weight: 15, detail: `$${totalSpend} lifetime spend` },
        { name: 'Membership', score: memScore, weight: 15, detail: hasMembership ? 'Active member' : 'No membership' },
      ],
      recommendation: `Client is ${risk} risk. ${actions[risk]}`,
      suggestedAction: actions[risk],
      automationAvailable: risk !== 'critical',
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const atRisk = predictions.filter(p => p.risk !== 'low');
  return {
    predictions,
    summary: {
      totalAtRisk: atRisk.length,
      criticalCount: atRisk.filter(p => p.risk === 'critical').length,
      highCount: atRisk.filter(p => p.risk === 'high').length,
      moderateCount: atRisk.filter(p => p.risk === 'moderate').length,
      avgChurnScore: predictions.length > 0
        ? Math.round(predictions.reduce((s, p) => s + p.score, 0) / predictions.length)
        : 0,
      revenueAtRisk: 0, // Would need LTV data
    },
  };
}

// ─── Dynamic Pricing Suggestions ────────────────────────────────────────────

export async function getDynamicPricing(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<PricingDashboard> {
  const transactions = await db.fetchAll<{
    Service: string;
    Amount: number;
    Date: string;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${new Date(Date.now() - 90 * 86400000).toISOString()}'), {Status} != 'Refunded')`,
    fields: ['Service', 'Amount', 'Date'],
  });

  const serviceMap = new Map<string, { amounts: number[]; dates: string[] }>();
  for (const { fields } of transactions) {
    const service = fields.Service || 'Unknown';
    const existing = serviceMap.get(service) || { amounts: [], dates: [] };
    existing.amounts.push(fields.Amount || 0);
    existing.dates.push(fields.Date || '');
    serviceMap.set(service, existing);
  }

  const suggestions: PricingSuggestion[] = Array.from(serviceMap.entries())
    .filter(([_, data]) => data.amounts.length >= 3)
    .map(([service, data]) => {
      const avgPrice = data.amounts.reduce((s, a) => s + a, 0) / data.amounts.length;
      const recentAmounts = data.amounts.slice(-10);
      const recentAvg = recentAmounts.reduce((s, a) => s + a, 0) / recentAmounts.length;

      // Simple demand-based adjustment
      const demandFactor = data.amounts.length > 20 ? 1.05 : data.amounts.length > 10 ? 1.02 : 0.98;
      const suggestedPrice = Math.round(recentAvg * demandFactor * 100) / 100;
      const changePercent = Math.round(((suggestedPrice - avgPrice) / avgPrice) * 1000) / 10;

      return {
        service,
        currentPrice: Math.round(avgPrice * 100) / 100,
        suggestedPrice,
        changePercent,
        strategy: 'demand' as const,
        confidence: Math.min(95, 50 + data.amounts.length),
        reasoning: `Based on ${data.amounts.length} transactions. ${data.amounts.length > 15 ? 'High demand suggests price increase.' : 'Moderate demand, maintain pricing.'}`,
        estimatedRevenueImpact: Math.round((suggestedPrice - avgPrice) * data.amounts.length * 100) / 100,
      };
    })
    .sort((a, b) => Math.abs(b.estimatedRevenueImpact) - Math.abs(a.estimatedRevenueImpact));

  return {
    suggestions,
    overallImpact: suggestions.reduce((s, sg) => s + sg.estimatedRevenueImpact, 0),
    competitorComparison: [],
  };
}

// ─── Content Generation ─────────────────────────────────────────────────────

export function generateContent(
  _tenant: TenantConfig,
  request: ContentRequest
): GeneratedContent {
  const templates: Record<ContentType, (req: ContentRequest, clinic: string) => string> = {
    social_post: (req, clinic) =>
      `Ready to transform your look? At ${clinic}, we're passionate about helping you feel your absolute best. ${req.topic} #MedSpa #Beauty #SelfCare`,
    email_campaign: (req, clinic) =>
      `Subject: Your ${req.topic} Journey Starts Here\n\nDear Valued Client,\n\nAt ${clinic}, we believe every client deserves personalized care. ${req.topic}\n\nBook your consultation today.`,
    sms: (req, clinic) =>
      `Hi! ${clinic} here. ${req.topic} Book now & save. Reply STOP to opt out.`,
    blog: (req, clinic) =>
      `# ${req.topic}\n\nAt ${clinic}, we stay at the forefront of aesthetic innovation. ${req.topic}\n\nSchedule your consultation to learn more.`,
    ad_copy: (req, clinic) =>
      `${req.topic} | ${clinic}\nExpert care. Stunning results. Book your free consultation today.\nLimited spots available this month.`,
    review_response: (req, _clinic) =>
      `Thank you for your wonderful review! We're thrilled to hear about your experience with ${req.topic}. Our team is dedicated to delivering exceptional results.`,
  };

  const clinicName = _tenant.branding.clinicName;
  const content = templates[request.type](request, clinicName);
  const variant1 = content.replace('transform', 'elevate').replace('passionate', 'committed');
  const variant2 = content.replace('Ready to', 'Time to').replace('Valued', 'Dear');

  return {
    id: `gen-${Date.now()}`,
    type: request.type,
    content,
    variants: [variant1, variant2],
    hashtags: request.type === 'social_post'
      ? ['#MedSpa', '#Beauty', '#SkinCare', '#Wellness', `#${clinicName.replace(/\s+/g, '')}`]
      : undefined,
    score: 75,
    metadata: {
      wordCount: content.split(/\s+/).length,
      readingTime: Math.ceil(content.split(/\s+/).length / 200),
      sentiment: 'positive',
    },
  };
}

// ─── Consult Copilot ────────────────────────────────────────────────────────

export async function getConsultBriefing(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  clientId: string
): Promise<ConsultBriefing | null> {
  const clientRecords = await db.fetchAll<Record<string, unknown>>('Clients', {
    filterByFormula: `RECORD_ID() = '${clientId}'`,
  });

  if (clientRecords.length === 0) return null;

  const client = clientRecords[0];
  const f = client.fields as Record<string, unknown>;
  const firstName = (f['First Name'] as string) || '';
  const lastName = (f['Last Name'] as string) || '';
  const totalSpend = (f['Total Spend'] as number) || 0;
  const visitCount = (f['Visit Count'] as number) || 0;

  const segment = totalSpend >= 5000 ? 'vip' : totalSpend >= 2000 ? 'regular' : visitCount > 0 ? 'new' : 'prospect';

  return {
    clientId,
    clientName: `${firstName} ${lastName}`.trim(),
    segment,
    visitHistory: `${visitCount} visits, $${totalSpend} total spend`,
    topConcerns: ['Aging', 'Skin Texture', 'Volume Loss'],
    treatmentPlan: {
      primary: { service: 'Consultation', price: 0, reason: 'Assess needs and develop plan' },
      addons: [
        { service: 'HydraFacial', price: 275, reason: 'Immediate skin improvement' },
      ],
      totalEstimate: 275,
    },
    talkingPoints: [
      { timing: 'opening', priority: 'must_say', text: `Welcome${visitCount > 0 ? ' back' : ''}, ${firstName}! Great to ${visitCount > 0 ? 'see you again' : 'meet you'}.` },
      { timing: 'during', priority: 'should_say', text: 'Based on your skin analysis, I recommend a customized treatment plan.' },
      { timing: 'closing', priority: 'must_say', text: 'Would you like to schedule your first treatment today?' },
    ],
    objectionHandlers: [
      { objection: 'Too expensive', technique: 'reframe', response: 'Think of it as an investment in yourself. We also offer financing with 0% interest.' },
      { objection: 'Need to think about it', technique: 'feel-felt-found', response: 'I understand. Many clients felt the same way, but found that starting sooner gave them the best results.' },
      { objection: 'Does it hurt?', technique: 'normalize', response: 'Most clients describe it as mild discomfort at most. We use numbing cream to ensure your comfort.' },
    ],
    crossSellOpportunities: [
      { service: 'Membership', reason: 'Save 15% on all treatments', likelihood: 65 },
      { service: 'Skincare Products', reason: 'Maintain results at home', likelihood: 80 },
    ],
    closingStrategy: {
      type: segment === 'vip' ? 'assumptive' : 'choice',
      script: segment === 'vip'
        ? `Let me get your next appointment scheduled. Would next week work for you?`
        : `Would you prefer to start with the basic plan or the premium package?`,
      financingPitch: 'We offer 0% financing through Cherry. Payments as low as $50/month.',
      membershipPitch: `Our membership saves you 15% on every treatment. At your level, that's significant savings.`,
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUsageLimit(tier: string, _engineId: string): number {
  const limits: Record<string, number> = {
    starter: 100,
    professional: 1000,
    enterprise: 10000,
  };
  return limits[tier] || 100;
}

function getAICredits(tier: string): number {
  const credits: Record<string, number> = {
    starter: 500,
    professional: 5000,
    enterprise: 50000,
  };
  return credits[tier] || 500;
}
