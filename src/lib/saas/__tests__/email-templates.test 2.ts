import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  getTemplate,
  getTemplatesByCategory,
  FUNNEL_EMAILS,
  ONBOARDING_EMAILS,
  BILLING_EMAILS,
  SUCCESS_EMAILS,
  ALL_TEMPLATES,
  type EmailVariables,
} from '../email-templates';

// ─── Template Rendering ───────────────────────────────────────────

describe('renderTemplate', () => {
  it('replaces single variable', () => {
    const result = renderTemplate('Hello {{name}}!', { name: 'Jane', email: 'jane@test.com', clinicName: 'Test' });
    expect(result).toBe('Hello Jane!');
  });

  it('replaces multiple variables', () => {
    const result = renderTemplate(
      '{{name}} at {{clinicName}}',
      { name: 'Jane', email: 'jane@test.com', clinicName: 'Glow Aesthetics' }
    );
    expect(result).toBe('Jane at Glow Aesthetics');
  });

  it('replaces same variable multiple times', () => {
    const result = renderTemplate(
      '{{name}} hello {{name}}',
      { name: 'Jane', email: 'jane@test.com', clinicName: 'Test' }
    );
    expect(result).toBe('Jane hello Jane');
  });

  it('leaves unmatched variables intact', () => {
    const result = renderTemplate('Hello {{unknown}}', { name: 'Jane', email: 'jane@test.com', clinicName: 'Test' });
    expect(result).toBe('Hello {{unknown}}');
  });

  it('handles numeric variables', () => {
    const result = renderTemplate(
      '{{providerCount}} providers',
      { name: 'Jane', email: 'jane@test.com', clinicName: 'Test', providerCount: 5 }
    );
    expect(result).toBe('5 providers');
  });
});

// ─── Funnel Emails ────────────────────────────────────────────────

describe('Funnel Emails', () => {
  it('has all 7 funnel emails', () => {
    const emails = Object.keys(FUNNEL_EMAILS);
    expect(emails).toContain('welcome');
    expect(emails).toContain('case_study');
    expect(emails).toContain('feature_highlight');
    expect(emails).toContain('roi_calculator');
    expect(emails).toContain('free_trial');
    expect(emails).toContain('personal_check_in');
    expect(emails).toContain('final_offer');
    expect(emails).toHaveLength(7);
  });

  it('all funnel emails have required fields', () => {
    for (const email of Object.values(FUNNEL_EMAILS)) {
      expect(email.id).toBeTruthy();
      expect(email.subject).toBeTruthy();
      expect(email.body).toBeTruthy();
      expect(email.ctaText).toBeTruthy();
      expect(email.ctaUrl).toBeTruthy();
      expect(email.category).toBe('funnel');
    }
  });

  it('welcome email contains demo link', () => {
    expect(FUNNEL_EMAILS.welcome.body).toContain('demo');
  });

  it('final offer email contains coupon code', () => {
    expect(FUNNEL_EMAILS.final_offer.body).toContain('FOUNDING50');
  });

  it('case study email contains Rani reference', () => {
    expect(FUNNEL_EMAILS.case_study.body).toContain('Rani Beauty Clinic');
  });

  it('roi email has personalization variables', () => {
    expect(FUNNEL_EMAILS.roi_calculator.body).toContain('{{roiSavings}}');
    expect(FUNNEL_EMAILS.roi_calculator.body).toContain('{{providerCount}}');
  });
});

// ─── Onboarding Emails ────────────────────────────────────────────

describe('Onboarding Emails', () => {
  it('has all onboarding emails', () => {
    expect(ONBOARDING_EMAILS).toHaveProperty('welcome_credentials');
    expect(ONBOARDING_EMAILS).toHaveProperty('stalled_24h');
    expect(ONBOARDING_EMAILS).toHaveProperty('stalled_72h');
    expect(ONBOARDING_EMAILS).toHaveProperty('setup_complete');
  });

  it('welcome email contains credentials variables', () => {
    expect(ONBOARDING_EMAILS.welcome_credentials.body).toContain('{{subdomain}}');
    expect(ONBOARDING_EMAILS.welcome_credentials.body).toContain('{{password}}');
  });

  it('all onboarding emails have category', () => {
    for (const email of Object.values(ONBOARDING_EMAILS)) {
      expect(email.category).toBe('onboarding');
    }
  });
});

