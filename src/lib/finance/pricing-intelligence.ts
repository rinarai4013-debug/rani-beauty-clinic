/**
 * Pricing Intelligence Engine
 *
 * Competitor monitoring, price elasticity, optimal pricing, bundle optimization,
 * membership LTV analysis, and provider utilization-adjusted pricing
 * for Rani Beauty Clinic.
 */

// ── TYPES ──

export interface PricingInput {
  services: ServicePricing[];
  competitors: CompetitorData[];
  memberships: MembershipData[];
  clientAcquisition: AcquisitionMetrics;
  providerUtilization: ProviderUtilization[];
  seasonalData?: SeasonalPricingData[];
}

export interface ServicePricing {
  service: string;
  category: string;
  currentPrice: number;
  cost: number; // COGS per treatment
  avgBookingsPerMonth: number;
  avgBookingsLastThreeMonths: number[];
  historicalPrices?: { date: string; price: number; bookings: number }[];
  duration: number; // minutes
  providerTime: number; // minutes of provider time
}

export interface CompetitorData {
  name: string;
  location: string;
  distanceMiles: number;
  services: CompetitorServicePrice[];
  rating: number;
  reviewCount: number;
  positioning: 'budget' | 'mid_range' | 'premium' | 'luxury';
  lastUpdated: string;
}

export interface CompetitorServicePrice {
  service: string;
  category: string;
  price: number;
  notes?: string;
}

export interface MembershipData {
  tier: string;
  monthlyPrice: number;
  memberCount: number;
  avgMonthsRetained: number;
  perks: string[];
  includedServices: { service: string; quantity: number }[];
  avgAdditionalSpend: number; // per month beyond included
}

export interface AcquisitionMetrics {
  avgCostPerLead: number;
  avgCostPerBooking: number;
  avgCostPerClient: number; // full acquisition cost
  conversionRate: number; // lead to client
  channelCosts: { channel: string; spend: number; clients: number; revenue: number }[];
}

export interface ProviderUtilization {
  provider: string;
  availableHours: number;
  bookedHours: number;
  utilizationRate: number;
  avgRevenuePerHour: number;
}

export interface SeasonalPricingData {
  month: number;
  service: string;
  demandMultiplier: number; // 1.0 = normal, 1.3 = 30% above normal
}

// ── OUTPUT TYPES ──

export interface PricingIntelligenceResult {
  serviceAnalysis: ServicePricingAnalysis[];
  competitorComparison: CompetitorComparison;
  bundleRecommendations: BundleRecommendation[];
  membershipAnalysis: MembershipAnalysis[];
  acquisitionAnalysis: AcquisitionAnalysis;
  seasonalPricing: SeasonalPricingRecommendation[];
  providerPricing: ProviderPricingInsight[];
  overallInsights: PricingInsight[];
}

export interface ServicePricingAnalysis {
  service: string;
  category: string;
  currentPrice: number;
  optimalPrice: number;
  minViablePrice: number; // floor (cost + margin)
  maxMarketPrice: number; // ceiling (market tolerance)
  competitorAvgPrice: number;
  competitorRange: { min: number; max: number };
  pricePosition: 'below_market' | 'at_market' | 'above_market' | 'premium';
  elasticity: number; // estimated price elasticity of demand
  revenueAtOptimal: number;
  revenueAtCurrent: number;
  potentialUplift: number; // revenue gain at optimal
  marginPercent: number;
  revenuePerMinute: number;
  recommendation: string;
}

export interface CompetitorComparison {
  totalCompetitors: number;
  avgPriceByService: { service: string; avgPrice: number; raniPrice: number; differential: number }[];
  positioningMap: { competitor: string; positioning: string; avgPriceDiff: number }[];
  marketInsights: string[];
}

export interface BundleRecommendation {
  name: string;
  services: { service: string; regularPrice: number; bundlePrice: number }[];
  totalRegularPrice: number;
  bundlePrice: number;
  discount: number; // percentage
  projectedUptake: number; // expected monthly sales
  projectedRevenue: number;
  marginPercent: number;
  rationale: string;
}

