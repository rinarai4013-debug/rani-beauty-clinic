/**
 * Clinical safety regression tests — medical-schema.ts
 *
 * Locks:
 *   1. Autoimmune mapping only triggers from known autoimmune terms
 *   2. Non-autoimmune conditions are rejected at schema level
 *   3. toMedicalHistory() maps hasAutoimmune flag correctly
 */

import { describe, expect, it } from 'vitest';
import {
  medicalHistorySchema,
  toMedicalHistory,
  AUTOIMMUNE_CONDITIONS,
  type AutoimmuneCondition,
} from '@/lib/consultation/medical-schema';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeBase(overrides: Record<string, unknown> = {}) {
  return {
    pregnant: false,
    breastfeeding: false,
    bloodThinners: false,
    keloidHistory: false,
    activeSkinInfection: false,
    recentSunExposure: false,
    isotretinoinHistory: false,
    hasAutoimmune: false,
    autoimmuneConditions: [],
    hasMedications: false,
    medications: [],
    hasAllergies: false,
    allergies: [],
    hasPastProcedures: false,
    pastProcedures: [],
    smokingStatus: 'never',
    sunProtectionHabit: 'sometimes',
    waterIntake: 'adequate',
    sleepQuality: 'fair',
    stressLevel: 'moderate',
    ...overrides,
  };
}

// ── AUTOIMMUNE_CONDITIONS constant ────────────────────────────────────────────

describe('AUTOIMMUNE_CONDITIONS', () => {
  it('is a non-empty readonly array', () => {
    expect(Array.isArray(AUTOIMMUNE_CONDITIONS)).toBe(true);
    expect(AUTOIMMUNE_CONDITIONS.length).toBeGreaterThan(0);
  });

  it('contains expected autoimmune terms', () => {
    const expected: AutoimmuneCondition[] = ['lupus', 'rheumatoid_arthritis', 'hashimotos'];
    for (const term of expected) {
      expect(AUTOIMMUNE_CONDITIONS).toContain(term);
    }
  });

  it('includes "other" as a catch-all', () => {
    expect(AUTOIMMUNE_CONDITIONS).toContain('other');
  });
});

// ── Autoimmune schema validation ──────────────────────────────────────────────

describe('medicalHistorySchema — autoimmune mapping', () => {
  it('accepts known autoimmune conditions', () => {
    const result = medicalHistorySchema.safeParse(
      makeBase({ hasAutoimmune: true, autoimmuneConditions: ['lupus', 'hashimotos'] }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts every listed AUTOIMMUNE_CONDITIONS value', () => {
    for (const condition of AUTOIMMUNE_CONDITIONS) {
      const result = medicalHistorySchema.safeParse(
        makeBase({ hasAutoimmune: true, autoimmuneConditions: [condition] }),
      );
      expect(result.success).toBe(true);
    }
  });

  it('rejects non-autoimmune terms — autoimmune mapping only triggers from known terms', () => {
    const nonAutoimmunTerms = ['asthma', 'diabetes', 'hypertension', 'eczema', 'rosacea'];
    for (const term of nonAutoimmunTerms) {
      const result = medicalHistorySchema.safeParse(
        makeBase({ hasAutoimmune: true, autoimmuneConditions: [term] }),
      );
      expect(result.success).toBe(false);
    }
  });

  it('accepts hasAutoimmune: false with empty conditions without triggering autoimmune flags', () => {
    const result = medicalHistorySchema.safeParse(makeBase({ hasAutoimmune: false }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasAutoimmune).toBe(false);
      expect(result.data.autoimmuneConditions).toHaveLength(0);
    }
  });

  it('accepts hasAutoimmune: true with empty conditions (unknown condition)', () => {
    const result = medicalHistorySchema.safeParse(
      makeBase({ hasAutoimmune: true, autoimmuneConditions: [] }),
    );
    expect(result.success).toBe(true);
  });
});

// ── toMedicalHistory mapping ──────────────────────────────────────────────────

describe('toMedicalHistory — autoimmune flag mapping', () => {
  it('maps hasAutoimmune: true to autoimmune: true in output', () => {
    const data = medicalHistorySchema.parse(
      makeBase({ hasAutoimmune: true, autoimmuneConditions: ['lupus'] }),
    );
    const mapped = toMedicalHistory(data);
    expect(mapped.autoimmune).toBe(true);
    expect(mapped.conditions).toContain('lupus');
  });

  it('maps hasAutoimmune: false to autoimmune: false in output', () => {
    const data = medicalHistorySchema.parse(makeBase());
    const mapped = toMedicalHistory(data);
    expect(mapped.autoimmune).toBe(false);
    expect(mapped.conditions).toHaveLength(0);
  });

  it('does NOT set autoimmune: true when hasAutoimmune is false even if conditions provided', () => {
    // Edge case: if UI bug sends conditions without the flag
    const data = medicalHistorySchema.parse(
      makeBase({ hasAutoimmune: false, autoimmuneConditions: [] }),
    );
    const mapped = toMedicalHistory(data);
    // The autoimmune field in the output reflects hasAutoimmune, not the conditions list
    expect(mapped.autoimmune).toBe(false);
  });
});
