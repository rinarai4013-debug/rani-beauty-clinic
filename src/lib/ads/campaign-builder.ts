/**
 * Ads War Machine — Campaign Auto-Builder Engine
 *
 * Generates complete Meta and Google campaign structures including:
 * - Campaign/Ad Set/Ad hierarchy for Meta
 * - Search/PMax campaign structures for Google
 * - Audience definitions (lookalike, interest, retargeting, custom)
 * - Keyword lists (50+ per service, exact/phrase/broad)
 * - Budget allocation by funnel stage
 * - Bid strategy recommendations
 * - Ad extensions (sitelinks, callouts, structured snippets)
 */

import { RANI_SERVICES, type ServiceProfile, type CopyFramework } from './creative-engine';

// ── TYPES ──

export type FunnelStage = 'tofu' | 'mofu' | 'bofu';
export type MetaObjective = 'awareness' | 'traffic' | 'leads' | 'conversions' | 'engagement';
export type GoogleMatchType = 'exact' | 'phrase' | 'broad';
export type GoogleBidStrategy = 'maximize_conversions' | 'target_cpa' | 'target_roas' | 'maximize_clicks' | 'manual_cpc';
export type AudienceType = 'interest' | 'lookalike' | 'retargeting' | 'custom' | 'broad';

export const FUNNEL_BUDGET_SPLIT: Record<FunnelStage, number> = {
  tofu: 0.40,
  mofu: 0.35,
  bofu: 0.25,
};

export const LOCATION_TARGETING = {
  center: 'Renton, WA',
  radius: 25,
  unit: 'miles' as const,
  includedCities: [
    'Renton', 'Bellevue', 'Kent', 'Tukwila', 'Newcastle',
    'Mercer Island', 'Issaquah', 'Kirkland', 'Redmond', 'Federal Way',
    'Auburn', 'SeaTac', 'Burien', 'Covington', 'Maple Valley',
  ],
};

// ── META CAMPAIGN STRUCTURE ──

export interface MetaCampaignStructure {
  campaign: MetaCampaignConfig;
  adSets: MetaAdSetConfig[];
  ads: MetaAdConfig[];
}

export interface MetaCampaignConfig {
  id: string;
  name: string;
  objective: MetaObjective;
  funnelStage: FunnelStage;
  dailyBudget: number;
  status: 'draft' | 'active' | 'paused';
  startDate: string;
  specialAdCategories: string[];
}

export interface MetaAdSetConfig {
  id: string;
  campaignId: string;
  name: string;
  audience: AudienceDefinition;
  placements: MetaPlacement[];
  dailyBudget: number;
  bidStrategy: 'lowest_cost' | 'cost_cap' | 'bid_cap';
  bidAmount?: number;
  schedule: { startTime?: string; endTime?: string; days?: number[] };
  optimizationGoal: 'leads' | 'landing_page_views' | 'link_clicks' | 'reach' | 'impressions';
}

export interface AudienceDefinition {
  id: string;
  name: string;
  type: AudienceType;
  ageMin: number;
  ageMax: number;
  genders: ('male' | 'female' | 'all')[];
  locations: typeof LOCATION_TARGETING;
  interests?: string[];
  behaviors?: string[];
  customAudienceSource?: string;
  lookalikeSource?: string;
  lookalikePercent?: number;
  excludeAudiences?: string[];
  estimatedSize?: string;
}

export type MetaPlacement = 'feed' | 'stories' | 'reels' | 'explore' | 'search' | 'messenger' | 'audience_network';

export interface MetaAdConfig {
  id: string;
  adSetId: string;
  name: string;
  creative: {
    headline: string;
    primaryText: string;
    description: string;
    callToAction: string;
    framework: CopyFramework;
    visualTemplate?: string;
  };
  trackingUrl: string;
  status: 'draft' | 'active' | 'paused';
}

// ── GOOGLE CAMPAIGN STRUCTURE ──

export interface GoogleCampaignStructure {
  campaign: GoogleCampaignConfig;
  adGroups: GoogleAdGroupConfig[];
  extensions: GoogleExtensions;
}

export interface GoogleCampaignConfig {
  id: string;
  name: string;
  type: 'search' | 'performance_max' | 'display' | 'video';
  dailyBudget: number;
  bidStrategy: GoogleBidStrategy;
  targetCPA?: number;
  targetROAS?: number;
  locationTargeting: typeof LOCATION_TARGETING;
  networkSettings: { searchNetwork: boolean; displayNetwork: boolean; searchPartners: boolean };
  status: 'draft' | 'active' | 'paused';
}