export interface MembershipAnalysis {
  tier: string;
  monthlyPrice: number;
  memberCount: number;
  avgLTV: number;
  monthlyCostToServe: number;
  profitPerMember: number;
  breakEvenMonths: number;
  retentionRate: number;
  recommendation: string;
  optimizedPrice?: number;
}

export interface AcquisitionAnalysis {
  avgCAC: number;
  avgLTV: number;
  ltvCacRatio: number;
  paybackMonths: number;
  bestChannel: string;
  worstChannel: string;
  channelROI: { channel: string; roi: number; cac: number; revenue: number }[];
  recommendation: string;
}

export interface SeasonalPricingRecommendation {
  month: number;
  monthName: string;
  services: {
    service: string;
    basePrice: number;
    recommendedPrice: number;
    adjustment: number; // percentage
    reason: string;
  }[];
}

export interface ProviderPricingInsight {
  provider: string;
  utilizationRate: number;
  currentRevenuePerHour: number;
  targetRevenuePerHour: number;
  recommendation: string;
  suggestedActions: string[];
}

export interface PricingInsight {
  category: 'opportunity' | 'risk' | 'action';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedRevenueDelta: number;
}

// ── CONSTANTS ──

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Med spa target margins by category
const TARGET_MARGINS: Record<string, number> = {
  'Injectable': 0.65,
  'Facial': 0.60,
  'Laser': 0.55,
  'Body': 0.55,
  'Skin Tightening': 0.60,
  'Wellness': 0.70,
  'Peel': 0.65,
  'default': 0.55,
};

// ── CORE FUNCTIONS ──

/**
 * Estimate price elasticity of demand for a service.
 * Uses historical price/booking data if available; otherwise uses category defaults.
 */
export function estimateElasticity(service: ServicePricing): number {
  if (service.historicalPrices && service.historicalPrices.length >= 3) {
    // Calculate elasticity from historical price/booking data
    // E = (% change in quantity) / (% change in price)
    const sorted = [...service.historicalPrices].sort((a, b) => a.date.localeCompare(b.date));
    let totalElasticity = 0;
    let count = 0;

    for (let i = 1; i < sorted.length; i++) {
      const priceChange = sorted[i].price - sorted[i - 1].price;
      const bookingChange = sorted[i].bookings - sorted[i - 1].bookings;
      if (sorted[i - 1].price > 0 && sorted[i - 1].bookings > 0 && priceChange !== 0) {
        const pctPriceChange = priceChange / sorted[i - 1].price;
        const pctBookingChange = bookingChange / sorted[i - 1].bookings;
        totalElasticity += pctBookingChange / pctPriceChange;
        count++;
      }
    }

    if (count > 0) {
      return Math.round((totalElasticity / count) * 100) / 100;
    }
  }

  // Default elasticities by category (med spa services are relatively inelastic)
  const defaults: Record<string, number> = {
    'Injectable': -0.3,    // Low elasticity — results-driven, high loyalty
    'Facial': -0.5,        // Moderate — more substitutes available
    'Laser': -0.4,         // Moderate-low — technology-specific
    'Body': -0.6,          // Moderate — more price-sensitive
    'Skin Tightening': -0.3, // Low — fewer alternatives
    'Wellness': -0.7,      // Higher — many alternatives
    'Peel': -0.5,          // Moderate
  };

  return defaults[service.category] ?? -0.5;
}

/**
 * Calculate optimal price point to maximize revenue.
 * Uses inverse elasticity pricing: P* = MC / (1 + 1/E)
 * Where MC = marginal cost, E = elasticity
 */
