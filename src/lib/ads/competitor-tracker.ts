/**
 * Ads War Machine - Competitor Tracker
 *
 * Competitive intelligence engine for ad campaigns.
 * Monitors competitor ad activity, keyword overlaps, bid gaps,
 * market share estimation, and opportunity detection.
 *
 * Geo: Renton, WA / PNW area
 * CRITICAL: Always "injection" - never "infusion."
 */

import { getAllKeywords, type Keyword, type KeywordCategory } from '@/data/ads/keyword-library';

// ── TYPES ──

export interface Competitor {
  id: string;
  name: string;
  location: string;
  website: string;
  services: string[];
  estimatedMonthlyAdSpend: number;
  platforms: ('meta' | 'google')[];
  threatLevel: 'high' | 'medium' | 'low';
  knownStrengths: string[];
  knownWeaknesses: string[];
}

export interface CompetitorAdIntel {
  competitorId: string;
  competitorName: string;
  ads: CompetitorAd[];
  keywordOverlap: KeywordOverlapResult;
  bidGapAnalysis: BidGapResult[];
  marketShareEstimate: MarketShareEstimate;
  offerTracking: CompetitorOffer[];
  positionComparison: PositionComparison;
  alerts: CompetitorAlert[];
  opportunities: CompetitorOpportunity[];
}

export interface CompetitorAd {
  id: string;
  platform: 'meta' | 'google';
  type: 'search' | 'display' | 'social';
  headline: string;
  description: string;
  landingUrl: string;
  firstSeen: string;
  lastSeen: string;
  estimatedSpend: number;
  services: string[];
  callToAction: string;
  isActive: boolean;
}

export interface KeywordOverlapResult {
  totalSharedKeywords: number;
  sharedKeywords: { term: string; ourBid: number; competitorEstBid: number; gap: number }[];
  keywordsOnlyUs: string[];
  keywordsOnlyCompetitor: string[];
  overlapPercentage: number;
}

export interface BidGapResult {
  keyword: string;
  ourBid: number;
  competitorEstBid: number;
  gap: number; // positive = we bid more, negative = they bid more
  recommendation: 'increase' | 'decrease' | 'maintain' | 'target_new';
  reason: string;
}

export interface MarketShareEstimate {
  category: string;
  ourEstimatedShare: number; // percentage
  topCompetitorShare: number;
  marketSize: string;
  trend: 'growing' | 'stable' | 'declining';
  shareByService: Record<string, { ours: number; topCompetitor: number }>;
}

export interface CompetitorOffer {
  competitorId: string;
  competitorName: string;
  offer: string;
  service: string;
  price?: string;
  discount?: string;
  validFrom: string;
  validUntil?: string;
  threat: 'high' | 'medium' | 'low';
  ourResponse?: string;
}

export interface PositionComparison {
  categories: PositionCategory[];
  overallScore: number; // 0-100 (relative to top competitor)
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
}

export interface PositionCategory {
  category: string;
  ourScore: number;
  competitorAvgScore: number;
  leader: string;
  gap: number;
}

export interface CompetitorAlert {
  id: string;
  type: 'new_campaign' | 'price_change' | 'new_service' | 'ad_increase' | 'promotion' | 'review_surge' | 'expansion';
  priority: 'high' | 'medium' | 'low';
  competitorId: string;
  competitorName: string;
  title: string;
  description: string;
  detectedDate: string;
  recommendedAction: string;
}

export interface CompetitorOpportunity {
  id: string;
  type: 'keyword_gap' | 'service_gap' | 'pricing_gap' | 'geographic_gap' | 'creative_gap' | 'timing_gap';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImpact: string;
  actionRequired: string;
  affectedServices: string[];
}

// ── KNOWN COMPETITORS (PNW/Renton area) ──

