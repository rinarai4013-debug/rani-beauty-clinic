/**
 * Medical Weight Loss Compliance Engine
 * Rani Beauty Clinic
 *
 * Handles contraindication screening, lab requirements, GFE tracking,
 * emergency protocols, FDA language enforcement, and ad compliance.
 * Separate from the existing HIPAA compliance module.
 */

import type {
  ContraindicationCheck,
  ContraindicationLevel,
  ContraindicationResult,
  LabRequirement,
  LabStatus,
  GFERecord,
  GFEStatus,
  EmergencyProtocol,
  EmergencyType,
  MedicalHistory,
  ServiceCategory,
  PregnancyStatus,
} from './types';

// ============================================================
// HARD STOP CONTRAINDICATIONS
// ============================================================

/**
 * Conditions that are absolute contraindications.
 * If any of these are present, the patient CANNOT receive GLP-1 treatment.
 */
export const HARD_STOP_CONTRAINDICATIONS: ContraindicationCheck[] = [
  {
    condition: 'Medullary thyroid carcinoma (MTC) - personal history',
    level: 'hard_stop',
    description: 'Personal history of medullary thyroid carcinoma. GLP-1 receptor agonists carry a boxed warning for thyroid C-cell tumors.',
    action: 'Decline GLP-1 treatment. Refer to oncologist.',
  },
  {
    condition: 'Medullary thyroid carcinoma (MTC) - family history',
    level: 'hard_stop',
    description: 'Family history of medullary thyroid carcinoma. Boxed warning applies.',
    action: 'Decline GLP-1 treatment. Recommend genetic counseling.',
  },
  {
    condition: 'Multiple Endocrine Neoplasia syndrome type 2 (MEN2)',
    level: 'hard_stop',
    description: 'MEN2 is associated with medullary thyroid carcinoma. Absolute contraindication for GLP-1 agents.',
    action: 'Decline GLP-1 treatment. Refer to endocrinologist.',
  },
  {
    condition: 'Type 1 Diabetes',
    level: 'hard_stop',
    description: 'GLP-1 receptor agonists are not indicated for Type 1 Diabetes. Risk of DKA.',
    action: 'Decline GLP-1 treatment. Refer to endocrinologist for Type 1 management.',
  },
  {
    condition: 'Pregnancy',
    level: 'hard_stop',
    description: 'GLP-1 medications are contraindicated during pregnancy. Stop treatment at least 2 months before planned pregnancy.',
    action: 'Decline treatment. Advise to discontinue 2 months before conception.',
  },
  {
    condition: 'Breastfeeding',
    level: 'hard_stop',
    description: 'GLP-1 medications are not studied in breastfeeding. Risk to infant is unknown.',
    action: 'Decline treatment until breastfeeding is complete.',
  },
];

// ============================================================
// SOFT FLAG CONTRAINDICATIONS
// ============================================================

/**
 * Conditions that require MD review but are not absolute contraindications.
 */
