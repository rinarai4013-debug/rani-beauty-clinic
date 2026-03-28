// =============================================================================
// RaniOS Platform-Wide Analytics (Super Admin)
// MRR/ARR, conversion funnel, churn analysis, cohorts, unit economics
// =============================================================================

// =============================================================================
// Types
// =============================================================================

export interface PlatformMetrics {
  period: string;
  revenue: PlatformRevenue;
  tenants: TenantOverview;
  funnel: ConversionFunnel;
  churn: ChurnAnalysis;
  cohorts: RevenueCohort[];
  featureUsage: FeatureHeatmapItem[];
  support: SupportMetrics;
  nps: NpsMetrics;
  infrastructure: InfrastructureCosts;
  unitEconomics: UnitEconomics;
}

export interface PlatformRevenue {
  totalMrr: number;
  totalArr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  netNewMrr: number;
  mrrGrowthRate: number;
  revenueByTier: Array<{ tier: string; mrr: number; count: number; avgMrr: number }>;
  mrrTrend: Array<{ month: string; mrr: number; newMrr: number; churnedMrr: number; expansionMrr: number }>;
}

export interface TenantOverview {
  total: number;
  active: number;
  trial: number;
  churned: number;
  suspended: number;
  byTier: Array<{ tier: string; count: number; percent: number }>;
  newThisMonth: number;
  churnedThisMonth: number;
  netGrowth: number;
}

export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversionRate: number;
  avgTimeToConvert: number;
  bottleneck: string;
  topDropoffStage: string;
}

export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeInStage: number;
}

export interface ChurnAnalysis {
  overallChurnRate: number;
  voluntaryChurn: number;
  involuntaryChurn: number;
  churnByTier: Array<{ tier: string; rate: number; count: number }>;
  churnReasons: Array<{ reason: string; count: number; percent: number }>;
  monthlyChurnTrend: Array<{ month: string; rate: number; count: number }>;
  revenueChurnRate: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
  avgLifetimeMonths: number;
}

export interface RevenueCohort {
  cohortMonth: string;
  initialTenants: number;
  initialMrr: number;
  retentionByMonth: Array<{
    monthsAfter: number;
    tenantsRetained: number;
    mrrRetained: number;
    tenantRetentionRate: number;
    revenueRetentionRate: number;
  }>;
}

export interface FeatureHeatmapItem {
  feature: string;
  category: string;
  totalUsage: number;
  uniqueTenants: number;
  adoptionRate: number;
  avgUsagePerTenant: number;
  trend: 'growing' | 'stable' | 'declining';
  tier: string;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  avgResolutionTimeHours: number;
  firstResponseTimeHours: number;
  satisfactionScore: number;
  ticketsByCategory: Array<{ category: string; count: number; avgResolution: number }>;
  ticketVolumeTrend: Array<{ week: string; count: number }>;
  escalationRate: number;
}

export interface NpsMetrics {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  responseRate: number;
  trend: Array<{ month: string; score: number; responses: number }>;
  topFeedback: Array<{ category: string; sentiment: 'positive' | 'negative'; count: number; sample: string }>;
}

export interface InfrastructureCosts {
  totalMonthlyCost: number;
  costPerTenant: number;
  costBreakdown: Array<{ service: string; monthlyCost: number; percent: number }>;
  grossMargin: number;
  costTrend: Array<{ month: string; total: number; perTenant: number }>;
}

export interface UnitEconomics {
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  arpu: number;
  grossMarginPercent: number;
  revenuePerEmployee: number;
  magicNumber: number;
}

// =============================================================================
// Revenue Calculations
// =============================================================================

