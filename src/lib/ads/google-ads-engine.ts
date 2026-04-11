/**
 * Ads War Machine - Google Ads Engine
 *
 * Complete Google Ads campaign system including:
 * - Search campaign builder with ad groups and match types
 * - Responsive Search Ad (RSA) generation with headline/description variants
 * - Ad extensions: sitelinks, callouts, structured snippets, location
 * - Keyword research engine with CPC estimates and intent scoring
 * - Bid strategy recommendations and quality score optimization
 * - Landing page mapping per keyword cluster
 *
 * Geo: Renton, WA + PNW surrounding cities
 * CRITICAL: Always "injection" - never "infusion."
 */

import { RANI_SERVICES, type ServiceProfile } from './creative-engine';
import {
  getAllKeywords,
  getKeywordsByService,
  getKeywordsByCategory,
  getHighIntentKeywords,
  NEGATIVE_KEYWORDS,
  type Keyword,
  type MatchType,
  type KeywordCategory,
} from '@/data/ads/keyword-library';
import {
  getGoogleHeadlines,
  getGoogleDescriptions,
  TRUST_SIGNALS,
  SOCIAL_PROOF,
} from '@/data/ads/creative-library';

// ── TYPES ──

export type GoogleCampaignType = 'search' | 'pmax' | 'display' | 'shopping' | 'video';
export type GoogleBidStrategy = 'maximize_conversions' | 'target_cpa' | 'target_roas' | 'maximize_clicks' | 'manual_cpc';
export type AdGroupStatus = 'enabled' | 'paused' | 'removed';
export type QualityScoreComponent = 'expected_ctr' | 'ad_relevance' | 'landing_page';

export interface GoogleCampaignConfig {
  id: string;
  name: string;
  type: GoogleCampaignType;
  status: AdGroupStatus;
  dailyBudget: number;
  bidStrategy: GoogleBidStrategy;
  targetCPA?: number;
  targetROAS?: number;
  locationTargeting: LocationTargeting;
  adSchedule: AdScheduleEntry[];
  startDate: string;
  endDate?: string;
  adGroups: GoogleAdGroup[];
  extensions: CampaignExtensions;
}

export interface LocationTargeting {
  targetLocations: string[];
  excludeLocations: string[];
  radiusMiles: number;
  centerCity: string;
}

export interface AdScheduleEntry {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startHour: number;
  endHour: number;
  bidModifier: number; // 1.0 = no change, 1.2 = +20%
}

export interface GoogleAdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: AdGroupStatus;
  keywords: GoogleKeyword[];
  negativeKeywords: GoogleNegativeKeyword[];
  ads: ResponsiveSearchAd[];
  defaultBid: number;
  qualityScoreEstimate: number;
  landingPage: string;
}

export interface GoogleKeyword {
  id: string;
  term: string;
  matchType: MatchType;
  bid: number;
  qualityScore?: number;
  expectedCTR?: QualityScoreRating;
  adRelevance?: QualityScoreRating;
  landingPageExperience?: QualityScoreRating;
  status: AdGroupStatus;
}

export type QualityScoreRating = 'above_average' | 'average' | 'below_average';

export interface GoogleNegativeKeyword {
  term: string;
  matchType: MatchType;
}

export interface ResponsiveSearchAd {
  id: string;
  adGroupId: string;
  headlines: RSAHeadline[];
  descriptions: RSADescription[];
  finalUrl: string;
  displayUrl: string;
  path1?: string;
  path2?: string;
  status: AdGroupStatus;
}

export interface RSAHeadline {
  text: string;
  pinPosition?: 1 | 2 | 3;
  characterCount: number;
}

export interface RSADescription {
  text: string;
  pinPosition?: 1 | 2;
  characterCount: number;
}

export interface CampaignExtensions {
  sitelinks: SitelinkExtension[];
  callouts: CalloutExtension[];
  structuredSnippets: StructuredSnippetExtension[];
  locationExtension: LocationExtension;
  callExtension: CallExtension;
  priceExtensions: PriceExtension[];
}

export interface SitelinkExtension {
  text: string;
  description1: string;
  description2: string;
  finalUrl: string;
}

export interface CalloutExtension {
  text: string;
}

export interface StructuredSnippetExtension {
  header: string;
  values: string[];
}

export interface LocationExtension {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  mapUrl: string;
}

export interface CallExtension {
  phone: string;
  countryCode: string;
  callTrackingEnabled: boolean;
}

export interface PriceExtension {
  type: 'services' | 'packages';
  items: PriceExtensionItem[];
}

export interface PriceExtensionItem {
  header: string;
  description: string;
  price: string;
  priceUnit: 'per_session' | 'per_month' | 'per_unit' | 'from';
  finalUrl: string;
}

// ── OUTPUT TYPES ──

export interface GoogleAdsBlueprint {
  campaigns: GoogleCampaignConfig[];
  accountExtensions: CampaignExtensions;
  keywordResearch: KeywordResearchResult;
  bidStrategyRecommendation: BidStrategyRecommendation;
  qualityScoreTips: QualityScoreTip[];
  landingPageMap: LandingPageMapping[];
  estimatedPerformance: EstimatedPerformance;
}

export interface KeywordResearchResult {
  totalKeywords: number;
  byCategory: Record<string, number>;
  topOpportunities: Keyword[];
  competitiveGaps: Keyword[];
  estimatedMonthlyBudget: number;
  estimatedMonthlyClicks: number;
}

export interface BidStrategyRecommendation {
  recommended: GoogleBidStrategy;
  reason: string;
  targetCPA?: number;
  targetROAS?: number;
  alternativeStrategies: { strategy: GoogleBidStrategy; scenario: string }[];
}

export interface QualityScoreTip {
  component: QualityScoreComponent;
  priority: 'high' | 'medium' | 'low';
  tip: string;
  impact: string;
}

