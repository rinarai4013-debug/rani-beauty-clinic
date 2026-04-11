/**
 * Enhanced Intake Processor for Medical Weight Loss
 * Rani Beauty Clinic
 *
 * Parses intake forms, runs contraindication checks, determines required labs,
 * generates Qualiphy entries, drafts welcome messages, assigns Mangomint tags,
 * calculates revenue estimates, and flags cross-sell opportunities.
 */

import type {
  IntakeFormData,
  IntakeResult,
  PatientProfile,
  MedicalHistory,
  ContraindicationResult,
  QualiphyQuickEntry,
  GLP1Stage,
  ServiceCategory,
  PregnancyStatus,
} from './types';

import { runContraindicationCheck } from './compliance-engine';
import { generateQuickEntryBlock, formatQuickEntryAsText } from './qualiphy-integration';
import { getServiceById, getRequiredLabsForServices, estimatePatientMonthlyRevenue } from './services-catalog';
import { CROSS_SELL_RULES } from './crosssell-matrix';

// ============================================================
// BMI CALCULATION
// ============================================================

/**
 * Calculates BMI from height (inches) and weight (pounds).
 */
export function calculateBMI(heightInches: number, weightLbs: number): number {
  if (heightInches <= 0 || weightLbs <= 0) return 0;
  return Math.round((weightLbs / (heightInches * heightInches)) * 703 * 10) / 10;
}

/**
 * Returns the BMI category.
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obesity Class I';
  if (bmi < 40) return 'Obesity Class II';
  return 'Obesity Class III';
}

/**
 * Checks if BMI qualifies for GLP-1 treatment (BMI 27+ with comorbidity or BMI 30+).
 */
export function qualifiesForGLP1(bmi: number, hasComorbidity: boolean = false): boolean {
  if (bmi >= 30) return true;
  if (bmi >= 27 && hasComorbidity) return true;
  return false;
}

// ============================================================
// FORM PARSING
// ============================================================

/**
 * Converts height from feet + inches to total inches.
 */
export function heightToInches(feet: number, inches: number): number {
  return feet * 12 + inches;
}

/**
 * Parses the intake form and creates a patient profile.
 */
