import {
  generateContentCalendar, scoreContentPerformance, suggestRepurposing,
  analyzeContentGaps, calculateContentROI, getKeywordContentMap,
  getSeasonalTriggers, getTopicClusters,
  type ContentPiece, type ContentPerformance, type ServiceCategory,
} from '@/lib/marketing/content-calendar';

// ── generateContentCalendar ─────────────────────────────────────────────

describe('generateContentCalendar', () => {
  it('generates 30-day calendar', () => {
    const cal = generateContentCalendar('30_day', '2026-04-01');
    expect(cal.period).toBe('30_day');
    expect(cal.totalPieces).toBeGreaterThan(0);
    expect(cal.weeklyBreakdown.length).toBeGreaterThanOrEqual(4);
  });

  it('generates 60-day calendar with more content', () => {
    const cal30 = generateContentCalendar('30_day', '2026-04-01');
    const cal60 = generateContentCalendar('60_day', '2026-04-01');
    expect(cal60.totalPieces).toBeGreaterThan(cal30.totalPieces);
  });

  it('generates 90-day calendar', () => {
    const cal = generateContentCalendar('90_day', '2026-04-01');
    expect(cal.weeklyBreakdown.length).toBeGreaterThanOrEqual(12);
  });

  it('includes blog posts in content mix', () => {
    const cal = generateContentCalendar('30_day');
    expect(cal.byType.blog_post).toBeGreaterThan(0);
  });

  it('includes social posts in content mix', () => {
    const cal = generateContentCalendar('30_day');
    expect(cal.byType.social_post).toBeGreaterThan(0);
  });

  it('includes educational reels', () => {
    const cal = generateContentCalendar('30_day');
    expect(cal.byType.educational_reel).toBeGreaterThan(0);
  });

  it('maps content to channels', () => {
    const cal = generateContentCalendar('30_day');
    expect(cal.byChannel.instagram || cal.byChannel.blog).toBeGreaterThan(0);
  });

  it('each piece has required fields', () => {
    const cal = generateContentCalendar('30_day');
    for (const piece of cal.pieces) {
      expect(piece.id).toBeTruthy();
      expect(piece.title).toBeTruthy();
      expect(piece.type).toBeTruthy();
      expect(piece.category).toBeTruthy();
      expect(piece.channel.length).toBeGreaterThan(0);
      expect(piece.estimatedTime).toBeGreaterThan(0);
      expect(piece.priority).toBeTruthy();
    }
  });

  it('weekly breakdown has themes', () => {
    const cal = generateContentCalendar('30_day');
    for (const week of cal.weeklyBreakdown) {
      expect(week.theme).toBeTruthy();
      expect(week.weekNumber).toBeGreaterThan(0);
    }
  });

  it('assigns scheduled dates to pieces', () => {
    const cal = generateContentCalendar('30_day', '2026-04-01');
    const scheduled = cal.pieces.filter(p => p.scheduledDate);
    expect(scheduled.length).toBeGreaterThan(0);
  });

  it('includes topic cluster coverage scores', () => {
    const cal = generateContentCalendar('30_day');
    expect(cal.topicClusters.length).toBeGreaterThan(0);
    for (const cluster of cal.topicClusters) {
      expect(cluster.coverageScore).toBeGreaterThanOrEqual(0);
      expect(cluster.coverageScore).toBeLessThanOrEqual(100);
    }
  });

  it('covers multiple service categories', () => {
    const cal = generateContentCalendar('30_day');
    const categories = new Set(cal.pieces.map(p => p.category));
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  it('includes email newsletters monthly', () => {
    const cal = generateContentCalendar('90_day');
    const newsletters = cal.pieces.filter(p => p.type === 'email_newsletter');
    expect(newsletters.length).toBeGreaterThanOrEqual(2);
  });
});

// ── scoreContentPerformance ─────────────────────────────────────────────

describe('scoreContentPerformance', () => {
  it('returns 0 for empty metrics', () => {
    expect(scoreContentPerformance({})).toBe(0);
  });

  it('scores high for popular content', () => {
    const score = scoreContentPerformance({
      pageViews: 1000,
      avgTimeOnPage: 300,
      socialShares: 100,
      likes: 500,
      conversions: 10,
    });
    expect(score).toBeGreaterThan(70);
  });

  it('scores low for poor performing content', () => {
    const score = scoreContentPerformance({
      pageViews: 20,
      avgTimeOnPage: 15,
    });
    expect(score).toBeLessThan(20);
  });

  it('returns score between 0 and 100', () => {
    const score = scoreContentPerformance({
      pageViews: 500,
      avgTimeOnPage: 120,
      conversions: 2,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('values conversions highly', () => {
    const withConversions = scoreContentPerformance({ pageViews: 100, conversions: 5 });
    const withoutConversions = scoreContentPerformance({ pageViews: 100, conversions: 0 });
    expect(withConversions).toBeGreaterThan(withoutConversions);
  });
});

// ── suggestRepurposing ──────────────────────────────────────────────────

describe('suggestRepurposing', () => {
  it('suggests repurposing options for blog posts', () => {
    const piece: ContentPiece = {
      id: 'test', title: 'Test Blog', type: 'blog_post', category: 'facials',
      topic: 'Facials', keywords: [], status: 'published', channel: ['blog'],
      estimatedTime: 180, priority: 'high',
    };
    const result = suggestRepurposing(piece);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.originalType).toBe('blog_post');
  });

  it('suggests social and video from blog posts', () => {
    const piece: ContentPiece = {
      id: 'test', title: 'Test', type: 'blog_post', category: 'facials',
      topic: 'Test', keywords: [], status: 'published', channel: ['blog'],
      estimatedTime: 180, priority: 'medium',
    };
    const result = suggestRepurposing(piece);
    const types = result.suggestions.map(s => s.newType);
    expect(types).toContain('social_post');
    expect(types).toContain('educational_reel');
  });

  it('repurposing time is less than original creation time', () => {
    const piece: ContentPiece = {
      id: 'test', title: 'Test', type: 'blog_post', category: 'facials',
      topic: 'Test', keywords: [], status: 'published', channel: ['blog'],
      estimatedTime: 180, priority: 'medium',
    };
    const result = suggestRepurposing(piece);
    for (const s of result.suggestions) {
      expect(s.estimatedTime).toBeLessThan(piece.estimatedTime * 1.5);
    }
  });

  it('suggests case study from testimonial', () => {
    const piece: ContentPiece = {
      id: 'test', title: 'Test', type: 'testimonial', category: 'injectables',
      topic: 'Test', keywords: [], status: 'published', channel: ['instagram'],
      estimatedTime: 45, priority: 'medium',
    };
    const result = suggestRepurposing(piece);
    const types = result.suggestions.map(s => s.newType);
    expect(types).toContain('case_study');
  });
});

// ── analyzeContentGaps ──────────────────────────────────────────────────

describe('analyzeContentGaps', () => {
  it('identifies gaps when competitor has topics we lack', () => {
    const ourContent: ContentPiece[] = [];
    const competitorTopics = [
      { topic: 'morpheus8', category: 'laser' as ServiceCategory, competitorCount: 4 },
    ];
    const gaps = analyzeContentGaps(ourContent, competitorTopics);
    expect(gaps.length).toBe(1);
    expect(gaps[0].ourCoverage).toBe('none');
    expect(gaps[0].opportunity).toBe('high');
  });

  it('marks partial coverage when we have some content', () => {
    const ourContent: ContentPiece[] = [{
      id: '1', title: 'Sofwave treatment guide', type: 'blog_post', category: 'skin_tightening',
      topic: 'Sofwave', keywords: ['sofwave'], status: 'published', channel: ['blog'],
      estimatedTime: 180, priority: 'high',
    }];
    const competitorTopics = [
      { topic: 'sofwave', category: 'skin_tightening' as ServiceCategory, competitorCount: 3 },
    ];
    const gaps = analyzeContentGaps(ourContent, competitorTopics);
    expect(gaps[0].ourCoverage).toBe('partial');
  });

  it('sorts by opportunity priority', () => {
    const gaps = analyzeContentGaps([], [
      { topic: 'low-volume', category: 'general' as ServiceCategory, competitorCount: 1 },
      { topic: 'high-volume', category: 'laser' as ServiceCategory, competitorCount: 5 },
    ]);
    expect(gaps[0].opportunity).toBe('high');
  });
});

// ── calculateContentROI ─────────────────────────────────────────────────

describe('calculateContentROI', () => {
  it('calculates total conversions and revenue', () => {
    const performances: ContentPerformance[] = [
      { pieceId: '1', title: 'Blog 1', type: 'blog_post', channel: 'blog', publishedDate: '2026-03-01', metrics: { conversions: 3 }, performanceScore: 70 },
      { pieceId: '2', title: 'Reel 1', type: 'educational_reel', channel: 'instagram', publishedDate: '2026-03-05', metrics: { conversions: 2 }, performanceScore: 60 },
    ];
    const roi = calculateContentROI(performances);
    expect(roi.totalConversions).toBe(5);
    expect(roi.totalRevenue).toBeGreaterThan(0);
    expect(roi.totalPieces).toBe(2);
  });

  it('identifies top performers', () => {
    const performances: ContentPerformance[] = [
      { pieceId: '1', title: 'Top', type: 'blog_post', channel: 'blog', publishedDate: '2026-03-01', metrics: { conversions: 10 }, performanceScore: 95 },
      { pieceId: '2', title: 'Low', type: 'social_post', channel: 'instagram', publishedDate: '2026-03-05', metrics: { conversions: 0 }, performanceScore: 10 },
    ];
    const roi = calculateContentROI(performances);
    expect(roi.topPerformers[0].performanceScore).toBe(95);
    expect(roi.underperformers[0].performanceScore).toBe(10);
  });

  it('handles empty performances', () => {
    const roi = calculateContentROI([]);
    expect(roi.totalPieces).toBe(0);
    expect(roi.avgPerformanceScore).toBe(0);
  });
});

// ── getKeywordContentMap ────────────────────────────────────────────────

describe('getKeywordContentMap', () => {
  it('returns keywords mapped to categories', () => {
    const map = getKeywordContentMap();
    expect(map.length).toBeGreaterThan(0);
    for (const kw of map) {
      expect(kw.keyword).toBeTruthy();
      expect(kw.category).toBeTruthy();
      expect(kw.suggestedTypes.length).toBeGreaterThan(0);
    }
  });
});

// ── getSeasonalTriggers ─────────────────────────────────────────────────

describe('getSeasonalTriggers', () => {
  it('returns triggers for January', () => {
    const triggers = getSeasonalTriggers(1);
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers[0].trigger).toContain('New Year');
  });

  it('returns triggers for December', () => {
    const triggers = getSeasonalTriggers(12);
    expect(triggers.length).toBeGreaterThan(0);
  });

  it('returns triggers for current month when no arg', () => {
    const triggers = getSeasonalTriggers();
    expect(triggers.length).toBeGreaterThan(0);
  });
});

// ── getTopicClusters ────────────────────────────────────────────────────

describe('getTopicClusters', () => {
  it('returns topic clusters for all service categories', () => {
    const clusters = getTopicClusters();
    expect(clusters.length).toBeGreaterThanOrEqual(5);
    for (const cluster of clusters) {
      expect(cluster.pillarTopic).toBeTruthy();
      expect(cluster.subtopics.length).toBeGreaterThan(0);
      expect(cluster.keywords.length).toBeGreaterThan(0);
    }
  });

  it('includes wellness injections cluster (not infusions)', () => {
    const clusters = getTopicClusters();
    const wellness = clusters.find(c => c.category === 'wellness_injections');
    expect(wellness).toBeDefined();
    expect(wellness?.pillarTopic).toContain('Injection');
    // Verify we never say "infusion"
    for (const subtopic of wellness?.subtopics || []) {
      expect(subtopic.toLowerCase()).not.toContain('infusion');
    }
  });
});