export interface GoogleAdGroupConfig {
  id: string;
  campaignId: string;
  name: string;
  service: string;
  keywords: GoogleKeyword[];
  negativeKeywords: string[];
  ads: GoogleAdConfig[];
  defaultBid?: number;
}

export interface GoogleKeyword {
  text: string;
  matchType: GoogleMatchType;
  bid?: number;
  estimatedCPC?: number;
  estimatedVolume?: number;
}

export interface GoogleAdConfig {
  id: string;
  adGroupId: string;
  type: 'responsive_search' | 'responsive_display';
  headlines: string[];
  descriptions: string[];
  pinnedHeadlines?: Record<number, number>;
  finalUrl: string;
  displayUrl: string;
  path1?: string;
  path2?: string;
}

export interface GoogleExtensions {
  sitelinks: SitelinkExtension[];
  callouts: string[];
  structuredSnippets: { header: string; values: string[] }[];
  callExtension?: { phoneNumber: string; countryCode: string };
  locationExtension?: { address: string };
  priceExtensions?: { header: string; price: string; description: string; finalUrl: string }[];
}

export interface SitelinkExtension {
  text: string;
  description1: string;
  description2: string;
  finalUrl: string;
}

// ── AUDIENCE DEFINITIONS ──

const SERVICE_CATEGORY_AUDIENCES: Record<string, AudienceDefinition> = {
  injectable: {
    id: 'aud-injectable',
    name: 'Injectable Enthusiasts',
    type: 'interest',
    ageMin: 28, ageMax: 55,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    interests: [
      'Botox', 'Dermal fillers', 'Anti-aging', 'Medical aesthetics', 'Cosmetic procedures',
      'Beauty treatments', 'Skincare', 'Self-care', 'Spa and wellness', 'Luxury beauty',
    ],
    behaviors: ['Engaged shoppers', 'Health and beauty buyers'],
    estimatedSize: '120,000-180,000',
  },
  laser: {
    id: 'aud-laser',
    name: 'Laser Treatment Seekers',
    type: 'interest',
    ageMin: 30, ageMax: 60,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    interests: [
      'Laser skin treatment', 'Skin tightening', 'Skin rejuvenation', 'Anti-aging technology',
      'Dermatology', 'Medical spa', 'Body contouring', 'Skin resurfacing',
    ],
    behaviors: ['High-end beauty consumers', 'Technology early adopters'],
    estimatedSize: '80,000-120,000',
  },
  facial: {
    id: 'aud-facial',
    name: 'Facial Treatment Lovers',
    type: 'interest',
    ageMin: 25, ageMax: 55,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    interests: [
      'Facial treatments', 'HydraFacial', 'Chemical peel', 'Skincare routine', 'Glow skin',
      'Facial spa', 'Medical facial', 'Skin health', 'Beauty routine', 'Korean skincare',
    ],
    behaviors: ['Regular spa-goers', 'Skincare enthusiasts'],
    estimatedSize: '150,000-220,000',
  },
  wellness: {
    id: 'aud-wellness',
    name: 'Wellness & Weight Loss Seekers',
    type: 'interest',
    ageMin: 25, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    interests: [
      'Weight loss', 'GLP-1', 'Semaglutide', 'Health and wellness', 'Vitamin therapy',
      'NAD+', 'Immune boosting', 'Biohacking', 'Functional medicine', 'Wellness injection',
    ],
    behaviors: ['Health-conscious consumers', 'Fitness enthusiasts'],
    estimatedSize: '200,000-300,000',
  },
  skincare: {
    id: 'aud-skincare',
    name: 'Rx Skincare Seekers',
    type: 'interest',
    ageMin: 25, ageMax: 55,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    interests: [
      'Tretinoin', 'Prescription skincare', 'Anti-aging skincare', 'Retinol',
      'Medical-grade skincare', 'Skincare subscription', 'Dermatologist recommended',
    ],
    estimatedSize: '90,000-130,000',
  },
  body: {
    id: 'aud-body',
    name: 'Body Treatment Seekers',
    type: 'interest',
    ageMin: 25, ageMax: 55,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    interests: [
      'Body sculpting', 'Hair removal', 'Laser hair removal', 'Body confidence',
      'Smooth skin', 'Hair restoration', 'Permanent hair removal',
    ],
    estimatedSize: '100,000-160,000',
  },
};