export const SOFT_FLAG_CONTRAINDICATIONS: ContraindicationCheck[] = [
  {
    condition: 'History of pancreatitis',
    level: 'soft_flag',
    description: 'GLP-1 agents may increase risk of pancreatitis. Prior history increases risk.',
    action: 'Flag for MD review. May proceed with enhanced monitoring if approved.',
  },
  {
    condition: 'Gastroparesis',
    level: 'soft_flag',
    description: 'GLP-1 agents slow gastric emptying. May worsen gastroparesis symptoms.',
    action: 'Flag for MD review. Consider lower starting dose with careful titration.',
  },
  {
    condition: 'Active cancer',
    level: 'soft_flag',
    description: 'Active cancer treatment may interact with GLP-1 therapy. Requires oncologist clearance.',
    action: 'Flag for MD review. Require oncologist clearance letter before proceeding.',
  },
  {
    condition: 'Severe renal impairment',
    level: 'soft_flag',
    description: 'Dose adjustment may be needed for patients with eGFR < 30.',
    action: 'Flag for MD review. Check renal function labs. May need dose adjustment.',
  },
  {
    condition: 'Severe hepatic impairment',
    level: 'soft_flag',
    description: 'Liver function should be assessed before starting treatment.',
    action: 'Flag for MD review. Check liver function labs.',
  },
  {
    condition: 'History of suicidal ideation or depression',
    level: 'soft_flag',
    description: 'Some patients report mood changes on GLP-1 medications.',
    action: 'Flag for MD review. Enhanced mental health monitoring required.',
  },
  {
    condition: 'Gallbladder disease',
    level: 'soft_flag',
    description: 'Rapid weight loss increases risk of gallstones.',
    action: 'Flag for MD review. Monitor for gallbladder symptoms. Consider ursodiol prophylaxis.',
  },
  {
    condition: 'Diabetic retinopathy',
    level: 'soft_flag',
    description: 'Rapid glucose improvement may temporarily worsen diabetic retinopathy.',
    action: 'Flag for MD review. Recommend ophthalmology clearance.',
  },
  {
    condition: 'Planning pregnancy',
    level: 'soft_flag',
    description: 'Must discontinue GLP-1 at least 2 months before planned conception.',
    action: 'Discuss timeline. May start short course. Ensure contraception counseling.',
  },
  {
    condition: 'Eating disorder history',
    level: 'soft_flag',
    description: 'GLP-1 appetite suppression may interact with eating disorder recovery.',
    action: 'Flag for MD review. Require mental health provider clearance.',
  },
];

/** All contraindications combined */
export const ALL_CONTRAINDICATIONS: ContraindicationCheck[] = [
  ...HARD_STOP_CONTRAINDICATIONS,
  ...SOFT_FLAG_CONTRAINDICATIONS,
];

// ============================================================
// CONTRAINDICATION SCREENING
// ============================================================

/** Keywords mapped to contraindication conditions for automated matching */
const CONDITION_KEYWORDS: Record<string, string[]> = {
  'Medullary thyroid carcinoma (MTC) - personal history': ['medullary thyroid', 'mtc', 'thyroid cancer'],
  'Medullary thyroid carcinoma (MTC) - family history': ['family medullary thyroid', 'family mtc', 'family thyroid cancer'],
  'Multiple Endocrine Neoplasia syndrome type 2 (MEN2)': ['men2', 'men 2', 'multiple endocrine neoplasia'],
  'Type 1 Diabetes': ['type 1 diabetes', 'type i diabetes', 't1d', 'juvenile diabetes', 'insulin dependent diabetes'],
  'Pregnancy': ['pregnant', 'pregnancy'],
  'Breastfeeding': ['breastfeeding', 'nursing', 'lactating'],
  'History of pancreatitis': ['pancreatitis'],
  'Gastroparesis': ['gastroparesis'],
  'Active cancer': ['cancer', 'carcinoma', 'tumor', 'malignancy', 'chemotherapy', 'radiation therapy'],
  'Severe renal impairment': ['renal impairment', 'kidney disease', 'kidney failure', 'dialysis', 'ckd'],
  'Severe hepatic impairment': ['liver disease', 'hepatic impairment', 'cirrhosis', 'liver failure'],
  'History of suicidal ideation or depression': ['suicidal', 'suicide', 'severe depression', 'major depression'],
  'Gallbladder disease': ['gallbladder', 'gallstones', 'cholecystitis', 'cholecystectomy'],
  'Diabetic retinopathy': ['diabetic retinopathy', 'retinopathy'],
  'Planning pregnancy': ['planning pregnancy', 'trying to conceive', 'ttc'],
  'Eating disorder history': ['eating disorder', 'anorexia', 'bulimia', 'binge eating'],
};

/**
 * Runs a full contraindication check against a patient's medical history.
 */
