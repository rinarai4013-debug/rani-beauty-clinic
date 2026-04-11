import { describe, it, expect } from 'vitest';
import {
  TenantProvisionSchema,
  generateSubdomain,
  generateTempPassword,
  createTenantRecord,
  initializeSetupProgress,
  getFeaturesByPlan,
  calculateCompletionPercentage,
  completeSetupStep,
  skipSetupStep,
  getCurrentStep,
  isSetupComplete,
  checkStalledOnboarding,
  generateCompletionNudge,
  generateSampleClients,
  generateSampleAppointments,
  validateAirtablePAT,
  validateAirtableBaseId,
  buildWelcomeEmailContent,
  createProvisioningPipeline,
  advanceProvisioningStep,
  getNextProvisioningStep,
  SETUP_STEPS,
  SERVICE_TEMPLATES,
  AIRTABLE_TEMPLATE_TABLES,
  DEFAULT_BRANDING,
  type Tenant,
  type SetupProgress,
} from '../auto-onboarding';

// ─── Schema Validation ────────────────────────────────────────────

describe('TenantProvisionSchema', () => {
  it('validates correct input', () => {
    const result = TenantProvisionSchema.safeParse({
      clinicName: 'Glow Aesthetics',
      ownerName: 'Jane Smith',
      ownerEmail: 'jane@glow.com',
      plan: 'professional',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid plan', () => {
    const result = TenantProvisionSchema.safeParse({
      clinicName: 'Glow',
      ownerName: 'Jane',
      ownerEmail: 'jane@glow.com',
      plan: 'invalid',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = TenantProvisionSchema.safeParse({
      clinicName: 'Glow',
      ownerName: 'Jane',
      plan: 'starter',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });
    expect(result.success).toBe(false);
  });
});

// ─── Subdomain Generation ─────────────────────────────────────────

describe('generateSubdomain', () => {
  it('creates a valid subdomain', () => {
    expect(generateSubdomain('Glow Aesthetics')).toBe('glow-aesthetics');
  });

  it('removes special characters', () => {
    const result = generateSubdomain("Jane's Clinic & Spa");
    expect(result).not.toContain("'");
    expect(result).not.toContain("&");
  });

  it('truncates long names', () => {
    const result = generateSubdomain('A Very Very Very Long Clinic Name That Goes On');
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('handles all-special-char names', () => {
    const result = generateSubdomain('!!!');
    expect(result).toBe('');
  });
});

// ─── Password Generation ──────────────────────────────────────────

describe('generateTempPassword', () => {
  it('generates passwords of correct length', () => {
    const pwd = generateTempPassword();
    expect(pwd.length).toBe(11); // 10 chars + 1 special
  });

  it('includes a special character', () => {
    const pwd = generateTempPassword();
    expect(/[!@#$%]/.test(pwd)).toBe(true);
  });

  it('generates unique passwords', () => {
    const passwords = new Set(Array.from({ length: 10 }, () => generateTempPassword()));
    expect(passwords.size).toBe(10);
  });
});

// ─── Tenant Record ────────────────────────────────────────────────

describe('createTenantRecord', () => {
  const input = {
    clinicName: 'Glow Aesthetics',
    ownerName: 'Jane Smith',
    ownerEmail: 'jane@glow.com',
    plan: 'professional' as const,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
  };

  it('creates a complete tenant', () => {
    const tenant = createTenantRecord(input);
    expect(tenant.id).toMatch(/^tn_/);
    expect(tenant.clinicName).toBe('Glow Aesthetics');
    expect(tenant.subdomain).toBe('glow-aesthetics');
    expect(tenant.status).toBe('provisioning');
    expect(tenant.plan).toBe('professional');
  });

  it('initializes setup progress', () => {
    const tenant = createTenantRecord(input);
    expect(tenant.setupProgress.steps).toHaveLength(7);
    expect(tenant.setupProgress.completionPercentage).toBe(0);
  });

  it('sets features by plan', () => {
    const tenant = createTenantRecord(input);
    expect(tenant.config.features.ai_chat).toBe(true); // professional has it
    expect(tenant.config.features.white_label).toBe(false); // enterprise only
  });

  it('sets default branding', () => {
    const tenant = createTenantRecord(input);
    expect(tenant.config.branding.primaryColor).toBe(DEFAULT_BRANDING.primaryColor);
  });
});

// ─── Feature Plans ────────────────────────────────────────────────

describe('getFeaturesByPlan', () => {
  it('starter has basic features only', () => {
    const features = getFeaturesByPlan('starter');
    expect(features.dashboard).toBe(true);
    expect(features.crm).toBe(true);
    expect(features.ai_chat).toBe(false);
    expect(features.churn_prediction).toBe(false);
    expect(features.white_label).toBe(false);
  });

  it('professional has AI features', () => {
    const features = getFeaturesByPlan('professional');
    expect(features.ai_chat).toBe(true);
    expect(features.churn_prediction).toBe(true);
    expect(features.dynamic_pricing).toBe(true);
    expect(features.white_label).toBe(false);
  });

  it('enterprise has everything', () => {
    const features = getFeaturesByPlan('enterprise');
    for (const value of Object.values(features)) {
      expect(value).toBe(true);
    }
  });
});

// ─── Setup Progress ───────────────────────────────────────────────

describe('Setup Progress', () => {
  let progress: SetupProgress;

  beforeEach(() => {
    progress = initializeSetupProgress();
  });

  it('starts at 0% with step 0', () => {
    expect(progress.currentStep).toBe(0);
    expect(progress.completionPercentage).toBe(0);
  });

  it('has 7 steps', () => {
    expect(progress.steps).toHaveLength(7);
  });

  it('marks required steps correctly', () => {
    const required = progress.steps.filter((s) => s.required);
    expect(required.length).toBeGreaterThan(0);
    expect(required.length).toBeLessThan(7);
  });

  it('completes a step', () => {
    const updated = completeSetupStep(progress, 'clinic_info', { name: 'Glow' });
    expect(updated.steps[0].completed).toBe(true);
    expect(updated.steps[0].completedAt).toBeDefined();
    expect(updated.completionPercentage).toBeGreaterThan(0);
  });

  it('advances current step on completion', () => {
    const updated = completeSetupStep(progress, 'clinic_info');
    expect(updated.currentStep).toBe(1);
  });

  it('skips optional steps', () => {
    const updated = skipSetupStep(progress, 'add_team');
    const teamStep = updated.steps.find((s) => s.step === 'add_team');
    expect(teamStep?.skipped).toBe(true);
  });

  it('does not skip required steps', () => {
    const updated = skipSetupStep(progress, 'clinic_info');
    const step = updated.steps.find((s) => s.step === 'clinic_info');
    expect(step?.skipped).toBe(false);
  });

  it('getCurrentStep returns current step', () => {
    const step = getCurrentStep(progress);
    expect(step?.step).toBe('clinic_info');
  });

  it('isSetupComplete is false initially', () => {
    expect(isSetupComplete(progress)).toBe(false);
  });

  it('isSetupComplete is true when required steps done', () => {
    let p = progress;
    for (const step of SETUP_STEPS.filter((s) => s.required)) {
      p = completeSetupStep(p, step.step);
    }
    expect(isSetupComplete(p)).toBe(true);
  });

  it('calculates completion percentage correctly', () => {
    let p = progress;
    p = completeSetupStep(p, 'clinic_info');
    expect(p.completionPercentage).toBeGreaterThan(0);
    expect(p.completionPercentage).toBeLessThan(100);
  });
});

// ─── Onboarding Nudges ────────────────────────────────────────────

describe('Onboarding Nudges', () => {
  it('returns null for active tenants', () => {
    const tenant = createMockTenant('active');
    expect(checkStalledOnboarding(tenant)).toBeNull();
  });

  it('returns 24h nudge for recent stall', () => {
    const tenant = createMockTenant('setup_in_progress');
    tenant.lastActivityAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const nudge = checkStalledOnboarding(tenant);
    expect(nudge?.trigger).toBe('stalled_24h');
    expect(nudge?.type).toBe('in_app');
  });

  it('returns 72h nudge for 3-day stall', () => {
    const tenant = createMockTenant('setup_in_progress');
    tenant.lastActivityAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const nudge = checkStalledOnboarding(tenant);
    expect(nudge?.trigger).toBe('stalled_72h');
  });

  it('returns 7d nudge for week stall', () => {
    const tenant = createMockTenant('setup_in_progress');
    tenant.lastActivityAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const nudge = checkStalledOnboarding(tenant);
    expect(nudge?.trigger).toBe('stalled_7d');
    expect(nudge?.type).toBe('email');
  });

  it('generates completion nudge with next step', () => {
    const nextStep = SETUP_STEPS[1];
    const nudge = generateCompletionNudge('clinic_info', {
      ...initializeSetupProgress().steps[1],
    });
    expect(nudge.trigger).toBe('step_complete');
    expect(nudge.subject).toContain(nextStep.label);
  });

  it('generates final completion nudge', () => {
    const nudge = generateCompletionNudge('go_live', null);
    expect(nudge.trigger).toBe('all_complete');
  });
});

// ─── Sample Data ──────────────────────────────────────────────────

describe('Sample Data', () => {
  it('generates correct number of clients', () => {
    const clients = generateSampleClients(25);
    expect(clients).toHaveLength(25);
  });

  it('clients have required fields', () => {
    const [client] = generateSampleClients(1);
    expect(client).toHaveProperty('name');
    expect(client).toHaveProperty('email');
    expect(client).toHaveProperty('phone');
    expect(client).toHaveProperty('status');
    expect(client).toHaveProperty('totalSpent');
    expect(client).toHaveProperty('visitCount');
  });

  it('generates appointments linked to clients', () => {
    const clients = generateSampleClients(10);
    const appointments = generateSampleAppointments(clients, 20);
    expect(appointments).toHaveLength(20);
    for (const appt of appointments) {
      expect(clients.some((c) => c.name === appt.clientName)).toBe(true);
    }
  });
});

// ─── Validation ───────────────────────────────────────────────────

describe('Validation', () => {
  it('validates correct Airtable PAT', () => {
    expect(validateAirtablePAT('patABC123XYZ456789')).toBe(true);
  });

  it('rejects invalid Airtable PAT', () => {
    expect(validateAirtablePAT('invalid')).toBe(false);
    expect(validateAirtablePAT('')).toBe(false);
  });

  it('validates correct Airtable base ID', () => {
    expect(validateAirtableBaseId('app1SwhSfwe8GKUg4')).toBe(true);
  });

  it('rejects invalid Airtable base ID', () => {
    expect(validateAirtableBaseId('invalid')).toBe(false);
  });
});

// ─── Welcome Email ────────────────────────────────────────────────

describe('Welcome Email', () => {
  it('builds email with tenant details', () => {
    const tenant = createMockTenant('provisioning');
    const email = buildWelcomeEmailContent(tenant);
    expect(email.subject).toContain(tenant.clinicName);
    expect(email.body).toContain(tenant.subdomain);
    expect(email.body).toContain(tenant.ownerEmail);
  });
});

// ─── Provisioning Pipeline ────────────────────────────────────────

describe('Provisioning Pipeline', () => {
  it('creates pipeline with all steps pending', () => {
    const pipeline = createProvisioningPipeline('tn_123');
    expect(pipeline.steps).toHaveLength(7);
    expect(pipeline.overallStatus).toBe('running');
    expect(pipeline.steps.every((s) => s.status === 'pending')).toBe(true);
  });

  it('advances steps correctly', () => {
    let pipeline = createProvisioningPipeline('tn_123');
    pipeline = advanceProvisioningStep(pipeline, 'create_tenant', true);
    expect(pipeline.steps[0].status).toBe('completed');
  });

  it('marks failure correctly', () => {
    let pipeline = createProvisioningPipeline('tn_123');
    pipeline = advanceProvisioningStep(pipeline, 'create_tenant', false, 'DB error');
    expect(pipeline.steps[0].status).toBe('failed');
    expect(pipeline.overallStatus).toBe('failed');
  });

  it('gets next step', () => {
    let pipeline = createProvisioningPipeline('tn_123');
    expect(getNextProvisioningStep(pipeline)).toBe('create_tenant');
    pipeline = advanceProvisioningStep(pipeline, 'create_tenant', true);
    expect(getNextProvisioningStep(pipeline)).toBe('create_airtable_base');
  });

  it('completes pipeline when all steps done', () => {
    let pipeline = createProvisioningPipeline('tn_123');
    for (const step of pipeline.steps) {
      pipeline = advanceProvisioningStep(pipeline, step.step as any, true);
    }
    expect(pipeline.overallStatus).toBe('completed');
    expect(getNextProvisioningStep(pipeline)).toBeNull();
  });
});

// ─── Constants ────────────────────────────────────────────────────

describe('Constants', () => {
  it('has 7 setup steps', () => {
    expect(SETUP_STEPS).toHaveLength(7);
  });

  it('has service templates', () => {
    expect(SERVICE_TEMPLATES.length).toBeGreaterThan(10);
  });

  it('has 12 Airtable template tables', () => {
    expect(AIRTABLE_TEMPLATE_TABLES).toHaveLength(12);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────

function createMockTenant(status: Tenant['status']): Tenant {
  return {
    id: 'tn_test',
    clinicName: 'Test Clinic',
    subdomain: 'test-clinic',
    ownerName: 'Jane',
    ownerEmail: 'jane@test.com',
    plan: 'professional',
    status,
    stripeCustomerId: 'cus_test',
    stripeSubscriptionId: 'sub_test',
    setupProgress: initializeSetupProgress(),
    config: {
      branding: { ...DEFAULT_BRANDING },
      features: getFeaturesByPlan('professional'),
      integrations: {},
    },
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}
