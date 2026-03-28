// =============================================================================
// RaniOS Per-Tenant Analytics
// Revenue, usage, engagement, health scoring, benchmarking, risk flags
// =============================================================================

// =============================================================================
// Types
// =============================================================================

export interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  tier: 'starter' | 'pro' | 'enterprise';
  period: string; // e.g., '2026-03'
  revenue: RevenueMetrics;
  usage: UsageMetrics;
  engagement: EngagementMetrics;
  healthScore: HealthScore;
  benchmarks: BenchmarkComparison;
  growth: GrowthIndicators;
  riskFlags: RiskFlag[];
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  churnRate: number;
  ltv: number;
  expansionRevenue: number;
  contractionRevenue: number;
  netRevenueRetention: number;
  paymentHistory: Array<{ date: string; amount: number; status: 'paid' | 'failed' | 'refunded' }>;
  invoicesPastDue: number;
}

export interface UsageMetrics {
  apiCallsThisMonth: number;
  apiCallsLimit: number;
  activeUsers: number;
  totalUsers: number;
  storageUsedMb: number;
  storageLimitMb: number;
  integrationsActive: number;
  integrationsLimit: number;
  aiCallsThisMonth: number;
  aiCallsLimit: number;
  emailsSentThisMonth: number;
  emailsLimit: number;
  automationsActive: number;
  automationsLimit: number;
}

export interface EngagementMetrics {
  dauCount: number;
  mauCount: number;
  dauMauRatio: number;
  avgSessionDurationMinutes: number;
  sessionsPerUser: number;
  featureAdoption: FeatureAdoptionItem[];
  lastLoginAt: string | null;
  daysSinceLastLogin: number;
  pageViewsThisMonth: number;
  topFeatures: Array<{ feature: string; usageCount: number }>;
}

export interface FeatureAdoptionItem {
  feature: string;
  adopted: boolean;
  firstUsedAt: string | null;
  usageCountThisMonth: number;
  category: 'core' | 'ai' | 'automation' | 'analytics' | 'communication';
}

export interface HealthScore {
  overall: number; // 0-100
  grade: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  components: HealthComponent[];
  trend: 'improving' | 'stable' | 'declining';
  previousScore: number;
  calculatedAt: string;
}

export interface HealthComponent {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  detail: string;
}

export interface BenchmarkComparison {
  cohort: string;
  cohortSize: number;
  metrics: Array<{
    metric: string;
    tenantValue: number;
    cohortMedian: number;
    cohortP75: number;
    cohortP90: number;
    percentile: number;
  }>;
}

export interface GrowthIndicators {
  userGrowthRate: number;
  featureAdoptionRate: number;
  usageGrowthRate: number;
  revenueGrowthRate: number;
  expansionPotential: 'high' | 'medium' | 'low';
  upsellRecommendation: string | null;
}

export interface RiskFlag {
  type: 'churn' | 'payment' | 'engagement' | 'usage' | 'support';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detail: string;
  detectedAt: string;
  suggestedAction: string;
}

// =============================================================================
// Revenue Metrics Calculator
// =============================================================================

export function calculateRevenueMetrics(
  mrr: number,
  previousMrr: number,
  monthsActive: number,
  paymentHistory: Array<{ date: string; amount: number; status: 'paid' | 'failed' | 'refunded' }>
): RevenueMetrics {
  const arr = mrr * 12;
  const churnRate = previousMrr > 0 && mrr < previousMrr
    ? ((previousMrr - mrr) / previousMrr) * 100
    : 0;

  // Simple LTV: ARPU / monthly churn rate
  const monthlyChurnRate = churnRate / 100;
  const ltv = monthlyChurnRate > 0 ? mrr / monthlyChurnRate : mrr * 36;

  const expansion = mrr > previousMrr ? mrr - previousMrr : 0;
  const contraction = mrr < previousMrr ? previousMrr - mrr : 0;
  const nrr = previousMrr > 0 ? ((mrr - contraction + expansion) / previousMrr) * 100 : 100;

  const pastDue = paymentHistory.filter((p) => p.status === 'failed').length;

  return {
    mrr,
    arr,
    arpu: mrr, // Per-tenant, ARPU = MRR
    churnRate: Math.round(churnRate * 10) / 10,
    ltv: Math.round(ltv),
    expansionRevenue: expansion,
    contractionRevenue: contraction,
    netRevenueRetention: Math.round(nrr * 10) / 10,
    paymentHistory,
    invoicesPastDue: pastDue,
  };
}