export function calculatePlatformRevenue(
  tenants: Array<{
    id: string;
    tier: string;
    mrr: number;
    previousMrr: number;
    isNew: boolean;
    isChurned: boolean;
  }>,
  mrrHistory: Array<{ month: string; mrr: number; newMrr: number; churnedMrr: number; expansionMrr: number }>
): PlatformRevenue {
  const activeTenants = tenants.filter((t) => !t.isChurned);

  const totalMrr = activeTenants.reduce((sum, t) => sum + t.mrr, 0);
  const newMrr = tenants.filter((t) => t.isNew).reduce((sum, t) => sum + t.mrr, 0);

  const expansionMrr = activeTenants
    .filter((t) => !t.isNew && t.mrr > t.previousMrr)
    .reduce((sum, t) => sum + (t.mrr - t.previousMrr), 0);

  const contractionMrr = activeTenants
    .filter((t) => t.mrr < t.previousMrr && !t.isChurned)
    .reduce((sum, t) => sum + (t.previousMrr - t.mrr), 0);

  const churnedMrr = tenants
    .filter((t) => t.isChurned)
    .reduce((sum, t) => sum + t.previousMrr, 0);

  const netNewMrr = newMrr + expansionMrr - contractionMrr - churnedMrr;

  const previousTotalMrr = tenants.reduce((sum, t) => sum + t.previousMrr, 0);
  const mrrGrowthRate = previousTotalMrr > 0
    ? ((totalMrr - previousTotalMrr) / previousTotalMrr) * 100
    : 0;

  // Revenue by tier
  const tierMap = new Map<string, { mrr: number; count: number }>();
  for (const t of activeTenants) {
    const current = tierMap.get(t.tier) || { mrr: 0, count: 0 };
    current.mrr += t.mrr;
    current.count++;
    tierMap.set(t.tier, current);
  }

  const revenueByTier = Array.from(tierMap.entries()).map(([tier, data]) => ({
    tier,
    mrr: data.mrr,
    count: data.count,
    avgMrr: data.count > 0 ? Math.round(data.mrr / data.count) : 0,
  }));

  return {
    totalMrr: Math.round(totalMrr),
    totalArr: Math.round(totalMrr * 12),
    newMrr: Math.round(newMrr),
    expansionMrr: Math.round(expansionMrr),
    contractionMrr: Math.round(contractionMrr),
    churnedMrr: Math.round(churnedMrr),
    netNewMrr: Math.round(netNewMrr),
    mrrGrowthRate: Math.round(mrrGrowthRate * 10) / 10,
    revenueByTier,
    mrrTrend: mrrHistory,
  };
}

// =============================================================================
// Tenant Overview
// =============================================================================

export function calculateTenantOverview(
  tenants: Array<{
    id: string;
    tier: string;
    status: 'active' | 'trial' | 'churned' | 'suspended';
    createdAt: string;
    churnedAt: string | null;
  }>
): TenantOverview {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = tenants.filter((t) => t.status === 'active').length;
  const trial = tenants.filter((t) => t.status === 'trial').length;
  const churned = tenants.filter((t) => t.status === 'churned').length;
  const suspended = tenants.filter((t) => t.status === 'suspended').length;

  const newThisMonth = tenants.filter(
    (t) => new Date(t.createdAt) >= monthStart
  ).length;

  const churnedThisMonth = tenants.filter(
    (t) => t.churnedAt && new Date(t.churnedAt) >= monthStart
  ).length;

  const tierCounts = new Map<string, number>();
  for (const t of tenants.filter((t) => t.status === 'active' || t.status === 'trial')) {
    tierCounts.set(t.tier, (tierCounts.get(t.tier) || 0) + 1);
  }

  const totalActive = active + trial;
  const byTier = Array.from(tierCounts.entries()).map(([tier, count]) => ({
    tier,
    count,
    percent: totalActive > 0 ? Math.round((count / totalActive) * 100) : 0,
  }));

  return {
    total: tenants.length,
    active,
    trial,
    churned,
    suspended,
    byTier,
    newThisMonth,
    churnedThisMonth,
    netGrowth: newThisMonth - churnedThisMonth,
  };
}

// =============================================================================
// Conversion Funnel
// =============================================================================

