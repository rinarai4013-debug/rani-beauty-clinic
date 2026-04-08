/**
 * Rani Beauty Clinic - Deep Competitor Monitoring
 *
 * Google Maps tracking, review monitoring, website change detection,
 * social media activity, ad library monitoring, keyword rankings,
 * market share estimation, SWOT analysis, and threat scoring.
 */

import { LOCAL_COMPETITORS, NATIONAL_CHAINS, type LocalCompetitor, type NationalChain } from './market-intelligence';

// ── Google Maps Rating & Review Tracking ──────────────────────

export interface CompetitorReviewSnapshot {
  competitorName: string;
  placeId: string;
  date: string;
  rating: number;
  totalReviews: number;
  ratingChange: number; // vs previous snapshot
  reviewCountChange: number;
  newReviewCount: number;
  avgNewReviewRating: number;
  recentReviews: CompetitorReview[];
}

export interface CompetitorReview {
  competitorName: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  mentionedServices: string[];
  mentionedStaff: string[];
  keyThemes: string[];
}

export interface ReviewTrend {
  competitorName: string;
  period: '7d' | '30d' | '90d';
  avgRating: number;
  reviewCount: number;
  ratingTrend: 'improving' | 'stable' | 'declining';
  velocityPerWeek: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
}

// ── Website Change Detection ──────────────────────────────────

export interface WebsiteChange {
  competitorName: string;
  url: string;
  detectedAt: string;
  changeType: 'new_service' | 'pricing_change' | 'promotion' | 'staff_change' | 'location_change' | 'technology_update' | 'content_update';
  description: string;
  previousValue: string | null;
  newValue: string;
  significance: 'high' | 'medium' | 'low';
  actionRecommended: string | null;
}

export interface CompetitorServiceUpdate {
  competitorName: string;
  serviceName: string;
  changeType: 'added' | 'removed' | 'price_change' | 'name_change';
  oldPrice: number | null;
  newPrice: number | null;
  date: string;
  impact: string;
}

// ── Social Media Activity ─────────────────────────────────────

export interface CompetitorSocialMetrics {
  competitorName: string;
  platform: 'instagram' | 'facebook' | 'tiktok';
  handle: string;
  followerCount: number;
  followerChange7d: number;
  postsLast7d: number;
  postsLast30d: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  topPostThemes: string[];
  postFrequency: number; // posts per week
  lastPostDate: string;
}

export interface SocialComparison {
  rani: CompetitorSocialMetrics;
  competitors: CompetitorSocialMetrics[];
  raniRank: {
    followers: number;
    engagement: number;
    postFrequency: number;
  };
  insights: string[];
}

// ── Competitor Ad Library ─────────────────────────────────────

export interface CompetitorAdActivity {
  competitorName: string;
  platform: 'meta' | 'google';
  activeAdCount: number;
  estimatedMonthlySpend: string;
  adThemes: string[];
  topCreativeTypes: string[];
  callToActions: string[];
  landingPages: string[];
  audienceTargeting: string[];
  newAdsThisWeek: number;
  stoppedAdsThisWeek: number;
  longestRunningAd: {
    headline: string;
    daysRunning: number;
  } | null;
}

// ── Keyword Rankings ──────────────────────────────────────────

export interface KeywordRanking {
  keyword: string;
  searchVolume: number;
  raniRank: number | null;
  competitorRanks: Record<string, number | null>;
  raniChange: number; // position change
  topRanker: string;
  difficulty: 'easy' | 'medium' | 'hard';
  opportunity: boolean;
}

export const TRACKED_KEYWORDS: string[] = [
  'medspa renton',
  'botox renton wa',
  'hydrafacial renton',
  'laser hair removal renton',
  'medical spa near me',
  'medspa bellevue',
  'botox near me renton',
  'microneedling renton',
  'chemical peel renton',
  'sofwave renton',
  'glp-1 weight loss renton',
  'lip filler renton wa',
  'skin tightening renton',
  'vi peel seattle',
  'rf microneedling seattle',
  'best medspa seattle',
  'medspa eastside wa',
  'injectable renton wa',
  'prx-t33 renton',
  'picoway laser renton',
];

// ── Market Share Estimation ───────────────────────────────────

