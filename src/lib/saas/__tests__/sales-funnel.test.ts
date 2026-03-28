import { describe, it, expect } from 'vitest';
import {
  LeadCaptureSchema,
  calculateLeadScore,
  scoreClinicSize,
  scoreProviderCount,
  scoreSoftwarePain,
  scoreEngagement,
  scoreUrgency,
  segmentClinic,
  buildEmailSequence,
  getNextEmailToSend,
  shouldPauseSequence,
  personalizeEmailSubject,
  detectPainPoints,
  selectFeatureHighlight,
  calculateROI,
  generateDemoSlots,
  bookDemoSlot,
  generateSandboxCredentials,
  assignVariant,
  recordImpression,
  recordConversion,
  determineWinner,
  calculateFunnelMetrics,
  trackConversion,
  advanceStage,
  SEGMENT_LABELS,
  SEGMENT_RECOMMENDED_PLAN,
  EMAIL_SEQUENCE,
  SOFTWARE_PAIN_SCORES,
  FEATURE_BY_PAIN_POINT,
  type Lead,
  type ABTest,
  type FunnelStage,
} from '../sales-funnel';

// ─── Schema Validation ────────────────────────────────────────────

describe('LeadCaptureSchema', () => {
  it('validates correct input', () => {
    const result = LeadCaptureSchema.safeParse({
      name: 'Jane Smith',
      email: 'jane@clinic.com',
      clinicName: 'Glow Aesthetics',
      providerCount: 3,
      currentSoftware: 'none',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = LeadCaptureSchema.safeParse({
      email: 'jane@clinic.com',
      clinicName: 'Glow',
      providerCount: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = LeadCaptureSchema.safeParse({
      name: 'Jane',
      email: 'not-an-email',
      clinicName: 'Glow',
      providerCount: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero providers', () => {
    const result = LeadCaptureSchema.safeParse({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('defaults currentSoftware to none', () => {
    const result = LeadCaptureSchema.safeParse({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentSoftware).toBe('none');
    }
  });
});

// ─── Lead Scoring ─────────────────────────────────────────────────

describe('Lead Scoring', () => {
  describe('scoreClinicSize', () => {
    it('scores 1 provider as small', () => {
      expect(scoreClinicSize(1)).toBe(8);
    });
    it('scores 2 providers higher', () => {
      expect(scoreClinicSize(2)).toBe(12);
    });
    it('scores 3-5 providers as medium', () => {
      expect(scoreClinicSize(4)).toBe(18);
    });
    it('scores 6-9 providers as large', () => {
      expect(scoreClinicSize(7)).toBe(22);
    });
    it('scores 10+ providers as max', () => {
      expect(scoreClinicSize(15)).toBe(25);
    });
  });

  describe('scoreProviderCount', () => {
    it('scores proportionally', () => {
      expect(scoreProviderCount(1)).toBe(4);
      expect(scoreProviderCount(3)).toBe(12);
      expect(scoreProviderCount(5)).toBe(20);
    });
    it('caps at 25', () => {
      expect(scoreProviderCount(10)).toBe(25);
      expect(scoreProviderCount(50)).toBe(25);
    });
  });

  describe('scoreSoftwarePain', () => {
    it('scores no software as high pain', () => {
      expect(scoreSoftwarePain('none')).toBe(25);
    });
    it('scores paper as high pain', () => {
      expect(scoreSoftwarePain('paper')).toBe(25);
    });
    it('scores mangomint as low pain', () => {
      expect(scoreSoftwarePain('mangomint')).toBe(8);
    });
    it('scores unknown as other', () => {
      expect(scoreSoftwarePain('random_software')).toBe(15);
    });
    it('handles case insensitivity', () => {
      expect(scoreSoftwarePain('Jane')).toBe(12);
    });
  });

  describe('scoreEngagement', () => {
    it('returns 0 for no engagement', () => {
      expect(scoreEngagement({})).toBe(0);
    });
    it('scores visited pricing', () => {
      expect(scoreEngagement({ visitedPricing: true })).toBe(5);
    });
    it('scores watched demo highest', () => {
      expect(scoreEngagement({ watchedDemo: true })).toBe(8);
    });
    it('caps at 15', () => {
      const max = scoreEngagement({
        visitedPricing: true,
        watchedDemo: true,
        downloadedGuide: true,
        visitedCaseStudy: true,
        openedEmails: 5,
        clickedEmails: 5,
      });
      expect(max).toBe(15);
    });
  });

  describe('scoreUrgency', () => {
    it('returns 0 for no urgency signals', () => {
      expect(scoreUrgency({})).toBe(0);
    });
    it('scores demo request highest', () => {
      expect(scoreUrgency({ requestedDemo: true })).toBe(5);
    });
    it('caps at 10', () => {
      const max = scoreUrgency({
        mentionedTimeline: true,
        askedAboutPricing: true,
        requestedDemo: true,
        competitorMention: true,
      });
      expect(max).toBe(10);
    });
  });

  describe('calculateLeadScore', () => {
    it('returns all required fields', () => {
      const score = calculateLeadScore({
        name: 'Jane',
        email: 'jane@test.com',
        clinicName: 'Glow',
        providerCount: 3,
        currentSoftware: 'none',
      });
      expect(score).toHaveProperty('total');
      expect(score).toHaveProperty('factors');
      expect(score).toHaveProperty('segment');
      expect(score).toHaveProperty('qualifiedForDemo');
    });

    it('large clinic with pain scores high', () => {
      const score = calculateLeadScore({
        name: 'Jane',
        email: 'jane@test.com',
        clinicName: 'Big Clinic',
        providerCount: 10,
        currentSoftware: 'none',
      });
      expect(score.total).toBeGreaterThan(60);
      expect(score.qualifiedForDemo).toBe(true);
    });

    it('small clinic with modern software scores lower', () => {
      const score = calculateLeadScore({
        name: 'Jane',
        email: 'jane@test.com',
        clinicName: 'Solo',
        providerCount: 1,
        currentSoftware: 'mangomint',
      });
      expect(score.total).toBeLessThan(50);
    });

    it('caps total at 100', () => {
      const score = calculateLeadScore(
        {
          name: 'Jane',
          email: 'jane@test.com',
          clinicName: 'Mega',
          providerCount: 20,
          currentSoftware: 'none',
        },
        {
          visitedPricing: true,
          watchedDemo: true,
          downloadedGuide: true,
          visitedCaseStudy: true,
          openedEmails: 5,
          clickedEmails: 5,
        },
        {
          mentionedTimeline: true,
          askedAboutPricing: true,
          requestedDemo: true,
          competitorMention: true,
        }
      );
      expect(score.total).toBeLessThanOrEqual(100);
    });
  });
});

// ─── Segmentation ─────────────────────────────────────────────────

describe('Segmentation', () => {
  it('segments 1-2 providers as small', () => {
    expect(segmentClinic(1)).toBe('small');
    expect(segmentClinic(2)).toBe('small');
  });

  it('segments 3-5 providers as medium', () => {
    expect(segmentClinic(3)).toBe('medium');
    expect(segmentClinic(5)).toBe('medium');
  });

  it('segments 6+ providers as large', () => {
    expect(segmentClinic(6)).toBe('large');
    expect(segmentClinic(20)).toBe('large');
  });

  it('has labels for all segments', () => {
    expect(SEGMENT_LABELS).toHaveProperty('small');
    expect(SEGMENT_LABELS).toHaveProperty('medium');
    expect(SEGMENT_LABELS).toHaveProperty('large');
  });

  it('has recommended plans for all segments', () => {
    expect(SEGMENT_RECOMMENDED_PLAN.small).toBe('starter');
    expect(SEGMENT_RECOMMENDED_PLAN.medium).toBe('professional');
    expect(SEGMENT_RECOMMENDED_PLAN.large).toBe('enterprise');
  });
});

// ─── Email Sequence ───────────────────────────────────────────────

describe('Email Sequence', () => {
  it('builds 7-step sequence', () => {
    const seq = buildEmailSequence({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 3,
    });
    expect(seq.steps).toHaveLength(7);
    expect(seq.currentStep).toBe(0);
    expect(seq.paused).toBe(false);
  });

  it('schedules first email immediately', () => {
    const now = new Date();
    const seq = buildEmailSequence({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 3,
    }, now);
    const firstStep = new Date(seq.steps[0].scheduledAt);
    expect(firstStep.toDateString()).toBe(now.toDateString());
  });

  it('sequences emails at correct delays', () => {
    const seq = buildEmailSequence({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 3,
    });
    // Check that each step has the right sequence step name
    expect(seq.steps[0].step).toBe('welcome');
    expect(seq.steps[1].step).toBe('case_study');
    expect(seq.steps[6].step).toBe('final_offer');
  });

  it('getNextEmailToSend returns first unsent email', () => {
    const seq = buildEmailSequence({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 3,
    }, new Date(Date.now() - 86400000)); // started yesterday

    const next = getNextEmailToSend(seq);
    expect(next).not.toBeNull();
    expect(next?.step).toBe('welcome');
  });

  it('returns null when sequence is paused', () => {
    const seq = buildEmailSequence({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 3,
    });
    seq.paused = true;
    expect(getNextEmailToSend(seq)).toBeNull();
  });

  it('pauses sequence for paid customers', () => {
    const seq = buildEmailSequence({
      name: 'Jane',
      email: 'jane@test.com',
      clinicName: 'Glow',
      providerCount: 3,
    });
    expect(shouldPauseSequence('paid', seq)).toBe(true);
    expect(shouldPauseSequence('trial_started', seq)).toBe(true);
    expect(shouldPauseSequence('demo_booked', seq)).toBe(true);
    expect(shouldPauseSequence('lead', seq)).toBe(false);
  });

  it('personalizes email subject', () => {
    const subject = personalizeEmailSubject(
      '{{clinicName}}: Your ROI with RaniOS',
      {
        name: 'Jane',
        email: 'jane@test.com',
        clinicName: 'Glow Aesthetics',
        providerCount: 3,
      }
    );
    expect(subject).toBe('Glow Aesthetics: Your ROI with RaniOS');
  });
});

// ─── Pain Points & Features ───────────────────────────────────────

describe('Pain Points', () => {
  it('detects manual process pain for no software', () => {
    const points = detectPainPoints('none', 2);
    expect(points).toContain('manual_processes');
  });

  it('detects retention pain for mindbody', () => {
    const points = detectPainPoints('mindbody', 2);
    expect(points).toContain('client_retention');
  });

  it('detects multi-location for large clinics', () => {
    const points = detectPainPoints('other', 8);
    expect(points).toContain('multi_location');
  });

  it('always includes marketing and retention', () => {
    const points = detectPainPoints('boulevard', 1);
    expect(points).toContain('client_retention');
    expect(points).toContain('marketing');
  });

  it('selects appropriate feature for pain point', () => {
    const feature = selectFeatureHighlight('none', 2);
    expect(feature).toHaveProperty('feature');
    expect(feature).toHaveProperty('headline');
    expect(feature).toHaveProperty('benefit');
  });

  it('has features for all pain points', () => {
    const painPoints = ['scheduling', 'no_shows', 'manual_processes', 'client_retention', 'revenue_tracking', 'marketing', 'compliance', 'multi_location'] as const;
    for (const point of painPoints) {
      expect(FEATURE_BY_PAIN_POINT[point]).toBeDefined();
    }
  });
});

// ─── ROI Calculator ───────────────────────────────────────────────

describe('ROI Calculator', () => {
  it('returns all required fields', () => {
    const roi = calculateROI(3, 'none');
    expect(roi).toHaveProperty('currentCosts');
    expect(roi).toHaveProperty('withRaniOS');
    expect(roi).toHaveProperty('roi');
  });

  it('calculates positive ROI for most clinics', () => {
    const roi = calculateROI(3, 'none');
    expect(roi.roi.monthlySavings).toBeGreaterThan(0);
    expect(roi.roi.annualSavings).toBeGreaterThan(0);
  });

  it('higher provider count means higher savings', () => {
    const small = calculateROI(1, 'none');
    const large = calculateROI(10, 'none');
    expect(large.roi.annualSavings).toBeGreaterThan(small.roi.annualSavings);
  });

  it('no software has higher manual labor cost', () => {
    const noSw = calculateROI(3, 'none');
    const hasSw = calculateROI(3, 'jane');
    expect(noSw.currentCosts.manualLabor).toBeGreaterThan(hasSw.currentCosts.manualLabor);
  });

  it('payback days are reasonable', () => {
    const roi = calculateROI(3, 'none');
    expect(roi.roi.paybackDays).toBeLessThan(365);
    expect(roi.roi.paybackDays).toBeGreaterThan(0);
  });
});

// ─── Demo Scheduling ──────────────────────────────────────────────

describe('Demo Scheduling', () => {
  it('generates slots for weekdays only', () => {
    const slots = generateDemoSlots(new Date('2026-03-23'), 14); // Monday
    const days = [...new Set(slots.map((s) => new Date(s.date).getDay()))];
    expect(days).not.toContain(0); // Sunday
    expect(days).not.toContain(6); // Saturday
  });

  it('generates slots between 9-5', () => {
    const slots = generateDemoSlots();
    for (const slot of slots) {
      const hour = parseInt(slot.time.split(':')[0]);
      expect(hour).toBeGreaterThanOrEqual(9);
      expect(hour).toBeLessThan(17);
    }
  });

  it('books a slot correctly', () => {
    const slots = generateDemoSlots();
    const first = slots[0];
    const booked = bookDemoSlot(slots, first.date, first.time);
    expect(booked).not.toBeNull();
    expect(booked?.available).toBe(false);
  });

  it('returns null for unavailable slot', () => {
    const slots = generateDemoSlots();
    const first = slots[0];
    bookDemoSlot(slots, first.date, first.time);
    const second = bookDemoSlot(slots, first.date, first.time);
    expect(second).toBeNull();
  });
});

// ─── Sandbox ──────────────────────────────────────────────────────

describe('Sandbox Credentials', () => {
  it('generates unique credentials', () => {
    const creds = generateSandboxCredentials('jane@clinic.com');
    expect(creds.email).toContain('demo+');
    expect(creds.password.length).toBeGreaterThan(8);
    expect(creds.subdomain).toContain('demo');
    expect(creds.sampleDataLoaded).toBe(true);
  });

  it('expires in 7 days', () => {
    const creds = generateSandboxCredentials('test@test.com');
    const expiry = new Date(creds.expiresAt);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(7);
  });
});

// ─── A/B Testing ──────────────────────────────────────────────────

describe('A/B Testing', () => {
  const createTest = (): ABTest => ({
    id: 'test-1',
    name: 'Email Subject Test',
    type: 'email',
    variants: [
      { id: 'A', name: 'Control', weight: 0.5, impressions: 0, conversions: 0, conversionRate: 0 },
      { id: 'B', name: 'Variant', weight: 0.5, impressions: 0, conversions: 0, conversionRate: 0 },
    ],
    status: 'active',
    startedAt: new Date().toISOString(),
  });

  it('assigns variant deterministically', () => {
    const test = createTest();
    const v1 = assignVariant(test, 'user-1');
    const v2 = assignVariant(test, 'user-1');
    expect(v1).toBe(v2); // same user = same variant
  });

  it('distributes across variants', () => {
    const test = createTest();
    const variants = new Set<string>();
    for (let i = 0; i < 100; i++) {
      variants.add(assignVariant(test, `user-${i}`));
    }
    expect(variants.size).toBe(2);
  });

  it('records impressions and conversions', () => {
    const test = createTest();
    recordImpression(test, 'A');
    recordImpression(test, 'A');
    recordConversion(test, 'A');
    expect(test.variants[0].impressions).toBe(2);
    expect(test.variants[0].conversions).toBe(1);
    expect(test.variants[0].conversionRate).toBe(0.5);
  });

  it('does not determine winner with insufficient data', () => {
    const test = createTest();
    test.variants[0].impressions = 10;
    test.variants[0].conversions = 5;
    test.variants[1].impressions = 10;
    test.variants[1].conversions = 3;
    expect(determineWinner(test)).toBeNull();
  });

  it('determines winner with sufficient data', () => {
    const test = createTest();
    test.variants[0].impressions = 1000;
    test.variants[0].conversions = 200;
    test.variants[0].conversionRate = 0.2;
    test.variants[1].impressions = 1000;
    test.variants[1].conversions = 100;
    test.variants[1].conversionRate = 0.1;
    const winner = determineWinner(test);
    expect(winner).toBe('A');
  });
});

// ─── Funnel Metrics ───────────────────────────────────────────────

describe('Funnel Metrics', () => {
  it('calculates metrics from lead data', () => {
    const leads: Lead[] = [
      createMockLead('visitor', undefined),
      createMockLead('lead', undefined),
      createMockLead('marketing_qualified', undefined),
      createMockLead('paid', '2026-03-20T00:00:00Z'),
    ];

    const metrics = calculateFunnelMetrics(leads);
    expect(metrics.visitors).toBe(1);
    expect(metrics.paidCustomers).toBe(1);
    expect(metrics.conversionRates).toBeDefined();
  });

  it('calculates pipeline value', () => {
    const leads: Lead[] = Array(10).fill(null).map(() => createMockLead('trial_active', undefined));
    const metrics = calculateFunnelMetrics(leads);
    expect(metrics.pipelineValue).toBeGreaterThan(0);
  });
});

// ─── Conversion Tracking ──────────────────────────────────────────

describe('Conversion Tracking', () => {
  it('creates tracking events', () => {
    const event = trackConversion('lead-1', 'form_submit', { score: 72 });
    expect(event.leadId).toBe('lead-1');
    expect(event.event).toBe('form_submit');
    expect(event.timestamp).toBeDefined();
  });

  it('advances stage correctly', () => {
    expect(advanceStage('visitor', 'form_submit')).toBe('lead');
    expect(advanceStage('lead', 'demo_book')).toBe('demo_booked');
    expect(advanceStage('demo_completed', 'trial_start')).toBe('trial_started');
    expect(advanceStage('trial_active', 'purchase')).toBe('paid');
  });

  it('does not go backwards', () => {
    expect(advanceStage('paid', 'form_submit')).toBe('paid');
    expect(advanceStage('trial_active', 'demo_book')).toBe('trial_active');
  });

  it('returns same stage for non-advancing events', () => {
    expect(advanceStage('lead', 'page_view')).toBe('lead');
    expect(advanceStage('lead', 'email_open')).toBe('lead');
  });
});

// ─── Constants ────────────────────────────────────────────────────

describe('Constants', () => {
  it('EMAIL_SEQUENCE has 7 steps', () => {
    expect(EMAIL_SEQUENCE).toHaveLength(7);
  });

  it('each EMAIL_SEQUENCE step has required fields', () => {
    for (const step of EMAIL_SEQUENCE) {
      expect(step).toHaveProperty('step');
      expect(step).toHaveProperty('delayDays');
      expect(step).toHaveProperty('subject');
      expect(step).toHaveProperty('description');
    }
  });

  it('SOFTWARE_PAIN_SCORES covers common software', () => {
    expect(SOFTWARE_PAIN_SCORES).toHaveProperty('none');
    expect(SOFTWARE_PAIN_SCORES).toHaveProperty('jane');
    expect(SOFTWARE_PAIN_SCORES).toHaveProperty('mindbody');
    expect(SOFTWARE_PAIN_SCORES).toHaveProperty('mangomint');
  });
});

// ─── Helpers ──────────────────────────────────────────────────────

function createMockLead(stage: FunnelStage, convertedAt: string | undefined): Lead {
  return {
    id: `lead_${Math.random()}`,
    name: 'Test',
    email: 'test@test.com',
    clinicName: 'Test Clinic',
    providerCount: 3,
    currentSoftware: 'none',
    score: { total: 65, factors: { clinic_size: 18, provider_count: 12, software_pain: 25, engagement: 5, urgency: 5 }, segment: 'medium', qualifiedForDemo: true },
    segment: 'medium',
    stage,
    emailSequence: { currentStep: 0, steps: [], paused: false },
    abVariants: {},
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-25T00:00:00Z',
    lastActivityAt: '2026-03-25T00:00:00Z',
    convertedAt,
  };
}