export const RETARGETING_AUDIENCES: AudienceDefinition[] = [
  {
    id: 'retarget-website-all',
    name: 'All Website Visitors (30 days)',
    type: 'retargeting',
    ageMin: 18, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    customAudienceSource: 'pixel_website_visitors_30d',
    excludeAudiences: ['existing_clients_90d'],
    estimatedSize: '2,000-5,000',
  },
  {
    id: 'retarget-service-pages',
    name: 'Service Page Visitors (14 days)',
    type: 'retargeting',
    ageMin: 18, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    customAudienceSource: 'pixel_service_page_visitors_14d',
    excludeAudiences: ['existing_clients_90d', 'converted_leads_30d'],
    estimatedSize: '500-2,000',
  },
  {
    id: 'retarget-booking-abandon',
    name: 'Booking Abandoners (7 days)',
    type: 'retargeting',
    ageMin: 18, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    customAudienceSource: 'pixel_booking_page_no_conversion_7d',
    excludeAudiences: ['converted_leads_30d'],
    estimatedSize: '100-500',
  },
  {
    id: 'retarget-past-clients',
    name: 'Past Clients Reactivation (90-180 days)',
    type: 'retargeting',
    ageMin: 18, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    customAudienceSource: 'crm_clients_90_180d_no_visit',
    estimatedSize: '200-800',
  },
  {
    id: 'retarget-video-viewers',
    name: 'Video/Reel Viewers (30 days)',
    type: 'retargeting',
    ageMin: 18, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    customAudienceSource: 'ig_video_viewers_75pct_30d',
    excludeAudiences: ['existing_clients_90d'],
    estimatedSize: '1,000-3,000',
  },
  {
    id: 'retarget-ig-engagers',
    name: 'Instagram Engagers (60 days)',
    type: 'retargeting',
    ageMin: 18, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    customAudienceSource: 'ig_profile_engagers_60d',
    excludeAudiences: ['existing_clients_90d'],
    estimatedSize: '2,000-8,000',
  },
];

export const LOOKALIKE_AUDIENCES: AudienceDefinition[] = [
  {
    id: 'lal-clients-1pct',
    name: 'Lookalike — Top Clients (1%)',
    type: 'lookalike',
    ageMin: 25, ageMax: 60,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    lookalikeSource: 'crm_top_20pct_ltv_clients',
    lookalikePercent: 1,
    excludeAudiences: ['existing_clients_all', 'retarget-website-all'],
    estimatedSize: '800,000-1,200,000',
  },
  {
    id: 'lal-clients-3pct',
    name: 'Lookalike — Top Clients (3%)',
    type: 'lookalike',
    ageMin: 25, ageMax: 60,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    lookalikeSource: 'crm_top_20pct_ltv_clients',
    lookalikePercent: 3,
    excludeAudiences: ['existing_clients_all', 'retarget-website-all'],
    estimatedSize: '2,400,000-3,600,000',
  },
  {
    id: 'lal-clients-5pct',
    name: 'Lookalike — Top Clients (5%)',
    type: 'lookalike',
    ageMin: 25, ageMax: 65,
    genders: ['all'],
    locations: LOCATION_TARGETING,
    lookalikeSource: 'crm_top_20pct_ltv_clients',
    lookalikePercent: 5,
    excludeAudiences: ['existing_clients_all'],
    estimatedSize: '4,000,000-6,000,000',
  },
  {
    id: 'lal-converters-1pct',
    name: 'Lookalike — Recent Converters (1%)',
    type: 'lookalike',
    ageMin: 25, ageMax: 55,
    genders: ['female'],
    locations: LOCATION_TARGETING,
    lookalikeSource: 'pixel_purchasers_90d',
    lookalikePercent: 1,
    excludeAudiences: ['existing_clients_all'],
    estimatedSize: '800,000-1,200,000',
  },
];

export const EXCLUSION_LISTS = [
  { id: 'existing_clients_all', name: 'All Existing Clients', source: 'crm_all_clients' },
  { id: 'existing_clients_90d', name: 'Active Clients (last 90 days)', source: 'crm_clients_visited_90d' },
  { id: 'converted_leads_30d', name: 'Recently Converted Leads', source: 'crm_new_bookings_30d' },
  { id: 'opted_out', name: 'Opted-Out / Do Not Target', source: 'crm_opted_out' },
  { id: 'employees', name: 'Employees & Staff', source: 'manual_employee_list' },
];