export interface MarketShareEstimate {
  competitorName: string;
  estimatedShare: number; // percentage
  basis: 'review_velocity' | 'review_count' | 'blended';
  reviewVelocity30d: number;
  totalReviews: number;
  trend: 'growing' | 'stable' | 'shrinking';
  trendBasis: string;
}

// ── SWOT Analysis ─────────────────────────────────────────────

export interface CompetitorSWOT {
  competitorName: string;
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  overallThreatLevel: number; // 0-100
  lastUpdated: string;
}

export interface SWOTItem {
  category: string;
  description: string;
  evidence: string;
  impact: 'high' | 'medium' | 'low';
}

// ── Competitive Threat Scoring ────────────────────────────────

export interface CompetitorThreatScore {
  competitorName: string;
  type: 'local' | 'national';
  overallScore: number; // 0-100, higher = more threatening
  components: {
    proximity: number; // 0-100 based on distance
    reviewStrength: number; // rating * log(reviews)
    priceCompetitiveness: number;
    serviceOverlap: number; // % of services that overlap with Rani
    growthRate: number; // review velocity trend
    adAggression: number; // ad spend/activity level
    socialPresence: number;
  };
  rank: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  watchLevel: 'critical' | 'watch' | 'monitor' | 'low';
  summary: string;
}

// ── Aggregated Competitor Intelligence ────────────────────────

export interface CompetitorIntelligence {
  generatedAt: string;
  reviewSnapshots: CompetitorReviewSnapshot[];
  reviewTrends: ReviewTrend[];
  websiteChanges: WebsiteChange[];
  serviceUpdates: CompetitorServiceUpdate[];
  socialMetrics: CompetitorSocialMetrics[];
  socialComparison: SocialComparison | null;
  adActivity: CompetitorAdActivity[];
  keywordRankings: KeywordRanking[];
  marketShare: MarketShareEstimate[];
  swotAnalyses: CompetitorSWOT[];
  threatScores: CompetitorThreatScore[];
  topThreats: CompetitorThreatScore[];
  actionItems: CompetitorActionItem[];
}

export interface CompetitorActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  competitor: string;
  action: string;
  reason: string;
  category: 'reviews' | 'pricing' | 'services' | 'marketing' | 'seo' | 'social';
}

// ── Core Functions ────────────────────────────────────────────

/**
 * Calculate Rani's services for overlap comparison
 */
const RANI_SERVICES = [
  'HydraFacial', 'Botox', 'Fillers', 'VI Peel', 'PRX-T33',
  'RF Microneedling', 'Laser Hair Removal', 'Sofwave',
  'PicoWay Laser', 'GLP-1 Weight Loss', 'Wellness Injections',
  'Rx Skincare', 'Folix Hair Restoration',
];

const RANI_LOCATION = { lat: 47.4860, lng: -122.1958 }; // 401 Olympia Ave NE, Renton

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate service overlap between Rani and a competitor
 */
export function calculateServiceOverlap(competitorCategories: string[]): number {
  const raniCategoriesLower = RANI_SERVICES.map(s => s.toLowerCase());
  const competitorLower = competitorCategories.map(s => s.toLowerCase());

  // Map competitor categories to service overlap
  const overlapMap: Record<string, string[]> = {
    'medspa': ['hydrafacial', 'botox', 'fillers'],
    'injectable': ['botox', 'fillers'],
    'laser': ['laser hair removal', 'picoway laser'],
    'facial': ['hydrafacial'],
    'skincare': ['rx skincare', 'vi peel'],
    'body': ['glp-1 weight loss'],
    'wellness': ['wellness injections'],
    'dermatology': ['hydrafacial', 'vi peel', 'rf microneedling'],
    'surgical': [],
  };

  const overlappingServices = new Set<string>();
  for (const cat of competitorLower) {
    const mapped = overlapMap[cat] || [];
    for (const service of mapped) {
      if (raniCategoriesLower.some(r => r.toLowerCase().includes(service) || service.includes(r.toLowerCase()))) {
        overlappingServices.add(service);
      }
    }
  }

  return RANI_SERVICES.length > 0
    ? Math.round((overlappingServices.size / RANI_SERVICES.length) * 100)
    : 0;
}

/**
 * Calculate competitive threat score for a local competitor
 */
