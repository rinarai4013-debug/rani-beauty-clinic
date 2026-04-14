import { describe, expect, it } from 'vitest';
import { generatePeptideRecommendation, recommendPeptideTier } from '@/lib/metabolic/peptide-tier-matrix';
import type { PeptideIntake } from '@/lib/metabolic/peptide-intake-schema';

function baseIntake(overrides: Partial<PeptideIntake> = {}): PeptideIntake {
  return {
    firstName: 'Test',
    lastName: 'Patient',
    email: 'test@example.com',
    phone: '425-555-0000',
    goals: ['recovery'],
    symptoms: ['slow-recovery'],
    fulfillmentPreference: 'clinic',
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
    },
    labs: {
      baselineLabsCompleted: true,
      igf1: undefined,
      crp: undefined,
      cbc: undefined,
    },
    ...overrides,
  };
}

describe('metabolic/peptide-tier-matrix recommendPeptideTier', () => {
  it('returns foundation for base recovery profile', () => {
    expect(recommendPeptideTier(baseIntake())).toBe('foundation');
  });

  it('returns performance for recovery + performance goals', () => {
    expect(
      recommendPeptideTier(
        baseIntake({ goals: ['recovery', 'performance'], symptoms: ['slow-recovery'] }),
      ),
    ).toBe('performance');
  });

  it('returns performance for inflammation + muscle loss symptom pair', () => {
    expect(
      recommendPeptideTier(
        baseIntake({ goals: ['recovery'], symptoms: ['inflammation', 'muscle-loss'] }),
      ),
    ).toBe('performance');
  });

  it('returns elite for three or more goals', () => {
    expect(
      recommendPeptideTier(
        baseIntake({ goals: ['recovery', 'performance', 'longevity'], symptoms: ['fatigue'] }),
      ),
    ).toBe('elite');
  });

  it('returns elite for performance + body-recomposition mix', () => {
    expect(
      recommendPeptideTier(
        baseIntake({
          goals: ['performance', 'body-recomposition'],
          symptoms: ['muscle-loss'],
        }),
      ),
    ).toBe('elite');
  });
});

describe('metabolic/peptide-tier-matrix recommendation output', () => {
  it('generates provider handoff and fulfillment details', () => {
    const recommendation = generatePeptideRecommendation(baseIntake());
    expect(recommendation.track).toBe('peptides');
    expect(recommendation.providerHandoff.providerSignoffRequired).toBe(true);
    expect(recommendation.providerHandoff.safetyNote.toLowerCase()).toContain(
      'provider authorization required before dispensing',
    );
    expect(recommendation.fulfillment.allowed.length).toBeGreaterThan(0);
    expect(recommendation.tiers).toHaveLength(3);
  });
});