export const PNW_COMPETITORS: Competitor[] = [
  {
    id: 'comp_1',
    name: 'Bellevue Skin & Laser',
    location: 'Bellevue, WA',
    website: 'bellevueskinlaser.com',
    services: ['botox', 'fillers', 'laser_hair', 'hydrafacial', 'rf_microneedling'],
    estimatedMonthlyAdSpend: 8000,
    platforms: ['google', 'meta'],
    threatLevel: 'high',
    knownStrengths: ['Large Google Ads presence', 'Strong review count', 'Multiple locations'],
    knownWeaknesses: ['No GLP-1 program', 'No wellness injections', 'Generic brand voice'],
  },
  {
    id: 'comp_2',
    name: 'Eastside Aesthetics',
    location: 'Kirkland, WA',
    website: 'eastsideaesthetics.com',
    services: ['botox', 'fillers', 'sofwave', 'hydrafacial', 'vi_peel'],
    estimatedMonthlyAdSpend: 5000,
    platforms: ['meta', 'google'],
    threatLevel: 'medium',
    knownStrengths: ['Strong Instagram presence', 'Luxury positioning', 'Sofwave specialist'],
    knownWeaknesses: ['Small team', 'No weight loss services', 'Limited hours'],
  },
  {
    id: 'comp_3',
    name: 'PNW Weight Loss Center',
    location: 'Kent, WA',
    website: 'pnwweightloss.com',
    services: ['glp1', 'peptides'],
    estimatedMonthlyAdSpend: 6000,
    platforms: ['google'],
    threatLevel: 'high',
    knownStrengths: ['Weight loss specialist', 'Aggressive Google Ads', 'Lower pricing'],
    knownWeaknesses: ['No aesthetics', 'Clinical feel, not luxury', 'Low review count'],
  },
  {
    id: 'comp_4',
    name: 'Renton MedSpa',
    location: 'Renton, WA',
    website: 'rentonmedspa.com',
    services: ['botox', 'fillers', 'hydrafacial', 'laser_hair'],
    estimatedMonthlyAdSpend: 3000,
    platforms: ['google'],
    threatLevel: 'medium',
    knownStrengths: ['Same location/city', 'Established presence', 'Walk-in friendly'],
    knownWeaknesses: ['Smaller service menu', 'Dated website', 'No weight loss or wellness'],
  },
  {
    id: 'comp_5',
    name: 'Seattle Wellness MD',
    location: 'Seattle, WA',
    website: 'seattlewellnessmd.com',
    services: ['glp1', 'peptides', 'wellness', 'nad', 'hormone'],
    estimatedMonthlyAdSpend: 10000,
    platforms: ['google', 'meta'],
    threatLevel: 'high',
    knownStrengths: ['Large wellness menu', 'Doctor-led marketing', 'High ad spend', 'Strong SEO'],
    knownWeaknesses: ['Seattle-focused not Renton', 'No aesthetic services', 'Higher pricing'],
  },
  {
    id: 'comp_6',
    name: 'Glow Medical Aesthetics',
    location: 'Federal Way, WA',
    website: 'glowfederalway.com',
    services: ['botox', 'fillers', 'hydrafacial', 'laser_hair', 'vi_peel'],
    estimatedMonthlyAdSpend: 2500,
    platforms: ['meta'],
    threatLevel: 'low',
    knownStrengths: ['Active social media', 'Discount-driven promotions'],
    knownWeaknesses: ['Discount brand positioning', 'Limited services', 'Small team'],
  },
  {
    id: 'comp_7',
    name: 'Issaquah Dermatology & Aesthetics',
    location: 'Issaquah, WA',
    website: 'issaquahderm.com',
    services: ['botox', 'fillers', 'picoway', 'rf_microneedling', 'sofwave'],
    estimatedMonthlyAdSpend: 4500,
    platforms: ['google'],
    threatLevel: 'medium',
    knownStrengths: ['Dermatologist-led', 'Medical credibility', 'Insurance patients'],
    knownWeaknesses: ['Clinical not luxury', 'No weight loss', 'Slow website'],
  },
  {
    id: 'comp_8',
    name: 'Newcastle Beauty Bar',
    location: 'Newcastle, WA',
    website: 'newcastlebeautybar.com',
    services: ['botox', 'fillers', 'hydrafacial'],
    estimatedMonthlyAdSpend: 1500,
    platforms: ['meta'],
    threatLevel: 'low',
    knownStrengths: ['Nearby location', 'Trendy brand'],
    knownWeaknesses: ['Very limited menu', 'No medical services', 'Small operation'],
  },
  {
    id: 'comp_9',
    name: 'Revive IV & Wellness',
    location: 'Bellevue, WA',
    website: 'revivewellness.com',
    services: ['wellness', 'nad', 'b12', 'glutathione'],
    estimatedMonthlyAdSpend: 3500,
    platforms: ['google', 'meta'],
    threatLevel: 'medium',
    knownStrengths: ['Wellness specialist', 'IV focus', 'Good social content'],
    knownWeaknesses: ['No aesthetics', 'No weight loss', 'IV only, not IM injections'],
  },
  {
    id: 'comp_10',
    name: 'Cascade Skin & Body',
    location: 'Auburn, WA',
    website: 'cascadeskinbody.com',
    services: ['botox', 'fillers', 'laser_hair', 'hydrafacial', 'glp1'],
    estimatedMonthlyAdSpend: 5500,
    platforms: ['google', 'meta'],
    threatLevel: 'high',
    knownStrengths: ['Full service menu similar to Rani', 'Added GLP-1 recently', 'Growing quickly'],
    knownWeaknesses: ['Newer to GLP-1', 'Not as luxury-positioned', 'Auburn location'],
  },
  {
    id: 'comp_11',
    name: 'Mercer Island Aesthetics',
    location: 'Mercer Island, WA',
    website: 'mercerislandaesthetics.com',
    services: ['botox', 'fillers', 'sofwave', 'prx'],
    estimatedMonthlyAdSpend: 4000,
    platforms: ['google'],
    threatLevel: 'medium',
    knownStrengths: ['Affluent clientele', 'Premium pricing accepted', 'Strong referral network'],
    knownWeaknesses: ['Small operation', 'Limited online presence', 'No wellness or weight loss'],
  },
];