export interface LandingPageMapping {
  keywordCluster: string;
  keywords: string[];
  landingPage: string;
  requiredElements: string[];
  conversionGoal: string;
}

export interface EstimatedPerformance {
  estimatedMonthlyClicks: number;
  estimatedMonthlyCost: number;
  estimatedCTR: number;
  estimatedConversionRate: number;
  estimatedLeads: number;
  estimatedCPA: number;
  estimatedROAS: number;
}

// ── CONSTANTS ──

const PNW_CITIES = [
  'Renton', 'Bellevue', 'Kent', 'Tukwila', 'Newcastle',
  'Mercer Island', 'Issaquah', 'Kirkland', 'Redmond', 'Federal Way',
  'Auburn', 'SeaTac', 'Burien', 'Covington', 'Maple Valley',
];

const DEFAULT_LOCATION: LocationTargeting = {
  targetLocations: PNW_CITIES,
  excludeLocations: [],
  radiusMiles: 25,
  centerCity: 'Renton, WA',
};

const BUSINESS_HOURS_SCHEDULE: AdScheduleEntry[] = [
  { day: 'monday', startHour: 7, endHour: 21, bidModifier: 1.0 },
  { day: 'tuesday', startHour: 7, endHour: 21, bidModifier: 1.0 },
  { day: 'wednesday', startHour: 7, endHour: 21, bidModifier: 1.0 },
  { day: 'thursday', startHour: 7, endHour: 21, bidModifier: 1.0 },
  { day: 'friday', startHour: 7, endHour: 21, bidModifier: 1.1 },
  { day: 'saturday', startHour: 8, endHour: 20, bidModifier: 1.15 },
  { day: 'sunday', startHour: 8, endHour: 20, bidModifier: 1.2 },
];

const SERVICE_LANDING_PAGES: Record<string, string> = {
  botox: '/services/botox',
  fillers: '/services/fillers',
  hydrafacial: '/services/hydrafacial',
  laser_hair: '/services/laser-hair-removal',
  rf_microneedling: '/services/rf-microneedling',
  sofwave: '/services/sofwave',
  vi_peel: '/services/vi-peel',
  picoway: '/services/picoway',
  prx: '/services/prx-t33',
  glp1: '/services/glp-1-weight-loss',
  wellness: '/services/wellness-injections',
  nad: '/services/wellness-injections',
  peptides: '/services/wellness-injections',
  b12: '/services/wellness-injections',
  glutathione: '/services/wellness-injections',
  tri_immune: '/services/wellness-injections',
  brand: '/',
};

// ── SITELINK EXTENSIONS (8) ──

const SITELINKS: SitelinkExtension[] = [
  {
    text: 'GLP-1 Weight Loss',
    description1: 'Physician-supervised medical weight loss',
    description2: 'GLP-1 program starting at $399/mo',
    finalUrl: 'https://ranibeautyclinic.com/services/glp-1-weight-loss',
  },
  {
    text: 'Botox & Fillers',
    description1: 'Expert injectable treatments',
    description2: 'Natural results, zero downtime',
    finalUrl: 'https://ranibeautyclinic.com/services/botox',
  },
  {
    text: 'HydraFacial',
    description1: 'Deep cleanse and hydrate',
    description2: 'Signature facial from $249',
    finalUrl: 'https://ranibeautyclinic.com/services/hydrafacial',
  },
  {
    text: 'Sofwave Skin Tightening',
    description1: 'Non-surgical facelift alternative',
    description2: 'FDA-cleared, zero downtime',
    finalUrl: 'https://ranibeautyclinic.com/services/sofwave',
  },
  {
    text: 'Laser Hair Removal',
    description1: 'Permanent hair reduction',
    description2: 'All skin types, packages from $800',
    finalUrl: 'https://ranibeautyclinic.com/services/laser-hair-removal',
  },
  {
    text: 'Wellness Injections',
    description1: 'B12, Glutathione, NAD+, Tri-Immune',
    description2: 'Quick IM injections, walk-ins welcome',
    finalUrl: 'https://ranibeautyclinic.com/services/wellness-injections',
  },
  {
    text: 'Book a Consultation',
    description1: 'Free consultation for new clients',
    description2: 'Personalized treatment plans',
    finalUrl: 'https://ranibeautyclinic.com/book',
  },
  {
    text: 'Financing Available',
    description1: 'Cherry financing for treatments',
    description2: 'Flexible monthly payments',
    finalUrl: 'https://ranibeautyclinic.com/financing',
  },
];

// ── CALLOUT EXTENSIONS (10) ──

const CALLOUTS: CalloutExtension[] = [
  { text: 'Physician-Supervised' },
  { text: 'Free Consultation' },
  { text: 'Walk-Ins Welcome' },
  { text: '5-Star Rated' },
  { text: 'Cherry Financing' },
  { text: 'All Skin Types' },
  { text: 'Board-Certified Team' },
  { text: 'Renton, WA' },
  { text: 'Clinical-Grade Care' },
  { text: 'Same-Day Appointments' },
];

// ── STRUCTURED SNIPPETS ──

const STRUCTURED_SNIPPETS: StructuredSnippetExtension[] = [
  {
    header: 'Services',
    values: ['Botox', 'Dermal Fillers', 'HydraFacial', 'GLP-1 Weight Loss', 'Laser Hair Removal', 'Sofwave', 'Wellness Injections'],
  },
  {
    header: 'Amenities',
    values: ['Free Parking', 'Private Treatment Rooms', 'Complimentary Consultation', 'Relaxation Lounge', 'Online Booking'],
  },
  {
    header: 'Types',
    values: ['Injectable Treatments', 'Laser Treatments', 'Facial Treatments', 'Medical Weight Loss', 'Wellness Injections', 'Skin Tightening'],
  },
  {
    header: 'Neighborhoods',
    values: ['Renton', 'Bellevue', 'Kent', 'Tukwila', 'Newcastle', 'Mercer Island', 'Issaquah'],
  },
];