// =============================================================================
// Usage Metrics Calculator
// =============================================================================

export function calculateUsageMetrics(
  tier: 'starter' | 'pro' | 'enterprise',
  rawUsage: {
    apiCalls: number;
    activeUsers: number;
    totalUsers: number;
    storageMb: number;
    integrations: number;
    aiCalls: number;
    emails: number;
    automations: number;
  }
): UsageMetrics {
  const limits: Record<string, { api: number; storage: number; integrations: number; ai: number; emails: number; automations: number }> = {
    starter: { api: 5000, storage: 5120, integrations: 5, ai: 1000, emails: 2000, automations: 5 },
    pro: { api: 25000, storage: 25600, integrations: 15, ai: 5000, emails: 10000, automations: 999 },
    enterprise: { api: 999999, storage: 102400, integrations: 999, ai: 999999, emails: 999999, automations: 999 },
  };

  const tierLimits = limits[tier];

  return {
    apiCallsThisMonth: rawUsage.apiCalls,
    apiCallsLimit: tierLimits.api,
    activeUsers: rawUsage.activeUsers,
    totalUsers: rawUsage.totalUsers,
    storageUsedMb: rawUsage.storageMb,
    storageLimitMb: tierLimits.storage,
    integrationsActive: rawUsage.integrations,
    integrationsLimit: tierLimits.integrations,
    aiCallsThisMonth: rawUsage.aiCalls,
    aiCallsLimit: tierLimits.ai,
    emailsSentThisMonth: rawUsage.emails,
    emailsLimit: tierLimits.emails,
    automationsActive: rawUsage.automations,
    automationsLimit: tierLimits.automations,
  };
}

export function getUsageAlerts(usage: UsageMetrics): Array<{ resource: string; percent: number; severity: 'info' | 'warning' | 'critical' }> {
  const checks = [
    { resource: 'API Calls', used: usage.apiCallsThisMonth, limit: usage.apiCallsLimit },
    { resource: 'Storage', used: usage.storageUsedMb, limit: usage.storageLimitMb },
    { resource: 'AI Calls', used: usage.aiCallsThisMonth, limit: usage.aiCallsLimit },
    { resource: 'Emails', used: usage.emailsSentThisMonth, limit: usage.emailsLimit },
    { resource: 'Integrations', used: usage.integrationsActive, limit: usage.integrationsLimit },
  ];

  return checks
    .map((c) => {
      const percent = (c.used / c.limit) * 100;
      const severity = percent >= 95 ? 'critical' as const : percent >= 80 ? 'warning' as const : 'info' as const;
      return { resource: c.resource, percent: Math.round(percent), severity };
    })
    .filter((a) => a.severity !== 'info');
}

// =============================================================================
// Engagement Metrics Calculator
// =============================================================================

export function calculateEngagementMetrics(
  activeUsersDaily: number,
  activeUsersMonthly: number,
  totalUsers: number,
  sessions: Array<{ userId: string; durationMinutes: number; date: string }>,
  featureUsage: Array<{ feature: string; count: number; category: string; firstUsed: string | null }>,
  lastLoginAt: string | null,
  pageViews: number
): EngagementMetrics {
  const dauMauRatio = activeUsersMonthly > 0 ? activeUsersDaily / activeUsersMonthly : 0;
  const avgSession = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / sessions.length
    : 0;
  const sessionsPerUser = activeUsersMonthly > 0
    ? sessions.length / activeUsersMonthly
    : 0;

  const daysSinceLastLogin = lastLoginAt
    ? Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const allFeatures = getFeatureList();
  const featureAdoption: FeatureAdoptionItem[] = allFeatures.map((f) => {
    const usage = featureUsage.find((u) => u.feature === f.name);
    return {
      feature: f.name,
      adopted: usage ? usage.count > 0 : false,
      firstUsedAt: usage?.firstUsed || null,
      usageCountThisMonth: usage?.count || 0,
      category: f.category as FeatureAdoptionItem['category'],
    };
  });

  const topFeatures = featureUsage
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((f) => ({ feature: f.feature, usageCount: f.count }));

  return {
    dauCount: activeUsersDaily,
    mauCount: activeUsersMonthly,
    dauMauRatio: Math.round(dauMauRatio * 100) / 100,
    avgSessionDurationMinutes: Math.round(avgSession * 10) / 10,
    sessionsPerUser: Math.round(sessionsPerUser * 10) / 10,
    featureAdoption,
    lastLoginAt,
    daysSinceLastLogin,
    pageViewsThisMonth: pageViews,
    topFeatures,
  };
}