export function runContraindicationCheck(
  patientId: string,
  serviceId: string,
  medicalHistory: MedicalHistory
): ContraindicationResult {
  const hardStops: ContraindicationCheck[] = [];
  const softFlags: ContraindicationCheck[] = [];

  // Check pregnancy status
  if (medicalHistory.pregnancyStatus === 'pregnant') {
    const check = HARD_STOP_CONTRAINDICATIONS.find((c) => c.condition === 'Pregnancy');
    if (check) hardStops.push(check);
  }
  if (medicalHistory.pregnancyStatus === 'breastfeeding') {
    const check = HARD_STOP_CONTRAINDICATIONS.find((c) => c.condition === 'Breastfeeding');
    if (check) hardStops.push(check);
  }
  if (medicalHistory.pregnancyStatus === 'planning') {
    const check = SOFT_FLAG_CONTRAINDICATIONS.find((c) => c.condition === 'Planning pregnancy');
    if (check) softFlags.push(check);
  }

  // Check conditions against keywords
  const allConditions = [
    ...medicalHistory.conditions,
    ...medicalHistory.familyHistory,
  ].map((c) => c.toLowerCase());

  for (const contraindication of ALL_CONTRAINDICATIONS) {
    // Skip pregnancy checks (handled above)
    if (['Pregnancy', 'Breastfeeding', 'Planning pregnancy'].includes(contraindication.condition)) {
      continue;
    }

    const keywords = CONDITION_KEYWORDS[contraindication.condition] ?? [];
    const isMatch = keywords.some((kw) =>
      allConditions.some((condition) => condition.includes(kw))
    );

    if (isMatch) {
      // Check for family history specifics
      if (contraindication.condition.includes('family history')) {
        const isFamilyMatch = medicalHistory.familyHistory
          .map((f) => f.toLowerCase())
          .some((f) => keywords.some((kw) => f.includes(kw)));
        if (!isFamilyMatch) continue;
      }

      if (contraindication.level === 'hard_stop') {
        if (!hardStops.find((h) => h.condition === contraindication.condition)) {
          hardStops.push(contraindication);
        }
      } else {
        if (!softFlags.find((s) => s.condition === contraindication.condition)) {
          softFlags.push(contraindication);
        }
      }
    }
  }

  return {
    patientId,
    serviceId,
    checkedAt: new Date(),
    hardStops,
    softFlags,
    isCleared: hardStops.length === 0,
    requiresMDReview: softFlags.length > 0,
    notes: hardStops.length > 0
      ? `BLOCKED: ${hardStops.length} hard stop contraindication(s) found.`
      : softFlags.length > 0
        ? `REVIEW NEEDED: ${softFlags.length} condition(s) flagged for MD review.`
        : 'All clear. No contraindications identified.',
  };
}

/**
 * Quick check: returns true if a patient has any hard stop contraindications.
 */
export function hasHardStop(medicalHistory: MedicalHistory): boolean {
  const result = runContraindicationCheck('check', 'check', medicalHistory);
  return result.hardStops.length > 0;
}

/**
 * Quick check: returns true if a patient has soft flags requiring MD review.
 */
export function hasSoftFlags(medicalHistory: MedicalHistory): boolean {
  const result = runContraindicationCheck('check', 'check', medicalHistory);
  return result.softFlags.length > 0;
}

// ============================================================
// LAB REQUIREMENTS
// ============================================================

/** Lab panels required by service category */
export const REQUIRED_LABS: Record<ServiceCategory, string[]> = {
  glp1: ['CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Free T4'],
  peptide: [], // varies by specific peptide
  hormone: ['Total Testosterone', 'Free Testosterone', 'Estradiol', 'DHEA-S', 'Cortisol', 'TSH', 'Free T4', 'CMP'],
  wellness_injection: [],
};

/** Lab panel descriptions */
export const LAB_DESCRIPTIONS: Record<string, string> = {
  'CMP': 'Comprehensive Metabolic Panel - kidney/liver function, electrolytes, glucose',
  'Lipid Panel': 'Total cholesterol, LDL, HDL, triglycerides',
  'HbA1c': 'Hemoglobin A1c - 3-month average blood sugar',
  'TSH': 'Thyroid Stimulating Hormone',
  'Free T4': 'Free Thyroxine - active thyroid hormone',
  'Free T3': 'Free Triiodothyronine - active thyroid hormone',
  'Total Testosterone': 'Total testosterone level',
  'Free Testosterone': 'Bioavailable testosterone',
  'Estradiol': 'Estrogen level',
  'DHEA-S': 'Dehydroepiandrosterone sulfate - adrenal function',
  'Cortisol': 'Stress hormone level',
  'IGF-1': 'Insulin-like Growth Factor 1 - growth hormone marker',
  'CBC': 'Complete Blood Count',
  'PSA': 'Prostate Specific Antigen (males)',
  'TPO Antibodies': 'Thyroid Peroxidase Antibodies - autoimmune thyroid',
  'Thyroglobulin Antibodies': 'Thyroglobulin Antibodies - autoimmune thyroid',
  'Insulin': 'Fasting insulin level',
  'Vitamin D': 'Vitamin D 25-hydroxy level',
};

