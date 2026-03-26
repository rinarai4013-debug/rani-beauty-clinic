/**
 * Dynamic Pricing & Packaging AI Engine
 *
 * Analyzes demand patterns, capacity utilization, seasonality, and client
 * segments to generate optimal pricing recommendations, smart packages,
 * and promotional strategies.
 *
 * Strategies:
 * 1. Demand-based pricing - Adjust by time slot demand
 * 2. Capacity optimization - Fill low-utilization windows
 * 3. Seasonal adjustments - Holiday/event-driven pricing
 * 4. Client segment pricing - Membership vs. new vs. returning
 * 5. Smart package builder - Auto-generate high-margin bundles
 * 6. Competitor-aware pricing - Stay competitive within range
 */

// ── TYPES ──

export interface PricingInput {
  services: ServicePricing[];
  utilization: UtilizationData;
  transactions: TransactionHistory[];
  memberships: MembershipData;
  seasonality?: SeasonalityData;
  competitorPricing?: CompetitorPrice[];
}

export interface ServicePricing {
  service: string;
  category: string;
  basePrice: number;
  cost: number; // estimated cost (supplies, provider time)
  duration: number; // minutes
  popularity: number; // bookings in last 30 days
}

export interface UtilizationData {
  byDayOfWeek: { day: string; rate: number }[]; // 0-100%
  byTimeSlot: { slot: string; rate: number }[]; // e.g., "10-11", "14-15"
  overall: number; // 0-100%
}

export interface TransactionHistory {
  service: string;
  amount: number;
  date: string;
  dayOfWeek: number;
  hour: number;
  clientType: 'new' | 'returning' | 'member';
  hadFinancing: boolean;
}

export interface MembershipData {
  totalMembers: number;
  avgMemberSpend: number;
  avgNonMemberSpend: number;
  churnRate: number;
}

export interface SeasonalityData {
  currentMonth: number;
  isHolidaySeason: boolean;
  upcomingEvents: string[];
}

export interface CompetitorPrice {
  competitor: string;
  service: string;
  price: number;
}

// ── OUTPUT TYPES ──

export interface PricingRecommendation {
  service: string;
  category: string;
  currentPrice: number;
  suggestedPrice: number;
  priceChange: number; // percentage
  reason: string;
  confidence: number; // 0-100
  strategy: PricingStrategy;
  estimatedRevenueImpact: number; // monthly
}

export interface PackageRecommendation {
  name: string;
  services: { service: string; regularPrice: number }[];
  totalRegularPrice: number;
  packagePrice: number;
  savings: number;
  savingsPercent: number;
  margin: number; // estimated gross margin %
  targetSegment: string;
  rationale: string;
}

export interface PromotionalStrategy {
  type: 'flash_sale' | 'off_peak' | 'new_client' | 'membership_upsell' | 'seasonal' | 'bundle';
  title: string;
  description: string;
  discount: number; // percentage
  validFor: string; // e.g., "Tuesdays 10AM-2PM"
  expectedLift: number; // percentage increase in bookings
  services: string[];
}

export type PricingStrategy =
  | 'demand_premium'
  | 'capacity_fill'
  | 'margin_optimization'
  | 'competitive_adjustment'
  | 'membership_incentive'
  | 'seasonal';

export interface DynamicPricingResult {
  priceRecommendations: PricingRecommendation[];
  packages: PackageRecommendation[];
  promotions: PromotionalStrategy[];
  insights: string[];
  overallHealthScore: number; // 0-100 (pricing health)
  projectedRevenueImpact: number; // monthly $ if all recommendations adopted
}

// ── CONSTANTS ──

const MARGIN_TARGETS: Record<string, number> = {
  'Facial': 0.65,
  'Laser': 0.70,
  'Injectable': 0.75,
  'Peel': 0.72,
  'Body': 0.68,
  'Wellness': 0.80,
  'Hair Removal': 0.75,
};

