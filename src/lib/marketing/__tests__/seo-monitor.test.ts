import {
  runTechnicalSEOChecks, evaluateCoreWebVitals, calculateLocalSEOScore,
  analyzeKeywordRankings, identifyContentGaps, analyzeCompetitorOverlap,
  getTargetKeywords, getGMBChecklist,
  type KeywordRanking, type LocalRanking,
} from '@/lib/marketing/seo-monitor';

// ── Helper ──────────────────────────────────────────────────────────────

function makeKeyword(overrides: Partial<KeywordRanking> = {}): KeywordRanking {
  return {
    keyword: overrides.keyword || 'sofwave near me',
    position: overrides.position ?? 5,
    previousPosition: overrides.previousPosition ?? 8,
    change: overrides.change ?? 3,
    url: overrides.url || '/services/sofwave',
    searchVolume: overrides.searchVolume ?? 2400,
    difficulty: overrides.difficulty ?? 55,
    category: overrides.category || 'service',
    intent: overrides.intent || 'transactional',
    featured: overrides.featured ?? false,
    lastUpdated: new Date().toISOString(),
  };
}

// ── runTechnicalSEOChecks ───────────────────────────────────────────────

describe('runTechnicalSEOChecks', () => {
  it('returns a score between 0 and 100', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true, hasSitemap: true, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 48, avgPageSpeed: 2.0, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('scores high for a well-optimized site', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true, hasSitemap: true, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 50, avgPageSpeed: 1.5, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    expect(result.overallScore).toBeGreaterThan(90);
    expect(result.criticalIssues).toBe(0);
  });

  it('flags missing SSL as critical', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: false, hasSitemap: true, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 50, avgPageSpeed: 2.0, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    const sslCheck = result.checks.find(c => c.name === 'SSL Certificate');
    expect(sslCheck?.status).toBe('fail');
    expect(result.criticalIssues).toBeGreaterThan(0);
  });

  it('flags missing sitemap as critical', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true, hasSitemap: false, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 50, avgPageSpeed: 2.0, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    const sitemapCheck = result.checks.find(c => c.name === 'XML Sitemap');
    expect(sitemapCheck?.status).toBe('fail');
  });

  it('warns about slow page speed', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true, hasSitemap: true, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 50, avgPageSpeed: 3.5, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    const speedCheck = result.checks.find(c => c.name === 'Page Speed');
    expect(speedCheck?.status).toBe('warning');
  });

  it('flags missing mobile responsiveness', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true, hasSitemap: true, hasRobotsTxt: true, mobileResponsive: false,
      pageCount: 50, indexedPages: 50, avgPageSpeed: 2.0, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    const mobileCheck = result.checks.find(c => c.name === 'Mobile Responsiveness');
    expect(mobileCheck?.status).toBe('fail');
  });

  it('counts passes, warnings, and failures', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true, hasSitemap: true, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 45, avgPageSpeed: 2.0, brokenLinks: 3,
      redirectChains: 2, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 5, missingAltTags: 12, hasSchemaMarkup: true,
      hasLocalBusinessSchema: true, hasFAQSchema: false, hasReviewSchema: false,
      canonicalIssues: 1, h1Issues: 1, mixedContent: false,
    });
    expect(result.passed + result.warnings + result.criticalIssues).toBe(result.checks.length);
  });

  it('includes recommendations for failed checks', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: false, hasSitemap: false, hasRobotsTxt: true, mobileResponsive: true,
      pageCount: 50, indexedPages: 50, avgPageSpeed: 2.0, brokenLinks: 0,
      redirectChains: 0, duplicateContent: 0, missingMetaTitles: 0,
      missingMetaDescriptions: 0, missingAltTags: 0, hasSchemaMarkup: true,
      hasLocalBusinessSchema: false, hasFAQSchema: true, hasReviewSchema: true,
      canonicalIssues: 0, h1Issues: 0, mixedContent: false,
    });
    const failedChecks = result.checks.filter(c => c.status === 'fail');
    const withRecs = failedChecks.filter(c => c.recommendation);
    expect(withRecs.length).toBeGreaterThan(0);
  });
});

// ── evaluateCoreWebVitals ───────────────────────────────────────────────