/** Lab expiration: initial labs valid for 90 days, then quarterly renewal */
export const LAB_EXPIRATION_DAYS = 90;

/**
 * Gets required labs for a service category.
 */
export function getRequiredLabs(category: ServiceCategory): string[] {
  return REQUIRED_LABS[category] ?? [];
}

/**
 * Gets required labs for a specific service ID.
 * Uses the service catalog for per-service requirements.
 */
export function getRequiredLabsForService(serviceId: string, serviceLabs: string[]): string[] {
  return serviceLabs;
}

/**
 * Creates lab requirement records for a patient.
 */
export function createLabRequirements(
  patientId: string,
  requiredLabs: string[]
): LabRequirement[] {
  return requiredLabs.map((labType) => ({
    patientId,
    labType,
    status: 'needed' as LabStatus,
  }));
}

/**
 * Updates lab status.
 */
export function updateLabStatus(
  requirement: LabRequirement,
  status: LabStatus,
  results?: Record<string, string | number>
): LabRequirement {
  const now = new Date();
  const updated: LabRequirement = { ...requirement, status };

  if (status === 'ordered') {
    updated.orderedAt = now;
  } else if (status === 'received') {
    updated.receivedAt = now;
    updated.expiresAt = new Date(now.getTime() + LAB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    if (results) {
      updated.results = results;
    }
  }

  return updated;
}

/**
 * Checks if a lab result has expired.
 */
export function isLabExpired(requirement: LabRequirement, asOf?: Date): boolean {
  if (!requirement.expiresAt) return false;
  const now = asOf ?? new Date();
  return now > requirement.expiresAt;
}

/**
 * Checks if all required labs are complete and current for a patient.
 */
export function areLabsComplete(requirements: LabRequirement[], asOf?: Date): {
  complete: boolean;
  missing: string[];
  expired: string[];
} {
  const missing: string[] = [];
  const expired: string[] = [];

  for (const req of requirements) {
    if (req.status === 'needed' || req.status === 'ordered' || req.status === 'pending_results') {
      missing.push(req.labType);
    } else if (req.status === 'received' && isLabExpired(req, asOf)) {
      expired.push(req.labType);
    }
  }

  return {
    complete: missing.length === 0 && expired.length === 0,
    missing,
    expired,
  };
}

/**
 * Returns labs expiring within the next N days.
 */
export function getLabsExpiringSoon(
  requirements: LabRequirement[],
  withinDays: number = 14,
  asOf?: Date
): LabRequirement[] {
  const now = asOf ?? new Date();
  const windowEnd = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return requirements.filter((req) => {
    if (req.status !== 'received' || !req.expiresAt) return false;
    return req.expiresAt > now && req.expiresAt <= windowEnd;
  });
}

// ============================================================
// GFE (GOOD FAITH EXAM) TRACKING
// ============================================================

/** GFE expiration: valid for 1 year */
export const GFE_EXPIRATION_DAYS = 365;

/**
 * Creates a new GFE record.
 */
export function createGFERecord(patientId: string): GFERecord {
  return {
    patientId,
    status: 'pending',
    provider: '',
    platform: 'qualiphy',
  };
}

/**
 * Updates GFE status.
 */
export function updateGFEStatus(record: GFERecord, status: GFEStatus, provider?: string): GFERecord {
  const now = new Date();
  const updated: GFERecord = { ...record, status };

  if (status === 'scheduled') {
    updated.scheduledAt = now;
  } else if (status === 'completed') {
    updated.completedAt = now;
    updated.expiresAt = new Date(now.getTime() + GFE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    if (provider) updated.provider = provider;
  }

  return updated;
}

/**
 * Checks if a GFE is expired.
 */
export function isGFEExpired(record: GFERecord, asOf?: Date): boolean {
  if (record.status !== 'completed' || !record.expiresAt) return false;
  const now = asOf ?? new Date();
  return now > record.expiresAt;
}

/**
 * Checks if a GFE needs renewal (expiring within 30 days).
 */
export function isGFEExpiringSOon(record: GFERecord, asOf?: Date): boolean {
  if (record.status !== 'completed' || !record.expiresAt) return false;
  const now = asOf ?? new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return record.expiresAt <= thirtyDaysOut && record.expiresAt > now;
}

// ============================================================
// EMERGENCY PROTOCOLS
// ============================================================

/** Emergency protocol definitions */
export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    type: 'severe_abdominal_pain',
    severity: 'critical',
    instructions: [
      'Ask patient to rate pain 1-10.',
      'If pain is 7+ or accompanied by vomiting, direct to ER immediately.',
      'Instruct patient to stop medication.',
      'Tell patient: "Please go to your nearest emergency room now. Tell them you are on a prescription medication (GLP-1 receptor agonist) and are experiencing severe abdominal pain."',
      'Notify clinic owner (Sukhi) immediately via text.',
      'Document incident in patient record.',
      'Schedule follow-up call for next day.',
    ],
    notifyOwner: true,
    directToER: true,
  },
  {
    type: 'allergic_reaction',
    severity: 'critical',
    instructions: [
      'Ask about symptoms: hives, swelling, difficulty breathing, throat tightness.',
      'If ANY breathing difficulty or throat swelling: Call 911 immediately.',
      'Instruct patient to stop medication.',
      'Tell patient: "If you have an EpiPen, use it now. Call 911 or go to the nearest ER immediately."',
      'Notify clinic owner (Sukhi) immediately via text.',
      'Document incident in patient record.',
      'Do NOT restart medication without MD clearance.',
    ],
    notifyOwner: true,
    directToER: true,
  },
  {
    type: 'suicidal_ideation',
    severity: 'critical',
    instructions: [
      'Take the patient seriously. Do not dismiss.',
      'Ask: "Are you having thoughts of hurting yourself?"',
      'If YES: "I need you to call 988 (Suicide & Crisis Lifeline) right now, or go to your nearest ER."',
      'Stay on the line/text thread until patient confirms they are getting help.',
      'Instruct patient to stop medication.',
      'Notify clinic owner (Sukhi) immediately via text.',
      'Document incident in patient record.',
      'Require psychiatric clearance before any medication restart.',
    ],
    notifyOwner: true,
    directToER: true,
  },
  {
    type: 'severe_vomiting',
    severity: 'critical',
    instructions: [
      'Ask about duration and frequency.',
      'If unable to keep fluids down for 24+ hours, direct to ER for IV fluids.',
      'Instruct patient to skip next dose.',
      'Recommend: small sips of water, avoid large meals, try bland foods.',
      'If on higher dose, discuss dose reduction at next check-in.',
      'Notify clinic owner if patient goes to ER.',
      'Schedule follow-up in 24-48 hours.',
    ],
    notifyOwner: true,
    directToER: false, // conditional
  },
  {
    type: 'chest_pain',
    severity: 'critical',
    instructions: [
      'Any chest pain requires immediate ER evaluation.',
      'Tell patient: "Please call 911 or go to your nearest ER immediately."',
      'Instruct patient to stop medication.',
      'Notify clinic owner (Sukhi) immediately.',
      'Document incident.',
      'Require cardiology clearance before medication restart.',
    ],
    notifyOwner: true,
    directToER: true,
  },
];