const SEASONAL_MULTIPLIERS: Record<number, { name: string; factor: number }> = {
  1: { name: 'New Year Resolution', factor: 1.05 },
  2: { name: 'Valentine\'s Day', factor: 1.08 },
  3: { name: 'Spring Refresh', factor: 1.03 },
  4: { name: 'Wedding Season Start', factor: 1.05 },
  5: { name: 'Wedding Season Peak', factor: 1.08 },
  6: { name: 'Summer Body', factor: 1.10 },
  7: { name: 'Summer Maintenance', factor: 1.05 },
  8: { name: 'Back to School', factor: 0.97 },
  9: { name: 'Fall Refresh', factor: 1.02 },
  10: { name: 'Pre-Holiday', factor: 1.06 },
  11: { name: 'Holiday Season', factor: 1.12 },
  12: { name: 'Gift Season', factor: 1.15 },
};

const LOW_DEMAND_THRESHOLD = 40; // % utilization
const HIGH_DEMAND_THRESHOLD = 85; // % utilization
const MAX_PRICE_INCREASE = 15; // % max single adjustment
const MAX_PRICE_DECREASE = 20; // % max discount

// ── ENGINE ──

export function analyzePricing(input: PricingInput): DynamicPricingResult {
  const priceRecommendations = generatePriceRecommendations(input);
  const packages = generatePackages(input);
  const promotions = generatePromotions(input);
  const insights = generateInsights(input, priceRecommendations);
  const healthScore = calculatePricingHealth(input, priceRecommendations);
  const projectedImpact = priceRecommendations.reduce((sum, r) => sum + r.estimatedRevenueImpact, 0);

  return {
    priceRecommendations,
    packages,
    promotions,
    insights,
    overallHealthScore: healthScore,
    projectedRevenueImpact: projectedImpact,
  };
}

// ── PRICE RECOMMENDATIONS ──

function generatePriceRecommendations(input: PricingInput): PricingRecommendation[] {
  const recommendations: PricingRecommendation[] = [];

  for (const service of input.services) {
    const factors = analyzeServiceFactors(service, input);
    const adjustment = calculatePriceAdjustment(factors);

    if (Math.abs(adjustment.change) >= 2) {
      let suggestedPrice = Math.round(service.basePrice * (1 + adjustment.change / 100));

      // GUARDRAIL: Never price below cost - enforce minimum 10% margin
      const minPrice = Math.round(service.cost * 1.10);
      if (suggestedPrice < minPrice) {
        suggestedPrice = minPrice;
        adjustment.reason += '. Floor applied: price cannot go below cost + 10% margin';
      }

      recommendations.push({
        service: service.service,
        category: service.category,
        currentPrice: service.basePrice,
        suggestedPrice,
        priceChange: adjustment.change,
        reason: adjustment.reason,
        confidence: adjustment.confidence,
        strategy: adjustment.strategy,
        estimatedRevenueImpact: estimateRevenueImpact(
          service, suggestedPrice, input.transactions
        ),
      });
    }
  }

  return recommendations
    .sort((a, b) => Math.abs(b.estimatedRevenueImpact) - Math.abs(a.estimatedRevenueImpact))
    .slice(0, 10); // Top 10 recommendations
}

interface ServiceFactors {
  demandScore: number; // 0-100 (how in-demand)
  marginScore: number; // 0-100 (how healthy the margin is)
  competitivePosition: number; // -100 to 100 (negative = we're cheaper)
  seasonalFactor: number; // multiplier
  membershipImpact: number; // how much members use this
  trendDirection: 'growing' | 'stable' | 'declining';
}