// ─── Billing Emails ───────────────────────────────────────────────

describe('Billing Emails', () => {
  it('has all billing emails', () => {
    expect(BILLING_EMAILS).toHaveProperty('payment_failed');
    expect(BILLING_EMAILS).toHaveProperty('suspension_warning');
    expect(BILLING_EMAILS).toHaveProperty('invoice_paid');
  });

  it('payment failed email mentions update method', () => {
    expect(BILLING_EMAILS.payment_failed.body.toLowerCase()).toContain('payment method');
  });

  it('suspension warning has days left variable', () => {
    expect(BILLING_EMAILS.suspension_warning.body).toContain('{{daysLeft}}');
  });

  it('all billing emails have category', () => {
    for (const email of Object.values(BILLING_EMAILS)) {
      expect(email.category).toBe('billing');
    }
  });
});

// ─── Success Emails ───────────────────────────────────────────────

describe('Success Emails', () => {
  it('has all success emails', () => {
    expect(SUCCESS_EMAILS).toHaveProperty('milestone');
    expect(SUCCESS_EMAILS).toHaveProperty('feature_nudge');
    expect(SUCCESS_EMAILS).toHaveProperty('nps_survey');
    expect(SUCCESS_EMAILS).toHaveProperty('churn_save');
    expect(SUCCESS_EMAILS).toHaveProperty('referral_invite');
  });

  it('milestone email has milestone variable', () => {
    expect(SUCCESS_EMAILS.milestone.body).toContain('{{milestoneText}}');
  });

  it('feature nudge has feature variables', () => {
    expect(SUCCESS_EMAILS.feature_nudge.body).toContain('{{feature}}');
    expect(SUCCESS_EMAILS.feature_nudge.body).toContain('{{featureBenefit}}');
  });

  it('churn save offers free month', () => {
    expect(SUCCESS_EMAILS.churn_save.body.toLowerCase()).toContain('on us');
  });

  it('referral email mentions reward', () => {
    expect(SUCCESS_EMAILS.referral_invite.body.toLowerCase()).toContain('free month');
  });
});

// ─── Template Retrieval ───────────────────────────────────────────

describe('Template Retrieval', () => {
  it('getTemplate finds by ID', () => {
    const template = getTemplate('funnel_welcome');
    expect(template).toBeDefined();
    expect(template?.id).toBe('funnel_welcome');
  });

  it('getTemplate returns undefined for unknown ID', () => {
    expect(getTemplate('nonexistent')).toBeUndefined();
  });

  it('getTemplatesByCategory returns correct category', () => {
    const funnel = getTemplatesByCategory('funnel');
    expect(funnel).toHaveLength(7);
    for (const t of funnel) {
      expect(t.category).toBe('funnel');
    }
  });

  it('getTemplatesByCategory returns onboarding templates', () => {
    const onboarding = getTemplatesByCategory('onboarding');
    expect(onboarding.length).toBeGreaterThan(0);
  });

  it('getTemplatesByCategory returns billing templates', () => {
    const billing = getTemplatesByCategory('billing');
    expect(billing.length).toBeGreaterThan(0);
  });

  it('getTemplatesByCategory returns success templates', () => {
    const success = getTemplatesByCategory('success');
    expect(success.length).toBeGreaterThan(0);
  });
});

// ─── All Templates ────────────────────────────────────────────────

describe('All Templates', () => {
  it('has all templates combined', () => {
    const totalExpected =
      Object.keys(FUNNEL_EMAILS).length +
      Object.keys(ONBOARDING_EMAILS).length +
      Object.keys(BILLING_EMAILS).length +
      Object.keys(SUCCESS_EMAILS).length;
    expect(Object.keys(ALL_TEMPLATES).length).toBe(totalExpected);
  });

  it('all templates have unique IDs', () => {
    const ids = Object.values(ALL_TEMPLATES).map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all templates have valid HTML in body', () => {
    for (const template of Object.values(ALL_TEMPLATES)) {
      expect(template.body).toContain('<!DOCTYPE html>');
      expect(template.body).toContain('</html>');
    }
  });

  it('all templates have preheader text', () => {
    for (const template of Object.values(ALL_TEMPLATES)) {
      expect(template.preheader).toBeTruthy();
    }
  });
});
