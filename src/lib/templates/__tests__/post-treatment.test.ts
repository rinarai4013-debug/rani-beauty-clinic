// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  POST_TREATMENT_SEQUENCE,
  getPostTreatmentTemplate,
  getAllPostTreatmentTemplates,
  getAftercareLinkForService,
  getNextRecommendedService,
  AFTERCARE_LINKS,
  NEXT_TREATMENT_MAP,
  type TemplateVars,
} from '../post-treatment';

const baseVars: TemplateVars = {
  firstName: 'Sarah',
  serviceName: 'HydraFacial',
  providerName: 'Rina',
  appointmentDate: 'March 20, 2026',
  nextRecommendedService: 'a follow-up HydraFacial or VI Peel',
  reviewLink: 'https://g.page/r/ranibeautyclinic/review',
  bookingLink: 'https://www.ranibeautyclinic.com/contact',
  aftercareLink: 'https://www.ranibeautyclinic.com/services/hydrafacial#aftercare',
};

// ── POST_TREATMENT_SEQUENCE ──

describe('POST_TREATMENT_SEQUENCE', () => {
  it('has exactly 5 steps', () => {
    expect(POST_TREATMENT_SEQUENCE).toHaveLength(5);
  });

  it('steps are in order: immediate, 24h, 72h, 7d, 30d', () => {
    expect(POST_TREATMENT_SEQUENCE[0].name).toBe('immediate');
    expect(POST_TREATMENT_SEQUENCE[1].name).toBe('24h-checkin');
    expect(POST_TREATMENT_SEQUENCE[2].name).toBe('72h-review');
    expect(POST_TREATMENT_SEQUENCE[3].name).toBe('7d-results');
    expect(POST_TREATMENT_SEQUENCE[4].name).toBe('30d-rebook');
  });

  it('delay hours increase across the sequence', () => {
    expect(POST_TREATMENT_SEQUENCE[0].delayHours).toBe(0);
    expect(POST_TREATMENT_SEQUENCE[1].delayHours).toBe(24);
    expect(POST_TREATMENT_SEQUENCE[2].delayHours).toBe(72);
    expect(POST_TREATMENT_SEQUENCE[3].delayHours).toBe(168);
    expect(POST_TREATMENT_SEQUENCE[4].delayHours).toBe(720);
  });
});

// ── getPostTreatmentTemplate ──

describe('getPostTreatmentTemplate', () => {
  it('returns null for an unknown step name', () => {
    expect(getPostTreatmentTemplate('nonexistent', baseVars)).toBeNull();
  });

  it('returns sms, emailSubject, and emailBody for a valid step', () => {
    const result = getPostTreatmentTemplate('immediate', baseVars);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('sms');
    expect(result).toHaveProperty('emailSubject');
    expect(result).toHaveProperty('emailBody');
  });

  it('substitutes firstName in the email subject', () => {
    const result = getPostTreatmentTemplate('24h-checkin', baseVars);
    expect(result!.emailSubject).toContain('Sarah');
  });

  it('substitutes serviceName in SMS', () => {
    const result = getPostTreatmentTemplate('immediate', baseVars);
    expect(result!.sms).toContain('HydraFacial');
  });

  it('substitutes providerName in email body', () => {
    const result = getPostTreatmentTemplate('immediate', baseVars);
    expect(result!.emailBody).toContain('Rina');
  });

  it('substitutes aftercareLink in immediate template', () => {
    const result = getPostTreatmentTemplate('immediate', baseVars);
    expect(result!.sms).toContain('hydrafacial#aftercare');
    expect(result!.emailBody).toContain('hydrafacial#aftercare');
  });

  it('substitutes reviewLink in 72h template', () => {
    const result = getPostTreatmentTemplate('72h-review', baseVars);
    expect(result!.sms).toContain('ranibeautyclinic/review');
  });

  it('substitutes bookingLink in 7d template', () => {
    const result = getPostTreatmentTemplate('7d-results', baseVars);
    expect(result!.sms).toContain('ranibeautyclinic.com/contact');
  });

  it('uses default aftercare link when none provided', () => {
    const noAftercare = { ...baseVars, aftercareLink: undefined };
    const result = getPostTreatmentTemplate('immediate', noAftercare);
    expect(result!.sms).toContain('ranibeautyclinic.com/safety');
  });

  it('uses default booking link when none provided', () => {
    const noBooking = { ...baseVars, bookingLink: undefined };
    const result = getPostTreatmentTemplate('30d-rebook', noBooking);
    expect(result!.sms).toContain('ranibeautyclinic.com/contact');
  });

  it('30d template mentions membership', () => {
    const result = getPostTreatmentTemplate('30d-rebook', baseVars);
    expect(result!.emailBody).toContain('Membership');
  });
});

// ── getAllPostTreatmentTemplates ──

describe('getAllPostTreatmentTemplates', () => {
  it('returns 5 rendered templates', () => {
    const all = getAllPostTreatmentTemplates(baseVars);
    expect(all).toHaveLength(5);
  });

  it('each template has name, delayHours, sms, emailSubject, emailBody', () => {
    const all = getAllPostTreatmentTemplates(baseVars);
    for (const tpl of all) {
      expect(tpl).toHaveProperty('name');
      expect(tpl).toHaveProperty('delayHours');
      expect(tpl).toHaveProperty('sms');
      expect(tpl).toHaveProperty('emailSubject');
      expect(tpl).toHaveProperty('emailBody');
    }
  });

  it('all templates have variables substituted (no raw {{firstName}})', () => {
    const all = getAllPostTreatmentTemplates(baseVars);
    for (const tpl of all) {
      expect(tpl.sms).not.toContain('{{firstName}}');
      expect(tpl.emailBody).not.toContain('{{firstName}}');
    }
  });
});

// ── getAftercareLinkForService ──

describe('getAftercareLinkForService', () => {
  it('returns the Botox aftercare link for "Botox"', () => {
    const link = getAftercareLinkForService('Botox');
    expect(link).toContain('botox-dysport#aftercare');
  });

  it('matches case-insensitively', () => {
    const link = getAftercareLinkForService('hydrafacial signature');
    expect(link).toContain('hydrafacial#aftercare');
  });

  it('returns general safety page for unknown service', () => {
    const link = getAftercareLinkForService('Mystery Treatment');
    expect(link).toBe('https://www.ranibeautyclinic.com/safety');
  });

  it('covers all services in AFTERCARE_LINKS', () => {
    for (const [service, expected] of Object.entries(AFTERCARE_LINKS)) {
      const link = getAftercareLinkForService(service);
      expect(link).toBe(expected);
    }
  });
});

// ── getNextRecommendedService ──

describe('getNextRecommendedService', () => {
  it('returns follow-up recommendation for HydraFacial', () => {
    const next = getNextRecommendedService('HydraFacial');
    expect(next).toContain('HydraFacial');
  });

  it('returns annual maintenance for Sofwave', () => {
    const next = getNextRecommendedService('Sofwave');
    expect(next).toContain('annual');
  });

  it('returns generic fallback for unknown service', () => {
    const next = getNextRecommendedService('Unknown Service');
    expect(next).toBe('your next treatment');
  });

  it('matches case-insensitively', () => {
    const next = getNextRecommendedService('botox full face');
    expect(next).toContain('Botox');
  });

  it('covers all services in NEXT_TREATMENT_MAP', () => {
    for (const service of Object.keys(NEXT_TREATMENT_MAP)) {
      const next = getNextRecommendedService(service);
      expect(next).not.toBe('your next treatment');
    }
  });
});