function analyzeServiceFactors(
  service: ServicePricing,
  input: PricingInput
): ServiceFactors {
  // Demand score: popularity relative to capacity
  const maxPopularity = Math.max(...input.services.map(s => s.popularity), 1);
  const demandScore = Math.round((service.popularity / maxPopularity) * 100);

  // Margin analysis
  const currentMargin = (service.basePrice - service.cost) / service.basePrice;
  const targetMargin = MARGIN_TARGETS[service.category] || 0.70;
  const marginScore = Math.min(100, Math.round((currentMargin / targetMargin) * 100));

  // Competitive position
  let competitivePosition = 0;
  if (input.competitorPricing) {
    const competitorPrices = input.competitorPricing
      .filter(c => c.service.toLowerCase() === service.service.toLowerCase())
      .map(c => c.price);

    if (competitorPrices.length > 0) {
      const avgCompetitor = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      competitivePosition = Math.round(((service.basePrice - avgCompetitor) / avgCompetitor) * 100);
    }
  }

  // Seasonal factor
  const month = input.seasonality?.currentMonth || new Date().getMonth() + 1;
  const seasonalFactor = SEASONAL_MULTIPLIERS[month]?.factor || 1.0;

  // Membership impact
  const memberTransactions = input.transactions
    .filter(t => t.service === service.service && t.clientType === 'member');
  const totalTransactions = input.transactions
    .filter(t => t.service === service.service);
  const membershipImpact = totalTransactions.length > 0
    ? memberTransactions.length / totalTransactions.length
    : 0;

  // Trend: compare last 15 days vs prior 15 days
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 86400000).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const recentBookings = input.transactions
    .filter(t => t.service === service.service && t.date >= fifteenDaysAgo).length;
  const priorBookings = input.transactions
    .filter(t => t.service === service.service && t.date >= thirtyDaysAgo && t.date < fifteenDaysAgo).length;

  const trendDirection: 'growing' | 'stable' | 'declining' =
    recentBookings > priorBookings * 1.15 ? 'growing' :
    recentBookings < priorBookings * 0.85 ? 'declining' : 'stable';

  return {
    demandScore,
    marginScore,
    competitivePosition,
    seasonalFactor,
    membershipImpact,
    trendDirection,
  };
}

function calculatePriceAdjustment(
  factors: ServiceFactors
): { change: number; reason: string; confidence: number; strategy: PricingStrategy } {
  let change = 0;
  let reason = '';
  let confidence = 50;
  let strategy: PricingStrategy = 'margin_optimization';

  // High demand + growing trend → premium pricing
  if (factors.demandScore > 75 && factors.trendDirection === 'growing') {
    change += Math.min(factors.seasonalFactor * 8, MAX_PRICE_INCREASE);
    reason = 'High demand with growing trend supports premium pricing';
    confidence = 80;
    strategy = 'demand_premium';
  }

  // Low demand + declining → capacity fill discount
  if (factors.demandScore < 30 && factors.trendDirection === 'declining') {
    change -= Math.min(10, MAX_PRICE_DECREASE);
    reason = 'Low demand - recommend promotional pricing to fill capacity';
    confidence = 70;
    strategy = 'capacity_fill';
  }

  // Poor margin → increase price
  if (factors.marginScore < 70) {
    const marginAdjust = Math.min((70 - factors.marginScore) * 0.15, MAX_PRICE_INCREASE);
    change += marginAdjust;
    reason = reason
      ? `${reason}. Margin below target - adjust upward`
      : 'Service margin below category target';
    confidence = Math.max(confidence, 75);
    strategy = change > 5 ? 'margin_optimization' : strategy;
  }

  // Significantly cheaper than competitors → room to increase
  if (factors.competitivePosition < -15) {
    const compAdjust = Math.min(Math.abs(factors.competitivePosition) * 0.4, MAX_PRICE_INCREASE);
    change += compAdjust;
    reason = reason
      ? `${reason}. Priced below market - competitive room to increase`
      : 'Priced significantly below competitors';
    confidence = Math.max(confidence, 85);
    strategy = 'competitive_adjustment';
  }

  // Seasonal boost
  if (factors.seasonalFactor > 1.05) {
    change *= factors.seasonalFactor;
    reason = reason
      ? `${reason} (seasonal demand boost applied)`
      : 'Seasonal demand increase supports higher pricing';
    strategy = change > 3 ? 'seasonal' : strategy;
  }

  // Cap adjustments
  change = Math.max(-MAX_PRICE_DECREASE, Math.min(MAX_PRICE_INCREASE, change));
  change = Math.round(change * 10) / 10;

  return { change, reason, confidence, strategy };
}