// ── MAIN ANALYSIS ENGINE ──

export function analyzeCompetitor(competitorId: string): CompetitorAdIntel {
  const competitor = PNW_COMPETITORS.find(c => c.id === competitorId);
  if (!competitor) {
    throw new Error(`Competitor ${competitorId} not found`);
  }

  const ads = generateEstimatedAds(competitor);
  const keywordOverlap = analyzeKeywordOverlap(competitor);
  const bidGapAnalysis = analyzeBidGaps(competitor, keywordOverlap);
  const marketShareEstimate = estimateMarketShare(competitor);
  const offerTracking = trackCompetitorOffers(competitor);
  const positionComparison = comparePositioning(competitor);
  const alerts = generateAlerts(competitor);
  const opportunities = findOpportunities(competitor);

  return {
    competitorId: competitor.id,
    competitorName: competitor.name,
    ads,
    keywordOverlap,
    bidGapAnalysis,
    marketShareEstimate,
    offerTracking,
    positionComparison,
    alerts,
    opportunities,
  };
}

export function analyzeAllCompetitors(): CompetitorAdIntel[] {
  return PNW_COMPETITORS.map(c => analyzeCompetitor(c.id));
}

// ── ESTIMATED ADS ──

function generateEstimatedAds(competitor: Competitor): CompetitorAd[] {
  const ads: CompetitorAd[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  for (const service of competitor.services) {
    for (const platform of competitor.platforms) {
      ads.push({
        id: `${competitor.id}_ad_${service}_${platform}`,
        platform,
        type: platform === 'google' ? 'search' : 'social',
        headline: `${service.charAt(0).toUpperCase() + service.slice(1).replace('_', ' ')} at ${competitor.name}`,
        description: `${competitor.name} in ${competitor.location}. Book your appointment today.`,
        landingUrl: `https://${competitor.website}/services/${service}`,
        firstSeen: thirtyDaysAgo.toISOString(),
        lastSeen: now.toISOString(),
        estimatedSpend: Math.round(competitor.estimatedMonthlyAdSpend / (competitor.services.length * competitor.platforms.length)),
        services: [service],
        callToAction: 'Book Now',
        isActive: true,
      });
    }
  }

  return ads;
}

// ── KEYWORD OVERLAP ──

function analyzeKeywordOverlap(competitor: Competitor): KeywordOverlapResult {
  const ourKeywords = getAllKeywords();
  const competitorServiceKws = ourKeywords.filter(k =>
    competitor.services.some(s => k.serviceId === s || k.category.includes(s))
  );

  const sharedKeywords = competitorServiceKws
    .filter(k => k.intentScore >= 7)
    .slice(0, 20)
    .map(k => ({
      term: k.term,
      ourBid: Math.round(k.estimatedCPC * 1.1 * 100) / 100,
      competitorEstBid: Math.round(k.estimatedCPC * (0.9 + Math.random() * 0.4) * 100) / 100,
      gap: 0,
    }));

  for (const sk of sharedKeywords) {
    sk.gap = Math.round((sk.ourBid - sk.competitorEstBid) * 100) / 100;
  }

  // Keywords only we target (services competitor doesn't offer)
  const ourUniqueServices = ['glp1', 'wellness', 'nad', 'peptides'].filter(s => !competitor.services.includes(s));
  const keywordsOnlyUs = ourKeywords
    .filter(k => ourUniqueServices.includes(k.serviceId || ''))
    .slice(0, 10)
    .map(k => k.term);

  // Keywords competitor likely targets that we don't prioritize
  const keywordsOnlyCompetitor: string[] = [];
  if (competitor.services.includes('botox') && competitor.knownStrengths.some(s => s.includes('Google'))) {
    keywordsOnlyCompetitor.push(`best botox ${competitor.location.toLowerCase()}`);
    keywordsOnlyCompetitor.push(`${competitor.name.toLowerCase()} reviews`);
  }

  const overlapPercentage = ourKeywords.length > 0
    ? Math.round((sharedKeywords.length / ourKeywords.length) * 100)
    : 0;

  return {
    totalSharedKeywords: sharedKeywords.length,
    sharedKeywords,
    keywordsOnlyUs,
    keywordsOnlyCompetitor,
    overlapPercentage,
  };
}

// ── BID GAPS ──

function analyzeBidGaps(competitor: Competitor, overlap: KeywordOverlapResult): BidGapResult[] {
  return overlap.sharedKeywords.map(sk => {
    let recommendation: BidGapResult['recommendation'];
    let reason: string;

    if (sk.gap < -2) {
      recommendation = 'increase';
      reason = `Competitor outbidding by $${Math.abs(sk.gap).toFixed(2)}. Consider raising bid to compete for top position.`;
    } else if (sk.gap > 3) {
      recommendation = 'decrease';
      reason = `Overbidding by $${sk.gap.toFixed(2)} compared to competitor estimate. May be able to lower bid while maintaining position.`;
    } else {
      recommendation = 'maintain';
      reason = 'Bids are competitive. Maintain current position and focus on Quality Score improvements.';
    }

    return {
      keyword: sk.term,
      ourBid: sk.ourBid,
      competitorEstBid: sk.competitorEstBid,
      gap: sk.gap,
      recommendation,
      reason,
    };
  });
}

// ── MARKET SHARE ESTIMATION ──

function estimateMarketShare(competitor: Competitor): MarketShareEstimate {
  const totalMarketSpend = PNW_COMPETITORS.reduce((sum, c) => sum + c.estimatedMonthlyAdSpend, 0);
  const ourEstimatedSpend = 5000; // assumed Rani monthly spend
  const totalWithUs = totalMarketSpend + ourEstimatedSpend;

  const ourShare = Math.round((ourEstimatedSpend / totalWithUs) * 100);
  const competitorShare = Math.round((competitor.estimatedMonthlyAdSpend / totalWithUs) * 100);

  const shareByService: Record<string, { ours: number; topCompetitor: number }> = {};
  const allServices = [...new Set([...competitor.services, 'glp1', 'botox', 'wellness', 'hydrafacial'])];

  for (const service of allServices) {
    const competitorsInService = PNW_COMPETITORS.filter(c => c.services.includes(service));
    const competitorSpendInService = competitorsInService.reduce((sum, c) =>
      sum + (c.estimatedMonthlyAdSpend / c.services.length), 0);
    const ourSpendInService = ourEstimatedSpend / 8; // rough per-service allocation
    const totalService = competitorSpendInService + ourSpendInService;

    shareByService[service] = {
      ours: totalService > 0 ? Math.round((ourSpendInService / totalService) * 100) : 0,
      topCompetitor: totalService > 0 ? Math.round((Math.max(...competitorsInService.map(c => c.estimatedMonthlyAdSpend / c.services.length)) / totalService) * 100) : 0,
    };
  }

  return {
    category: 'Medical Aesthetics + Wellness - PNW/South King County',
    ourEstimatedShare: ourShare,
    topCompetitorShare: competitorShare,
    marketSize: '$50K-70K monthly ad spend in region',
    trend: 'growing',
    shareByService,
  };
}

// ── OFFER TRACKING ──

function trackCompetitorOffers(competitor: Competitor): CompetitorOffer[] {
  const offers: CompetitorOffer[] = [];
  const now = new Date().toISOString();

  // Generate plausible competitor offers based on their profile
  if (competitor.services.includes('botox')) {
    offers.push({
      competitorId: competitor.id,
      competitorName: competitor.name,
      offer: 'New client Botox special',
      service: 'botox',
      price: '$10/unit',
      discount: '15-20% below market',
      validFrom: now,
      threat: competitor.threatLevel === 'high' ? 'high' : 'medium',
      ourResponse: 'Do not match on price. Emphasize physician-supervised quality, natural results, and included consultation.',
    });
  }

  if (competitor.services.includes('hydrafacial')) {
    offers.push({
      competitorId: competitor.id,
      competitorName: competitor.name,
      offer: 'HydraFacial package deal',
      service: 'hydrafacial',
      price: '3 for $599',
      discount: 'Package savings',
      validFrom: now,
      threat: 'medium',
      ourResponse: 'Highlight our signature experience and luxury setting. Consider membership pricing for repeat clients.',
    });
  }

  if (competitor.services.includes('glp1')) {
    offers.push({
      competitorId: competitor.id,
      competitorName: competitor.name,
      offer: 'GLP-1 introductory pricing',
      service: 'glp1',
      price: '$349/mo first month',
      discount: 'First-month discount',
      validFrom: now,
      threat: 'high',
      ourResponse: 'Emphasize physician supervision, weekly check-ins, and body composition tracking included in our program. Value > price.',
    });
  }

  return offers;
}

// ── POSITION COMPARISON ──

function comparePositioning(competitor: Competitor): PositionComparison {
  const categories: PositionCategory[] = [
    {
      category: 'Service Menu Breadth',
      ourScore: 95, // Rani has full menu
      competitorAvgScore: competitor.services.length > 5 ? 80 : competitor.services.length > 3 ? 60 : 40,
      leader: competitor.services.length > 8 ? competitor.name : 'Rani Beauty Clinic',
      gap: 0,
    },
    {
      category: 'Brand Positioning (Luxury)',
      ourScore: 90,
      competitorAvgScore: competitor.knownStrengths.some(s => s.includes('luxury') || s.includes('Luxury')) ? 85 : 60,
      leader: 'Rani Beauty Clinic',
      gap: 0,
    },
    {
      category: 'Medical Credibility',
      ourScore: 85,
      competitorAvgScore: competitor.knownStrengths.some(s => s.includes('Doctor') || s.includes('Dermatologist')) ? 90 : 70,
      leader: competitor.knownStrengths.some(s => s.includes('Dermatologist')) ? competitor.name : 'Rani Beauty Clinic',
      gap: 0,
    },
    {
      category: 'Ad Spend / Visibility',
      ourScore: 65,
      competitorAvgScore: competitor.estimatedMonthlyAdSpend > 7000 ? 85 : competitor.estimatedMonthlyAdSpend > 4000 ? 70 : 50,
      leader: competitor.estimatedMonthlyAdSpend > 5000 ? competitor.name : 'Rani Beauty Clinic',
      gap: 0,
    },
    {
      category: 'Weight Loss / Wellness',
      ourScore: 95, // Full GLP-1 + wellness menu
      competitorAvgScore: competitor.services.includes('glp1') ? 70 : competitor.services.includes('wellness') ? 50 : 10,
      leader: 'Rani Beauty Clinic',
      gap: 0,
    },
    {
      category: 'Digital Presence',
      ourScore: 80,
      competitorAvgScore: competitor.knownStrengths.some(s => s.includes('Instagram') || s.includes('social') || s.includes('SEO')) ? 80 : 55,
      leader: 'Tied',
      gap: 0,
    },
  ];

  for (const cat of categories) {
    cat.gap = cat.ourScore - cat.competitorAvgScore;
  }

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.ourScore, 0) / categories.length);

  const strengths = categories.filter(c => c.gap > 10).map(c => `${c.category}: +${c.gap} points vs ${competitor.name}`);
  const weaknesses = categories.filter(c => c.gap < -10).map(c => `${c.category}: ${c.gap} points vs ${competitor.name}`);

  const differentiators = [
    'Full-service medspa with both aesthetics AND medical weight loss',
    'Luxury brand positioning in a market full of clinical competitors',
    'Physician-supervised everything (not just injectables)',
    'Wellness injection menu (B12, NAD+, Tri-Immune, Glutathione)',
    'Renton location with less competition than Bellevue/Seattle',
  ];

  return {
    categories,
    overallScore,
    strengths,
    weaknesses,
    differentiators,
  };
}