function getFeatureList(): Array<{ name: string; category: string }> {
  return [
    { name: 'Dashboard', category: 'core' },
    { name: 'Client CRM', category: 'core' },
    { name: 'Appointments', category: 'core' },
    { name: 'AI Intake Intelligence', category: 'ai' },
    { name: 'Churn Prediction', category: 'ai' },
    { name: 'Treatment Recommendations', category: 'ai' },
    { name: 'Consult Co-pilot', category: 'ai' },
    { name: 'Dynamic Pricing', category: 'ai' },
    { name: 'Schedule Optimizer', category: 'automation' },
    { name: 'Automated Follow-ups', category: 'automation' },
    { name: 'Review Commander', category: 'automation' },
    { name: 'Social Content Engine', category: 'automation' },
    { name: 'Revenue Analytics', category: 'analytics' },
    { name: 'P&L Intelligence', category: 'analytics' },
    { name: 'Meta Ads Manager', category: 'analytics' },
    { name: 'Email Campaigns', category: 'communication' },
    { name: 'SMS Messaging', category: 'communication' },
  ];
}

// =============================================================================
// Health Score Algorithm
// =============================================================================

export function calculateHealthScore(
  revenue: RevenueMetrics,
  engagement: EngagementMetrics,
  usage: UsageMetrics,
  supportTickets: number,
  previousScore: number
): HealthScore {
  const components: HealthComponent[] = [];

  // Engagement component (30%)
  const engagementScore = Math.min(30, Math.round(
    (engagement.dauMauRatio > 0.3 ? 10 : engagement.dauMauRatio * 33) +
    (engagement.daysSinceLastLogin <= 1 ? 10 : engagement.daysSinceLastLogin <= 7 ? 5 : 0) +
    (engagement.featureAdoption.filter((f) => f.adopted).length / engagement.featureAdoption.length * 10)
  ));
  components.push({
    name: 'Engagement',
    score: engagementScore,
    maxScore: 30,
    weight: 0.30,
    detail: `DAU/MAU: ${(engagement.dauMauRatio * 100).toFixed(0)}%, ${engagement.featureAdoption.filter((f) => f.adopted).length} features adopted`,
  });

  // Revenue health (25%)
  const revenueScore = Math.min(25, Math.round(
    (revenue.invoicesPastDue === 0 ? 10 : revenue.invoicesPastDue === 1 ? 5 : 0) +
    (revenue.churnRate === 0 ? 10 : revenue.churnRate < 5 ? 5 : 0) +
    (revenue.netRevenueRetention >= 100 ? 5 : revenue.netRevenueRetention >= 90 ? 3 : 0)
  ));
  components.push({
    name: 'Revenue',
    score: revenueScore,
    maxScore: 25,
    weight: 0.25,
    detail: `NRR: ${revenue.netRevenueRetention}%, ${revenue.invoicesPastDue} past due`,
  });

  // Usage component (20%)
  const apiPercent = usage.apiCallsThisMonth / usage.apiCallsLimit;
  const usageScore = Math.min(20, Math.round(
    (apiPercent > 0.1 && apiPercent < 0.9 ? 10 : apiPercent >= 0.1 ? 5 : 0) +
    (usage.integrationsActive >= 2 ? 5 : usage.integrationsActive >= 1 ? 3 : 0) +
    (usage.activeUsers / Math.max(1, usage.totalUsers) > 0.5 ? 5 : 3)
  ));
  components.push({
    name: 'Usage',
    score: usageScore,
    maxScore: 20,
    weight: 0.20,
    detail: `${usage.integrationsActive} integrations, ${usage.activeUsers}/${usage.totalUsers} active users`,
  });

  // Support health (15%)
  const supportScore = Math.min(15, Math.round(
    supportTickets === 0 ? 15 :
    supportTickets <= 2 ? 10 :
    supportTickets <= 5 ? 5 : 0
  ));
  components.push({
    name: 'Support',
    score: supportScore,
    maxScore: 15,
    weight: 0.15,
    detail: `${supportTickets} tickets this month`,
  });

  // Growth potential (10%)
  const growthScore = Math.min(10, Math.round(
    (revenue.expansionRevenue > 0 ? 5 : 0) +
    (engagement.featureAdoption.filter((f) => f.adopted).length > engagement.featureAdoption.length * 0.5 ? 3 : 0) +
    (usage.activeUsers > usage.totalUsers * 0.7 ? 2 : 0)
  ));
  components.push({
    name: 'Growth',
    score: growthScore,
    maxScore: 10,
    weight: 0.10,
    detail: `$${revenue.expansionRevenue} expansion revenue`,
  });

  const overall = components.reduce((sum, c) => sum + c.score, 0);

  const grade = overall >= 85 ? 'excellent' :
    overall >= 70 ? 'good' :
    overall >= 50 ? 'fair' :
    overall >= 30 ? 'poor' : 'critical';

  const trend = overall > previousScore + 5 ? 'improving' :
    overall < previousScore - 5 ? 'declining' : 'stable';

  return {
    overall,
    grade,
    components,
    trend,
    previousScore,
    calculatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Benchmarking
// =============================================================================

export function generateBenchmark(
  tenantMetrics: TenantMetrics,
  cohortData: Array<{
    tenantId: string;
    tier: string;
    mrr: number;
    dauMauRatio: number;
    featureAdoptionRate: number;
    avgSessionMinutes: number;
    integrationsCount: number;
  }>
): BenchmarkComparison {
  const sameTier = cohortData.filter((c) => c.tier === tenantMetrics.tier);

  function percentile(values: number[], target: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= target);
    return index >= 0 ? Math.round((index / sorted.length) * 100) : 100;
  }

  function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function p75(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.75)] || 0;
  }

  function p90(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.9)] || 0;
  }

  const mrrValues = sameTier.map((c) => c.mrr);
  const dauMauValues = sameTier.map((c) => c.dauMauRatio);
  const adoptionValues = sameTier.map((c) => c.featureAdoptionRate);
  const sessionValues = sameTier.map((c) => c.avgSessionMinutes);
  const integrationValues = sameTier.map((c) => c.integrationsCount);

  return {
    cohort: `${tenantMetrics.tier} tier`,
    cohortSize: sameTier.length,
    metrics: [
      {
        metric: 'Monthly Revenue',
        tenantValue: tenantMetrics.revenue.mrr,
        cohortMedian: Math.round(median(mrrValues)),
        cohortP75: Math.round(p75(mrrValues)),
        cohortP90: Math.round(p90(mrrValues)),
        percentile: percentile(mrrValues, tenantMetrics.revenue.mrr),
      },
      {
        metric: 'DAU/MAU Ratio',
        tenantValue: tenantMetrics.engagement.dauMauRatio,
        cohortMedian: Math.round(median(dauMauValues) * 100) / 100,
        cohortP75: Math.round(p75(dauMauValues) * 100) / 100,
        cohortP90: Math.round(p90(dauMauValues) * 100) / 100,
        percentile: percentile(dauMauValues, tenantMetrics.engagement.dauMauRatio),
      },
      {
        metric: 'Feature Adoption',
        tenantValue: Math.round(tenantMetrics.engagement.featureAdoption.filter((f) => f.adopted).length / tenantMetrics.engagement.featureAdoption.length * 100),
        cohortMedian: Math.round(median(adoptionValues)),
        cohortP75: Math.round(p75(adoptionValues)),
        cohortP90: Math.round(p90(adoptionValues)),
        percentile: percentile(adoptionValues, tenantMetrics.engagement.featureAdoption.filter((f) => f.adopted).length / tenantMetrics.engagement.featureAdoption.length * 100),
      },
      {
        metric: 'Avg Session Duration (min)',
        tenantValue: tenantMetrics.engagement.avgSessionDurationMinutes,
        cohortMedian: Math.round(median(sessionValues) * 10) / 10,
        cohortP75: Math.round(p75(sessionValues) * 10) / 10,
        cohortP90: Math.round(p90(sessionValues) * 10) / 10,
        percentile: percentile(sessionValues, tenantMetrics.engagement.avgSessionDurationMinutes),
      },
      {
        metric: 'Active Integrations',
        tenantValue: tenantMetrics.usage.integrationsActive,
        cohortMedian: Math.round(median(integrationValues)),
        cohortP75: Math.round(p75(integrationValues)),
        cohortP90: Math.round(p90(integrationValues)),
        percentile: percentile(integrationValues, tenantMetrics.usage.integrationsActive),
      },
    ],
  };
}