describe('evaluateCoreWebVitals', () => {
  it('rates all good metrics as good', () => {
    const vitals = evaluateCoreWebVitals({ lcp: 1500, fid: 50, cls: 0.05, inp: 100, ttfb: 400 });
    expect(vitals.lcp.rating).toBe('good');
    expect(vitals.fid.rating).toBe('good');
    expect(vitals.cls.rating).toBe('good');
    expect(vitals.inp.rating).toBe('good');
    expect(vitals.ttfb.rating).toBe('good');
    expect(vitals.overallScore).toBe(100);
  });

  it('rates all poor metrics as poor', () => {
    const vitals = evaluateCoreWebVitals({ lcp: 5000, fid: 400, cls: 0.3, inp: 600, ttfb: 2000 });
    expect(vitals.lcp.rating).toBe('poor');
    expect(vitals.fid.rating).toBe('poor');
    expect(vitals.cls.rating).toBe('poor');
    expect(vitals.inp.rating).toBe('poor');
    expect(vitals.ttfb.rating).toBe('poor');
    expect(vitals.overallScore).toBe(0);
  });

  it('rates mixed metrics correctly', () => {
    const vitals = evaluateCoreWebVitals({ lcp: 1500, fid: 200, cls: 0.15, inp: 300, ttfb: 400 });
    expect(vitals.lcp.rating).toBe('good');
    expect(vitals.fid.rating).toBe('needs_improvement');
    expect(vitals.cls.rating).toBe('needs_improvement');
    expect(vitals.overallScore).toBeGreaterThan(0);
    expect(vitals.overallScore).toBeLessThan(100);
  });

  it('includes threshold values', () => {
    const vitals = evaluateCoreWebVitals({ lcp: 1500, fid: 50, cls: 0.05, inp: 100, ttfb: 400 });
    expect(vitals.lcp.threshold).toBe(2500);
    expect(vitals.cls.threshold).toBe(0.1);
  });

  it('includes lastUpdated timestamp', () => {
    const vitals = evaluateCoreWebVitals({ lcp: 1500, fid: 50, cls: 0.05, inp: 100, ttfb: 400 });
    expect(vitals.lastUpdated).toBeTruthy();
  });
});

// ── calculateLocalSEOScore ──────────────────────────────────────────────

describe('calculateLocalSEOScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = calculateLocalSEOScore(
      { 'Business Name': 'complete', 'Address': 'complete', 'Phone Number': 'complete' },
      [{ directory: 'Google Business Profile', listed: true, napConsistent: true }],
      [{ keyword: 'medspa renton', position: 3, city: 'Renton', lastUpdated: new Date().toISOString() }],
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('scores higher when more GMB items are complete', () => {
    const allComplete = calculateLocalSEOScore(
      Object.fromEntries(getGMBChecklist().map(i => [i.name, 'complete'])),
      [], [],
    );
    const noneComplete = calculateLocalSEOScore({}, [], []);
    expect(allComplete.overallScore).toBeGreaterThan(noneComplete.overallScore);
  });

  it('includes citation status', () => {
    const result = calculateLocalSEOScore(
      {},
      [
        { directory: 'Google Business Profile', listed: true, napConsistent: true },
        { directory: 'Yelp', listed: true, napConsistent: false },
        { directory: 'RealSelf', listed: false, napConsistent: false },
      ],
      [],
    );
    expect(result.citations.consistent).toBe(1);
    expect(result.citations.inconsistent).toBe(1);
    expect(result.citations.missing).toBeGreaterThanOrEqual(1);
  });

  it('includes GMB checklist items', () => {
    const result = calculateLocalSEOScore({}, [], []);
    expect(result.gmbOptimization.items.length).toBeGreaterThan(0);
  });
});

// ── analyzeKeywordRankings ──────────────────────────────────────────────

describe('analyzeKeywordRankings', () => {
  it('counts improved and declined keywords', () => {
    const rankings = [
      makeKeyword({ keyword: 'kw1', position: 5, change: 3 }),
      makeKeyword({ keyword: 'kw2', position: 10, change: -2 }),
      makeKeyword({ keyword: 'kw3', position: 15, change: 0 }),
    ];
    const summary = analyzeKeywordRankings(rankings);
    expect(summary.keywordsImproved).toBe(1);
    expect(summary.keywordsDeclined).toBe(1);
    expect(summary.keywordsStable).toBe(1);
  });

  it('counts top 3, 10, 20 rankings', () => {
    const rankings = [
      makeKeyword({ keyword: 'kw1', position: 2 }),
      makeKeyword({ keyword: 'kw2', position: 8 }),
      makeKeyword({ keyword: 'kw3', position: 15 }),
      makeKeyword({ keyword: 'kw4', position: 25 }),
    ];
    const summary = analyzeKeywordRankings(rankings);
    expect(summary.top3Count).toBe(1);
    expect(summary.top10Count).toBe(2);
    expect(summary.top20Count).toBe(3);
  });

  it('calculates average position', () => {
    const rankings = [
      makeKeyword({ keyword: 'kw1', position: 5 }),
      makeKeyword({ keyword: 'kw2', position: 15 }),
    ];
    const summary = analyzeKeywordRankings(rankings);
    expect(summary.avgPosition).toBe(10);
  });

  it('lists top wins', () => {
    const rankings = [
      makeKeyword({ keyword: 'big-win', position: 3, change: 15 }),
      makeKeyword({ keyword: 'small-win', position: 8, change: 2 }),
    ];
    const summary = analyzeKeywordRankings(rankings);
    expect(summary.topWins.length).toBeGreaterThan(0);
    expect(summary.topWins[0]).toContain('big-win');
  });

  it('generates recommendations', () => {
    const rankings = [
      makeKeyword({ keyword: 'kw1', position: 50, change: -10, searchVolume: 5000 }),
    ];
    const summary = analyzeKeywordRankings(rankings);
    expect(summary.recommendations.length).toBeGreaterThan(0);
  });

  it('handles empty rankings', () => {
    const summary = analyzeKeywordRankings([]);
    expect(summary.totalKeywordsTracked).toBe(0);
    expect(summary.avgPosition).toBe(0);
  });
});

