/**
 * SEO Monitoring Engine for Rani Beauty Clinic
 *
 * Tracks keyword rankings, page performance, technical SEO health,
 * Core Web Vitals, backlink profiles, local SEO scoring, and competitor
 * keyword overlap. Designed for medical aesthetics clinic SEO.
 *
 * IMPORTANT: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface KeywordRanking {
  keyword: string;
  position: number; // 1-100+ (0 = not ranked)
  previousPosition: number;
  change: number; // positive = improved, negative = dropped
  url: string; // ranking page URL
  searchVolume: number; // monthly
  difficulty: number; // 0-100
  category: KeywordCategory;
  intent: SearchIntent;
  featured: boolean; // has featured snippet
  lastUpdated: string; // ISO
}

export type KeywordCategory =
  | 'brand'
  | 'service'
  | 'treatment'
  | 'location'
  | 'competitor'
  | 'informational'
  | 'transactional';

export type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial';

export interface PagePerformance {
  url: string;
  title: string;
  pageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number; // seconds
  bounceRate: number; // 0-100
  entrances: number;
  exits: number;
  exitRate: number;
  conversions: number;
  conversionRate: number;
  organicTraffic: number;
  topKeywords: string[];
  lastUpdated: string;
}

export interface TechnicalSEOHealth {
  overallScore: number; // 0-100
  checks: TechnicalSEOCheck[];
  criticalIssues: number;
  warnings: number;
  passed: number;
}

export interface TechnicalSEOCheck {
  name: string;
  category: 'crawlability' | 'indexability' | 'speed' | 'mobile' | 'security' | 'structured_data';
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export interface CoreWebVitals {
  lcp: { value: number; rating: 'good' | 'needs_improvement' | 'poor'; threshold: number };
  fid: { value: number; rating: 'good' | 'needs_improvement' | 'poor'; threshold: number };
  cls: { value: number; rating: 'good' | 'needs_improvement' | 'poor'; threshold: number };
  inp: { value: number; rating: 'good' | 'needs_improvement' | 'poor'; threshold: number };
  ttfb: { value: number; rating: 'good' | 'needs_improvement' | 'poor'; threshold: number };
  overallScore: number; // 0-100
  lastUpdated: string;
}

export interface BacklinkProfile {
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number; // 0-100
  newBacklinks: number; // last 30 days
  lostBacklinks: number; // last 30 days
  topReferrers: { domain: string; authority: number; links: number; type: string }[];
  anchorTextDistribution: { text: string; count: number; percentage: number }[];
  doFollowRatio: number; // percentage of dofollow links
  lastUpdated: string;
}

export interface LocalSEOScore {
  overallScore: number; // 0-100
  gmbOptimization: GMBChecklist;
  citations: CitationStatus;
  localRankings: LocalRanking[];
}

export interface GMBChecklist {
  score: number; // 0-100
  items: GMBCheckItem[];
}

export interface GMBCheckItem {
  name: string;
  status: 'complete' | 'incomplete' | 'needs_update';
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CitationStatus {
  totalCitations: number;
  consistent: number; // NAP consistent
  inconsistent: number;
  missing: number;
  directories: { name: string; status: 'listed' | 'inconsistent' | 'missing'; napMatch: boolean }[];
}

export interface LocalRanking {
  keyword: string;
  position: number;
  mapPackPosition?: number; // position in local 3-pack
  city: string;
  lastUpdated: string;
}

export interface CompetitorKeywordOverlap {
  competitor: string;
  sharedKeywords: number;
  competitorOnlyKeywords: number;
  ourOnlyKeywords: number;
  overlapPercentage: number;
  opportunities: { keyword: string; theirPosition: number; ourPosition: number; gap: number }[];
}

export interface ContentGap {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competitorsRanking: number; // how many competitors rank for this
  suggestedContentType: string;
  estimatedTrafficPotential: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SEODashboardData {
  healthScore: number;
  keywordRankings: KeywordRanking[];
  topPages: PagePerformance[];
  technicalHealth: TechnicalSEOHealth;
  coreWebVitals: CoreWebVitals;
  backlinkProfile: BacklinkProfile;
  localSEO: LocalSEOScore;
  contentGaps: ContentGap[];
  summary: SEOSummary;
}

export interface SEOSummary {
  totalKeywordsTracked: number;
  keywordsImproved: number;
  keywordsDeclined: number;
  keywordsStable: number;
  avgPosition: number;
  top3Count: number;
  top10Count: number;
  top20Count: number;
  organicTrafficTrend: 'up' | 'down' | 'stable';
  topWins: string[];
  topLosses: string[];
  recommendations: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Target keywords for Rani Beauty Clinic */