export function calculateOptimalPrice(
  service: ServicePricing,
  competitorAvgPrice: number,
  elasticity: number,
): { optimalPrice: number; minViablePrice: number; maxMarketPrice: number } {
  const targetMargin = TARGET_MARGINS[service.category] ?? TARGET_MARGINS['default'];
  const minViablePrice = service.cost > 0 ? service.cost / (1 - targetMargin) : service.currentPrice * 0.7;

  // Revenue-maximizing price using elasticity
  let optimalPrice: number;
  if (elasticity < -1) {
    // Elastic demand: price below current to gain volume
    optimalPrice = service.cost / (1 + 1 / elasticity);
  } else {
    // Inelastic demand: room to increase price
    optimalPrice = service.currentPrice * 1.1;
  }

  // Bound by market: max 30% above competitor average for luxury positioning
  const maxMarketPrice = competitorAvgPrice > 0
    ? competitorAvgPrice * 1.30
    : service.currentPrice * 1.5;

  // Ensure optimal price is within bounds
  optimalPrice = Math.max(minViablePrice, Math.min(maxMarketPrice, optimalPrice));

  // Round to nearest $5 for clean pricing
  optimalPrice = Math.round(optimalPrice / 5) * 5;

  return {
    optimalPrice,
    minViablePrice: Math.round(minViablePrice),
    maxMarketPrice: Math.round(maxMarketPrice),
  };
}

/**
 * Analyze each service's pricing position.
 */
export function analyzeServicePricing(
  services: ServicePricing[],
  competitors: CompetitorData[],
): ServicePricingAnalysis[] {
  return services.map(service => {
    // Gather competitor prices for this service
    const competitorPrices: number[] = [];
    for (const comp of competitors) {
      const match = comp.services.find(s =>
        s.service.toLowerCase() === service.service.toLowerCase() ||
        s.category.toLowerCase() === service.category.toLowerCase(),
      );
      if (match) competitorPrices.push(match.price);
    }

    const competitorAvgPrice = competitorPrices.length > 0
      ? competitorPrices.reduce((s, v) => s + v, 0) / competitorPrices.length
      : service.currentPrice;
    const competitorMin = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
    const competitorMax = competitorPrices.length > 0 ? Math.max(...competitorPrices) : 0;

    const elasticity = estimateElasticity(service);
    const { optimalPrice, minViablePrice, maxMarketPrice } = calculateOptimalPrice(
      service, competitorAvgPrice, elasticity,
    );

    // Price position
    let pricePosition: 'below_market' | 'at_market' | 'above_market' | 'premium';
    if (competitorAvgPrice > 0) {
      const diff = (service.currentPrice - competitorAvgPrice) / competitorAvgPrice;
      if (diff < -0.10) pricePosition = 'below_market';
      else if (diff <= 0.10) pricePosition = 'at_market';
      else if (diff <= 0.25) pricePosition = 'above_market';
      else pricePosition = 'premium';
    } else {
      pricePosition = 'at_market';
    }

    const marginPercent = service.currentPrice > 0
      ? ((service.currentPrice - service.cost) / service.currentPrice) * 100
      : 0;

    const revenuePerMinute = service.duration > 0
      ? service.currentPrice / service.duration
      : 0;

    const revenueAtCurrent = service.currentPrice * service.avgBookingsPerMonth;
    // Estimate bookings at optimal price using elasticity
    const priceChangePercent = (optimalPrice - service.currentPrice) / service.currentPrice;
    const bookingChangePercent = priceChangePercent * elasticity;
    const bookingsAtOptimal = service.avgBookingsPerMonth * (1 + bookingChangePercent);
    const revenueAtOptimal = optimalPrice * bookingsAtOptimal;
    const potentialUplift = revenueAtOptimal - revenueAtCurrent;

    let recommendation: string;
    if (potentialUplift > 500) {
      recommendation = `Increase price to $${optimalPrice} for estimated +$${Math.round(potentialUplift).toLocaleString()}/mo revenue uplift`;
    } else if (potentialUplift < -500) {
      recommendation = `Consider promotional pricing at $${optimalPrice} to drive volume`;
    } else {
      recommendation = 'Current pricing is near optimal for this market';
    }

    return {
      service: service.service,
      category: service.category,
      currentPrice: service.currentPrice,
      optimalPrice,
      minViablePrice,
      maxMarketPrice,
      competitorAvgPrice: Math.round(competitorAvgPrice),
      competitorRange: { min: competitorMin, max: competitorMax },
      pricePosition,
      elasticity,
      revenueAtOptimal: Math.round(revenueAtOptimal),
      revenueAtCurrent: Math.round(revenueAtCurrent),
      potentialUplift: Math.round(potentialUplift),
      marginPercent: Math.round(marginPercent * 10) / 10,
      revenuePerMinute: Math.round(revenuePerMinute * 100) / 100,
      recommendation,
    };
  });
}

