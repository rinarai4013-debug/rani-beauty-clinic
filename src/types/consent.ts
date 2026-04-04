/**
 * Consent & E-Signature Types for Mastermind Consultation Engine
 *
 * Informed consent is legally required before any medical aesthetic procedure.
 * These types power the consent capture flow: template rendering, signature
 * collection, and record storage.
 */

// ── CONSENT RECORD ──

export interface ConsentRecord {
  id: string;
  sessionId: string;
  patientName: string;
  patientEmail: string;
  consentType:
    | 'general_treatment'
    | 'specific_procedure'
    | 'photo_release'
    | 'telehealth'
    | 'financial';
  consentText: string; // The actual consent language presented to the patient
  treatmentNames?: string[]; // Specific treatments being consented to
  signatureDataUrl: string; // Base64 canvas signature (PNG data URL)
  signedAt: string; // ISO 8601 timestamp
  ipAddress?: string;
  userAgent?: string;
  witnessName?: string; // Provider who witnessed the signing
}

// ── CONSENT TEMPLATE ──

export interface ConsentTemplate {
  type: ConsentRecord['consentType'];
  title: string;
  body: string; // HTML-safe consent text with {{variable}} placeholders
  requiredForTreatments?: string[]; // Which treatment categories require this consent
  acknowledgments: string[]; // Checkbox items the patient must individually confirm
}

// ── SESSION CONSENT EXTENSION ──
// Extends MastermindSession without modifying the original type file.

export interface SessionWithConsent {
  consentRecords: ConsentRecord[];
  allConsentsComplete: boolean;
  missingConsents: ConsentRecord['consentType'][];
}

// ── HELPERS ──

export type ConsentType = ConsentRecord['consentType'];

export const ALL_CONSENT_TYPES: ConsentType[] = [
  'general_treatment',
  'specific_procedure',
  'photo_release',
  'telehealth',
  'financial',
];

/**
 * Determine which consent types are required for a given set of treatments.
 */
export function getRequiredConsents(
  treatmentNames: string[],
  isVirtual: boolean = false
): ConsentType[] {
  const required: ConsentType[] = ['general_treatment', 'financial'];

  if (treatmentNames.length > 0) {
    required.push('specific_procedure');
  }

  // Photo release is always offered (but patient can opt out of marketing use)
  required.push('photo_release');

  if (isVirtual) {
    required.push('telehealth');
  }

  return required;
}
