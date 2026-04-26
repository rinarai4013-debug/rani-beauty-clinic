import { describe, expect, it } from 'vitest';
import type { ConsultationSubmitData } from '@/lib/consultation/schema';
import {
  buildMastermindMedicalOptimization,
  deriveRequestedMedicalTrack,
} from '../medical-optimization';

function intake(data: Record<string, unknown>): Partial<ConsultationSubmitData> {
  return data as Partial<ConsultationSubmitData>;
}

describe('Mastermind medical optimization packet', () => {
  it('defaults aesthetic-only consults to peptide/wellness instead of GLP-1', () => {
    const track = deriveRequestedMedicalTrack({
      skinConcerns: ['hyperpigmentation', 'aging-skin'],
      goals: 'brighter skin and stronger recovery',
    });

    expect(track).toBe('peptides');
  });

  it('creates a provider-safe peptide matrix with dose references when peptide signals are present', () => {
    const packet = buildMastermindMedicalOptimization(intake({
      firstName: 'Peptide',
      lastName: 'Candidate',
      email: 'peptide-candidate@audit.local',
      skinConcerns: ['skin-laxity'],
      treatmentInterests: ['peptide therapy', 'NAD'],
      goals: 'recovery, energy, longevity, performance',
      requiresLabWork: true,
      weightLbs: 180,
      peptideTolerance: 'standard',
    }));

    expect(packet.providerSignoffRequired).toBe(true);
    expect(packet.recommendedTrack).toBe('peptides');
    expect(packet.dosageFramework.personalizedPeptidePlan?.candidates.length).toBeGreaterThan(0);
    expect(packet.dosageFramework.providerAuthorizationNote).toMatch(/PROVIDER AUTHORIZATION REQUIRED/i);
    expect(packet.recommendedProducts.length).toBeGreaterThan(0);
  });

  it('keeps pancreatitis patients safety-gated away from automatic GLP-1 clearance', () => {
    const packet = buildMastermindMedicalOptimization(intake({
      firstName: 'Safety',
      lastName: 'Gate',
      email: 'safety-gate@audit.local',
      treatmentInterests: ['GLP-1 weight loss'],
      goals: 'weight loss and body recomposition',
      skinConcerns: ['body-contouring'],
      medicalHistory: 'acute pancreatitis flare in 2024',
      medications: 'history of pancreatitis documented',
    }));

    expect(packet.requestedTrack).toBe('glp1');
    expect(packet.status).not.toBe('eligible');
    expect(packet.blockedTracks).toContain('glp1');
    expect(packet.riskFlags.join(' ')).toMatch(/pancreatitis/i);
  });
});
