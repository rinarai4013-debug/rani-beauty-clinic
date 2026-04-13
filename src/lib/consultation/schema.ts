/**
 * Consultation Wizard - Zod Validation Schemas
 *
 * Per-step validation schemas for the 8-step consultation wizard.
 * Fields map to Airtable Client Intakes table.
 */

import { z } from 'zod';

// ── Shared Enums ──

export const SKIN_CONCERN_OPTIONS = [
  'acne',
  'aging-skin',
  'hyperpigmentation',
  'skin-laxity',
  'unwanted-hair',
  'dull-skin',
  'body-contouring',
  'sun-damage',
  'large-pores',
] as const;

export const FACE_ZONES = [
  'forehead',
  'temples',
  'around-eyes',
  'cheeks',
  'nose',
  'upper-lip',
  'chin',
  'jawline',
  'neck',
  'decollete',
] as const;

export const BODY_ZONES = [
  'arms',
  'underarms',
  'chest',
  'abdomen',
  'back',
  'bikini',
  'buttocks',
  'legs',
  'hands',
  'feet',
] as const;

export const SKIN_TYPES = [
  'normal',
  'dry',
  'oily',
  'combination',
  'sensitive',
] as const;

export const TIMELINE_OPTIONS = [
  'event',
  'gradual',
  'ongoing',
  'asap',
] as const;

export const BUDGET_OPTIONS = [
  'starter',
  'moderate',
  'premium',
  'investment',
] as const;

export const DOWNTIME_TOLERANCE_OPTIONS = [
  'none',
  'minimal',
  'moderate',
  'flexible',
] as const;

export const PAIN_TOLERANCE_OPTIONS = [
  'low',
  'medium',
  'high',
] as const;

// ── Step Schemas ──

/** Step 1: Welcome - no user input, just intro screen */
const step1Schema = z.object({});

/** Step 2: About You - personal info */
const step2Schema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or fewer'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or fewer'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
      'Please enter a valid phone number'
    ),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      (val) => {
        const date = new Date(val);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        return !isNaN(date.getTime()) && age >= 18;
      },
      { message: 'You must be at least 18 years old' }
    ),
});

/** Step 3: Concerns - skin concerns + target areas */
const step3Schema = z.object({
  skinConcerns: z
    .array(z.enum(SKIN_CONCERN_OPTIONS))
    .min(1, 'Please select at least one concern'),
  targetAreas: z
    .array(z.string())
    .min(1, 'Please select at least one target area'),
});

/** Step 4: Treatment Interests - service category IDs from unified catalog */
const step4Schema = z.object({
  treatmentInterests: z
    .array(z.string())
    .min(1, 'Please select at least one treatment of interest'),
});

/** Step 5: History - skin type + treatment history + medical history */
const step5Schema = z.object({
  skinType: z.enum(SKIN_TYPES, {
    message: 'Please select your skin type',
  }),
  treatmentHistory: z
    .string()
    .max(2000, 'Treatment history must be 2000 characters or fewer')
    .optional()
    .default(''),
  // Enhanced medical fields (all optional for progressive disclosure)
  pregnant: z.boolean().optional().default(false),
  breastfeeding: z.boolean().optional().default(false),
  bloodThinners: z.boolean().optional().default(false),
  keloidHistory: z.boolean().optional().default(false),
  activeSkinInfection: z.boolean().optional().default(false),
  recentSunExposure: z.boolean().optional().default(false),
  isotretinoinHistory: z.boolean().optional().default(false),
  isotretinoinEndDate: z.string().optional(),
  hasAutoimmune: z.boolean().optional().default(false),
  hasMedications: z.boolean().optional().default(false),
  hasAllergies: z.boolean().optional().default(false),
  smokingStatus: z.enum(['never', 'former', 'current']).optional().default('never'),
  sunProtectionHabit: z.enum(['never', 'sometimes', 'usually', 'always']).optional().default('sometimes'),
});

/** Step 6: Goals - personal goals, timeline preference, budget range */
const step6Schema = z.object({
  goals: z
    .string()
    .min(1, 'Please share your goals')
    .max(2000, 'Goals must be 2000 characters or fewer'),
  timeline: z.enum(TIMELINE_OPTIONS, {
    message: 'Please select a timeline preference',
  }),
  budget: z.enum(BUDGET_OPTIONS, {
    message: 'Please select a budget range',
  }),
  downtimeTolerance: z.enum(DOWNTIME_TOLERANCE_OPTIONS).optional().default('moderate'),
  painTolerance: z.enum(PAIN_TOLERANCE_OPTIONS).optional().default('medium'),
});

/** Step 7: Photos - optional uploads, max 3 */
const step7Schema = z.object({
  photos: z
    .array(z.instanceof(File))
    .max(3, 'You can upload a maximum of 3 photos')
    .refine(
      (files) => files.every((f) => f.size <= 10 * 1024 * 1024),
      { message: 'Each photo must be under 10 MB' }
    )
    .refine(
      (files) =>
        files.every((f) =>
          ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(f.type)
        ),
      { message: 'Photos must be JPEG, PNG, WebP, or HEIC' }
    )
    .optional()
    .default([]),
});

/** Step 8: Summary + SMS consent - review and submit */
const step8Schema = z.object({
  smsConsent: z.boolean().default(false),
});

// ── Exports ──

/** Array of Zod schemas indexed by step (0-based) */
export const stepSchemas = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema,
] as const;

/** Full consultation form data - union of all step schemas */
const fullSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema)
  .merge(step8Schema);

export type ConsultationFormData = z.infer<typeof fullSchema>;

/**
 * Server-side submit schema — what `/api/consultation/submit` validates
 * against after it parses the multipart `data` field. Photos travel
 * separately as binary multipart parts, so this schema drops step 7
 * (which uses `z.instanceof(File)` and wouldn't survive JSON transit
 * anyway) and is `.partial()` so users who bail out mid-wizard don't
 * get 422'd — the route still enforces what it actually needs (name,
 * email) at the handler level.
 *
 * Tier 1 zod upgrade (2026-04-11): replaced the previous
 * `z.record(z.unknown())` payload schema, which was accepting
 * arbitrary shapes and relying on `as Partial<...>` casts downstream.
 */
export const submitIntakeSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step8Schema)
  .partial()
  .passthrough();

/** Validate a single step's data. Returns { success, errors } */
export function validateStep(
  step: number,
  data: Partial<ConsultationFormData>
): { success: boolean; errors: Record<string, string> } {
  const schema = stepSchemas[step];
  if (!schema) return { success: true, errors: {} };

  const result = schema.safeParse(data);
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
