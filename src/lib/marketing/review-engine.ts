/**
 * Review Management Engine for Rani Beauty Clinic
 *
 * Monitors Google reviews, analyzes sentiment, tracks review velocity,
 * generates response drafts, and calculates Net Promoter Score.
 * Integrates with the existing Reviews Airtable table.
 *
 * IMPORTANT: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  platform: ReviewPlatform;
  rating: number; // 1-5
  reviewerName: string;
  reviewText: string;
  date: string; // ISO
  service?: string;
  provider?: string;
  responseStatus: ResponseStatus;
  responseDraft?: string;
  responseDate?: string;
  sentiment?: SentimentResult;
  verified: boolean;
}

export type ReviewPlatform = 'google' | 'yelp' | 'facebook' | 'healthgrades' | 'realself' | 'internal';
export type ResponseStatus = 'pending' | 'drafted' | 'approved' | 'published' | 'skipped';

export interface SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  topics: SentimentTopic[];
  emotions: string[];
}

export interface SentimentTopic {
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  mentions: number;
}

export interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  ratingDistribution: Record<number, number>; // 1-5 counts
  reviewsThisWeek: number;
  reviewsThisMonth: number;
  reviewVelocity: ReviewVelocity;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  responseRate: number; // percentage of reviews responded to
  avgResponseTime: number; // hours
  nps: number; // -100 to 100
  platformBreakdown: Record<ReviewPlatform, { count: number; avgRating: number }>;
  topMentionedServices: { service: string; count: number; avgRating: number }[];
  topMentionedProviders: { provider: string; count: number; avgRating: number }[];
}

export interface ReviewVelocity {
  current: number; // reviews per week (current 4-week avg)
  previous: number; // reviews per week (prior 4-week avg)
  trend: 'accelerating' | 'stable' | 'decelerating';
  weeklyData: { week: string; count: number }[];
}

export interface CompetitorReviewData {
  name: string;
  platform: ReviewPlatform;
  totalReviews: number;
  avgRating: number;
  reviewsPerMonth: number;
  recentSentiment?: 'positive' | 'mixed' | 'negative';
}

export interface CompetitorComparison {
  ourStats: { totalReviews: number; avgRating: number; velocity: number };
  competitors: CompetitorReviewData[];
  ourRank: number; // 1-based rank among all
  insights: string[];
}

export interface ReviewResponseTemplate {
  id: string;
  name: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topic?: string;
  rating?: number;
  template: string;
  variables: string[];
}

export interface SolicitationWindow {
  optimalDay: number; // days after service
  channel: 'sms' | 'email';
  template: string;
  reason: string;
}

// ── Sentiment Analysis ────────────────────────────────────────────────────

const POSITIVE_WORDS = new Set([
  'amazing', 'excellent', 'wonderful', 'fantastic', 'beautiful', 'love', 'loved',
  'great', 'awesome', 'professional', 'friendly', 'clean', 'comfortable',
  'recommend', 'best', 'perfect', 'gentle', 'relaxing', 'natural', 'flawless',
  'knowledgeable', 'caring', 'thorough', 'impressive', 'transformed', 'glowing',
  'rejuvenated', 'refreshed', 'confident', 'stunning', 'luxurious', 'welcoming',
]);

const NEGATIVE_WORDS = new Set([
  'terrible', 'horrible', 'awful', 'worst', 'rude', 'unprofessional', 'dirty',
  'painful', 'disappointing', 'expensive', 'overpriced', 'wait', 'waited',
  'rushed', 'cold', 'uncomfortable', 'bruising', 'swelling', 'infection',
  'complaint', 'refund', 'regret', 'scarring', 'botched', 'uneven',
  'pushy', 'upsell', 'hidden', 'charges', 'misleading',
]);

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'staff/provider': ['staff', 'nurse', 'provider', 'doctor', 'esthetician', 'team', 'rina', 'mom'],
  'results': ['results', 'before', 'after', 'transformation', 'improvement', 'difference', 'noticeable'],
  'facility': ['clean', 'facility', 'office', 'room', 'space', 'environment', 'ambiance'],
  'pricing': ['price', 'cost', 'expensive', 'affordable', 'value', 'worth', 'deal', 'financing'],
  'wait_time': ['wait', 'waited', 'on time', 'late', 'delayed', 'punctual', 'prompt'],
  'pain/comfort': ['pain', 'painful', 'comfortable', 'gentle', 'hurt', 'numbing', 'relaxing'],
  'booking': ['booking', 'appointment', 'schedule', 'availability', 'easy to book', 'online'],
  'communication': ['explained', 'communication', 'follow-up', 'responsive', 'answered', 'informed'],
};

/**
 * Analyze sentiment of a review text.
 */