export function calculateThreatScore(
  competitor: LocalCompetitor,
  raniMetrics: { rating: number; reviewCount: number; reviewVelocity30d: number },
  additionalData?: {
    adActivity?: CompetitorAdActivity;
    socialMetrics?: CompetitorSocialMetrics;
    reviewVelocity30d?: number;
  }
): CompetitorThreatScore {
  const distance = calculateDistance(
    RANI_LOCATION.lat, RANI_LOCATION.lng,
    competitor.location.lat, competitor.location.lng
  );

  // Proximity score: closer = more threatening (max 15 miles)
  const proximity = Math.max(0, Math.round((1 - distance / 15) * 100));

  // Review strength: rating * log(reviews)
  const competitorStrength = competitor.googleRating * Math.log10(Math.max(1, competitor.reviewCount));
  const raniStrength = raniMetrics.rating * Math.log10(Math.max(1, raniMetrics.reviewCount));
  const reviewStrength = raniStrength > 0
    ? Math.round((competitorStrength / raniStrength) * 50)
    : 50;

  // Price competitiveness: lower price level = more competitive pressure
  const priceCompetitiveness = Math.round((5 - competitor.priceLevel) / 4 * 100);

  // Service overlap
  const serviceOverlap = calculateServiceOverlap(competitor.categories);

  // Growth rate (review velocity as proxy)
  const compVelocity = additionalData?.reviewVelocity30d ?? 0;
  const growthRate = raniMetrics.reviewVelocity30d > 0
    ? Math.round((compVelocity / raniMetrics.reviewVelocity30d) * 50)
    : 25;

  // Ad aggression
  const adAggression = additionalData?.adActivity
    ? Math.min(100, additionalData.adActivity.activeAdCount * 10 + additionalData.adActivity.newAdsThisWeek * 20)
    : 0;

  // Social presence
  const socialPresence = additionalData?.socialMetrics
    ? Math.min(100, Math.round(additionalData.socialMetrics.engagementRate * 1000 + additionalData.socialMetrics.followerCount / 100))
    : 0;

  const components = {
    proximity,
    reviewStrength: Math.min(100, reviewStrength),
    priceCompetitiveness,
    serviceOverlap,
    growthRate: Math.min(100, growthRate),
    adAggression,
    socialPresence,
  };

  // Weighted overall score
  const weights = {
    proximity: 0.20,
    reviewStrength: 0.25,
    priceCompetitiveness: 0.10,
    serviceOverlap: 0.15,
    growthRate: 0.15,
    adAggression: 0.08,
    socialPresence: 0.07,
  };

  const overallScore = Math.round(
    components.proximity * weights.proximity +
    components.reviewStrength * weights.reviewStrength +
    components.priceCompetitiveness * weights.priceCompetitiveness +
    components.serviceOverlap * weights.serviceOverlap +
    components.growthRate * weights.growthRate +
    components.adAggression * weights.adAggression +
    components.socialPresence * weights.socialPresence
  );

  let watchLevel: CompetitorThreatScore['watchLevel'] = 'low';
  if (overallScore >= 70) watchLevel = 'critical';
  else if (overallScore >= 50) watchLevel = 'watch';
  else if (overallScore >= 30) watchLevel = 'monitor';

  const summary = buildThreatSummary(competitor.name, components, overallScore, distance);

  return {
    competitorName: competitor.name,
    type: 'local',
    overallScore,
    components,
    rank: 0, // set after sorting
    trend: 'stable',
    watchLevel,
    summary,
  };
}

function buildThreatSummary(
  name: string,
  components: CompetitorThreatScore['components'],
  score: number,
  distance: number
): string {
  const parts: string[] = [];

  if (components.proximity >= 70) parts.push(`very close (${distance} mi)`);
  if (components.reviewStrength >= 60) parts.push('strong reviews');
  if (components.serviceOverlap >= 50) parts.push('high service overlap');
  if (components.growthRate >= 60) parts.push('growing fast');
  if (components.adAggression >= 50) parts.push('aggressive advertising');

  if (parts.length === 0) parts.push('lower priority competitor');

  return `${name} (score: ${score}/100): ${parts.join(', ')}`;
}

/**
 * Generate SWOT analysis for a competitor
 */
