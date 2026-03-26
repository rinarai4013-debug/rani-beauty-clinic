// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateRelevanceScore,
  parseRSSFeed,
  detectTreatmentTrends,
  calculateMarketPosition,
  generateMarketInsights,
  INDUSTRY_RSS_FEEDS,
  LOCAL_COMPETITORS,
  NATIONAL_CHAINS,
  TRACKED_TREATMENTS,
  TRACKED_MANUFACTURERS,
  type RSSFeedSource,
  type RSSFeedItem,
  type TreatmentTrend,
  type IndustryNewsSummary,
} from '../market-intelligence';

// ── Test Fixtures ─────────────────────────────────────────────

const mockFeedSource: RSSFeedSource = {
  name: 'Test Source',
  url: 'https://test.com/rss',
  category: 'industry',
  priority: 1,
};

const mockRSSXml = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <item>
    <title>New HydraFacial Technology Boosts Medspa Revenue</title>
    <link>https://test.com/article1</link>
    <description>A new HydraFacial device is transforming medspa operations with injectable add-ons.</description>
    <pubDate>Mon, 24 Mar 2026 10:00:00 GMT</pubDate>
  </item>
  <item>
    <title>FDA Approves New Botox Alternative</title>
    <link>https://test.com/article2</link>
    <description>The FDA has approved a new injectable for aesthetic use by Allergan.</description>
    <pubDate>Sun, 23 Mar 2026 08:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Cooking Tips for Summer</title>
    <link>https://test.com/article3</link>
    <description>Best recipes for your summer barbecue.</description>
    <pubDate>Sat, 22 Mar 2026 12:00:00 GMT</pubDate>
  </item>
</channel>
</rss>`;

const mockRSSXmlWithCDATA = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <item>
    <title><![CDATA[Sofwave Results in Renton & Seattle]]></title>
    <link>https://test.com/article4</link>
    <description><![CDATA[<p>Amazing skin tightening results at local medspa</p>]]></description>
    <pubDate>Mon, 24 Mar 2026 09:00:00 GMT</pubDate>
  </item>
</channel>
</rss>`;

