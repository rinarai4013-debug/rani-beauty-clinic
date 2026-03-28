import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import {
  runTechnicalSEOChecks, evaluateCoreWebVitals, calculateLocalSEOScore,
  analyzeKeywordRankings, identifyContentGaps, getTargetKeywords,
  type KeywordRanking,
} from '@/lib/marketing/seo-monitor';

/**
 * GET /api/dashboard/marketing/seo
 * SEO dashboard — keyword rankings, technical health, CWV, local SEO, content gaps.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Keyword rankings — in production, fetched from SEO tool API
    const targetKws = getTargetKeywords();
    const keywordRankings: KeywordRanking[] = targetKws.map((kw, i) => {
      // Simulated ranking data
      const positions = [2, 5, 8, 12, 3, 7, 15, 18, 6, 22, 35, 4, 11, 14, 9, 17, 28, 10, 25, 13, 16, 19, 21, 30, 3, 7];
      const pos = positions[i % positions.length];
      const prevPos = pos + Math.floor(Math.random() * 6) - 3;
      return {
        ...kw,
        position: pos,
        previousPosition: prevPos,
        change: prevPos - pos,
        url: `https://ranibeautyclinic.com/services/${kw.keyword.replace(/\s+/g, '-')}`,
        featured: pos <= 3 && Math.random() > 0.7,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Technical SEO
    const technicalHealth = runTechnicalSEOChecks({
      hasSSL: true,
      hasSitemap: true,
      hasRobotsTxt: true,
      mobileResponsive: true,
      pageCount: 87,
      indexedPages: 82,
      avgPageSpeed: 1.8,
      brokenLinks: 2,
      redirectChains: 1,
      duplicateContent: 0,
      missingMetaTitles: 0,
      missingMetaDescriptions: 3,
      missingAltTags: 8,
      hasSchemaMarkup: true,
      hasLocalBusinessSchema: true,
      hasFAQSchema: true,
      hasReviewSchema: false,
      canonicalIssues: 1,
      h1Issues: 2,
      mixedContent: false,
    });

    // Core Web Vitals
    const coreWebVitals = evaluateCoreWebVitals({
      lcp: 1850,
      fid: 45,
      cls: 0.05,
      inp: 150,
      ttfb: 420,
    });

    // Local SEO
    const gmbStatuses: Record<string, 'complete' | 'incomplete' | 'needs_update'> = {
      'Business Name': 'complete',
      'Address': 'complete',
      'Phone Number': 'complete',
      'Website URL': 'complete',
      'Business Hours': 'complete',
      'Business Category': 'complete',
      'Business Description': 'complete',
      'Services Listed': 'needs_update',
      'Photos (Exterior)': 'complete',
      'Photos (Interior)': 'complete',
      'Photos (Team)': 'incomplete',
      'Photos (Before/After)': 'needs_update',
      'Google Posts': 'complete',
      'Q&A Section': 'incomplete',
      'Booking Link': 'complete',
      'Messaging Enabled': 'complete',
      'Attributes': 'needs_update',
      'Review Responses': 'needs_update',
    };

    const citationData = [
      { directory: 'Google Business Profile', listed: true, napConsistent: true },
      { directory: 'Yelp', listed: true, napConsistent: true },
      { directory: 'Facebook', listed: true, napConsistent: true },
      { directory: 'Healthgrades', listed: true, napConsistent: false },
      { directory: 'RealSelf', listed: false, napConsistent: false },
      { directory: 'ZocDoc', listed: false, napConsistent: false },
      { directory: 'Apple Maps', listed: true, napConsistent: true },
      { directory: 'Bing Places', listed: true, napConsistent: true },
      { directory: 'Yellow Pages', listed: false, napConsistent: false },
      { directory: 'BBB', listed: false, napConsistent: false },
    ];

    const localRankings = [
      { keyword: 'medspa renton wa', position: 3, mapPackPosition: 2, city: 'Renton', lastUpdated: new Date().toISOString() },
      { keyword: 'hydrafacial renton', position: 5, mapPackPosition: 3, city: 'Renton', lastUpdated: new Date().toISOString() },
      { keyword: 'botox renton wa', position: 7, city: 'Renton', lastUpdated: new Date().toISOString() },
      { keyword: 'sofwave near me', position: 12, city: 'Renton', lastUpdated: new Date().toISOString() },
    ];

    const localSEO = calculateLocalSEOScore(gmbStatuses, citationData, localRankings);

    // Content gaps
    const competitorKeywords = [
      { keyword: 'morpheus8 near me', searchVolume: 2400, difficulty: 55, competitors: 4 },
      { keyword: 'microneedling renton', searchVolume: 390, difficulty: 30, competitors: 3 },
      { keyword: 'cool sculpting renton', searchVolume: 260, difficulty: 40, competitors: 3 },
      { keyword: 'chemical peel near me', searchVolume: 4400, difficulty: 60, competitors: 5 },
      { keyword: 'medspa deals seattle', searchVolume: 720, difficulty: 45, competitors: 4 },
    ];
    const contentGaps = identifyContentGaps(keywordRankings, competitorKeywords);

    // Summary
    const summary = analyzeKeywordRankings(keywordRankings);

    return NextResponse.json({
      summary,
      keywordRankings: keywordRankings.sort((a, b) => a.position - b.position),
      technicalHealth,
      coreWebVitals,
      localSEO,
      contentGaps,
    });
  } catch (error) {
    console.error('[Marketing SEO]', error);
    return NextResponse.json({ error: 'Failed to load SEO data' }, { status: 500 });
  }
}