export function calculateConversionFunnel(
  visitors: number,
  signups: number,
  trials: number,
  paidConversions: number,
  avgDaysToConvert: number
): ConversionFunnel {
  const stages: FunnelStage[] = [
    {
      name: 'Website Visitors',
      count: visitors,
      conversionRate: 100,
      dropoffRate: 0,
      avgTimeInStage: 0,
    },
    {
      name: 'Signups',
      count: signups,
      conversionRate: visitors > 0 ? Math.round((signups / visitors) * 10000) / 100 : 0,
      dropoffRate: visitors > 0 ? Math.round(((visitors - signups) / visitors) * 10000) / 100 : 0,
      avgTimeInStage: 0,
    },
    {
      name: 'Trial Started',
      count: trials,
      conversionRate: signups > 0 ? Math.round((trials / signups) * 10000) / 100 : 0,
      dropoffRate: signups > 0 ? Math.round(((signups - trials) / signups) * 10000) / 100 : 0,
      avgTimeInStage: 1,
    },
    {
      name: 'Paid Conversion',
      count: paidConversions,
      conversionRate: trials > 0 ? Math.round((paidConversions / trials) * 10000) / 100 : 0,
      dropoffRate: trials > 0 ? Math.round(((trials - paidConversions) / trials) * 10000) / 100 : 0,
      avgTimeInStage: avgDaysToConvert,
    },
  ];

  // Find bottleneck (stage with highest drop-off)
  const maxDropoff = stages.reduce((max, s) =>
    s.dropoffRate > max.dropoffRate ? s : max, stages[0]
  );

  return {
    stages,
    overallConversionRate: visitors > 0
      ? Math.round((paidConversions / visitors) * 10000) / 100
      : 0,
    avgTimeToConvert: avgDaysToConvert,
    bottleneck: maxDropoff.name,
    topDropoffStage: maxDropoff.name,
  };
}

// =============================================================================
// Churn Analysis
// =============================================================================