function makeMockNews(overrides: Partial<RSSFeedItem> = {}): RSSFeedItem {
  return {
    title: 'Test Article',
    link: 'https://test.com/article',
    description: 'Test description',
    pubDate: new Date().toISOString(),
    source: 'Test Source',
    category: 'industry',
    relevanceScore: 50,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('Market Intelligence', () => {
  // ── Constants ──

  describe('Constants', () => {
    it('should have 8 RSS feed sources', () => {
      expect(INDUSTRY_RSS_FEEDS.length).toBe(8);
    });

    it('should have all feed sources with required fields', () => {
      for (const feed of INDUSTRY_RSS_FEEDS) {
        expect(feed.name).toBeTruthy();
        expect(feed.url).toBeTruthy();
        expect(['industry', 'clinical', 'consumer', 'regulatory']).toContain(feed.category);
        expect(feed.priority).toBeGreaterThanOrEqual(1);
      }
    });

    it('should have 10 local competitors', () => {
      expect(LOCAL_COMPETITORS.length).toBe(10);
    });

    it('should have all local competitors with Google Places data', () => {
      for (const comp of LOCAL_COMPETITORS) {
        expect(comp.name).toBeTruthy();
        expect(comp.placeId).toBeTruthy();
        expect(comp.address).toBeTruthy();
        expect(comp.googleRating).toBeGreaterThan(0);
        expect(comp.reviewCount).toBeGreaterThan(0);
        expect(comp.location.lat).toBeGreaterThan(0);
        expect(comp.location.lng).toBeLessThan(0); // WA is negative longitude
      }
    });

    it('should have 5 national chains', () => {
      expect(NATIONAL_CHAINS.length).toBe(5);
      const names = NATIONAL_CHAINS.map(c => c.name);
      expect(names).toContain('Ideal Image');
      expect(names).toContain('LaserAway');
      expect(names).toContain('Ever/Body');
      expect(names).toContain('Skin Laundry');
      expect(names).toContain('Heyday');
    });

    it('should have 15+ tracked treatments', () => {
      expect(TRACKED_TREATMENTS.length).toBeGreaterThanOrEqual(15);
    });

    it('should have 10 tracked manufacturers', () => {
      expect(TRACKED_MANUFACTURERS.length).toBe(10);
      const names = TRACKED_MANUFACTURERS.map(m => m.name);
      expect(names.some(n => n.includes('Allergan'))).toBe(true);
      expect(names.some(n => n.includes('Galderma'))).toBe(true);
    });
  });

  // ── Relevance Scoring ──

  describe('calculateRelevanceScore', () => {
    it('should score high for medspa-related content', () => {
      const score = calculateRelevanceScore('Medspa HydraFacial Growth', 'Injectable treatments on the rise');
      expect(score).toBeGreaterThan(40);
    });

    it('should score low for unrelated content', () => {
      const score = calculateRelevanceScore('Cooking Tips', 'Best barbecue recipes');
      expect(score).toBe(0);
    });

    it('should score very high for Rani-specific services', () => {
      const score = calculateRelevanceScore('Sofwave Skin Tightening in Renton', 'Local medspa injectable results');
      expect(score).toBeGreaterThan(60);
    });

    it('should score for FDA regulatory keywords', () => {
      const score = calculateRelevanceScore('FDA Approval for Allergan', 'New botox product');
      expect(score).toBeGreaterThan(30);
    });

    it('should handle empty strings', () => {
      const score = calculateRelevanceScore('', '');
      expect(score).toBe(0);
    });

    it('should be case insensitive', () => {
      const score1 = calculateRelevanceScore('MEDSPA HYDRAFACIAL', '');
      const score2 = calculateRelevanceScore('medspa hydrafacial', '');
      expect(score1).toBe(score2);
    });

    it('should cap at 100', () => {
      const score = calculateRelevanceScore(
        'medspa medical spa hydrafacial botox filler injectable laser sofwave renton seattle allergan galderma',
        'medspa injectable botox filler facial laser microneedling peel vi peel prx picoway'
      );
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ── RSS Parsing ──

  describe('parseRSSFeed', () => {
    it('should parse standard RSS XML', () => {
      const items = parseRSSFeed(mockRSSXml, mockFeedSource);
      expect(items.length).toBe(3);
    });

    it('should extract title, link, description, and pubDate', () => {
      const items = parseRSSFeed(mockRSSXml, mockFeedSource);
      const first = items.find(i => i.title.includes('HydraFacial'));
      expect(first).toBeDefined();
      expect(first!.link).toBe('https://test.com/article1');
      expect(first!.pubDate).toBeTruthy();
      expect(first!.source).toBe('Test Source');
    });

    it('should assign relevance scores to each item', () => {
      const items = parseRSSFeed(mockRSSXml, mockFeedSource);
      for (const item of items) {
        expect(typeof item.relevanceScore).toBe('number');
      }
    });

    it('should sort items by relevance score descending', () => {
      const items = parseRSSFeed(mockRSSXml, mockFeedSource);
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].relevanceScore).toBeGreaterThanOrEqual(items[i].relevanceScore);
      }
    });

    it('should handle CDATA sections', () => {
      const items = parseRSSFeed(mockRSSXmlWithCDATA, mockFeedSource);
      expect(items.length).toBe(1);
      expect(items[0].title).toContain('Sofwave');
      expect(items[0].title).toContain('Renton');
    });

    it('should strip HTML from descriptions', () => {
      const items = parseRSSFeed(mockRSSXmlWithCDATA, mockFeedSource);
      expect(items[0].description).not.toContain('<p>');
      expect(items[0].description).not.toContain('</p>');
    });

    it('should set source and category from feed config', () => {
      const items = parseRSSFeed(mockRSSXml, mockFeedSource);
      for (const item of items) {
        expect(item.source).toBe('Test Source');
        expect(item.category).toBe('industry');
      }
    });

    it('should handle empty XML', () => {
      const items = parseRSSFeed('', mockFeedSource);
      expect(items.length).toBe(0);
    });

    it('should handle malformed XML gracefully', () => {
      const items = parseRSSFeed('<broken>xml</not-closed', mockFeedSource);
      expect(items.length).toBe(0);
    });

    it('should truncate long descriptions to 300 chars', () => {
      const longXml = `<rss><channel><item>
        <title>Test</title>
        <link>https://test.com</link>
        <description>${'A'.repeat(500)}</description>
        <pubDate>Mon, 24 Mar 2026 10:00:00 GMT</pubDate>
      </item></channel></rss>`;
      const items = parseRSSFeed(longXml, mockFeedSource);
      expect(items[0].description.length).toBeLessThanOrEqual(300);
    });
  });

  // ── Treatment Trend Detection ──

  describe('detectTreatmentTrends', () => {
    it('should return trends for all tracked treatments', () => {
      const trends = detectTreatmentTrends([]);
      expect(trends.length).toBe(TRACKED_TREATMENTS.length);
    });

    it('should detect rising trends from news mentions', () => {
      const news = [
        makeMockNews({ title: 'Exosomes Revolution in Aesthetics', description: 'Exosomes are the future' }),
        makeMockNews({ title: 'More Exosomes Research Published', description: 'Exosomes growth' }),
      ];
      const trends = detectTreatmentTrends(news);
      const exosome = trends.find(t => t.treatment === 'Exosomes');
      expect(exosome).toBeDefined();
      expect(exosome!.socialMentionsChange).toBe(2);
    });

    it('should classify relevance to Rani correctly', () => {
      const trends = detectTreatmentTrends([]);
      // Morpheus8 is a microneedling device - should be direct or adjacent
      const aiSkin = trends.find(t => t.treatment === 'AI skin analysis');
      expect(aiSkin).toBeDefined();
      expect(['direct', 'adjacent', 'monitor']).toContain(aiSkin!.relevanceToRani);
    });

    it('should sort by revenue opportunity', () => {
      const news = Array.from({ length: 10 }, (_, i) =>
        makeMockNews({ title: `Exosomes article ${i}`, description: 'exosomes treatment' })
      );
      const trends = detectTreatmentTrends(news);
      const first = trends[0];
      expect(['high', 'medium']).toContain(first.revenueOpportunity);
    });

    it('should set stable direction when no previous data', () => {
      const trends = detectTreatmentTrends([]);
      const stableCount = trends.filter(t => t.trendDirection === 'stable').length;
      expect(stableCount).toBeGreaterThan(0);
    });
  });

  // ── Market Position ──

  describe('calculateMarketPosition', () => {
    it('should calculate rating rank among competitors', () => {
      const position = calculateMarketPosition(
        { rating: 4.9, reviewCount: 127, reviewVelocity7d: 2 },
        LOCAL_COMPETITORS
      );
      expect(position.ratingRank).toBeGreaterThan(0);
      expect(position.ratingRank).toBeLessThanOrEqual(LOCAL_COMPETITORS.length + 1);
    });

    it('should calculate review count rank', () => {
      const position = calculateMarketPosition(
        { rating: 4.9, reviewCount: 127, reviewVelocity7d: 2 },
        LOCAL_COMPETITORS
      );
      expect(position.reviewCountRank).toBeGreaterThan(0);
    });

    it('should calculate estimated market share', () => {
      const position = calculateMarketPosition(
        { rating: 4.9, reviewCount: 127, reviewVelocity7d: 2 },
        LOCAL_COMPETITORS
      );
      expect(position.estimatedMarketShare).toBeGreaterThan(0);
      expect(position.estimatedMarketShare).toBeLessThan(100);
    });

    it('should identify strength areas', () => {
      const position = calculateMarketPosition(
        { rating: 4.9, reviewCount: 500, reviewVelocity7d: 5 },
        LOCAL_COMPETITORS
      );
      expect(position.strengthAreas.length).toBeGreaterThan(0);
    });

    it('should identify vulnerability areas with low metrics', () => {
      const position = calculateMarketPosition(
        { rating: 4.0, reviewCount: 10, reviewVelocity7d: 0 },
        LOCAL_COMPETITORS
      );
      expect(position.vulnerabilityAreas.length).toBeGreaterThan(0);
    });

    it('should handle empty competitors', () => {
      const position = calculateMarketPosition(
        { rating: 4.9, reviewCount: 127, reviewVelocity7d: 2 },
        []
      );
      expect(position.ratingRank).toBe(1);
      expect(position.estimatedMarketShare).toBe(100);
    });
  });

  // ── Market Insights ──

  describe('generateMarketInsights', () => {
    it('should generate insights from trends and position data', () => {
      const news: IndustryNewsSummary = {
        topStories: [makeMockNews({ relevanceScore: 80, title: 'Medspa injectable revolution' })],
        byCategory: {},
        totalFetched: 1,
        sourcesChecked: 8,
        lastFetched: new Date().toISOString(),
      };
      const trends: TreatmentTrend[] = [{
        treatment: 'Exosomes', trendDirection: 'rising',
        searchVolumeChange: 50, socialMentionsChange: 5,
        competitorAdoptionRate: 0, revenueOpportunity: 'high',
        relevanceToRani: 'adjacent', summary: 'Rising trend',
      }];
      const position = { ratingRank: 1, reviewCountRank: 5, estimatedMarketShare: 5, strengthAreas: ['Top rating'], vulnerabilityAreas: ['Low review count'] };

      const insights = generateMarketInsights(news, trends, position);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should sort insights by priority', () => {
      const position = { ratingRank: 8, reviewCountRank: 8, estimatedMarketShare: 3, strengthAreas: [], vulnerabilityAreas: ['Low rating', 'Low reviews'] };
      const insights = generateMarketInsights(
        { topStories: [], byCategory: {}, totalFetched: 0, sourcesChecked: 0, lastFetched: '' },
        [],
        position
      );
      if (insights.length >= 2) {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        expect(pOrder[insights[0].priority]).toBeLessThanOrEqual(pOrder[insights[1].priority]);
      }
    });

    it('should include opportunity type for rising trends', () => {
      const trends: TreatmentTrend[] = [{
        treatment: 'Test', trendDirection: 'rising',
        searchVolumeChange: 30, socialMentionsChange: 3,
        competitorAdoptionRate: 0, revenueOpportunity: 'medium',
        relevanceToRani: 'direct', summary: 'Test rising',
      }];
      const insights = generateMarketInsights(
        { topStories: [], byCategory: {}, totalFetched: 0, sourcesChecked: 0, lastFetched: '' },
        trends,
        { ratingRank: 1, reviewCountRank: 1, estimatedMarketShare: 10, strengthAreas: [], vulnerabilityAreas: [] }
      );
      const opportunity = insights.find(i => i.type === 'opportunity');
      expect(opportunity).toBeDefined();
    });
  });
});
