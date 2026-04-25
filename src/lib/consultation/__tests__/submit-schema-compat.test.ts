// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { submitIntakeSchema } from '../schema';

describe('submitIntakeSchema — dashboard modal compatibility', () => {
  it('accepts the full dashboard NewConsultationModal payload without 422', () => {
    // Exact payload shape sent by src/components/dashboard/mastermind/
    // NewConsultationModal.tsx handleSubmit (incident 2026-04-19).
    const payload = {
      firstName: 'Rani',
      lastName: 'OS',
      dob: '2000-01-01',
      email: 'info@ranibeautyclinic.com',
      phone: '(206) 555-0100',
      age: 26,
      contactPreference: 'email',
      referralSource: 'instagram',

      // Dashboard-only vocabulary (wizard doesn't use these exact tokens)
      skinConcerns: ['fine-lines', 'texture', 'laxity', 'undereye', 'acne-scars'],
      targetAreas: ['face', 'neck'],
      treatmentInterests: ['hydrafacial', 'rf-microneedling', 'botox'],
      concerns: ['fine-lines', 'texture'],
      goals: ['anti-aging', 'scar-treatment'], // ARRAY, not string
      hasUpcomingEvent: false,

      previousTreatments: ['Botox 6 months ago'],
      treatmentHistory: 'Botox 6 months ago',

      medicalHistory: 'None',
      hasAutoimmune: false,
      allergies: 'None',
      hasAllergies: false,
      medications: 'None',
      hasMedications: false,

      smokingAlcohol: 'neither',
      smokingStatus: 'never',
      waterIntake: '6-8',
      skincareRoutine: 'moderate',
      skincareAM: 'Cleanser, Vitamin C, SPF 50',
      skincarePM: 'Cleanser, Retinol, Moisturizer',

      requiresLabWork: false,
      preferredDays: ['tue', 'thu'],
      preferredTime: 'evening',

      budget: 'under-500', // dashboard vocab — not in wizard enum
      clinicalNotes: 'Keratin buildup on forehead',
    };

    const result = submitIntakeSchema.safeParse(payload);
    if (!result.success) {
      // Surface the first failure so the test output is actionable
      // when the schema regresses.
      throw new Error(
        'submitIntakeSchema rejected the dashboard payload: ' +
          JSON.stringify(result.error.issues.slice(0, 3), null, 2),
      );
    }
    expect(result.success).toBe(true);
  });

  it('accepts the public wizard payload (string goals, wizard enums)', () => {
    const payload = {
      firstName: 'Jasmine',
      lastName: 'Patel',
      email: 'jasmine@example.com',
      phone: '(425) 555-0199',
      dob: '1992-06-15',
      skinConcerns: ['aging-skin', 'hyperpigmentation'],
      targetAreas: ['forehead', 'cheeks'],
      treatmentInterests: ['hydrafacial'],
      skinType: 'combination',
      goals: 'Glowing skin for event',
      timeline: 'event',
      budget: 'premium',
      smsConsent: true,
    };

    const result = submitIntakeSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts an empty/partial payload (progressive wizards)', () => {
    expect(submitIntakeSchema.safeParse({}).success).toBe(true);
    expect(submitIntakeSchema.safeParse({ firstName: 'Rani' }).success).toBe(true);
  });

  it('rejects an object whose email is clearly malformed', () => {
    const result = submitIntakeSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