// ── KEYWORD DATABASE (Google Ads) ──

const SERVICE_KEYWORDS: Record<string, GoogleKeyword[]> = {};

function kw(text: string, matchType: GoogleMatchType, volume?: number, cpc?: number): GoogleKeyword {
  return { text, matchType, estimatedVolume: volume, estimatedCPC: cpc };
}

// Generate comprehensive keyword lists per service
for (const service of RANI_SERVICES) {
  const base = service.name.toLowerCase();
  const keywords: GoogleKeyword[] = [
    // Exact match — high intent
    kw(`${base} renton`, 'exact', 150, 8.50),
    kw(`${base} near me`, 'exact', 500, 7.20),
    kw(`${base} renton wa`, 'exact', 90, 8.00),
    kw(`${base} bellevue`, 'exact', 200, 9.00),
    kw(`${base} kent wa`, 'exact', 80, 7.50),
    kw(`best ${base} renton`, 'exact', 60, 9.50),
    kw(`${base} cost`, 'exact', 300, 5.00),
    kw(`${base} price`, 'exact', 250, 5.20),
    kw(`${base} clinic near me`, 'exact', 120, 8.80),
    kw(`${base} specialist`, 'exact', 100, 9.20),
    // Phrase match — medium intent
    kw(`${base} treatment`, 'phrase', 400, 6.00),
    kw(`${base} results`, 'phrase', 200, 4.50),
    kw(`${base} before and after`, 'phrase', 350, 3.80),
    kw(`${base} reviews`, 'phrase', 180, 4.00),
    kw(`medical spa ${base}`, 'phrase', 150, 7.00),
    kw(`${base} medspa`, 'phrase', 120, 7.50),
    kw(`${base} appointment`, 'phrase', 90, 8.00),
    kw(`${base} consultation`, 'phrase', 110, 6.50),
    kw(`${base} deals`, 'phrase', 200, 4.00),
    kw(`affordable ${base}`, 'phrase', 160, 5.50),
    // Broad match — awareness
    kw(`${base}`, 'broad', 2000, 4.00),
    kw(`${base} treatment options`, 'broad', 300, 3.50),
    kw(`how much does ${base} cost`, 'broad', 250, 4.80),
    kw(`is ${base} worth it`, 'broad', 180, 3.20),
    kw(`${base} recovery time`, 'broad', 150, 2.80),
    // Service-specific keywords from profiles
    ...service.keywords.map(k => kw(k, 'exact', 100, 7.00)),
    ...service.keywords.map(k => kw(k, 'phrase', 200, 5.50)),
  ];

  // Add category-specific bonus keywords
  if (service.category === 'injectable') {
    keywords.push(
      kw('medspa injections renton', 'exact', 80, 8.00),
      kw('cosmetic injections near me', 'exact', 200, 9.00),
      kw('aesthetic injections', 'phrase', 300, 7.50),
      kw('facial injections renton wa', 'exact', 60, 8.50),
      kw('anti-aging injections', 'phrase', 250, 7.00),
    );
  }
  if (service.category === 'laser') {
    keywords.push(
      kw('laser treatment renton', 'exact', 120, 8.00),
      kw('laser skin treatment near me', 'exact', 200, 8.50),
      kw('medical laser treatment', 'phrase', 180, 7.00),
      kw('non-invasive skin treatment', 'phrase', 250, 6.00),
      kw('skin laser clinic', 'phrase', 150, 7.50),
    );
  }
  if (service.category === 'wellness') {
    keywords.push(
      kw('wellness clinic renton', 'exact', 100, 6.00),
      kw('medical weight loss near me', 'exact', 300, 12.00),
      kw('vitamin injection near me', 'exact', 150, 5.50),
      kw('weight loss clinic renton', 'exact', 120, 11.00),
      kw('hormone therapy near me', 'phrase', 200, 10.00),
    );
  }

  SERVICE_KEYWORDS[service.id] = keywords;
}

