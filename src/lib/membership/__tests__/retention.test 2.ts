// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateEngagementScore,
  predictMembershipChurn,
  identifyAtRiskMembers,
  generateRetentionActions,
  createWinBackCampaign,
  getNextWinBackStep,
  classifyNPS,
  calculateAggregateNPS,
  calculateNPSByTier,
  buildRetentionAnalytics,
  getSurveysDue,
  createNPSEntry,
  SURVEY_MILESTONES,
  type EngagementInput,
  type MemberRetentionProfile,
  type NPSEntry,
} from '../retention';

// ── Engagement Scoring ───────────────────────────────────────────────────

describe('calculateEngagementScore', () => {
  const baseInput: EngagementInput = {
    creditUsageRate: 0.8,
    visitFrequency: 1.5,
    addOnPurchaseCount: 2,
    daysSinceLastVisit: 10,
    guestPassUsage: 0.5,
    eventAttendance: 0.5,
    referralCount: 1,
    monthsAsMember: 6,
  };

  it('returns score between 0 and 100', () => {
    const result = calculateEngagementScore(baseInput);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('high engagement input gives high score', () => {
    const result = calculateEngagementScore({
      ...baseInput,
      creditUsageRate: 1.0,
      visitFrequency: 2.5,
      daysSinceLastVisit: 3,
    });
    expect(result.score).toBeGreaterThan(70);
  });

  it('low engagement input gives low score', () => {
    const result = calculateEngagementScore({
      creditUsageRate: 0.1,
      visitFrequency: 0.2,
      addOnPurchaseCount: 0,
      daysSinceLastVisit: 80,
      guestPassUsage: 0,
      eventAttendance: 0,
      referralCount: 0,
      monthsAsMember: 1,
    });
    expect(result.score).toBeLessThan(30);
  });

  it('returns breakdown with all factors', () => {
    const result = calculateEngagementScore(baseInput);
    expect(result.breakdown).toHaveProperty('creditUsage');
    expect(result.breakdown).toHaveProperty('visitFrequency');
    expect(result.breakdown).toHaveProperty('recency');
    expect(result.breakdown).toHaveProperty('addOns');
    expect(result.breakdown).toHaveProperty('social');
    expect(result.breakdown).toHaveProperty('tenure');
  });

  it('credit usage maps correctly', () => {
    const high = calculateEngagementScore({ ...baseInput, creditUsageRate: 1.0 });
    const low = calculateEngagementScore({ ...baseInput, creditUsageRate: 0.1 });
    expect(high.breakdown.creditUsage).toBeGreaterThan(low.breakdown.creditUsage);
  });

  it('visit frequency 2+ gives max score', () => {
    const result = calculateEngagementScore({ ...baseInput, visitFrequency: 2.5 });
    expect(result.breakdown.visitFrequency).toBe(100);
  });

  it('recency degrades with days', () => {
    const recent = calculateEngagementScore({ ...baseInput, daysSinceLastVisit: 5 });
    const old = calculateEngagementScore({ ...baseInput, daysSinceLastVisit: 95 });
    expect(recent.breakdown.recency).toBeGreaterThan(old.breakdown.recency);
  });
});

// ── Churn Prediction ─────────────────────────────────────────────────────

describe('predictMembershipChurn', () => {
  it('returns score between 0 and 100', () => {
    const result = predictMembershipChurn({
      engagementScore: 70, creditUsageRate: 0.8, failedPaymentCount: 0,
      monthsAsMember: 6, daysSinceLastVisit: 10, status: 'active',
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('low engagement = high churn risk', () => {
    const result = predictMembershipChurn({
      engagementScore: 15, creditUsageRate: 0.1, failedPaymentCount: 0,
      monthsAsMember: 2, daysSinceLastVisit: 75, status: 'active',
    });
    expect(['high', 'critical']).toContain(result.risk);
    expect(result.score).toBeGreaterThan(50);
  });

  it('high engagement = low churn risk', () => {
    const result = predictMembershipChurn({
      engagementScore: 90, creditUsageRate: 0.95, failedPaymentCount: 0,
      monthsAsMember: 12, npsScore: 9, daysSinceLastVisit: 5, status: 'active',
    });
    expect(result.risk).toBe('low');
    expect(result.score).toBeLessThan(25);
  });

  it('failed payments increase risk', () => {
    const clean = predictMembershipChurn({
      engagementScore: 60, creditUsageRate: 0.5, failedPaymentCount: 0,
      monthsAsMember: 6, daysSinceLastVisit: 15, status: 'active',
    });
    const failed = predictMembershipChurn({
      engagementScore: 60, creditUsageRate: 0.5, failedPaymentCount: 3,
      monthsAsMember: 6, daysSinceLastVisit: 15, status: 'active',
    });
    expect(failed.score).toBeGreaterThan(clean.score);
  });

  it('suspended members are critical', () => {
    const result = predictMembershipChurn({
      engagementScore: 50, creditUsageRate: 0.5, failedPaymentCount: 3,
      monthsAsMember: 6, daysSinceLastVisit: 30, status: 'suspended',
    });
    expect(result.risk).toBe('critical');
    expect(result.score).toBe(95);
  });

  it('returns exactly 6 risk factors', () => {
    const result = predictMembershipChurn({
      engagementScore: 50, creditUsageRate: 0.5, failedPaymentCount: 0,
      monthsAsMember: 6, daysSinceLastVisit: 20, status: 'active',
    });
    expect(result.factors).toHaveLength(6);
  });

  it('NPS detractor increases risk', () => {
    const promoter = predictMembershipChurn({
      engagementScore: 60, creditUsageRate: 0.6, failedPaymentCount: 0,
      monthsAsMember: 6, npsScore: 9, daysSinceLastVisit: 15, status: 'active',
    });
    const detractor = predictMembershipChurn({
      engagementScore: 60, creditUsageRate: 0.6, failedPaymentCount: 0,
      monthsAsMember: 6, npsScore: 4, daysSinceLastVisit: 15, status: 'active',
    });
    expect(detractor.score).toBeGreaterThan(promoter.score);
  });

  it('new members have higher tenure risk', () => {
    const newMember = predictMembershipChurn({
      engagementScore: 60, creditUsageRate: 0.6, failedPaymentCount: 0,
      monthsAsMember: 1, daysSinceLastVisit: 10, status: 'active',
    });
    const veteran = predictMembershipChurn({
      engagementScore: 60, creditUsageRate: 0.6, failedPaymentCount: 0,
      monthsAsMember: 18, daysSinceLastVisit: 10, status: 'active',
    });
    expect(newMember.score).toBeGreaterThan(veteran.score);
  });
});

// ── At-Risk Detection ────────────────────────────────────────────────────

describe('identifyAtRiskMembers', () => {
  const profiles: MemberRetentionProfile[] = [
    { memberId: 'm1', clientId: 'c1', clientName: 'Safe', tier: 'elite', status: 'active', joinDate: '2025-01-01', monthsAsMember: 14, engagementScore: 90, engagementTrend: 'improving', creditUsageRate: 95, visitFrequency: 2, addOnPurchases: 3, daysSinceLastVisit: 5, churnRisk: 'low', churnScore: 10, riskFactors: [], paymentIssues: false, failedPaymentCount: 0, surveysDue: [], retentionActions: [] },
    { memberId: 'm2', clientId: 'c2', clientName: 'At Risk', tier: 'halo', status: 'active', joinDate: '2025-06-01', monthsAsMember: 9, engagementScore: 30, engagementTrend: 'declining', creditUsageRate: 15, visitFrequency: 0.3, addOnPurchases: 0, daysSinceLastVisit: 65, churnRisk: 'high', churnScore: 72, riskFactors: [], paymentIssues: true, failedPaymentCount: 2, surveysDue: [90], retentionActions: [] },
    { memberId: 'm3', clientId: 'c3', clientName: 'Critical', tier: 'glow', status: 'active', joinDate: '2025-09-01', monthsAsMember: 6, engagementScore: 15, engagementTrend: 'declining', creditUsageRate: 5, visitFrequency: 0.1, addOnPurchases: 0, daysSinceLastVisit: 90, churnRisk: 'critical', churnScore: 88, riskFactors: [], paymentIssues: false, failedPaymentCount: 0, surveysDue: [], retentionActions: [] },
  ];

  it('identifies members above threshold', () => {
    const atRisk = identifyAtRiskMembers(profiles, 50);
    expect(atRisk).toHaveLength(2);
  });

  it('sorts by churn score descending', () => {
    const atRisk = identifyAtRiskMembers(profiles, 50);
    expect(atRisk[0].churnScore).toBeGreaterThanOrEqual(atRisk[1].churnScore);
  });

  it('excludes non-active members', () => {
    const withCancelled = [...profiles, { ...profiles[2], memberId: 'm4', status: 'cancelled' as const, churnScore: 99 }];
    const atRisk = identifyAtRiskMembers(withCancelled, 50);
    expect(atRisk.every(m => m.status === 'active')).toBe(true);
  });
});

// ── Retention Actions ────────────────────────────────────────────────────

describe('generateRetentionActions', () => {
  it('generates actions for high-risk member', () => {
    const profile: MemberRetentionProfile = {
      memberId: 'm1', clientId: 'c1', clientName: 'At Risk', tier: 'halo', status: 'active',
      joinDate: '2025-06-01', monthsAsMember: 9, engagementScore: 25, engagementTrend: 'declining',
      creditUsageRate: 10, visitFrequency: 0.3, addOnPurchases: 0, daysSinceLastVisit: 65,
      churnRisk: 'high', churnScore: 72, riskFactors: [], paymentIssues: true, failedPaymentCount: 2,
      surveysDue: [90], retentionActions: [],
    };
    const actions = generateRetentionActions(profile);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('includes usage reminder for low credit usage', () => {
    const profile: MemberRetentionProfile = {
      memberId: 'm1', clientId: 'c1', clientName: 'Low Usage', tier: 'glow', status: 'active',
      joinDate: '2025-06-01', monthsAsMember: 9, engagementScore: 40, engagementTrend: 'stable',
      creditUsageRate: 15, visitFrequency: 0.8, addOnPurchases: 1, daysSinceLastVisit: 20,
      churnRisk: 'moderate', churnScore: 40, riskFactors: [], paymentIssues: false, failedPaymentCount: 0,
      surveysDue: [], retentionActions: [],
    };
    const actions = generateRetentionActions(profile);
    expect(actions.some(a => a.type === 'usage_reminder')).toBe(true);
  });

  it('sorts actions by priority', () => {
    const profile: MemberRetentionProfile = {
      memberId: 'm1', clientId: 'c1', clientName: 'Multi Issue', tier: 'halo', status: 'active',
      joinDate: '2025-06-01', monthsAsMember: 9, engagementScore: 20, engagementTrend: 'declining',
      creditUsageRate: 5, visitFrequency: 0.2, addOnPurchases: 0, daysSinceLastVisit: 70,
      churnRisk: 'critical', churnScore: 85, riskFactors: [], paymentIssues: true, failedPaymentCount: 2,
      surveysDue: [90], retentionActions: [],
    };
    const actions = generateRetentionActions(profile);
    const priorities = actions.map(a => a.priority);
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < priorities.length; i++) {
      expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
    }
  });
});

// ── Win-Back Campaigns ───────────────────────────────────────────────────

describe('Win-Back Campaigns', () => {
  it('creates campaign with 5 steps', () => {
    const campaign = createWinBackCampaign('m1', 'John', 'glow', '2026-03-01');
    expect(campaign.campaign).toHaveLength(5);
    expect(campaign.status).toBe('active');
  });

  it('steps are in chronological order', () => {
    const campaign = createWinBackCampaign('m1', 'John', 'elite', '2026-03-01');
    for (let i = 1; i < campaign.campaign.length; i++) {
      expect(campaign.campaign[i].dayAfterCancellation).toBeGreaterThanOrEqual(
        campaign.campaign[i - 1].dayAfterCancellation
      );
    }
  });

  it('getNextWinBackStep returns first unsent step', () => {
    const campaign = createWinBackCampaign('m1', 'John', 'glow', new Date(Date.now() - 5 * 86400000).toISOString());
    const step = getNextWinBackStep(campaign);
    expect(step).not.toBeNull();
    expect(step!.step).toBe(1);
  });

  it('returns null for inactive campaign', () => {
    const campaign = createWinBackCampaign('m1', 'John', 'glow', '2026-03-01');
    campaign.status = 'won_back';
    expect(getNextWinBackStep(campaign)).toBeNull();
  });
});

// ── NPS ──────────────────────────────────────────────────────────────────

describe('NPS', () => {
  it('classifies 9-10 as promoter', () => {
    expect(classifyNPS(9)).toBe('promoter');
    expect(classifyNPS(10)).toBe('promoter');
  });

  it('classifies 7-8 as passive', () => {
    expect(classifyNPS(7)).toBe('passive');
    expect(classifyNPS(8)).toBe('passive');
  });

  it('classifies 0-6 as detractor', () => {
    expect(classifyNPS(0)).toBe('detractor');
    expect(classifyNPS(6)).toBe('detractor');
  });

  it('calculates aggregate NPS', () => {
    const entries: NPSEntry[] = [
      { memberId: 'm1', score: 9, category: 'promoter', surveyType: 'milestone', createdAt: '2026-01-01' },
      { memberId: 'm2', score: 10, category: 'promoter', surveyType: 'milestone', createdAt: '2026-01-01' },
      { memberId: 'm3', score: 5, category: 'detractor', surveyType: 'milestone', createdAt: '2026-01-01' },
      { memberId: 'm4', score: 7, category: 'passive', surveyType: 'milestone', createdAt: '2026-01-01' },
    ];
    const nps = calculateAggregateNPS(entries);
    // 2 promoters (50%), 1 detractor (25%) = NPS 25
    expect(nps).toBe(25);
  });

  it('returns 0 for empty entries', () => {
    expect(calculateAggregateNPS([])).toBe(0);
  });

  it('createNPSEntry clamps score', () => {
    const entry = createNPSEntry('m1', 15, 'periodic');
    expect(entry.score).toBe(10);
    const entry2 = createNPSEntry('m1', -5, 'periodic');
    expect(entry2.score).toBe(0);
  });
});

// ── Survey Milestones ────────────────────────────────────────────────────

describe('getSurveysDue', () => {
  it('returns 30-day after 30 days', () => {
    const joinDate = new Date(Date.now() - 35 * 86400000).toISOString();
    const due = getSurveysDue(joinDate, []);
    expect(due).toContain(30);
  });

  it('excludes completed surveys', () => {
    const joinDate = new Date(Date.now() - 100 * 86400000).toISOString();
    const due = getSurveysDue(joinDate, [30]);
    expect(due).not.toContain(30);
    expect(due).toContain(90);
  });

  it('returns empty for new member', () => {
    const joinDate = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(getSurveysDue(joinDate, [])).toHaveLength(0);
  });

  it('returns multiple due surveys', () => {
    const joinDate = new Date(Date.now() - 200 * 86400000).toISOString();
    const due = getSurveysDue(joinDate, []);
    expect(due.length).toBeGreaterThanOrEqual(3);
  });
});

// ── Retention Analytics ──────────────────────────────────────────────────

describe('buildRetentionAnalytics', () => {
  it('returns correct structure', () => {
    const analytics = buildRetentionAnalytics({
      activeMembers: [],
      cancelledMembers: [],
      npsEntries: [],
      memberTiers: {},
      saveOffers: { accepted: 0, total: 0 },
      winBacks: { won: 0, total: 0 },
    });
    expect(analytics).toHaveProperty('overallRetentionRate');
    expect(analytics).toHaveProperty('monthlyChurnRate');
    expect(analytics).toHaveProperty('npsAverage');
    expect(analytics).toHaveProperty('retentionByTier');
    expect(analytics).toHaveProperty('topChurnReasons');
  });

  it('calculates save offer accept rate', () => {
    const analytics = buildRetentionAnalytics({
      activeMembers: [],
      cancelledMembers: [],
      npsEntries: [],
      memberTiers: {},
      saveOffers: { accepted: 3, total: 10 },
      winBacks: { won: 0, total: 0 },
    });
    expect(analytics.saveOfferAcceptRate).toBe(30);
  });

  it('calculates win-back rate', () => {
    const analytics = buildRetentionAnalytics({
      activeMembers: [],
      cancelledMembers: [],
      npsEntries: [],
      memberTiers: {},
      saveOffers: { accepted: 0, total: 0 },
      winBacks: { won: 2, total: 5 },
    });
    expect(analytics.winBackRate).toBe(40);
  });
});
