/**
 * Rani Beauty Clinic - Market Intelligence Aggregator
 *
 * Industry news, competitor monitoring, FDA tracking, product news,
 * regulation changes, and treatment trend detection for the CEO morning briefing.
 */

// ── RSS Feed Sources ──────────────────────────────────────────

export interface RSSFeedSource {
  name: string;
  url: string;
  category: 'industry' | 'clinical' | 'consumer' | 'regulatory';
  priority: number; // 1 = highest
}

export const INDUSTRY_RSS_FEEDS: RSSFeedSource[] = [
  { name: 'The Aesthetic Society', url: 'https://www.theaestheticsociety.org/feed', category: 'clinical', priority: 1 },
  { name: 'ASPS News', url: 'https://www.plasticsurgery.org/news/rss', category: 'clinical', priority: 1 },
  { name: 'Dermascope Magazine', url: 'https://www.dermascope.com/rss', category: 'industry', priority: 2 },
  { name: 'MedEsthetics', url: 'https://www.medestheticsmag.com/rss', category: 'industry', priority: 2 },
  { name: 'Modern Aesthetics', url: 'https://www.modernaesthetics.com/rss', category: 'industry', priority: 2 },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss', category: 'consumer', priority: 3 },
  { name: 'NewBeauty', url: 'https://www.newbeauty.com/feed/', category: 'consumer', priority: 3 },
  { name: 'Dermatology Times', url: 'https://www.dermatologytimes.com/rss', category: 'clinical', priority: 2 },
];

// ── RSS Feed Item ─────────────────────────────────────────────

export interface RSSFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
  relevanceScore: number; // 0-100
}

// ── Competitor Data Structures ────────────────────────────────

export interface LocalCompetitor {
  name: string;
  placeId: string;
  address: string;
  phone: string;
  website: string;
  googleRating: number;
  reviewCount: number;
  priceLevel: number; // 1-4
  categories: string[];
  location: { lat: number; lng: number };
  operatingHours: Record<string, string>;
  lastUpdated: string;
}

