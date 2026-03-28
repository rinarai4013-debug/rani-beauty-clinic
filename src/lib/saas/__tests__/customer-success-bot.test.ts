import { describe, it, expect } from 'vitest';
import {
  calculateLoginScore,
  calculateFeatureAdoptionScore,
  calculateSupportScore,
  calculateBillingScore,
  calculateDataActivityScore,
  calculateHealthScore,
  detectHealthTrend,
  generateCheckInEmail,
  generateFeatureNudge,
  getUnusedFeatures,
  getUnderusedFeatures,
  checkMilestones,
  assessChurnRisk,
  generateSaveOffer,
  categorizeNPS,
  calculateNPSScore,
  shouldSendNPS,
  checkExpansionTriggers,
  createReferralCode,
  initializeReferralProgram,
  processReferral,
  convertReferral,
  getReferralStats,
  MILESTONES,
  FEATURE_NUDGES,
  type FeatureAdoption,
  type HealthFactors,
  type NPSSurvey,
} from '../customer-success-bot';

// ─── Health Score Factors ─────────────────────────────────────────

describe('Login Score', () => {
  it('scores 0 for no logins', () => {
    const result = calculateLoginScore(0, 0);
    expect(result.score).toBe(0);
  });

  it('scores high for daily logins', () => {
    const result = calculateLoginScore(30, 25);
    expect(result.score).toBe(100);
  });

  it('scores medium for weekly logins', () => {
    const result = calculateLoginScore(8, 8);
    expect(result.score).toBe(50);
  });

  it('includes weight and weighted score', () => {
    const result = calculateLoginScore(10, 10);
    expect(result.weight).toBe(0.3);
    expect(result.weightedScore).toBe(Math.round(result.score * 0.3));
  });
});

describe('Feature Adoption Score', () => {
  it('scores 0 for no features', () => {
    const result = calculateFeatureAdoptionScore([]);
    expect(result.score).toBe(0);
  });

  it('scores based on activation rate', () => {
    const features: FeatureAdoption[] = [
      { featureId: 'ai_chat', name: 'AI Chat', enabled: true, activated: true, usageCount: 50, adoptionScore: 80 },
      { featureId: 'churn_prediction', name: 'Churn', enabled: true, activated: false, usageCount: 0, adoptionScore: 0 },
    ];
    const result = calculateFeatureAdoptionScore(features);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });
});

