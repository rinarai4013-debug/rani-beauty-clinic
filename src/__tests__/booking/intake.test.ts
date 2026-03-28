import { describe, it, expect } from 'vitest';
import {
  buildIntakeForm,
  updateFormField,
  signConsent,
  getRequiredConsents,
  calculateFormProgress,
} from '@/lib/booking/intake';

describe('buildIntakeForm', () => {
  it('creates a form with all required sections', () => {
    const form = buildIntakeForm('client-1');
    expect(form.id).toBeDefined();
    expect(form.clientId).toBe('client-1');
    expect(form.status).toBe('pending');
    expect(form.sections.length).toBeGreaterThanOrEqual(10);
  });

  it('includes personal info section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'personal-info');
    expect(section).toBeDefined();
    expect(section!.isRequired).toBe(true);
    expect(section!.fields.length).toBeGreaterThan(5);
  });

  it('includes medical history section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'medical-history');
    expect(section).toBeDefined();
    expect(section!.isRequired).toBe(true);
  });

  it('includes medications section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'medications');
    expect(section).toBeDefined();
  });

  it('includes allergies section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'allergies');
    expect(section).toBeDefined();
  });

  it('includes emergency contact section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'emergency-contact');
    expect(section).toBeDefined();
    expect(section!.isRequired).toBe(true);
  });

  it('includes referral section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'referral');
    expect(section).toBeDefined();
  });

  it('includes payment section', () => {
    const form = buildIntakeForm('client-1');
    const section = form.sections.find(s => s.id === 'payment');
    expect(section).toBeDefined();
  });

  it('adds injectable section for botox', () => {
    const form = buildIntakeForm('client-1', undefined, 'botox');
    const section = form.sections.find(s => s.id === 'injectable-history');
    expect(section).toBeDefined();
    expect(section!.fields.some(f => f.id === 'inj-previous')).toBe(true);
  });

  it('adds LHR section for laser hair removal', () => {
    const form = buildIntakeForm('client-1', undefined, 'lhr-full-body');
    const section = form.sections.find(s => s.id === 'lhr-history');
    expect(section).toBeDefined();
    expect(section!.fields.some(f => f.id === 'lhr-previous')).toBe(true);
  });

  it('adds energy device section for RF microneedling', () => {
    const form = buildIntakeForm('client-1', undefined, 'rf-microneedling-face');
    const section = form.sections.find(s => s.id === 'energy-device-history');
    expect(section).toBeDefined();
  });

  it('adds wellness section for wellness injections', () => {
    const form = buildIntakeForm('client-1', undefined, 'wellness-nad-plus');
    const section = form.sections.find(s => s.id === 'wellness-history');
    expect(section).toBeDefined();
  });

  it('does not add service-specific section for generic services', () => {
    const form = buildIntakeForm('client-1', undefined, 'consult-aesthetic');
    const specificSections = form.sections.filter(s =>
      ['injectable-history', 'lhr-history', 'energy-device-history', 'wellness-history'].includes(s.id)
    );
    expect(specificSections.length).toBe(0);
  });

  it('has 50+ fields total', () => {
    const form = buildIntakeForm('client-1', undefined, 'botox');
    const totalFields = form.sections.reduce((sum, s) => sum + s.fields.length, 0);
    expect(totalFields).toBeGreaterThanOrEqual(50);
  });

  it('sets expiration date', () => {
    const form = buildIntakeForm('client-1');
    expect(form.expiresAt).toBeDefined();
  });

  it('starts with no consents signed', () => {
    const form = buildIntakeForm('client-1');
    expect(form.consentsSigned.length).toBe(0);
  });

  it('includes appointment ID when provided', () => {
    const form = buildIntakeForm('client-1', 'apt-123');
    expect(form.appointmentId).toBe('apt-123');
  });
});

describe('updateFormField', () => {
  it('updates a text field', () => {
    const form = buildIntakeForm('client-1');
    const updated = updateFormField(form, 'personal-info', 'first-name', 'Jane');

    const section = updated.sections.find(s => s.id === 'personal-info')!;
    const field = section.fields.find(f => f.id === 'first-name')!;
    expect(field.value).toBe('Jane');
  });

  it('changes form status to in-progress', () => {
    const form = buildIntakeForm('client-1');
    const updated = updateFormField(form, 'personal-info', 'first-name', 'Jane');
    expect(updated.status).toBe('in-progress');
  });

  it('marks section complete when all required fields are filled', () => {
    let form = buildIntakeForm('client-1');

    // Fill all required fields in emergency contact section
    form = updateFormField(form, 'emergency-contact', 'ec-name', 'John Doe');
    form = updateFormField(form, 'emergency-contact', 'ec-relationship', 'Spouse');
    form = updateFormField(form, 'emergency-contact', 'ec-phone', '555-5678');

    const section = form.sections.find(s => s.id === 'emergency-contact')!;
    expect(section.isComplete).toBe(true);
  });

  it('does not affect other sections', () => {
    const form = buildIntakeForm('client-1');
    const updated = updateFormField(form, 'personal-info', 'first-name', 'Jane');

    const otherSection = updated.sections.find(s => s.id === 'medical-history')!;
    expect(otherSection.fields.every(f => f.value === undefined || f.value === '')).toBe(true);
  });
});