/**
 * Gets the emergency protocol for a given emergency type.
 */
export function getEmergencyProtocol(type: EmergencyType): EmergencyProtocol {
  const protocol = EMERGENCY_PROTOCOLS.find((p) => p.type === type);
  if (!protocol) {
    throw new Error(`No emergency protocol found for type: ${type}`);
  }
  return protocol;
}

/**
 * Generates emergency response text for a patient.
 */
export function generateEmergencyResponse(type: EmergencyType, patientFirstName: string): string {
  const protocol = getEmergencyProtocol(type);

  switch (type) {
    case 'severe_abdominal_pain':
      return `${patientFirstName}, I'm so sorry you're going through this. Please stop your medication and go to the nearest emergency room right now. Tell them you're taking a compounded GLP-1 medication. I'm flagging this with our medical team right now. Call us after you're seen: (425) 539-4440`;

    case 'allergic_reaction':
      return `${patientFirstName}, please call 911 right now if you're having trouble breathing or swelling. If you have an EpiPen, use it. Stop your medication. Our team is being notified. Your safety comes first. Call (425) 539-4440 after you're stable.`;

    case 'suicidal_ideation':
      return `${patientFirstName}, thank you for telling me. Please call 988 (Suicide & Crisis Lifeline) right now, or text HOME to 741741. You can also go to your nearest ER. I'm notifying our medical team. You are not alone. (425) 539-4440`;

    case 'severe_vomiting':
      return `${patientFirstName}, I'm sorry you're dealing with this. Skip your next dose and try small sips of water. If you can't keep any fluids down for 24 hours, please go to the ER for IV fluids. We'll check in with you tomorrow. Call us anytime: (425) 539-4440`;

    case 'chest_pain':
      return `${patientFirstName}, any chest pain needs to be checked right away. Please call 911 or go to the nearest ER now. Stop your medication. Tell them what you're taking. I'm notifying our team. (425) 539-4440`;
  }
}

