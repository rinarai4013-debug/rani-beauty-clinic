/**
 * Tests for Tenant Dashboard Integrations Module
 */

import {
  getIntegrationDefinitions,
  getIntegrationHub,
  validateIntegrationConfig,
  testIntegrationConnection,
  triggerSync,
  getDataSyncStatus,
  buildZapierPayload,
} from '../integrations';
import type { TenantConfig } from '@/lib/tenant/config';

const makeTenant = (integrations = {}): TenantConfig => ({
  id: 'test', name: 'Test', slug: 'test', ownerId: 'owner',
  airtable: { baseId: 'app123', pat: 'pat123' },
  branding: { clinicName: 'Test Clinic', logoUrl: '', colors: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#eee', text: '#111', muted: '#999' }, fonts: { heading: 'Inter', body: 'Inter' } },
  features: { churn: true, noShow: true, pricing: true, pnl: true, schedule: true, inventory: true, social: true, ads: true, consult: true, rag: true, phone: true, gamification: true, templates: true, plaid: true, whiteLabel: true },
  subscription: { tier: 'enterprise', stripePriceId: '', stripeCustomerId: '', stripeSubscriptionId: '', status: 'active', currentPeriodEnd: '2099-12-31', cancelAtPeriodEnd: false },
  integrations,
  usage: { apiCalls: 0, aiTokens: 0, smsSent: 0, emailsSent: 0, storageBytes: 0, period: '2026-03' },
  onboardingStep: 7, onboardingComplete: true, timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01', updatedAt: '2024-01-01', active: true,
});

describe('Tenant Integrations Module', () => {
  describe('getIntegrationDefinitions', () => {
    it('should return 9 integration definitions', () => {
      const defs = getIntegrationDefinitions();
      expect(defs.length).toBe(9);
    });

    it('should have unique IDs', () => {
      const defs = getIntegrationDefinitions();
      const ids = defs.map(d => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should include all categories', () => {
      const defs = getIntegrationDefinitions();
      const cats = new Set(defs.map(d => d.category));
      expect(cats.has('booking')).toBe(true);
      expect(cats.has('payments')).toBe(true);
      expect(cats.has('communication')).toBe(true);
      expect(cats.has('marketing')).toBe(true);
      expect(cats.has('analytics')).toBe(true);
      expect(cats.has('automation')).toBe(true);
    });

    it('should have config fields', () => {
      const defs = getIntegrationDefinitions();
      defs.forEach(d => {
        expect(d.configFields.length).toBeGreaterThan(0);
        d.configFields.forEach(f => {
          expect(f).toHaveProperty('key');
          expect(f).toHaveProperty('label');
          expect(f).toHaveProperty('type');
          expect(f).toHaveProperty('required');
          expect(f).toHaveProperty('placeholder');
        });
      });
    });

    it('should have capabilities listed', () => {
      const defs = getIntegrationDefinitions();
      defs.forEach(d => {
        expect(d.capabilities.length).toBeGreaterThan(0);
      });
    });

    it('should have docs URLs', () => {
      const defs = getIntegrationDefinitions();
      defs.forEach(d => {
        expect(d.docsUrl.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getIntegrationHub', () => {
    it('should return hub with all integrations', () => {
      const hub = getIntegrationHub(makeTenant());
      expect(hub.integrations.length).toBe(9);
      expect(hub).toHaveProperty('connected');
      expect(hub).toHaveProperty('total');
      expect(hub).toHaveProperty('syncHealth');
    });

    it('should mark connected integrations', () => {
      const hub = getIntegrationHub(makeTenant({
        mangomint: { apiKey: 'key', companyId: '123' },
        stripe: { secretKey: 'sk_test_xxx', webhookSecret: 'whsec_xxx' },
      }));
      const mangomint = hub.integrations.find(i => i.id === 'mangomint');
      const stripe = hub.integrations.find(i => i.id === 'stripe');
      const twilio = hub.integrations.find(i => i.id === 'twilio');
      expect(mangomint?.status).toBe('connected');
      expect(stripe?.status).toBe('connected');
      expect(twilio?.status).toBe('disconnected');
      expect(hub.connected).toBe(2);
    });

    it('should calculate sync health', () => {
      const hub = getIntegrationHub(makeTenant({
        mangomint: { apiKey: 'key', companyId: '123' },
      }));
      expect(hub.syncHealth).toBeGreaterThan(0);
      expect(hub.syncHealth).toBeLessThanOrEqual(100);
    });

    it('should return 0 sync health when nothing connected', () => {
      const hub = getIntegrationHub(makeTenant());
      expect(hub.syncHealth).toBe(0);
    });
  });

  describe('validateIntegrationConfig', () => {
    it('should validate required fields', () => {
      const result = validateIntegrationConfig('stripe', {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should pass with all required fields', () => {
      const result = validateIntegrationConfig('stripe', {
        secretKey: 'sk_test_xxx',
        webhookSecret: 'whsec_xxx',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate Stripe key format', () => {
      const result = validateIntegrationConfig('stripe', {
        secretKey: 'invalid_key',
        webhookSecret: 'whsec_xxx',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sk_'))).toBe(true);
    });

    it('should validate Twilio SID format', () => {
      const result = validateIntegrationConfig('twilio', {
        accountSid: 'invalid',
        authToken: 'token',
        fromNumber: '+15555550001',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('AC'))).toBe(true);
    });

    it('should validate Google Analytics ID format', () => {
      const result = validateIntegrationConfig('google_analytics', {
        measurementId: 'invalid',
        propertyId: '123',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('G-'))).toBe(true);
    });

    it('should reject unknown integration ID', () => {
      const result = validateIntegrationConfig('unknown' as never, {});
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown integration');
    });

    it('should allow optional fields to be empty', () => {
      const result = validateIntegrationConfig('zapier', {});
      expect(result.valid).toBe(true);
    });
  });

  describe('testIntegrationConnection', () => {
    it('should return success result', async () => {
      const result = await testIntegrationConnection('stripe', { secretKey: 'sk_test_xxx' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('stripe');
      expect(typeof result.latency).toBe('number');
    });
  });

  describe('triggerSync', () => {
    it('should return sync record', async () => {
      const result = await triggerSync('mangomint', makeTenant());
      expect(result).toHaveProperty('integrationId', 'mangomint');
      expect(result).toHaveProperty('status', 'syncing');
      expect(result).toHaveProperty('startedAt');
      expect(result).toHaveProperty('recordsProcessed', 0);
    });

    it('should accept entity filter', async () => {
      const result = await triggerSync('mangomint', makeTenant(), ['appointments', 'clients']);
      expect(result.entity).toContain('appointments');
      expect(result.entity).toContain('clients');
    });
  });

  describe('getDataSyncStatus', () => {
    it('should return sync status for mangomint', () => {
      const result = getDataSyncStatus('mangomint', makeTenant());
      expect(result.integrationId).toBe('mangomint');
      expect(result.entities.length).toBe(4); // appointments, clients, services, staff
    });

    it('should return sync status for square', () => {
      const result = getDataSyncStatus('square', makeTenant());
      expect(result.entities.length).toBe(3); // payments, inventory, customers
    });

    it('should return sync status for stripe', () => {
      const result = getDataSyncStatus('stripe', makeTenant());
      expect(result.entities.length).toBe(3); // payments, subscriptions, invoices
    });

    it('should have valid entity structure', () => {
      const result = getDataSyncStatus('mangomint', makeTenant());
      result.entities.forEach(e => {
        expect(e).toHaveProperty('entity');
        expect(e).toHaveProperty('recordCount');
        expect(e).toHaveProperty('status');
        expect(e).toHaveProperty('syncDirection');
        expect(['inbound', 'outbound', 'bidirectional']).toContain(e.syncDirection);
      });
    });
  });

  describe('buildZapierPayload', () => {
    it('should build valid webhook payload', () => {
      const payload = buildZapierPayload('test-tenant', 'appointment.created', { appointmentId: '123' });
      expect(payload).toHaveProperty('event', 'appointment.created');
      expect(payload).toHaveProperty('tenantId', 'test-tenant');
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('data');
      expect(payload.data.appointmentId).toBe('123');
    });

    it('should include ISO timestamp', () => {
      const payload = buildZapierPayload('test', 'test.event', {});
      expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);
    });
  });
});