/**
 * Generate competitor comparison matrix.
 */
export function compareCompetitors(
  services: ServicePricing[],
  competitors: CompetitorData[],
): CompetitorComparison {
  const avgPriceByService = services.map(service => {
    const prices: number[] = [];
    for (const comp of competitors) {
      const match = comp.services.find(s =>
        s.service.toLowerCase() === service.service.toLowerCase(),
      );
      if (match) prices.push(match.price);
    }
    const avgPrice = prices.length > 0 ? prices.reduce((s, v) => s + v, 0) / prices.length : 0;
    return {
      service: service.service,
      avgPrice: Math.round(avgPrice),
      raniPrice: service.currentPrice,
      differential: avgPrice > 0 ? Math.round(((service.currentPrice - avgPrice) / avgPrice) * 100) : 0,
    };
  });

  const positioningMap = competitors.map(comp => {
    const diffs: number[] = [];
    for (const cs of comp.services) {
      const raniService = services.find(s => s.service.toLowerCase() === cs.service.toLowerCase());
      if (raniService) {
        diffs.push(cs.price - raniService.currentPrice);
      }
    }
    const avgDiff = diffs.length > 0 ? diffs.reduce((s, v) => s + v, 0) / diffs.length : 0;
    return {
      competitor: comp.name,
      positioning: comp.positioning,
      avgPriceDiff: Math.round(avgDiff),
    };
  });

  const insights: string[] = [];
  const belowMarket = avgPriceByService.filter(s => s.differential < -10);
  const aboveMarket = avgPriceByService.filter(s => s.differential > 15);

  if (belowMarket.length > 0) {
    insights.push(`${belowMarket.length} service(s) priced significantly below market — potential revenue opportunity`);
  }
  if (aboveMarket.length > 0) {
    insights.push(`${aboveMarket.length} service(s) priced well above competitors — ensure value justifies premium`);
  }

  const luxuryComps = competitors.filter(c => c.positioning === 'luxury');
  if (luxuryComps.length === 0) {
    insights.push('No direct luxury competitors identified — strong positioning advantage');
  }

  return {
    totalCompetitors: competitors.length,
    avgPriceByService,
    positioningMap,
    marketInsights: insights,
  };
}

/**
 * Generate bundle pricing recommendations.
 */