// ============================================================
// FDA LANGUAGE COMPLIANCE
// ============================================================

/** Banned terms and their compliant replacements */
export const FDA_LANGUAGE_RULES: Array<{ banned: string; replacement: string; context: string }> = [
  {
    banned: 'generic Ozempic',
    replacement: 'compounded semaglutide',
    context: 'Ozempic is a brand name. We use compounded medications, not generics.',
  },
  {
    banned: 'generic Wegovy',
    replacement: 'compounded semaglutide',
    context: 'Wegovy is a brand name. We use compounded medications.',
  },
  {
    banned: 'generic Mounjaro',
    replacement: 'compounded tirzepatide',
    context: 'Mounjaro is a brand name. We use compounded medications.',
  },
  {
    banned: 'generic Zepbound',
    replacement: 'compounded tirzepatide',
    context: 'Zepbound is a brand name. We use compounded medications.',
  },
  {
    banned: 'same as Ozempic',
    replacement: 'contains the same active ingredient as Ozempic',
    context: 'Compounded medications are not identical to brand-name products.',
  },
  {
    banned: 'same as Wegovy',
    replacement: 'contains the same active ingredient as Wegovy',
    context: 'Compounded medications are not identical to brand-name products.',
  },
  {
    banned: 'same as Mounjaro',
    replacement: 'contains the same active ingredient as Mounjaro',
    context: 'Compounded medications are not identical to brand-name products.',
  },
  {
    banned: 'FDA approved',
    replacement: 'prescribed under medical supervision',
    context: 'Compounded medications are not FDA-approved. They are legally prescribed and prepared by licensed pharmacies.',
  },
  {
    banned: 'cure',
    replacement: 'treat',
    context: 'Weight loss medications do not cure obesity. They are part of a treatment plan.',
  },
  {
    banned: 'guaranteed weight loss',
    replacement: 'medically supervised weight loss program',
    context: 'No weight loss can be guaranteed. Results vary by individual.',
  },
  {
    banned: 'infusion',
    replacement: 'injection',
    context: 'Rani does IM INJECTIONS only. Never say infusion.',
  },
];

/**
 * Scans text for FDA compliance violations and returns corrected version.
 */