// ── identifyContentGaps ─────────────────────────────────────────────────

describe('identifyContentGaps', () => {
  it('identifies keywords competitors rank for but we do not', () => {
    const ourRankings = [makeKeyword({ keyword: 'sofwave near me', position: 5 })];
    const competitorKws = [
      { keyword: 'morpheus8 near me', searchVolume: 2400, difficulty: 55, competitors: 4 },
      { keyword: 'sofwave near me', searchVolume: 2400, difficulty: 55, competitors: 3 },
    ];
    const gaps = identifyContentGaps(ourRankings, competitorKws);
    expect(gaps.length).toBe(1);
    expect(gaps[0].keyword).toBe('morpheus8 near me');
  });

  it('prioritizes high-volume, low-difficulty keywords', () => {
    const gaps = identifyContentGaps([], [
      { keyword: 'high-vol', searchVolume: 5000, difficulty: 30, competitors: 5 },
      { keyword: 'low-vol', searchVolume: 100, difficulty: 80, competitors: 2 },
    ]);
    expect(gaps[0].priority).toBe('high');
  });

  it('includes traffic potential estimate', () => {
    const gaps = identifyContentGaps([], [
      { keyword: 'test', searchVolume: 1000, difficulty: 40, competitors: 3 },
    ]);
    expect(gaps[0].estimatedTrafficPotential).toBeGreaterThan(0);
  });
});

// ── analyzeCompetitorOverlap ────────────────────────────────────────────

describe('analyzeCompetitorOverlap', () => {
  it('calculates shared keywords', () => {
    const ourRankings = [
      makeKeyword({ keyword: 'shared kw', position: 5 }),
      makeKeyword({ keyword: 'our only', position: 10 }),
    ];
    const competitorRankings = [
      { competitor: 'Comp A', keyword: 'shared kw', position: 3 },
      { competitor: 'Comp A', keyword: 'their only', position: 8 },
    ];
    const overlap = analyzeCompetitorOverlap(ourRankings, competitorRankings);
    expect(overlap.length).toBe(1);
    expect(overlap[0].sharedKeywords).toBe(1);
    expect(overlap[0].competitorOnlyKeywords).toBe(1);
    expect(overlap[0].ourOnlyKeywords).toBe(1);
  });

  it('identifies opportunities where competitor ranks higher', () => {
    const ourRankings = [makeKeyword({ keyword: 'test kw', position: 15 })];
    const competitorRankings = [
      { competitor: 'Comp', keyword: 'test kw', position: 3 },
    ];
    const overlap = analyzeCompetitorOverlap(ourRankings, competitorRankings);
    expect(overlap[0].opportunities.length).toBe(1);
    expect(overlap[0].opportunities[0].gap).toBe(12);
  });
});

// ── getTargetKeywords ───────────────────────────────────────────────────

describe('getTargetKeywords', () => {
  it('returns keyword targets for Rani Beauty Clinic', () => {
    const kws = getTargetKeywords();
    expect(kws.length).toBeGreaterThan(20);
  });

  it('includes brand keywords', () => {
    const kws = getTargetKeywords();
    expect(kws.some(k => k.category === 'brand')).toBe(true);
  });

  it('includes location keywords', () => {
    const kws = getTargetKeywords();
    expect(kws.some(k => k.category === 'location')).toBe(true);
  });

  it('uses "injection" not "infusion" in keywords', () => {
    const kws = getTargetKeywords();
    for (const kw of kws) {
      expect(kw.keyword.toLowerCase()).not.toContain('infusion');
    }
  });

  it('includes wellness injection keywords', () => {
    const kws = getTargetKeywords();
    expect(kws.some(k => k.keyword.includes('injection'))).toBe(true);
  });
});

// ── getGMBChecklist ─────────────────────────────────────────────────────

describe('getGMBChecklist', () => {
  it('returns checklist items', () => {
    const items = getGMBChecklist();
    expect(items.length).toBeGreaterThan(10);
  });

  it('includes high-priority items', () => {
    const items = getGMBChecklist();
    expect(items.some(i => i.priority === 'high')).toBe(true);
  });

  it('includes Business Name item', () => {
    const items = getGMBChecklist();
    expect(items.some(i => i.name === 'Business Name')).toBe(true);
  });
});