export function analyzeSentiment(text: string, rating: number): SentimentResult {
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (POSITIVE_WORDS.has(clean)) positiveCount++;
    if (NEGATIVE_WORDS.has(clean)) negativeCount++;
  }

  // Combine text analysis with rating
  const textScore = words.length > 0
    ? (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount)
    : 0;
  const ratingScore = (rating - 3) / 2; // maps 1-5 to -1 to 1
  const combinedScore = textScore * 0.4 + ratingScore * 0.6;

  let label: SentimentResult['label'];
  if (combinedScore > 0.2) label = 'positive';
  else if (combinedScore < -0.2) label = 'negative';
  else label = 'neutral';

  // Extract topics
  const topics: SentimentTopic[] = [];
  const lowerText = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const mentions = keywords.filter(kw => lowerText.includes(kw)).length;
    if (mentions > 0) {
      // Determine topic-level sentiment
      const topicWords = keywords.filter(kw => lowerText.includes(kw));
      const topicContext = topicWords.map(kw => {
        const idx = lowerText.indexOf(kw);
        return lowerText.slice(Math.max(0, idx - 30), idx + kw.length + 30);
      }).join(' ');
      const contextWords = topicContext.split(/\s+/);
      const topicPos = contextWords.filter(w => POSITIVE_WORDS.has(w.replace(/[^a-z]/g, ''))).length;
      const topicNeg = contextWords.filter(w => NEGATIVE_WORDS.has(w.replace(/[^a-z]/g, ''))).length;

      let topicSentiment: SentimentTopic['sentiment'] = 'neutral';
      if (topicPos > topicNeg) topicSentiment = 'positive';
      else if (topicNeg > topicPos) topicSentiment = 'negative';

      topics.push({ topic, sentiment: topicSentiment, mentions });
    }
  }

  // Extract emotions
  const emotions: string[] = [];
  if (lowerText.includes('love') || lowerText.includes('adore')) emotions.push('love');
  if (lowerText.includes('thank') || lowerText.includes('grateful')) emotions.push('gratitude');
  if (lowerText.includes('disappoint') || lowerText.includes('upset')) emotions.push('disappointment');
  if (lowerText.includes('surprise') || lowerText.includes('amazed')) emotions.push('surprise');
  if (lowerText.includes('confiden') || lowerText.includes('empower')) emotions.push('confidence');
  if (lowerText.includes('relax') || lowerText.includes('calm')) emotions.push('relaxation');
  if (lowerText.includes('frustrat') || lowerText.includes('annoyed')) emotions.push('frustration');

  const confidence = Math.min(1, (positiveCount + negativeCount) / Math.max(1, words.length) * 5 + 0.5);

  return {
    score: Math.round(combinedScore * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100,
    topics,
    emotions,
  };
}

// ── Review Statistics ─────────────────────────────────────────────────────

/**
 * Calculate comprehensive review statistics.
 */