export function generateSWOT(
  competitor: LocalCompetitor,
  raniMetrics: { rating: number; reviewCount: number },
  additionalData?: {
    reviewTrend?: ReviewTrend;
    websiteChanges?: WebsiteChange[];
    socialMetrics?: CompetitorSocialMetrics;
  }
): CompetitorSWOT {
  const strengths: SWOTItem[] = [];
  const weaknesses: SWOTItem[] = [];
  const opportunities: SWOTItem[] = [];
  const threats: SWOTItem[] = [];

  // Strengths
  if (competitor.googleRating >= 4.8) {
    strengths.push({
      category: 'reputation',
      description: 'Premium Google rating',
      evidence: `${competitor.googleRating} stars`,
      impact: 'high',
    });
  }
  if (competitor.reviewCount > 300) {
    strengths.push({
      category: 'reputation',
      description: 'Large review base (social proof)',
      evidence: `${competitor.reviewCount} reviews`,
      impact: 'medium',
    });
  }
  if (competitor.priceLevel >= 4) {
    strengths.push({
      category: 'positioning',
      description: 'Premium positioning',
      evidence: `Price level: ${competitor.priceLevel}/4`,
      impact: 'medium',
    });
  }
  if (competitor.categories.length >= 4) {
    strengths.push({
      category: 'services',
      description: 'Broad service offering',
      evidence: `${competitor.categories.length} service categories`,
      impact: 'medium',
    });
  }

  // Weaknesses
  if (competitor.googleRating < 4.5) {
    weaknesses.push({
      category: 'reputation',
      description: 'Below-average rating',
      evidence: `${competitor.googleRating} stars (industry avg ~4.6)`,
      impact: 'high',
    });
  }
  if (competitor.reviewCount < 100) {
    weaknesses.push({
      category: 'reputation',
      description: 'Limited review volume',
      evidence: `Only ${competitor.reviewCount} reviews`,
      impact: 'medium',
    });
  }
  if (competitor.priceLevel <= 2) {
    weaknesses.push({
      category: 'positioning',
      description: 'Budget positioning may limit premium clients',
      evidence: `Price level: ${competitor.priceLevel}/4`,
      impact: 'low',
    });
  }

  // Opportunities (for Rani against this competitor)
  if (competitor.googleRating < raniMetrics.rating) {
    opportunities.push({
      category: 'reviews',
      description: `Rani has higher rating (${raniMetrics.rating} vs ${competitor.googleRating})`,
      evidence: 'Rating advantage in local search',
      impact: 'high',
    });
  }
  if (competitor.categories.length < 3) {
    opportunities.push({
      category: 'services',
      description: 'Competitor has narrow service offering',
      evidence: `Only ${competitor.categories.length} categories vs Rani's 10+`,
      impact: 'medium',
    });
  }

  // Threats (from this competitor to Rani)
  if (competitor.reviewCount > raniMetrics.reviewCount * 2) {
    threats.push({
      category: 'reputation',
      description: 'Significantly more reviews than Rani',
      evidence: `${competitor.reviewCount} vs Rani's ${raniMetrics.reviewCount}`,
      impact: 'high',
    });
  }
  if (additionalData?.reviewTrend?.ratingTrend === 'improving') {
    threats.push({
      category: 'momentum',
      description: 'Competitor rating is improving',
      evidence: `Trend: ${additionalData.reviewTrend.ratingTrend}`,
      impact: 'medium',
    });
  }

  const overallThreatLevel = calculateSWOTThreatLevel(strengths, threats, weaknesses, opportunities);

  return {
    competitorName: competitor.name,
    strengths,
    weaknesses,
    opportunities,
    threats,
    overallThreatLevel,
    lastUpdated: new Date().toISOString(),
  };
}

function calculateSWOTThreatLevel(
  strengths: SWOTItem[],
  threats: SWOTItem[],
  weaknesses: SWOTItem[],
  opportunities: SWOTItem[]
): number {
  const impactScore = (items: SWOTItem[]) =>
    items.reduce((s, i) => s + (i.impact === 'high' ? 3 : i.impact === 'medium' ? 2 : 1), 0);

  const threatScore = impactScore(strengths) + impactScore(threats);
  const opportunityScore = impactScore(weaknesses) + impactScore(opportunities);

  const total = threatScore + opportunityScore;
  if (total === 0) return 30;

  return Math.round((threatScore / total) * 100);
}

/**
 * Estimate market share based on review velocity as a proxy
 */
