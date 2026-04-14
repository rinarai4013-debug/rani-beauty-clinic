import { z } from 'zod';

export const PEPTIDE_SYMPTOM_OPTIONS = [
  'slow-recovery',
  'inflammation',
  'gut-bloating',
  'poor-sleep',
  'fatigue',
  'muscle-loss',
  'joint-pain',
  'post-surgical-healing',
  'tendon-injury',
  'skin-dullness',
  'hair-thinning',
  'immune-fragility',
] as const;

export const PEPTIDE_GOAL_OPTIONS = [
  'recovery',
  'performance',
  'longevity',
  'body-recomposition',
  'gut-health',
  'skin-rejuvenation',
  'injury-repair',
  'immune-support',
] as const;

export type PeptideSymptom = (typeof PEPTIDE_SYMPTOM_OPTIONS)[number];
export type PeptideGoal = (typeof PEPTIDE_GOAL_OPTIONS)[number];

const basePeptideIntakeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email(),
    phone: z.string().trim().min(7).max(30).optional().default(''),

    symptoms: z.array(z.enum(PEPTIDE_SYMPTOM_OPTIONS)).min(1),
    goals: z.array(z.enum(PEPTIDE_GOAL_OPTIONS)).min(1),

    medicalFlags: z
      .object({
        pregnant: z.boolean().default(false),
        breastfeeding: z.boolean().default(false),
        activeCancer: z.boolean().default(false),
        organTransplant: z.boolean().default(false),
        autoimmuneSuppressed: z.boolean().default(false),
        activeInfection: z.boolean().default(false),
        bleedingDisorder: z.boolean().default(false),
      })
      .default({}),

    labs: z
      .object({
        baselineLabsCompleted: z.boolean().default(false),
        igf1: z.number().optional(),
        crp: z.number().optional(),
        cbc: z.boolean().optional(),
      })
      .default({}),

    currentMeds: z.string().trim().max(500).optional().default(''),
    fulfillmentPreference: z.enum(['clinic', 'home']).default('clinic'),
    source: z.string().trim().max(100).default('website-peptide-intake'),
  })
  .passthrough();

export const peptideIntakeSchema = basePeptideIntakeSchema.transform((data) => ({
  ...data,
  medicalFlags: {
    pregnant: data.medicalFlags?.pregnant ?? false,
    breastfeeding: data.medicalFlags?.breastfeeding ?? false,
    activeCancer: data.medicalFlags?.activeCancer ?? false,
    organTransplant: data.medicalFlags?.organTransplant ?? false,
    autoimmuneSuppressed: data.medicalFlags?.autoimmuneSuppressed ?? false,
    activeInfection: data.medicalFlags?.activeInfection ?? false,
    bleedingDisorder: data.medicalFlags?.bleedingDisorder ?? false,
  },
  labs: {
    baselineLabsCompleted: data.labs?.baselineLabsCompleted ?? false,
    igf1: data.labs?.igf1,
    crp: data.labs?.crp,
    cbc: data.labs?.cbc,
  },
}));

export const peptideIntakePartialSchema = basePeptideIntakeSchema.partial().passthrough();

export type PeptideIntake = z.infer<typeof peptideIntakeSchema>;
