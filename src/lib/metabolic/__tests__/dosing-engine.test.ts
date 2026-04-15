import { describe, expect, it } from 'vitest';
import { generateDosageFramework, type DosageFramework } from '@/lib/metabolic/dosing-engine';
import type { MetabolicTrack } from '@/lib/metabolic/matrix';
import type { TierLevel } from '@/lib/metabolic/tier-matrix';

const ALL_TRACKS: MetabolicTrack[] = ['glp1', 'hormones', 'peptides', 'hybrid'];
const ALL_TIERS: TierLevel[] = ['foundation', 'performance', 'elite'];

const REQUIRED_FIELDS: (keyof DosageFramework)[] = [
  'track',
  'tier',
  'startRange',
  'cadence',
  'escalationCriteria',
  'holdRules',
  'monitoringCadence',
  'providerAuthorizationNote',
  'constrainedByStatus',
];

describe('generateDosageFramework', () => {
  it('returns a framework for every track × tier combination', () => {
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        expect(fw.track).toBe(track);
        expect(fw.tier).toBe(tier);
      }
    }
  });

  it('has no missing required fields for any track × tier combination', () => {
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        for (const field of REQUIRED_FIELDS) {
          expect(fw[field], `${track}/${tier} missing field: ${field}`).toBeDefined();
        }
      }
    }
  });

  it('startRange is a non-empty string for all combinations', () => {
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        expect(fw.startRange.length, `${track}/${tier} startRange is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('escalationCriteria, holdRules, and monitoringCadence are non-empty arrays', () => {
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        expect(fw.escalationCriteria.length, `${track}/${tier} escalationCriteria empty`).toBeGreaterThan(0);
        expect(fw.holdRules.length, `${track}/${tier} holdRules empty`).toBeGreaterThan(0);
        expect(fw.monitoringCadence.length, `${track}/${tier} monitoringCadence empty`).toBeGreaterThan(0);
      }
    }
  });

  it('providerAuthorizationNote always contains "PROVIDER AUTHORIZATION REQUIRED"', () => {
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        expect(fw.providerAuthorizationNote).toContain('PROVIDER AUTHORIZATION REQUIRED');
      }
    }
  });

  it('sets constrainedByStatus false for eligible status', () => {
    const fw = generateDosageFramework('glp1', 'foundation', 'eligible');
    expect(fw.constrainedByStatus).toBe(false);
  });

  it('sets constrainedByStatus true for provider-review-required', () => {
    const fw = generateDosageFramework('glp1', 'performance', 'provider-review-required');
    expect(fw.constrainedByStatus).toBe(true);
  });

  it('sets constrainedByStatus true for ineligible', () => {
    const fw = generateDosageFramework('hormones', 'foundation', 'ineligible');
    expect(fw.constrainedByStatus).toBe(true);
  });

  it('does not contain imperative prescribing language in key fields', () => {
    // Checks that no output uses first-person prescriptive commands
    const imperativePatterns = [
      /\btake\b/i,
      /\binject\b/i,
      /\bprescribe\b/i,
    ];
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        const textUnderTest = [fw.startRange, fw.cadence, ...fw.escalationCriteria, ...fw.holdRules].join(' ');
        for (const pattern of imperativePatterns) {
          expect(
            pattern.test(textUnderTest),
            `${track}/${tier} contains imperative language: ${pattern}`,
          ).toBe(false);
        }
      }
    }
  });

  it('cadence is a non-empty string for all combinations', () => {
    for (const track of ALL_TRACKS) {
      for (const tier of ALL_TIERS) {
        const fw = generateDosageFramework(track, tier, 'eligible');
        expect(typeof fw.cadence).toBe('string');
        expect(fw.cadence.length).toBeGreaterThan(0);
      }
    }
  });
});
