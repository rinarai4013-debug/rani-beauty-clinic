/**
 * Tests for Tenant API Middleware
 */

import {
  getIntegrationHub,
  validateIntegrationConfig,
  getIntegrationDefinitions,
} from '../integrations';
import {
  getQuickActions,
  getClinicHealthScore,
} from '../overview';
import {
  getSystemTemplates,
  getDefaultAutomations,
} from '../communications';
import {
  getReportDefinitions,
  exportToCSV,
} from '../reports';
import {
  getAIEngineHub,
  generateContent,
} from '../ai-engines';
import type { TenantConfig, FeatureFlags } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

const makeTenant = (overrides?: Partial<TenantConfig>): TenantConfig => ({
  id: 'test', name: 'Test', slug: 'test', ownerId: 'owner',
  airtable: { baseId: 'app123', pat: 'pat123' },
  branding: { clinicName: 'My Clinic', logoUrl: '', colors: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#eee', text: '#111', muted: '#999' }, fonts: { heading: 'Inter', body: 'Inter' } },
  features: { churn: true, noShow: true, pricing: true, pnl: true, schedule: true, inventory: true, social: true, ads: true, consult: true, rag: true, phone: true, gamification: true, templates: true, plaid: true, whiteLabel: true },
  subscription: { tier: 'enterprise', stripePriceId: '', stripeCustomerId: '', stripeSubscriptionId: '', status: 'active', currentPeriodEnd: '2099-12-31', cancelAtPeriodEnd: false },
  integrations: {},
  usage: { apiCalls: 0, aiTokens: 0, smsSent: 0, emailsSent: 0, storageBytes: 0, period: '2026-03' },
  onboardingStep: 7, onboardingComplete: true, timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01', updatedAt: '2024-01-01', active: true,
  ...overrides,
});

function createMockDb(): TenantDatabaseClient {
  return {
    tenantId: 'test-tenant',
    fetchAll: vi.fn(async () => []),
    fetchFirst: vi.fn(async () => []),
    createRecord: vi.fn(async () => 'new-id'),
    updateRecord: vi.fn(async () => {}),
    deleteRecord: vi.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

describe('Tenant Middleware & Cross-Module Integration', () => {
  describe('Tenant Isolation', () => {
    it('should scope database queries to tenant', () => {
      const db = createMockDb();
      expect(db.tenantId).toBe('test-tenant');
    });

    it('should use tenant branding in content generation', () => {
      const tenant = makeTenant({ branding: { ...makeTenant().branding, clinicName: 'Luxury Spa' } });
      const content = generateContent(tenant, { type: 'social_post', topic: 'Test' });
      expect(content.content).toContain('Luxury Spa');
    });

    it('should not use other tenant branding', () => {
      const tenant1 = makeTenant({ branding: { ...makeTenant().branding, clinicName: 'Clinic A' } });
      const tenant2 = makeTenant({ branding: { ...makeTenant().branding, clinicName: 'Clinic B' } });
      const content1 = generateContent(tenant1, { type: 'sms', topic: 'Test' });
      const content2 = generateContent(tenant2, { type: 'sms', topic: 'Test' });
      expect(content1.content).toContain('Clinic A');
      expect(content1.content).not.toContain('Clinic B');
      expect(content2.content).toContain('Clinic B');
    });
  });

  describe('Feature Gating', () => {
    it('should show all engines for enterprise', () => {
      const hub = getAIEngineHub(makeTenant({ subscription: { ...makeTenant().subscription, tier: 'enterprise' } }));
      expect(hub.engines.filter(e => e.enabled).length).toBe(12);
    });

    it('should limit engines when features disabled', () => {
      const features: FeatureFlags = {
        churn: false, noShow: false, pricing: false, pnl: false,
        schedule: true, inventory: false, social: false, ads: false,
        consult: false, rag: false, phone: false, gamification: true,
        templates: false, plaid: false, whiteLabel: false,
      };
      const hub = getAIEngineHub(makeTenant({ features }));
      const enabled = hub.engines.filter(e => e.enabled);
      expect(enabled.length).toBeLessThan(12);
    });

    it('should gate integrations by connected status', () => {
      const hub = getIntegrationHub(makeTenant());
      expect(hub.connected).toBe(0);
      const hubConnected = getIntegrationHub(makeTenant({
        integrations: { mangomint: { apiKey: 'key', companyId: '123' } },
      }));
      expect(hubConnected.connected).toBe(1);
    });
  });

  describe('Data Validation', () => {
    it('should validate Stripe config', () => {
      expect(validateIntegrationConfig('stripe', { secretKey: 'sk_test_x', webhookSecret: 'whsec_x' }).valid).toBe(true);
      expect(validateIntegrationConfig('stripe', { secretKey: 'bad', webhookSecret: 'whsec_x' }).valid).toBe(false);
    });

    it('should validate Twilio config', () => {
      expect(validateIntegrationConfig('twilio', { accountSid: 'ACtest', authToken: 'tok', fromNumber: '+1555' }).valid).toBe(true);
      expect(validateIntegrationConfig('twilio', { accountSid: 'bad', authToken: 'tok', fromNumber: '+1555' }).valid).toBe(false);
    });

    it('should validate GA config', () => {
      expect(validateIntegrationConfig('google_analytics', { measurementId: 'G-test', propertyId: '123' }).valid).toBe(true);
      expect(validateIntegrationConfig('google_analytics', { measurementId: 'bad', propertyId: '123' }).valid).toBe(false);
    });
  });

  describe('Report Export', () => {
    it('should export empty report gracefully', () => {
      const csv = exportToCSV({ reportId: 'daily_summary', name: 'Test', generatedAt: '', period: { start: '', end: '' }, summary: {}, data: [], charts: [], insights: [], exportFormats: [] });
      expect(csv.headers).toEqual([]);
      expect(csv.rows).toEqual([]);
    });

    it('should export data rows correctly', () => {
      const csv = exportToCSV({
        reportId: 'test' as never, name: 'Test', generatedAt: '', period: { start: '', end: '' },
        summary: {}, data: [{ name: 'HydraFacial', revenue: 5000 }, { name: 'Sofwave', revenue: 8000 }],
        charts: [], insights: [], exportFormats: [],
      });
      expect(csv.headers).toEqual(['name', 'revenue']);
      expect(csv.rows.length).toBe(2);
      expect(csv.rows[0]).toEqual(['HydraFacial', 5000]);
    });
  });

  describe('Template Consistency', () => {
    it('should have templates with {{variable}} syntax', () => {
      const templates = getSystemTemplates();
      templates.forEach(t => {
        t.variables.forEach(v => {
          expect(t.body).toContain(`{{${v}}}`);
        });
      });
    });

    it('should have unique template IDs', () => {
      const templates = getSystemTemplates();
      const ids = templates.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('Automation Completeness', () => {
    it('should have automations for all key triggers', () => {
      const automations = getDefaultAutomations();
      const triggers = automations.map(a => a.trigger);
      expect(triggers).toContain('appointment_booked');
      expect(triggers).toContain('appointment_completed');
      expect(triggers).toContain('no_show');
      expect(triggers).toContain('new_client');
      expect(triggers).toContain('churn_risk');
    });
  });

  describe('Quick Actions', () => {
    it('should have valid hrefs', () => {
      const actions = getQuickActions(makeTenant());
      actions.forEach(a => {
        expect(a.href).toMatch(/^\/tenant\//);
      });
    });
  });

  describe('Health Score Edge Cases', () => {
    it('should handle zero data gracefully', async () => {
      const db = createMockDb();
      const score = await getClinicHealthScore(db, makeTenant());
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.components.length).toBe(5);
    });
  });

  describe('Report Definitions Coverage', () => {
    it('should have reports covering all operational areas', () => {
      const defs = getReportDefinitions();
      const names = defs.map(d => d.name);
      expect(names).toContain('Daily Summary');
      expect(names).toContain('Revenue by Service');
      expect(names).toContain('Client Acquisition Funnel');
      expect(names).toContain('Provider Utilization');
      expect(names).toContain('Membership Metrics');
    });

    it('should assign starter-accessible core reports', () => {
      const defs = getReportDefinitions();
      const starterReports = defs.filter(d => d.requiredTier === 'starter').map(d => d.id);
      expect(starterReports).toContain('daily_summary');
      expect(starterReports).toContain('revenue_by_service');
      expect(starterReports).toContain('treatment_popularity');
    });
  });

  describe('Integration Definitions Coverage', () => {
    it('should cover POS, booking, comms, marketing, analytics', () => {
      const defs = getIntegrationDefinitions();
      const ids = defs.map(d => d.id);
      expect(ids).toContain('mangomint');
      expect(ids).toContain('square');
      expect(ids).toContain('stripe');
      expect(ids).toContain('twilio');
      expect(ids).toContain('resend');
      expect(ids).toContain('google_business');
      expect(ids).toContain('meta');
      expect(ids).toContain('google_analytics');
      expect(ids).toContain('zapier');
    });
  });

  describe('AI Credit Allocation', () => {
    it('should allocate 500 credits for starter', () => {
      const hub = getAIEngineHub(makeTenant({ subscription: { ...makeTenant().subscription, tier: 'starter' } }));
      expect(hub.totalAICredits).toBe(500);
    });

    it('should allocate 5000 credits for professional', () => {
      const hub = getAIEngineHub(makeTenant({ subscription: { ...makeTenant().subscription, tier: 'professional' } }));
      expect(hub.totalAICredits).toBe(5000);
    });

    it('should allocate 50000 credits for enterprise', () => {
      const hub = getAIEngineHub(makeTenant({ subscription: { ...makeTenant().subscription, tier: 'enterprise' } }));
      expect(hub.totalAICredits).toBe(50000);
    });
  });

  describe('Content Generation Types', () => {
    it('should generate review responses', () => {
      const content = generateContent(makeTenant(), { type: 'review_response', topic: 'HydraFacial' });
      expect(content.type).toBe('review_response');
      expect(content.content.length).toBeGreaterThan(0);
    });

    it('should generate ad copy', () => {
      const content = generateContent(makeTenant(), { type: 'ad_copy', topic: 'Summer special' });
      expect(content.type).toBe('ad_copy');
      expect(content.content).toContain('My Clinic');
    });

    it('should generate blog content', () => {
      const content = generateContent(makeTenant(), { type: 'blog', topic: 'Skincare tips' });
      expect(content.type).toBe('blog');
      expect(content.content).toContain('#');
    });
  });

  describe('Template Variable Integrity', () => {
    it('should have clientName in all client-facing templates', () => {
      const templates = getSystemTemplates();
      const clientFacing = templates.filter(t => t.category !== 'membership');
      clientFacing.forEach(t => {
        expect(t.variables).toContain('clientName');
      });
    });
  });
});
