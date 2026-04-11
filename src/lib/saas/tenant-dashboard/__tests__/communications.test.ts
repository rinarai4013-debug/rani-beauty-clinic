/**
 * Tests for Tenant Dashboard Communications Module
 */

import {
  sendMessage,
  getSystemTemplates,
  getDefaultAutomations,
  getInbox,
  getReviewSummary,
} from '../communications';
import type { TenantConfig } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

function createMockDb(): TenantDatabaseClient {
  return {
    tenantId: 'test-tenant',
    fetchAll: jest.fn(async (tableName: string) => {
      if (tableName === 'Messages Log') return [
        { id: 'm1', fields: { 'Client Email': 'alice@test.com', 'Client Name': 'Alice', Type: 'sms', Direction: 'outbound', Subject: '', Preview: 'Reminder: Your appointment tomorrow', Status: 'delivered', Date: new Date().toISOString() } },
        { id: 'm2', fields: { 'Client Email': 'alice@test.com', 'Client Name': 'Alice', Type: 'email', Direction: 'inbound', Subject: 'Re: Appointment', Preview: 'I will be there!', Status: 'delivered', Date: new Date().toISOString() } },
        { id: 'm3', fields: { 'Client Email': 'bob@test.com', 'Client Name': 'Bob', Type: 'sms', Direction: 'outbound', Subject: '', Preview: 'We miss you!', Status: 'sent', Date: new Date(Date.now() - 86400000).toISOString() } },
      ];
      if (tableName === 'Reviews') return [
        { id: 'r1', fields: { Platform: 'google', Rating: 5, Text: 'Amazing experience!', 'Client Name': 'Alice', Date: new Date().toISOString(), Response: 'Thank you!' } },
        { id: 'r2', fields: { Platform: 'google', Rating: 4, Text: 'Great service', 'Client Name': 'Bob', Date: new Date().toISOString() } },
        { id: 'r3', fields: { Platform: 'yelp', Rating: 2, Text: 'Wait time was too long', 'Client Name': 'Carol', Date: new Date().toISOString() } },
      ];
      return [];
    }),
    createRecord: jest.fn(async () => 'new-msg-id'),
    updateRecord: jest.fn(async () => {}),
    deleteRecord: jest.fn(async () => {}),
    fetchFirst: jest.fn(async () => []),
  } as unknown as TenantDatabaseClient;
}