const TARGET_KEYWORDS: Omit<KeywordRanking, 'position' | 'previousPosition' | 'change' | 'url' | 'featured' | 'lastUpdated'>[] = [
  // Brand
  { keyword: 'rani beauty clinic', searchVolume: 320, difficulty: 15, category: 'brand', intent: 'navigational' },
  { keyword: 'rani beauty clinic renton', searchVolume: 110, difficulty: 10, category: 'brand', intent: 'navigational' },
  // Service — Skin Tightening
  { keyword: 'sofwave near me', searchVolume: 2400, difficulty: 55, category: 'service', intent: 'transactional' },
  { keyword: 'sofwave renton wa', searchVolume: 90, difficulty: 25, category: 'location', intent: 'transactional' },
  { keyword: 'non-invasive skin tightening seattle', searchVolume: 480, difficulty: 45, category: 'treatment', intent: 'commercial' },
  // Service — Facials
  { keyword: 'hydrafacial renton', searchVolume: 170, difficulty: 30, category: 'location', intent: 'transactional' },
  { keyword: 'hydrafacial near me', searchVolume: 14800, difficulty: 65, category: 'service', intent: 'transactional' },
  { keyword: 'best medical facial seattle', searchVolume: 390, difficulty: 50, category: 'treatment', intent: 'commercial' },
  // Service — Injectables
  { keyword: 'botox renton wa', searchVolume: 260, difficulty: 35, category: 'location', intent: 'transactional' },
  { keyword: 'lip fillers near me', searchVolume: 12100, difficulty: 70, category: 'service', intent: 'transactional' },
  { keyword: 'botox near me', searchVolume: 40500, difficulty: 75, category: 'service', intent: 'transactional' },
  // Service — Laser
  { keyword: 'laser hair removal renton', searchVolume: 390, difficulty: 40, category: 'location', intent: 'transactional' },
  { keyword: 'picoway laser near me', searchVolume: 1600, difficulty: 50, category: 'service', intent: 'transactional' },
  { keyword: 'rf microneedling seattle', searchVolume: 320, difficulty: 45, category: 'treatment', intent: 'commercial' },
  // Service — Wellness Injections
  { keyword: 'nad+ injection near me', searchVolume: 1300, difficulty: 40, category: 'service', intent: 'transactional' },
  { keyword: 'glutathione injection seattle', searchVolume: 210, difficulty: 35, category: 'treatment', intent: 'commercial' },
  { keyword: 'b12 injection near me', searchVolume: 6600, difficulty: 55, category: 'service', intent: 'transactional' },
  // Service — Weight Loss
  { keyword: 'glp-1 weight loss renton', searchVolume: 140, difficulty: 30, category: 'location', intent: 'transactional' },
  { keyword: 'medical weight loss near me', searchVolume: 9900, difficulty: 65, category: 'service', intent: 'transactional' },
  { keyword: 'semaglutide seattle', searchVolume: 720, difficulty: 50, category: 'treatment', intent: 'commercial' },
  // Informational
  { keyword: 'sofwave vs ultherapy', searchVolume: 1900, difficulty: 40, category: 'informational', intent: 'informational' },
  { keyword: 'hydrafacial benefits', searchVolume: 2900, difficulty: 45, category: 'informational', intent: 'informational' },
  { keyword: 'what is rf microneedling', searchVolume: 3600, difficulty: 40, category: 'informational', intent: 'informational' },
  { keyword: 'glp-1 side effects', searchVolume: 8100, difficulty: 55, category: 'informational', intent: 'informational' },
  // Medspa general
  { keyword: 'medspa renton wa', searchVolume: 480, difficulty: 35, category: 'location', intent: 'transactional' },
  { keyword: 'best medspa seattle area', searchVolume: 720, difficulty: 50, category: 'location', intent: 'commercial' },
];

