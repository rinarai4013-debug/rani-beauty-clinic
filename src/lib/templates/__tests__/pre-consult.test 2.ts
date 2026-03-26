// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  PRE_CONSULT_SEQUENCE,
  getPreConsultTemplate,
  getAllPreConsultTemplates,
  type PreConsultVars,
} from '../pre-consult';

const baseVars: PreConsultVars = {
  firstName: 'Emily',
  serviceName: 'Laser Hair Removal',
  serviceCategory: 'laser',
  providerName: 'Mom',
  appointmentDate: 'March 25, 2026',
  appointmentTime: '2:30 PM',
  duration: 60,
  isNewClient: false,
  depositPaid: true,
  depositAmount: 150,
};

// ── PRE_CONSULT_SEQUENCE ──

describe('PRE_CONSULT_SEQUENCE', () => {
  it('has exactly 3 steps', () => {
    expect(PRE_CONSULT_SEQUENCE).toHaveLength(3);
  });

  it('steps are booking-confirmation, 24h-reminder, 2h-reminder', () => {
    expect(PRE_CONSULT_SEQUENCE[0].name).toBe('booking-confirmation');
    expect(PRE_CONSULT_SEQUENCE[1].name).toBe('24h-reminder');
    expect(PRE_CONSULT_SEQUENCE[2].name).toBe('2h-reminder');
  });

  it('booking-confirmation has 0 delay', () => {
    expect(PRE_CONSULT_SEQUENCE[0].delayHours).toBe(0);
  });

  it('24h-reminder has -24 delay (before appointment)', () => {
    expect(PRE_CONSULT_SEQUENCE[1].delayHours).toBe(-24);
  });

  it('2h-reminder has -2 delay (before appointment)', () => {
    expect(PRE_CONSULT_SEQUENCE[2].delayHours).toBe(-2);
  });
});

// ── getPreConsultTemplate ──

describe('getPreConsultTemplate', () => {
  it('returns null for unknown step name', () => {
    expect(getPreConsultTemplate('nonexistent', baseVars)).toBeNull();
  });

  it('returns sms, emailSubject, emailBody for booking-confirmation', () => {
    const result = getPreConsultTemplate('booking-confirmation', baseVars);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('sms');
    expect(result).toHaveProperty('emailSubject');
    expect(result).toHaveProperty('emailBody');
  });

  it('substitutes firstName in email subject', () => {
    const result = getPreConsultTemplate('booking-confirmation', baseVars);
    expect(result!.emailSubject).toContain('Emily');
  });

  it('substitutes appointmentDate and appointmentTime in SMS', () => {
    const result = getPreConsultTemplate('booking-confirmation', baseVars);
    expect(result!.sms).toContain('March 25, 2026');
    expect(result!.sms).toContain('2:30 PM');
  });

  it('substitutes serviceName in email body', () => {
    const result = getPreConsultTemplate('booking-confirmation', baseVars);
    expect(result!.emailBody).toContain('Laser Hair Removal');
  });

  it('substitutes duration in email body', () => {
    const result = getPreConsultTemplate('booking-confirmation', baseVars);
    expect(result!.emailBody).toContain('60 minutes');
  });

  it('substitutes providerName in email body', () => {
    const result = getPreConsultTemplate('24h-reminder', baseVars);
    expect(result!.emailBody).toContain('Mom');
  });

  it('includes clinic address in 2h-reminder', () => {
    const result = getPreConsultTemplate('2h-reminder', baseVars);
    expect(result!.sms).toContain('401 Olympia Ave');
  });
});

// ── Service-specific prep instructions ──

describe('service-specific prep instructions', () => {
  it('24h-reminder injects laser prep instructions for laser category', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'laser' });
    expect(result!.sms).toContain('sun exposure');
  });

  it('24h-reminder injects injectable prep for injectable category', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'injectable' });
    expect(result!.sms).toContain('blood-thinning');
  });

  it('24h-reminder injects facial prep for facial category', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'facial' });
    expect(result!.sms).toContain('makeup-free');
  });

  it('24h-reminder injects wellness prep for wellness category', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'wellness' });
    expect(result!.sms).toContain('Fast');
  });

  it('24h-reminder injects body prep for body category', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'body' });
    expect(result!.sms).toContain('loose-fitting');
  });

  it('24h-reminder falls back to consult prep for unknown category', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'unknown' });
    expect(result!.sms).toContain('goals');
  });

  it('24h-reminder includes prep list HTML in email body', () => {
    const result = getPreConsultTemplate('24h-reminder', { ...baseVars, serviceCategory: 'laser' });
    expect(result!.emailBody).toContain('<li');
    expect(result!.emailBody).toContain('sun exposure');
  });
});

// ── New client addons ──

describe('new client addons', () => {
  it('adds new client instructions to booking-confirmation for new clients', () => {
    const newClient = { ...baseVars, isNewClient: true };
    const result = getPreConsultTemplate('booking-confirmation', newClient);
    expect(result!.sms).toContain('arrive 10 minutes early');
    expect(result!.sms).toContain('photo ID');
  });

  it('does NOT add new client instructions for returning clients', () => {
    const returning = { ...baseVars, isNewClient: false };
    const result = getPreConsultTemplate('booking-confirmation', returning);
    expect(result!.sms).not.toContain('arrive 10 minutes early');
  });

  it('new client addon includes HTML in email body', () => {
    const newClient = { ...baseVars, isNewClient: true };
    const result = getPreConsultTemplate('booking-confirmation', newClient);
    expect(result!.emailBody).toContain('First Visit');
    expect(result!.emailBody).toContain('photo ID');
  });

  it('new client addon is only on booking-confirmation, not other steps', () => {
    const newClient = { ...baseVars, isNewClient: true };
    const reminder = getPreConsultTemplate('24h-reminder', newClient);
    expect(reminder!.sms).not.toContain('arrive 10 minutes early');
  });
});

// ── getAllPreConsultTemplates ──

describe('getAllPreConsultTemplates', () => {
  it('returns 3 templates', () => {
    const all = getAllPreConsultTemplates(baseVars);
    expect(all).toHaveLength(3);
  });

  it('each template has name, delayHours, and rendered content', () => {
    const all = getAllPreConsultTemplates(baseVars);
    for (const tpl of all) {
      expect(tpl).toHaveProperty('name');
      expect(tpl).toHaveProperty('delayHours');
      expect(tpl).toHaveProperty('sms');
      expect(tpl).toHaveProperty('emailSubject');
      expect(tpl).toHaveProperty('emailBody');
    }
  });

  it('no raw {{firstName}} placeholders remain', () => {
    const all = getAllPreConsultTemplates(baseVars);
    for (const tpl of all) {
      expect(tpl.sms).not.toContain('{{firstName}}');
      expect(tpl.emailBody).not.toContain('{{firstName}}');
    }
  });
});