export const NEGATIVE_KEYWORDS = [
  // Competitor terms
  'botox groupon', 'cheap botox', 'discount filler', 'bargain medspa',
  // DIY / non-professional
  'diy botox', 'at home filler', 'self injection', 'buy botox online',
  'botox amazon', 'filler aliexpress', 'homemade peel',
  // Free / no intent
  'free botox', 'free filler', 'botox giveaway', 'free consultation online',
  // Irrelevant
  'botox for migraines', 'botox side effects lawsuit', 'botox recall',
  'filler gone wrong', 'botox horror stories', 'worst medspa',
  // Job seekers
  'medspa jobs', 'injector salary', 'botox training course', 'aesthetician school',
  'how to become injector', 'medspa franchise',
  // Other locations
  'botox seattle downtown', 'botox tacoma', 'botox portland',
  // Low quality
  'cheapest', 'lowest price', 'coupon code', 'promo code',
];

// ── GOOGLE AD EXTENSIONS ──

export const SITELINK_EXTENSIONS: SitelinkExtension[] = [
  {
    text: 'Book Free Consultation',
    description1: 'Personalized treatment plan',
    description2: 'from our expert team',
    finalUrl: 'https://ranibeautyclinic.com/book',
  },
  {
    text: 'See Our Services',
    description1: 'Injectables, laser, facials',
    description2: 'wellness and more',
    finalUrl: 'https://ranibeautyclinic.com/services',
  },
  {
    text: 'View Before & After',
    description1: 'Real client transformations',
    description2: 'verified results gallery',
    finalUrl: 'https://ranibeautyclinic.com/results',
  },
  {
    text: 'Membership Plans',
    description1: 'Save 15-25% on treatments',
    description2: 'exclusive member benefits',
    finalUrl: 'https://ranibeautyclinic.com/memberships',
  },
  {
    text: 'GLP-1 Weight Loss',
    description1: 'Physician-supervised program',
    description2: 'from $399/month',
    finalUrl: 'https://ranibeautyclinic.com/glp1',
  },
  {
    text: 'Financing Available',
    description1: 'Affordable payment plans',
    description2: '0% APR options available',
    finalUrl: 'https://ranibeautyclinic.com/financing',
  },
];

export const CALLOUT_EXTENSIONS = [
  'Physician-Supervised',
  'Free Consultations',
  'Luxury Clinical Environment',
  '5-Star Rated',
  'Financing Available',
  'Same-Week Appointments',
  'All Skin Types Welcome',
  'Personalized Treatment Plans',
];

export const STRUCTURED_SNIPPETS = [
  { header: 'Services', values: ['Botox', 'Fillers', 'HydraFacial', 'Sofwave', 'Laser Hair Removal', 'GLP-1 Weight Loss'] },
  { header: 'Treatments', values: ['RF Microneedling', 'VI Peel', 'PRX-T33', 'PicoWay', 'Wellness Injections'] },
  { header: 'Amenities', values: ['Free Parking', 'Luxury Suite', 'Complimentary Consultation', 'Refreshments'] },
];

// ── CAMPAIGN BUILDERS ──

/**
 * Build a complete Meta campaign structure for a funnel stage
 */