// ── LOCATION EXTENSION ──

const LOCATION_EXTENSION: LocationExtension = {
  businessName: 'Rani Beauty Clinic',
  address: '401 Olympia Ave NE #101',
  city: 'Renton',
  state: 'WA',
  zip: '98056',
  phone: '(425) 555-7264',
  mapUrl: 'https://maps.google.com/?q=Rani+Beauty+Clinic+Renton+WA',
};

// ── CALL EXTENSION ──

const CALL_EXTENSION: CallExtension = {
  phone: '(425) 555-7264',
  countryCode: 'US',
  callTrackingEnabled: true,
};

// ── PRICE EXTENSIONS ──

const PRICE_EXTENSIONS: PriceExtension[] = [
  {
    type: 'services',
    items: [
      { header: 'Botox', description: 'Expert injectable treatment', price: '$12', priceUnit: 'per_unit', finalUrl: 'https://ranibeautyclinic.com/services/botox' },
      { header: 'HydraFacial', description: 'Signature deep cleansing facial', price: '$249', priceUnit: 'per_session', finalUrl: 'https://ranibeautyclinic.com/services/hydrafacial' },
      { header: 'GLP-1 Weight Loss', description: 'Medical weight loss program', price: '$399', priceUnit: 'per_month', finalUrl: 'https://ranibeautyclinic.com/services/glp-1-weight-loss' },
      { header: 'Sofwave', description: 'Non-surgical skin tightening', price: '$2,750', priceUnit: 'from', finalUrl: 'https://ranibeautyclinic.com/services/sofwave' },
      { header: 'RF Microneedling', description: 'Collagen renewal treatment', price: '$495', priceUnit: 'from', finalUrl: 'https://ranibeautyclinic.com/services/rf-microneedling' },
      { header: 'Wellness Injections', description: 'B12, Glutathione, NAD+', price: '$35', priceUnit: 'from', finalUrl: 'https://ranibeautyclinic.com/services/wellness-injections' },
    ],
  },
];

// ── MAIN ENGINE ──

export function buildGoogleAdsBlueprint(config: {
  monthlyBudget: number;
  targetCPA: number;
  targetROAS: number;
  priorityServices?: string[];
}): GoogleAdsBlueprint {
  const { monthlyBudget, targetCPA, targetROAS, priorityServices } = config;

  const campaigns = buildSearchCampaigns(monthlyBudget, targetCPA, priorityServices);
  const accountExtensions = buildAccountExtensions();
  const keywordResearch = performKeywordResearch(priorityServices);
  const bidStrategyRecommendation = recommendBidStrategy(monthlyBudget, targetCPA, targetROAS);
  const qualityScoreTips = generateQualityScoreTips();
  const landingPageMap = buildLandingPageMap();
  const estimatedPerformance = estimatePerformance(monthlyBudget, keywordResearch);

  return {
    campaigns,
    accountExtensions,
    keywordResearch,
    bidStrategyRecommendation,
    qualityScoreTips,
    landingPageMap,
    estimatedPerformance,
  };
}

// ── CAMPAIGN BUILDER ──

function buildSearchCampaigns(
  monthlyBudget: number,
  targetCPA: number,
  priorityServices?: string[]
): GoogleCampaignConfig[] {
  const campaigns: GoogleCampaignConfig[] = [];
  const dailyBudget = Math.round((monthlyBudget / 30.4) * 100) / 100;

  // Campaign allocation: GLP-1 35%, Aesthetics 35%, Wellness 15%, Brand 15%
  const allocations = [
    { id: 'glp1', name: 'Rani - Search - GLP-1 Weight Loss', share: 0.35, categories: ['glp1_weight_loss'] as KeywordCategory[], services: ['glp1'] },
    { id: 'aesthetics', name: 'Rani - Search - Aesthetic Services', share: 0.35, categories: ['aesthetic_injectable', 'aesthetic_laser', 'aesthetic_facial'] as KeywordCategory[], services: ['botox', 'fillers', 'hydrafacial', 'laser_hair', 'rf_microneedling', 'sofwave', 'vi_peel', 'picoway', 'prx'] },
    { id: 'wellness', name: 'Rani - Search - Wellness & Peptides', share: 0.15, categories: ['peptide_therapy', 'hormone_therapy', 'wellness_injection'] as KeywordCategory[], services: ['wellness', 'nad', 'peptides', 'b12', 'glutathione', 'tri_immune'] },
    { id: 'brand', name: 'Rani - Search - Brand & Local', share: 0.15, categories: ['local_geo', 'brand'] as KeywordCategory[], services: ['brand'] },
  ];

  for (const alloc of allocations) {
    const campaignDailyBudget = Math.round(dailyBudget * alloc.share * 100) / 100;
    const adGroups = buildAdGroupsForCampaign(alloc.id, alloc.categories, alloc.services, targetCPA);

    campaigns.push({
      id: `campaign_${alloc.id}`,
      name: alloc.name,
      type: 'search',
      status: 'enabled',
      dailyBudget: campaignDailyBudget,
      bidStrategy: 'target_cpa',
      targetCPA,
      locationTargeting: DEFAULT_LOCATION,
      adSchedule: BUSINESS_HOURS_SCHEDULE,
      startDate: new Date().toISOString().split('T')[0],
      adGroups,
      extensions: buildAccountExtensions(),
    });
  }

  return campaigns;
}

