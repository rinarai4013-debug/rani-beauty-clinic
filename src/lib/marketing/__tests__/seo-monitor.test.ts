import { describe, expect, it } from 'vitest';

import {
  analyzeCompetitorOverlap,
  analyzeKeywordRankings,
  calculateLocalSEOScore,
  evaluateCoreWebVitals,
  getGMBChecklist,
  getTargetKeywords,
  identifyContentGaps,
  runTechnicalSEOChecks,
} from '@/lib/marketing/seo-monitor';

describe('marketing/seo-monitor', () => {
  it('runTechnicalSEOChecks assigns full score when all checks pass', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: true,
      hasSitemap: true,
      hasRobotsTxt: true,
      pageCount: 120,
      indexedPages: 118,
      avgPageSpeed: 1.8,
      brokenLinks: 0,
      redirectChains: 0,
      duplicateContent: 0,
      missingMetaTitles: 0,
      missingMetaDescriptions: 0,
      missingAltTags: 0,
      hasSchemaMarkup: true,
      hasLocalBusinessSchema: true,
      hasFAQSchema: true,
      hasReviewSchema: true,
      canonicalIssues: 0,
      h1Issues: 0,
      mixedContent: false,
    });

    expect(result.overallScore).toBe(94);
    expect(result.criticalIssues).toBe(1);
    expect(result.warnings).toBe(0);
    expect(result.passed).toBeGreaterThan(13);
  });

  it('runTechnicalSEOChecks demotes checks at the right thresholds', () => {
    const result = runTechnicalSEOChecks({
      hasSSL: false,
      hasSitemap: false,
      hasRobotsTxt: false,
      pageCount: 100,
      indexedPages: 70,
      avgPageSpeed: 5.8,
      brokenLinks: 12,
      redirectChains: 3,
      duplicateContent: 4,
      missingMetaTitles: 1,
      missingMetaDescriptions: 6,
      missingAltTags: 11,
      hasSchemaMarkup: false,
      hasLocalBusinessSchema: false,
      hasFAQSchema: false,
      hasReviewSchema: false,
      canonicalIssues: 2,
      h1Issues: 1,
      mixedContent: true,
    });

    expect(result.overallScore).toBeLessThan(100);
    expect(result.criticalIssues).toBeGreaterThan(5);
    expect(result.warnings).toBeGreaterThanOrEqual(6);
    expect(result.passed).toBe(0);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SSL Certificate',
          status: 'fail',
        }),
        expect.objectContaining({
          name: 'XML Sitemap',
          status: 'fail',
        }),
      ])
    );
  });

  it('evaluateCoreWebVitals maps metric thresholds to the right ratings', () => {
    const great = evaluateCoreWebVitals({ lcp: 2500, fid: 100, cls: 0.1, inp: 200, ttfb: 800 });
    const bad = evaluateCoreWebVitals({ lcp: 4010, fid: 450, cls: 0.4, inp: 900, ttfb: 2200 });

    expect(great.lcp.rating).toBe('good');
    expect(great.fid.rating).toBe('good');
    expect(great.cls.rating).toBe('good');
    expect(great.inp.rating).toBe('good');
    expect(great.ttfb.rating).toBe('good');
    expect(great.overallScore).toBe(100);

    expect(bad.lcp.rating).toBe('poor');
    expect(bad.fid.rating).toBe('poor');
    expect(bad.cls.rating).toBe('poor');
    expect(bad.inp.rating).toBe('poor');
    expect(bad.ttfb.rating).toBe('poor');
    expect(bad.overallScore).toBe(0);
  });

  it('calculateLocalSEOScore combines GMB, citation, and local ranking signals', () => {
    const result = calculateLocalSEOScore(
      {
        'Business Name': 'complete',
        'Address': 'needs_update',
        'Phone Number': 'incomplete',
      },
      [
        { directory: 'Google Business Profile', listed: true, napConsistent: true },
        { directory: 'Yelp', listed: true, napConsistent: false },
        { directory: 'Facebook', listed: false, napConsistent: false },
      ],
      [
        { keyword: 'sofwave renton', position: 5, city: 'Renton', lastUpdated: '2026-01-01' },
        { keyword: 'hydrafacial near me', position: 22, city: 'Seattle', lastUpdated: '2026-01-01' },
      ]
    );

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.gmbOptimization.score).toBeLessThan(100);
    expect(result.citations.totalCitations).toBe(2);
    expect(result.citations.inconsistent).toBe(1);
    expect(result.localRankings).toHaveLength(2);
  });

  it('analyzeKeywordRankings computes trend and recommendations', () => {
    const summary = analyzeKeywordRankings([
      { keyword: 'sofwave', position: 1, previousPosition: 4, change: 3, category: 'service', intent: 'transactional', url: '/sofwave', lastUpdated: '2026-01-01', searchVolume: 2000, difficulty: 40 },
      { keyword: 'hydrafacial', position: 12, previousPosition: 10, change: -2, category: 'service', intent: 'transactional', url: '/hydrafacial', lastUpdated: '2026-01-01', searchVolume: 2000, difficulty: 40 },
      { keyword: 'glp-1', position: 45, previousPosition: 45, change: 0, category: 'service', intent: 'transactional', url: '/glp1', lastUpdated: '2026-01-01', searchVolume: 1200, difficulty: 40 },
      { keyword: 'location', position: 0, previousPosition: 0, change: 0, category: 'location', intent: 'local', url: '/loc', lastUpdated: '2026-01-01', searchVolume: 1400, difficulty: 18 },
      { keyword: 'location2', position: 15, previousPosition: 17, change: 2, category: 'location', intent: 'local', url: '/loc2', lastUpdated: '2026-01-01', searchVolume: 400, difficulty: 21 },
    ]);

    expect(summary.keywordsImproved).toBe(2);
    expect(summary.keywordsDeclined).toBe(1);
    expect(summary.keywordsStable).toBe(2);
    expect(summary.totalKeywordsTracked).toBe(5);
    expect(summary.top3Count).toBe(1);
    expect(summary.top10Count).toBe(1);
    expect(summary.top20Count).toBe(3);
    expect(summary.recommendations).toHaveLength(3);
    expect(summary.topWins[0]).toContain('sofwave');
    expect(summary.topLosses[0]).toContain('hydrafacial');
    expect(summary.organicTrafficTrend).toBe('up');
  });

  it('identifyContentGaps prioritizes high-value easy-win topics', () => {
    const gaps = identifyContentGaps(
      [
        { keyword: 'sofwave', position: 8, previousPosition: 10, change: 2, category: 'service', intent: 'transactional', url: '/sofwave', lastUpdated: '2026-01-01', searchVolume: 3000, difficulty: 45 },
      ],
      [
        { keyword: 'prx-t33', searchVolume: 2500, difficulty: 35, competitors: 4 },
        { keyword: 'laser', searchVolume: 650, difficulty: 70, competitors: 2 },
      ]
    );

    expect(gaps).toHaveLength(2);
    expect(gaps[0].keyword).toBe('prx-t33');
    expect(gaps[0].priority).toBe('high');
    expect(gaps[1].priority).toBe('medium');
    expect(gaps[1].estimatedTrafficPotential).toBeGreaterThan(0);
  });

  it('analyzeCompetitorOverlap reports only meaningful competitor gaps', () => {
    const overlaps = analyzeCompetitorOverlap(
      [
        { keyword: 'sofwave', position: 7, previousPosition: 9, change: 2, category: 'service', intent: 'transactional', url: '/sofwave', lastUpdated: '2026-01-01', searchVolume: 500, difficulty: 40 },
        { keyword: 'hydrafacial', position: 14, previousPosition: 9, change: -5, category: 'service', intent: 'transactional', url: '/hydrafacial', lastUpdated: '2026-01-01', searchVolume: 500, difficulty: 40 },
      ],
      [
        { competitor: 'ClinicA', keyword: 'sofwave', position: 3 },
        { competitor: 'ClinicA', keyword: 'microneedling', position: 8 },
        { competitor: 'ClinicB', keyword: 'hydrafacial', position: 20 },
      ]
    );

    const clinicA = overlaps.find((item) => item.competitor === 'ClinicA');
    expect(clinicA).toBeDefined();
    expect(clinicA?.sharedKeywords).toBe(1);
    expect(clinicA?.competitorOnlyKeywords).toBe(1);
    expect(clinicA?.opportunities).toHaveLength(1);

    const clinicB = overlaps.find((item) => item.competitor === 'ClinicB');
    expect(clinicB?.overlapPercentage).toBe(50);
    expect(clinicB?.sharedKeywords).toBe(1);
  });

  it('target keyword catalog helper is mutable-safe and includes no infusion term', () => {
    const before = getTargetKeywords();
    const snapshot = [...before];

    before.push({
      keyword: 'fake test keyword',
      position: 99,
      previousPosition: 99,
      change: 0,
      category: 'service',
      intent: 'commercial',
      url: '/fake',
      lastUpdated: '2026-01-01',
      searchVolume: 1,
      difficulty: 1,
    });

    expect(getTargetKeywords()).toHaveLength(snapshot.length);
    const checklist = getGMBChecklist();
    checklist.push({ name: 'Test', status: 'complete', detail: 'x', priority: 'low' });
    expect(getGMBChecklist()).not.toHaveLength(checklist.length);
    expect(JSON.stringify(getGMBChecklist()).toLowerCase()).not.toContain('infusion');
  });
});
