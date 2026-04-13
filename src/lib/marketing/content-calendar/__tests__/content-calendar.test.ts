import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.TZ = 'UTC';

import {
  analyzeContentGaps,
  calculateContentROI,
  generateContentCalendar,
  getSeasonalTriggers,
  getTopicClusters,
  scoreContentPerformance,
  suggestRepurposing,
  type ContentPiece,
  type ContentPerformance,
} from '@/lib/marketing/content-calendar';

describe('marketing/content-calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateContentCalendar', () => {
    it('creates a 30-day calendar with expected shape and piece distribution', () => {
      const calendar = generateContentCalendar('30_day', '2026-03-01T00:00:00Z');

      expect(calendar.period).toBe('30_day');
      expect(calendar.startDate).toBe('2026-03-01');
      expect(calendar.endDate).toBe('2026-03-31');
      expect(calendar.totalPieces).toBe(34);
      expect(calendar.weeklyBreakdown.length).toBe(5);
      expect(calendar.pieces.length).toBe(34);
      expect(calendar.byType.blog_post).toBe(5);
      expect(calendar.byType.social_post).toBeGreaterThan(10);
    });

    it('generates topic clusters with coverage scores in valid range', () => {
      const calendar = generateContentCalendar('60_day', '2026-03-01T00:00:00Z');
      for (const cluster of calendar.topicClusters) {
        expect(cluster.coverageScore).toBeGreaterThanOrEqual(0);
        expect(cluster.coverageScore).toBeLessThanOrEqual(100);
        expect(cluster.contentCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('scoreContentPerformance', () => {
    it('returns zero when no metrics are provided', () => {
      expect(scoreContentPerformance({})).toBe(0);
    });

    it('caps each dimension at its individual max and total to 100', () => {
      const score = scoreContentPerformance({
        pageViews: 5_000,
        avgTimeOnPage: 999,
        socialShares: 500,
        likes: 900,
        conversions: 50,
      });
      expect(score).toBe(100);
    });

    it('rounds to integer output', () => {
      const score = scoreContentPerformance({
        pageViews: 250,
        avgTimeOnPage: 90,
        socialShares: 10,
      });
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBe(26);
    });
  });

  describe('suggestRepurposing', () => {
    it('returns multiple mapped suggestions for a blog post', () => {
      const piece: ContentPiece = {
        id: 'piece-1',
        title: 'Sofwave vs surgery: what patients need to know',
        type: 'blog_post',
        category: 'skin_tightening',
        topic: 'Skin tightening basics',
        keywords: ['sofwave'],
        status: 'published',
        channel: ['blog'],
        estimatedTime: 180,
        priority: 'high',
      };

      const repurpose = suggestRepurposing(piece);

      expect(repurpose.suggestions.length).toBe(5);
      expect(repurpose.suggestions[0]).toEqual({
        newType: 'social_post',
        newChannel: 'instagram',
        description: 'Extract key points as carousel slides',
        estimatedTime: 18,
        priority: 'high',
      });
      for (const suggestion of repurpose.suggestions) {
        expect(suggestion.estimatedTime).toBeLessThan(piece.estimatedTime);
      }
    });

    it('returns no suggestions for unmapped content types', () => {
      const piece: ContentPiece = {
        id: 'piece-2',
        title: 'Skin texture infographic',
        type: 'infographic',
        category: 'skin_tightening',
        topic: 'Texture care',
        keywords: ['skin'],
        status: 'planned',
        channel: ['instagram'],
        estimatedTime: 150,
        priority: 'medium',
      };

      expect(suggestRepurposing(piece).suggestions).toEqual([]);
    });
  });

  describe('analyzeContentGaps', () => {
    it('classifies coverage as full, partial, and none', () => {
      const ourContent: ContentPiece[] = [
        {
          id: 'a',
          title: 'Sofwave results timeline and longevity',
          type: 'blog_post',
          category: 'skin_tightening',
          topic: 'Sofwave',
          keywords: ['sofwave', 'tightening'],
          status: 'published',
          scheduledDate: '2026-03-03',
          channel: ['blog'],
          estimatedTime: 120,
          priority: 'high',
        },
        {
          id: 'b',
          title: 'Sofwave pre/post care',
          type: 'blog_post',
          category: 'skin_tightening',
          topic: 'Sofwave',
          keywords: ['sofwave', 'care'],
          status: 'published',
          scheduledDate: '2026-03-10',
          channel: ['blog'],
          estimatedTime: 120,
          priority: 'medium',
        },
        {
          id: 'c',
          title: 'Sofwave aftercare checklist',
          type: 'social_post',
          category: 'skin_tightening',
          topic: 'Sofwave',
          keywords: ['sofwave', 'aftercare'],
          status: 'published',
          scheduledDate: '2026-03-12',
          channel: ['instagram'],
          estimatedTime: 45,
          priority: 'low',
        },
      ];

      const gap = analyzeContentGaps(ourContent, [
        { topic: 'Sofwave results', category: 'skin_tightening', competitorCount: 4 },
        { topic: 'Weight loss', category: 'weight_loss', competitorCount: 3 },
      ]);

      const sofwaveGap = gap.find((item) => item.topic === 'Sofwave results');
      const weightLossGap = gap.find((item) => item.topic === 'Weight loss');

      expect(sofwaveGap).toBeDefined();
      expect(sofwaveGap?.ourCoverage).toBe('full');
      expect(sofwaveGap?.opportunity).toBe('low');

      expect(weightLossGap).toBeDefined();
      expect(weightLossGap?.ourCoverage).toBe('none');
      expect(weightLossGap?.opportunity).toBe('high');
    });
  });

  describe('calculateContentROI', () => {
    it('aggregates totals and splits top performers', () => {
      const performances: ContentPerformance[] = [
        {
          pieceId: 'p1',
          title: 'Hydrafacial guide',
          type: 'blog_post',
          channel: 'blog',
          publishedDate: '2026-03-04',
          metrics: {
            conversions: 3,
            pageViews: 400,
            socialShares: 20,
            likes: 80,
            emailOpens: 20,
          },
          performanceScore: 70,
          roi: 180,
        },
        {
          pieceId: 'p2',
          title: 'Injectable reel',
          type: 'educational_reel',
          channel: 'instagram',
          publishedDate: '2026-03-05',
          metrics: {
            conversions: 1,
            likes: 130,
          },
          performanceScore: 90,
        },
      ];

      const roi = calculateContentROI(performances);
      expect(roi.totalPieces).toBe(2);
      expect(roi.totalConversions).toBe(4);
      expect(roi.totalRevenue).toBe(2000);
      expect(roi.avgPerformanceScore).toBe(80);
      expect(roi.topPerformers[0].pieceId).toBe('p2');
      expect(roi.topPerformers[1].pieceId).toBe('p1');
      expect(roi.roiByType.blog_post.pieces).toBe(1);
      expect(roi.roiByType.educational_reel.pieces).toBe(1);
    });
  });

  describe('utility helpers', () => {
    it('returns seasonal trigger mapping for specific and current months', () => {
      expect(getSeasonalTriggers(3).map(t => t.trigger)).toEqual(['Spring Renewal']);
      expect(getSeasonalTriggers().length).toBe(1);
      expect(getSeasonalTriggers()[0].month).toBe(3);
    });

    it('returns all topic clusters', () => {
      const clusters = getTopicClusters();
      expect(clusters.length).toBeGreaterThan(5);
      expect(clusters.every(c => c.keywords.length > 0)).toBe(true);
      expect(clusters[0].contentCount).toBe(0);
    });
  });
});