function buildAdGroupsForCampaign(
  campaignId: string,
  categories: KeywordCategory[],
  services: string[],
  targetCPA: number
): GoogleAdGroup[] {
  const adGroups: GoogleAdGroup[] = [];

  for (const serviceId of services) {
    const serviceKeywords = getKeywordsByService(serviceId);
    const categoryKeywords = serviceId === 'brand'
      ? [...getKeywordsByCategory('local_geo')]
      : [];

    const allKws = [...serviceKeywords, ...categoryKeywords];
    if (allKws.length === 0) continue;

    // Build match-type segmented ad groups
    const exactKws = allKws.filter(k => k.matchType === 'exact');
    const phraseKws = allKws.filter(k => k.matchType === 'phrase');
    const broadKws = allKws.filter(k => k.matchType === 'broad');

    const landingPage = SERVICE_LANDING_PAGES[serviceId] || '/';
    const serviceName = RANI_SERVICES.find(s => s.id === serviceId)?.name || serviceId;

    if (exactKws.length > 0) {
      adGroups.push(buildAdGroup(
        `ag_${campaignId}_${serviceId}_exact`,
        `campaign_${campaignId}`,
        `${serviceName} - Exact`,
        exactKws,
        landingPage,
        targetCPA,
        serviceId,
      ));
    }

    if (phraseKws.length > 0) {
      adGroups.push(buildAdGroup(
        `ag_${campaignId}_${serviceId}_phrase`,
        `campaign_${campaignId}`,
        `${serviceName} - Phrase`,
        phraseKws,
        landingPage,
        targetCPA * 0.9,
        serviceId,
      ));
    }

    if (broadKws.length > 0) {
      adGroups.push(buildAdGroup(
        `ag_${campaignId}_${serviceId}_broad`,
        `campaign_${campaignId}`,
        `${serviceName} - Broad`,
        broadKws,
        landingPage,
        targetCPA * 0.75,
        serviceId,
      ));
    }
  }

  return adGroups;
}

function buildAdGroup(
  id: string,
  campaignId: string,
  name: string,
  keywords: Keyword[],
  landingPage: string,
  defaultBid: number,
  serviceId: string,
): GoogleAdGroup {
  const googleKeywords: GoogleKeyword[] = keywords.map((kw, idx) => ({
    id: `kw_${id}_${idx}`,
    term: kw.term,
    matchType: kw.matchType,
    bid: Math.round(kw.estimatedCPC * 1.1 * 100) / 100, // bid slightly above estimated CPC
    status: 'enabled' as AdGroupStatus,
  }));

  const negativeKws: GoogleNegativeKeyword[] = NEGATIVE_KEYWORDS.map(nk => ({
    term: nk.term,
    matchType: nk.matchType,
  }));

  const ads = buildResponsiveSearchAds(id, serviceId, landingPage);

  return {
    id,
    campaignId,
    name,
    status: 'enabled',
    keywords: googleKeywords,
    negativeKeywords: negativeKws,
    ads,
    defaultBid: Math.round(defaultBid * 100) / 100,
    qualityScoreEstimate: 7,
    landingPage: `https://ranibeautyclinic.com${landingPage}`,
  };
}

// ── RESPONSIVE SEARCH AD BUILDER ──

function buildResponsiveSearchAds(
  adGroupId: string,
  serviceId: string,
  landingPage: string,
): ResponsiveSearchAd[] {
  const headlines = generateRSAHeadlines(serviceId);
  const descriptions = generateRSADescriptions(serviceId);

  const ad: ResponsiveSearchAd = {
    id: `rsa_${adGroupId}_1`,
    adGroupId,
    headlines,
    descriptions,
    finalUrl: `https://ranibeautyclinic.com${landingPage}`,
    displayUrl: 'ranibeautyclinic.com',
    path1: getPath1(serviceId),
    path2: getPath2(serviceId),
    status: 'enabled',
  };

  return [ad];
}

function generateRSAHeadlines(serviceId: string): RSAHeadline[] {
  const headlines: RSAHeadline[] = [];

  // Try to pull from creative library
  const libraryHeadlines = getGoogleHeadlines(serviceId);

  for (const lh of libraryHeadlines.slice(0, 3)) {
    headlines.push({
      text: lh.text.slice(0, 30),
      characterCount: Math.min(lh.characterCount, 30),
    });
  }

  // Service-specific generated headlines
  const serviceHeadlines = getServiceHeadlines(serviceId);
  for (const sh of serviceHeadlines) {
    if (headlines.length >= 15) break;
    if (!headlines.some(h => h.text === sh)) {
      headlines.push({ text: sh.slice(0, 30), characterCount: Math.min(sh.length, 30) });
    }
  }

  // Brand headlines (always include)
  const brandHeadlines = [
    'Rani Beauty Clinic Renton',
    'Physician-Supervised Care',
    'Book Free Consultation',
    'Renton, WA | 5-Star Rated',
    'Walk-Ins Welcome',
  ];

  for (const bh of brandHeadlines) {
    if (headlines.length >= 15) break;
    if (!headlines.some(h => h.text === bh)) {
      headlines.push({ text: bh.slice(0, 30), characterCount: Math.min(bh.length, 30) });
    }
  }

  // Pin brand headline to position 1
  if (headlines.length > 0) {
    const brandIdx = headlines.findIndex(h => h.text.includes('Rani'));
    if (brandIdx >= 0) headlines[brandIdx].pinPosition = 1;
  }

  return headlines.slice(0, 15);
}

function generateRSADescriptions(serviceId: string): RSADescription[] {
  const descriptions: RSADescription[] = [];

  // Pull from library
  const libraryDescs = getGoogleDescriptions(serviceId);
  for (const ld of libraryDescs.slice(0, 2)) {
    descriptions.push({
      text: ld.text.slice(0, 90),
      characterCount: Math.min(ld.characterCount, 90),
    });
  }

  // Service-specific generated descriptions
  const serviceDescs = getServiceDescriptions(serviceId);
  for (const sd of serviceDescs) {
    if (descriptions.length >= 4) break;
    if (!descriptions.some(d => d.text === sd)) {
      descriptions.push({ text: sd.slice(0, 90), characterCount: Math.min(sd.length, 90) });
    }
  }

  return descriptions.slice(0, 4);
}