export function estimateMarketShare(
  raniVelocity: number,
  competitors: Array<{ name: string; velocity: number; totalReviews: number }>
): MarketShareEstimate[] {
  const all = [
    { name: 'Rani Beauty Clinic', velocity: raniVelocity, totalReviews: 129 },
    ...competitors,
  ];

  const totalVelocity = all.reduce((s, c) => s + c.velocity, 0);
  const totalReviews = all.reduce((s, c) => s + c.totalReviews, 0);

  return all.map(c => {
    const velocityShare = totalVelocity > 0 ? (c.velocity / totalVelocity) * 100 : 0;
    const reviewShare = totalReviews > 0 ? (c.totalReviews / totalReviews) * 100 : 0;
    const blendedShare = velocityShare * 0.6 + reviewShare * 0.4; // weight velocity more

    let trend: MarketShareEstimate['trend'] = 'stable';
    if (velocityShare > reviewShare * 1.2) trend = 'growing';
    else if (velocityShare < reviewShare * 0.8) trend = 'shrinking';

    return {
      competitorName: c.name,
      estimatedShare: round(blendedShare),
      basis: 'blended' as const,
      reviewVelocity30d: c.velocity,
      totalReviews: c.totalReviews,
      trend,
      trendBasis: `Velocity share (${round(velocityShare)}%) vs review share (${round(reviewShare)}%)`,
    };
  }).sort((a, b) => b.estimatedShare - a.estimatedShare);
}

/**
 * Analyze review sentiment from text
 */
export function analyzeReviewSentiment(reviewText: string): {
  sentiment: 'positive' | 'neutral' | 'negative';
  mentionedServices: string[];
  keyThemes: string[];
} {
  const text = reviewText.toLowerCase();

  // Sentiment scoring
  const positiveWords = ['amazing', 'excellent', 'love', 'great', 'wonderful', 'fantastic', 'best',
    'professional', 'recommend', 'beautiful', 'perfect', 'friendly', 'gentle', 'comfortable',
    'clean', 'results', 'natural', 'happy', 'satisfied', 'impressed', 'skilled', 'expert'];
  const negativeWords = ['terrible', 'awful', 'worst', 'rude', 'unprofessional', 'overpriced',
    'painful', 'disappointed', 'waste', 'poor', 'bad', 'horrible', 'never', 'complaint',
    'wait', 'long wait', 'rushed', 'pushy', 'upsell'];

  let score = 0;
  for (const word of positiveWords) {
    if (text.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (text.includes(word)) score--;
  }

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score >= 2) sentiment = 'positive';
  else if (score <= -1) sentiment = 'negative';

  // Service detection
  const serviceKeywords: Record<string, string> = {
    'botox': 'Botox', 'filler': 'Fillers', 'hydrafacial': 'HydraFacial',
    'laser': 'Laser', 'peel': 'Chemical Peel', 'microneedling': 'Microneedling',
    'facial': 'Facial', 'injectable': 'Injectables', 'lip': 'Lip Filler',
    'skin tightening': 'Skin Tightening', 'coolsculpting': 'CoolSculpting',
    'tattoo removal': 'Tattoo Removal', 'weight loss': 'Weight Loss',
  };

  const mentionedServices: string[] = [];
  for (const [keyword, service] of Object.entries(serviceKeywords)) {
    if (text.includes(keyword)) mentionedServices.push(service);
  }

  // Theme detection
  const themeKeywords: Record<string, string> = {
    'price': 'pricing', 'cost': 'pricing', 'expensive': 'pricing', 'affordable': 'pricing',
    'staff': 'staff quality', 'doctor': 'provider quality', 'nurse': 'provider quality',
    'clean': 'cleanliness', 'sterile': 'cleanliness',
    'wait': 'wait times', 'appointment': 'scheduling',
    'result': 'results quality', 'before and after': 'results quality',
    'atmosphere': 'ambiance', 'relax': 'ambiance', 'comfortable': 'ambiance',
    'parking': 'accessibility', 'location': 'accessibility',
  };

  const keyThemes = new Set<string>();
  for (const [keyword, theme] of Object.entries(themeKeywords)) {
    if (text.includes(keyword)) keyThemes.add(theme);
  }

  return {
    sentiment,
    mentionedServices,
    keyThemes: Array.from(keyThemes),
  };
}

/**
 * Generate competitor action items
 */