// =============================================================================
// Growth Indicators
// =============================================================================

export function calculateGrowthIndicators(
  currentMetrics: { users: number; features: number; totalFeatures: number; apiCalls: number; mrr: number },
  previousMetrics: { users: number; features: number; totalFeatures: number; apiCalls: number; mrr: number }
): GrowthIndicators {
  const userGrowth = previousMetrics.users > 0
    ? ((currentMetrics.users - previousMetrics.users) / previousMetrics.users) * 100
    : 0;
  const featureAdoption = currentMetrics.totalFeatures > 0
    ? (currentMetrics.features / currentMetrics.totalFeatures) * 100
    : 0;
  const usageGrowth = previousMetrics.apiCalls > 0
    ? ((currentMetrics.apiCalls - previousMetrics.apiCalls) / previousMetrics.apiCalls) * 100
    : 0;
  const revenueGrowth = previousMetrics.mrr > 0
    ? ((currentMetrics.mrr - previousMetrics.mrr) / previousMetrics.mrr) * 100
    : 0;

  const expansionPotential =
    featureAdoption < 50 && userGrowth > 10 ? 'high' :
    featureAdoption < 70 ? 'medium' : 'low';

  let upsellRecommendation: string | null = null;
  if (featureAdoption > 80) {
    upsellRecommendation = 'High feature adoption suggests readiness for plan upgrade';
  } else if (userGrowth > 20) {
    upsellRecommendation = 'Rapid user growth may require higher tier capacity';
  }

  return {
    userGrowthRate: Math.round(userGrowth * 10) / 10,
    featureAdoptionRate: Math.round(featureAdoption),
    usageGrowthRate: Math.round(usageGrowth * 10) / 10,
    revenueGrowthRate: Math.round(revenueGrowth * 10) / 10,
    expansionPotential,
    upsellRecommendation,
  };
}