/** GMB optimization checklist */
const GMB_CHECKLIST_ITEMS: Omit<GMBCheckItem, 'status'>[] = [
  { name: 'Business Name', detail: 'Matches exact legal business name', priority: 'high' },
  { name: 'Address', detail: '401 Olympia Ave NE #101, Renton, WA 98056', priority: 'high' },
  { name: 'Phone Number', detail: 'Primary phone number listed', priority: 'high' },
  { name: 'Website URL', detail: 'Links to ranibeautyclinic.com', priority: 'high' },
  { name: 'Business Hours', detail: 'All days of the week listed', priority: 'high' },
  { name: 'Business Category', detail: 'Primary: Medical Spa, Secondary: Skin Care Clinic', priority: 'high' },
  { name: 'Business Description', detail: '750 characters with keywords', priority: 'medium' },
  { name: 'Services Listed', detail: 'All services with descriptions and pricing', priority: 'high' },
  { name: 'Photos (Exterior)', detail: 'At least 3 exterior photos', priority: 'medium' },
  { name: 'Photos (Interior)', detail: 'At least 5 interior/treatment room photos', priority: 'medium' },
  { name: 'Photos (Team)', detail: 'Team/provider photos', priority: 'medium' },
  { name: 'Photos (Before/After)', detail: 'Treatment result photos', priority: 'medium' },
  { name: 'Google Posts', detail: 'Weekly Google Business posts', priority: 'medium' },
  { name: 'Q&A Section', detail: 'Pre-populated FAQ answers', priority: 'low' },
  { name: 'Booking Link', detail: 'Direct booking URL configured', priority: 'high' },
  { name: 'Messaging Enabled', detail: 'Google messaging turned on', priority: 'low' },
  { name: 'Attributes', detail: 'All applicable attributes selected', priority: 'low' },
  { name: 'Review Responses', detail: '100% of reviews responded to', priority: 'high' },
];

/** Important business directories for medspa */
const IMPORTANT_DIRECTORIES = [
  'Google Business Profile', 'Yelp', 'Facebook', 'Healthgrades', 'RealSelf',
  'ZocDoc', 'Apple Maps', 'Bing Places', 'Yellow Pages', 'BBB',
  'Manta', 'Foursquare', 'Nextdoor', 'MapQuest', 'Superpages',
];

// ── Technical SEO Checks ──────────────────────────────────────────────────

/**
 * Run technical SEO health checks.
 */