export function recommendBundles(services: ServicePricing[]): BundleRecommendation[] {
  const bundles: BundleRecommendation[] = [];

  // Signature facial + injectable bundle
  const facial = services.find(s => s.category === 'Facial');
  const injectable = services.find(s => s.category === 'Injectable');
  if (facial && injectable) {
    const totalRegular = facial.currentPrice + injectable.currentPrice;
    const bundlePrice = Math.round(totalRegular * 0.9 / 5) * 5; // 10% discount, round to $5
    const totalCost = facial.cost + injectable.cost;
    bundles.push({
      name: 'Glow & Refresh Bundle',
      services: [
        { service: facial.service, regularPrice: facial.currentPrice, bundlePrice: Math.round(bundlePrice * (facial.currentPrice / totalRegular)) },
        { service: injectable.service, regularPrice: injectable.currentPrice, bundlePrice: Math.round(bundlePrice * (injectable.currentPrice / totalRegular)) },
      ],
      totalRegularPrice: totalRegular,
      bundlePrice,
      discount: Math.round(((totalRegular - bundlePrice) / totalRegular) * 100),
      projectedUptake: Math.round(Math.min(facial.avgBookingsPerMonth, injectable.avgBookingsPerMonth) * 0.15),
      projectedRevenue: 0,
      marginPercent: bundlePrice > 0 ? Math.round(((bundlePrice - totalCost) / bundlePrice) * 1000) / 10 : 0,
      rationale: 'Combines popular facial treatment with injectable for comprehensive rejuvenation. Drives cross-category bookings.',
    });
    const lastBundle = bundles[bundles.length - 1];
    lastBundle.projectedRevenue = lastBundle.projectedUptake * lastBundle.bundlePrice;
  }

  // Laser series package (3 sessions)
  const laser = services.find(s => s.category === 'Laser');
  if (laser) {
    const singlePrice = laser.currentPrice;
    const packagePrice = Math.round(singlePrice * 3 * 0.85 / 5) * 5; // 15% discount for 3-pack
    bundles.push({
      name: 'Laser Transformation Series (3 Sessions)',
      services: [
        { service: laser.service, regularPrice: singlePrice * 3, bundlePrice: packagePrice },
      ],
      totalRegularPrice: singlePrice * 3,
      bundlePrice: packagePrice,
      discount: Math.round(((singlePrice * 3 - packagePrice) / (singlePrice * 3)) * 100),
      projectedUptake: Math.round(laser.avgBookingsPerMonth * 0.2),
      projectedRevenue: 0,
      marginPercent: laser.cost > 0 ? Math.round(((packagePrice - laser.cost * 3) / packagePrice) * 1000) / 10 : 0,
      rationale: 'Laser treatments deliver best results in series. Package locks in commitment and increases total revenue per client.',
    });
    const lastBundle = bundles[bundles.length - 1];
    lastBundle.projectedRevenue = lastBundle.projectedUptake * lastBundle.bundlePrice;
  }

  // Skin tightening + peel combo
  const skinTightening = services.find(s => s.category === 'Skin Tightening');
  const peel = services.find(s => s.category === 'Peel');
  if (skinTightening && peel) {
    const totalRegular = skinTightening.currentPrice + peel.currentPrice;
    const bundlePrice = Math.round(totalRegular * 0.88 / 5) * 5;
    const totalCost = skinTightening.cost + peel.cost;
    bundles.push({
      name: 'Total Renewal Package',
      services: [
        { service: skinTightening.service, regularPrice: skinTightening.currentPrice, bundlePrice: Math.round(bundlePrice * 0.7) },
        { service: peel.service, regularPrice: peel.currentPrice, bundlePrice: Math.round(bundlePrice * 0.3) },
      ],
      totalRegularPrice: totalRegular,
      bundlePrice,
      discount: Math.round(((totalRegular - bundlePrice) / totalRegular) * 100),
      projectedUptake: Math.round(Math.min(skinTightening.avgBookingsPerMonth, peel.avgBookingsPerMonth) * 0.1),
      projectedRevenue: 0,
      marginPercent: bundlePrice > 0 ? Math.round(((bundlePrice - totalCost) / bundlePrice) * 1000) / 10 : 0,
      rationale: 'Skin tightening plus chemical peel addresses both laxity and texture. High-ticket bundle that maximizes treatment room time.',
    });
    const lastBundle = bundles[bundles.length - 1];
    lastBundle.projectedRevenue = lastBundle.projectedUptake * lastBundle.bundlePrice;
  }

  return bundles;
}

/**
 * Analyze membership economics.
 */
