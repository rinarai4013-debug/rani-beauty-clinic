// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateServiceOverlap,
  calculateThreatScore,
  generateSWOT,
  estimateMarketShare,
  analyzeReviewSentiment,
  generateCompetitorActionItems,
  LOCAL_COMPETITORS,
  NATIONAL_CHAINS,
  TRACKED_KEYWORDS,
  type LocalCompetitor,
  type CompetitorThreatScore,
  type CompetitorReviewSnapshot,
  type WebsiteChange,
  type KeywordRanking,
} from '../competitor-tracker';

// ── Fixtures ──────────────────────────────────────────────────

const raniMetrics = { rating: 4.9, reviewCount: 127, reviewVelocity30d: 8 };

function makeCompetitor(overrides: Partial<LocalCompetitor> = {}): LocalCompetitor {
  return {
    name: 'Test Competitor',
    placeId: 'ChIJ_test',
    address: '123 Test St, Renton, WA 98057',
    phone: '(425) 555-0001',
    website: 'https://test.com',
    googleRating: 4.6,
    reviewCount: 250,
    priceLevel: 3,
    categories: ['medspa', 'injectable', 'laser'],
    location: { lat: 47.4800, lng: -122.2000 },
    operatingHours: { 'Mon-Fri': '9AM-6PM' },
    lastUpdated: '',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('Competitor Tracker', () => {
  // ── Constants ──

  describe('Constants', () => {
    it('should have 10 local competitors', () => {
      expect(LOCAL_COMPETITORS.length).toBe(10);
    });

    it('should have 5 national chains', () => {
      expect(NATIONAL_CHAINS.length).toBe(5);
    });

    it('should have 20 tracked keywords', () => {
      expect(TRACKED_KEYWORDS.length).toBe(20);
    });

    it('should include Renton-specific keywords', () => {
      const rentonKeywords = TRACKED_KEYWORDS.filter(k => k.includes('renton'));
      expect(rentonKeywords.length).toBeGreaterThanOrEqual(5);
    });

    it('should include service-specific keywords', () => {
      expect(TRACKED_KEYWORDS.some(k => k.includes('botox'))).toBe(true);
      expect(TRACKED_KEYWORDS.some(k => k.includes('hydrafacial'))).toBe(true);
      expect(TRACKED_KEYWORDS.some(k => k.includes('laser'))).toBe(true);
    });
  });

  // ── Distance Calculation ──

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Renton to Bellevue is ~8-10 miles
      const distance = calculateDistance(47.4860, -122.1958, 47.6162, -122.1878);
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(15);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(47.4860, -122.1958, 47.4860, -122.1958);
      expect(distance).toBe(0);
    });

    it('should return reasonable distance for Seattle to Renton', () => {
      const distance = calculateDistance(47.4860, -122.1958, 47.6062, -122.3321);
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(15);
    });

    it('should be symmetric', () => {
      const d1 = calculateDistance(47.4860, -122.1958, 47.6162, -122.1878);
      const d2 = calculateDistance(47.6162, -122.1878, 47.4860, -122.1958);
      expect(d1).toBe(d2);
    });
  });

  // ── Service Overlap ──

  describe('calculateServiceOverlap', () => {
    it('should calculate overlap for medspa categories', () => {
      const overlap = calculateServiceOverlap(['medspa', 'injectable', 'laser']);
      expect(overlap).toBeGreaterThan(0);
    });

    it('should return 0 for completely unrelated categories', () => {
      const overlap = calculateServiceOverlap(['surgical']);
      expect(overlap).toBe(0);
    });

    it('should return higher overlap for more matching categories', () => {
      const narrow = calculateServiceOverlap(['medspa']);
      const broad = calculateServiceOverlap(['medspa', 'injectable', 'laser', 'facial', 'skincare']);
      expect(broad).toBeGreaterThanOrEqual(narrow);
    });

    it('should handle empty categories', () => {
      const overlap = calculateServiceOverlap([]);
      expect(overlap).toBe(0);
    });
  });

  // ── Threat Score ──

  describe('calculateThreatScore', () => {
    it('should return score between 0 and 100', () => {
      const score = calculateThreatScore(makeCompetitor(), raniMetrics);
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
    });

    it('should score higher for closer competitors', () => {
      const close = calculateThreatScore(
        makeCompetitor({ location: { lat: 47.486, lng: -122.196 } }),
        raniMetrics
      );
      const far = calculateThreatScore(
        makeCompetitor({ location: { lat: 47.760, lng: -122.205 } }),
        raniMetrics
      );
      expect(close.components.proximity).toBeGreaterThan(far.components.proximity);
    });

    it('should score higher for competitors with more reviews', () => {
      const moreReviews = calculateThreatScore(
        makeCompetitor({ reviewCount: 500, googleRating: 4.8 }),
        raniMetrics
      );
      const fewerReviews = calculateThreatScore(
        makeCompetitor({ reviewCount: 50, googleRating: 4.0 }),
        raniMetrics
      );
      expect(moreReviews.components.reviewStrength).toBeGreaterThan(fewerReviews.components.reviewStrength);
    });

    it('should assign watch levels based on score', () => {
      const highThreat = calculateThreatScore(
        makeCompetitor({ googleRating: 4.9, reviewCount: 500, categories: ['medspa', 'injectable', 'laser', 'facial'], location: { lat: 47.486, lng: -122.196 } }),
        raniMetrics
      );
      expect(['critical', 'watch', 'monitor', 'low']).toContain(highThreat.watchLevel);
    });

    it('should include a summary string', () => {
      const score = calculateThreatScore(makeCompetitor(), raniMetrics);
      expect(score.summary).toBeTruthy();
      expect(score.summary).toContain(makeCompetitor().name);
    });

    it('should set type as local', () => {
      const score = calculateThreatScore(makeCompetitor(), raniMetrics);
      expect(score.type).toBe('local');
    });

    it('should calculate all component scores', () => {
      const score = calculateThreatScore(makeCompetitor(), raniMetrics);
      expect(score.components.proximity).toBeDefined();
      expect(score.components.reviewStrength).toBeDefined();
      expect(score.components.priceCompetitiveness).toBeDefined();
      expect(score.components.serviceOverlap).toBeDefined();
      expect(score.components.growthRate).toBeDefined();
    });

    it('should score budget competitors as more price competitive', () => {
      const budget = calculateThreatScore(makeCompetitor({ priceLevel: 1 }), raniMetrics);
      const premium = calculateThreatScore(makeCompetitor({ priceLevel: 4 }), raniMetrics);
      expect(budget.components.priceCompetitiveness).toBeGreaterThan(premium.components.priceCompetitiveness);
    });
  });

  // ── SWOT Analysis ──

  describe('generateSWOT', () => {
    it('should generate all four SWOT categories', () => {
      const swot = generateSWOT(makeCompetitor(), raniMetrics);
      expect(swot.strengths).toBeDefined();
      expect(swot.weaknesses).toBeDefined();
      expect(swot.opportunities).toBeDefined();
      expect(swot.threats).toBeDefined();
    });

    it('should identify premium rating as strength', () => {
      const swot = generateSWOT(makeCompetitor({ googleRating: 4.9 }), raniMetrics);
      const ratingStrength = swot.strengths.find(s => s.category === 'reputation' && s.description.includes('rating'));
      expect(ratingStrength).toBeDefined();
    });

    it('should identify low rating as weakness', () => {
      const swot = generateSWOT(makeCompetitor({ googleRating: 4.2 }), raniMetrics);
      const ratingWeakness = swot.weaknesses.find(w => w.category === 'reputation');
      expect(ratingWeakness).toBeDefined();
    });

    it('should identify Rani rating advantage as opportunity', () => {
      const swot = generateSWOT(makeCompetitor({ googleRating: 4.5 }), { rating: 4.9, reviewCount: 127 });
      const ratingOpp = swot.opportunities.find(o => o.category === 'reviews');
      expect(ratingOpp).toBeDefined();
    });

    it('should identify much higher review count as threat', () => {
      const swot = generateSWOT(makeCompetitor({ reviewCount: 500 }), { rating: 4.9, reviewCount: 127 });
      const reviewThreat = swot.threats.find(t => t.category === 'reputation');
      expect(reviewThreat).toBeDefined();
    });

    it('should calculate overall threat level 0-100', () => {
      const swot = generateSWOT(makeCompetitor(), raniMetrics);
      expect(swot.overallThreatLevel).toBeGreaterThanOrEqual(0);
      expect(swot.overallThreatLevel).toBeLessThanOrEqual(100);
    });

    it('should set lastUpdated timestamp', () => {
      const swot = generateSWOT(makeCompetitor(), raniMetrics);
      expect(swot.lastUpdated).toBeTruthy();
      expect(new Date(swot.lastUpdated).getTime()).toBeGreaterThan(0);
    });
  });

  // ── Market Share ──

  describe('estimateMarketShare', () => {
    it('should distribute shares among all competitors', () => {
      const competitors = [
        { name: 'A', velocity: 10, totalReviews: 200 },
        { name: 'B', velocity: 5, totalReviews: 100 },
      ];
      const shares = estimateMarketShare(8, competitors);
      const totalShare = shares.reduce((s, c) => s + c.estimatedShare, 0);
      expect(totalShare).toBeCloseTo(100, 0);
    });

    it('should include Rani in results', () => {
      const shares = estimateMarketShare(8, [{ name: 'A', velocity: 10, totalReviews: 200 }]);
      const rani = shares.find(s => s.competitorName === 'Rani Beauty Clinic');
      expect(rani).toBeDefined();
    });

    it('should sort by estimated share descending', () => {
      const competitors = [
        { name: 'A', velocity: 10, totalReviews: 200 },
        { name: 'B', velocity: 2, totalReviews: 50 },
      ];
      const shares = estimateMarketShare(8, competitors);
      expect(shares[0].estimatedShare).toBeGreaterThanOrEqual(shares[1].estimatedShare);
    });

    it('should classify trend as growing when velocity > review share', () => {
      const competitors = [{ name: 'A', velocity: 1, totalReviews: 500 }];
      const shares = estimateMarketShare(20, competitors); // Rani has high velocity, low reviews
      const rani = shares.find(s => s.competitorName === 'Rani Beauty Clinic');
      expect(rani!.trend).toBe('growing');
    });

    it('should weight velocity higher than total reviews', () => {
      // Competitor with high velocity but low total should still rank well
      const competitors = [
        { name: 'HighVel', velocity: 30, totalReviews: 50 },
        { name: 'HighRev', velocity: 2, totalReviews: 500 },
      ];
      const shares = estimateMarketShare(8, competitors);
      const highVel = shares.find(s => s.competitorName === 'HighVel');
      const highRev = shares.find(s => s.competitorName === 'HighRev');
      // HighVel should have higher share due to velocity weighting (0.6)
      expect(highVel!.estimatedShare).toBeGreaterThan(highRev!.estimatedShare);
    });
  });

  // ── Review Sentiment ──

  describe('analyzeReviewSentiment', () => {
    it('should classify positive reviews', () => {
      const result = analyzeReviewSentiment('Amazing experience! Love the results, so professional and gentle.');
      expect(result.sentiment).toBe('positive');
    });

    it('should classify negative reviews', () => {
      const result = analyzeReviewSentiment('Terrible service, rude staff, totally unprofessional. Never going back.');
      expect(result.sentiment).toBe('negative');
    });

    it('should classify neutral reviews', () => {
      const result = analyzeReviewSentiment('Went in for a treatment. It was okay.');
      expect(result.sentiment).toBe('neutral');
    });

    it('should detect mentioned services', () => {
      const result = analyzeReviewSentiment('Got botox and a hydrafacial, both were great');
      expect(result.mentionedServices).toContain('Botox');
      expect(result.mentionedServices).toContain('HydraFacial');
    });

    it('should detect key themes', () => {
      const result = analyzeReviewSentiment('The staff was amazing and the clinic was very clean. Results were fantastic.');
      expect(result.keyThemes.length).toBeGreaterThan(0);
      expect(result.keyThemes).toContain('staff quality');
      expect(result.keyThemes).toContain('cleanliness');
    });

    it('should handle empty text', () => {
      const result = analyzeReviewSentiment('');
      expect(result.sentiment).toBe('neutral');
      expect(result.mentionedServices.length).toBe(0);
    });

    it('should be case insensitive', () => {
      const result1 = analyzeReviewSentiment('AMAZING BOTOX RESULTS');
      const result2 = analyzeReviewSentiment('amazing botox results');
      expect(result1.sentiment).toBe(result2.sentiment);
    });
  });

  // ── Competitor Action Items ──

  describe('generateCompetitorActionItems', () => {
    it('should generate action for critical threats', () => {
      const threats: CompetitorThreatScore[] = [{
        competitorName: 'Critical Comp', type: 'local', overallScore: 80,
        components: { proximity: 90, reviewStrength: 80, priceCompetitiveness: 50, serviceOverlap: 60, growthRate: 70, adAggression: 30, socialPresence: 20 },
        rank: 1, trend: 'increasing', watchLevel: 'critical',
        summary: 'Critical competitor',
      }];
      const items = generateCompetitorActionItems(threats, [], [], []);
      expect(items.some(i => i.priority === 'critical')).toBe(true);
    });

    it('should generate action for high review velocity competitors', () => {
      const snapshots: CompetitorReviewSnapshot[] = [{
        competitorName: 'Fast Reviews', placeId: '', date: '', rating: 4.8,
        totalReviews: 300, ratingChange: 0, reviewCountChange: 8,
        newReviewCount: 8, avgNewReviewRating: 4.9, recentReviews: [],
      }];
      const items = generateCompetitorActionItems([], snapshots, [], []);
      expect(items.some(i => i.category === 'reviews')).toBe(true);
    });

    it('should generate action for significant website changes', () => {
      const changes: WebsiteChange[] = [{
        competitorName: 'Changing Comp', url: 'https://test.com', detectedAt: '',
        changeType: 'pricing_change', description: 'Reduced Botox pricing by 30%',
        previousValue: '$14/unit', newValue: '$10/unit', significance: 'high',
        actionRecommended: 'Review your Botox pricing strategy',
      }];
      const items = generateCompetitorActionItems([], [], changes, []);
      expect(items.some(i => i.category === 'pricing')).toBe(true);
    });

    it('should generate SEO action for keyword opportunities', () => {
      const rankings: KeywordRanking[] = [{
        keyword: 'botox renton', searchVolume: 500, raniRank: null,
        competitorRanks: { 'Comp A': 3 }, raniChange: 0,
        topRanker: 'Comp A', difficulty: 'medium', opportunity: true,
      }];
      const items = generateCompetitorActionItems([], [], [], rankings);
      expect(items.some(i => i.category === 'seo')).toBe(true);
    });

    it('should sort by priority', () => {
      const threats: CompetitorThreatScore[] = [{
        competitorName: 'Critical', type: 'local', overallScore: 80,
        components: { proximity: 90, reviewStrength: 80, priceCompetitiveness: 50, serviceOverlap: 60, growthRate: 70, adAggression: 30, socialPresence: 20 },
        rank: 1, trend: 'increasing', watchLevel: 'critical', summary: 'Critical',
      }];
      const rankings: KeywordRanking[] = [{
        keyword: 'test', searchVolume: 100, raniRank: null,
        competitorRanks: {}, raniChange: 0, topRanker: 'X', difficulty: 'easy', opportunity: true,
      }];
      const items = generateCompetitorActionItems(threats, [], [], rankings);
      if (items.length >= 2) {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        expect(pOrder[items[0].priority]).toBeLessThanOrEqual(pOrder[items[1].priority]);
      }
    });

    it('should handle all empty inputs', () => {
      const items = generateCompetitorActionItems([], [], [], []);
      expect(items.length).toBe(0);
    });
  });
});
