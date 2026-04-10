import {
  analyzeSentiment, calculateReviewStats, calculateNPS,
  draftReviewResponse, getResponseTemplates, getOptimalSolicitationWindow,
  compareWithCompetitors, analyzeRatingDistribution,
  type Review, type CompetitorReviewData,
} from '@/lib/marketing/review-engine';

// ── Helper ──────────────────────────────────────────────────────────────

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: overrides.id || 'r1',
    platform: overrides.platform || 'google',
    rating: overrides.rating ?? 5,
    reviewerName: overrides.reviewerName || 'Test User',
    reviewText: overrides.reviewText || 'Amazing experience, the staff was wonderful and professional.',
    date: overrides.date || new Date().toISOString(),
    service: overrides.service,
    provider: overrides.provider,
    responseStatus: overrides.responseStatus || 'pending',
    verified: overrides.verified ?? true,
    sentiment: overrides.sentiment,
  };
}

// ── analyzeSentiment ────────────────────────────────────────────────────

describe('analyzeSentiment', () => {
  it('classifies 5-star positive review as positive', () => {
    const result = analyzeSentiment('Amazing experience, the staff was wonderful and professional. Love this place!', 5);
    expect(result.label).toBe('positive');
    expect(result.score).toBeGreaterThan(0);
  });

  it('classifies 1-star negative review as negative', () => {
    const result = analyzeSentiment('Terrible experience. Rude staff, dirty facility. Worst place ever.', 1);
    expect(result.label).toBe('negative');
    expect(result.score).toBeLessThan(0);
  });

  it('classifies neutral review', () => {
    const result = analyzeSentiment('It was okay. Nothing special but nothing bad either.', 3);
    expect(result.label).toBe('neutral');
  });

  it('extracts topics from text', () => {
    const result = analyzeSentiment('The staff was amazing and the results were noticeable after just one treatment.', 5);
    const topicNames = result.topics.map(t => t.topic);
    expect(topicNames).toContain('staff/provider');
    expect(topicNames).toContain('results');
  });

  it('extracts emotions', () => {
    const result = analyzeSentiment('I love this place! So grateful for the transformation. I feel so confident now.', 5);
    expect(result.emotions).toContain('love');
    expect(result.emotions).toContain('gratitude');
    expect(result.emotions).toContain('confidence');
  });

  it('detects pricing topic in negative context', () => {
    const result = analyzeSentiment('Way too expensive for what you get. The prices are not worth it.', 2);
    const pricingTopic = result.topics.find(t => t.topic === 'pricing');
    expect(pricingTopic).toBeDefined();
    expect(pricingTopic?.sentiment).toBe('negative');
  });

  it('detects wait time topic', () => {
    const result = analyzeSentiment('Had to wait 30 minutes past my appointment time.', 3);
    const waitTopic = result.topics.find(t => t.topic === 'wait_time');
    expect(waitTopic).toBeDefined();
  });

  it('returns confidence between 0 and 1', () => {
    const result = analyzeSentiment('Great place!', 5);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('returns score between -1 and 1', () => {
    const result = analyzeSentiment('Some words here.', 3);
    expect(result.score).toBeGreaterThanOrEqual(-1);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('handles empty text', () => {
    const result = analyzeSentiment('', 4);
    expect(result.label).toBeDefined();
  });
});

// ── calculateNPS ────────────────────────────────────────────────────────

describe('calculateNPS', () => {
  it('returns 100 when all ratings are 5', () => {
    expect(calculateNPS([5, 5, 5, 5])).toBe(100);
  });

  it('returns -100 when all ratings are 1', () => {
    expect(calculateNPS([1, 1, 1, 1])).toBe(-100);
  });

  it('returns 0 for balanced mix', () => {
    expect(calculateNPS([5, 1])).toBe(0);
  });

  it('handles empty ratings', () => {
    expect(calculateNPS([])).toBe(0);
  });

  it('treats 4 as passive (not promoter or detractor)', () => {
    expect(calculateNPS([4, 4, 4])).toBe(0);
  });

  it('returns value between -100 and 100', () => {
    const nps = calculateNPS([5, 4, 3, 2, 1, 5, 5, 4, 3]);
    expect(nps).toBeGreaterThanOrEqual(-100);
    expect(nps).toBeLessThanOrEqual(100);
  });
});

// ── calculateReviewStats ────────────────────────────────────────────────

describe('calculateReviewStats', () => {
  it('handles empty reviews', () => {
    const stats = calculateReviewStats([]);
    expect(stats.totalReviews).toBe(0);
    expect(stats.avgRating).toBe(0);
    expect(stats.nps).toBe(0);
  });

  it('calculates average rating', () => {
    const reviews = [makeReview({ rating: 5 }), makeReview({ id: 'r2', rating: 4 }), makeReview({ id: 'r3', rating: 3 })];
    const stats = calculateReviewStats(reviews);
    expect(stats.avgRating).toBe(4);
  });

  it('calculates rating distribution', () => {
    const reviews = [
      makeReview({ id: 'r1', rating: 5 }),
      makeReview({ id: 'r2', rating: 5 }),
      makeReview({ id: 'r3', rating: 4 }),
      makeReview({ id: 'r4', rating: 2 }),
    ];
    const stats = calculateReviewStats(reviews);
    expect(stats.ratingDistribution[5]).toBe(2);
    expect(stats.ratingDistribution[4]).toBe(1);
    expect(stats.ratingDistribution[2]).toBe(1);
  });

  it('counts reviews by platform', () => {
    const reviews = [
      makeReview({ id: 'r1', platform: 'google' }),
      makeReview({ id: 'r2', platform: 'google' }),
      makeReview({ id: 'r3', platform: 'yelp' }),
    ];
    const stats = calculateReviewStats(reviews);
    expect(stats.platformBreakdown.google?.count).toBe(2);
    expect(stats.platformBreakdown.yelp?.count).toBe(1);
  });

  it('calculates response rate', () => {
    const reviews = [
      makeReview({ id: 'r1', responseStatus: 'published' }),
      makeReview({ id: 'r2', responseStatus: 'published' }),
      makeReview({ id: 'r3', responseStatus: 'pending' }),
    ];
    const stats = calculateReviewStats(reviews);
    expect(stats.responseRate).toBe(67); // 2/3 rounded
  });

  it('tracks sentiment breakdown', () => {
    const reviews = [
      makeReview({ id: 'r1', rating: 5, reviewText: 'Amazing wonderful love it!' }),
      makeReview({ id: 'r2', rating: 1, reviewText: 'Terrible horrible awful.' }),
    ];
    const stats = calculateReviewStats(reviews);
    expect(stats.sentimentBreakdown.positive).toBeGreaterThanOrEqual(1);
    expect(stats.sentimentBreakdown.negative).toBeGreaterThanOrEqual(1);
  });

  it('identifies top mentioned services', () => {
    const reviews = [
      makeReview({ id: 'r1', service: 'Sofwave' }),
      makeReview({ id: 'r2', service: 'Sofwave' }),
      makeReview({ id: 'r3', service: 'HydraFacial' }),
    ];
    const stats = calculateReviewStats(reviews);
    expect(stats.topMentionedServices[0].service).toBe('Sofwave');
    expect(stats.topMentionedServices[0].count).toBe(2);
  });

  it('calculates review velocity', () => {
    const reviews = Array.from({ length: 8 }, (_, i) => makeReview({
      id: `r${i}`,
      date: new Date(Date.now() - i * 3 * 86400000).toISOString(),
    }));
    const stats = calculateReviewStats(reviews);
    expect(stats.reviewVelocity.current).toBeGreaterThan(0);
  });
});

// ── draftReviewResponse ─────────────────────────────────────────────────

describe('draftReviewResponse', () => {
  it('drafts positive response for 5-star review', () => {
    const review = makeReview({ rating: 5, reviewText: 'Amazing place, love the results!' });
    const response = draftReviewResponse(review);
    expect(response.template.sentiment).toBe('positive');
    expect(response.draft).toContain('Test User');
    expect(response.draft.length).toBeGreaterThan(50);
  });

  it('drafts negative response for low rating', () => {
    const review = makeReview({ rating: 1, reviewText: 'Terrible experience, worst service ever. Rude staff.' });
    const response = draftReviewResponse(review);
    expect(response.template.sentiment).toBe('negative');
    expect(response.draft).toContain('apologize');
  });

  it('includes reviewer name in response', () => {
    const review = makeReview({ reviewerName: 'Sarah M.' });
    const response = draftReviewResponse(review);
    expect(response.draft).toContain('Sarah M.');
  });

  it('mentions provider when available', () => {
    const review = makeReview({ provider: 'Mom', rating: 5, reviewText: 'Wonderful professional experience!' });
    const response = draftReviewResponse(review);
    expect(response.draft).toContain('Mom');
  });

  it('mentions service when available', () => {
    const review = makeReview({ service: 'HydraFacial', rating: 5, reviewText: 'Love the results of my treatment!' });
    const response = draftReviewResponse(review);
    expect(response.draft).toContain('HydraFacial');
  });

  it('returns confidence score', () => {
    const review = makeReview();
    const response = draftReviewResponse(review);
    expect(response.confidence).toBeGreaterThan(0);
    expect(response.confidence).toBeLessThanOrEqual(1);
  });
});

// ── getResponseTemplates ────────────────────────────────────────────────

describe('getResponseTemplates', () => {
  it('returns templates for positive, neutral, and negative', () => {
    const templates = getResponseTemplates();
    const sentiments = new Set(templates.map(t => t.sentiment));
    expect(sentiments.has('positive')).toBe(true);
    expect(sentiments.has('neutral')).toBe(true);
    expect(sentiments.has('negative')).toBe(true);
  });

  it('templates contain variable placeholders', () => {
    const templates = getResponseTemplates();
    for (const t of templates) {
      expect(t.template).toContain('{{reviewerName}}');
    }
  });

  it('has at least 5 templates', () => {
    expect(getResponseTemplates().length).toBeGreaterThanOrEqual(5);
  });
});

// ── getOptimalSolicitationWindow ────────────────────────────────────────

describe('getOptimalSolicitationWindow', () => {
  it('recommends 1 day for high-satisfaction clients', () => {
    const window = getOptimalSolicitationWindow('HydraFacial', 5);
    expect(window.optimalDay).toBe(1);
    expect(window.channel).toBe('sms');
  });

  it('recommends 14 days for Sofwave (collagen treatments)', () => {
    const window = getOptimalSolicitationWindow('Sofwave');
    expect(window.optimalDay).toBe(14);
  });

  it('recommends 7 days for peels', () => {
    const window = getOptimalSolicitationWindow('VI Peel');
    expect(window.optimalDay).toBe(7);
  });

  it('recommends 10 days for injectables', () => {
    const windowBotox = getOptimalSolicitationWindow('Botox');
    expect(windowBotox.optimalDay).toBe(10);
    const windowFiller = getOptimalSolicitationWindow('Filler');
    expect(windowFiller.optimalDay).toBe(10);
  });

  it('defaults to 3 days for general services', () => {
    const window = getOptimalSolicitationWindow('HydraFacial');
    expect(window.optimalDay).toBe(3);
  });

  it('always returns a template', () => {
    const window = getOptimalSolicitationWindow('Unknown Service');
    expect(window.template).toBeTruthy();
    expect(window.reason).toBeTruthy();
  });
});

// ── compareWithCompetitors ──────────────────────────────────────────────

describe('compareWithCompetitors', () => {
  it('calculates our rank among competitors', () => {
    const ourReviews = [makeReview({ rating: 5 }), makeReview({ id: 'r2', rating: 5 })];
    const competitors: CompetitorReviewData[] = [
      { name: 'Comp A', platform: 'google', totalReviews: 100, avgRating: 4.6, reviewsPerMonth: 5 },
      { name: 'Comp B', platform: 'google', totalReviews: 200, avgRating: 4.4, reviewsPerMonth: 8 },
    ];
    const comparison = compareWithCompetitors(ourReviews, competitors);
    expect(comparison.ourRank).toBeGreaterThanOrEqual(1);
    expect(comparison.ourRank).toBeLessThanOrEqual(3);
  });

  it('generates insights', () => {
    const ourReviews = [makeReview()];
    const competitors: CompetitorReviewData[] = [
      { name: 'Comp', platform: 'google', totalReviews: 500, avgRating: 4.5, reviewsPerMonth: 10 },
    ];
    const comparison = compareWithCompetitors(ourReviews, competitors);
    expect(comparison.insights.length).toBeGreaterThan(0);
  });
});

// ── analyzeRatingDistribution ───────────────────────────────────────────

describe('analyzeRatingDistribution', () => {
  it('calculates J-score (percentage of 5-star reviews)', () => {
    const result = analyzeRatingDistribution({ 1: 0, 2: 0, 3: 5, 4: 15, 5: 80 });
    expect(result.jScore).toBe(80);
  });

  it('generates action items for low 5-star percentage', () => {
    const result = analyzeRatingDistribution({ 1: 10, 2: 10, 3: 30, 4: 30, 5: 20 });
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  it('calculates percentage for each rating', () => {
    const result = analyzeRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 10 });
    expect(result.distribution[5].percentage).toBe(100);
  });
});