export function runTechnicalSEOChecks(
  siteData: {
    hasSSL: boolean;
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
    mobileResponsive: boolean;
    pageCount: number;
    indexedPages: number;
    avgPageSpeed: number; // seconds
    brokenLinks: number;
    redirectChains: number;
    duplicateContent: number;
    missingMetaTitles: number;
    missingMetaDescriptions: number;
    missingAltTags: number;
    hasSchemaMarkup: boolean;
    hasLocalBusinessSchema: boolean;
    hasFAQSchema: boolean;
    hasReviewSchema: boolean;
    canonicalIssues: number;
    h1Issues: number; // missing or multiple h1s
    mixedContent: boolean;
  },
): TechnicalSEOHealth {
  const checks: TechnicalSEOCheck[] = [];

  // Security
  checks.push({
    name: 'SSL Certificate',
    category: 'security',
    status: siteData.hasSSL ? 'pass' : 'fail',
    detail: siteData.hasSSL ? 'HTTPS enabled across all pages' : 'SSL certificate missing or expired',
    impact: 'high',
    recommendation: siteData.hasSSL ? undefined : 'Install SSL certificate immediately — required for rankings and trust',
  });

  checks.push({
    name: 'Mixed Content',
    category: 'security',
    status: siteData.mixedContent ? 'fail' : 'pass',
    detail: siteData.mixedContent ? 'HTTP resources loaded on HTTPS pages' : 'No mixed content detected',
    impact: 'medium',
    recommendation: siteData.mixedContent ? 'Update all HTTP resource URLs to HTTPS' : undefined,
  });

  // Crawlability
  checks.push({
    name: 'XML Sitemap',
    category: 'crawlability',
    status: siteData.hasSitemap ? 'pass' : 'fail',
    detail: siteData.hasSitemap ? 'Sitemap.xml found and valid' : 'No XML sitemap detected',
    impact: 'high',
    recommendation: siteData.hasSitemap ? undefined : 'Create and submit XML sitemap to Google Search Console',
  });

  checks.push({
    name: 'Robots.txt',
    category: 'crawlability',
    status: siteData.hasRobotsTxt ? 'pass' : 'warning',
    detail: siteData.hasRobotsTxt ? 'Robots.txt configured' : 'No robots.txt file found',
    impact: 'medium',
  });

  checks.push({
    name: 'Broken Links',
    category: 'crawlability',
    status: siteData.brokenLinks === 0 ? 'pass' : siteData.brokenLinks <= 5 ? 'warning' : 'fail',
    detail: `${siteData.brokenLinks} broken links detected`,
    impact: siteData.brokenLinks > 10 ? 'high' : 'medium',
    recommendation: siteData.brokenLinks > 0 ? 'Fix or redirect broken links to improve crawlability' : undefined,
  });

  checks.push({
    name: 'Redirect Chains',
    category: 'crawlability',
    status: siteData.redirectChains === 0 ? 'pass' : 'warning',
    detail: `${siteData.redirectChains} redirect chains found`,
    impact: 'medium',
  });

  // Indexability
  checks.push({
    name: 'Index Coverage',
    category: 'indexability',
    status: siteData.indexedPages >= siteData.pageCount * 0.9 ? 'pass' : 'warning',
    detail: `${siteData.indexedPages}/${siteData.pageCount} pages indexed`,
    impact: 'high',
    recommendation: siteData.indexedPages < siteData.pageCount * 0.9
      ? 'Check for noindex tags or crawl blocks on unindexed pages'
      : undefined,
  });

  checks.push({
    name: 'Canonical Tags',
    category: 'indexability',
    status: siteData.canonicalIssues === 0 ? 'pass' : 'warning',
    detail: siteData.canonicalIssues === 0 ? 'All canonical tags properly set' : `${siteData.canonicalIssues} canonical issues`,
    impact: 'medium',
  });

  checks.push({
    name: 'Duplicate Content',
    category: 'indexability',
    status: siteData.duplicateContent === 0 ? 'pass' : siteData.duplicateContent <= 3 ? 'warning' : 'fail',
    detail: `${siteData.duplicateContent} pages with duplicate content`,
    impact: 'high',
  });

  checks.push({
    name: 'Meta Titles',
    category: 'indexability',
    status: siteData.missingMetaTitles === 0 ? 'pass' : 'fail',
    detail: siteData.missingMetaTitles === 0 ? 'All pages have meta titles' : `${siteData.missingMetaTitles} pages missing meta titles`,
    impact: 'high',
  });

  checks.push({
    name: 'Meta Descriptions',
    category: 'indexability',
    status: siteData.missingMetaDescriptions === 0 ? 'pass' : siteData.missingMetaDescriptions <= 5 ? 'warning' : 'fail',
    detail: siteData.missingMetaDescriptions === 0 ? 'All pages have meta descriptions' : `${siteData.missingMetaDescriptions} pages missing meta descriptions`,
    impact: 'medium',
  });

  checks.push({
    name: 'H1 Tags',
    category: 'indexability',
    status: siteData.h1Issues === 0 ? 'pass' : 'warning',
    detail: siteData.h1Issues === 0 ? 'All pages have exactly one H1' : `${siteData.h1Issues} pages with H1 issues`,
    impact: 'medium',
  });

  // Speed
  checks.push({
    name: 'Page Speed',
    category: 'speed',
    status: siteData.avgPageSpeed <= 2 ? 'pass' : siteData.avgPageSpeed <= 4 ? 'warning' : 'fail',
    detail: `Average page load: ${siteData.avgPageSpeed.toFixed(1)}s`,
    impact: 'high',
    recommendation: siteData.avgPageSpeed > 2 ? 'Optimize images, enable caching, and minimize JavaScript' : undefined,
  });

  // Mobile
  checks.push({
    name: 'Mobile Responsiveness',
    category: 'mobile',
    status: siteData.mobileResponsive ? 'pass' : 'fail',
    detail: siteData.mobileResponsive ? 'Site is mobile-responsive' : 'Site not mobile-optimized',
    impact: 'high',
  });

  // Images
  checks.push({
    name: 'Image Alt Tags',
    category: 'indexability',
    status: siteData.missingAltTags === 0 ? 'pass' : siteData.missingAltTags <= 10 ? 'warning' : 'fail',
    detail: siteData.missingAltTags === 0 ? 'All images have alt text' : `${siteData.missingAltTags} images missing alt text`,
    impact: 'medium',
  });

  // Structured Data
  checks.push({
    name: 'Schema Markup',
    category: 'structured_data',
    status: siteData.hasSchemaMarkup ? 'pass' : 'fail',
    detail: siteData.hasSchemaMarkup ? 'Schema markup detected' : 'No schema markup found',
    impact: 'high',
  });

  checks.push({
    name: 'LocalBusiness Schema',
    category: 'structured_data',
    status: siteData.hasLocalBusinessSchema ? 'pass' : 'fail',
    detail: siteData.hasLocalBusinessSchema ? 'LocalBusiness schema present' : 'Missing LocalBusiness schema',
    impact: 'high',
    recommendation: siteData.hasLocalBusinessSchema ? undefined : 'Add LocalBusiness schema with NAP, hours, and services for local SEO',
  });

  checks.push({
    name: 'FAQ Schema',
    category: 'structured_data',
    status: siteData.hasFAQSchema ? 'pass' : 'warning',
    detail: siteData.hasFAQSchema ? 'FAQ schema on relevant pages' : 'FAQ schema not detected',
    impact: 'medium',
  });

  checks.push({
    name: 'Review Schema',
    category: 'structured_data',
    status: siteData.hasReviewSchema ? 'pass' : 'warning',
    detail: siteData.hasReviewSchema ? 'Review/AggregateRating schema present' : 'No review schema',
    impact: 'medium',
  });

  // Calculate score
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const total = checks.length;

  // Weighted: pass=100%, warning=50%, fail=0%, weighted by impact
  const impactWeight = { high: 3, medium: 2, low: 1 };
  const maxScore = checks.reduce((s, c) => s + impactWeight[c.impact], 0);
  const actualScore = checks.reduce((s, c) => {
    const w = impactWeight[c.impact];
    if (c.status === 'pass') return s + w;
    if (c.status === 'warning') return s + w * 0.5;
    return s;
  }, 0);

  return {
    overallScore: maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0,
    checks,
    criticalIssues: failCount,
    warnings: warnCount,
    passed: passCount,
  };
}

