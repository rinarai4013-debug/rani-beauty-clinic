/**
 * Dynamic Pricing Optimizer
 *
 * Analyzes demand patterns, margin data, competitive positioning, and
 * client segments to generate time-of-day pricing tiers, last-minute
 * discounting, bundle optimization, and profit-maximizing strategies.
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── TYPES ──

export interface PricingOptimizerInput {
  services: ServicePricingData[];
  demandPatterns: DemandPattern[];
  transactions: PricingTransaction[];
  competitorData: CompetitorPricePoint[];
  membershipStats: MembershipPricingStats;
  costStructure: CostStructure;
  currentDate: string;
}

export interface ServicePricingData {
  name: string;
  category: string;
  currentPrice: number;
  costPerSession: number; // supplies + provider time
  duration: number; // minutes
  bookingsLast30: number;
  bookingsLast60: number;
  avgDiscount: number; // average discount given
  cancelRate: number; // 0-1
}

export interface DemandPattern {
  dayOfWeek: number;
  hour: number;
  avgBookings: number;
  maxCapacity: number;
  avgRevenue: number;
}

export interface PricingTransaction {
  date: string;
  dayOfWeek: number;
  hour: number;
  service: string;
  amount: number;
  listPrice: number;
  discountPercent: number;
  clientType: 'new' | 'returning' | 'member';
  booked: boolean;
  cancelled: boolean;
}

export interface CompetitorPricePoint {
  competitor: string;
  service: string;
  price: number;
  lastUpdated: string;
}

export interface MembershipPricingStats {
  totalMembers: number;
  avgMemberSpend: number;
  avgNonMemberSpend: number;
  memberRetention12Mo: number; // 0-1
}

export interface CostStructure {
  avgOverheadPerHour: number; // rent, utilities, admin per treatment hour
  targetMargin: number; // 0-1 (e.g., 0.65 for 65%)
  avgProviderCostPerHour: number;
}

// ── OUTPUT TYPES ──

export interface PricingOptimizerResult {
  timePricing: TimePricingTier[];
  dayPricing: DayPricingAnalysis[];
  lastMinuteStrategy: LastMinuteStrategy;
  introductoryPricing: IntroductoryPriceSet[];
  memberPricing: MemberPricingTier[];
  seasonalAdjustments: SeasonalAdjustment[];
  competitivePosition: CompetitivePosition[];
  priceSensitivity: PriceSensitivityResult[];
  bundleOptimization: BundleOptimization[];
  marginAnalysis: MarginAnalysis[];
  summary: PricingSummary;
}

export interface TimePricingTier {
  tier: 'premium' | 'standard' | 'off-peak';
  hours: string; // e.g., "10:00 AM - 2:00 PM"
  multiplier: number; // 1.0 = standard, 1.15 = +15%
  demandLevel: number; // 0-100
  estimatedRevenueImpact: number;
  description: string;
}

export interface DayPricingAnalysis {
  dayOfWeek: string;
  dayIndex: number;
  demandScore: number; // 0-100
  currentAvgRevenue: number;
  suggestedMultiplier: number;
  estimatedRevenueChange: number;
  strategy: string;
}

export interface LastMinuteStrategy {
  enabled: boolean;
  discountTiers: Array<{
    hoursBeforeSlot: number;
    maxDiscount: number; // 0-1
    applicableServices: string[];
    conditions: string[];
  }>;
  estimatedSlotsFilled: number;
  estimatedRevenueRecovered: number;
  rules: string[];
}

export interface IntroductoryPriceSet {
  service: string;
  regularPrice: number;
  introPrice: number;
  discountPercent: number;
  conversionTarget: number; // % who should rebook at full price
  maxRedemptions: number;
  conditions: string[];
}

export interface MemberPricingTier {
  tier: string;
  discountPercent: number;
  servicesIncluded: string[];
  estimatedLTV: number;
  retentionImpact: string;
}

export interface SeasonalAdjustment {
  season: string;
  months: number[];
  services: string[];
  adjustment: number; // multiplier
  reason: string;
}

export interface CompetitivePosition {
  service: string;
  ourPrice: number;
  marketAvg: number;
  marketLow: number;
  marketHigh: number;
  position: 'below-market' | 'at-market' | 'premium' | 'luxury';
  recommendation: string;
}

export interface PriceSensitivityResult {
  service: string;
  currentPrice: number;
  elasticity: number; // -1 to 0 typically; more negative = more sensitive
  optimalPrice: number;
  revenueAtOptimal: number;
  revenueAtCurrent: number;
  sensitivity: 'low' | 'moderate' | 'high';
}

export interface BundleOptimization {
  bundleName: string;
  services: string[];
  individualTotal: number;
  bundlePrice: number;
  savingsPercent: number;
  margin: number;
  demandScore: number; // 0-100 likelihood of purchase
  strategy: string;
}

export interface MarginAnalysis {
  service: string;
  revenue: number;
  directCost: number;
  overheadAllocation: number;
  grossMargin: number;
  grossMarginPercent: number;
  netMargin: number;
  netMarginPercent: number;
  revenuePerMinute: number;
  status: 'excellent' | 'healthy' | 'thin' | 'loss-leader';
  recommendation: string;
}

export interface PricingSummary {
  totalRevenueOpportunity: number;
  avgMargin: number;
  competitiveScore: number; // 0-100
  pricingHealthScore: number; // 0-100
  topActions: string[];
}

// ── CORE ENGINE ──

export function optimizePricing(input: PricingOptimizerInput): PricingOptimizerResult {
  const timePricing = analyzeTimePricing(input.demandPatterns, input.transactions);
  const dayPricing = analyzeDayPricing(input.demandPatterns, input.transactions);
  const lastMinuteStrategy = buildLastMinuteStrategy(input);
  const introductoryPricing = buildIntroductoryPricing(input.services);
  const memberPricing = buildMemberPricing(input.membershipStats);
  const seasonalAdjustments = analyzeSeasonality(input);
  const competitivePosition = analyzeCompetitivePosition(input.services, input.competitorData);
  const priceSensitivity = analyzePriceSensitivity(input.services, input.transactions);
  const bundleOptimization = optimizeBundles(input.services, input.costStructure);
  const marginAnalysis = analyzeMargins(input.services, input.costStructure);

  const totalRevOpp = timePricing.reduce((s, t) => s + t.estimatedRevenueImpact, 0)
    + lastMinuteStrategy.estimatedRevenueRecovered
    + bundleOptimization.reduce((s, b) => s + b.bundlePrice * b.demandScore / 100, 0);

  const avgMargin = marginAnalysis.length > 0
    ? marginAnalysis.reduce((s, m) => s + m.grossMarginPercent, 0) / marginAnalysis.length
    : 0;

  const competitiveScore = competitivePosition.length > 0
    ? Math.round(competitivePosition.filter(c => c.position === 'premium' || c.position === 'luxury').length / competitivePosition.length * 100)
    : 50;

  const pricingHealthScore = calculatePricingHealth(marginAnalysis, competitivePosition, priceSensitivity);

  return {
    timePricing,
    dayPricing,
    lastMinuteStrategy,
    introductoryPricing,
    memberPricing,
    seasonalAdjustments,
    competitivePosition,
    priceSensitivity,
    bundleOptimization,
    marginAnalysis,
    summary: {
      totalRevenueOpportunity: Math.round(totalRevOpp),
      avgMargin: Math.round(avgMargin),
      competitiveScore,
      pricingHealthScore,
      topActions: generateTopPricingActions(marginAnalysis, competitivePosition, timePricing),
    },
  };
}

// ── TIME-OF-DAY PRICING ──

function analyzeTimePricing(patterns: DemandPattern[], transactions: PricingTransaction[]): TimePricingTier[] {
  // Group demand by hour ranges
  const hourDemand = new Map<number, { bookings: number; capacity: number; revenue: number }>();

  for (const p of patterns) {
    const existing = hourDemand.get(p.hour) || { bookings: 0, capacity: 0, revenue: 0 };
    existing.bookings += p.avgBookings;
    existing.capacity += p.maxCapacity;
    existing.revenue += p.avgRevenue;
    hourDemand.set(p.hour, existing);
  }

  // Calculate demand scores by hour
  const hourScores: Array<{ hour: number; score: number; revenue: number }> = [];
  for (const [hour, data] of hourDemand) {
    const utilization = data.capacity > 0 ? data.bookings / data.capacity : 0;
    hourScores.push({ hour, score: utilization * 100, revenue: data.revenue });
  }

  hourScores.sort((a, b) => a.hour - b.hour);

  // Define tiers
  const tiers: TimePricingTier[] = [];
  const avgScore = hourScores.reduce((s, h) => s + h.score, 0) / Math.max(1, hourScores.length);

  const premiumHours = hourScores.filter(h => h.score > avgScore * 1.2);
  const offPeakHours = hourScores.filter(h => h.score < avgScore * 0.7);
  const standardHours = hourScores.filter(h => h.score >= avgScore * 0.7 && h.score <= avgScore * 1.2);

  if (premiumHours.length > 0) {
    const hours = premiumHours.map(h => h.hour);
    const revenueImpact = premiumHours.reduce((s, h) => s + h.revenue * 0.10, 0);
    tiers.push({
      tier: 'premium',
      hours: formatHourRange(hours),
      multiplier: 1.10,
      demandLevel: Math.round(premiumHours.reduce((s, h) => s + h.score, 0) / premiumHours.length),
      estimatedRevenueImpact: Math.round(revenueImpact),
      description: 'Peak demand hours -- highest willingness to pay. Apply 10% premium.',
    });
  }

  if (standardHours.length > 0) {
    const hours = standardHours.map(h => h.hour);
    tiers.push({
      tier: 'standard',
      hours: formatHourRange(hours),
      multiplier: 1.0,
      demandLevel: Math.round(standardHours.reduce((s, h) => s + h.score, 0) / standardHours.length),
      estimatedRevenueImpact: 0,
      description: 'Normal demand -- maintain standard pricing.',
    });
  }

  if (offPeakHours.length > 0) {
    const hours = offPeakHours.map(h => h.hour);
    const potentialFills = offPeakHours.length * 0.3;
    const avgRev = offPeakHours.reduce((s, h) => s + h.revenue, 0) / offPeakHours.length;
    tiers.push({
      tier: 'off-peak',
      hours: formatHourRange(hours),
      multiplier: 0.90,
      demandLevel: Math.round(offPeakHours.reduce((s, h) => s + h.score, 0) / offPeakHours.length),
      estimatedRevenueImpact: Math.round(potentialFills * avgRev * 0.9),
      description: 'Low demand hours -- 10% discount to drive bookings.',
    });
  }

  return tiers;
}

// ── DAY-OF-WEEK PRICING ──

function analyzeDayPricing(patterns: DemandPattern[], transactions: PricingTransaction[]): DayPricingAnalysis[] {
  const dayData = new Map<number, { bookings: number; capacity: number; revenue: number; count: number }>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const p of patterns) {
    const existing = dayData.get(p.dayOfWeek) || { bookings: 0, capacity: 0, revenue: 0, count: 0 };
    existing.bookings += p.avgBookings;
    existing.capacity += p.maxCapacity;
    existing.revenue += p.avgRevenue;
    existing.count++;
    dayData.set(p.dayOfWeek, existing);
  }

  const analyses: DayPricingAnalysis[] = [];
  const avgRevenue = [...dayData.values()].reduce((s, d) => s + d.revenue, 0) / Math.max(1, dayData.size);

  for (const [day, data] of dayData) {
    const utilization = data.capacity > 0 ? data.bookings / data.capacity : 0;
    const demandScore = Math.round(utilization * 100);
    const avgDayRevenue = data.count > 0 ? data.revenue / data.count : 0;

    let multiplier = 1.0;
    let strategy = '';

    if (demandScore > 80) {
      multiplier = 1.10;
      strategy = 'High demand day -- premium pricing justified. Prioritize high-value services.';
    } else if (demandScore > 60) {
      multiplier = 1.0;
      strategy = 'Healthy demand -- maintain standard pricing and focus on fill rate.';
    } else if (demandScore > 40) {
      multiplier = 0.95;
      strategy = 'Moderate demand -- small discount to attract bookings. Run targeted campaigns.';
    } else {
      multiplier = 0.85;
      strategy = 'Low demand day -- offer off-peak pricing and package deals to drive volume.';
    }

    analyses.push({
      dayOfWeek: dayNames[day],
      dayIndex: day,
      demandScore,
      currentAvgRevenue: Math.round(avgDayRevenue),
      suggestedMultiplier: multiplier,
      estimatedRevenueChange: Math.round(avgDayRevenue * (multiplier - 1)),
      strategy,
    });
  }

  return analyses.sort((a, b) => b.demandScore - a.demandScore);
}

// ── LAST-MINUTE STRATEGY ──

function buildLastMinuteStrategy(input: PricingOptimizerInput): LastMinuteStrategy {
  const avgCancelRate = input.services.reduce((s, svc) => s + svc.cancelRate, 0) / Math.max(1, input.services.length);
  const avgSlotValue = input.services.reduce((s, svc) => s + svc.currentPrice, 0) / Math.max(1, input.services.length);

  // Estimate how many slots go unfilled day-of
  const dailySlots = 20; // estimate
  const emptyDayOf = Math.round(dailySlots * avgCancelRate * 0.5);
  const fillableWithDiscount = Math.round(emptyDayOf * 0.4);

  return {
    enabled: true,
    discountTiers: [
      {
        hoursBeforeSlot: 24,
        maxDiscount: 0.10,
        applicableServices: ['HydraFacial', 'VI Peel', 'PRX-T33', 'B12 Injection', 'Glutathione Injection'],
        conditions: ['Slot must be unfilled', 'Cannot apply to packages or memberships'],
      },
      {
        hoursBeforeSlot: 4,
        maxDiscount: 0.20,
        applicableServices: ['HydraFacial', 'VI Peel', 'PRX-T33', 'BioRePeel'],
        conditions: ['Day-of only', 'First-come first-served', 'Non-transferable'],
      },
    ],
    estimatedSlotsFilled: fillableWithDiscount,
    estimatedRevenueRecovered: Math.round(fillableWithDiscount * avgSlotValue * 0.85),
    rules: [
      'Never discount Sofwave, RF Microneedling, or injectable treatments for last-minute fills',
      'Prioritize members and repeat clients for last-minute availability',
      'Track which clients consistently book last-minute to avoid training bad behavior',
      'Cap at 2 last-minute bookings per day to protect perceived value',
    ],
  };
}

// ── INTRODUCTORY PRICING ──

function buildIntroductoryPricing(services: ServicePricingData[]): IntroductoryPriceSet[] {
  const intro: IntroductoryPriceSet[] = [];

  const introEligible: Record<string, { discount: number; target: number }> = {
    'HydraFacial': { discount: 0.20, target: 70 },
    'VI Peel': { discount: 0.15, target: 65 },
    'PRX-T33': { discount: 0.15, target: 60 },
    'B12 Injection': { discount: 0.25, target: 80 },
    'Laser Hair Removal': { discount: 0.20, target: 75 },
    'Glutathione Injection': { discount: 0.20, target: 70 },
  };

  for (const svc of services) {
    const config = introEligible[svc.name];
    if (!config) continue;

    intro.push({
      service: svc.name,
      regularPrice: svc.currentPrice,
      introPrice: Math.round(svc.currentPrice * (1 - config.discount)),
      discountPercent: config.discount * 100,
      conversionTarget: config.target,
      maxRedemptions: 1,
      conditions: [
        'New clients only',
        'One-time use per client',
        'Must book follow-up at regular price within 30 days for best results',
        'Cannot combine with other offers',
      ],
    });
  }

  return intro;
}

// ── MEMBER PRICING TIERS ──

function buildMemberPricing(stats: MembershipPricingStats): MemberPricingTier[] {
  return [
    {
      tier: 'Halo',
      discountPercent: 10,
      servicesIncluded: ['HydraFacial', 'VI Peel', 'PRX-T33', 'Wellness Injections'],
      estimatedLTV: stats.avgMemberSpend * 12 * stats.memberRetention12Mo,
      retentionImpact: 'Members at Halo tier retain 2x longer than non-members',
    },
    {
      tier: 'Glow',
      discountPercent: 15,
      servicesIncluded: ['All facials', 'PicoWay', 'Laser Hair Removal', 'Wellness Injections'],
      estimatedLTV: stats.avgMemberSpend * 1.5 * 12 * stats.memberRetention12Mo,
      retentionImpact: 'Glow members average 8+ visits per year with 85% retention',
    },
    {
      tier: 'Elite',
      discountPercent: 20,
      servicesIncluded: ['All services including Sofwave and RF Microneedling'],
      estimatedLTV: stats.avgMemberSpend * 2.5 * 12 * stats.memberRetention12Mo,
      retentionImpact: 'Elite members are highest LTV clients with 90%+ retention',
    },
  ];
}

// ── SEASONAL ADJUSTMENTS ──

function analyzeSeasonality(input: PricingOptimizerInput): SeasonalAdjustment[] {
  return [
    {
      season: 'Winter (Holiday Glow)',
      months: [11, 12, 1],
      services: ['HydraFacial', 'VI Peel', 'PRX-T33', 'Botox', 'Fillers'],
      adjustment: 1.05,
      reason: 'Holiday events drive demand for injectable and facial treatments. Gift cards also peak.',
    },
    {
      season: 'Spring (Wedding Season Prep)',
      months: [3, 4, 5],
      services: ['Botox', 'Fillers', 'Lip Filler', 'HydraFacial', 'Sofwave'],
      adjustment: 1.08,
      reason: 'Wedding and event prep creates premium demand for injectable and skin tightening treatments.',
    },
    {
      season: 'Summer (Sun Protection)',
      months: [6, 7, 8],
      services: ['HydraFacial', 'B12 Injection', 'Glutathione Injection', 'NAD+ Injection'],
      adjustment: 0.95,
      reason: 'Laser and peel demand drops due to sun sensitivity. Wellness injections and facials fill the gap.',
    },
    {
      season: 'Fall (Skin Revival)',
      months: [9, 10],
      services: ['VI Peel', 'PRX-T33', 'PicoWay', 'RF Microneedling', 'Laser Hair Removal'],
      adjustment: 1.10,
      reason: 'Post-summer skin repair drives aggressive treatment demand. Best time for laser and peel series.',
    },
  ];
}

// ── COMPETITIVE POSITION ──

function analyzeCompetitivePosition(
  services: ServicePricingData[],
  competitors: CompetitorPricePoint[],
): CompetitivePosition[] {
  const positions: CompetitivePosition[] = [];

  for (const svc of services) {
    const compPrices = competitors
      .filter(c => c.service === svc.name)
      .map(c => c.price);

    if (compPrices.length === 0) continue;

    const marketAvg = compPrices.reduce((s, p) => s + p, 0) / compPrices.length;
    const marketLow = Math.min(...compPrices);
    const marketHigh = Math.max(...compPrices);

    let position: CompetitivePosition['position'];
    let recommendation: string;

    const priceDiff = (svc.currentPrice - marketAvg) / marketAvg;

    if (priceDiff > 0.20) {
      position = 'luxury';
      recommendation = 'Luxury positioning justified by premium experience. Ensure service delivery exceeds expectations.';
    } else if (priceDiff > 0.05) {
      position = 'premium';
      recommendation = 'Strong premium positioning. Continue emphasizing quality, results, and luxury experience.';
    } else if (priceDiff >= -0.05) {
      position = 'at-market';
      recommendation = 'At market rate. Consider premiumizing with enhanced service experience or exclusive add-ons.';
    } else {
      position = 'below-market';
      recommendation = 'Below market -- potential to raise prices without losing volume. Test 5-10% increase.';
    }

    positions.push({
      service: svc.name,
      ourPrice: svc.currentPrice,
      marketAvg: Math.round(marketAvg),
      marketLow,
      marketHigh,
      position,
      recommendation,
    });
  }

  return positions;
}

// ── PRICE SENSITIVITY ──

function analyzePriceSensitivity(
  services: ServicePricingData[],
  transactions: PricingTransaction[],
): PriceSensitivityResult[] {
  const results: PriceSensitivityResult[] = [];

  for (const svc of services) {
    const svcTx = transactions.filter(t => t.service === svc.name && t.booked);

    if (svcTx.length < 10) continue;

    // Group by discount level and measure booking rate
    const fullPrice = svcTx.filter(t => t.discountPercent === 0);
    const discounted = svcTx.filter(t => t.discountPercent > 0);

    // Simple elasticity estimate
    const fullPriceRate = fullPrice.length / Math.max(1, svcTx.length);
    const avgDiscount = discounted.length > 0
      ? discounted.reduce((s, t) => s + t.discountPercent, 0) / discounted.length
      : 0;

    const elasticity = avgDiscount > 0
      ? -((1 - fullPriceRate) / (avgDiscount / 100))
      : -0.5; // default moderate

    let sensitivity: PriceSensitivityResult['sensitivity'];
    if (Math.abs(elasticity) > 2) sensitivity = 'high';
    else if (Math.abs(elasticity) > 1) sensitivity = 'moderate';
    else sensitivity = 'low';

    // Optimal price estimate using simple inverse elasticity rule
    const marginPercent = svc.currentPrice > 0
      ? (svc.currentPrice - svc.costPerSession) / svc.currentPrice
      : 0.5;
    const optimalMarkup = elasticity !== 0 ? elasticity / (1 + elasticity) : 0;
    const optimalPrice = svc.costPerSession > 0
      ? Math.round(svc.costPerSession / (1 - Math.min(0.9, Math.abs(optimalMarkup))))
      : svc.currentPrice;

    results.push({
      service: svc.name,
      currentPrice: svc.currentPrice,
      elasticity: Math.round(elasticity * 100) / 100,
      optimalPrice: Math.max(svc.costPerSession * 1.5, Math.min(svc.currentPrice * 1.3, optimalPrice)),
      revenueAtOptimal: Math.round(optimalPrice * svc.bookingsLast30),
      revenueAtCurrent: Math.round(svc.currentPrice * svc.bookingsLast30),
      sensitivity,
    });
  }

  return results;
}

// ── BUNDLE OPTIMIZATION ──

function optimizeBundles(services: ServicePricingData[], costs: CostStructure): BundleOptimization[] {
  const bundles: BundleOptimization[] = [];

  const bundleTemplates: Array<{ name: string; services: string[]; savings: number; demand: number }> = [
    { name: 'Glow Package', services: ['HydraFacial', 'VI Peel'], savings: 0.12, demand: 75 },
    { name: 'Skin Revival Package', services: ['PRX-T33', 'HydraFacial', 'LED Light Therapy'], savings: 0.15, demand: 65 },
    { name: 'Anti-Aging Power Package', services: ['Sofwave', 'RF Microneedling'], savings: 0.10, demand: 55 },
    { name: 'Injectables Refresh', services: ['Botox', 'Lip Filler'], savings: 0.12, demand: 70 },
    { name: 'Clear Skin Package', services: ['PicoWay', 'HydraFacial'], savings: 0.12, demand: 60 },
    { name: 'Wellness Reset', services: ['B12 Injection', 'Glutathione Injection', 'NAD+ Injection'], savings: 0.18, demand: 50 },
    { name: 'Total Transformation', services: ['Sofwave', 'Botox', 'HydraFacial'], savings: 0.10, demand: 45 },
    { name: 'Monthly Glow Maintenance', services: ['HydraFacial', 'B12 Injection'], savings: 0.15, demand: 80 },
  ];

  for (const tmpl of bundleTemplates) {
    const svcData = tmpl.services.map(s => services.find(svc => svc.name === s)).filter(Boolean) as ServicePricingData[];
    if (svcData.length !== tmpl.services.length) continue;

    const individualTotal = svcData.reduce((s, svc) => s + svc.currentPrice, 0);
    const bundlePrice = Math.round(individualTotal * (1 - tmpl.savings));
    const totalCost = svcData.reduce((s, svc) => s + svc.costPerSession, 0);
    const margin = bundlePrice > 0 ? (bundlePrice - totalCost) / bundlePrice : 0;

    bundles.push({
      bundleName: tmpl.name,
      services: tmpl.services,
      individualTotal,
      bundlePrice,
      savingsPercent: Math.round(tmpl.savings * 100),
      margin: Math.round(margin * 100) / 100,
      demandScore: tmpl.demand,
      strategy: margin >= costs.targetMargin
        ? 'Profitable bundle -- promote actively'
        : 'Margin below target -- use as acquisition tool only',
    });
  }

  return bundles.sort((a, b) => (b.demandScore * b.margin) - (a.demandScore * a.margin));
}

// ── MARGIN ANALYSIS ──

function analyzeMargins(services: ServicePricingData[], costs: CostStructure): MarginAnalysis[] {
  return services.map(svc => {
    const overheadAllocation = (svc.duration / 60) * costs.avgOverheadPerHour;
    const grossMargin = svc.currentPrice - svc.costPerSession;
    const grossMarginPercent = svc.currentPrice > 0 ? (grossMargin / svc.currentPrice) * 100 : 0;
    const netMargin = grossMargin - overheadAllocation;
    const netMarginPercent = svc.currentPrice > 0 ? (netMargin / svc.currentPrice) * 100 : 0;
    const revenuePerMinute = svc.duration > 0 ? svc.currentPrice / svc.duration : 0;

    let status: MarginAnalysis['status'];
    if (netMarginPercent >= 60) status = 'excellent';
    else if (netMarginPercent >= 40) status = 'healthy';
    else if (netMarginPercent >= 15) status = 'thin';
    else status = 'loss-leader';

    let recommendation: string;
    if (status === 'loss-leader') {
      recommendation = `${svc.name} operates below target margin. Consider raising price or reducing cost. Only justify if it drives high-margin upsells.`;
    } else if (status === 'thin') {
      recommendation = `${svc.name} margin is thin. Explore supply cost negotiation or modest price increase.`;
    } else if (status === 'excellent') {
      recommendation = `${svc.name} is a high-margin service. Maximize bookings through targeted marketing.`;
    } else {
      recommendation = `${svc.name} has healthy margins. Maintain current pricing and volume.`;
    }

    return {
      service: svc.name,
      revenue: Math.round(svc.currentPrice * svc.bookingsLast30),
      directCost: Math.round(svc.costPerSession * svc.bookingsLast30),
      overheadAllocation: Math.round(overheadAllocation * svc.bookingsLast30),
      grossMargin: Math.round(grossMargin),
      grossMarginPercent: Math.round(grossMarginPercent),
      netMargin: Math.round(netMargin),
      netMarginPercent: Math.round(netMarginPercent),
      revenuePerMinute: Math.round(revenuePerMinute * 100) / 100,
      status,
      recommendation,
    };
  }).sort((a, b) => b.netMarginPercent - a.netMarginPercent);
}

// ── PRICING HEALTH SCORE ──

function calculatePricingHealth(
  margins: MarginAnalysis[],
  competitive: CompetitivePosition[],
  sensitivity: PriceSensitivityResult[],
): number {
  let score = 50;

  // Margin health (0-30)
  const healthyMargins = margins.filter(m => m.status === 'excellent' || m.status === 'healthy').length;
  score += Math.round((healthyMargins / Math.max(1, margins.length)) * 30);

  // Competitive positioning (0-20)
  const premium = competitive.filter(c => c.position === 'premium' || c.position === 'luxury').length;
  score += Math.round((premium / Math.max(1, competitive.length)) * 20);

  // Low sensitivity services priced well (0-10)
  const wellPriced = sensitivity.filter(s => s.sensitivity === 'low' && s.currentPrice >= s.optimalPrice * 0.9).length;
  if (sensitivity.length > 0) {
    score += Math.round((wellPriced / sensitivity.length) * 10);
  }

  return Math.min(100, Math.max(0, score));
}

// ── TOP ACTIONS ──

function generateTopPricingActions(
  margins: MarginAnalysis[],
  competitive: CompetitivePosition[],
  timePricing: TimePricingTier[],
): string[] {
  const actions: string[] = [];

  const lossLeaders = margins.filter(m => m.status === 'loss-leader');
  if (lossLeaders.length > 0) {
    actions.push(`Review pricing on ${lossLeaders.map(l => l.service).join(', ')} -- margins below target`);
  }

  const belowMarket = competitive.filter(c => c.position === 'below-market');
  if (belowMarket.length > 0) {
    actions.push(`Raise prices on ${belowMarket.map(b => b.service).join(', ')} -- currently below market average`);
  }

  const offPeak = timePricing.find(t => t.tier === 'off-peak');
  if (offPeak) {
    actions.push(`Implement off-peak pricing during ${offPeak.hours} to drive bookings`);
  }

  actions.push('Review bundle pricing quarterly to maintain perceived value');

  return actions.slice(0, 5);
}

// ── UTILITIES ──

function formatHourRange(hours: number[]): string {
  if (hours.length === 0) return '';
  const sorted = [...hours].sort((a, b) => a - b);
  const start = sorted[0];
  const end = sorted[sorted.length - 1] + 1;
  return `${formatHour(start)} - ${formatHour(end)}`;
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}
