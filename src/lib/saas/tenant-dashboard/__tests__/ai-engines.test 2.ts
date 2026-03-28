/**
 * Tests for Tenant Dashboard AI Engines Module
 */

import {
  getAIEngineHub,
  runChurnPrediction,
  getDynamicPricing,
  generateContent,
  getConsultBriefing,
} from '../ai-engines';
import type { TenantConfig, FeatureFlags } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

function createMockDb(): TenantDatabaseClient {
  const clients = [
    { id: 'c1', fields: { 'First Name': 'Alice', 'Last Name': 'Smith', 'Total Spend': 5000, 'Visit Count': 12, 'Last Visit': new Date(Date.now() - 7 * 86400000).toISOString(), Membership: 'Gold', Status: 'Active' } },
    { id: 'c2', fields: { 'First Name': 'Bob', 'Last Name': 'Jones', 'Total Spend': 200, 'Visit Count': 1, 'Last Visit': new Date(Date.now() - 120 * 86400000).toISOString(), Membership: '', Status: 'Lapsed' } },
    { id: 'c3', fields: { 'First Name': 'Carol', 'Last Name': 'Davis', 'Total Spend': 3000, 'Visit Count': 8, 'Last Visit': new Date(Date.now() - 45 * 86400000).toISOString(), Membership: '', Status: 'Active' } },
  ];

  const transactions = Array.from({ length: 20 }, (_, i) => ({
    id: `t${i}`,
    fields: {
      Service: i % 3 === 0 ? 'HydraFacial' : i % 3 === 1 ? 'Sofwave' : 'RF Microneedling',
      Amount: 200 + i * 30,
      Date: new Date(Date.now() - i * 4 * 86400000).toISOString(),
      Status: 'Completed',
    },
  }));

  return {
    tenantId: 'test-tenant',
    fetchAll: jest.fn(async (tableName: string) => {
      if (tableName === 'Clients') return clients;
      if (tableName === 'Transactions') return transactions;
      return [];
    }),
    fetchFirst: jest.fn(async () => []),
    createRecord: jest.fn(async () => 'new-id'),
    updateRecord: jest.fn(async () => {}),
    deleteRecord: jest.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

const makeTenant = (tier: string, features: Partial<FeatureFlags> = {}): TenantConfig => ({
  id: 'test', name: 'Test Clinic', slug: 'test', ownerId: 'owner',
  airtable: { baseId: 'app123', pat: 'pat123' },
  branding: { clinicName: 'Test Clinic', logoUrl: '', colors: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#eee', text: '#111', muted: '#999' }, fonts: { heading: 'Inter', body: 'Inter' } },
  features: { churn: true, noShow: true, pricing: true, pnl: true, schedule: true, inventory: true, social: true, ads: true, consult: true, rag: true, phone: true, gamification: true, templates: true, plaid: true, whiteLabel: true, ...features },
  subscription: { tier: tier as 'starter' | 'professional' | 'enterprise', stripePriceId: '', stripeCustomerId: '', stripeSubscriptionId: '', status: 'active', currentPeriodEnd: '2099-12-31', cancelAtPeriodEnd: false },
  integrations: {},
  usage: { apiCalls: 0, aiTokens: 0, smsSent: 0, emailsSent: 0, storageBytes: 0, period: '2026-03' },
  onboardingStep: 7, onboardingComplete: true, timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01', updatedAt: '2024-01-01', active: true,
});

describe('Tenant AI Engines Module', () => {
  describe('getAIEngineHub', () => {
    it('should return all 12 AI engines', () => {
      const hub = getAIEngineHub(makeTenant('enterprise'));
      expect(hub.engines.length).toBe(12);
    });

    it('should mark engines as active for enterprise tier', () => {
      const hub = getAIEngineHub(makeTenant('enterprise'));
      const activeCount = hub.engines.filter(e => e.enabled).length;
      expect(activeCount).toBe(12);
    });

    it('should limit engines for starter tier', () => {
      const hub = getAIEngineHub(makeTenant('starter', {
        churn: false, noShow: false, pricing: false, pnl: false, inventory: false,
        social: false, ads: false, consult: false, rag: false, phone: false, templates: false, plaid: false,
      }));
      const activeCount = hub.engines.filter(e => e.enabled).length;
      expect(activeCount).toBeLessThan(12);
    });

    it('should include usage limits', () => {
      const hub = getAIEngineHub(makeTenant('professional'));
      hub.engines.forEach(engine => {
        expect(engine.usage).toHaveProperty('current');
        expect(engine.usage).toHaveProperty('limit');
        expect(engine.usage).toHaveProperty('unit');
      });
    });

    it('should include AI credit totals', () => {
      const hub = getAIEngineHub(makeTenant('enterprise'));
      expect(hub.totalAICredits).toBe(50000);
      expect(hub.tier).toBe('enterprise');
    });

    it('should set correct status for disabled engines', () => {
      const hub = getAIEngineHub(makeTenant('starter', { churn: false }));
      const churnEngine = hub.engines.find(e => e.id === 'churn');
      expect(churnEngine?.status).toBe('upgrade_required');
    });

    it('should include engine descriptions', () => {
      const hub = getAIEngineHub(makeTenant('enterprise'));
      hub.engines.forEach(engine => {
        expect(engine.name.length).toBeGreaterThan(0);
        expect(engine.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('runChurnPrediction', () => {
    it('should return churn dashboard', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      expect(result).toHaveProperty('predictions');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.predictions)).toBe(true);
    });

    it('should score clients 0-100', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      result.predictions.forEach(p => {
        expect(p.score).toBeGreaterThanOrEqual(0);
        expect(p.score).toBeLessThanOrEqual(100);
      });
    });

    it('should classify risk levels', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      result.predictions.forEach(p => {
        expect(['low', 'moderate', 'high', 'critical']).toContain(p.risk);
      });
    });

    it('should sort by score descending', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      for (let i = 1; i < result.predictions.length; i++) {
        expect(result.predictions[i - 1].score).toBeGreaterThanOrEqual(result.predictions[i].score);
      }
    });

    it('should include suggested actions', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      result.predictions.forEach(p => {
        expect(p.suggestedAction.length).toBeGreaterThan(0);
        expect(typeof p.automationAvailable).toBe('boolean');
      });
    });

    it('should calculate summary stats', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      expect(result.summary).toHaveProperty('totalAtRisk');
      expect(result.summary).toHaveProperty('criticalCount');
      expect(result.summary).toHaveProperty('highCount');
      expect(result.summary).toHaveProperty('avgChurnScore');
    });

    it('should respect limit parameter', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'), 2);
      expect(result.predictions.length).toBeLessThanOrEqual(2);
    });

    it('should include 4 churn factors', async () => {
      const db = createMockDb();
      const result = await runChurnPrediction(db, makeTenant('professional'));
      result.predictions.forEach(p => {
        expect(p.factors.length).toBe(4);
      });
    });
  });

  describe('getDynamicPricing', () => {
    it('should return pricing suggestions', async () => {
      const db = createMockDb();
      const result = await getDynamicPricing(db, makeTenant('professional'));
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('overallImpact');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should include pricing details per service', async () => {
      const db = createMockDb();
      const result = await getDynamicPricing(db, makeTenant('professional'));
      result.suggestions.forEach(s => {
        expect(s).toHaveProperty('service');
        expect(s).toHaveProperty('currentPrice');
        expect(s).toHaveProperty('suggestedPrice');
        expect(s).toHaveProperty('changePercent');
        expect(s).toHaveProperty('strategy');
        expect(s).toHaveProperty('confidence');
        expect(s).toHaveProperty('reasoning');
        expect(s).toHaveProperty('estimatedRevenueImpact');
      });
    });

    it('should have confidence scores 0-100', async () => {
      const db = createMockDb();
      const result = await getDynamicPricing(db, makeTenant('professional'));
      result.suggestions.forEach(s => {
        expect(s.confidence).toBeGreaterThanOrEqual(0);
        expect(s.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('generateContent', () => {
    it('should generate social post content', () => {
      const result = generateContent(makeTenant('professional'), {
        type: 'social_post',
        topic: 'Spring specials on HydraFacials',
      });
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('variants');
      expect(result).toHaveProperty('hashtags');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('metadata');
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.variants.length).toBe(2);
    });

    it('should include clinic name in content', () => {
      const result = generateContent(makeTenant('professional'), {
        type: 'social_post',
        topic: 'New treatment launch',
      });
      expect(result.content).toContain('Test Clinic');
    });

    it('should generate email content', () => {
      const result = generateContent(makeTenant('professional'), {
        type: 'email_campaign',
        topic: 'Summer savings event',
      });
      expect(result.content).toContain('Subject:');
      expect(result.type).toBe('email_campaign');
    });

    it('should generate SMS content', () => {
      const result = generateContent(makeTenant('professional'), {
        type: 'sms',
        topic: 'Appointment reminder',
      });
      expect(result.content.length).toBeLessThan(300); // SMS should be short
    });

    it('should include metadata', () => {
      const result = generateContent(makeTenant('professional'), {
        type: 'blog',
        topic: 'Benefits of regular skin care',
      });
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.readingTime).toBeGreaterThanOrEqual(1);
      expect(['positive', 'neutral', 'negative']).toContain(result.metadata.sentiment);
    });

    it('should generate all content types', () => {
      const types = ['social_post', 'email_campaign', 'sms', 'blog', 'ad_copy', 'review_response'] as const;
      types.forEach(type => {
        const result = generateContent(makeTenant('professional'), { type, topic: 'Test topic' });
        expect(result.type).toBe(type);
        expect(result.content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getConsultBriefing', () => {
    it('should return null for non-existent client', async () => {
      const db = { ...createMockDb(), fetchAll: jest.fn(async () => []) } as unknown as TenantDatabaseClient;
      const result = await getConsultBriefing(db, makeTenant('professional'), 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return complete briefing', async () => {
      const db = createMockDb();
      const result = await getConsultBriefing(db, makeTenant('professional'), 'c1');
      expect(result).toHaveProperty('clientName');
      expect(result).toHaveProperty('segment');
      expect(result).toHaveProperty('treatmentPlan');
      expect(result).toHaveProperty('talkingPoints');
      expect(result).toHaveProperty('objectionHandlers');
      expect(result).toHaveProperty('crossSellOpportunities');
      expect(result).toHaveProperty('closingStrategy');
    });

    it('should include talking points by timing', async () => {
      const db = createMockDb();
      const result = await getConsultBriefing(db, makeTenant('professional'), 'c1');
      expect(result?.talkingPoints.length).toBeGreaterThan(0);
      result?.talkingPoints.forEach(tp => {
        expect(['opening', 'during', 'closing']).toContain(tp.timing);
        expect(['must_say', 'should_say', 'nice_to_say']).toContain(tp.priority);
      });
    });

    it('should include objection handlers', async () => {
      const db = createMockDb();
      const result = await getConsultBriefing(db, makeTenant('professional'), 'c1');
      expect(result?.objectionHandlers.length).toBeGreaterThan(0);
      result?.objectionHandlers.forEach(oh => {
        expect(oh).toHaveProperty('objection');
        expect(oh).toHaveProperty('technique');
        expect(oh).toHaveProperty('response');
      });
    });

    it('should include closing strategy', async () => {
      const db = createMockDb();
      const result = await getConsultBriefing(db, makeTenant('professional'), 'c1');
      expect(result?.closingStrategy).toHaveProperty('type');
      expect(result?.closingStrategy).toHaveProperty('script');
      expect(['assumptive', 'choice', 'urgency', 'value', 'trial']).toContain(result?.closingStrategy.type);
    });
  });
});