export function generateCompetitorActionItems(
  threatScores: CompetitorThreatScore[],
  reviewSnapshots: CompetitorReviewSnapshot[],
  websiteChanges: WebsiteChange[],
  keywordRankings: KeywordRanking[]
): CompetitorActionItem[] {
  const items: CompetitorActionItem[] = [];

  // Critical threats
  const criticalThreats = threatScores.filter(t => t.watchLevel === 'critical');
  for (const threat of criticalThreats) {
    items.push({
      priority: 'critical',
      competitor: threat.competitorName,
      action: `Monitor ${threat.competitorName} closely this week`,
      reason: threat.summary,
      category: 'marketing',
    });
  }

  // Competitors gaining reviews faster
  for (const snapshot of reviewSnapshots) {
    if (snapshot.newReviewCount >= 5) {
      items.push({
        priority: 'high',
        competitor: snapshot.competitorName,
        action: `${snapshot.competitorName} got ${snapshot.newReviewCount} new reviews recently - increase review request efforts`,
        reason: `Their review velocity is outpacing yours. Reviews directly impact local SEO rankings.`,
        category: 'reviews',
      });
    }
  }

  // Website changes requiring response
  const significantChanges = websiteChanges.filter(c => c.significance === 'high');
  for (const change of significantChanges) {
    items.push({
      priority: 'high',
      competitor: change.competitorName,
      action: change.actionRecommended || `Review and respond to ${change.competitorName}'s ${change.changeType}`,
      reason: change.description,
      category: change.changeType === 'pricing_change' ? 'pricing' : 'services',
    });
  }

  // Keyword opportunities
  const keywordOpportunities = keywordRankings.filter(k => k.opportunity && k.raniRank === null);
  if (keywordOpportunities.length > 0) {
    items.push({
      priority: 'medium',
      competitor: keywordOpportunities[0].topRanker,
      action: `Target ${keywordOpportunities.length} unranked keywords where competitors rank`,
      reason: `Missing search traffic for high-intent keywords like "${keywordOpportunities[0].keyword}"`,
      category: 'seo',
    });
  }

  return items.sort((a, b) => {
    const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

/**
 * Generate complete competitor intelligence report
 */
export async function generateCompetitorIntelligence(options: {
  raniMetrics?: { rating: number; reviewCount: number; reviewVelocity30d: number };
  previousSnapshots?: CompetitorReviewSnapshot[];
} = {}): Promise<CompetitorIntelligence> {
  const raniMetrics = options.raniMetrics || {
    rating: 4.9,
    reviewCount: 129,
    reviewVelocity30d: 8,
  };

  // Calculate threat scores for all local competitors
  const threatScores = LOCAL_COMPETITORS.map(c =>
    calculateThreatScore(c, raniMetrics)
  ).sort((a, b) => b.overallScore - a.overallScore);

  // Assign ranks
  threatScores.forEach((t, i) => { t.rank = i + 1; });

  // Generate SWOT analyses for top 5 threats
  const swotAnalyses = LOCAL_COMPETITORS.slice(0, 5).map(c =>
    generateSWOT(c, raniMetrics)
  );

  // Estimate market share
  const competitorVelocities = LOCAL_COMPETITORS.map(c => ({
    name: c.name,
    velocity: Math.round(c.reviewCount / 12), // rough monthly estimate
    totalReviews: c.reviewCount,
  }));
  const marketShare = estimateMarketShare(raniMetrics.reviewVelocity30d, competitorVelocities);

  // Top threats
  const topThreats = threatScores.slice(0, 3);

  // Generate action items
  const actionItems = generateCompetitorActionItems(
    threatScores,
    [], // review snapshots would come from stored data
    [],
    TRACKED_KEYWORDS.map(k => ({
      keyword: k,
      searchVolume: 100,
      raniRank: null,
      competitorRanks: {},
      raniChange: 0,
      topRanker: 'Unknown',
      difficulty: 'medium' as const,
      opportunity: true,
    }))
  );

  return {
    generatedAt: new Date().toISOString(),
    reviewSnapshots: [],
    reviewTrends: [],
    websiteChanges: [],
    serviceUpdates: [],
    socialMetrics: [],
    socialComparison: null,
    adActivity: [],
    keywordRankings: [],
    marketShare,
    swotAnalyses,
    threatScores,
    topThreats,
    actionItems,
  };
}

// ── Utility ───────────────────────────────────────────────────

function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// Re-export for convenience
export { LOCAL_COMPETITORS, NATIONAL_CHAINS };
export type { LocalCompetitor, NationalChain };