export function calculateReviewStats(reviews: Review[]): ReviewStats {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      avgRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviewsThisWeek: 0,
      reviewsThisMonth: 0,
      reviewVelocity: { current: 0, previous: 0, trend: 'stable', weeklyData: [] },
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      responseRate: 0,
      avgResponseTime: 0,
      nps: 0,
      platformBreakdown: {} as never,
      topMentionedServices: [],
      topMentionedProviders: [],
    };
  }

  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;

  // Rating distribution
  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  for (const r of reviews) {
    ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;
    ratingSum += r.rating;
  }

  // Time-based counts
  const thisWeek = reviews.filter(r => new Date(r.date).getTime() > weekAgo).length;
  const thisMonth = reviews.filter(r => new Date(r.date).getTime() > monthAgo).length;

  // Review velocity
  const velocity = calculateReviewVelocity(reviews);

  // Sentiment breakdown
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const r of reviews) {
    const sentiment = r.sentiment || analyzeSentiment(r.reviewText, r.rating);
    sentimentBreakdown[sentiment.label]++;
  }

  // Response rate
  const responded = reviews.filter(r => r.responseStatus === 'published').length;
  const responseRate = reviews.length > 0 ? Math.round((responded / reviews.length) * 100) : 0;

  // Average response time (hours)
  const responseTimes = reviews
    .filter(r => r.responseDate && r.date)
    .map(r => (new Date(r.responseDate!).getTime() - new Date(r.date).getTime()) / 3600000);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
    : 0;

  // NPS calculation
  const nps = calculateNPS(reviews.map(r => r.rating));

  // Platform breakdown
  const platformBreakdown: Record<string, { count: number; ratingSum: number }> = {};
  for (const r of reviews) {
    if (!platformBreakdown[r.platform]) platformBreakdown[r.platform] = { count: 0, ratingSum: 0 };
    platformBreakdown[r.platform].count++;
    platformBreakdown[r.platform].ratingSum += r.rating;
  }
  const platforms: Record<ReviewPlatform, { count: number; avgRating: number }> = {} as never;
  for (const [p, data] of Object.entries(platformBreakdown)) {
    (platforms as Record<string, { count: number; avgRating: number }>)[p] = {
      count: data.count,
      avgRating: Math.round((data.ratingSum / data.count) * 10) / 10,
    };
  }

  // Service mentions
  const serviceMap: Record<string, { count: number; ratingSum: number }> = {};
  for (const r of reviews) {
    if (r.service) {
      if (!serviceMap[r.service]) serviceMap[r.service] = { count: 0, ratingSum: 0 };
      serviceMap[r.service].count++;
      serviceMap[r.service].ratingSum += r.rating;
    }
  }
  const topServices = Object.entries(serviceMap)
    .map(([service, data]) => ({
      service,
      count: data.count,
      avgRating: Math.round((data.ratingSum / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Provider mentions
  const providerMap: Record<string, { count: number; ratingSum: number }> = {};
  for (const r of reviews) {
    if (r.provider) {
      if (!providerMap[r.provider]) providerMap[r.provider] = { count: 0, ratingSum: 0 };
      providerMap[r.provider].count++;
      providerMap[r.provider].ratingSum += r.rating;
    }
  }
  const topProviders = Object.entries(providerMap)
    .map(([provider, data]) => ({
      provider,
      count: data.count,
      avgRating: Math.round((data.ratingSum / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalReviews: reviews.length,
    avgRating: Math.round((ratingSum / reviews.length) * 10) / 10,
    ratingDistribution: ratingDist,
    reviewsThisWeek: thisWeek,
    reviewsThisMonth: thisMonth,
    reviewVelocity: velocity,
    sentimentBreakdown,
    responseRate,
    avgResponseTime,
    nps,
    platformBreakdown: platforms,
    topMentionedServices: topServices,
    topMentionedProviders: topProviders,
  };
}

/**
 * Calculate review velocity (reviews per week trend).
 */
function calculateReviewVelocity(reviews: Review[]): ReviewVelocity {
  const now = Date.now();
  const weeklyData: { week: string; count: number }[] = [];

  // Last 12 weeks
  for (let w = 11; w >= 0; w--) {
    const weekStart = now - (w + 1) * 7 * 86400000;
    const weekEnd = now - w * 7 * 86400000;
    const count = reviews.filter(r => {
      const t = new Date(r.date).getTime();
      return t >= weekStart && t < weekEnd;
    }).length;
    const weekDate = new Date(weekStart);
    weeklyData.push({
      week: weekDate.toISOString().slice(0, 10),
      count,
    });
  }

  // Current 4-week avg vs prior 4-week avg
  const recentWeeks = weeklyData.slice(-4);
  const priorWeeks = weeklyData.slice(-8, -4);

  const current = recentWeeks.reduce((s, w) => s + w.count, 0) / 4;
  const previous = priorWeeks.reduce((s, w) => s + w.count, 0) / 4;

  let trend: ReviewVelocity['trend'];
  if (current > previous * 1.2) trend = 'accelerating';
  else if (current < previous * 0.8) trend = 'decelerating';
  else trend = 'stable';

  return {
    current: Math.round(current * 10) / 10,
    previous: Math.round(previous * 10) / 10,
    trend,
    weeklyData,
  };
}

/**
 * Calculate Net Promoter Score from review ratings.
 * Maps 5-star to NPS: 5=Promoter, 4=Passive, 1-3=Detractor.
 */
export function calculateNPS(ratings: number[]): number {
  if (ratings.length === 0) return 0;

  let promoters = 0;
  let detractors = 0;

  for (const rating of ratings) {
    if (rating >= 5) promoters++;
    else if (rating <= 3) detractors++;
    // 4 = passive, doesn't count
  }

  const promoterPct = (promoters / ratings.length) * 100;
  const detractorPct = (detractors / ratings.length) * 100;

  return Math.round(promoterPct - detractorPct);
}

// ── Response Templates ────────────────────────────────────────────────────

const RESPONSE_TEMPLATES: ReviewResponseTemplate[] = [
  // Positive responses
  {
    id: 'positive_general',
    name: 'Positive — General',
    sentiment: 'positive',
    rating: 5,
    template: `Thank you so much for your kind words, {{reviewerName}}! We're thrilled to hear about your wonderful experience at Rani Beauty Clinic. {{providerMention}}Your satisfaction and confidence are what drive us every day. We look forward to seeing you again for your next visit!`,
    variables: ['reviewerName', 'providerMention'],
  },
  {
    id: 'positive_results',
    name: 'Positive — Results',
    sentiment: 'positive',
    topic: 'results',
    template: `What an incredible review, {{reviewerName}}! We're so happy to see your amazing results and that you're loving the transformation. {{serviceMention}}At Rani Beauty Clinic, delivering visible, natural-looking results is our passion. We can't wait to continue your journey!`,
    variables: ['reviewerName', 'serviceMention'],
  },
  {
    id: 'positive_staff',
    name: 'Positive — Staff',
    sentiment: 'positive',
    topic: 'staff/provider',
    template: `Thank you for the wonderful feedback, {{reviewerName}}! Our team takes such pride in creating a welcoming, personalized experience for every client. {{providerMention}}We'll make sure to share your kind words with the team!`,
    variables: ['reviewerName', 'providerMention'],
  },
  {
    id: 'positive_first_visit',
    name: 'Positive — First Visit',
    sentiment: 'positive',
    template: `Welcome to the Rani Beauty Clinic family, {{reviewerName}}! We're so glad your first visit exceeded expectations. {{serviceMention}}We've designed every detail of our clinic to make you feel pampered and confident. Can't wait to see you again!`,
    variables: ['reviewerName', 'serviceMention'],
  },
  // Neutral responses
  {
    id: 'neutral_general',
    name: 'Neutral — General',
    sentiment: 'neutral',
    template: `Thank you for taking the time to share your experience, {{reviewerName}}. We appreciate your honest feedback and are always looking for ways to elevate your experience at Rani Beauty Clinic. We'd love the opportunity to exceed your expectations on your next visit.`,
    variables: ['reviewerName'],
  },
  {
    id: 'neutral_constructive',
    name: 'Neutral — Constructive',
    sentiment: 'neutral',
    template: `Thank you for your feedback, {{reviewerName}}. We value every client's perspective and take all suggestions seriously. {{specificResponse}}We'd love to discuss how we can make your next experience even better. Please don't hesitate to reach out to us directly.`,
    variables: ['reviewerName', 'specificResponse'],
  },
  // Negative responses
  {
    id: 'negative_general',
    name: 'Negative — General',
    sentiment: 'negative',
    template: `{{reviewerName}}, we sincerely apologize that your experience didn't meet our high standards. This is not reflective of the level of care we strive to provide at Rani Beauty Clinic. We take your feedback very seriously and would appreciate the opportunity to make this right. Please contact us directly at info@ranibeautyclinic.com so we can address your concerns personally.`,
    variables: ['reviewerName'],
  },
  {
    id: 'negative_wait',
    name: 'Negative — Wait Time',
    sentiment: 'negative',
    topic: 'wait_time',
    template: `{{reviewerName}}, we sincerely apologize for the extended wait time during your visit. We understand your time is valuable and this does not reflect the experience we aim to provide. We've reviewed our scheduling processes to prevent this from happening again. We'd love to welcome you back and show you the true Rani experience.`,
    variables: ['reviewerName'],
  },
  {
    id: 'negative_pricing',
    name: 'Negative — Pricing',
    sentiment: 'negative',
    topic: 'pricing',
    template: `Thank you for your feedback, {{reviewerName}}. We understand that pricing is an important consideration. At Rani Beauty Clinic, our pricing reflects the premium products, advanced technology, and physician-supervised care we provide. We'd be happy to discuss our membership options and treatment packages that offer excellent value. Please reach out to us at info@ranibeautyclinic.com.`,
    variables: ['reviewerName'],
  },
];

/**
 * Draft a response for a review based on sentiment and topics.
 */
export function draftReviewResponse(review: Review): {
  template: ReviewResponseTemplate;
  draft: string;
  confidence: number;
} {
  const sentiment = review.sentiment || analyzeSentiment(review.reviewText, review.rating);

  // Find best matching template
  let bestTemplate: ReviewResponseTemplate | undefined;

  // Try topic-specific match first
  if (sentiment.topics.length > 0) {
    const primaryTopic = sentiment.topics[0].topic;
    bestTemplate = RESPONSE_TEMPLATES.find(
      t => t.sentiment === sentiment.label && t.topic === primaryTopic
    );
  }

  // Fall back to general template
  if (!bestTemplate) {
    bestTemplate = RESPONSE_TEMPLATES.find(
      t => t.sentiment === sentiment.label && !t.topic
    );
  }

  // Last resort
  if (!bestTemplate) {
    bestTemplate = RESPONSE_TEMPLATES[0];
  }

  // Fill in variables
  let draft = bestTemplate.template;
  draft = draft.replace(/\{\{reviewerName\}\}/g, review.reviewerName || 'Valued Client');

  if (review.provider) {
    draft = draft.replace(
      /\{\{providerMention\}\}/g,
      `We'll be sure to share your kind words with ${review.provider}. `
    );
  } else {
    draft = draft.replace(/\{\{providerMention\}\}/g, '');
  }

  if (review.service) {
    draft = draft.replace(
      /\{\{serviceMention\}\}/g,
      `We're glad you enjoyed your ${review.service} treatment! `
    );
  } else {
    draft = draft.replace(/\{\{serviceMention\}\}/g, '');
  }

  draft = draft.replace(/\{\{specificResponse\}\}/g, '');

  return {
    template: bestTemplate,
    draft,
    confidence: sentiment.confidence,
  };
}

/**
 * Get all response templates.
 */
export function getResponseTemplates(): ReviewResponseTemplate[] {
  return [...RESPONSE_TEMPLATES];
}

// ── Review Solicitation ───────────────────────────────────────────────────

/**
 * Determine optimal timing for review solicitation after service.
 */
export function getOptimalSolicitationWindow(
  service: string,
  rating?: number,
): SolicitationWindow {
  // High-satisfaction clients (4-5 stars from internal feedback) — ask sooner
  if (rating && rating >= 4) {
    return {
      optimalDay: 1,
      channel: 'sms',
      template: 'Hi {{clientName}}! We loved having you at Rani Beauty Clinic yesterday. Would you mind sharing your experience with a quick Google review? It means the world to us. {{reviewLink}}',
      reason: 'High satisfaction score — strike while enthusiasm is fresh',
    };
  }

  // Service-specific timing
  const lowerService = service.toLowerCase();
  if (lowerService.includes('sofwave') || lowerService.includes('rf microneedling')) {
    return {
      optimalDay: 14,
      channel: 'email',
      template: 'Hi {{clientName}}, it\'s been two weeks since your {{service}} treatment at Rani Beauty Clinic. You should be seeing your initial results! We\'d love to hear about your experience — would you share a quick review? {{reviewLink}}',
      reason: 'Collagen-stimulating treatments show results after 2 weeks',
    };
  }

  if (lowerService.includes('peel') || lowerService.includes('prx')) {
    return {
      optimalDay: 7,
      channel: 'sms',
      template: 'Hi {{clientName}}! Now that your skin has fully healed from your {{service}}, we hope you\'re loving the results! Would you share your experience? {{reviewLink}}',
      reason: 'Peels need 5-7 days for full healing and visible results',
    };
  }

  if (lowerService.includes('botox') || lowerService.includes('filler')) {
    return {
      optimalDay: 10,
      channel: 'sms',
      template: 'Hi {{clientName}}! Your {{service}} should be fully settled now. We hope you\'re loving the results! Would you mind sharing a quick review? {{reviewLink}}',
      reason: 'Injectables take 7-14 days to settle for final results',
    };
  }

  // Default — 3 days for most treatments
  return {
    optimalDay: 3,
    channel: 'sms',
    template: 'Hi {{clientName}}! Thank you for visiting Rani Beauty Clinic for your {{service}} treatment. We hope you\'re enjoying the experience! Would you share a quick review? {{reviewLink}}',
    reason: 'Standard post-treatment solicitation window',
  };
}

// ── Competitor Comparison ─────────────────────────────────────────────────

/**
 * Compare review performance against competitors.
 */
export function compareWithCompetitors(
  ourReviews: Review[],
  competitors: CompetitorReviewData[],
): CompetitorComparison {
  const ourStats = calculateReviewStats(ourReviews);

  const allEntrants = [
    { name: 'Rani Beauty Clinic', totalReviews: ourStats.totalReviews, avgRating: ourStats.avgRating, velocity: ourStats.reviewVelocity.current },
    ...competitors.map(c => ({ name: c.name, totalReviews: c.totalReviews, avgRating: c.avgRating, velocity: c.reviewsPerMonth / 4 })),
  ].sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews);

  const ourRank = allEntrants.findIndex(e => e.name === 'Rani Beauty Clinic') + 1;

  // Generate insights
  const insights: string[] = [];
  const avgCompetitorRating = competitors.length > 0
    ? competitors.reduce((s, c) => s + c.avgRating, 0) / competitors.length
    : 0;
  const avgCompetitorCount = competitors.length > 0
    ? competitors.reduce((s, c) => s + c.totalReviews, 0) / competitors.length
    : 0;

  if (ourStats.avgRating > avgCompetitorRating) {
    insights.push(`Rani's ${ourStats.avgRating} avg rating exceeds competitor average of ${avgCompetitorRating.toFixed(1)}`);
  } else {
    insights.push(`Rating of ${ourStats.avgRating} is below competitor average of ${avgCompetitorRating.toFixed(1)} — focus on service quality and follow-up`);
  }

  if (ourStats.totalReviews < avgCompetitorCount * 0.7) {
    insights.push('Review volume is below average — increase solicitation frequency');
  }

  if (ourStats.reviewVelocity.trend === 'decelerating') {
    insights.push('Review velocity is slowing — consider post-treatment review request automation');
  }

  if (ourStats.responseRate < 80) {
    insights.push(`Response rate of ${ourStats.responseRate}% — aim for 100% to improve SEO and trust signals`);
  }

  return {
    ourStats: {
      totalReviews: ourStats.totalReviews,
      avgRating: ourStats.avgRating,
      velocity: ourStats.reviewVelocity.current,
    },
    competitors,
    ourRank,
    insights,
  };
}

/**
 * Get rating distribution analysis with industry benchmarks.
 */
export function analyzeRatingDistribution(
  distribution: Record<number, number>,
): {
  distribution: Record<number, { count: number; percentage: number }>;
  jScore: number; // "J-curve" health — healthy businesses have J-shaped distribution (mostly 5s)
  actionItems: string[];
} {
  const total = Object.values(distribution).reduce((s, c) => s + c, 0);
  const dist: Record<number, { count: number; percentage: number }> = {};
  for (let i = 1; i <= 5; i++) {
    dist[i] = {
      count: distribution[i] || 0,
      percentage: total > 0 ? Math.round(((distribution[i] || 0) / total) * 100) : 0,
    };
  }

  // J-Score: percentage of 5-star reviews (healthy businesses are 60%+)
  const jScore = dist[5]?.percentage || 0;

  const actionItems: string[] = [];
  if (jScore < 50) actionItems.push('5-star review percentage is below 50% — review service delivery and ask satisfied clients specifically for reviews');
  if ((dist[1]?.percentage || 0) > 5) actionItems.push('1-star reviews above 5% — investigate and address root causes immediately');
  if ((dist[2]?.percentage || 0) > 10) actionItems.push('2-star reviews above 10% — identify common complaints and create improvement plan');
  if ((dist[3]?.percentage || 0) > 20) actionItems.push('High neutral review rate — focus on creating memorable "wow" moments during service');

  return { distribution: dist, jScore, actionItems };
}