function estimateRevenueImpact(
  service: ServicePricing,
  suggestedPrice: number,
  transactions: TransactionHistory[]
): number {
  const monthlyBookings = service.popularity;
  const priceDiff = suggestedPrice - service.basePrice;

  // Elasticity: higher prices slightly reduce demand
  const elasticity = priceDiff > 0 ? 0.85 : 1.1; // conservative
  const adjustedBookings = Math.round(monthlyBookings * elasticity);

  const currentRevenue = monthlyBookings * service.basePrice;
  const projectedRevenue = adjustedBookings * suggestedPrice;

  return Math.round(projectedRevenue - currentRevenue);
}

// ── PACKAGE BUILDER ──

function generatePackages(input: PricingInput): PackageRecommendation[] {
  const packages: PackageRecommendation[] = [];

  // Package 1: "First Visit Bundle" - Most popular facial + add-on
  const facials = input.services.filter(s => s.category === 'Facial').sort((a, b) => b.popularity - a.popularity);
  const peels = input.services.filter(s => s.category === 'Peel').sort((a, b) => b.popularity - a.popularity);

  if (facials.length > 0 && peels.length > 0) {
    const topFacial = facials[0];
    const topPeel = peels[0];
    const total = topFacial.basePrice + topPeel.basePrice;
    const packagePrice = Math.round(total * 0.85); // 15% off

    packages.push({
      name: 'Glow Reset Bundle',
      services: [
        { service: topFacial.service, regularPrice: topFacial.basePrice },
        { service: topPeel.service, regularPrice: topPeel.basePrice },
      ],
      totalRegularPrice: total,
      packagePrice,
      savings: total - packagePrice,
      savingsPercent: Math.round(((total - packagePrice) / total) * 100),
      margin: calculatePackageMargin([topFacial, topPeel], packagePrice),
      targetSegment: 'New clients looking for transformation',
      rationale: 'Combines two most popular treatments at an introductory price. High conversion driver.',
    });
  }

  // Package 2: "Membership Upgrade" - Series package
  if (facials.length > 0) {
    const topService = facials[0];
    const seriesPrice = Math.round(topService.basePrice * 4 * 0.80); // 4 sessions, 20% off

    packages.push({
      name: `${topService.service} Series (4 Sessions)`,
      services: Array(4).fill({ service: topService.service, regularPrice: topService.basePrice }),
      totalRegularPrice: topService.basePrice * 4,
      packagePrice: seriesPrice,
      savings: topService.basePrice * 4 - seriesPrice,
      savingsPercent: 20,
      margin: calculatePackageMargin(Array(4).fill(topService), seriesPrice),
      targetSegment: 'Committed clients who want consistent results',
      rationale: 'Series packages lock in 4 visits, reducing churn and increasing LTV.',
    });
  }

  // Package 3: "Wellness Starter" - GLP-1 + Injections combo
  const wellness = input.services.filter(s => s.category === 'Wellness').sort((a, b) => b.basePrice - a.basePrice);
  if (wellness.length >= 2) {
    const total = wellness[0].basePrice + wellness[1].basePrice;
    const packagePrice = Math.round(total * 0.88);

    packages.push({
      name: 'Wellness Power Duo',
      services: [
        { service: wellness[0].service, regularPrice: wellness[0].basePrice },
        { service: wellness[1].service, regularPrice: wellness[1].basePrice },
      ],
      totalRegularPrice: total,
      packagePrice,
      savings: total - packagePrice,
      savingsPercent: 12,
      margin: calculatePackageMargin([wellness[0], wellness[1]], packagePrice),
      targetSegment: 'Health-focused clients seeking comprehensive wellness',
      rationale: 'Wellness bundles have highest margins and drive monthly recurring visits.',
    });
  }

  // Package 4: "Bride-to-Be" - Pre-event package
  const laser = input.services.filter(s => s.category === 'Laser' || s.category === 'Hair Removal')
    .sort((a, b) => b.popularity - a.popularity);

  if (facials.length > 0 && laser.length > 0 && peels.length > 0) {
    const selectedServices = [facials[0], peels[0], laser[0]];
    const total = selectedServices.reduce((sum, s) => sum + s.basePrice, 0);
    const packagePrice = Math.round(total * 0.82);

    packages.push({
      name: 'Bride-to-Be Glow Package',
      services: selectedServices.map(s => ({ service: s.service, regularPrice: s.basePrice })),
      totalRegularPrice: total,
      packagePrice,
      savings: total - packagePrice,
      savingsPercent: 18,
      margin: calculatePackageMargin(selectedServices, packagePrice),
      targetSegment: 'Brides & event preparation (wedding season peak)',
      rationale: 'High-ticket event package. Wedding searches spike April-August.',
    });
  }

  return packages;
}

