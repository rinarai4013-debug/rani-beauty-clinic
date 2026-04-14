import { describe, expect, it } from 'vitest';
import { generatePeptideRecommendation } from '@/lib/metabolic/peptide-tier-matrix';
import type { PeptideIntake } from '@/lib/metabolic/peptide-intake-schema';

function intakeWithFlags(
  flags: Partial<PeptideIntake['medicalFlags']>,
  overrides: Partial<PeptideIntake> = {},
): PeptideIntake {
  return {
    firstName: 'Safety',
    lastName: 'Case',
    email: 'safety@example.com',
    phone: '425-555-0000',
    goals: ['recovery', 'performance'],
    symptoms: ['inflammation', 'muscle-loss'],
    fulfillmentPreference: 'home',
    currentMeds: '',
    source: 'test',
    medicalFlags: {
      pregnant: false,
      breastfeeding: false,
      activeCancer: false,
      organTransplant: false,
      autoimmuneSuppressed: false,
      activeInfection: false,
      bleedingDisorder: false,
      ...flags,
    },
    labs: {
      baselineLabsCompleted: true,
      igf1: undefined,
      crp: undefined,
      cbc: undefined,
      ...(overrides.labs || {}),
    },
    ...overrides,
  };
}

describe('metabolic/peptide safety gates', () => {
  it('blocks pregnancy as ineligible', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ pregnant: true }));
    expect(rec.status).toBe('ineligible');
    expect(rec.riskFlags.join(' ')).toMatch(/pregnancy|breastfeeding/i);
  });

  it('blocks breastfeeding as ineligible', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ breastfeeding: true }));
    expect(rec.status).toBe('ineligible');
  });

  it('active cancer blocks GH compounds and requires review', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ activeCancer: true }));
    expect(rec.status).toBe('provider-review-required');
    expect(rec.blockedCompounds).toEqual(expect.arrayContaining(['CJC-1295', 'Ipamorelin', 'Sermorelin']));
  });

  it('organ transplant blocks all as ineligible', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ organTransplant: true }));
    expect(rec.status).toBe('ineligible');
    expect(rec.blockedCompounds.length).toBeGreaterThan(0);
  });

  it('autoimmune suppressed blocks all as ineligible', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ autoimmuneSuppressed: true }));
    expect(rec.status).toBe('ineligible');
  });

  it('active infection requires provider review', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ activeInfection: true }));
    expect(rec.status).toBe('provider-review-required');
  });

  it('bleeding disorder requires provider review', () => {
    const rec = generatePeptideRecommendation(intakeWithFlags({ bleedingDisorder: true }));
    expect(rec.status).toBe('provider-review-required');
  });

  it('pregnancy + active cancer stays ineligible (combined)', () => {
    const rec = generatePeptideRecommendation(
      intakeWithFlags({ pregnant: true, activeCancer: true }),
    );
    expect(rec.status).toBe('ineligible');
    expect(rec.blockedCompounds.length).toBeGreaterThan(0);
  });

  it('labs incomplete blocks home for performance tier', () => {
    const rec = generatePeptideRecommendation(
      intakeWithFlags(
        {},
        {
          goals: ['recovery', 'performance'],
          symptoms: ['inflammation', 'muscle-loss'],
          labs: { baselineLabsCompleted: false },
          fulfillmentPreference: 'home',
        },
      ),
    );
    expect(rec.recommendedTier).toBe('performance');
    expect(rec.fulfillment.allowed).toEqual(['clinic']);
    expect(rec.status).toBe('provider-review-required');
  });
});