describe('Support Score', () => {
  it('scores 100 for no issues', () => {
    const result = calculateSupportScore(0, 0, 0);
    expect(result.score).toBe(100);
  });

  it('deducts for open tickets', () => {
    const result = calculateSupportScore(3, 0, 0);
    expect(result.score).toBeLessThan(100);
  });

  it('deducts for high volume', () => {
    const result = calculateSupportScore(0, 6, 0);
    expect(result.score).toBeLessThan(100);
  });

  it('deducts for slow resolution', () => {
    const result = calculateSupportScore(0, 1, 50);
    expect(result.score).toBeLessThan(100);
  });

  it('does not go below 0', () => {
    const result = calculateSupportScore(10, 10, 100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe('Billing Score', () => {
  it('scores 100 for current payments', () => {
    const result = calculateBillingScore(true, 0, 30, false);
    expect(result.score).toBe(100);
  });

  it('deducts for non-current payments', () => {
    const result = calculateBillingScore(false, 0, 30, false);
    expect(result.score).toBeLessThan(100);
  });

  it('deducts heavily for cancel request', () => {
    const result = calculateBillingScore(true, 0, 30, true);
    expect(result.score).toBe(50);
  });
});

describe('Data Activity Score', () => {
  it('scores 0 for no activity', () => {
    const result = calculateDataActivityScore(0, 0, 0);
    expect(result.score).toBe(0);
  });

  it('scores high for active clinic', () => {
    const result = calculateDataActivityScore(150, 60, 25);
    expect(result.score).toBe(100);
  });
});

// ─── Overall Health Score ─────────────────────────────────────────

describe('calculateHealthScore', () => {
  it('returns excellent for high scores', () => {
    const factors = createMockFactors(90);
    const { overall, grade } = calculateHealthScore(factors);
    expect(overall).toBeGreaterThanOrEqual(80);
    expect(grade).toBe('excellent');
  });

  it('returns critical for low scores', () => {
    const factors = createMockFactors(15);
    const { overall, grade } = calculateHealthScore(factors);
    expect(overall).toBeLessThan(40);
    expect(grade).toBe('critical');
  });

  it('returns at_risk for medium scores', () => {
    const factors = createMockFactors(45);
    const { overall, grade } = calculateHealthScore(factors);
    expect(grade).toBe('at_risk');
  });
});

describe('detectHealthTrend', () => {
  it('detects improving trend', () => {
    expect(detectHealthTrend([50, 55, 60, 65, 70, 75, 80, 85])).toBe('improving');
  });

  it('detects declining trend', () => {
    expect(detectHealthTrend([85, 80, 75, 70, 65, 60, 55, 50])).toBe('declining');
  });

  it('detects stable trend', () => {
    expect(detectHealthTrend([70, 72, 71, 70, 71, 72, 71, 70])).toBe('stable');
  });

  it('returns stable for insufficient data', () => {
    expect(detectHealthTrend([70])).toBe('stable');
  });
});

// ─── Check-In Emails ──────────────────────────────────────────────

describe('Check-In Emails', () => {
  it('generates day 7 email', () => {
    const email = generateCheckInEmail('day_7', 'Glow Aesthetics', 'Jane', 75);
    expect(email.type).toBe('day_7');
    expect(email.subject).toContain('Jane');
    expect(email.body).toContain('Glow Aesthetics');
  });

  it('generates day 30 email with health score', () => {
    const email = generateCheckInEmail('day_30', 'Test Clinic', 'Jane', 82);
    expect(email.body).toContain('82');
  });

  it('generates day 90 email with referral mention', () => {
    const email = generateCheckInEmail('day_90', 'Test', 'Jane', 90);
    expect(email.body.toLowerCase()).toContain('refer');
  });

  it('all check-in types have CTA', () => {
    for (const type of ['day_7', 'day_30', 'day_60', 'day_90'] as const) {
      const email = generateCheckInEmail(type, 'Test', 'Jane', 75);
      expect(email.ctaText).toBeTruthy();
      expect(email.ctaUrl).toBeTruthy();
    }
  });
});

// ─── Feature Nudges ───────────────────────────────────────────────

describe('Feature Nudges', () => {
  it('generates nudge for unused feature', () => {
    const nudge = generateFeatureNudge('ai_chat', 'Glow Aesthetics');
    expect(nudge.featureId).toBe('ai_chat');
    expect(nudge.subject).toContain('Glow Aesthetics');
    expect(nudge.benefit).toBeTruthy();
  });

  it('all features have nudge templates', () => {
    for (const featureId of Object.keys(FEATURE_NUDGES)) {
      const nudge = FEATURE_NUDGES[featureId as keyof typeof FEATURE_NUDGES];
      expect(nudge.name).toBeTruthy();
      expect(nudge.benefit).toBeTruthy();
      expect(nudge.ctaText).toBeTruthy();
    }
  });

  it('getUnusedFeatures filters correctly', () => {
    const features: FeatureAdoption[] = [
      { featureId: 'ai_chat', name: 'AI Chat', enabled: true, activated: true, usageCount: 10, adoptionScore: 50 },
      { featureId: 'churn_prediction', name: 'Churn', enabled: true, activated: false, usageCount: 0, adoptionScore: 0 },
      { featureId: 'phone_agent', name: 'Phone', enabled: false, activated: false, usageCount: 0, adoptionScore: 0 },
    ];
    const unused = getUnusedFeatures(features);
    expect(unused).toHaveLength(1);
    expect(unused[0].featureId).toBe('churn_prediction');
  });

  it('getUnderusedFeatures filters by threshold', () => {
    const features: FeatureAdoption[] = [
      { featureId: 'ai_chat', name: 'AI Chat', enabled: true, activated: true, usageCount: 50, adoptionScore: 80 },
      { featureId: 'churn_prediction', name: 'Churn', enabled: true, activated: true, usageCount: 2, adoptionScore: 10 },
    ];
    const underused = getUnderusedFeatures(features, 20);
    expect(underused).toHaveLength(1);
    expect(underused[0].featureId).toBe('churn_prediction');
  });
});

// ─── Milestones ───────────────────────────────────────────────────

describe('Milestones', () => {
  it('detects first login', () => {
    const newMilestones = checkMilestones(
      { appointmentCount: 0, clientCount: 0, totalRevenue: 0, daysSinceSignup: 1, loginCount: 1, teamSize: 1, integrationsConnected: 0, aiInsightsViewed: 0, fiveStarReviews: 0, setupComplete: false },
      []
    );
    expect(newMilestones).toContain('first_login');
  });

  it('detects multiple milestones', () => {
    const newMilestones = checkMilestones(
      { appointmentCount: 150, clientCount: 120, totalRevenue: 15000, daysSinceSignup: 35, loginCount: 30, teamSize: 3, integrationsConnected: 2, aiInsightsViewed: 5, fiveStarReviews: 3, setupComplete: true },
      ['first_login']
    );
    expect(newMilestones).toContain('setup_complete');
    expect(newMilestones).toContain('appointments_100');
    expect(newMilestones).toContain('clients_100');
    expect(newMilestones).toContain('first_month');
    expect(newMilestones).toContain('revenue_10k');
  });

  it('does not re-detect existing milestones', () => {
    const newMilestones = checkMilestones(
      { appointmentCount: 1, clientCount: 0, totalRevenue: 0, daysSinceSignup: 1, loginCount: 1, teamSize: 1, integrationsConnected: 0, aiInsightsViewed: 0, fiveStarReviews: 0, setupComplete: false },
      ['first_login', 'first_appointment']
    );
    expect(newMilestones).not.toContain('first_login');
    expect(newMilestones).not.toContain('first_appointment');
  });

  it('has celebration messages for all milestones', () => {
    for (const milestone of Object.values(MILESTONES)) {
      expect(milestone.celebrationMessage).toBeTruthy();
    }
  });
});

// ─── Churn Risk ───────────────────────────────────────────────────

describe('Churn Risk', () => {
  it('returns low risk for healthy account', () => {
    const risk = assessChurnRisk(85, {
      loginDecline: 0,
      supportComplaints: 0,
      failedPayments: 0,
      daysWithoutLogin: 2,
      cancelPageVisits: 0,
      downgradedRecently: false,
    });
    expect(risk.riskLevel).toBe('low');
    expect(risk.riskScore).toBeLessThan(25);
  });

  it('returns critical risk for inactive account', () => {
    const risk = assessChurnRisk(20, {
      loginDecline: 70,
      supportComplaints: 5,
      failedPayments: 2,
      daysWithoutLogin: 35,
      cancelPageVisits: 2,
      downgradedRecently: true,
      npsScore: 2,
    });
    expect(risk.riskLevel).toBe('critical');
    expect(risk.riskScore).toBeGreaterThan(75);
  });

  it('detects cancel intent', () => {
    const risk = assessChurnRisk(70, {
      loginDecline: 0,
      supportComplaints: 0,
      failedPayments: 0,
      daysWithoutLogin: 5,
      cancelPageVisits: 3,
      downgradedRecently: false,
    });
    expect(risk.signals.some((s) => s.type === 'cancel_intent')).toBe(true);
  });

  it('provides recommended action', () => {
    const risk = assessChurnRisk(30, {
      loginDecline: 50,
      supportComplaints: 3,
      failedPayments: 1,
      daysWithoutLogin: 20,
      cancelPageVisits: 0,
      downgradedRecently: false,
    });
    expect(risk.recommendedAction).toBeTruthy();
  });
});

// ─── Save Offers ──────────────────────────────────────────────────

describe('Save Offers', () => {
  it('generates offers for critical risk', () => {
    const offers = generateSaveOffer('tn_1', 'critical', 'professional');
    expect(offers.length).toBeGreaterThan(2);
    expect(offers.some((o) => o.type === 'free_month')).toBe(true);
    expect(offers.some((o) => o.type === 'discount')).toBe(true);
  });

  it('generates fewer offers for high risk', () => {
    const offers = generateSaveOffer('tn_1', 'high', 'professional');
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.some((o) => o.type === 'free_month')).toBe(true);
  });

  it('does not offer downgrade for starter', () => {
    const offers = generateSaveOffer('tn_1', 'high', 'starter');
    expect(offers.every((o) => o.type !== 'downgrade')).toBe(true);
  });

  it('offers have expiration dates', () => {
    const offers = generateSaveOffer('tn_1', 'critical', 'professional');
    for (const offer of offers) {
      expect(offer.expiresAt).toBeTruthy();
      expect(new Date(offer.expiresAt).getTime()).toBeGreaterThan(Date.now());
    }
  });
});

// ─── NPS ──────────────────────────────────────────────────────────

describe('NPS', () => {
  it('categorizes promoters (9-10)', () => {
    expect(categorizeNPS(9)).toBe('promoter');
    expect(categorizeNPS(10)).toBe('promoter');
  });

  it('categorizes passives (7-8)', () => {
    expect(categorizeNPS(7)).toBe('passive');
    expect(categorizeNPS(8)).toBe('passive');
  });

  it('categorizes detractors (0-6)', () => {
    expect(categorizeNPS(0)).toBe('detractor');
    expect(categorizeNPS(6)).toBe('detractor');
  });

  it('calculates NPS score', () => {
    const surveys: NPSSurvey[] = [
      { tenantId: '1', type: 'day_30', score: 10, sentAt: '', respondedAt: '', followUpSent: false },
      { tenantId: '2', type: 'day_30', score: 9, sentAt: '', respondedAt: '', followUpSent: false },
      { tenantId: '3', type: 'day_30', score: 7, sentAt: '', respondedAt: '', followUpSent: false },
      { tenantId: '4', type: 'day_30', score: 3, sentAt: '', respondedAt: '', followUpSent: false },
    ];
    const nps = calculateNPSScore(surveys);
    // 2 promoters, 1 passive, 1 detractor = (2-1)/4 * 100 = 25
    expect(nps).toBe(25);
  });

  it('returns 0 for no responses', () => {
    expect(calculateNPSScore([])).toBe(0);
  });

  it('shouldSendNPS returns correct type', () => {
    expect(shouldSendNPS(35, [])).toBe('day_30');
    expect(shouldSendNPS(95, [{ tenantId: '', type: 'day_30', sentAt: '', followUpSent: false }])).toBe('day_90');
    expect(shouldSendNPS(15, [])).toBeNull();
  });
});

// ─── Expansion Triggers ───────────────────────────────────────────

describe('Expansion Triggers', () => {
  it('detects approaching limits', () => {
    const triggers = checkExpansionTriggers('tn_1', 'starter', {
      aiCalls: { used: 450, limit: 500 },
      smsCredits: { used: 50, limit: 200 },
      providers: { used: 2, limit: 2 },
      storageGB: { used: 1, limit: 5 },
    }, 'monthly');
    expect(triggers.some((t) => t.metric === 'aiCalls')).toBe(true);
    expect(triggers.some((t) => t.metric === 'providers')).toBe(true);
  });

  it('suggests annual switch for monthly billing', () => {
    const triggers = checkExpansionTriggers('tn_1', 'starter', {
      aiCalls: { used: 0, limit: 500 },
      smsCredits: { used: 0, limit: 200 },
      providers: { used: 1, limit: 2 },
      storageGB: { used: 0, limit: 5 },
    }, 'monthly');
    expect(triggers.some((t) => t.suggestedAction === 'annual_switch')).toBe(true);
  });
});

// ─── Referral Program ─────────────────────────────────────────────

describe('Referral Program', () => {
  it('creates referral code', () => {
    const code = createReferralCode('tn_abc123', 'Glow Aesthetics');
    expect(code).toMatch(/^REF-/);
    expect(code.length).toBeGreaterThan(5);
  });

  it('initializes program', () => {
    const program = initializeReferralProgram('tn_1', 'Glow');
    expect(program.referralCode).toBeTruthy();
    expect(program.referralsCount).toBe(0);
    expect(program.creditsEarned).toBe(0);
  });

  it('processes referral', () => {
    let program = initializeReferralProgram('tn_1', 'Glow');
    program = processReferral(program, 'New Clinic', 'new@clinic.com');
    expect(program.referralsCount).toBe(1);
    expect(program.referrals).toHaveLength(1);
    expect(program.referrals[0].status).toBe('pending');
  });

  it('converts referral and awards credit', () => {
    let program = initializeReferralProgram('tn_1', 'Glow');
    program = processReferral(program, 'New Clinic', 'new@clinic.com');
    program = convertReferral(program, 'new@clinic.com');
    expect(program.successfulReferrals).toBe(1);
    expect(program.creditsEarned).toBe(1);
    expect(program.referrals[0].status).toBe('paid');
    expect(program.referrals[0].creditAwarded).toBe(true);
  });

  it('getReferralStats returns correct data', () => {
    let program = initializeReferralProgram('tn_1', 'Glow');
    program = processReferral(program, 'Clinic A', 'a@test.com');
    program = processReferral(program, 'Clinic B', 'b@test.com');
    program = convertReferral(program, 'a@test.com');

    const stats = getReferralStats(program);
    expect(stats.totalReferrals).toBe(2);
    expect(stats.successfulReferrals).toBe(1);
    expect(stats.conversionRate).toBe(50);
    expect(stats.creditsAvailable).toBe(1);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────

function createMockFactors(baseScore: number): HealthFactors {
  return {
    loginFrequency: { name: 'Login', score: baseScore, weight: 0.3, weightedScore: Math.round(baseScore * 0.3), details: '' },
    featureAdoption: { name: 'Features', score: baseScore, weight: 0.25, weightedScore: Math.round(baseScore * 0.25), details: '' },
    supportTickets: { name: 'Support', score: baseScore, weight: 0.15, weightedScore: Math.round(baseScore * 0.15), details: '' },
    billingHealth: { name: 'Billing', score: baseScore, weight: 0.2, weightedScore: Math.round(baseScore * 0.2), details: '' },
    dataActivity: { name: 'Data', score: baseScore, weight: 0.1, weightedScore: Math.round(baseScore * 0.1), details: '' },
  };
}