// =============================================================================
// Risk Flags
// =============================================================================

export function detectRiskFlags(
  revenue: RevenueMetrics,
  engagement: EngagementMetrics,
  usage: UsageMetrics,
  supportTickets: number
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const now = new Date().toISOString();

  // Payment risk
  if (revenue.invoicesPastDue > 0) {
    flags.push({
      type: 'payment',
      severity: revenue.invoicesPastDue >= 2 ? 'critical' : 'high',
      message: `${revenue.invoicesPastDue} invoice(s) past due`,
      detail: 'Failed payments are the #1 indicator of involuntary churn',
      detectedAt: now,
      suggestedAction: 'Send payment update reminder and offer alternative payment method',
    });
  }

  // Engagement decline
  if (engagement.daysSinceLastLogin >= 14) {
    flags.push({
      type: 'engagement',
      severity: engagement.daysSinceLastLogin >= 30 ? 'critical' : 'high',
      message: `No login in ${engagement.daysSinceLastLogin} days`,
      detail: 'Extended absence strongly correlates with cancellation within 30 days',
      detectedAt: now,
      suggestedAction: 'Trigger re-engagement email sequence and schedule check-in call',
    });
  } else if (engagement.daysSinceLastLogin >= 7) {
    flags.push({
      type: 'engagement',
      severity: 'medium',
      message: `No login in ${engagement.daysSinceLastLogin} days`,
      detail: 'Usage drop may indicate frustration or loss of perceived value',
      detectedAt: now,
      suggestedAction: 'Send feature highlight email and product tips',
    });
  }

  // Low feature adoption
  const adoptedCount = engagement.featureAdoption.filter((f) => f.adopted).length;
  const adoptionRate = engagement.featureAdoption.length > 0
    ? adoptedCount / engagement.featureAdoption.length
    : 0;
  if (adoptionRate < 0.2) {
    flags.push({
      type: 'engagement',
      severity: 'high',
      message: `Only ${adoptedCount} of ${engagement.featureAdoption.length} features adopted`,
      detail: 'Low feature adoption indicates the tenant may not see enough value',
      detectedAt: now,
      suggestedAction: 'Schedule onboarding refresher session to demo unused features',
    });
  }

  // Usage approaching limits
  const usageAlerts = getUsageAlerts(usage);
  for (const alert of usageAlerts) {
    flags.push({
      type: 'usage',
      severity: alert.severity === 'critical' ? 'critical' : 'medium',
      message: `${alert.resource}: ${alert.percent}% of limit used`,
      detail: `Approaching plan limits can cause service disruptions and frustration`,
      detectedAt: now,
      suggestedAction: alert.severity === 'critical'
        ? 'Proactively reach out about plan upgrade before limits are hit'
        : 'Monitor and prepare upgrade recommendation',
    });
  }

  // Support ticket volume
  if (supportTickets >= 5) {
    flags.push({
      type: 'support',
      severity: supportTickets >= 10 ? 'critical' : 'high',
      message: `${supportTickets} support tickets this month`,
      detail: 'High ticket volume indicates product friction or unmet needs',
      detectedAt: now,
      suggestedAction: 'Review ticket themes and schedule customer success check-in',
    });
  }

  // Revenue contraction
  if (revenue.contractionRevenue > 0) {
    flags.push({
      type: 'churn',
      severity: 'high',
      message: `$${revenue.contractionRevenue} revenue contraction detected`,
      detail: 'Downgrade signals dissatisfaction with current plan value',
      detectedAt: now,
      suggestedAction: 'Investigate downgrade reason and offer targeted value demonstration',
    });
  }

  return flags.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// =============================================================================
// Dashboard Data Generator
// =============================================================================

export function generateTenantDashboardData(metrics: TenantMetrics): {
  kpiCards: Array<{ label: string; value: string; change: string; positive: boolean }>;
  usageBars: Array<{ resource: string; used: number; limit: number; percent: number }>;
  topRisks: RiskFlag[];
  healthGrade: string;
  healthTrend: string;
} {
  const kpiCards = [
    {
      label: 'Monthly Revenue',
      value: `$${metrics.revenue.mrr.toLocaleString()}`,
      change: `${metrics.growth.revenueGrowthRate > 0 ? '+' : ''}${metrics.growth.revenueGrowthRate}%`,
      positive: metrics.growth.revenueGrowthRate >= 0,
    },
    {
      label: 'Active Users',
      value: `${metrics.usage.activeUsers}/${metrics.usage.totalUsers}`,
      change: `${metrics.growth.userGrowthRate > 0 ? '+' : ''}${metrics.growth.userGrowthRate}%`,
      positive: metrics.growth.userGrowthRate >= 0,
    },
    {
      label: 'Engagement (DAU/MAU)',
      value: `${Math.round(metrics.engagement.dauMauRatio * 100)}%`,
      change: metrics.healthScore.trend,
      positive: metrics.healthScore.trend !== 'declining',
    },
    {
      label: 'Health Score',
      value: `${metrics.healthScore.overall}/100`,
      change: metrics.healthScore.grade,
      positive: metrics.healthScore.overall >= 70,
    },
  ];

  const usageBars = [
    { resource: 'API Calls', used: metrics.usage.apiCallsThisMonth, limit: metrics.usage.apiCallsLimit, percent: Math.round((metrics.usage.apiCallsThisMonth / metrics.usage.apiCallsLimit) * 100) },
    { resource: 'AI Calls', used: metrics.usage.aiCallsThisMonth, limit: metrics.usage.aiCallsLimit, percent: Math.round((metrics.usage.aiCallsThisMonth / metrics.usage.aiCallsLimit) * 100) },
    { resource: 'Storage', used: metrics.usage.storageUsedMb, limit: metrics.usage.storageLimitMb, percent: Math.round((metrics.usage.storageUsedMb / metrics.usage.storageLimitMb) * 100) },
    { resource: 'Emails', used: metrics.usage.emailsSentThisMonth, limit: metrics.usage.emailsLimit, percent: Math.round((metrics.usage.emailsSentThisMonth / metrics.usage.emailsLimit) * 100) },
  ];

  return {
    kpiCards,
    usageBars,
    topRisks: metrics.riskFlags.slice(0, 3),
    healthGrade: metrics.healthScore.grade,
    healthTrend: metrics.healthScore.trend,
  };
}