// ── Core Web Vitals ───────────────────────────────────────────────────────

/**
 * Evaluate Core Web Vitals against thresholds.
 */
export function evaluateCoreWebVitals(
  metrics: { lcp: number; fid: number; cls: number; inp: number; ttfb: number },
): CoreWebVitals {
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    inp: { good: 200, poor: 500 },
    ttfb: { good: 800, poor: 1800 },
  };

  function rate(value: number, threshold: { good: number; poor: number }): 'good' | 'needs_improvement' | 'poor' {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs_improvement';
    return 'poor';
  }

  const vitals = {
    lcp: { value: metrics.lcp, rating: rate(metrics.lcp, thresholds.lcp), threshold: thresholds.lcp.good },
    fid: { value: metrics.fid, rating: rate(metrics.fid, thresholds.fid), threshold: thresholds.fid.good },
    cls: { value: metrics.cls, rating: rate(metrics.cls, thresholds.cls), threshold: thresholds.cls.good },
    inp: { value: metrics.inp, rating: rate(metrics.inp, thresholds.inp), threshold: thresholds.inp.good },
    ttfb: { value: metrics.ttfb, rating: rate(metrics.ttfb, thresholds.ttfb), threshold: thresholds.ttfb.good },
  };

  // Overall score: each metric gets 20%, good=100, needs_improvement=50, poor=0
  const scoreMap = { good: 100, needs_improvement: 50, poor: 0 };
  const overallScore = Math.round(
    (scoreMap[vitals.lcp.rating] +
     scoreMap[vitals.fid.rating] +
     scoreMap[vitals.cls.rating] +
     scoreMap[vitals.inp.rating] +
     scoreMap[vitals.ttfb.rating]) / 5
  );

  return { ...vitals, overallScore, lastUpdated: new Date().toISOString() };
}

// ── Local SEO ─────────────────────────────────────────────────────────────

/**
 * Calculate local SEO score based on GMB optimization and citations.
 */