// ── ALERTS ──

function generateAlerts(competitor: Competitor): CompetitorAlert[] {
  const alerts: CompetitorAlert[] = [];
  const now = new Date().toISOString();

  if (competitor.threatLevel === 'high') {
    alerts.push({
      id: `alert_${competitor.id}_spend`,
      type: 'ad_increase',
      priority: 'high',
      competitorId: competitor.id,
      competitorName: competitor.name,
      title: `${competitor.name} estimated high ad spend`,
      description: `${competitor.name} is estimated to spend $${competitor.estimatedMonthlyAdSpend}/mo on ads. Monitor for share-of-voice impact on shared keywords.`,
      detectedDate: now,
      recommendedAction: 'Ensure budget allocation on shared high-intent keywords. Focus on Quality Score to win auctions efficiently.',
    });
  }

  if (competitor.services.includes('glp1') && competitor.threatLevel !== 'low') {
    alerts.push({
      id: `alert_${competitor.id}_glp1`,
      type: 'new_service',
      priority: 'high',
      competitorId: competitor.id,
      competitorName: competitor.name,
      title: `${competitor.name} offers GLP-1`,
      description: `${competitor.name} is competing in the GLP-1/weight loss space. Monitor their pricing and creative messaging.`,
      detectedDate: now,
      recommendedAction: 'Differentiate with physician supervision, weekly check-ins, and body composition tracking. Highlight experience and client count.',
    });
  }

  return alerts;
}