export function buildMetaCampaign(config: {
  funnelStage: FunnelStage;
  services: ServiceProfile[];
  dailyBudget: number;
  objective?: MetaObjective;
  frameworks?: CopyFramework[];
}): MetaCampaignStructure {
  const { funnelStage, services, dailyBudget } = config;

  const objectiveMap: Record<FunnelStage, MetaObjective> = {
    tofu: 'awareness',
    mofu: 'leads',
    bofu: 'conversions',
  };
  const objective = config.objective || objectiveMap[funnelStage];

  const frameworkMap: Record<FunnelStage, CopyFramework[]> = {
    tofu: ['educational', 'stat', 'lifestyle', 'social_proof', 'question'],
    mofu: ['pas', 'bab', 'testimonial', 'comparison', 'authority'],
    bofu: ['urgency', 'aida', 'fab', 'story', 'seasonal'],
  };
  const frameworks = config.frameworks || frameworkMap[funnelStage];

  const campaign: MetaCampaignConfig = {
    id: `meta-${funnelStage}-${Date.now()}`,
    name: `Rani ${funnelStage.toUpperCase()} — ${objective} — ${services.map(s => s.name).join(', ')}`,
    objective,
    funnelStage,
    dailyBudget,
    status: 'draft',
    startDate: new Date().toISOString().split('T')[0],
    specialAdCategories: [],
  };

  // Build ad sets — one per audience type
  const audienceTypes = getAudiencesForStage(funnelStage, services);
  const adSetBudget = dailyBudget / audienceTypes.length;

  const adSets: MetaAdSetConfig[] = audienceTypes.map((audience, i) => ({
    id: `adset-${funnelStage}-${i}-${Date.now()}`,
    campaignId: campaign.id,
    name: `${audience.name} — ${services.map(s => s.name).join('/')}`,
    audience,
    placements: getPlacementsForStage(funnelStage),
    dailyBudget: Math.round(adSetBudget * 100) / 100,
    bidStrategy: funnelStage === 'bofu' ? 'cost_cap' : 'lowest_cost',
    schedule: {},
    optimizationGoal: funnelStage === 'tofu' ? 'reach' : funnelStage === 'mofu' ? 'landing_page_views' : 'leads',
  }));

  // Build ads — one per framework per ad set
  const ads: MetaAdConfig[] = adSets.flatMap(adSet =>
    frameworks.slice(0, 3).map((framework, fi) => {
      const service = services[fi % services.length];
      return {
        id: `ad-${adSet.id}-${fi}-${Date.now()}`,
        adSetId: adSet.id,
        name: `${service.name} — ${framework} — v${fi + 1}`,
        creative: {
          headline: getFrameworkHeadline(framework, service),
          primaryText: getFrameworkPrimaryText(framework, service),
          description: `${service.topBenefit}. Physician-supervised at Rani Beauty Clinic.`,
          callToAction: funnelStage === 'tofu' ? 'Learn More' : funnelStage === 'mofu' ? 'See Results' : 'Book Now',
          framework,
        },
        trackingUrl: `https://ranibeautyclinic.com/${service.id}?utm_source=meta&utm_medium=paid&utm_campaign=${funnelStage}&utm_content=${framework}`,
        status: 'draft' as const,
      };
    })
  );

  return { campaign, adSets, ads };
}

/**
 * Build complete Meta campaign set — TOFU + MOFU + BOFU
 */
export function buildFullMetaFunnel(services: ServiceProfile[], totalDailyBudget: number): MetaCampaignStructure[] {
  return (['tofu', 'mofu', 'bofu'] as FunnelStage[]).map(stage =>
    buildMetaCampaign({
      funnelStage: stage,
      services,
      dailyBudget: Math.round(totalDailyBudget * FUNNEL_BUDGET_SPLIT[stage] * 100) / 100,
    })
  );
}

/**
 * Build a Google Search campaign for a service
 */
export function buildGoogleSearchCampaign(config: {
  services: ServiceProfile[];
  dailyBudget: number;
  bidStrategy?: GoogleBidStrategy;
  targetCPA?: number;
}): GoogleCampaignStructure {
  const { services, dailyBudget, bidStrategy = 'maximize_conversions', targetCPA } = config;

  const campaign: GoogleCampaignConfig = {
    id: `google-search-${Date.now()}`,
    name: `Rani Search — ${services.map(s => s.name).join(', ')}`,
    type: 'search',
    dailyBudget,
    bidStrategy,
    targetCPA,
    locationTargeting: LOCATION_TARGETING,
    networkSettings: { searchNetwork: true, displayNetwork: false, searchPartners: true },
    status: 'draft',
  };

  const adGroups: GoogleAdGroupConfig[] = services.map(service => ({
    id: `ag-${service.id}-${Date.now()}`,
    campaignId: campaign.id,
    name: `${service.name} — Search`,
    service: service.id,
    keywords: SERVICE_KEYWORDS[service.id] || [],
    negativeKeywords: NEGATIVE_KEYWORDS,
    ads: [{
      id: `rsa-${service.id}-${Date.now()}`,
      adGroupId: `ag-${service.id}-${Date.now()}`,
      type: 'responsive_search',
      headlines: generateGoogleHeadlines(service),
      descriptions: generateGoogleDescriptions(service),
      pinnedHeadlines: { 1: 0 },
      finalUrl: `https://ranibeautyclinic.com/${service.id === 'consultation' ? 'book' : service.id}`,
      displayUrl: `ranibeautyclinic.com/${service.id}`,
      path1: service.name.toLowerCase().replace(/\s+/g, '-').slice(0, 15),
      path2: 'book',
    }],
  }));

  return {
    campaign,
    adGroups,
    extensions: {
      sitelinks: SITELINK_EXTENSIONS,
      callouts: CALLOUT_EXTENSIONS,
      structuredSnippets: STRUCTURED_SNIPPETS,
      callExtension: { phoneNumber: '+14255557264', countryCode: 'US' },
      locationExtension: { address: '401 Olympia Ave NE #101, Renton, WA 98056' },
      priceExtensions: services.slice(0, 5).map(s => ({
        header: s.name,
        price: s.priceRange,
        description: s.topBenefit.slice(0, 25),
        finalUrl: `https://ranibeautyclinic.com/${s.id}`,
      })),
    },
  };
}

