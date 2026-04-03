/**
 * Enhanced Medical Intake — Zod Validation Schemas
 *
 * Deep medical history for the Mastermind consultation engine.
 * All fields are optional with progressive disclosure —
 * basic fields shown first, detailed follow-ups conditional on selections.
 */

import { z } from 'zod';

// ── Individual Schemas ──

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional().default(''),
  frequency: z.string().optional().default(''),
});

export const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen is required'),
  reaction: z.string().optional().default(''),
  severity: z.enum(['mild', 'moderate', 'severe']).optional().default('moderate'),
});

export const pastProcedureSchema = z.object({
  procedure: z.string().min(1, 'Procedure name is required'),
  date: z.string().optional().default(''),
  satisfaction: z.number().min(1).max(10).optional(),
  provider: z.string().optional().default(''),
});

// ── Autoimmune Conditions ──

export const AUTOIMMUNE_CONDITIONS = [
  'lupus',
  'rheumatoid_arthritis',
  'psoriasis',
  'scleroderma',
  'dermatomyositis',
  'hashimotos',
  'graves_disease',
  'vitiligo',
  'alopecia_areata',
  'other',
] as const;

export type AutoimmuneCondition = (typeof AUTOIMMUNE_CONDITIONS)[number];

// ── Full Medical History Schema ──

export const medicalHistorySchema = z.object({
  // Core medical flags
  pregnant: z.boolean().default(false),
  breastfeeding: z.boolean().default(false),
  bloodThinners: z.boolean().default(false),
  keloidHistory: z.boolean().default(false),
  activeSkinInfection: z.boolean().default(false),
  recentSunExposure: z.boolean().default(false),

  // Isotretinoin (Accutane)
  isotretinoinHistory: z.boolean().default(false),
  isotretinoinEndDate: z.string().optional(),

  // Autoimmune
  hasAutoimmune: z.boolean().default(false),
  autoimmuneConditions: z
    .array(z.enum(AUTOIMMUNE_CONDITIONS))
    .optional()
    .default([]),

  // Medications
  hasMedications: z.boolean().default(false),
  medications: z.array(medicationSchema).optional().default([]),

  // Allergies
  hasAllergies: z.boolean().default(false),
  allergies: z.array(allergySchema).optional().default([]),

  // Past procedures
  hasPastProcedures: z.boolean().default(false),
  pastProcedures: z.array(pastProcedureSchema).optional().default([]),

  // Lifestyle factors
  smokingStatus: z.enum(['never', 'former', 'current']).optional().default('never'),
  sunProtectionHabit: z
    .enum(['never', 'sometimes', 'usually', 'always'])
    .optional()
    .default('sometimes'),
  waterIntake: z.enum(['low', 'adequate', 'high']).optional().default('adequate'),
  sleepQuality: z.enum(['poor', 'fair', 'good']).optional().default('fair'),
  stressLevel: z.enum(['low', 'moderate', 'high']).optional().default('moderate'),
});

export type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>;

// ── Validation ──

export function validateMedicalData(
  data: Partial<MedicalHistoryFormData>
): { success: boolean; errors: Record<string, string> } {
  const result = medicalHistorySchema.safeParse(data);
  if (result.success) return { success: true, errors: {} };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}

// ── Helper: Convert to ClientProfile MedicalHistory ──

export function toMedicalHistory(data: MedicalHistoryFormData) {
  return {
    pregnant: data.pregnant,
    breastfeeding: data.breastfeeding,
    bloodThinners: data.bloodThinners,
    autoimmune: data.hasAutoimmune,
    keloidHistory: data.keloidHistory,
    activeSkinInfection: data.activeSkinInfection,
    recentSunExposure: data.recentSunExposure,
    isotretinoin: data.isotretinoinHistory,
    allergies: data.allergies.map((a) => a.allergen),
    medications: data.medications.map((m) => m.name),
    conditions: data.autoimmuneConditions as string[],
  };
}