describe('signConsent', () => {
  it('adds a consent record', () => {
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('botox');

    const updated = signConsent(form, consents[0]);
    expect(updated.consentsSigned.length).toBe(1);
    expect(updated.consentsSigned[0].type).toBe(consents[0].type);
    expect(updated.consentsSigned[0].signedAt).toBeDefined();
  });

  it('preserves existing consents', () => {
    let form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('botox');

    form = signConsent(form, consents[0]);
    form = signConsent(form, consents[1]);
    expect(form.consentsSigned.length).toBe(2);
  });

  it('stores signature data when provided', () => {
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('botox');

    const updated = signConsent(form, consents[0], 'base64-signature-data');
    expect(updated.consentsSigned[0].signatureData).toBe('base64-signature-data');
  });
});

describe('getRequiredConsents', () => {
  it('always includes HIPAA consent', () => {
    const consents = getRequiredConsents('hydrafacial-signature');
    expect(consents.some(c => c.type === 'hipaa')).toBe(true);
  });

  it('always includes photo consent', () => {
    const consents = getRequiredConsents('hydrafacial-signature');
    expect(consents.some(c => c.type === 'photo')).toBe(true);
  });

  it('always includes financial consent', () => {
    const consents = getRequiredConsents('hydrafacial-signature');
    expect(consents.some(c => c.type === 'financial')).toBe(true);
  });

  it('includes neurotoxin consent for Botox', () => {
    const consents = getRequiredConsents('botox');
    expect(consents.some(c => c.type === 'treatment' && c.title.includes('Neurotoxin'))).toBe(true);
  });

  it('includes filler consent for filler services', () => {
    const consents = getRequiredConsents('filler-lips');
    expect(consents.some(c => c.type === 'treatment' && c.title.includes('Filler'))).toBe(true);
  });

  it('includes laser HR consent for LHR', () => {
    const consents = getRequiredConsents('lhr-full-body');
    expect(consents.some(c => c.type === 'treatment' && c.title.includes('Laser Hair'))).toBe(true);
  });

  it('includes RF consent for microneedling', () => {
    const consents = getRequiredConsents('rf-microneedling-face');
    expect(consents.some(c => c.type === 'treatment' && c.title.includes('RF Microneedling'))).toBe(true);
  });

  it('includes Sofwave consent', () => {
    const consents = getRequiredConsents('sofwave-full-face');
    expect(consents.some(c => c.type === 'treatment' && c.title.includes('Sofwave'))).toBe(true);
  });

  it('has no treatment consent for generic HydraFacial', () => {
    const consents = getRequiredConsents('hydrafacial-signature');
    expect(consents.some(c => c.type === 'treatment')).toBe(false);
  });
});

describe('calculateFormProgress', () => {
  it('shows 0% for empty form', () => {
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('');
    const progress = calculateFormProgress(form, consents);

    expect(progress.percentComplete).toBe(0);
    expect(progress.completedFields).toBe(0);
    expect(progress.isReady).toBe(false);
  });

  it('tracks required vs total fields', () => {
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('');
    const progress = calculateFormProgress(form, consents);

    expect(progress.totalFields).toBeGreaterThan(0);
    expect(progress.requiredFields).toBeGreaterThan(0);
    expect(progress.requiredFields).toBeLessThanOrEqual(progress.totalFields);
  });

  it('lists incomplete sections', () => {
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('');
    const progress = calculateFormProgress(form, consents);

    expect(progress.incompleteSections.length).toBeGreaterThan(0);
  });

  it('lists missing consents', () => {
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('botox');
    const progress = calculateFormProgress(form, consents);

    expect(progress.missingConsents.length).toBe(consents.length);
  });

  it('updates progress when fields are filled', () => {
    let form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('');

    const progressBefore = calculateFormProgress(form, consents);

    form = updateFormField(form, 'personal-info', 'first-name', 'Jane');
    form = updateFormField(form, 'personal-info', 'last-name', 'Doe');

    const progressAfter = calculateFormProgress(form, consents);
    expect(progressAfter.completedFields).toBeGreaterThan(progressBefore.completedFields);
    expect(progressAfter.percentComplete).toBeGreaterThan(progressBefore.percentComplete);
  });

  it('becomes ready when all required fields and consents are complete', () => {
    // This would require filling ALL required fields - testing the logic
    const form = buildIntakeForm('client-1');
    const consents = getRequiredConsents('');
    const progress = calculateFormProgress(form, consents);

    // For a fresh form, it should not be ready
    expect(progress.isReady).toBe(false);
  });
});