function getServiceHeadlines(serviceId: string): string[] {
  const serviceMap: Record<string, string[]> = {
    glp1: [
      'Medical Weight Loss $399/mo',
      'GLP-1 Weight Loss Program',
      'Physician-Guided Weight Loss',
      'Lose Weight With GLP-1',
      'Semaglutide in Renton WA',
      'Start Your Weight Loss Today',
      'Weekly Check-Ins Included',
      'Real Results, Real Support',
    ],
    botox: [
      'Expert Botox Renton WA',
      'Botox from $12/unit',
      '15 Minute Botox Treatment',
      'Natural Botox Results',
      'Preventative Botox Options',
      'Forehead Lines Gone',
      'Zero Downtime Botox',
    ],
    fillers: [
      'Dermal Fillers Renton',
      'Lip Filler Specialist',
      'Natural Volume Restoration',
      'Juvederm & Restylane',
      'Expert Filler Injections',
    ],
    hydrafacial: [
      'HydraFacial from $249',
      'HydraFacial Renton WA',
      '60-Minute Glow Treatment',
      'Deep Cleanse & Hydrate',
      'Signature Facial Treatment',
    ],
    laser_hair: [
      'Laser Hair Removal Renton',
      'Never Shave Again',
      'All Skin Types Welcome',
      'Full Body Packages $800+',
      'Pain-Free Laser Tech',
    ],
    sofwave: [
      'Sofwave Skin Tightening',
      'Non-Surgical Facelift',
      'FDA-Cleared Technology',
      'Zero Downtime Lift',
      'Tighter Skin One Session',
    ],
    rf_microneedling: [
      'RF Microneedling from $495',
      'Collagen Renewal Renton',
      'Scar Reduction Treatment',
      'Skin Tightening + Renewal',
    ],
    wellness: [
      'Wellness Injections Renton',
      'B12 Injections from $35',
      'NAD+ Therapy Available',
      'Immune Boost Injections',
      'Same-Day Appointments',
    ],
    nad: [
      'NAD+ Therapy from $150',
      'Cellular Energy Therapy',
      'NAD+ Injections Renton',
      'Anti-Aging NAD+ Therapy',
    ],
    peptides: [
      'Peptide Therapy Renton WA',
      'BPC-157 & Sermorelin',
      'Recovery Peptide Therapy',
      'Performance Peptides',
    ],
    vi_peel: [
      'VI Peel from $395',
      'Clear Skin in 7 Days',
      'Sun Damage Peel Renton',
      'VI Peel All Skin Types',
    ],
    picoway: [
      'PicoWay Laser Renton',
      'Dark Spot Removal Laser',
      'Pigmentation Treatment',
      'Laser from $350/session',
    ],
    prx: [
      'PRX-T33 Biorevitalization',
      'No-Peel Skin Renewal',
      'Instant Skin Results',
    ],
    brand: [
      'Rani Beauty Clinic',
      'Luxury Medspa Renton',
      '5-Star Medical Aesthetics',
      'Where Science Meets Luxury',
      'Renton WA Medspa',
    ],
    b12: ['B12 Injections Renton', 'Energy Boost B12 Shots'],
    glutathione: ['Glutathione Injections', 'Detox & Brightening'],
    tri_immune: ['Tri-Immune Boost', 'Immunity Injections'],
  };

  return serviceMap[serviceId] || [`${serviceId} at Rani Clinic`, 'Book Now at Rani'];
}

function getServiceDescriptions(serviceId: string): string[] {
  const descMap: Record<string, string[]> = {
    glp1: [
      'Physician-supervised GLP-1 weight loss with weekly check-ins. Starting $399/mo. Renton WA.',
      'Medical weight loss that works with your body. Personalized dosing, real results.',
      'Join hundreds of successful GLP-1 weight loss patients. Free consultation available.',
      'Semaglutide and tirzepatide programs with body composition tracking. Book today.',
    ],
    botox: [
      'Natural-looking Botox by expert injectors. 15 minutes, zero downtime. Renton WA.',
      'Prevent and correct fine lines and wrinkles. Physician-supervised Botox from $12/unit.',
      'Walk-in Botox appointments available. Board-certified team at Rani Beauty Clinic.',
    ],
    fillers: [
      'Expert filler injections for lips, cheeks, and jawline. Natural volume restoration.',
      'Juvederm and Restylane by physician-supervised specialists. Free consultation.',
    ],
    hydrafacial: [
      'Signature HydraFacial: cleanse, exfoliate, hydrate in 60 minutes. From $249.',
      'The facial everyone is asking about. Walk-ins welcome at Rani Beauty Clinic.',
    ],
    laser_hair: [
      'Advanced laser hair removal for all skin types. Full body packages from $800.',
      'Permanent hair reduction with pain-free technology. Free consultation in Renton.',
    ],
    sofwave: [
      'FDA-cleared ultrasound skin tightening. One session, visible results. No downtime.',
      'Non-surgical facelift alternative. Lift and tighten face, neck, and brow.',
    ],
    rf_microneedling: [
      'RF Microneedling for scars, pores, and skin texture. Collagen renewal from $495.',
      'Turn back the clock with physician-supervised RF Microneedling in Renton WA.',
    ],
    wellness: [
      'B12, Glutathione, NAD+, Tri-Immune, Vitamin D3 injections. Walk-ins welcome.',
      'Quick IM wellness injections for energy, immunity, and recovery. Same-day visits.',
    ],
    nad: [
      'NAD+ injection therapy for cellular repair and mental clarity. From $150.',
      'Physician-supervised NAD+ sessions at Rani Beauty Clinic in Renton WA.',
    ],
    peptides: [
      'BPC-157, Sermorelin, and advanced peptide protocols. Physician-supervised.',
      'Recovery and performance peptide therapy tailored to your goals. Book now.',
    ],
    brand: [
      'Physician-supervised medspa in Renton WA. Botox, fillers, weight loss, and more.',
      '5-star rated medical aesthetics clinic. Free consultations for new clients.',
      'Where science meets luxury. Cherry financing available. Book your visit today.',
    ],
  };

  return descMap[serviceId] || [
    `Professional ${serviceId} treatments at Rani Beauty Clinic. Physician-supervised care.`,
    `Book your ${serviceId} appointment today. Renton WA. Free consultation available.`,
  ];
}