export function analyzeMemberships(
  memberships: MembershipData[],
  acquisitionCost: number,
): MembershipAnalysis[] {
  return memberships.map(m => {
    const avgLTV = m.monthlyPrice * m.avgMonthsRetained + m.avgAdditionalSpend * m.avgMonthsRetained;

    // Estimate cost to serve: included service costs
    const monthlyCostToServe = m.includedServices.reduce((s, svc) => {
      // Rough estimate: 30% of service price is COGS
      return s + (svc.quantity * 50); // avg $50 cost per included service
    }, 0);

    const profitPerMember = m.monthlyPrice + m.avgAdditionalSpend - monthlyCostToServe;
    const breakEvenMonths = acquisitionCost > 0 && profitPerMember > 0
      ? Math.ceil(acquisitionCost / profitPerMember)
      : -1;

    const retentionRate = m.avgMonthsRetained > 0
      ? Math.min(1, (m.avgMonthsRetained - 1) / m.avgMonthsRetained)
      : 0;

    let recommendation: string;
    if (profitPerMember < 0) {
      recommendation = `This tier is unprofitable. Consider increasing price by $${Math.round(Math.abs(profitPerMember) + 20)}/mo or reducing included services.`;
    } else if (avgLTV < acquisitionCost * 3) {
      recommendation = `LTV:CAC ratio is low (${(avgLTV / acquisitionCost).toFixed(1)}x). Focus on retention to increase average membership duration.`;
    } else if (m.avgAdditionalSpend < m.monthlyPrice * 0.5) {
      recommendation = 'Members under-purchasing beyond included services. Create upgrade paths and exclusive member-only add-ons.';
    } else {
      recommendation = 'Strong tier performance. Consider a premium tier with more exclusivity.';
    }

    // Optimized price: if profitable, suggest 5-10% increase if retention is high
    const optimizedPrice = retentionRate > 0.85 && profitPerMember > 0
      ? Math.round((m.monthlyPrice * 1.08) / 5) * 5
      : undefined;

    return {
      tier: m.tier,
      monthlyPrice: m.monthlyPrice,
      memberCount: m.memberCount,
      avgLTV: Math.round(avgLTV),
      monthlyCostToServe: Math.round(monthlyCostToServe),
      profitPerMember: Math.round(profitPerMember),
      breakEvenMonths,
      retentionRate: Math.round(retentionRate * 1000) / 10,
      recommendation,
      optimizedPrice,
    };
  });
}

/**
 * Analyze client acquisition economics.
 */
export function analyzeAcquisition(
  metrics: AcquisitionMetrics,
  avgClientLTV: number,
): AcquisitionAnalysis {
  const ltvCacRatio = metrics.avgCostPerClient > 0 ? avgClientLTV / metrics.avgCostPerClient : 0;

  // Assume average monthly spend to calculate payback
  const avgMonthlySpend = avgClientLTV / 24; // assume 24-month average lifespan
  const paybackMonths = metrics.avgCostPerClient > 0 && avgMonthlySpend > 0
    ? Math.ceil(metrics.avgCostPerClient / avgMonthlySpend)
    : -1;

  const channelROI = metrics.channelCosts.map(c => ({
    channel: c.channel,
    roi: c.spend > 0 ? Math.round(((c.revenue - c.spend) / c.spend) * 100) : 0,
    cac: c.clients > 0 ? Math.round(c.spend / c.clients) : 0,
    revenue: c.revenue,
  })).sort((a, b) => b.roi - a.roi);

  const bestChannel = channelROI[0]?.channel ?? 'Unknown';
  const worstChannel = channelROI[channelROI.length - 1]?.channel ?? 'Unknown';

  let recommendation: string;
  if (ltvCacRatio >= 5) {
    recommendation = `Outstanding LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}x. Scale acquisition spend aggressively on ${bestChannel}.`;
  } else if (ltvCacRatio >= 3) {
    recommendation = `Healthy LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}x. Maintain current spend and optimize ${worstChannel}.`;
  } else if (ltvCacRatio >= 1) {
    recommendation = `LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}x is below target. Reduce spend on ${worstChannel} and improve retention.`;
  } else {
    recommendation = 'Acquisition cost exceeds client lifetime value. Urgent review of marketing spend and client retention needed.';
  }

  return {
    avgCAC: metrics.avgCostPerClient,
    avgLTV: Math.round(avgClientLTV),
    ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
    paybackMonths,
    bestChannel,
    worstChannel,
    channelROI,
    recommendation,
  };
}

/**
 * Generate seasonal pricing recommendations.
 */
