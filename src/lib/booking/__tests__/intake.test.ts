import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildIntakeForm,
  calculateFormProgress,
  getRequiredConsents,
  signConsent,
  updateFormField,
} from '@/lib/booking/intake';

describe('booking/intake', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds the base intake form with service-specific sections when needed', () => {
    const form = buildIntakeForm('client-1', 'apt-1', 'botox');

    expect(form.status).toBe('pending');
    expect(form.sections.some(section => section.id === 'injectable-history')).toBe(true);
    expect(form.expiresAt).toBe('2026-04-17');
  });

  it('switches service-specific section types for laser and wellness services', () => {
    const lhrForm = buildIntakeForm('client-1', 'apt-2', 'lhr-upper-lip');
    const wellnessForm = buildIntakeForm('client-1', 'apt-3', 'wellness-vitamin-d3');

    expect(lhrForm.sections.some(section => section.id === 'lhr-history')).toBe(true);
    expect(wellnessForm.sections.some(section => section.id === 'wellness-history')).toBe(true);
  });

  it('returns base and treatment-specific consents', () => {
    const botoxConsents = getRequiredConsents('botox');
    const hydrafacialConsents = getRequiredConsents('hydrafacial-signature');

    expect(botoxConsents).toHaveLength(4);
    expect(botoxConsents.some(consent => consent.title === 'Neurotoxin Injection Informed Consent')).toBe(true);
    expect(hydrafacialConsents).toHaveLength(3);
  });

  it('updates fields and marks a section complete once all required values are present', () => {
    let form = buildIntakeForm('client-1');

    form = updateFormField(form, 'emergency-contact', 'ec-name', 'Mom');
    form = updateFormField(form, 'emergency-contact', 'ec-relationship', 'Mother');
    form = updateFormField(form, 'emergency-contact', 'ec-phone', '4255550100');

    const section = form.sections.find(item => item.id === 'emergency-contact');
    expect(form.status).toBe('in-progress');
    expect(section?.isComplete).toBe(true);
  });

  it('tracks progress and missing consents separately', () => {
    let form = buildIntakeForm('client-1', 'apt-1', 'botox');
    const requiredConsents = getRequiredConsents('botox');

    form = updateFormField(form, 'personal-info', 'first-name', 'Rina');
    const progress = calculateFormProgress(form, requiredConsents);

    expect(progress.completedFields).toBeGreaterThan(0);
    expect(progress.percentComplete).toBeGreaterThan(0);
    expect(progress.isReady).toBe(false);
    expect(progress.missingConsents.length).toBe(4);
  });

  it('records signed consent entries with timestamps and versions', () => {
    const form = buildIntakeForm('client-1', 'apt-1', 'botox');
    const consent = getRequiredConsents('botox')[0];
    const signed = signConsent(form, consent, 'base64-signature');

    expect(signed.consentsSigned).toHaveLength(1);
    expect(signed.consentsSigned[0]).toMatchObject({
      type: consent.type,
      title: consent.title,
      version: consent.version,
      signatureData: 'base64-signature',
    });
  });
});
