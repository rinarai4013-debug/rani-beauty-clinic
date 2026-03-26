// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  getReactivationTier,
  getReactivationTemplate,
  getAutoReactivationTemplate,
  REACTIVATION_TEMPLATES,
  type ReactivationVars,
  type ReactivationTier,
} from '../reactivation';

const baseVars: ReactivationVars = {
  firstName: 'Jessica',
  lastService: 'HydraFacial',
  daysSinceLastVisit: 35,
  ltv: 2500,
};

// ── getReactivationTier ──

describe('getReactivationTier', () => {
  it('returns lapsed-30 for 30 days', () => {
    expect(getReactivationTier(30)).toBe('lapsed-30');
  });

  it('returns lapsed-30 for 35 days', () => {
    expect(getReactivationTier(35)).toBe('lapsed-30');
  });

  it('returns lapsed-30 for 59 days (just under 60)', () => {
    expect(getReactivationTier(59)).toBe('lapsed-30');
  });

  it('returns lapsed-60 for exactly 60 days', () => {
    expect(getReactivationTier(60)).toBe('lapsed-60');
  });

  it('returns lapsed-60 for 75 days', () => {
    expect(getReactivationTier(75)).toBe('lapsed-60');
  });

  it('returns lapsed-60 for 89 days', () => {
    expect(getReactivationTier(89)).toBe('lapsed-60');
  });

  it('returns lapsed-90 for exactly 90 days', () => {
    expect(getReactivationTier(90)).toBe('lapsed-90');
  });

  it('returns lapsed-90 for 120 days', () => {
    expect(getReactivationTier(120)).toBe('lapsed-90');
  });

  it('returns lapsed-90 for 365 days', () => {
    expect(getReactivationTier(365)).toBe('lapsed-90');
  });

  it('returns lapsed-30 for very low values', () => {
    expect(getReactivationTier(1)).toBe('lapsed-30');
    expect(getReactivationTier(0)).toBe('lapsed-30');
  });
});

// ── getReactivationTemplate ──

describe('getReactivationTemplate', () => {
  it('returns sms, emailSubject, and emailBody for lapsed-30', () => {
    const result = getReactivationTemplate('lapsed-30', baseVars);
    expect(result).toHaveProperty('sms');
    expect(result).toHaveProperty('emailSubject');
    expect(result).toHaveProperty('emailBody');
  });

  it('substitutes firstName in email subject', () => {
    const result = getReactivationTemplate('lapsed-30', baseVars);
    expect(result.emailSubject).toContain('Jessica');
  });

  it('substitutes lastService in SMS', () => {
    const result = getReactivationTemplate('lapsed-30', baseVars);
    expect(result.sms).toContain('HydraFacial');
  });

  it('includes booking URL in SMS', () => {
    const result = getReactivationTemplate('lapsed-60', baseVars);
    expect(result.sms).toContain('ranibeautyclinic.com/contact');
  });

  it('lapsed-60 mentions complimentary consultation', () => {
    const result = getReactivationTemplate('lapsed-60', baseVars);
    expect(result.emailBody).toContain('complimentary');
  });

  it('lapsed-90 mentions returning angel pricing', () => {
    const result = getReactivationTemplate('lapsed-90', baseVars);
    expect(result.emailBody).toContain('returning angel');
  });

  it('lapsed-90 includes phone number', () => {
    const result = getReactivationTemplate('lapsed-90', baseVars);
    expect(result.emailBody).toContain('(425) 207-8883');
  });

  it('all tiers produce non-empty SMS and email', () => {
    const tiers: ReactivationTier[] = ['lapsed-30', 'lapsed-60', 'lapsed-90'];
    for (const tier of tiers) {
      const result = getReactivationTemplate(tier, baseVars);
      expect(result.sms.length).toBeGreaterThan(10);
      expect(result.emailSubject.length).toBeGreaterThan(5);
      expect(result.emailBody.length).toBeGreaterThan(50);
    }
  });

  it('no raw {{firstName}} placeholders remain after substitution', () => {
    const tiers: ReactivationTier[] = ['lapsed-30', 'lapsed-60', 'lapsed-90'];
    for (const tier of tiers) {
      const result = getReactivationTemplate(tier, baseVars);
      expect(result.sms).not.toContain('{{firstName}}');
      expect(result.emailBody).not.toContain('{{firstName}}');
    }
  });
});

// ── getAutoReactivationTemplate ──

describe('getAutoReactivationTemplate', () => {
  it('auto-selects lapsed-30 for 35 days', () => {
    const result = getAutoReactivationTemplate({ ...baseVars, daysSinceLastVisit: 35 });
    expect(result.tier).toBe('lapsed-30');
  });

  it('auto-selects lapsed-60 for 70 days', () => {
    const result = getAutoReactivationTemplate({ ...baseVars, daysSinceLastVisit: 70 });
    expect(result.tier).toBe('lapsed-60');
  });

  it('auto-selects lapsed-90 for 100 days', () => {
    const result = getAutoReactivationTemplate({ ...baseVars, daysSinceLastVisit: 100 });
    expect(result.tier).toBe('lapsed-90');
  });

  it('includes rendered sms, emailSubject, emailBody alongside tier', () => {
    const result = getAutoReactivationTemplate(baseVars);
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('sms');
    expect(result).toHaveProperty('emailSubject');
    expect(result).toHaveProperty('emailBody');
  });

  it('substitutes daysSinceLastVisit properly', () => {
    const vars = { ...baseVars, daysSinceLastVisit: 42 };
    const result = getAutoReactivationTemplate(vars);
    // The templates don't use daysSinceLastVisit directly in text,
    // but the tier selection should reflect it
    expect(result.tier).toBe('lapsed-30');
  });
});

// ── REACTIVATION_TEMPLATES ──

describe('REACTIVATION_TEMPLATES', () => {
  it('has exactly 3 tiers', () => {
    expect(Object.keys(REACTIVATION_TEMPLATES)).toHaveLength(3);
  });

  it('contains lapsed-30, lapsed-60, lapsed-90', () => {
    expect(REACTIVATION_TEMPLATES).toHaveProperty('lapsed-30');
    expect(REACTIVATION_TEMPLATES).toHaveProperty('lapsed-60');
    expect(REACTIVATION_TEMPLATES).toHaveProperty('lapsed-90');
  });

  it('each tier has sms, emailSubject, emailBody templates', () => {
    for (const tier of Object.values(REACTIVATION_TEMPLATES)) {
      expect(tier).toHaveProperty('sms');
      expect(tier).toHaveProperty('emailSubject');
      expect(tier).toHaveProperty('emailBody');
    }
  });
});