export function calculateLocalSEOScore(
  gmbStatuses: Record<string, 'complete' | 'incomplete' | 'needs_update'>,
  citationData: { directory: string; listed: boolean; napConsistent: boolean }[],
  localRankings: LocalRanking[],
): LocalSEOScore {
  // GMB score
  const gmbItems: GMBCheckItem[] = GMB_CHECKLIST_ITEMS.map(item => ({
    ...item,
    status: gmbStatuses[item.name] || 'incomplete',
  }));

  const gmbWeights = { high: 3, medium: 2, low: 1 };
  const gmbMaxScore = gmbItems.reduce((s, i) => s + gmbWeights[i.priority], 0);
  const gmbActualScore = gmbItems.reduce((s, i) => {
    const w = gmbWeights[i.priority];
    if (i.status === 'complete') return s + w;
    if (i.status === 'needs_update') return s + w * 0.5;
    return s;
  }, 0);
  const gmbScore = gmbMaxScore > 0 ? Math.round((gmbActualScore / gmbMaxScore) * 100) : 0;

  // Citations
  const directories = IMPORTANT_DIRECTORIES.map(dir => {
    const data = citationData.find(c => c.directory === dir);
    return {
      name: dir,
      status: data ? (data.listed ? (data.napConsistent ? 'listed' as const : 'inconsistent' as const) : 'missing' as const) : 'missing' as const,
      napMatch: data?.napConsistent || false,
    };
  });

  const listed = directories.filter(d => d.status === 'listed').length;
  const inconsistent = directories.filter(d => d.status === 'inconsistent').length;
  const missing = directories.filter(d => d.status === 'missing').length;

  const citations: CitationStatus = {
    totalCitations: listed + inconsistent,
    consistent: listed,
    inconsistent,
    missing,
    directories,
  };

  // Overall local SEO score
  const citationScore = directories.length > 0
    ? Math.round((listed / directories.length) * 100)
    : 0;

  const rankingScore = localRankings.length > 0
    ? Math.round(localRankings.filter(r => r.position <= 10).length / localRankings.length * 100)
    : 0;

  const overallScore = Math.round(gmbScore * 0.45 + citationScore * 0.25 + rankingScore * 0.30);

  return {
    overallScore,
    gmbOptimization: { score: gmbScore, items: gmbItems },
    citations,
    localRankings,
  };
}

// ── Keyword Analysis ──────────────────────────────────────────────────────

/**
 * Analyze keyword ranking changes and generate summary.
 */
export function analyzeKeywordRankings(rankings: KeywordRanking[]): SEOSummary {
  const improved = rankings.filter(r => r.change > 0);
  const declined = rankings.filter(r => r.change < 0);
  const stable = rankings.filter(r => r.change === 0);

  const positions = rankings.filter(r => r.position > 0).map(r => r.position);
  const avgPosition = positions.length > 0
    ? Math.round(positions.reduce((s, p) => s + p, 0) / positions.length * 10) / 10
    : 0;

  const top3 = rankings.filter(r => r.position > 0 && r.position <= 3).length;
  const top10 = rankings.filter(r => r.position > 0 && r.position <= 10).length;
  const top20 = rankings.filter(r => r.position > 0 && r.position <= 20).length;

  // Top wins (biggest improvements)
  const topWins = improved
    .sort((a, b) => b.change - a.change)
    .slice(0, 5)
    .map(r => `"${r.keyword}" improved ${r.change} positions to #${r.position}`);

  // Top losses
  const topLosses = declined
    .sort((a, b) => a.change - b.change)
    .slice(0, 5)
    .map(r => `"${r.keyword}" dropped ${Math.abs(r.change)} positions to #${r.position}`);

  // Traffic trend estimate
  const totalTrafficPotential = rankings
    .filter(r => r.position > 0 && r.position <= 10)
    .reduce((s, r) => s + estimateClicksFromPosition(r.position, r.searchVolume), 0);
  const trafficTrend = improved.length > declined.length ? 'up' : improved.length < declined.length ? 'down' : 'stable';

  // Recommendations
  const recommendations: string[] = [];
  if (top10 < rankings.length * 0.3) {
    recommendations.push('Less than 30% of tracked keywords in top 10 — focus on content optimization and link building');
  }
  if (declined.length > improved.length) {
    recommendations.push('More keywords declining than improving — audit recently changed pages for issues');
  }
  const highVolumeNotRanking = rankings.filter(r => r.searchVolume > 1000 && (r.position === 0 || r.position > 20));
  if (highVolumeNotRanking.length > 0) {
    recommendations.push(`${highVolumeNotRanking.length} high-volume keywords not in top 20 — create targeted content`);
  }
  if (rankings.filter(r => r.category === 'location' && r.position <= 10).length < 3) {
    recommendations.push('Few local keywords in top 10 — strengthen local SEO (GMB, citations, local content)');
  }

  return {
    totalKeywordsTracked: rankings.length,
    keywordsImproved: improved.length,
    keywordsDeclined: declined.length,
    keywordsStable: stable.length,
    avgPosition,
    top3Count: top3,
    top10Count: top10,
    top20Count: top20,
    organicTrafficTrend: trafficTrend,
    topWins,
    topLosses,
    recommendations,
  };
}