export function enforceFDALanguage(text: string): {
  correctedText: string;
  violations: Array<{ found: string; replacement: string; context: string }>;
  isCompliant: boolean;
} {
  let correctedText = text;
  const violations: Array<{ found: string; replacement: string; context: string }> = [];

  for (const rule of FDA_LANGUAGE_RULES) {
    const regex = new RegExp(rule.banned, 'gi');
    if (regex.test(correctedText)) {
      violations.push({
        found: rule.banned,
        replacement: rule.replacement,
        context: rule.context,
      });
      correctedText = correctedText.replace(regex, rule.replacement);
    }
  }

  return {
    correctedText,
    violations,
    isCompliant: violations.length === 0,
  };
}

// ============================================================
// AD COMPLIANCE
// ============================================================

/** Required disclaimers for advertising */
export const AD_DISCLAIMERS = {
  resultsVary: 'Results may vary. Individual outcomes depend on multiple factors including adherence to treatment plan.',
  medicallySupervisedShort: 'Medically supervised weight loss program.',
  medicallySupervisedFull: 'All treatments are prescribed and supervised by licensed medical providers. Results may vary.',
  compoundedMedication: 'Medications are compounded by a licensed 503B pharmacy and prescribed by a licensed provider.',
  notFDAApproved: 'Compounded medications have not been FDA-approved. They are legally prescribed and prepared by licensed pharmacies.',
};

/** Ad compliance rules */
export const AD_COMPLIANCE_RULES: Array<{
  rule: string;
  description: string;
  required: boolean;
}> = [
  {
    rule: 'no_guaranteed_weight_loss',
    description: 'Never guarantee specific weight loss amounts or percentages.',
    required: true,
  },
  {
    rule: 'no_before_after_photos',
    description: 'Do not use before/after patient photos in advertising.',
    required: true,
  },
  {
    rule: 'results_may_vary',
    description: 'Always include "results may vary" disclaimer.',
    required: true,
  },
  {
    rule: 'medically_supervised',
    description: 'Always state that treatment is medically supervised.',
    required: true,
  },
  {
    rule: 'no_brand_name_claims',
    description: 'Do not claim products are the "same as" brand-name medications.',
    required: true,
  },
  {
    rule: 'compounded_disclosure',
    description: 'Disclose that medications are compounded when relevant.',
    required: true,
  },
  {
    rule: 'no_celebrity_endorsement',
    description: 'Do not use celebrity names or images in connection with medication.',
    required: true,
  },
  {
    rule: 'provider_supervised',
    description: 'Make clear that a licensed provider prescribes treatment.',
    required: true,
  },
];

/** Banned phrases in advertising */
export const AD_BANNED_PHRASES: string[] = [
  'guaranteed weight loss',
  'lose X pounds',
  'lose X lbs',
  'before and after',
  'miracle weight loss',
  'magic pill',
  'no diet needed',
  'no exercise needed',
  'effortless weight loss',
  'melt fat',
  'burn fat fast',
  'same as Ozempic',
  'same as Wegovy',
  'same as Mounjaro',
  'FDA approved',
  'celebrity',
  'Hollywood secret',
  'infusion', // Rani does injections only
];

/**
 * Checks ad copy for compliance violations.
 */
export function checkAdCompliance(adCopy: string): {
  isCompliant: boolean;
  violations: string[];
  missingDisclaimers: string[];
  suggestions: string[];
} {
  const violations: string[] = [];
  const suggestions: string[] = [];
  const lowerCopy = adCopy.toLowerCase();

  // Check banned phrases
  for (const phrase of AD_BANNED_PHRASES) {
    if (lowerCopy.includes(phrase.toLowerCase())) {
      violations.push(`Banned phrase found: "${phrase}"`);
    }
  }

  // Check for "results may vary"
  const missingDisclaimers: string[] = [];
  if (!lowerCopy.includes('results may vary') && !lowerCopy.includes('results vary')) {
    missingDisclaimers.push('Missing "results may vary" disclaimer');
  }

  // Check for medically supervised mention
  if (
    !lowerCopy.includes('medically supervised') &&
    !lowerCopy.includes('medical supervision') &&
    !lowerCopy.includes('provider supervised') &&
    !lowerCopy.includes('physician supervised')
  ) {
    missingDisclaimers.push('Missing "medically supervised" statement');
  }

  // Check for weight loss guarantees (numbers)
  const weightGuaranteeRegex = /lose\s+\d+\s*(pounds?|lbs?|kg)/i;
  if (weightGuaranteeRegex.test(adCopy)) {
    violations.push('Contains specific weight loss guarantee (numeric claim).');
    suggestions.push('Replace specific weight claims with "clinically significant weight loss" or similar.');
  }

  // Check for before/after references
  if (lowerCopy.includes('before') && lowerCopy.includes('after')) {
    violations.push('Contains before/after language. Avoid before/after comparisons in ads.');
    suggestions.push('Use testimonial language instead: "Patients report feeling more confident and energetic."');
  }

  if (violations.length === 0 && missingDisclaimers.length > 0) {
    suggestions.push('Add required disclaimers to make this ad fully compliant.');
  }

  return {
    isCompliant: violations.length === 0 && missingDisclaimers.length === 0,
    violations,
    missingDisclaimers,
    suggestions,
  };
}

