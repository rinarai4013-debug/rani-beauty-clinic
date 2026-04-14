import { describe, expect, it } from 'vitest';
import { metabolicIntakeSchema } from '@/lib/metabolic/matrix';
import { buildUnifiedIntakeDecisionBundle } from '@/lib/metabolic/unified-intake-engine';

const baseIntake = metabolicIntakeSchema.parse({
  firstName: 'Test',
  lastName: 'Patient',
  email: 'test@example.com',
  phone: '425-555-0000',
  goals: ['weight-loss', 'body-recomposition'],
  symptoms: ['appetite-dysregulation', 'sugar-cravings'],
  fulfillmentPreference: 'clinic',
  medicalFlags: {
    pregnant: false,
    breastfeeding: false,
    thyroidCancerHistory: false,
    pancreatitisHistory: false,
    gallbladderDisease: false,
    uncontrolledHypertension: false,
    severeDepression: false,
    eatingDisorderHistory: false,
  },
  labs: {
    baselineLabsCompleted: true,
  },
});

describe('buildUnifiedIntakeDecisionBundle', () => {
  it('returns a primary track plus 3 alternatives', () => {
    const bundle = buildUnifiedIntakeDecisionBundle(baseIntake);

    expect(bundle.primaryTrack).toBe(bundle.primary.track);
    expect(bundle.alternatives).toHaveLength(3);
    expect(bundle.allTracks).toHaveLength(4);
  });

  it('builds package options and checkout paths per track', () => {
    const bundle = buildUnifiedIntakeDecisionBundle(baseIntake);
    const peptideProgram = bundle.allTracks.find((program) => program.track === 'peptides');
    const glpProgram = bundle.allTracks.find((program) => program.track === 'glp1');

    expect(peptideProgram).toBeDefined();
    expect(glpProgram).toBeDefined();
    expect(peptideProgram?.checkout.home).toContain('/peptide/intake?checkout=home');
    expect(glpProgram?.checkout.clinic).toContain('/glp1/intake?checkout=clinic&track=glp1');
    expect(glpProgram?.packages.length).toBeGreaterThan(0);
  });
});