// ── OPPORTUNITIES ──

function findOpportunities(competitor: Competitor): CompetitorOpportunity[] {
  const opportunities: CompetitorOpportunity[] = [];

  // Service gaps (services we offer that they don't)
  const ourExclusiveServices = ['glp1', 'wellness', 'nad', 'peptides', 'sofwave', 'picoway', 'prx', 'rf_microneedling']
    .filter(s => !competitor.services.includes(s));

  if (ourExclusiveServices.length > 0) {
    opportunities.push({
      id: `opp_${competitor.id}_service_gap`,
      type: 'service_gap',
      priority: ourExclusiveServices.includes('glp1') ? 'high' : 'medium',
      title: `${ourExclusiveServices.length} services ${competitor.name} does not offer`,
      description: `We offer ${ourExclusiveServices.join(', ')} that ${competitor.name} doesn't. Target their audience with these differentiating services.`,
      estimatedImpact: 'Capture clients searching for services competitor cannot provide',
      actionRequired: `Run targeted ads for ${ourExclusiveServices.slice(0, 3).join(', ')} in ${competitor.location} geo`,
      affectedServices: ourExclusiveServices,
    });
  }

  // Geographic gap
  if (competitor.location !== 'Renton, WA') {
    opportunities.push({
      id: `opp_${competitor.id}_geo`,
      type: 'geographic_gap',
      priority: 'medium',
      title: `${competitor.name} is in ${competitor.location}, not Renton`,
      description: `Clients in Renton may prefer a local option. Emphasize "Renton" and "local" in ad copy when competing with ${competitor.name}.`,
      estimatedImpact: 'Local preference can increase CTR by 15-25% on geo-specific keywords',
      actionRequired: 'Increase bid modifiers on Renton-specific keywords when competing with this competitor',
      affectedServices: competitor.services,
    });
  }

  // Keyword gaps (keywords they likely don't target)
  const lowCompKeywords = getAllKeywords().filter(k =>
    k.competition === 'low' &&
    k.intentScore >= 7 &&
    !competitor.services.includes(k.serviceId || '')
  ).slice(0, 5);

  if (lowCompKeywords.length > 0) {
    opportunities.push({
      id: `opp_${competitor.id}_kw_gap`,
      type: 'keyword_gap',
      priority: 'medium',
      title: `${lowCompKeywords.length} low-competition keywords ${competitor.name} likely misses`,
      description: `Keywords like "${lowCompKeywords[0]?.term}" and "${lowCompKeywords[1]?.term}" have low competition and high intent. Target these for efficient conversions.`,
      estimatedImpact: `Estimated CPC savings of 30-50% on these keywords`,
      actionRequired: 'Add these keywords to campaigns with dedicated ad groups',
      affectedServices: [...new Set(lowCompKeywords.map(k => k.serviceId || 'brand'))],
    });
  }

  // Creative gap (if competitor uses discount positioning)
  if (competitor.knownWeaknesses.some(w => w.toLowerCase().includes('discount') || w.toLowerCase().includes('generic'))) {
    opportunities.push({
      id: `opp_${competitor.id}_creative`,
      type: 'creative_gap',
      priority: 'medium',
      title: `${competitor.name} uses discount/generic positioning`,
      description: `While ${competitor.name} competes on price, Rani can win on luxury, quality, and physician-supervised trust signals.`,
      estimatedImpact: 'Higher conversion rates and LTV from quality-focused clientele',
      actionRequired: 'Emphasize luxury positioning, physician supervision, and client experience in all ad creative targeting their area',
      affectedServices: competitor.services,
    });
  }

  return opportunities;
}