/**
 * Build Google Performance Max campaign
 */
export function buildGooglePMaxCampaign(services: ServiceProfile[], dailyBudget: number): GoogleCampaignStructure {
  const campaign: GoogleCampaignConfig = {
    id: `google-pmax-${Date.now()}`,
    name: `Rani PMax — Full Service Catalog`,
    type: 'performance_max',
    dailyBudget,
    bidStrategy: 'maximize_conversions',
    locationTargeting: LOCATION_TARGETING,
    networkSettings: { searchNetwork: true, displayNetwork: true, searchPartners: true },
    status: 'draft',
  };

  const adGroups: GoogleAdGroupConfig[] = [{
    id: `ag-pmax-all-${Date.now()}`,
    campaignId: campaign.id,
    name: 'All Services — PMax Asset Group',
    service: 'all',
    keywords: [],
    negativeKeywords: NEGATIVE_KEYWORDS,
    ads: [{
      id: `pmax-ad-${Date.now()}`,
      adGroupId: `ag-pmax-all-${Date.now()}`,
      type: 'responsive_search',
      headlines: [
        'Rani Beauty Clinic — Renton',
        'Physician-Supervised Treatments',
        'Where Science Meets Luxury',
        'Book Your Free Consultation',
        'Botox, Fillers & More',
        'HydraFacial from $249',
        'GLP-1 Weight Loss Program',
        'Sofwave Skin Tightening',
        '5-Star Rated Medical Spa',
        'Same-Week Appointments',
        'Financing Available',
        'Transform Your Confidence',
        'Expert Aesthetic Care',
        'Luxury Medical Aesthetics',
        'New Client Welcome',
      ].map(h => h.slice(0, 30)),
      descriptions: [
        'Physician-supervised aesthetic treatments in a luxury clinical environment. Book your free consultation today.',
        'Botox, fillers, HydraFacial, laser treatments & more. 5-star rated medical spa in Renton, WA.',
        'Transform your confidence with expert care. GLP-1 weight loss, skin tightening, and injectable specialists.',
        'Same-week appointments available. Financing options. Personalized treatment plans for every client.',
      ].map(d => d.slice(0, 90)),
      finalUrl: 'https://ranibeautyclinic.com',
      displayUrl: 'ranibeautyclinic.com',
    }],
  }];

  return {
    campaign,
    adGroups,
    extensions: {
      sitelinks: SITELINK_EXTENSIONS,
      callouts: CALLOUT_EXTENSIONS,
      structuredSnippets: STRUCTURED_SNIPPETS,
    },
  };
}

// ── HELPERS ──

function getAudiencesForStage(stage: FunnelStage, services: ServiceProfile[]): AudienceDefinition[] {
  const categories = [...new Set(services.map(s => s.category))];

  switch (stage) {
    case 'tofu':
      return [
        ...categories.map(c => SERVICE_CATEGORY_AUDIENCES[c]).filter(Boolean),
        ...LOOKALIKE_AUDIENCES.filter(a => a.lookalikePercent === 3 || a.lookalikePercent === 5),
      ];
    case 'mofu':
      return [
        ...LOOKALIKE_AUDIENCES.filter(a => a.lookalikePercent === 1),
        ...RETARGETING_AUDIENCES.filter(a => a.id === 'retarget-ig-engagers' || a.id === 'retarget-video-viewers'),
      ];
    case 'bofu':
      return RETARGETING_AUDIENCES.filter(a =>
        a.id === 'retarget-website-all' || a.id === 'retarget-service-pages' ||
        a.id === 'retarget-booking-abandon' || a.id === 'retarget-past-clients'
      );
  }
}

function getPlacementsForStage(stage: FunnelStage): MetaPlacement[] {
  switch (stage) {
    case 'tofu': return ['feed', 'stories', 'reels', 'explore'];
    case 'mofu': return ['feed', 'stories', 'reels', 'search'];
    case 'bofu': return ['feed', 'stories', 'messenger'];
  }
}