export function calculateChurnAnalysis(
  tenants: Array<{
    id: string;
    tier: string;
    mrr: number;
    status: 'active' | 'churned';
    churnedAt: string | null;
    churnReason: string | null;
    churnType: 'voluntary' | 'involuntary' | null;
    lifetimeMonths: number;
  }>,
  monthlyData: Array<{ month: string; totalTenants: number; churnedCount: number }>
): ChurnAnalysis {
  const allActive = tenants.filter((t) => t.status === 'active');
  const allChurned = tenants.filter((t) => t.status === 'churned');

  const overallChurnRate = tenants.length > 0
    ? (allChurned.length / tenants.length) * 100
    : 0;

  const voluntaryChurn = allChurned.filter((t) => t.churnType === 'voluntary').length;
  const involuntaryChurn = allChurned.filter((t) => t.churnType === 'involuntary').length;

  // Churn by tier
  const tierMap = new Map<string, { total: number; churned: number }>();
  for (const t of tenants) {
    const current = tierMap.get(t.tier) || { total: 0, churned: 0 };
    current.total++;
    if (t.status === 'churned') current.churned++;
    tierMap.set(t.tier, current);
  }

  const churnByTier = Array.from(tierMap.entries()).map(([tier, data]) => ({
    tier,
    rate: data.total > 0 ? Math.round((data.churned / data.total) * 10000) / 100 : 0,
    count: data.churned,
  }));

  // Churn reasons
  const reasonMap = new Map<string, number>();
  for (const t of allChurned) {
    const reason = t.churnReason || 'Unknown';
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
  }

  const churnReasons = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percent: allChurned.length > 0 ? Math.round((count / allChurned.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Monthly churn trend
  const monthlyChurnTrend = monthlyData.map((m) => ({
    month: m.month,
    rate: m.totalTenants > 0 ? Math.round((m.churnedCount / m.totalTenants) * 10000) / 100 : 0,
    count: m.churnedCount,
  }));

  // Revenue churn
  const churnedMrr = allChurned.reduce((sum, t) => sum + t.mrr, 0);
  const totalMrr = tenants.reduce((sum, t) => sum + t.mrr, 0);
  const revenueChurnRate = totalMrr > 0 ? (churnedMrr / totalMrr) * 100 : 0;

  const activeMrr = allActive.reduce((sum, t) => sum + t.mrr, 0);
  const grossRevRetention = totalMrr > 0 ? (activeMrr / totalMrr) * 100 : 100;

  const avgLifetime = tenants.length > 0
    ? tenants.reduce((sum, t) => sum + t.lifetimeMonths, 0) / tenants.length
    : 0;

  return {
    overallChurnRate: Math.round(overallChurnRate * 10) / 10,
    voluntaryChurn,
    involuntaryChurn,
    churnByTier,
    churnReasons,
    monthlyChurnTrend,
    revenueChurnRate: Math.round(revenueChurnRate * 10) / 10,
    netRevenueRetention: Math.round((100 - revenueChurnRate) * 10) / 10,
    grossRevenueRetention: Math.round(grossRevRetention * 10) / 10,
    avgLifetimeMonths: Math.round(avgLifetime * 10) / 10,
  };
}

// =============================================================================
// Revenue Cohort Analysis
// =============================================================================

export function generateRevenueCohorts(
  tenants: Array<{
    id: string;
    cohortMonth: string;
    monthlyRevenue: Array<{ month: string; mrr: number }>;
    isActive: boolean;
  }>
): RevenueCohort[] {
  const cohortMap = new Map<string, typeof tenants>();

  for (const t of tenants) {
    const existing = cohortMap.get(t.cohortMonth) || [];
    existing.push(t);
    cohortMap.set(t.cohortMonth, existing);
  }

  return Array.from(cohortMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // Last 12 cohorts
    .map(([cohortMonth, cohortTenants]) => {
      const initialMrr = cohortTenants.reduce((sum, t) => {
        const first = t.monthlyRevenue[0];
        return sum + (first?.mrr || 0);
      }, 0);

      // Calculate retention for each month after cohort start
      const maxMonths = 12;
      const retentionByMonth = [];

      for (let m = 0; m < maxMonths; m++) {
        const tenantsWithData = cohortTenants.filter(
          (t) => t.monthlyRevenue.length > m
        );
        const retained = tenantsWithData.filter(
          (t) => t.monthlyRevenue[m]?.mrr > 0
        );
        const retainedMrr = retained.reduce(
          (sum, t) => sum + (t.monthlyRevenue[m]?.mrr || 0), 0
        );

        retentionByMonth.push({
          monthsAfter: m,
          tenantsRetained: retained.length,
          mrrRetained: Math.round(retainedMrr),
          tenantRetentionRate: cohortTenants.length > 0
            ? Math.round((retained.length / cohortTenants.length) * 100)
            : 0,
          revenueRetentionRate: initialMrr > 0
            ? Math.round((retainedMrr / initialMrr) * 100)
            : 0,
        });
      }

      return {
        cohortMonth,
        initialTenants: cohortTenants.length,
        initialMrr: Math.round(initialMrr),
        retentionByMonth,
      };
    });
}

// =============================================================================
// Feature Usage Heatmap
// =============================================================================

export function calculateFeatureHeatmap(
  featureData: Array<{
    feature: string;
    category: string;
    tenantId: string;
    usageCount: number;
    tier: string;
  }>,
  totalTenants: number
): FeatureHeatmapItem[] {
  const featureMap = new Map<string, {
    category: string;
    totalUsage: number;
    tenants: Set<string>;
    tier: string;
  }>();

  for (const item of featureData) {
    const existing = featureMap.get(item.feature) || {
      category: item.category,
      totalUsage: 0,
      tenants: new Set<string>(),
      tier: item.tier,
    };
    existing.totalUsage += item.usageCount;
    existing.tenants.add(item.tenantId);
    featureMap.set(item.feature, existing);
  }

  return Array.from(featureMap.entries())
    .map(([feature, data]) => ({
      feature,
      category: data.category,
      totalUsage: data.totalUsage,
      uniqueTenants: data.tenants.size,
      adoptionRate: totalTenants > 0 ? Math.round((data.tenants.size / totalTenants) * 100) : 0,
      avgUsagePerTenant: data.tenants.size > 0 ? Math.round(data.totalUsage / data.tenants.size) : 0,
      trend: 'stable' as const, // Would need historical data for actual trend
      tier: data.tier,
    }))
    .sort((a, b) => b.adoptionRate - a.adoptionRate);
}

// =============================================================================
// Support Metrics
// =============================================================================

export function calculateSupportMetrics(
  tickets: Array<{
    id: string;
    category: string;
    status: 'open' | 'pending' | 'resolved' | 'closed';
    createdAt: string;
    firstResponseAt: string | null;
    resolvedAt: string | null;
    satisfaction: number | null;
    escalated: boolean;
  }>
): SupportMetrics {
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'pending').length;

  const resolved = tickets.filter((t) => t.resolvedAt);
  const resolutionTimes = resolved.map((t) =>
    (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60)
  );
  const avgResolution = resolutionTimes.length > 0
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : 0;

  const withFirstResponse = tickets.filter((t) => t.firstResponseAt);
  const firstResponseTimes = withFirstResponse.map((t) =>
    (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60)
  );
  const avgFirstResponse = firstResponseTimes.length > 0
    ? firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length
    : 0;

  const withSatisfaction = tickets.filter((t) => t.satisfaction !== null);
  const avgSatisfaction = withSatisfaction.length > 0
    ? withSatisfaction.reduce((sum, t) => sum + (t.satisfaction || 0), 0) / withSatisfaction.length
    : 0;

  // By category
  const catMap = new Map<string, { count: number; totalResolution: number; resolvedCount: number }>();
  for (const t of tickets) {
    const cat = catMap.get(t.category) || { count: 0, totalResolution: 0, resolvedCount: 0 };
    cat.count++;
    if (t.resolvedAt) {
      cat.resolvedCount++;
      cat.totalResolution += (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
    }
    catMap.set(t.category, cat);
  }

  const ticketsByCategory = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgResolution: data.resolvedCount > 0 ? Math.round(data.totalResolution / data.resolvedCount * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Weekly volume trend (last 8 weeks)
  const ticketVolumeTrend: Array<{ week: string; count: number }> = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekStr = `Week ${8 - w}`;
    const count = tickets.filter((t) => {
      const created = new Date(t.createdAt);
      return created >= weekStart && created < weekEnd;
    }).length;
    ticketVolumeTrend.push({ week: weekStr, count });
  }

  const escalated = tickets.filter((t) => t.escalated).length;

  return {
    totalTickets: tickets.length,
    openTickets,
    avgResolutionTimeHours: Math.round(avgResolution * 10) / 10,
    firstResponseTimeHours: Math.round(avgFirstResponse * 10) / 10,
    satisfactionScore: Math.round(avgSatisfaction * 10) / 10,
    ticketsByCategory,
    ticketVolumeTrend,
    escalationRate: tickets.length > 0 ? Math.round((escalated / tickets.length) * 10000) / 100 : 0,
  };
}

// =============================================================================
// NPS Tracking
// =============================================================================

export function calculateNps(
  responses: Array<{ score: number; feedback: string | null; category: string | null; date: string }>,
  totalSurveyed: number
): NpsMetrics {
  const promoters = responses.filter((r) => r.score >= 9).length;
  const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter((r) => r.score <= 6).length;

  const total = responses.length;
  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0;

  // Monthly trend
  const monthMap = new Map<string, { scores: number[]; count: number }>();
  for (const r of responses) {
    const month = r.date.substring(0, 7);
    const existing = monthMap.get(month) || { scores: [], count: 0 };
    existing.scores.push(r.score);
    existing.count++;
    monthMap.set(month, existing);
  }

  const trend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => {
      const p = data.scores.filter((s) => s >= 9).length;
      const d = data.scores.filter((s) => s <= 6).length;
      return {
        month,
        score: Math.round(((p - d) / data.count) * 100),
        responses: data.count,
      };
    });

  // Top feedback themes
  const feedbackMap = new Map<string, { positive: number; negative: number; sample: string }>();
  for (const r of responses) {
    if (!r.category || !r.feedback) continue;
    const existing = feedbackMap.get(r.category) || { positive: 0, negative: 0, sample: r.feedback };
    if (r.score >= 9) existing.positive++;
    else if (r.score <= 6) existing.negative++;
    feedbackMap.set(r.category, existing);
  }

  const topFeedback = Array.from(feedbackMap.entries())
    .flatMap(([category, data]) => {
      const items = [];
      if (data.positive > 0) {
        items.push({ category, sentiment: 'positive' as const, count: data.positive, sample: data.sample });
      }
      if (data.negative > 0) {
        items.push({ category, sentiment: 'negative' as const, count: data.negative, sample: data.sample });
      }
      return items;
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    score: npsScore,
    promoters,
    passives,
    detractors,
    totalResponses: total,
    responseRate: totalSurveyed > 0 ? Math.round((total / totalSurveyed) * 100) : 0,
    trend,
    topFeedback,
  };
}

// =============================================================================
// Infrastructure Cost Tracking
// =============================================================================

export function calculateInfrastructureCosts(
  costs: Array<{ service: string; monthlyCost: number }>,
  totalMrr: number,
  activeTenants: number
): InfrastructureCosts {
  const totalMonthlyCost = costs.reduce((sum, c) => sum + c.monthlyCost, 0);
  const costPerTenant = activeTenants > 0 ? totalMonthlyCost / activeTenants : 0;
  const grossMargin = totalMrr > 0 ? ((totalMrr - totalMonthlyCost) / totalMrr) * 100 : 0;

  const costBreakdown = costs.map((c) => ({
    ...c,
    percent: totalMonthlyCost > 0 ? Math.round((c.monthlyCost / totalMonthlyCost) * 100) : 0,
  })).sort((a, b) => b.monthlyCost - a.monthlyCost);

  return {
    totalMonthlyCost: Math.round(totalMonthlyCost),
    costPerTenant: Math.round(costPerTenant * 100) / 100,
    costBreakdown,
    grossMargin: Math.round(grossMargin * 10) / 10,
    costTrend: [], // Would need historical data
  };
}

// =============================================================================
// Unit Economics
// =============================================================================

export function calculateUnitEconomics(
  totalMrr: number,
  activeTenants: number,
  totalMarketingSpend: number,
  newCustomers: number,
  avgLifetimeMonths: number,
  monthlyChurnRate: number,
  totalCosts: number,
  employeeCount: number,
  previousQuarterNewRevenue: number,
  previousQuarterSalesSpend: number
): UnitEconomics {
  const arpu = activeTenants > 0 ? totalMrr / activeTenants : 0;
  const cac = newCustomers > 0 ? totalMarketingSpend / newCustomers : 0;
  const ltv = monthlyChurnRate > 0
    ? arpu / monthlyChurnRate
    : arpu * avgLifetimeMonths;
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const paybackPeriodMonths = arpu > 0 ? cac / arpu : 0;
  const grossMarginPercent = totalMrr > 0
    ? ((totalMrr - totalCosts) / totalMrr) * 100
    : 0;
  const revenuePerEmployee = employeeCount > 0
    ? (totalMrr * 12) / employeeCount
    : 0;

  // Magic Number = net new ARR / previous quarter's sales & marketing spend
  const magicNumber = previousQuarterSalesSpend > 0
    ? (previousQuarterNewRevenue * 12) / previousQuarterSalesSpend
    : 0;

  return {
    cac: Math.round(cac),
    ltv: Math.round(ltv),
    ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
    paybackPeriodMonths: Math.round(paybackPeriodMonths * 10) / 10,
    arpu: Math.round(arpu),
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    revenuePerEmployee: Math.round(revenuePerEmployee),
    magicNumber: Math.round(magicNumber * 100) / 100,
  };
}

// =============================================================================
// Platform Health Summary
// =============================================================================

export function getPlatformHealthSummary(metrics: PlatformMetrics): {
  status: 'healthy' | 'warning' | 'critical';
  highlights: string[];
  concerns: string[];
  actions: string[];
} {
  const highlights: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];

  // Revenue health
  if (metrics.revenue.mrrGrowthRate > 10) {
    highlights.push(`Strong MRR growth: +${metrics.revenue.mrrGrowthRate}% month-over-month`);
  }
  if (metrics.revenue.netNewMrr > 0) {
    highlights.push(`Positive net new MRR: $${metrics.revenue.netNewMrr.toLocaleString()}`);
  }

  // Churn concerns
  if (metrics.churn.overallChurnRate > 5) {
    concerns.push(`Churn rate at ${metrics.churn.overallChurnRate}% (target: <5%)`);
    actions.push('Review top churn reasons and implement targeted retention campaigns');
  }

  // Unit economics
  if (metrics.unitEconomics.ltvCacRatio < 3) {
    concerns.push(`LTV:CAC ratio at ${metrics.unitEconomics.ltvCacRatio}x (target: >3x)`);
    actions.push('Reduce CAC through organic channels or improve retention to increase LTV');
  } else {
    highlights.push(`Healthy LTV:CAC ratio: ${metrics.unitEconomics.ltvCacRatio}x`);
  }

  // NPS
  if (metrics.nps.score >= 50) {
    highlights.push(`Strong NPS: ${metrics.nps.score}`);
  } else if (metrics.nps.score < 20) {
    concerns.push(`Low NPS: ${metrics.nps.score}`);
    actions.push('Survey detractors for specific feedback and create improvement plan');
  }

  // Funnel
  if (metrics.funnel.overallConversionRate < 2) {
    concerns.push(`Low funnel conversion: ${metrics.funnel.overallConversionRate}%`);
    actions.push(`Optimize ${metrics.funnel.bottleneck} stage to reduce drop-off`);
  }

  const status = concerns.length >= 3 ? 'critical' :
    concerns.length >= 1 ? 'warning' : 'healthy';

  return { status, highlights, concerns, actions };
}