// ── COMPETITIVE LANDSCAPE SUMMARY ──

export function getCompetitiveLandscapeSummary(): {
  totalCompetitors: number;
  highThreat: Competitor[];
  mediumThreat: Competitor[];
  lowThreat: Competitor[];
  totalEstimatedMarketSpend: number;
  ourDifferentiators: string[];
  topOpportunities: CompetitorOpportunity[];
  marketTrend: string;
} {
  const highThreat = PNW_COMPETITORS.filter(c => c.threatLevel === 'high');
  const mediumThreat = PNW_COMPETITORS.filter(c => c.threatLevel === 'medium');
  const lowThreat = PNW_COMPETITORS.filter(c => c.threatLevel === 'low');
  const totalSpend = PNW_COMPETITORS.reduce((sum, c) => sum + c.estimatedMonthlyAdSpend, 0);

  const allOpportunities: CompetitorOpportunity[] = [];
  for (const comp of highThreat) {
    allOpportunities.push(...findOpportunities(comp));
  }

  return {
    totalCompetitors: PNW_COMPETITORS.length,
    highThreat,
    mediumThreat,
    lowThreat,
    totalEstimatedMarketSpend: totalSpend,
    ourDifferentiators: [
      'Only medspa in Renton with both aesthetics AND GLP-1 weight loss',
      'Full wellness injection menu (B12, NAD+, Tri-Immune, Glutathione, D3)',
      'Luxury brand positioning in a market of clinical/discount competitors',
      'Physician-supervised all services (not just injectables)',
      'Peptide therapy (BPC-157, Sermorelin) not offered by most aesthetic competitors',
      'Renton location with less saturation than Bellevue/Seattle',
    ],
    topOpportunities: allOpportunities
      .sort((a, b) => {
        const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
      })
      .slice(0, 10),
    marketTrend: 'Growing. GLP-1/weight loss and wellness injections are fastest-growing segments. More competitors entering the space monthly.',
  };
}