export function generateSeasonalPricing(
  services: ServicePricing[],
  seasonalData?: SeasonalPricingData[],
): SeasonalPricingRecommendation[] {
  // Default demand multipliers for med spa services
  const defaultDemand: Record<number, Record<string, number>> = {
    1:  { Injectable: 0.85, Facial: 0.80, Laser: 0.90, 'Skin Tightening': 0.85, Peel: 0.80, Wellness: 0.90, Body: 0.80 },
    2:  { Injectable: 0.90, Facial: 0.95, Laser: 0.90, 'Skin Tightening': 0.90, Peel: 0.90, Wellness: 0.85, Body: 0.85 },
    3:  { Injectable: 1.00, Facial: 1.00, Laser: 0.95, 'Skin Tightening': 1.00, Peel: 1.00, Wellness: 0.95, Body: 0.95 },
    4:  { Injectable: 1.10, Facial: 1.05, Laser: 1.00, 'Skin Tightening': 1.05, Peel: 1.10, Wellness: 1.00, Body: 1.05 },
    5:  { Injectable: 1.15, Facial: 1.10, Laser: 1.15, 'Skin Tightening': 1.10, Peel: 1.10, Wellness: 1.05, Body: 1.15 },
    6:  { Injectable: 1.10, Facial: 1.00, Laser: 1.20, 'Skin Tightening': 1.05, Peel: 0.95, Wellness: 1.00, Body: 1.20 },
    7:  { Injectable: 1.00, Facial: 0.90, Laser: 1.15, 'Skin Tightening': 1.00, Peel: 0.90, Wellness: 0.95, Body: 1.10 },
    8:  { Injectable: 0.95, Facial: 0.90, Laser: 1.10, 'Skin Tightening': 0.95, Peel: 0.85, Wellness: 0.90, Body: 1.00 },
    9:  { Injectable: 1.05, Facial: 1.05, Laser: 1.05, 'Skin Tightening': 1.05, Peel: 1.05, Wellness: 1.00, Body: 0.95 },
    10: { Injectable: 1.15, Facial: 1.10, Laser: 1.00, 'Skin Tightening': 1.15, Peel: 1.15, Wellness: 1.05, Body: 1.00 },
    11: { Injectable: 1.20, Facial: 1.15, Laser: 0.95, 'Skin Tightening': 1.20, Peel: 1.20, Wellness: 1.10, Body: 0.95 },
    12: { Injectable: 1.05, Facial: 1.00, Laser: 0.85, 'Skin Tightening': 1.05, Peel: 1.00, Wellness: 1.00, Body: 0.85 },
  };

  const recommendations: SeasonalPricingRecommendation[] = [];

  for (let month = 1; month <= 12; month++) {
    const serviceRecs = services.map(service => {
      // Check for custom seasonal data first
      const custom = seasonalData?.find(s => s.month === month && s.service === service.service);
      const multiplier = custom?.demandMultiplier ??
        defaultDemand[month]?.[service.category] ?? 1.0;

      // Price adjustment: increase when demand is high, promote when low
      let adjustment = 0;
      let reason = '';
      if (multiplier > 1.10) {
        adjustment = Math.round((multiplier - 1) * 50); // partial pass-through
        reason = 'Peak demand period — premium pricing justified';
      } else if (multiplier < 0.90) {
        adjustment = -5; // modest promotion
        reason = 'Lower demand — promotional pricing to maintain utilization';
      } else {
        reason = 'Normal demand — maintain standard pricing';
      }

      const recommendedPrice = Math.round((service.currentPrice * (1 + adjustment / 100)) / 5) * 5;

      return {
        service: service.service,
        basePrice: service.currentPrice,
        recommendedPrice,
        adjustment,
        reason,
      };
    });

    recommendations.push({
      month,
      monthName: MONTH_NAMES[month],
      services: serviceRecs,
    });
  }

  return recommendations;
}

/**
 * Analyze provider utilization for pricing insights.
 */