export function parseIntakeForm(form: IntakeFormData): PatientProfile {
  const totalInches = heightToInches(form.heightFeet, form.heightInches);
  const bmi = calculateBMI(totalInches, form.weightLbs);

  return {
    id: generatePatientId(form.firstName, form.lastName),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    dob: form.dob,
    gender: form.gender,
    phone: normalizePhone(form.phone),
    email: form.email.trim().toLowerCase(),
    address: {
      street: form.address.street.trim(),
      city: form.address.city.trim(),
      state: form.address.state.trim().toUpperCase(),
      zip: form.address.zip.trim(),
    },
    heightInches: totalInches,
    weightLbs: form.weightLbs,
    bmi,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Extracts medical history from the intake form.
 */
export function extractMedicalHistory(
  patientId: string,
  form: IntakeFormData
): MedicalHistory {
  return {
    patientId,
    conditions: form.medicalHistory.map((c) => c.trim()).filter(Boolean),
    currentMedications: form.currentMedications.map((m) => m.trim()).filter(Boolean),
    allergies: form.allergies.map((a) => a.trim()).filter(Boolean),
    pregnancyStatus: form.pregnancyStatus,
    familyHistory: form.familyHistory.map((f) => f.trim()).filter(Boolean),
    surgeries: [],
  };
}

/**
 * Generates a patient ID from name + timestamp.
 */
function generatePatientId(firstName: string, lastName: string): string {
  const timestamp = Date.now().toString(36);
  const namePrefix = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return `PAT-${namePrefix}-${timestamp}`;
}

/**
 * Normalizes phone number to (XXX) XXX-XXXX format.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// ============================================================
// SERVICE CATEGORIZATION
// ============================================================

/**
 * Determines the primary service category from requested services.
 */
export function determinePrimaryCategory(serviceIds: string[]): ServiceCategory {
  for (const id of serviceIds) {
    if (id.startsWith('glp1')) return 'glp1';
    if (id.startsWith('hormone')) return 'hormone';
    if (id.startsWith('peptide')) return 'peptide';
  }
  return 'wellness_injection';
}

/**
 * Maps service request strings to service IDs.
 * Handles common variations in how patients describe services.
 */
export function mapServiceRequests(requests: string[]): string[] {
  const serviceMap: Record<string, string> = {
    'semaglutide': 'glp1-sema-monthly',
    'ozempic': 'glp1-sema-monthly',
    'wegovy': 'glp1-sema-monthly',
    'tirzepatide': 'glp1-tirz-monthly',
    'mounjaro': 'glp1-tirz-monthly',
    'zepbound': 'glp1-tirz-monthly',
    'weight loss': 'glp1-sema-monthly',
    'glp-1': 'glp1-sema-monthly',
    'glp1': 'glp1-sema-monthly',
    'vip transform': 'glp1-vip-transform',
    'vip': 'glp1-vip-transform',
    'nad+': 'peptide-nad-plus',
    'nad': 'peptide-nad-plus',
    'sermorelin': 'peptide-sermorelin',
    'glutathione injection': 'peptide-glutathione',
    'ghk-cu': 'peptide-ghk-cu',
    'copper peptide': 'peptide-ghk-cu',
    'pt-141': 'peptide-pt141',
    'bremelanotide': 'peptide-pt141',
    'bpc-157': 'peptide-bpc157',
    'bpc': 'peptide-bpc157',
    'testosterone': 'hormone-testosterone',
    'trt': 'hormone-testosterone',
    'thyroid': 'hormone-thyroid',
    'dhea': 'hormone-dhea',
    'b12': 'wellness-b12',
    'biotin': 'wellness-biotin',
    'glutathione push': 'wellness-glutathione-push',
    'glutathione iv': 'wellness-glutathione-push',
    'nad iv': 'wellness-nad-iv',
    'nad+ iv': 'wellness-nad-iv',
    'vitamin d': 'wellness-vitamin-d3',
    'vitamin d3': 'wellness-vitamin-d3',
    'tri-immune': 'wellness-tri-immune',
    'tri immune': 'wellness-tri-immune',
    'lipo-mino': 'wellness-lipo-mino',
    'lipo mino': 'wellness-lipo-mino',
    'lipotropic': 'wellness-lipo-mino',
  };

  const serviceIds = new Set<string>();
  for (const request of requests) {
    const lower = request.toLowerCase().trim();
    const mapped = serviceMap[lower];
    if (mapped) {
      serviceIds.add(mapped);
    } else {
      // Try partial matching
      for (const [key, value] of Object.entries(serviceMap)) {
        if (lower.includes(key) || key.includes(lower)) {
          serviceIds.add(value);
          break;
        }
      }
    }
  }

  return Array.from(serviceIds);
}

// ============================================================
// MANGOMINT TAG GENERATION
// ============================================================

/**
 * Generates Mangomint tags based on patient intake data.
 */
export function generateMangomintTags(
  serviceIds: string[],
  bmi: number,
  monthlyRevenue: number,
  hasSoftFlags: boolean
): string[] {
  const tags: string[] = [];

  // Service tags
  for (const id of serviceIds) {
    if (id.startsWith('glp1')) tags.push('GLP1-PATIENT');
    if (id.startsWith('peptide')) tags.push('PEPTIDE-PATIENT');
    if (id.startsWith('hormone')) tags.push('HORMONE-PATIENT');
    if (id.startsWith('wellness')) tags.push('WELLNESS-PATIENT');
  }

  // Initial dose tags for GLP-1 patients
  if (serviceIds.some((id) => id.includes('sema'))) {
    tags.push('SEMA-D1');
  }
  if (serviceIds.some((id) => id.includes('tirz'))) {
    tags.push('TIRZ-D1');
  }

  // Status tags
  tags.push('FOLLOW-UP-DUE');
  tags.push('LABS-DUE');

  if (hasSoftFlags) {
    tags.push('MD-REVIEW-NEEDED');
  }

  // Revenue tags
  if (monthlyRevenue >= 500) {
    tags.push('HIGH-VALUE');
  }

  // Deduplicate
  return [...new Set(tags)];
}

// ============================================================
// WELCOME MESSAGE GENERATION
// ============================================================

/**
 * Generates a welcome SMS text in Rina's voice.
 * MUST be under 300 characters.
 */
export function generateWelcomeText(firstName: string, serviceName: string): string {
  const text = `Hey ${firstName}! Welcome to Rani Beauty Clinic. I'm Rina and I'll be guiding you through your ${serviceName} journey. First step: we'll get your labs set up. I'll send details shortly! (425) 539-4440`;

  if (text.length > 300) {
    return `Hey ${firstName}! Welcome to Rani! I'm Rina, your guide for your ${serviceName} program. Labs are your first step - details coming soon! (425) 539-4440`;
  }

  return text;
}

/**
 * Generates a welcome email in Rina's voice.
 */
export function generateWelcomeEmail(
  firstName: string,
  serviceName: string,
  requiredLabs: string[],
  hasSoftFlags: boolean
): string {
  const labList = requiredLabs.map((lab) => `  - ${lab}`).join('\n');

  let body = `Hi ${firstName},\n\n`;
  body += `Welcome to Rani Beauty Clinic! I'm so excited you've taken this step. I'm Rina and I'll be with you every step of the way on your ${serviceName} journey.\n\n`;

  body += `Here's what happens next:\n\n`;
  body += `1. Labs: We need a few blood tests to make sure everything is safe and personalized for you.\n`;

  if (requiredLabs.length > 0) {
    body += `\nYour required labs:\n${labList}\n\n`;
    body += `You can get these done at any Quest Diagnostics or Labcorp location near you. We can also help you find a convenient spot.\n\n`;
  }

  body += `2. Virtual Exam: A quick 10-minute virtual exam through our partner Qualiphy. We'll send you the link once your lab results are in.\n\n`;
  body += `3. Prescription & Shipping: Once approved, your compounded medication ships directly to you.\n\n`;

  if (hasSoftFlags) {
    body += `Note: Based on your medical history, our physician will review your chart before finalizing your treatment plan. This is standard practice to make sure we personalize everything for your safety.\n\n`;
  }

  body += `Questions? I'm always here. Just reply to this email or call/text me at (425) 539-4440.\n\n`;
  body += `Talk soon,\nRina\nRani Beauty Clinic\n(425) 539-4440`;

  return body;
}

// ============================================================
// CROSS-SELL OPPORTUNITY DETECTION
// ============================================================

/**
 * Identifies initial cross-sell opportunities based on intake data.
 */
export function detectCrossSellOpportunities(serviceIds: string[]): string[] {
  const opportunities: string[] = [];

  // Check which service categories the patient has
  const hasGLP1 = serviceIds.some((id) => id.startsWith('glp1'));
  const hasPeptide = serviceIds.some((id) => id.startsWith('peptide'));
  const hasHormone = serviceIds.some((id) => id.startsWith('hormone'));

  if (hasGLP1) {
    opportunities.push('Lipo-Mino add-on at Month 2+ ($50/visit)');
    opportunities.push('B12 energy boost ($35/visit)');
    opportunities.push('Biotin for hair support at Month 2+ ($45/visit)');
  }

  if (hasPeptide) {
    opportunities.push('NAD+ IV drip add-on ($150-250)');
    opportunities.push('Glutathione Push ($75-100)');
  }

  if (hasHormone) {
    opportunities.push('B12 + Vitamin D combo ($85)');
    opportunities.push('Tri-Immune boost ($75)');
  }

  return opportunities;
}

// ============================================================
// REVENUE ESTIMATION
// ============================================================

/**
 * Estimates monthly and annual revenue for a new patient.
 */
export function estimateRevenue(serviceIds: string[]): {
  monthly: number;
  annual: number;
  category: string;
} {
  const monthly = estimatePatientMonthlyRevenue(serviceIds);
  const annual = monthly * 12;

  let category: string;
  if (monthly >= 800) category = 'Premium';
  else if (monthly >= 500) category = 'High Value';
  else if (monthly >= 300) category = 'Standard';
  else category = 'Basic';

  return { monthly, annual, category };
}

// ============================================================
// MAIN INTAKE PROCESSOR
// ============================================================

/**
 * Processes a complete intake form and returns all generated data.
 * This is the main entry point for the intake workflow.
 */
export function processIntake(form: IntakeFormData): IntakeResult {
  // 1. Parse patient profile
  const patient = parseIntakeForm(form);

  // 2. Extract medical history
  const medicalHistory = extractMedicalHistory(patient.id, form);

  // 3. Map service requests to service IDs
  const serviceIds = mapServiceRequests(form.servicesRequested);
  const primaryServiceId = serviceIds[0] ?? 'glp1-sema-monthly';

  // 4. Run contraindication checks
  const contraindicationResult = runContraindicationCheck(
    patient.id,
    primaryServiceId,
    medicalHistory
  );

  // 5. Determine required labs
  const requiredLabs = getRequiredLabsForServices(serviceIds);

  // 6. Generate Qualiphy quick-entry block
  const qualiphyEntry = generateQuickEntryBlock(
    patient,
    medicalHistory,
    form.servicesRequested
  );

  // 7. Get primary service name for messages
  const primaryService = getServiceById(primaryServiceId);
  const serviceName = primaryService?.name ?? 'weight loss program';

  // 8. Draft welcome text (SMS)
  const welcomeText = generateWelcomeText(patient.firstName, serviceName);

  // 9. Draft welcome email
  const welcomeEmail = generateWelcomeEmail(
    patient.firstName,
    serviceName,
    requiredLabs,
    contraindicationResult.requiresMDReview
  );

  // 10. Generate Mangomint tags
  const revenue = estimateRevenue(serviceIds);
  const mangomintTags = generateMangomintTags(
    serviceIds,
    patient.bmi,
    revenue.monthly,
    contraindicationResult.requiresMDReview
  );

  // 11. Detect cross-sell opportunities
  const crossSellOpportunities = detectCrossSellOpportunities(serviceIds);

  // 12. Determine pipeline stage
  let pipelineStage: GLP1Stage = 'PIPELINE_NEW';
  if (contraindicationResult.hardStops.length > 0) {
    pipelineStage = 'PIPELINE_NEW'; // stays in new, flagged
  }

  // 13. Build flag reasons
  const flagReasons: string[] = [];
  if (contraindicationResult.hardStops.length > 0) {
    flagReasons.push(
      ...contraindicationResult.hardStops.map((h) => `HARD STOP: ${h.condition}`)
    );
  }
  if (contraindicationResult.requiresMDReview) {
    flagReasons.push(
      ...contraindicationResult.softFlags.map((s) => `MD REVIEW: ${s.condition}`)
    );
  }
  if (!qualifiesForGLP1(patient.bmi) && serviceIds.some((id) => id.startsWith('glp1'))) {
    flagReasons.push(`BMI ${patient.bmi} may not qualify for GLP-1 treatment (minimum 27 with comorbidity or 30+)`);
  }

  return {
    patient,
    medicalHistory,
    contraindicationResult,
    requiredLabs,
    qualiphyEntry,
    welcomeText,
    welcomeEmail,
    mangomintTags,
    estimatedMonthlyRevenue: revenue.monthly,
    estimatedAnnualRevenue: revenue.annual,
    crossSellOpportunities,
    pipelineStage,
    flagged: flagReasons.length > 0,
    flagReasons,
  };
}

// ============================================================
// INTAKE SUMMARY FORMATTING
// ============================================================

/**
 * Formats the intake result as a readable summary for the dashboard.
 */
export function formatIntakeSummary(result: IntakeResult): string {
  const p = result.patient;
  const lines = [
    `NEW PATIENT INTAKE SUMMARY`,
    '='.repeat(50),
    '',
    `Name: ${p.firstName} ${p.lastName}`,
    `DOB: ${p.dob}`,
    `Phone: ${p.phone}`,
    `Email: ${p.email}`,
    `Address: ${p.address.street}, ${p.address.city}, ${p.address.state} ${p.address.zip}`,
    '',
    `Height: ${Math.floor(p.heightInches / 12)}'${p.heightInches % 12}"`,
    `Weight: ${p.weightLbs} lbs`,
    `BMI: ${p.bmi} (${getBMICategory(p.bmi)})`,
    '',
    `Pipeline Stage: ${result.pipelineStage}`,
    `Estimated Monthly Revenue: $${result.estimatedMonthlyRevenue}`,
    `Estimated Annual Revenue: $${result.estimatedAnnualRevenue}`,
    '',
  ];

  // Flags
  if (result.flagged) {
    lines.push('*** FLAGS ***');
    for (const reason of result.flagReasons) {
      lines.push(`  - ${reason}`);
    }
    lines.push('');
  }

  // Required Labs
  if (result.requiredLabs.length > 0) {
    lines.push('Required Labs:');
    for (const lab of result.requiredLabs) {
      lines.push(`  - ${lab}`);
    }
    lines.push('');
  }

  // Tags
  lines.push(`Mangomint Tags: ${result.mangomintTags.join(', ')}`);
  lines.push('');

  // Cross-sell
  if (result.crossSellOpportunities.length > 0) {
    lines.push('Cross-Sell Opportunities:');
    for (const opp of result.crossSellOpportunities) {
      lines.push(`  - ${opp}`);
    }
    lines.push('');
  }

  // Qualiphy Quick Entry
  lines.push(formatQuickEntryAsText(result.qualiphyEntry));

  return lines.join('\n');
}

/**
 * Validates an intake form for required fields.
 */
export function validateIntakeForm(form: IntakeFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!form.firstName?.trim()) errors.push('First name is required.');
  if (!form.lastName?.trim()) errors.push('Last name is required.');
  if (!form.dob) errors.push('Date of birth is required.');
  if (!form.phone?.trim()) errors.push('Phone number is required.');
  if (!form.email?.trim()) errors.push('Email is required.');
  if (!form.heightFeet || form.heightFeet < 3) errors.push('Valid height is required.');
  if (!form.weightLbs || form.weightLbs < 50) errors.push('Valid weight is required.');
  if (!form.address?.street?.trim()) errors.push('Street address is required.');
  if (!form.address?.city?.trim()) errors.push('City is required.');
  if (!form.address?.state?.trim()) errors.push('State is required.');
  if (!form.address?.zip?.trim()) errors.push('ZIP code is required.');
  if (!form.servicesRequested?.length) errors.push('At least one service must be selected.');

  // Validate email format
  if (form.email && !form.email.includes('@')) {
    errors.push('Invalid email format.');
  }

  // Validate phone (at least 10 digits)
  if (form.phone) {
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) errors.push('Phone number must have at least 10 digits.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