function getPath1(serviceId: string): string {
  const pathMap: Record<string, string> = {
    glp1: 'Weight-Loss',
    botox: 'Botox',
    fillers: 'Fillers',
    hydrafacial: 'HydraFacial',
    laser_hair: 'Laser',
    sofwave: 'Sofwave',
    rf_microneedling: 'Microneedling',
    wellness: 'Wellness',
    nad: 'NAD-Therapy',
    peptides: 'Peptides',
    vi_peel: 'VI-Peel',
    picoway: 'PicoWay',
    prx: 'PRX-T33',
    brand: 'Renton-WA',
  };
  return pathMap[serviceId] || 'Services';
}

function getPath2(serviceId: string): string {
  const pathMap: Record<string, string> = {
    glp1: 'GLP-1',
    botox: 'Renton-WA',
    fillers: 'Renton-WA',
    hydrafacial: 'Book-Now',
    laser_hair: 'Packages',
    sofwave: 'Book-Now',
    rf_microneedling: 'Renton',
    wellness: 'Injections',
    nad: 'Book-Now',
    peptides: 'Renton-WA',
    brand: 'Book-Now',
  };
  return pathMap[serviceId] || 'Book-Now';
}

// ── EXTENSIONS BUILDER ──

function buildAccountExtensions(): CampaignExtensions {
  return {
    sitelinks: SITELINKS,
    callouts: CALLOUTS,
    structuredSnippets: STRUCTURED_SNIPPETS,
    locationExtension: LOCATION_EXTENSION,
    callExtension: CALL_EXTENSION,
    priceExtensions: PRICE_EXTENSIONS,
  };
}

// ── KEYWORD RESEARCH ENGINE ──

function performKeywordResearch(priorityServices?: string[]): KeywordResearchResult {
  const allKws = getAllKeywords();

  const byCategory: Record<string, number> = {};
  for (const kw of allKws) {
    byCategory[kw.category] = (byCategory[kw.category] || 0) + 1;
  }

  const topOpportunities = getHighIntentKeywords(8)
    .filter(k => k.competition !== 'high')
    .slice(0, 20);

  const competitiveGaps = allKws
    .filter(k => k.competition === 'low' && k.intentScore >= 7)
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, 15);

  const avgCPC = allKws.reduce((sum, k) => sum + k.estimatedCPC, 0) / allKws.length;
  const totalVolume = allKws.reduce((sum, k) => sum + k.monthlyVolume, 0);
  const estimatedCTR = 0.035;
  const estimatedClicks = Math.round(totalVolume * estimatedCTR);
  const estimatedBudget = Math.round(estimatedClicks * avgCPC);

  return {
    totalKeywords: allKws.length,
    byCategory,
    topOpportunities,
    competitiveGaps,
    estimatedMonthlyBudget: estimatedBudget,
    estimatedMonthlyClicks: estimatedClicks,
  };
}

// ── BID STRATEGY ──

function recommendBidStrategy(
  monthlyBudget: number,
  targetCPA: number,
  targetROAS: number,
): BidStrategyRecommendation {
  // For new accounts or budgets under $3K, start with maximize conversions
  // For established accounts with data, use target CPA
  const isNewAccount = true; // default assumption

  if (monthlyBudget < 3000) {
    return {
      recommended: 'maximize_conversions',
      reason: 'With a monthly budget under $3,000, Maximize Conversions allows Google to optimize for the most conversions within your budget. Once you have 30+ conversions per month, switch to Target CPA.',
      alternativeStrategies: [
        { strategy: 'manual_cpc', scenario: 'If you want full control over individual keyword bids during the learning phase' },
        { strategy: 'maximize_clicks', scenario: 'If your primary goal is driving traffic to build remarketing audiences first' },
      ],
    };
  }

  return {
    recommended: 'target_cpa',
    targetCPA,
    reason: `Target CPA at $${targetCPA} aligns with your acquisition cost goals. Google will automatically adjust bids to achieve your target cost per conversion. Requires 15+ conversions in 30 days for optimal performance.`,
    alternativeStrategies: [
      { strategy: 'target_roas', scenario: `Switch to Target ROAS at ${targetROAS}x once you have conversion value tracking enabled` },
      { strategy: 'maximize_conversions', scenario: 'If CPA consistently exceeds target, switch to Maximize Conversions with a CPA cap' },
      { strategy: 'manual_cpc', scenario: 'For specific high-value keywords where you want manual bid control' },
    ],
  };
}

// ── QUALITY SCORE TIPS ──