export function analyzeProviderPricing(
  providers: ProviderUtilization[],
  targetUtilization: number = 0.80,
  targetRevenuePerHour: number = 250,
): ProviderPricingInsight[] {
  return providers.map(p => {
    const suggestedActions: string[] = [];
    let recommendation: string;

    if (p.utilizationRate < 0.60) {
      recommendation = 'Underutilized — consider promotional pricing to fill gaps';
      suggestedActions.push('Offer introductory rates for slow time slots');
      suggestedActions.push('Create limited-time packages to drive bookings');
      suggestedActions.push('Review schedule availability and marketing reach');
    } else if (p.utilizationRate > 0.90) {
      recommendation = 'Fully booked — raise prices to optimize revenue per hour';
      suggestedActions.push(`Increase prices by 10-15% (target $${targetRevenuePerHour}/hr)`);
      suggestedActions.push('Introduce premium time-slot surcharges');
      suggestedActions.push('Consider adding another provider to meet demand');
    } else {
      recommendation = 'Balanced utilization — maintain current pricing strategy';
      suggestedActions.push('Monitor booking trends for seasonal adjustments');
      suggestedActions.push('Optimize service mix for highest-margin treatments');
    }

    if (p.avgRevenuePerHour < targetRevenuePerHour * 0.8) {
      suggestedActions.push(`Revenue per hour ($${p.avgRevenuePerHour}) below target ($${targetRevenuePerHour}). Shift mix toward premium services.`);
    }

    return {
      provider: p.provider,
      utilizationRate: p.utilizationRate,
      currentRevenuePerHour: p.avgRevenuePerHour,
      targetRevenuePerHour,
      recommendation,
      suggestedActions,
    };
  });
}

/**
 * Main pricing intelligence function.
 */
export function generatePricingIntelligence(input: PricingInput): PricingIntelligenceResult {
  // 1. Service-level analysis
  const serviceAnalysis = analyzeServicePricing(input.services, input.competitors);

  // 2. Competitor comparison
  const competitorComparison = compareCompetitors(input.services, input.competitors);

  // 3. Bundle recommendations
  const bundleRecommendations = recommendBundles(input.services);

  // 4. Membership analysis
  const membershipAnalysis = analyzeMemberships(
    input.memberships,
    input.clientAcquisition.avgCostPerClient,
  );

  // 5. Acquisition analysis
  const avgClientLTV = input.memberships.length > 0
    ? input.memberships.reduce((s, m) => s + m.monthlyPrice * m.avgMonthsRetained, 0) / input.memberships.length
    : input.services.reduce((s, sv) => s + sv.currentPrice * sv.avgBookingsPerMonth, 0) * 12;
  const acquisitionAnalysis = analyzeAcquisition(input.clientAcquisition, avgClientLTV);

  // 6. Seasonal pricing
  const seasonalPricing = generateSeasonalPricing(input.services, input.seasonalData);

  // 7. Provider pricing
  const providerPricing = analyzeProviderPricing(input.providerUtilization);

  // 8. Overall insights
  const overallInsights: PricingInsight[] = [];

  const totalUplift = serviceAnalysis.reduce((s, sa) => s + Math.max(0, sa.potentialUplift), 0);
  if (totalUplift > 1000) {
    overallInsights.push({
      category: 'opportunity',
      title: 'Revenue Uplift from Price Optimization',
      description: `Adjusting prices to optimal levels could generate +$${totalUplift.toLocaleString()}/month in additional revenue.`,
      impact: totalUplift > 5000 ? 'high' : 'medium',
      estimatedRevenueDelta: totalUplift,
    });
  }

  const bundleRevenue = bundleRecommendations.reduce((s, b) => s + b.projectedRevenue, 0);
  if (bundleRevenue > 500) {
    overallInsights.push({
      category: 'opportunity',
      title: 'Bundle Revenue Opportunity',
      description: `${bundleRecommendations.length} bundle packages could generate $${bundleRevenue.toLocaleString()}/month in incremental revenue.`,
      impact: bundleRevenue > 3000 ? 'high' : 'medium',
      estimatedRevenueDelta: bundleRevenue,
    });
  }

  if (acquisitionAnalysis.ltvCacRatio < 3) {
    overallInsights.push({
      category: 'risk',
      title: 'Low LTV:CAC Ratio',
      description: `Client acquisition cost ($${acquisitionAnalysis.avgCAC}) is high relative to lifetime value ($${acquisitionAnalysis.avgLTV}). Focus on retention over acquisition.`,
      impact: 'high',
      estimatedRevenueDelta: 0,
    });
  }

  return {
    serviceAnalysis,
    competitorComparison,
    bundleRecommendations,
    membershipAnalysis,
    acquisitionAnalysis,
    seasonalPricing,
    providerPricing,
    overallInsights,
  };
}
