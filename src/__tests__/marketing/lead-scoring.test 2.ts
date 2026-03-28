import {
  scoreLead, scoreLeads, calculateDecay, assignGrade, getGradeDefinitions,
  calibrateModel, getSourceQualityRanking, getPipelineSummary,
  type LeadScoringInput, type LeadGrade,
} from '@/lib/marketing/lead-scoring';

// ── Helper: build a valid LeadScoringInput ──────────────────────────────

function makeLead(overrides: Partial<{
  source: string;
  distanceMiles: number;
  lastActivityAt: string;
  pagesPerSession: number;
  returnVisits: number;
  avgSessionDuration: number;
  chatMessages: number;
  phoneCallsMade: number;
  consultFormCompleted: boolean;
  consultFormStarted: boolean;
  quizCompleted: boolean;
  formSubmissions: number;
  emailOpens: number;
  emailClicks: number;
  smsReplies: number;
  pagesViewed: { path: string; category: string; viewCount: number; totalTimeSeconds: number; lastViewed: string }[];
}> = {}): LeadScoringInput {
  return {
    lead: {
      id: 'test-lead',
      name: 'Test Lead',
      source: (overrides.source as never) || 'google_organic',
      createdAt: '2026-03-20T10:00:00Z',
      lastActivityAt: overrides.lastActivityAt || new Date().toISOString(),
      status: 'new',
      location: { city: 'Renton', state: 'WA', distanceMiles: overrides.distanceMiles ?? 5 },
    },
    behavioral: {
      totalPageViews: 10,
      uniquePageViews: 6,
      totalSessions: 3,
      avgSessionDuration: overrides.avgSessionDuration ?? 300,
      pagesPerSession: overrides.pagesPerSession ?? 3.5,
      returnVisits: overrides.returnVisits ?? 2,
      lastSessionDate: new Date().toISOString(),
      pagesViewed: (overrides.pagesViewed as never) || [
        { path: '/services/sofwave', category: 'service', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' },
      ],
    },
    engagement: {
      chatInteractions: overrides.chatMessages ? 1 : 0,
      chatMessages: overrides.chatMessages ?? 0,
      formSubmissions: overrides.formSubmissions ?? 0,
      emailOpens: overrides.emailOpens ?? 0,
      emailClicks: overrides.emailClicks ?? 0,
      smsReplies: overrides.smsReplies ?? 0,
      phoneCallsMade: overrides.phoneCallsMade ?? 0,
      downloadedContent: [],
      quizCompleted: overrides.quizCompleted ?? false,
      consultFormStarted: overrides.consultFormStarted ?? false,
      consultFormCompleted: overrides.consultFormCompleted ?? false,
    },
  };
}

// ── scoreLead ───────────────────────────────────────────────────────────

describe('scoreLead', () => {
  it('returns a score between 0 and 100', () => {
    const result = scoreLead(makeLead());
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it('returns all 4 scoring dimensions in factors', () => {
    const result = scoreLead(makeLead());
    const dims = new Set(result.factors.map(f => f.dimension));
    expect(dims.has('demographic')).toBe(true);
    expect(dims.has('behavioral')).toBe(true);
    expect(dims.has('engagement')).toBe(true);
    expect(dims.has('intent')).toBe(true);
  });

  it('assigns grade A for high-engagement local referral lead', () => {
    const result = scoreLead(makeLead({
      source: 'referral',
      distanceMiles: 2,
      pagesPerSession: 8,
      returnVisits: 5,
      avgSessionDuration: 600,
      chatMessages: 6,
      phoneCallsMade: 1,
      consultFormCompleted: true,
      pagesViewed: [
        { path: '/pricing', category: 'pricing', viewCount: 3, totalTimeSeconds: 180, lastViewed: '2026-03-25' },
        { path: '/get-started', category: 'booking', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' },
        { path: '/services/sofwave', category: 'service', viewCount: 4, totalTimeSeconds: 240, lastViewed: '2026-03-25' },
        { path: '/services/botox', category: 'service', viewCount: 2, totalTimeSeconds: 100, lastViewed: '2026-03-24' },
      ],
    }));
    expect(result.grade).toBe('A');
    expect(result.totalScore).toBeGreaterThanOrEqual(75);
  });

  it('assigns grade D for cold lead with no engagement', () => {
    const threeDaysAgo = new Date(Date.now() - 20 * 86400000).toISOString();
    const result = scoreLead(makeLead({
      source: 'other',
      distanceMiles: 60,
      lastActivityAt: threeDaysAgo,
      pagesPerSession: 1,
      returnVisits: 0,
      avgSessionDuration: 30,
      pagesViewed: [{ path: '/', category: 'homepage', viewCount: 1, totalTimeSeconds: 30, lastViewed: threeDaysAgo }],
    }));
    expect(result.grade).toBe('D');
    expect(result.totalScore).toBeLessThan(25);
  });

  it('auto-assigns grade A leads to frontdesk', () => {
    const result = scoreLead(makeLead({
      source: 'referral',
      distanceMiles: 2,
      consultFormCompleted: true,
      phoneCallsMade: 1,
      pagesPerSession: 8,
      returnVisits: 5,
      avgSessionDuration: 600,
      chatMessages: 6,
      pagesViewed: [
        { path: '/pricing', category: 'pricing', viewCount: 3, totalTimeSeconds: 180, lastViewed: '2026-03-25' },
        { path: '/get-started', category: 'booking', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' },
        { path: '/services/sofwave', category: 'service', viewCount: 4, totalTimeSeconds: 240, lastViewed: '2026-03-25' },
      ],
    }));
    if (result.grade === 'A') {
      expect(result.autoAssign).toBe(true);
      expect(result.assignTo).toBe('frontdesk');
    }
  });

  it('does not auto-assign grade B leads', () => {
    const result = scoreLead(makeLead({ source: 'meta_ads', distanceMiles: 20 }));
    if (result.grade !== 'A') {
      expect(result.autoAssign).toBe(false);
    }
  });

  it('scores google_organic higher than tiktok source', () => {
    const organic = scoreLead(makeLead({ source: 'google_organic' }));
    const tiktok = scoreLead(makeLead({ source: 'tiktok' }));
    expect(organic.totalScore).toBeGreaterThan(tiktok.totalScore);
  });

  it('scores closer location higher', () => {
    const close = scoreLead(makeLead({ distanceMiles: 3 }));
    const far = scoreLead(makeLead({ distanceMiles: 50 }));
    expect(close.totalScore).toBeGreaterThan(far.totalScore);
  });

  it('scores pricing page visitor higher than homepage-only', () => {
    const pricing = scoreLead(makeLead({
      pagesViewed: [{ path: '/pricing', category: 'pricing', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' }],
    }));
    const homepage = scoreLead(makeLead({
      pagesViewed: [{ path: '/', category: 'homepage', viewCount: 1, totalTimeSeconds: 30, lastViewed: '2026-03-25' }],
    }));
    expect(pricing.totalScore).toBeGreaterThan(homepage.totalScore);
  });

  it('scores booking page highest intent', () => {
    const booking = scoreLead(makeLead({
      pagesViewed: [{ path: '/get-started', category: 'booking', viewCount: 1, totalTimeSeconds: 60, lastViewed: '2026-03-25' }],
    }));
    const blog = scoreLead(makeLead({
      pagesViewed: [{ path: '/blog/tips', category: 'blog', viewCount: 1, totalTimeSeconds: 60, lastViewed: '2026-03-25' }],
    }));
    expect(booking.totalScore).toBeGreaterThan(blog.totalScore);
  });

  it('boosts score for completed consult form', () => {
    const completed = scoreLead(makeLead({ consultFormCompleted: true, consultFormStarted: true }));
    const started = scoreLead(makeLead({ consultFormStarted: true }));
    const none = scoreLead(makeLead());
    expect(completed.totalScore).toBeGreaterThan(started.totalScore);
    expect(started.totalScore).toBeGreaterThan(none.totalScore);
  });

  it('boosts score for chat engagement', () => {
    const chatted = scoreLead(makeLead({ chatMessages: 5 }));
    const nope = scoreLead(makeLead());
    expect(chatted.totalScore).toBeGreaterThan(nope.totalScore);
  });

  it('boosts score for phone calls', () => {
    const called = scoreLead(makeLead({ phoneCallsMade: 1 }));
    const nope = scoreLead(makeLead());
    expect(called.totalScore).toBeGreaterThan(nope.totalScore);
  });

  it('produces correct urgency for hot leads', () => {
    const result = scoreLead(makeLead({
      source: 'referral', distanceMiles: 2, consultFormCompleted: true,
      phoneCallsMade: 1, pagesPerSession: 8, returnVisits: 5, avgSessionDuration: 600,
      chatMessages: 6,
      pagesViewed: [
        { path: '/pricing', category: 'pricing', viewCount: 3, totalTimeSeconds: 180, lastViewed: '2026-03-25' },
        { path: '/get-started', category: 'booking', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' },
        { path: '/services/sofwave', category: 'service', viewCount: 4, totalTimeSeconds: 240, lastViewed: '2026-03-25' },
      ],
    }));
    if (result.grade === 'A') {
      expect(['immediate', 'today']).toContain(result.urgency);
    }
  });

  it('generates a recommendation with action and channel', () => {
    const result = scoreLead(makeLead());
    expect(result.recommendation.action).toBeTruthy();
    expect(result.recommendation.channel).toBeTruthy();
    expect(result.recommendation.timing).toBeTruthy();
  });

  it('recommendation channel is phone for grade A', () => {
    const result = scoreLead(makeLead({
      source: 'referral', distanceMiles: 2, consultFormCompleted: true,
      phoneCallsMade: 1, pagesPerSession: 8, returnVisits: 5, avgSessionDuration: 600,
      chatMessages: 6,
      pagesViewed: [
        { path: '/pricing', category: 'pricing', viewCount: 3, totalTimeSeconds: 180, lastViewed: '2026-03-25' },
        { path: '/get-started', category: 'booking', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' },
        { path: '/services/sofwave', category: 'service', viewCount: 4, totalTimeSeconds: 240, lastViewed: '2026-03-25' },
      ],
    }));
    if (result.grade === 'A') {
      expect(result.recommendation.channel).toBe('phone');
    }
  });

  it('has rawScore >= totalScore (decay only reduces)', () => {
    const result = scoreLead(makeLead());
    expect(result.rawScore).toBeGreaterThanOrEqual(result.totalScore);
  });

  it('returns factors with valid weights and scores', () => {
    const result = scoreLead(makeLead());
    for (const f of result.factors) {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
      expect(f.weight).toBeGreaterThan(0);
      expect(f.weight).toBeLessThanOrEqual(1);
    }
  });
});

// ── calculateDecay ──────────────────────────────────────────────────────

describe('calculateDecay', () => {
  it('returns 0 for activity within grace period', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(calculateDecay(yesterday)).toBe(0);
  });

  it('returns positive decay for old activity', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    expect(calculateDecay(thirtyDaysAgo)).toBeGreaterThan(0);
  });

  it('never exceeds max decay (60%)', () => {
    const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString();
    expect(calculateDecay(yearAgo)).toBeLessThanOrEqual(60);
  });

  it('increases with more days of inactivity', () => {
    const tenDays = new Date(Date.now() - 10 * 86400000).toISOString();
    const twentyDays = new Date(Date.now() - 20 * 86400000).toISOString();
    expect(calculateDecay(twentyDays)).toBeGreaterThan(calculateDecay(tenDays));
  });

  it('returns 0 for activity today', () => {
    expect(calculateDecay(new Date().toISOString())).toBe(0);
  });
});

// ── assignGrade ─────────────────────────────────────────────────────────

describe('assignGrade', () => {
  it('assigns A for score >= 75', () => {
    expect(assignGrade(75).grade).toBe('A');
    expect(assignGrade(100).grade).toBe('A');
  });

  it('assigns B for score 50-74', () => {
    expect(assignGrade(50).grade).toBe('B');
    expect(assignGrade(74).grade).toBe('B');
  });

  it('assigns C for score 25-49', () => {
    expect(assignGrade(25).grade).toBe('C');
    expect(assignGrade(49).grade).toBe('C');
  });

  it('assigns D for score < 25', () => {
    expect(assignGrade(0).grade).toBe('D');
    expect(assignGrade(24).grade).toBe('D');
  });

  it('returns grade info with color and description', () => {
    const info = assignGrade(80);
    expect(info.color).toBeTruthy();
    expect(info.description).toBeTruthy();
    expect(info.label).toBe('Hot Lead');
  });
});

// ── getGradeDefinitions ─────────────────────────────────────────────────

describe('getGradeDefinitions', () => {
  it('returns 4 grade definitions', () => {
    expect(getGradeDefinitions()).toHaveLength(4);
  });

  it('grades cover full 0-100 range', () => {
    const defs = getGradeDefinitions();
    expect(defs.some(d => d.minScore === 0)).toBe(true);
    expect(defs.some(d => d.maxScore === 100)).toBe(true);
  });
});

// ── scoreLeads (batch) ──────────────────────────────────────────────────

describe('scoreLeads', () => {
  it('returns results sorted by score descending', () => {
    const inputs = [
      makeLead({ source: 'other', distanceMiles: 60 }),
      makeLead({ source: 'google_organic', distanceMiles: 2, consultFormCompleted: true }),
    ];
    inputs[0].lead.id = 'low';
    inputs[1].lead.id = 'high';
    const results = scoreLeads(inputs);
    expect(results[0].totalScore).toBeGreaterThanOrEqual(results[1].totalScore);
  });

  it('includes leadId in results', () => {
    const inputs = [makeLead()];
    inputs[0].lead.id = 'my-lead';
    const results = scoreLeads(inputs);
    expect(results[0].leadId).toBe('my-lead');
  });
});

// ── calibrateModel ──────────────────────────────────────────────────────

describe('calibrateModel', () => {
  it('calculates conversion rates per grade', () => {
    const result = calibrateModel([
      { grade: 'A', converted: true, source: 'google_organic' },
      { grade: 'A', converted: false, source: 'google_organic' },
      { grade: 'B', converted: false, source: 'meta_ads' },
    ]);
    expect(result.gradeConversionRates.A).toBe(50);
    expect(result.gradeConversionRates.B).toBe(0);
  });

  it('calculates model accuracy', () => {
    const result = calibrateModel([
      { grade: 'A', converted: true, source: 'google_organic' },
      { grade: 'D', converted: false, source: 'other' },
    ]);
    expect(result.modelAccuracy).toBe(100);
  });

  it('handles empty input', () => {
    const result = calibrateModel([]);
    expect(result.modelAccuracy).toBe(0);
  });
});

// ── getSourceQualityRanking ─────────────────────────────────────────────

describe('getSourceQualityRanking', () => {
  it('returns sorted by quality descending', () => {
    const ranking = getSourceQualityRanking();
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].quality).toBeGreaterThanOrEqual(ranking[i].quality);
    }
  });

  it('has google_organic as highest quality', () => {
    const ranking = getSourceQualityRanking();
    expect(ranking[0].source).toBe('google_organic');
  });
});

// ── getPipelineSummary ──────────────────────────────────────────────────

describe('getPipelineSummary', () => {
  it('counts total leads', () => {
    const scores = [
      { leadId: '1', totalScore: 80, grade: 'A' as LeadGrade, factors: [], decayApplied: 0, rawScore: 80, recommendation: { action: '', channel: 'phone' as const, timing: '', reason: '' }, autoAssign: true, assignTo: 'frontdesk', urgency: 'immediate' as const },
      { leadId: '2', totalScore: 40, grade: 'C' as LeadGrade, factors: [], decayApplied: 0, rawScore: 40, recommendation: { action: '', channel: 'email' as const, timing: '', reason: '' }, autoAssign: false, urgency: 'this_week' as const },
    ];
    const summary = getPipelineSummary(scores);
    expect(summary.total).toBe(2);
    expect(summary.byGrade.A).toBe(1);
    expect(summary.byGrade.C).toBe(1);
    expect(summary.hotLeads).toBe(1);
    expect(summary.autoAssigned).toBe(1);
  });

  it('calculates average score', () => {
    const scores = [
      { leadId: '1', totalScore: 80, grade: 'A' as LeadGrade, factors: [], decayApplied: 0, rawScore: 80, recommendation: { action: '', channel: 'phone' as const, timing: '', reason: '' }, autoAssign: true, urgency: 'immediate' as const },
      { leadId: '2', totalScore: 60, grade: 'B' as LeadGrade, factors: [], decayApplied: 0, rawScore: 60, recommendation: { action: '', channel: 'sms' as const, timing: '', reason: '' }, autoAssign: false, urgency: 'today' as const },
    ];
    const summary = getPipelineSummary(scores);
    expect(summary.avgScore).toBe(70);
  });
});