function generateQualityScoreTips(): QualityScoreTip[] {
  return [
    // Expected CTR
    {
      component: 'expected_ctr',
      priority: 'high',
      tip: 'Include the primary keyword in Headline 1 of every RSA. Pin your most relevant headline to position 1.',
      impact: 'Improves expected CTR by 15-25%, directly impacting Quality Score and reducing CPC.',
    },
    {
      component: 'expected_ctr',
      priority: 'high',
      tip: 'Use action-oriented language in headlines: "Book Now", "Get Started", "Schedule Today" paired with the service name.',
      impact: 'Action verbs increase CTR by 10-20% compared to passive headlines.',
    },
    {
      component: 'expected_ctr',
      priority: 'medium',
      tip: 'Add price points in headlines (e.g., "Botox from $12/unit") to pre-qualify clicks and boost CTR among ready-to-buy searchers.',
      impact: 'Price in headlines can improve CTR by 8-15% and reduce wasted clicks.',
    },
    {
      component: 'expected_ctr',
      priority: 'medium',
      tip: 'Test question-format headlines for informational keywords (e.g., "Looking for Medical Weight Loss?").',
      impact: 'Questions mirror search intent and can lift CTR by 5-12%.',
    },
    // Ad Relevance
    {
      component: 'ad_relevance',
      priority: 'high',
      tip: 'Maintain tight keyword-to-ad-group mapping. Each ad group should target one service with 5-15 closely related keywords.',
      impact: 'Tight ad groups improve ad relevance scores and lower CPC by 10-30%.',
    },
    {
      component: 'ad_relevance',
      priority: 'high',
      tip: 'Mirror the exact keyword in at least one headline and one description of each RSA.',
      impact: 'Exact keyword match in ad copy is the strongest ad relevance signal.',
    },
    {
      component: 'ad_relevance',
      priority: 'medium',
      tip: 'Use Dynamic Keyword Insertion (DKI) in one headline: {KeyWord:Default Text} to automatically match search queries.',
      impact: 'DKI improves relevance for long-tail queries and can boost Quality Score by 1-2 points.',
    },
    // Landing Page Experience
    {
      component: 'landing_page',
      priority: 'high',
      tip: 'Each keyword cluster must point to a dedicated landing page, not the homepage. The landing page must contain the target keyword in the H1 and first paragraph.',
      impact: 'Dedicated landing pages improve landing page experience from "below average" to "above average", potentially saving 20-40% on CPC.',
    },
    {
      component: 'landing_page',
      priority: 'high',
      tip: 'Page load speed must be under 3 seconds on mobile. Compress images, defer non-critical JS, and use Next.js image optimization.',
      impact: 'Each second of load time over 3s increases bounce rate by 32% and lowers Quality Score.',
    },
    {
      component: 'landing_page',
      priority: 'medium',
      tip: 'Include social proof (reviews, ratings, patient count) and a clear CTA above the fold on every landing page.',
      impact: 'Social proof on landing pages improves conversion rate by 15-35%.',
    },
    {
      component: 'landing_page',
      priority: 'medium',
      tip: 'Add structured data (LocalBusiness, MedicalClinic) to landing pages for rich snippets and improved Quality Score signals.',
      impact: 'Structured data can improve organic CTR and sends positive quality signals to Google Ads.',
    },
    {
      component: 'landing_page',
      priority: 'low',
      tip: 'Ensure all landing pages are mobile-responsive with tap-friendly CTAs (minimum 48px touch targets).',
      impact: 'Mobile-optimized pages reduce bounce rate and improve conversion rates by 20-30%.',
    },
  ];
}

// ── LANDING PAGE MAP ──

function buildLandingPageMap(): LandingPageMapping[] {
  return [
    {
      keywordCluster: 'GLP-1 / Weight Loss',
      keywords: ['semaglutide near me', 'medical weight loss renton', 'glp-1 weight loss program', 'weight loss clinic renton'],
      landingPage: '/services/glp-1-weight-loss',
      requiredElements: ['H1 with "Medical Weight Loss" or "GLP-1"', 'Program details and pricing ($399/mo)', 'Physician credentials', 'Success stories / testimonials', 'BMI qualifier or eligibility check', 'Book consultation CTA', 'FAQ section'],
      conversionGoal: 'Consultation booking',
    },
    {
      keywordCluster: 'Botox',
      keywords: ['botox renton', 'botox near me', 'preventative botox', 'forehead botox'],
      landingPage: '/services/botox',
      requiredElements: ['H1 with "Botox"', 'Pricing ($12-14/unit)', 'Treatment areas', 'Provider credentials', 'Before/after expectations', 'Book now CTA', 'Walk-ins welcome badge'],
      conversionGoal: 'Direct booking or walk-in',
    },
    {
      keywordCluster: 'Dermal Fillers',
      keywords: ['dermal fillers renton', 'lip fillers near me', 'juvederm near me'],
      landingPage: '/services/fillers',
      requiredElements: ['H1 with "Dermal Fillers"', 'Treatment areas (lips, cheeks, jawline)', 'Product brands', 'Provider credentials', 'Book consultation CTA'],
      conversionGoal: 'Consultation booking',
    },
    {
      keywordCluster: 'HydraFacial',
      keywords: ['hydrafacial renton', 'hydrafacial near me', 'best facial renton'],
      landingPage: '/services/hydrafacial',
      requiredElements: ['H1 with "HydraFacial"', 'Pricing ($249)', 'Treatment process', 'Skin benefits', 'Book now CTA'],
      conversionGoal: 'Direct booking',
    },
    {
      keywordCluster: 'Laser Hair Removal',
      keywords: ['laser hair removal renton', 'laser hair removal near me', 'full body laser'],
      landingPage: '/services/laser-hair-removal',
      requiredElements: ['H1 with "Laser Hair Removal"', 'Package pricing', 'All skin types messaging', 'Treatment areas', 'Free consultation CTA'],
      conversionGoal: 'Free consultation booking',
    },
    {
      keywordCluster: 'Sofwave',
      keywords: ['sofwave near me', 'non surgical facelift renton', 'skin tightening'],
      landingPage: '/services/sofwave',
      requiredElements: ['H1 with "Sofwave"', 'FDA-cleared badge', 'Pricing ($2,750-$4,500)', 'Treatment areas', 'No downtime messaging', 'Book consultation CTA'],
      conversionGoal: 'Consultation booking',
    },
    {
      keywordCluster: 'RF Microneedling',
      keywords: ['rf microneedling near me', 'microneedling renton', 'skin tightening renton'],
      landingPage: '/services/rf-microneedling',
      requiredElements: ['H1 with "RF Microneedling"', 'Pricing ($495-$850)', 'Benefits (scars, pores, texture)', 'Treatment process', 'Book now CTA'],
      conversionGoal: 'Direct booking',
    },
    {
      keywordCluster: 'Wellness Injections',
      keywords: ['vitamin injections near me', 'b12 injection near me', 'NAD+ therapy', 'immune boost injection'],
      landingPage: '/services/wellness-injections',
      requiredElements: ['H1 with "Wellness Injections"', 'Full injection menu with prices', 'Benefits per injection', 'Walk-ins welcome', 'Book now CTA'],
      conversionGoal: 'Walk-in or direct booking',
    },
    {
      keywordCluster: 'Peptide Therapy',
      keywords: ['peptide therapy near me', 'sermorelin near me', 'BPC-157 therapy'],
      landingPage: '/services/wellness-injections',
      requiredElements: ['Peptide section with protocols', 'Benefits per peptide', 'Physician-supervised badge', 'Consultation CTA'],
      conversionGoal: 'Consultation booking',
    },
    {
      keywordCluster: 'Brand / Local',
      keywords: ['medspa renton wa', 'medspa near me', 'luxury medspa renton'],
      landingPage: '/',
      requiredElements: ['Clinic name and location', 'Service overview', 'Social proof', 'Multiple service CTAs', 'Location map'],
      conversionGoal: 'Service page navigation or booking',
    },
  ];
}