function calculatePackageMargin(services: ServicePricing[], packagePrice: number): number {
  const totalCost = services.reduce((sum, s) => sum + s.cost, 0);
  return Math.round(((packagePrice - totalCost) / packagePrice) * 100);
}

// ── PROMOTIONAL STRATEGIES ──

function generatePromotions(input: PricingInput): PromotionalStrategy[] {
  const promotions: PromotionalStrategy[] = [];
  const lowUtilDays = input.utilization.byDayOfWeek
    .filter(d => d.rate < LOW_DEMAND_THRESHOLD)
    .map(d => d.day);

  const lowUtilSlots = input.utilization.byTimeSlot
    .filter(s => s.rate < LOW_DEMAND_THRESHOLD)
    .map(s => s.slot);

  // Off-peak promotions
  if (lowUtilDays.length > 0) {
    promotions.push({
      type: 'off_peak',
      title: `${lowUtilDays.join(' & ')} Special`,
      description: `10% off all facials on ${lowUtilDays.join(' and ')} to fill empty slots`,
      discount: 10,
      validFor: lowUtilDays.join(', '),
      expectedLift: 25,
      services: input.services.filter(s => s.category === 'Facial').map(s => s.service),
    });
  }

  if (lowUtilSlots.length > 0) {
    promotions.push({
      type: 'off_peak',
      title: 'Early Bird / Late Day Discount',
      description: `15% off treatments during low-demand time slots (${lowUtilSlots.slice(0, 3).join(', ')})`,
      discount: 15,
      validFor: lowUtilSlots.join(', '),
      expectedLift: 20,
      services: input.services.slice(0, 5).map(s => s.service),
    });
  }

  // New client offer
  promotions.push({
    type: 'new_client',
    title: 'First Visit Experience',
    description: 'New clients receive $50 off their first treatment + complimentary skin analysis',
    discount: 0, // flat $ off, not percentage
    validFor: 'New clients only',
    expectedLift: 30,
    services: ['HydraFacial', 'VI Peel', 'Consultation'],
  });

  // Membership upsell
  if (input.memberships.avgMemberSpend > input.memberships.avgNonMemberSpend * 1.3) {
    promotions.push({
      type: 'membership_upsell',
      title: 'Member Conversion Campaign',
      description: `Members spend ${Math.round((input.memberships.avgMemberSpend / input.memberships.avgNonMemberSpend - 1) * 100)}% more. Target top non-member clients with trial membership offer.`,
      discount: 0,
      validFor: 'Non-members with 2+ visits',
      expectedLift: 15,
      services: ['Angel Glow Up Membership'],
    });
  }

  // Seasonal
  const month = input.seasonality?.currentMonth || new Date().getMonth() + 1;
  const season = SEASONAL_MULTIPLIERS[month];
  if (season && season.factor > 1.05) {
    promotions.push({
      type: 'seasonal',
      title: `${season.name} Campaign`,
      description: `Capitalize on ${season.name} demand. Feature laser and body treatments.`,
      discount: 0,
      validFor: `${new Date(2026, month - 1, 1).toLocaleString('default', { month: 'long' })}`,
      expectedLift: Math.round((season.factor - 1) * 200),
      services: input.services
        .filter(s => ['Laser', 'Body', 'Hair Removal'].includes(s.category))
        .map(s => s.service),
    });
  }

  return promotions;
}