/**
 * Generates a compliant ad disclaimer block.
 */
export function generateAdDisclaimer(includeCompounded: boolean = true): string {
  const parts = [AD_DISCLAIMERS.resultsVary, AD_DISCLAIMERS.medicallySupervisedFull];
  if (includeCompounded) {
    parts.push(AD_DISCLAIMERS.compoundedMedication);
  }
  return parts.join(' ');
}

// ============================================================
// FULL COMPLIANCE CHECK
// ============================================================

/** Complete compliance status for a patient */
export interface PatientComplianceStatus {
  patientId: string;
  contraindicationStatus: ContraindicationResult;
  labsStatus: { complete: boolean; missing: string[]; expired: string[] };
  gfeStatus: { valid: boolean; status: GFEStatus; expiringSOon: boolean };
  isFullyCleared: boolean;
  blockers: string[];
  warnings: string[];
}

/**
 * Runs a complete compliance check for a patient.
 */
export function runFullComplianceCheck(
  patientId: string,
  serviceId: string,
  medicalHistory: MedicalHistory,
  labRequirements: LabRequirement[],
  gfeRecord: GFERecord | null
): PatientComplianceStatus {
  const contraindicationStatus = runContraindicationCheck(patientId, serviceId, medicalHistory);
  const labsStatus = areLabsComplete(labRequirements);

  const gfeValid = gfeRecord?.status === 'completed' && !isGFEExpired(gfeRecord);
  const gfeExpiringSoon = gfeRecord ? isGFEExpiringSOon(gfeRecord) : false;
  const gfeStatus = {
    valid: gfeValid,
    status: gfeRecord?.status ?? 'pending' as GFEStatus,
    expiringSOon: gfeExpiringSoon,
  };

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (contraindicationStatus.hardStops.length > 0) {
    blockers.push(
      ...contraindicationStatus.hardStops.map(
        (h) => `Hard stop: ${h.condition}`
      )
    );
  }

  if (!labsStatus.complete) {
    if (labsStatus.missing.length > 0) {
      blockers.push(`Missing labs: ${labsStatus.missing.join(', ')}`);
    }
    if (labsStatus.expired.length > 0) {
      blockers.push(`Expired labs: ${labsStatus.expired.join(', ')}`);
    }
  }

  if (!gfeValid) {
    blockers.push('GFE not completed or expired.');
  }

  if (contraindicationStatus.softFlags.length > 0) {
    warnings.push(
      ...contraindicationStatus.softFlags.map(
        (s) => `MD review needed: ${s.condition}`
      )
    );
  }

  if (gfeExpiringSoon) {
    warnings.push('GFE expiring within 30 days. Schedule renewal.');
  }

  const expiringLabs = getLabsExpiringSoon(labRequirements);
  if (expiringLabs.length > 0) {
    warnings.push(
      `Labs expiring soon: ${expiringLabs.map((l) => l.labType).join(', ')}`
    );
  }

  return {
    patientId,
    contraindicationStatus,
    labsStatus,
    gfeStatus,
    isFullyCleared: blockers.length === 0,
    blockers,
    warnings,
  };
}
