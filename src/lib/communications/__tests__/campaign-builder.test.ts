/**
 * Campaign Builder Tests
 * Tests for campaign CRUD, audience segmentation, A/B testing,
 * revenue attribution, CAN-SPAM compliance, and unsubscribe management.
 */

import {
  createCampaign,
  getCampaign,
  getAllCampaigns,
  updateCampaign,
  updateCampaignStatus,
  duplicateCampaign,
  deleteCampaign,
  evaluateCondition,
  evaluateGroup,
  evaluateAudienceFilter,
  segmentAudience,
  splitAudience,
  determineABWinner,
  createEmptyMetrics,
  calculateMetricRates,
  updateCampaignMetrics,
  attributeRevenue,
  unsubscribeClient,
  resubscribeClient,
  isUnsubscribed,
  getUnsubscribedClients,
  validateCANSPAM,
  createDripSequence,
  getCampaignTypeDefaults,
  getSpendTier,
} from '../campaign-builder';
import type {
  Campaign,
  CampaignMetrics,
  SegmentCondition,
  SegmentGroup,
  AudienceFilter,
} from '@/types/communications';

// ── Helper: Client Record ────────────────────────────────────────────

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+12065551234',
    status: 'active',
    treatmentHistory: ['HydraFacial', 'Botox'],
    totalSpend: 3500,
    visitCount: 8,
    daysSinceLastVisit: 15,
    membershipStatus: 'active' as const,
    age: 35,
    gender: 'female',
    zipCode: '98056',
    lastService: 'HydraFacial',
    smsOptIn: true,
    emailOptIn: true,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('Campaign Builder', () => {
  // ── Campaign CRUD ──────────────────────────────────────────────

  describe('Campaign CRUD', () => {
    test('creates a campaign with correct defaults', () => {
      const campaign = createCampaign({
        name: 'Spring Renewal',
        type: 'promotional',
        channel: 'both',
        body: 'Hello {{clientName}}!',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Rina',
      });

      expect(campaign.id).toMatch(/^camp_/);
      expect(campaign.name).toBe('Spring Renewal');
      expect(campaign.type).toBe('promotional');
      expect(campaign.status).toBe('draft');
      expect(campaign.metrics.totalSent).toBe(0);
    });

    test('creates a scheduled campaign', () => {
      const campaign = createCampaign({
        name: 'Scheduled Test',
        type: 'educational',
        channel: 'email',
        body: 'Content here',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        scheduledAt: '2026-04-01T10:00:00Z',
        createdBy: 'Rina',
      });

      expect(campaign.status).toBe('scheduled');
      expect(campaign.scheduledAt).toBe('2026-04-01T10:00:00Z');
    });

    test('retrieves campaign by ID', () => {
      const created = createCampaign({
        name: 'Get by ID Test',
        type: 'reactivation',
        channel: 'sms',
        body: 'Test body',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const found = getCampaign(created.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Get by ID Test');
    });

    test('returns null for non-existent campaign', () => {
      const found = getCampaign('nonexistent_id');
      expect(found).toBeNull();
    });

    test('lists all campaigns sorted by creation date', () => {
      const campaigns = getAllCampaigns();
      expect(Array.isArray(campaigns)).toBe(true);

      if (campaigns.length > 1) {
        const first = new Date(campaigns[0].createdAt).getTime();
        const second = new Date(campaigns[1].createdAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });

    test('updates campaign fields', () => {
      const campaign = createCampaign({
        name: 'Update Test',
        type: 'promotional',
        channel: 'sms',
        body: 'Original body',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const updated = updateCampaign(campaign.id, {
        name: 'Updated Name',
        body: 'New body content',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.body).toBe('New body content');
      expect(updated?.id).toBe(campaign.id); // ID unchanged
    });

    test('updates campaign status', () => {
      const campaign = createCampaign({
        name: 'Status Test',
        type: 'event',
        channel: 'email',
        body: 'Event content',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const updated = updateCampaignStatus(campaign.id, 'sending');
      expect(updated?.status).toBe('sending');
    });

    test('duplicates a campaign', () => {
      const original = createCampaign({
        name: 'Original Campaign',
        type: 'birthday',
        channel: 'both',
        body: 'Happy Birthday!',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const duplicate = duplicateCampaign(original.id);
      expect(duplicate).not.toBeNull();
      expect(duplicate?.name).toBe('Original Campaign (Copy)');
      expect(duplicate?.id).not.toBe(original.id);
      expect(duplicate?.status).toBe('draft');
    });

    test('duplicates with custom name', () => {
      const original = createCampaign({
        name: 'Source Campaign',
        type: 'seasonal',
        channel: 'sms',
        body: 'Seasonal content',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const duplicate = duplicateCampaign(original.id, 'My Custom Copy');
      expect(duplicate?.name).toBe('My Custom Copy');
    });

    test('deletes a campaign', () => {
      const campaign = createCampaign({
        name: 'Delete Me',
        type: 'promotional',
        channel: 'sms',
        body: 'To be deleted',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const deleted = deleteCampaign(campaign.id);
      expect(deleted).toBe(true);

      const found = getCampaign(campaign.id);
      expect(found).toBeNull();
    });
  });

  // ── Audience Segmentation ──────────────────────────────────────

  describe('Audience Segmentation', () => {
    test('evaluates equals condition', () => {
      const client = makeClient({ membershipStatus: 'active' });
      const condition: SegmentCondition = {
        id: 'c1', field: 'membership_status', operator: 'equals', value: 'active',
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates not_equals condition', () => {
      const client = makeClient({ membershipStatus: 'active' });
      const condition: SegmentCondition = {
        id: 'c1', field: 'membership_status', operator: 'not_equals', value: 'cancelled',
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates greater_than condition', () => {
      const client = makeClient({ totalSpend: 5000 });
      const condition: SegmentCondition = {
        id: 'c1', field: 'total_spend', operator: 'greater_than', value: 2000,
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates less_than condition', () => {
      const client = makeClient({ daysSinceLastVisit: 10 });
      const condition: SegmentCondition = {
        id: 'c1', field: 'days_since_last_visit', operator: 'less_than', value: 30,
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates between condition', () => {
      const client = makeClient({ age: 35 });
      const condition: SegmentCondition = {
        id: 'c1', field: 'age', operator: 'between', value: 25, secondValue: 45,
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates contains condition on array', () => {
      const client = makeClient({ treatmentHistory: ['HydraFacial', 'Botox'] });
      const condition: SegmentCondition = {
        id: 'c1', field: 'treatment_history', operator: 'contains', value: 'Botox',
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates is_true condition', () => {
      const client = makeClient({ smsOptIn: true });
      const condition: SegmentCondition = {
        id: 'c1', field: 'sms_opt_in', operator: 'is_true', value: true,
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates is_false condition', () => {
      const client = makeClient({ emailOptIn: false });
      const condition: SegmentCondition = {
        id: 'c1', field: 'email_opt_in', operator: 'is_false', value: false,
      };
      expect(evaluateCondition(client, condition)).toBe(true);
    });

    test('evaluates AND group logic', () => {
      const client = makeClient({ totalSpend: 5000, membershipStatus: 'active' });
      const group: SegmentGroup = {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'total_spend', operator: 'greater_than', value: 2000 },
          { id: 'c2', field: 'membership_status', operator: 'equals', value: 'active' },
        ],
      };
      expect(evaluateGroup(client, group)).toBe(true);
    });

    test('evaluates OR group logic', () => {
      const client = makeClient({ totalSpend: 1000, membershipStatus: 'active' });
      const group: SegmentGroup = {
        id: 'g1',
        logic: 'OR',
        conditions: [
          { id: 'c1', field: 'total_spend', operator: 'greater_than', value: 5000 },
          { id: 'c2', field: 'membership_status', operator: 'equals', value: 'active' },
        ],
      };
      expect(evaluateGroup(client, group)).toBe(true);
    });

    test('AND group fails when one condition false', () => {
      const client = makeClient({ totalSpend: 500, membershipStatus: 'active' });
      const group: SegmentGroup = {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'total_spend', operator: 'greater_than', value: 2000 },
          { id: 'c2', field: 'membership_status', operator: 'equals', value: 'active' },
        ],
      };
      expect(evaluateGroup(client, group)).toBe(false);
    });

    test('segments audience correctly', () => {
      const clients = [
        makeClient({ id: 'c1', totalSpend: 5000 }),
        makeClient({ id: 'c2', totalSpend: 500 }),
        makeClient({ id: 'c3', totalSpend: 8000 }),
      ];

      const filter: AudienceFilter = {
        groups: [{
          id: 'g1',
          logic: 'AND',
          conditions: [
            { id: 'c1', field: 'total_spend', operator: 'greater_than', value: 2000 },
          ],
        }],
        logic: 'AND',
        excludeUnsubscribed: false,
        excludeRecentlyContacted: false,
      };

      const result = segmentAudience(clients, filter);
      expect(result.length).toBe(2);
    });

    test('excludes unsubscribed clients', () => {
      const clients = [
        makeClient({ id: 'c1', smsOptIn: true, emailOptIn: true }),
        makeClient({ id: 'c2', smsOptIn: false, emailOptIn: false }),
      ];

      const filter: AudienceFilter = {
        groups: [],
        logic: 'AND',
        excludeUnsubscribed: true,
        excludeRecentlyContacted: false,
      };

      const result = segmentAudience(clients, filter);
      expect(result.length).toBe(1);
    });
  });

  // ── Spend Tiers ────────────────────────────────────────────────

  describe('getSpendTier', () => {
    test('classifies new clients', () => expect(getSpendTier(200)).toBe('new'));
    test('classifies bronze clients', () => expect(getSpendTier(800)).toBe('bronze'));
    test('classifies silver clients', () => expect(getSpendTier(3000)).toBe('silver'));
    test('classifies gold clients', () => expect(getSpendTier(7000)).toBe('gold'));
    test('classifies VIP clients', () => expect(getSpendTier(15000)).toBe('vip'));
  });

  // ── A/B Testing ────────────────────────────────────────────────

  describe('A/B Testing', () => {
    test('splits audience evenly (50/50)', () => {
      const audience = Array.from({ length: 100 }, (_, i) => i);
      const { groupA, groupB } = splitAudience(audience, 50);

      expect(groupA.length).toBe(50);
      expect(groupB.length).toBe(50);
      expect(groupA.length + groupB.length).toBe(100);
    });

    test('splits audience 70/30', () => {
      const audience = Array.from({ length: 100 }, (_, i) => i);
      const { groupA, groupB } = splitAudience(audience, 70);

      expect(groupA.length).toBe(70);
      expect(groupB.length).toBe(30);
    });

    test('determines winner by open rate', () => {
      const metricsA: CampaignMetrics = { ...createEmptyMetrics(), openRate: 30 };
      const metricsB: CampaignMetrics = { ...createEmptyMetrics(), openRate: 25 };

      expect(determineABWinner(metricsA, metricsB, 'open_rate')).toBe('A');
    });

    test('determines winner by click rate', () => {
      const metricsA: CampaignMetrics = { ...createEmptyMetrics(), clickRate: 5 };
      const metricsB: CampaignMetrics = { ...createEmptyMetrics(), clickRate: 8 };

      expect(determineABWinner(metricsA, metricsB, 'click_rate')).toBe('B');
    });

    test('determines winner by conversion rate', () => {
      const metricsA: CampaignMetrics = { ...createEmptyMetrics(), conversionRate: 2 };
      const metricsB: CampaignMetrics = { ...createEmptyMetrics(), conversionRate: 2 };

      // Tie goes to A
      expect(determineABWinner(metricsA, metricsB, 'conversion_rate')).toBe('A');
    });
  });

  // ── Metrics ────────────────────────────────────────────────────

  describe('Metrics', () => {
    test('creates empty metrics with all zeros', () => {
      const metrics = createEmptyMetrics();
      expect(metrics.totalSent).toBe(0);
      expect(metrics.openRate).toBe(0);
      expect(metrics.revenueAttributed).toBe(0);
    });

    test('calculates rates correctly', () => {
      const metrics: CampaignMetrics = {
        ...createEmptyMetrics(),
        totalSent: 100,
        delivered: 95,
        opened: 30,
        clicked: 10,
        conversions: 3,
        bounced: 5,
        unsubscribed: 2,
      };

      const withRates = calculateMetricRates(metrics);
      expect(withRates.deliveryRate).toBe(95);
      expect(withRates.openRate).toBeCloseTo(31.58, 1);
      expect(withRates.clickRate).toBeCloseTo(33.33, 1);
      expect(withRates.bounceRate).toBe(5);
    });

    test('handles zero division', () => {
      const metrics = createEmptyMetrics();
      const withRates = calculateMetricRates(metrics);
      expect(withRates.deliveryRate).toBe(0);
      expect(withRates.openRate).toBe(0);
    });
  });

  // ── Revenue Attribution ────────────────────────────────────────

  describe('Revenue Attribution', () => {
    test('attributes revenue to campaign', () => {
      const campaign = createCampaign({
        name: 'Revenue Test',
        type: 'promotional',
        channel: 'sms',
        body: 'Buy now!',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      attributeRevenue(campaign.id, 500, true);
      const updated = getCampaign(campaign.id);

      expect(updated?.metrics.revenueAttributed).toBe(500);
      expect(updated?.metrics.conversions).toBe(1);
    });

    test('accumulates multiple revenue attributions', () => {
      const campaign = createCampaign({
        name: 'Multi Revenue',
        type: 'promotional',
        channel: 'email',
        body: 'Special offer!',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      attributeRevenue(campaign.id, 300, true);
      attributeRevenue(campaign.id, 700, true);
      attributeRevenue(campaign.id, 200, false); // not a conversion

      const updated = getCampaign(campaign.id);
      expect(updated?.metrics.revenueAttributed).toBe(1200);
      expect(updated?.metrics.conversions).toBe(2);
    });
  });

  // ── CAN-SPAM Compliance ────────────────────────────────────────

  describe('CAN-SPAM Compliance', () => {
    test('validates compliant campaign', () => {
      const campaign = createCampaign({
        name: 'Compliant Test',
        type: 'promotional',
        channel: 'email',
        body: 'Special offer!\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const result = validateCANSPAM(campaign);
      expect(result.isCompliant).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('flags missing physical address', () => {
      const campaign = createCampaign({
        name: 'No Address Test',
        type: 'promotional',
        channel: 'email',
        body: 'Special offer! To unsubscribe, reply STOP',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const result = validateCANSPAM(campaign);
      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.includes('address'))).toBe(true);
    });

    test('flags missing unsubscribe link', () => {
      const campaign = createCampaign({
        name: 'No Unsub Test',
        type: 'promotional',
        channel: 'email',
        body: 'Special offer!\n401 Olympia Ave, Renton, WA',
        audienceFilter: { groups: [], logic: 'AND', excludeUnsubscribed: true, excludeRecentlyContacted: true },
        createdBy: 'Staff',
      });

      const result = validateCANSPAM(campaign);
      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.includes('unsubscribe'))).toBe(true);
    });
  });

  // ── Unsubscribe Management ─────────────────────────────────────

  describe('Unsubscribe Management', () => {
    test('unsubscribes a client', () => {
      unsubscribeClient('client_unsub_1');
      expect(isUnsubscribed('client_unsub_1')).toBe(true);
    });

    test('resubscribes a client', () => {
      unsubscribeClient('client_resub_1');
      expect(isUnsubscribed('client_resub_1')).toBe(true);

      resubscribeClient('client_resub_1');
      expect(isUnsubscribed('client_resub_1')).toBe(false);
    });

    test('lists all unsubscribed clients', () => {
      unsubscribeClient('client_list_1');
      unsubscribeClient('client_list_2');

      const list = getUnsubscribedClients();
      expect(list).toContain('client_list_1');
      expect(list).toContain('client_list_2');
    });
  });

  // ── Drip Sequences ────────────────────────────────────────────

  describe('Drip Sequences', () => {
    test('creates a drip sequence', () => {
      const steps = createDripSequence([
        { delayDays: 0, body: 'Welcome!', channel: 'sms' },
        { delayDays: 3, body: 'Check-in', channel: 'email', subject: 'How are you?' },
        { delayDays: 7, body: 'Follow up', channel: 'sms' },
      ]);

      expect(steps.length).toBe(3);
      expect(steps[0].delayDays).toBe(0);
      expect(steps[1].delayDays).toBe(3);
      expect(steps[2].status).toBe('pending');
    });
  });

  // ── Campaign Type Defaults ─────────────────────────────────────

  describe('Campaign Type Defaults', () => {
    test('returns defaults for promotional type', () => {
      const defaults = getCampaignTypeDefaults('promotional');
      expect(defaults.defaultChannel).toBe('both');
      expect(defaults.suggestedBody).toContain('unsubscribe');
    });

    test('returns defaults for birthday type', () => {
      const defaults = getCampaignTypeDefaults('birthday');
      expect(defaults.suggestedSubject).toContain('Birthday');
    });

    test('all campaign types have defaults', () => {
      const types = ['promotional', 'educational', 'reactivation', 'event', 'seasonal', 'birthday'] as const;
      for (const type of types) {
        const defaults = getCampaignTypeDefaults(type);
        expect(defaults.suggestedBody.length).toBeGreaterThan(0);
      }
    });
  });
});