// ── INSIGHTS ──

function generateInsights(
  input: PricingInput,
  recommendations: PricingRecommendation[]
): string[] {
  const insights: string[] = [];

  // Revenue per minute analysis
  const revenuePerMinute = input.services
    .map(s => ({ service: s.service, rpm: s.basePrice / s.duration }))
    .sort((a, b) => b.rpm - a.rpm);

  if (revenuePerMinute.length >= 2) {
    const top = revenuePerMinute[0];
    const bottom = revenuePerMinute[revenuePerMinute.length - 1];
    insights.push(
      `Highest revenue/minute: ${top.service} ($${top.rpm.toFixed(0)}/min). Lowest: ${bottom.service} ($${bottom.rpm.toFixed(0)}/min). Push high-RPM services for schedule optimization.`
    );
  }

  // Utilization gap
  if (input.utilization.overall < 70) {
    insights.push(
      `Overall utilization at ${input.utilization.overall}% - ${100 - input.utilization.overall}% of available time is unfilled. Off-peak promotions could recapture $${Math.round(input.services.reduce((s, svc) => s + svc.basePrice * svc.popularity * 0.01, 0) * (80 - input.utilization.overall) / 100)}/month.`
    );
  }

  // Member vs non-member gap
  if (input.memberships.avgMemberSpend > 0) {
    const gap = Math.round(
      ((input.memberships.avgMemberSpend - input.memberships.avgNonMemberSpend) /
        input.memberships.avgNonMemberSpend) * 100
    );
    if (gap > 20) {
      insights.push(
        `Members spend ${gap}% more than non-members ($${input.memberships.avgMemberSpend} vs $${input.memberships.avgNonMemberSpend}). Every membership conversion = ~$${Math.round(input.memberships.avgMemberSpend - input.memberships.avgNonMemberSpend)}/month additional revenue.`
      );
    }
  }

  // Price increase opportunities
  const increaseRecs = recommendations.filter(r => r.priceChange > 0);
  if (increaseRecs.length > 0) {
    const totalImpact = increaseRecs.reduce((sum, r) => sum + r.estimatedRevenueImpact, 0);
    insights.push(
      `${increaseRecs.length} services have room for price increases, projected +$${totalImpact.toLocaleString()}/month if implemented.`
    );
  }

  // Financing opportunity
  const financedTransactions = input.transactions.filter(t => t.hadFinancing);
  const financingRate = input.transactions.length > 0
    ? (financedTransactions.length / input.transactions.length) * 100
    : 0;
  if (financingRate < 15) {
    insights.push(
      `Only ${financingRate.toFixed(0)}% of transactions use financing. Industry average is 20-30%. Proactively offering Cherry financing on $500+ services could increase average ticket by 15-25%.`
    );
  }

  return insights;
}

// ── PRICING HEALTH SCORE ──

function calculatePricingHealth(
  input: PricingInput,
  recommendations: PricingRecommendation[]
): number {
  let score = 100;

  // Deductions for poor utilization
  if (input.utilization.overall < 60) score -= 20;
  else if (input.utilization.overall < 75) score -= 10;

  // Deductions for many needed adjustments
  const significantChanges = recommendations.filter(r => Math.abs(r.priceChange) > 5);
  score -= significantChanges.length * 3;

  // Deductions for low membership penetration
  if (input.memberships.totalMembers < 50) score -= 10;

  // Deductions for high churn
  if (input.memberships.churnRate > 10) score -= 10;

  // Bonus for competitive pricing data available
  if (input.competitorPricing && input.competitorPricing.length > 5) score += 5;

  return Math.max(0, Math.min(100, score));
}