// ── PERFORMANCE ESTIMATOR ──

function estimatePerformance(
  monthlyBudget: number,
  keywordResearch: KeywordResearchResult,
): EstimatedPerformance {
  const allKws = getAllKeywords();
  const avgCPC = allKws.reduce((sum, k) => sum + k.estimatedCPC, 0) / allKws.length;

  const estimatedClicks = Math.round(monthlyBudget / avgCPC);
  const estimatedCTR = 3.5; // 3.5% average for medical/aesthetic search
  const estimatedConversionRate = 6.5; // 6.5% landing page conversion
  const estimatedLeads = Math.round(estimatedClicks * (estimatedConversionRate / 100));
  const avgBookingValue = 450; // blended average
  const bookingRate = 0.45; // 45% of leads become bookings
  const estimatedRevenue = estimatedLeads * bookingRate * avgBookingValue;
  const estimatedCPA = estimatedLeads > 0 ? Math.round(monthlyBudget / (estimatedLeads * bookingRate)) : 0;
  const estimatedROAS = monthlyBudget > 0 ? Math.round((estimatedRevenue / monthlyBudget) * 100) / 100 : 0;

  return {
    estimatedMonthlyClicks: estimatedClicks,
    estimatedMonthlyCost: monthlyBudget,
    estimatedCTR,
    estimatedConversionRate,
    estimatedLeads,
    estimatedCPA,
    estimatedROAS,
  };
}

// ── KEYWORD ANALYSIS UTILITIES ──

export function getKeywordOpportunityScore(keyword: Keyword): number {
  let score = 0;
  score += keyword.intentScore * 5; // max 50
  if (keyword.competition === 'low') score += 25;
  else if (keyword.competition === 'medium') score += 15;
  else score += 5;
  if (keyword.estimatedCPC < 10) score += 15;
  else if (keyword.estimatedCPC < 15) score += 8;
  if (keyword.monthlyVolume > 1000) score += 10;
  else if (keyword.monthlyVolume > 200) score += 5;
  return Math.min(100, score);
}

export function suggestNewKeywords(existingTerms: string[]): string[] {
  const suggestions: string[] = [];
  const services = ['botox', 'hydrafacial', 'GLP-1', 'semaglutide', 'filler', 'laser', 'sofwave', 'NAD+', 'peptide'];
  const modifiers = ['best', 'top rated', 'affordable', 'luxury', 'experienced', 'certified'];
  const locations = PNW_CITIES;

  for (const service of services) {
    for (const location of locations.slice(0, 5)) {
      const term = `${service} ${location.toLowerCase()}`;
      if (!existingTerms.includes(term)) {
        suggestions.push(term);
      }
    }
    for (const mod of modifiers.slice(0, 3)) {
      const term = `${mod} ${service} near me`;
      if (!existingTerms.includes(term)) {
        suggestions.push(term);
      }
    }
  }

  return suggestions.slice(0, 50);
}

export function calculateKeywordBudgetAllocation(
  keywords: Keyword[],
  totalBudget: number,
): Record<string, number> {
  const clusters: Record<string, { keywords: Keyword[]; totalVolume: number; avgIntent: number }> = {};

  for (const kw of keywords) {
    const cluster = kw.serviceId || kw.category;
    if (!clusters[cluster]) {
      clusters[cluster] = { keywords: [], totalVolume: 0, avgIntent: 0 };
    }
    clusters[cluster].keywords.push(kw);
    clusters[cluster].totalVolume += kw.monthlyVolume;
  }

  // Calculate weighted scores
  const scored: Record<string, number> = {};
  let totalScore = 0;

  for (const [cluster, data] of Object.entries(clusters)) {
    data.avgIntent = data.keywords.reduce((sum, k) => sum + k.intentScore, 0) / data.keywords.length;
    // Weight: 60% intent, 40% volume
    const score = (data.avgIntent / 10 * 0.6) + (Math.min(data.totalVolume / 10000, 1) * 0.4);
    scored[cluster] = score;
    totalScore += score;
  }

  // Allocate budget proportionally
  const allocation: Record<string, number> = {};
  for (const [cluster, score] of Object.entries(scored)) {
    allocation[cluster] = Math.round((score / totalScore) * totalBudget);
  }

  return allocation;
}