export const LOCAL_COMPETITORS: LocalCompetitor[] = [
  {
    name: 'Allure Esthetic',
    placeId: 'ChIJ_allure_renton',
    address: '300 Rainier Ave S, Renton, WA 98057',
    phone: '(425) 555-0101',
    website: 'https://allureesthetic.com',
    googleRating: 4.8,
    reviewCount: 312,
    priceLevel: 3,
    categories: ['medspa', 'laser', 'injectable'],
    location: { lat: 47.4799, lng: -122.2034 },
    operatingHours: { 'Mon-Fri': '9AM-6PM', 'Sat': '10AM-4PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'The Skin Clinic',
    placeId: 'ChIJ_skinclinic_bellevue',
    address: '1515 116th Ave NE, Bellevue, WA 98004',
    phone: '(425) 555-0102',
    website: 'https://theskinclinicwa.com',
    googleRating: 4.7,
    reviewCount: 287,
    priceLevel: 3,
    categories: ['dermatology', 'medspa', 'skincare'],
    location: { lat: 47.6162, lng: -122.1878 },
    operatingHours: { 'Mon-Fri': '8AM-5PM', 'Sat': '9AM-3PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'Eastside Aesthetics & Wellness',
    placeId: 'ChIJ_eastside_kirkland',
    address: '12040 98th Ave NE, Kirkland, WA 98034',
    phone: '(425) 555-0103',
    website: 'https://eastsideaesthetics.com',
    googleRating: 4.9,
    reviewCount: 198,
    priceLevel: 4,
    categories: ['medspa', 'injectable', 'wellness'],
    location: { lat: 47.6990, lng: -122.1874 },
    operatingHours: { 'Mon-Fri': '9AM-7PM', 'Sat': '10AM-5PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'Pacific Dermatology & Cosmetic Center',
    placeId: 'ChIJ_pacific_seattle',
    address: '1200 5th Ave, Seattle, WA 98101',
    phone: '(206) 555-0104',
    website: 'https://pacificderm.com',
    googleRating: 4.6,
    reviewCount: 445,
    priceLevel: 4,
    categories: ['dermatology', 'medspa', 'surgical'],
    location: { lat: 47.6062, lng: -122.3321 },
    operatingHours: { 'Mon-Fri': '8AM-5PM', 'Sat': 'Closed', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'Aesthetica MedSpa',
    placeId: 'ChIJ_aesthetica_renton',
    address: '4500 Talbot Rd S, Renton, WA 98055',
    phone: '(425) 555-0105',
    website: 'https://aestheticamedspa.com',
    googleRating: 4.5,
    reviewCount: 156,
    priceLevel: 2,
    categories: ['medspa', 'laser', 'facial'],
    location: { lat: 47.4615, lng: -122.1988 },
    operatingHours: { 'Mon-Fri': '10AM-6PM', 'Sat': '10AM-4PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'Bellevue Skin & Laser Center',
    placeId: 'ChIJ_bellevue_skin_laser',
    address: '1135 116th Ave NE, Bellevue, WA 98004',
    phone: '(425) 555-0106',
    website: 'https://bellevueskinlaser.com',
    googleRating: 4.8,
    reviewCount: 523,
    priceLevel: 4,
    categories: ['medspa', 'laser', 'skincare', 'body'],
    location: { lat: 47.6160, lng: -122.1880 },
    operatingHours: { 'Mon-Fri': '8AM-6PM', 'Sat': '9AM-4PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'Renew MedSpa & Wellness',
    placeId: 'ChIJ_renew_kent',
    address: '25625 104th Ave SE, Kent, WA 98030',
    phone: '(253) 555-0107',
    website: 'https://renewmedspawa.com',
    googleRating: 4.4,
    reviewCount: 89,
    priceLevel: 2,
    categories: ['medspa', 'injectable', 'wellness'],
    location: { lat: 47.3810, lng: -122.2017 },
    operatingHours: { 'Mon-Fri': '9AM-6PM', 'Sat': '10AM-3PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'Glow Dermatology',
    placeId: 'ChIJ_glow_issaquah',
    address: '775 NW Gilman Blvd, Issaquah, WA 98027',
    phone: '(425) 555-0108',
    website: 'https://glowderm.com',
    googleRating: 4.7,
    reviewCount: 234,
    priceLevel: 3,
    categories: ['dermatology', 'medspa', 'skincare'],
    location: { lat: 47.5301, lng: -122.0326 },
    operatingHours: { 'Mon-Fri': '8AM-5PM', 'Sat': '9AM-2PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
  {
    name: 'SkinSpirit Bellevue',
    placeId: 'ChIJ_skinspirit_bellevue',
    address: '10500 NE 8th St, Bellevue, WA 98004',
    phone: '(425) 555-0109',
    website: 'https://www.skinspirit.com/bellevue',
    googleRating: 4.8,
    reviewCount: 389,
    priceLevel: 4,
    categories: ['medspa', 'injectable', 'laser', 'facial'],
    location: { lat: 47.6200, lng: -122.2010 },
    operatingHours: { 'Mon-Fri': '9AM-7PM', 'Sat': '9AM-5PM', 'Sun': '10AM-4PM' },
    lastUpdated: '',
  },
  {
    name: 'RejuvenationMD Aesthetics',
    placeId: 'ChIJ_rejuvenation_bothell',
    address: '18920 Bothell Way NE, Bothell, WA 98011',
    phone: '(425) 555-0110',
    website: 'https://rejuvenationmd.com',
    googleRating: 4.6,
    reviewCount: 267,
    priceLevel: 3,
    categories: ['medspa', 'injectable', 'laser', 'body'],
    location: { lat: 47.7623, lng: -122.2054 },
    operatingHours: { 'Mon-Fri': '9AM-6PM', 'Sat': '10AM-4PM', 'Sun': 'Closed' },
    lastUpdated: '',
  },
];

export interface NationalChain {
  name: string;
  website: string;
  locationCount: number;
  nearestLocation: string;
  services: string[];
  avgPricePoint: 'budget' | 'mid-range' | 'premium';
  adLibraryId: string; // Meta Ad Library page ID
  socialHandles: { instagram: string; facebook: string };
}

export const NATIONAL_CHAINS: NationalChain[] = [
  {
    name: 'Ideal Image',
    website: 'https://www.idealimage.com',
    locationCount: 150,
    nearestLocation: 'Seattle, WA',
    services: ['laser hair removal', 'coolsculpting', 'botox', 'fillers', 'facial'],
    avgPricePoint: 'mid-range',
    adLibraryId: 'idealimage',
    socialHandles: { instagram: '@idealimage', facebook: 'idealimage' },
  },
  {
    name: 'LaserAway',
    website: 'https://www.laseraway.com',
    locationCount: 80,
    nearestLocation: 'Bellevue, WA',
    services: ['laser hair removal', 'tattoo removal', 'botox', 'fillers', 'body contouring'],
    avgPricePoint: 'mid-range',
    adLibraryId: 'laseraway',
    socialHandles: { instagram: '@laseraway', facebook: 'laseraway' },
  },
  {
    name: 'Ever/Body',
    website: 'https://www.everbody.com',
    locationCount: 15,
    nearestLocation: 'N/A (East Coast)',
    services: ['botox', 'fillers', 'laser', 'body contouring', 'facial'],
    avgPricePoint: 'premium',
    adLibraryId: 'everbody',
    socialHandles: { instagram: '@everbody', facebook: 'everbody' },
  },
  {
    name: 'Skin Laundry',
    website: 'https://www.skinlaundry.com',
    locationCount: 20,
    nearestLocation: 'N/A (CA, NY, AZ)',
    services: ['laser facial', 'skincare', 'light therapy'],
    avgPricePoint: 'budget',
    adLibraryId: 'skinlaundry',
    socialHandles: { instagram: '@skinlaundry', facebook: 'skinlaundry' },
  },
  {
    name: 'Heyday',
    website: 'https://www.heydayskincare.com',
    locationCount: 30,
    nearestLocation: 'N/A (East Coast, Midwest)',
    services: ['facial', 'skincare', 'peels', 'microdermabrasion'],
    avgPricePoint: 'mid-range',
    adLibraryId: 'heydayskincare',
    socialHandles: { instagram: '@heydayskincare', facebook: 'heydayskincare' },
  },
];

// ── Google Business Profile Metrics ──────────────────────────

export interface GBPMetrics {
  clinicName: string;
  rating: number;
  totalReviews: number;
  reviewVelocity7d: number; // new reviews in last 7 days
  reviewVelocity30d: number;
  responseRate: number; // percentage of reviews with owner response
  avgResponseTime: number; // hours
  photoCount: number;
  searchImpressions: number;
  searchClicks: number;
  directionRequests: number;
  phoneCalls: number;
  websiteClicks: number;
  period: string;
}

export interface GBPComparison {
  rani: GBPMetrics;
  competitors: GBPMetrics[];
  raniRank: {
    rating: number; // position among all tracked
    reviewCount: number;
    reviewVelocity: number;
  };
}

// ── Treatment Trend Detection ─────────────────────────────────

export interface TreatmentTrend {
  treatment: string;
  trendDirection: 'rising' | 'stable' | 'declining';
  searchVolumeChange: number; // percentage
  socialMentionsChange: number;
  competitorAdoptionRate: number; // how many competitors offer it
  revenueOpportunity: 'high' | 'medium' | 'low';
  relevanceToRani: 'direct' | 'adjacent' | 'monitor';
  summary: string;
}

export const TRACKED_TREATMENTS: string[] = [
  'Exosomes',
  'PRF/PRP with microneedling',
  'Polynucleotides (PDRN)',
  'Biostimulators (Sculptra, Radiesse)',
  'Skin boosters (Profhilo, Skinvive)',
  'Thread lifts',
  'BBL (broadband light)',
  'Morpheus8',
  'EmSculpt NEO',
  'Regenerative aesthetics',
  'Ozempic face treatments',
  'AI skin analysis',
  'Personalized skincare compounding',
  'Combination laser protocols',
  'Non-invasive body contouring',
];

// ── FDA Approval Tracking ─────────────────────────────────────

export interface FDAApproval {
  productName: string;
  manufacturer: string;
  approvalType: '510k' | 'PMA' | 'De Novo' | 'BLA' | 'NDA' | 'supplemental';
  indication: string;
  approvalDate: string;
  relevance: 'high' | 'medium' | 'low';
  impact: string;
  source: string;
}

export interface FDATracker {
  recentApprovals: FDAApproval[];
  pendingApplications: FDAApproval[];
  safetyAlerts: FDASafetyAlert[];
}

export interface FDASafetyAlert {
  title: string;
  product: string;
  severity: 'recall' | 'warning' | 'advisory';
  date: string;
  summary: string;
  actionRequired: boolean;
  source: string;
}

// ── Manufacturer Product News ─────────────────────────────────

export interface ManufacturerNews {
  manufacturer: string;
  headline: string;
  date: string;
  category: 'product_launch' | 'pricing_change' | 'clinical_data' | 'supply_chain' | 'partnership' | 'recall';
  impact: 'high' | 'medium' | 'low';
  summary: string;
  source: string;
  actionItem: string | null;
}

export const TRACKED_MANUFACTURERS = [
  { name: 'Allergan (AbbVie)', products: ['Botox', 'Juvederm', 'SkinMedica', 'CoolSculpting', 'Kybella'] },
  { name: 'Galderma', products: ['Restylane', 'Dysport', 'Sculptra', 'Cetaphil'] },
  { name: 'Merz Aesthetics', products: ['Xeomin', 'Radiesse', 'Belotero', 'Ultherapy'] },
  { name: 'Revance', products: ['DAXXIFY', 'RHA Collection'] },
  { name: 'Evolus', products: ['Jeuveau'] },
  { name: 'Sofwave', products: ['Sofwave SUPERB'] },
  { name: 'Cynosure', products: ['PicoSure', 'SculpSure', 'TempSure'] },
  { name: 'Candela', products: ['GentleMax Pro', 'Nordlys', 'PicoWay'] },
  { name: 'Hydrafacial (BeautyHealth)', products: ['HydraFacial', 'Syndeo'] },
  { name: 'InMode', products: ['Morpheus8', 'Forma', 'BodyTite', 'FaceTite'] },
];

// ── State Regulation Changes ──────────────────────────────────

export interface RegulationChange {
  state: string;
  agency: string;
  title: string;
  effectiveDate: string;
  status: 'proposed' | 'pending' | 'enacted' | 'effective';
  category: 'scope_of_practice' | 'licensing' | 'safety' | 'advertising' | 'controlled_substances' | 'insurance' | 'telehealth';
  impact: 'high' | 'medium' | 'low';
  summary: string;
  actionRequired: string | null;
  source: string;
}

export interface RegulationTracker {
  waState: RegulationChange[];
  national: RegulationChange[];
  upcoming: RegulationChange[]; // next 90 days
}

// ── Insurance & Financing Industry ────────────────────────────

export interface FinancingUpdate {
  provider: string;
  type: 'rate_change' | 'new_product' | 'policy_change' | 'partnership' | 'technology';
  headline: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  summary: string;
  relevance: string;
}

export const TRACKED_FINANCING_PROVIDERS = [
  'Cherry',
  'CareCredit',
  'Alphaeon Credit',
  'PatientFi',
  'United Medical Credit',
  'Prosper Healthcare Lending',
];

// ── Aggregated Market Intelligence ────────────────────────────

export interface MarketIntelligence {
  generatedAt: string;
  industryNews: IndustryNewsSummary;
  competitorLandscape: CompetitorLandscape;
  gbpComparison: GBPComparison | null;
  treatmentTrends: TreatmentTrend[];
  fdaTracker: FDATracker;
  manufacturerNews: ManufacturerNews[];
  regulationTracker: RegulationTracker;
  financingUpdates: FinancingUpdate[];
  keyInsights: MarketInsight[];
}

export interface IndustryNewsSummary {
  topStories: RSSFeedItem[];
  byCategory: Record<string, RSSFeedItem[]>;
  totalFetched: number;
  sourcesChecked: number;
  lastFetched: string;
}

export interface CompetitorLandscape {
  local: LocalCompetitor[];
  national: NationalChain[];
  marketPosition: MarketPosition;
}

export interface MarketPosition {
  ratingRank: number; // among local competitors
  reviewCountRank: number;
  estimatedMarketShare: number; // percentage based on review velocity
  strengthAreas: string[];
  vulnerabilityAreas: string[];
}

export interface MarketInsight {
  type: 'opportunity' | 'threat' | 'trend' | 'action_required';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  suggestedAction: string;
}

// ── Keyword Relevance Map ─────────────────────────────────────

const RELEVANCE_KEYWORDS: Record<string, number> = {
  'medspa': 10, 'med spa': 10, 'medical spa': 10,
  'aesthetic': 8, 'aesthetics': 8,
  'injectable': 9, 'injection': 9, 'botox': 9, 'filler': 9,
  'hydrafacial': 10, 'facial': 7,
  'laser': 8, 'peel': 7, 'microneedling': 9,
  'sofwave': 10, 'rf microneedling': 10,
  'glp-1': 8, 'weight loss': 6, 'semaglutide': 8, 'tirzepatide': 8,
  'dermatology': 6, 'skincare': 6,
  'fda': 7, 'approval': 6, 'regulation': 5,
  'allergan': 8, 'galderma': 8, 'merz': 7, 'revance': 7,
  'washington': 9, 'seattle': 8, 'renton': 10,
  'picoway': 10, 'vi peel': 10, 'prx': 10,
};

// ── Core Functions ────────────────────────────────────────────

/**
 * Calculate relevance score for a news item based on keyword matching
 */
export function calculateRelevanceScore(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  let matchCount = 0;

  for (const [keyword, weight] of Object.entries(RELEVANCE_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase())) {
      score += weight;
      matchCount++;
    }
  }

  // Normalize to 0-100 scale
  const maxPossible = 50; // approximate max reasonable score
  const normalized = Math.min(100, Math.round((score / maxPossible) * 100));

  // Boost for multiple matches
  const matchBonus = Math.min(20, matchCount * 3);

  return Math.min(100, normalized + matchBonus);
}

/**
 * Parse an RSS feed XML string into RSSFeedItem array
 */
export function parseRSSFeed(xml: string, source: RSSFeedSource): RSSFeedItem[] {
  const items: RSSFeedItem[] = [];

  // Simple XML parser for RSS <item> elements
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractXmlTag(itemXml, 'title');
    const link = extractXmlTag(itemXml, 'link');
    const description = extractXmlTag(itemXml, 'description');
    const pubDate = extractXmlTag(itemXml, 'pubDate');

    if (title) {
      const relevanceScore = calculateRelevanceScore(title, description);

      items.push({
        title: cleanHtml(title),
        link,
        description: cleanHtml(description).substring(0, 300),
        pubDate,
        source: source.name,
        category: source.category,
        relevanceScore,
      });
    }
  }

  return items.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function extractXmlTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : '';
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Fetch all configured RSS feeds and aggregate results
 */
export async function fetchIndustryNews(options: {
  maxItemsPerFeed?: number;
  minRelevanceScore?: number;
  maxAge24h?: number;
} = {}): Promise<IndustryNewsSummary> {
  const {
    maxItemsPerFeed = 10,
    minRelevanceScore = 20,
    maxAge24h = 48,
  } = options;

  const allItems: RSSFeedItem[] = [];
  let sourcesChecked = 0;

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - maxAge24h);

  for (const feed of INDUSTRY_RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'RaniOS-IntelligenceBriefing/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const items = parseRSSFeed(xml, feed);

      const filtered = items
        .filter(item => {
          if (item.relevanceScore < minRelevanceScore) return false;
          if (item.pubDate) {
            const itemDate = new Date(item.pubDate);
            if (itemDate < cutoffDate) return false;
          }
          return true;
        })
        .slice(0, maxItemsPerFeed);

      allItems.push(...filtered);
      sourcesChecked++;
    } catch {
      // Skip failed feeds gracefully
      sourcesChecked++;
    }
  }

  // Deduplicate by title similarity
  const deduped = deduplicateItems(allItems);

  // Sort by relevance then priority
  deduped.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Group by category
  const byCategory: Record<string, RSSFeedItem[]> = {};
  for (const item of deduped) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  }

  return {
    topStories: deduped.slice(0, 10),
    byCategory,
    totalFetched: deduped.length,
    sourcesChecked,
    lastFetched: new Date().toISOString(),
  };
}

function deduplicateItems(items: RSSFeedItem[]): RSSFeedItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Normalize title for comparison
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Detect treatment trends from industry news and search data
 */
export function detectTreatmentTrends(
  newsItems: RSSFeedItem[],
  previousTrends?: TreatmentTrend[]
): TreatmentTrend[] {
  const trends: TreatmentTrend[] = [];

  for (const treatment of TRACKED_TREATMENTS) {
    const mentions = newsItems.filter(item =>
      `${item.title} ${item.description}`.toLowerCase().includes(treatment.toLowerCase().split(' ')[0])
    );

    const previousTrend = previousTrends?.find(t => t.treatment === treatment);
    const previousMentions = previousTrend?.socialMentionsChange ?? 0;

    const currentMentions = mentions.length;
    const mentionChange = previousMentions > 0
      ? Math.round(((currentMentions - previousMentions) / previousMentions) * 100)
      : currentMentions > 0 ? 100 : 0;

    let trendDirection: TreatmentTrend['trendDirection'] = 'stable';
    if (mentionChange > 20) trendDirection = 'rising';
    else if (mentionChange < -20) trendDirection = 'declining';

    // Determine relevance to Rani
    const directServices = ['hydrafacial', 'botox', 'filler', 'microneedling', 'laser', 'peel', 'sofwave', 'glp-1', 'picoway'];
    const treatmentLower = treatment.toLowerCase();
    let relevanceToRani: TreatmentTrend['relevanceToRani'] = 'monitor';
    if (directServices.some(s => treatmentLower.includes(s))) {
      relevanceToRani = 'direct';
    } else if (['biostimulator', 'skin booster', 'regenerative', 'ai skin', 'personalized'].some(s => treatmentLower.includes(s))) {
      relevanceToRani = 'adjacent';
    }

    let revenueOpportunity: TreatmentTrend['revenueOpportunity'] = 'low';
    if (trendDirection === 'rising' && relevanceToRani === 'direct') revenueOpportunity = 'high';
    else if (trendDirection === 'rising') revenueOpportunity = 'medium';

    trends.push({
      treatment,
      trendDirection,
      searchVolumeChange: mentionChange,
      socialMentionsChange: currentMentions,
      competitorAdoptionRate: 0, // populated by competitor tracker
      revenueOpportunity,
      relevanceToRani,
      summary: `${treatment}: ${trendDirection} trend with ${currentMentions} recent mentions${revenueOpportunity === 'high' ? ' - HIGH revenue opportunity' : ''}`,
    });
  }

  return trends.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.revenueOpportunity] - priority[b.revenueOpportunity];
  });
}

/**
 * Calculate market position relative to competitors
 */
export function calculateMarketPosition(
  raniMetrics: { rating: number; reviewCount: number; reviewVelocity7d: number },
  competitors: LocalCompetitor[]
): MarketPosition {
  const allRatings = [raniMetrics.rating, ...competitors.map(c => c.googleRating)].sort((a, b) => b - a);
  const allReviewCounts = [raniMetrics.reviewCount, ...competitors.map(c => c.reviewCount)].sort((a, b) => b - a);

  const ratingRank = allRatings.indexOf(raniMetrics.rating) + 1;
  const reviewCountRank = allReviewCounts.indexOf(raniMetrics.reviewCount) + 1;

  const totalReviews = raniMetrics.reviewCount + competitors.reduce((sum, c) => sum + c.reviewCount, 0);
  const estimatedMarketShare = totalReviews > 0
    ? Math.round((raniMetrics.reviewCount / totalReviews) * 10000) / 100
    : 0;

  const strengthAreas: string[] = [];
  const vulnerabilityAreas: string[] = [];

  if (ratingRank <= 3) strengthAreas.push('Top 3 Google rating');
  else vulnerabilityAreas.push('Google rating below top 3');

  if (reviewCountRank <= 3) strengthAreas.push('Top 3 in review volume');
  else vulnerabilityAreas.push('Review count below top 3');

  if (raniMetrics.reviewVelocity7d >= 3) strengthAreas.push('Strong review velocity');
  else if (raniMetrics.reviewVelocity7d < 1) vulnerabilityAreas.push('Low review velocity');

  if (raniMetrics.rating >= 4.8) strengthAreas.push('Premium rating (4.8+)');

  return {
    ratingRank,
    reviewCountRank,
    estimatedMarketShare,
    strengthAreas,
    vulnerabilityAreas,
  };
}

/**
 * Generate key market insights from aggregated intelligence
 */
export function generateMarketInsights(
  news: IndustryNewsSummary,
  trends: TreatmentTrend[],
  position: MarketPosition
): MarketInsight[] {
  const insights: MarketInsight[] = [];

  // Rising treatment opportunities
  const risingTrends = trends.filter(t => t.trendDirection === 'rising' && t.revenueOpportunity !== 'low');
  for (const trend of risingTrends.slice(0, 3)) {
    insights.push({
      type: 'opportunity',
      priority: trend.revenueOpportunity === 'high' ? 'high' : 'medium',
      title: `Rising trend: ${trend.treatment}`,
      description: trend.summary,
      source: 'Treatment Trend Analysis',
      suggestedAction: trend.relevanceToRani === 'direct'
        ? `Increase marketing spend on ${trend.treatment} to capture rising demand`
        : `Evaluate adding ${trend.treatment} to service menu`,
    });
  }

  // Competitive position threats
  for (const vulnerability of position.vulnerabilityAreas) {
    insights.push({
      type: 'threat',
      priority: 'medium',
      title: `Competitive gap: ${vulnerability}`,
      description: `Rani ranks #${position.ratingRank} in rating and #${position.reviewCountRank} in review count among tracked competitors`,
      source: 'Competitor Analysis',
      suggestedAction: vulnerability.includes('review')
        ? 'Increase review request frequency and offer post-visit review incentives'
        : 'Focus on client experience improvements to boost rating',
    });
  }

  // Top news requiring attention
  const highRelevanceNews = news.topStories.filter(s => s.relevanceScore >= 60);
  for (const story of highRelevanceNews.slice(0, 2)) {
    insights.push({
      type: 'trend',
      priority: 'medium',
      title: story.title,
      description: story.description.substring(0, 200),
      source: story.source,
      suggestedAction: 'Review and assess impact on clinic operations',
    });
  }

  return insights.sort((a, b) => {
    const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

/**
 * Generate complete market intelligence report
 */
export async function generateMarketIntelligence(options: {
  skipRSSFetch?: boolean;
  cachedNews?: IndustryNewsSummary;
  raniMetrics?: { rating: number; reviewCount: number; reviewVelocity7d: number };
  previousTrends?: TreatmentTrend[];
} = {}): Promise<MarketIntelligence> {
  // Fetch industry news (or use cached)
  let industryNews: IndustryNewsSummary;
  if (options.skipRSSFetch && options.cachedNews) {
    industryNews = options.cachedNews;
  } else if (options.skipRSSFetch) {
    industryNews = {
      topStories: [],
      byCategory: {},
      totalFetched: 0,
      sourcesChecked: 0,
      lastFetched: new Date().toISOString(),
    };
  } else {
    industryNews = await fetchIndustryNews();
  }

  // Detect treatment trends
  const treatmentTrends = detectTreatmentTrends(industryNews.topStories, options.previousTrends);

  // Calculate market position
  const raniMetrics = options.raniMetrics || { rating: 4.9, reviewCount: 129, reviewVelocity7d: 2 };
  const marketPosition = calculateMarketPosition(raniMetrics, LOCAL_COMPETITORS);

  // Generate insights
  const keyInsights = generateMarketInsights(industryNews, treatmentTrends, marketPosition);

  return {
    generatedAt: new Date().toISOString(),
    industryNews,
    competitorLandscape: {
      local: LOCAL_COMPETITORS,
      national: NATIONAL_CHAINS,
      marketPosition,
    },
    gbpComparison: null, // populated when Google Business API is connected
    treatmentTrends,
    fdaTracker: {
      recentApprovals: [],
      pendingApplications: [],
      safetyAlerts: [],
    },
    manufacturerNews: [],
    regulationTracker: {
      waState: [],
      national: [],
      upcoming: [],
    },
    financingUpdates: [],
    keyInsights,
  };
}