function getFrameworkHeadline(framework: CopyFramework, service: ServiceProfile): string {
  const map: Record<CopyFramework, string> = {
    pas: `Tired of ${service.painPoints[0].split(' ').slice(0, 4).join(' ')}?`,
    aida: `${service.name}: ${service.results[0].split(' ').slice(0, 5).join(' ')}`,
    bab: `From Frustration to Confidence`,
    fab: `${service.name} — ${service.topBenefit.split(' ').slice(0, 5).join(' ')}`,
    story: `Her ${service.name} Journey`,
    question: `What if ${service.name} could change everything?`,
    stat: service.socialProofStat,
    testimonial: `"${service.name} at Rani Changed Everything"`,
    social_proof: `Join hundreds — ${service.name}`,
    urgency: `Limited ${service.name} Slots`,
    authority: `Physician-Supervised ${service.name}`,
    educational: `What You Need to Know: ${service.name}`,
    comparison: `${service.name} vs. At-Home`,
    lifestyle: `Confidence Starts Here`,
    seasonal: `This Season: ${service.name}`,
  };
  return map[framework];
}

function getFrameworkPrimaryText(framework: CopyFramework, service: ServiceProfile): string {
  return `${service.topBenefit}. ${service.results[0]}. Starting at ${service.priceRange}. Book at Rani Beauty Clinic — physician-supervised luxury care in Renton, WA.`;
}

function generateGoogleHeadlines(service: ServiceProfile): string[] {
  return [
    `${service.name} at Rani Clinic`,
    `${service.name} in Renton WA`,
    `Physician-Supervised ${service.name}`,
    `Best ${service.name} Near You`,
    `${service.name} from ${service.priceRange}`,
    service.results[0].slice(0, 30),
    `Book ${service.name} Today`,
    `Free ${service.name} Consult`,
    `Luxury ${service.name}`,
    service.socialProofStat.slice(0, 30),
    `${service.name} Specialist`,
    `Same-Week ${service.name}`,
    'Where Science Meets Luxury',
    `Expert ${service.name} Care`,
    'Financing Available',
  ].map(h => h.slice(0, 30));
}

function generateGoogleDescriptions(service: ServiceProfile): string[] {
  return [
    `${service.topBenefit}. Physician-supervised care at Rani Beauty Clinic. Book your free consultation.`,
    `${service.socialProofStat}. ${service.name} in our luxury Renton clinic. ${service.timeframe}.`,
    `${service.results[0]}. ${service.results[1]}. Starting at ${service.priceRange}.`,
    `Expert ${service.name} in Renton, WA. ${service.timeframe}. 5-star rated. Schedule today.`,
  ].map(d => d.slice(0, 90));
}

/**
 * Get keyword list for a specific service
 */
export function getKeywordsForService(serviceId: string): GoogleKeyword[] {
  return SERVICE_KEYWORDS[serviceId] || [];
}

/**
 * Get all audiences across all types
 */
export function getAllAudiences(): {
  interest: AudienceDefinition[];
  retargeting: AudienceDefinition[];
  lookalike: AudienceDefinition[];
} {
  return {
    interest: Object.values(SERVICE_CATEGORY_AUDIENCES),
    retargeting: RETARGETING_AUDIENCES,
    lookalike: LOOKALIKE_AUDIENCES,
  };
}

/**
 * Calculate recommended bid strategy based on campaign goals
 */
export function recommendBidStrategy(config: {
  objective: MetaObjective | 'search';
  dailyBudget: number;
  hasConversionData: boolean;
  targetCPA?: number;
}): { strategy: GoogleBidStrategy; reason: string } {
  const { objective, dailyBudget, hasConversionData, targetCPA } = config;

  if (targetCPA && hasConversionData) {
    return { strategy: 'target_cpa', reason: `Target CPA of $${targetCPA} with sufficient conversion history` };
  }
  if (hasConversionData && dailyBudget > 50) {
    return { strategy: 'maximize_conversions', reason: 'Sufficient budget and conversion data for smart bidding' };
  }
  if (dailyBudget < 30) {
    return { strategy: 'manual_cpc', reason: 'Low budget — manual control prevents overspend' };
  }
  return { strategy: 'maximize_clicks', reason: 'Building conversion data — maximize traffic first' };
}