/**
 * Estimate monthly clicks based on position and search volume.
 * Uses approximate CTR curve for organic results.
 */
function estimateClicksFromPosition(position: number, searchVolume: number): number {
  const ctrByPosition: Record<number, number> = {
    1: 0.316, 2: 0.241, 3: 0.186, 4: 0.087, 5: 0.068,
    6: 0.039, 7: 0.031, 8: 0.025, 9: 0.021, 10: 0.018,
  };
  const ctr = ctrByPosition[position] || (position <= 20 ? 0.01 : 0.005);
  return Math.round(searchVolume * ctr);
}

/**
 * Identify content gaps based on competitor keyword data.
 */
export function identifyContentGaps(
  ourRankings: KeywordRanking[],
  competitorKeywords: { keyword: string; searchVolume: number; difficulty: number; competitors: number }[],
): ContentGap[] {
  const ourKeywordSet = new Set(ourRankings.filter(r => r.position > 0 && r.position <= 20).map(r => r.keyword));

  return competitorKeywords
    .filter(ck => !ourKeywordSet.has(ck.keyword))
    .map(ck => {
      let priority: ContentGap['priority'];
      if (ck.searchVolume > 1000 && ck.difficulty < 50) priority = 'high';
      else if (ck.searchVolume > 500 || ck.difficulty < 40) priority = 'medium';
      else priority = 'low';

      return {
        keyword: ck.keyword,
        searchVolume: ck.searchVolume,
        difficulty: ck.difficulty,
        competitorsRanking: ck.competitors,
        suggestedContentType: ck.searchVolume > 1000 ? 'Pillar blog post + supporting content' : 'Blog post or FAQ page',
        estimatedTrafficPotential: estimateClicksFromPosition(5, ck.searchVolume), // assume position 5
        priority,
      };
    })
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority] || b.estimatedTrafficPotential - a.estimatedTrafficPotential;
    });
}

/**
 * Analyze competitor keyword overlap.
 */
export function analyzeCompetitorOverlap(
  ourRankings: KeywordRanking[],
  competitorRankings: { competitor: string; keyword: string; position: number }[],
): CompetitorKeywordOverlap[] {
  const ourKeywords = new Set(ourRankings.map(r => r.keyword));

  // Group by competitor
  const competitorMap = new Map<string, { keyword: string; position: number }[]>();
  for (const cr of competitorRankings) {
    if (!competitorMap.has(cr.competitor)) competitorMap.set(cr.competitor, []);
    competitorMap.get(cr.competitor)!.push({ keyword: cr.keyword, position: cr.position });
  }

  return Array.from(competitorMap.entries()).map(([competitor, keywords]) => {
    const theirKeywords = new Set(keywords.map(k => k.keyword));
    const shared = [...ourKeywords].filter(k => theirKeywords.has(k));
    const ourOnly = [...ourKeywords].filter(k => !theirKeywords.has(k));
    const theirOnly = [...theirKeywords].filter(k => !ourKeywords.has(k));

    // Find opportunities (keywords where they rank higher)
    const opportunities = shared
      .map(kw => {
        const ours = ourRankings.find(r => r.keyword === kw);
        const theirs = keywords.find(k => k.keyword === kw);
        if (!ours || !theirs) return null;
        return {
          keyword: kw,
          theirPosition: theirs.position,
          ourPosition: ours.position,
          gap: ours.position - theirs.position,
        };
      })
      .filter((o): o is NonNullable<typeof o> => o !== null && o.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 10);

    return {
      competitor,
      sharedKeywords: shared.length,
      competitorOnlyKeywords: theirOnly.length,
      ourOnlyKeywords: ourOnly.length,
      overlapPercentage: ourKeywords.size > 0
        ? Math.round((shared.length / ourKeywords.size) * 100)
        : 0,
      opportunities,
    };
  });
}

/**
 * Get default target keywords for Rani Beauty Clinic.
 */
export function getTargetKeywords(): typeof TARGET_KEYWORDS {
  return [...TARGET_KEYWORDS];
}

/**
 * Get GMB checklist items.
 */
export function getGMBChecklist(): typeof GMB_CHECKLIST_ITEMS {
  return [...GMB_CHECKLIST_ITEMS];
}