const mockTenant: TenantConfig = {
  id: 'test', name: 'Test Clinic', slug: 'test', ownerId: 'owner',
  airtable: { baseId: 'app123', pat: 'pat123' },
  branding: { clinicName: 'Test Clinic', logoUrl: '', colors: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#eee', text: '#111', muted: '#999' }, fonts: { heading: 'Inter', body: 'Inter' } },
  features: { churn: true, noShow: true, pricing: true, pnl: true, schedule: true, inventory: true, social: true, ads: true, consult: true, rag: true, phone: true, gamification: true, templates: true, plaid: true, whiteLabel: true },
  subscription: { tier: 'enterprise', stripePriceId: '', stripeCustomerId: '', stripeSubscriptionId: '', status: 'active', currentPeriodEnd: '2099-12-31', cancelAtPeriodEnd: false },
  integrations: {},
  usage: { apiCalls: 0, aiTokens: 0, smsSent: 0, emailsSent: 0, storageBytes: 0, period: '2026-03' },
  onboardingStep: 7, onboardingComplete: true, timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01', updatedAt: '2024-01-01', active: true,
};

describe('Tenant Communications Module', () => {
  describe('sendMessage', () => {
    it('should send SMS message', async () => {
      const db = createMockDb();
      const result = await sendMessage(db, mockTenant, {
        channel: 'sms',
        to: '+15555550001',
        body: 'Test message',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('channel', 'sms');
      expect(result).toHaveProperty('status', 'sent');
      expect(result).toHaveProperty('cost', 0.05);
      expect(result).toHaveProperty('sentAt');
    });

    it('should send email message', async () => {
      const db = createMockDb();
      const result = await sendMessage(db, mockTenant, {
        channel: 'email',
        to: 'alice@test.com',
        subject: 'Test Email',
        body: 'Test body',
      });
      expect(result.channel).toBe('email');
      expect(result.cost).toBe(0.01);
    });

    it('should apply template variables', async () => {
      const db = createMockDb();
      await sendMessage(db, mockTenant, {
        channel: 'sms',
        to: '+15555550001',
        body: 'Hello {{clientName}}, your appointment is at {{time}}',
        variables: { clientName: 'Alice', time: '3:00 PM' },
      });
      expect(db.createRecord).toHaveBeenCalled();
    });

    it('should reject when SMS limit reached', async () => {
      const db = createMockDb();
      const overLimitTenant = { ...mockTenant, usage: { ...mockTenant.usage, smsSent: 500 } };
      await expect(sendMessage(db, overLimitTenant, {
        channel: 'sms', to: '+1555', body: 'Test',
      })).rejects.toThrow('SMS limit reached');
    });

    it('should reject when email limit reached', async () => {
      const db = createMockDb();
      const overLimitTenant = { ...mockTenant, usage: { ...mockTenant.usage, emailsSent: 2000 } };
      await expect(sendMessage(db, overLimitTenant, {
        channel: 'email', to: 'test@test.com', body: 'Test',
      })).rejects.toThrow('Email limit reached');
    });

    it('should log message to Messages Log table', async () => {
      const db = createMockDb();
      await sendMessage(db, mockTenant, {
        channel: 'sms', to: '+15555550001', body: 'Test',
      });
      expect(db.createRecord).toHaveBeenCalledWith('Messages Log', expect.objectContaining({
        Type: 'sms',
        Direction: 'outbound',
      }));
    });
  });

  describe('getSystemTemplates', () => {
    it('should return 12 system templates', () => {
      const templates = getSystemTemplates();
      expect(templates.length).toBe(12);
    });

    it('should include all required categories', () => {
      const templates = getSystemTemplates();
      const categories = new Set(templates.map(t => t.category));
      expect(categories.has('appointment_confirmation')).toBe(true);
      expect(categories.has('appointment_reminder')).toBe(true);
      expect(categories.has('post_treatment')).toBe(true);
      expect(categories.has('reactivation')).toBe(true);
      expect(categories.has('review_request')).toBe(true);
      expect(categories.has('birthday')).toBe(true);
    });

    it('should have valid template structure', () => {
      const templates = getSystemTemplates();
      templates.forEach(t => {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('category');
        expect(t).toHaveProperty('channel');
        expect(t).toHaveProperty('body');
        expect(t).toHaveProperty('variables');
        expect(t.isSystem).toBe(true);
        expect(Array.isArray(t.variables)).toBe(true);
      });
    });

    it('should include template variables', () => {
      const templates = getSystemTemplates();
      const apptConfirm = templates.find(t => t.id === 'tpl-appt-confirm');
      expect(apptConfirm?.variables).toContain('clientName');
      expect(apptConfirm?.variables).toContain('service');
    });

    it('should have both SMS and email templates', () => {
      const templates = getSystemTemplates();
      const smsCount = templates.filter(t => t.channel === 'sms').length;
      const emailCount = templates.filter(t => t.channel === 'email').length;
      expect(smsCount).toBeGreaterThan(0);
      expect(emailCount).toBeGreaterThan(0);
    });
  });

  describe('getDefaultAutomations', () => {
    it('should return 7 default automations', () => {
      const automations = getDefaultAutomations();
      expect(automations.length).toBe(7);
    });

    it('should all be enabled by default', () => {
      const automations = getDefaultAutomations();
      automations.forEach(a => {
        expect(a.enabled).toBe(true);
      });
    });

    it('should have valid trigger types', () => {
      const automations = getDefaultAutomations();
      const validTriggers = ['appointment_booked', 'appointment_completed', 'no_show', 'new_client', 'churn_risk'];
      automations.forEach(a => {
        expect(validTriggers).toContain(a.trigger);
      });
    });

    it('should have actions', () => {
      const automations = getDefaultAutomations();
      automations.forEach(a => {
        expect(a.actions.length).toBeGreaterThan(0);
      });
    });

    it('should have initialized stats', () => {
      const automations = getDefaultAutomations();
      automations.forEach(a => {
        expect(a.stats.triggered).toBe(0);
        expect(a.stats.sent).toBe(0);
      });
    });
  });

  describe('getInbox', () => {
    it('should return inbox summary', async () => {
      const db = createMockDb();
      const result = await getInbox(db, mockTenant);
      expect(result).toHaveProperty('conversations');
      expect(result).toHaveProperty('totalOpen');
      expect(result).toHaveProperty('totalUnread');
      expect(result).toHaveProperty('avgResponseTime');
    });

    it('should group messages by client', async () => {
      const db = createMockDb();
      const result = await getInbox(db, mockTenant);
      expect(result.conversations.length).toBe(2); // Alice and Bob
    });

    it('should sort conversations by last message date', async () => {
      const db = createMockDb();
      const result = await getInbox(db, mockTenant);
      for (let i = 1; i < result.conversations.length; i++) {
        expect(result.conversations[i - 1].lastMessageAt >= result.conversations[i].lastMessageAt).toBe(true);
      }
    });
  });

  describe('getReviewSummary', () => {
    it('should return review summary', async () => {
      const db = createMockDb();
      const result = await getReviewSummary(db, mockTenant);
      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('avgRating');
      expect(result).toHaveProperty('totalReviews');
      expect(result).toHaveProperty('ratingDistribution');
      expect(result).toHaveProperty('responseRate');
      expect(result).toHaveProperty('sentimentBreakdown');
      expect(result).toHaveProperty('recentTrend');
    });

    it('should calculate average rating', async () => {
      const db = createMockDb();
      const result = await getReviewSummary(db, mockTenant);
      expect(result.avgRating).toBeCloseTo(3.7, 1); // (5+4+2)/3
    });

    it('should classify sentiment', async () => {
      const db = createMockDb();
      const result = await getReviewSummary(db, mockTenant);
      expect(result.sentimentBreakdown.positive).toBe(2); // 5 and 4 star
      expect(result.sentimentBreakdown.negative).toBe(1); // 2 star
    });

    it('should calculate response rate', async () => {
      const db = createMockDb();
      const result = await getReviewSummary(db, mockTenant);
      expect(result.responseRate).toBeGreaterThan(0); // 1 out of 3 has response
    });

    it('should generate suggested responses for unresponded reviews', async () => {
      const db = createMockDb();
      const result = await getReviewSummary(db, mockTenant);
      const unresponded = result.reviews.filter(r => r.status === 'new');
      unresponded.forEach(r => {
        expect(r.suggestedResponse).toBeDefined();
        expect(r.suggestedResponse!.length).toBeGreaterThan(0);
      });
    });

    it('should include rating distribution', async () => {
      const db = createMockDb();
      const result = await getReviewSummary(db, mockTenant);
      expect(result.ratingDistribution[5]).toBe(1);
      expect(result.ratingDistribution[4]).toBe(1);
      expect(result.ratingDistribution[2]).toBe(1);
    });
  });
});
