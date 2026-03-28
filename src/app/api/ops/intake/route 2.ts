import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { processIntake } from '@/lib/medical/intake-processor';
import { checkContraindications } from '@/lib/medical/compliance-engine';
import { getCrossSellOpportunities } from '@/lib/medical/crosssell-matrix';
import { generateMessage } from '@/lib/medical/voice-engine';
import { determineLabs } from '@/lib/medical/glp1-pipeline';
import type {
  PatientIntakeData,
  ContraindicationResult,
  LabRequirement,
  IntakeProcessingResult,
  CrossSellOpportunity,
  MangomintTag,
} from '@/lib/medical/types';

/**
 * POST /api/ops/intake
 *
 * The /intake command: accepts raw patient intake data, runs full processing pipeline.
 * Returns contraindication checks, lab requirements, Qualiphy block, welcome messages,
 * Mangomint tags, revenue estimate, and cross-sell opportunities.
 */

// GLP-1 service pricing tiers
const SERVICE_PRICING: Record<string, { monthly: number; label: string }> = {
  semaglutide_standard: { monthly: 399, label: 'Semaglutide Standard' },
  semaglutide_premium: { monthly: 499, label: 'Semaglutide Premium' },
  tirzepatide_standard: { monthly: 499, label: 'Tirzepatide Standard' },
  tirzepatide_premium: { monthly: 599, label: 'Tirzepatide Premium' },
};

// Contraindication flags
const HARD_CONTRAINDICATIONS = [
  'medullary_thyroid_carcinoma',
  'men2_syndrome',
  'pancreatitis_active',
  'pregnancy',
  'breastfeeding',
  'type1_diabetes',
];

const SOFT_CONTRAINDICATIONS = [
  'pancreatitis_history',
  'gastroparesis',
  'gallbladder_disease',
  'renal_impairment',
  'hepatic_impairment',
  'retinopathy_diabetic',
  'depression_history',
  'eating_disorder_history',
];

// Required labs by medication type
const REQUIRED_LABS: Record<string, string[]> = {
  semaglutide: ['CBC', 'CMP', 'Lipid Panel', 'HbA1c', 'TSH'],
  tirzepatide: ['CBC', 'CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Amylase', 'Lipase'],
};

// Mangomint tag mappings
const TAG_MAP: Record<string, MangomintTag> = {
  glp1_patient: { id: 'glp1', name: 'GLP-1 Patient', category: 'program' },
  semaglutide: { id: 'sema', name: 'Semaglutide', category: 'medication' },
  tirzepatide: { id: 'tirz', name: 'Tirzepatide', category: 'medication' },
  new_intake: { id: 'new', name: 'New Intake', category: 'status' },
  labs_needed: { id: 'labs', name: 'Labs Needed', category: 'status' },
  high_bmi: { id: 'hbmi', name: 'BMI 35+', category: 'clinical' },
  prior_glp1: { id: 'prior', name: 'Prior GLP-1 Experience', category: 'clinical' },
  vip_candidate: { id: 'vip', name: 'VIP Candidate', category: 'revenue' },
};

interface IntakeRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: number;
  bmi?: number;
  goalWeight?: number;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  previousGlp1?: {
    used: boolean;
    medication?: string;
    duration?: string;
    reason_stopped?: string;
  };
  preferredMedication?: 'semaglutide' | 'tirzepatide' | 'no_preference';
  referralSource?: string;
  insuranceType?: string;
  notes?: string;
}

function calculateBMI(weightLbs: number, heightStr: string): number {
  const parts = heightStr.match(/(\d+)'?\s*(\d+)"?/);
  if (!parts) return 0;
  const feet = parseInt(parts[1], 10);
  const inches = parseInt(parts[2], 10);
  const totalInches = feet * 12 + inches;
  return (weightLbs / (totalInches * totalInches)) * 703;
}

function runContraindicationChecks(
  body: IntakeRequestBody
): ContraindicationResult {
  const hardFlags: string[] = [];
  const softFlags: string[] = [];
  const warnings: string[] = [];

  const conditions = body.medicalHistory.map((c) =>
    c.toLowerCase().replace(/\s+/g, '_')
  );

  // Hard contraindications
  for (const ci of HARD_CONTRAINDICATIONS) {
    if (conditions.includes(ci)) {
      hardFlags.push(ci);
    }
  }

  // Pregnancy/breastfeeding check
  if (body.gender === 'female') {
    warnings.push('Confirm pregnancy status before prescribing');
  }

  // Soft contraindications
  for (const ci of SOFT_CONTRAINDICATIONS) {
    if (conditions.includes(ci)) {
      softFlags.push(ci);
    }
  }

  // Medication interactions
  const riskyMeds = ['insulin', 'sulfonylurea', 'metformin'];
  for (const med of body.currentMedications) {
    if (riskyMeds.some((r) => med.toLowerCase().includes(r))) {
      warnings.push(`Current medication interaction: ${med} - requires dose adjustment monitoring`);
    }
  }

  // BMI check
  const bmi = body.bmi || calculateBMI(body.weight, body.height);
  if (bmi < 25) {
    warnings.push(`BMI ${bmi.toFixed(1)} is below typical treatment threshold (25+). Document clinical justification.`);
  }
  if (bmi >= 40) {
    warnings.push(`BMI ${bmi.toFixed(1)} is Class III obesity. Consider higher starting dose protocol.`);
  }

  return {
    cleared: hardFlags.length === 0,
    hardContraindications: hardFlags,
    softContraindications: softFlags,
    warnings,
    requiresProviderReview: softFlags.length > 0 || warnings.length > 2,
  };
}

function determineRequiredLabs(
  body: IntakeRequestBody,
  contraindications: ContraindicationResult
): LabRequirement[] {
  const medication = body.preferredMedication || 'semaglutide';
  const baseLabs = REQUIRED_LABS[medication] || REQUIRED_LABS.semaglutide;

  const labs: LabRequirement[] = baseLabs.map((lab) => ({
    name: lab,
    required: true,
    reason: 'Baseline screening',
    validityDays: 90,
  }));

  // Additional labs based on conditions
  if (contraindications.softContraindications.includes('renal_impairment')) {
    labs.push({ name: 'GFR', required: true, reason: 'Renal function monitoring', validityDays: 90 });
    labs.push({ name: 'Urinalysis', required: true, reason: 'Renal function monitoring', validityDays: 90 });
  }

  if (contraindications.softContraindications.includes('hepatic_impairment')) {
    labs.push({ name: 'Liver Panel', required: true, reason: 'Hepatic function monitoring', validityDays: 90 });
  }

  if (body.previousGlp1?.used) {
    labs.push({ name: 'Pancreatic Enzymes', required: true, reason: 'Prior GLP-1 use follow-up', validityDays: 90 });
  }

  return labs;
}

function generateQualiphyBlock(
  body: IntakeRequestBody,
  labs: LabRequirement[]
): Record<string, unknown> {
  const bmi = body.bmi || calculateBMI(body.weight, body.height);

  return {
    patientInfo: {
      name: `${body.firstName} ${body.lastName}`,
      dob: body.dateOfBirth,
      gender: body.gender,
      phone: body.phone,
      email: body.email,
    },
    clinicalData: {
      height: body.height,
      weight: body.weight,
      bmi: parseFloat(bmi.toFixed(1)),
      goalWeight: body.goalWeight || null,
    },
    medicalHistory: body.medicalHistory,
    currentMedications: body.currentMedications,
    allergies: body.allergies,
    previousGlp1: body.previousGlp1 || { used: false },
    requestedMedication: body.preferredMedication || 'provider_decision',
    requiredLabs: labs.map((l) => l.name),
    notes: body.notes || '',
    quickEntryCode: `RANI-${body.lastName.toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`,
  };
}

function determineTags(body: IntakeRequestBody): MangomintTag[] {
  const tags: MangomintTag[] = [TAG_MAP.glp1_patient, TAG_MAP.new_intake, TAG_MAP.labs_needed];

  const bmi = body.bmi || calculateBMI(body.weight, body.height);

  if (body.preferredMedication === 'tirzepatide') {
    tags.push(TAG_MAP.tirzepatide);
  } else {
    tags.push(TAG_MAP.semaglutide);
  }

  if (bmi >= 35) {
    tags.push(TAG_MAP.high_bmi);
  }

  if (body.previousGlp1?.used) {
    tags.push(TAG_MAP.prior_glp1);
  }

  // VIP candidate: high BMI + tirzepatide preference = higher revenue potential
  if (bmi >= 35 && body.preferredMedication === 'tirzepatide') {
    tags.push(TAG_MAP.vip_candidate);
  }

  return tags;
}

function estimateRevenue(body: IntakeRequestBody): {
  monthlyEstimate: number;
  sixMonthEstimate: number;
  twelveMonthEstimate: number;
  tier: string;
  crossSellPotential: number;
} {
  const bmi = body.bmi || calculateBMI(body.weight, body.height);
  let tier = 'semaglutide_standard';

  if (body.preferredMedication === 'tirzepatide') {
    tier = bmi >= 35 ? 'tirzepatide_premium' : 'tirzepatide_standard';
  } else {
    tier = bmi >= 35 ? 'semaglutide_premium' : 'semaglutide_standard';
  }

  const pricing = SERVICE_PRICING[tier];
  const monthly = pricing.monthly;

  // Cross-sell potential based on profile
  let crossSellPotential = 0;
  if (bmi >= 30) crossSellPotential += 200; // Wellness injections
  if (body.gender === 'female') crossSellPotential += 300; // Aesthetic services
  if (body.previousGlp1?.used) crossSellPotential += 100; // Already invested in wellness

  return {
    monthlyEstimate: monthly,
    sixMonthEstimate: monthly * 6,
    twelveMonthEstimate: monthly * 12,
    tier: pricing.label,
    crossSellPotential,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: IntakeRequestBody = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone' },
        { status: 400 }
      );
    }

    if (!body.weight || !body.height) {
      return NextResponse.json(
        { error: 'Missing required fields: weight, height' },
        { status: 400 }
      );
    }

    // Calculate BMI if not provided
    if (!body.bmi) {
      body.bmi = calculateBMI(body.weight, body.height);
    }

    // 1. Run contraindication checks
    const contraindications = runContraindicationChecks(body);

    // 2. Determine required labs
    const labs = determineRequiredLabs(body, contraindications);

    // 3. Generate Qualiphy quick-entry block
    const qualiphyBlock = generateQualiphyBlock(body, labs);

    // 4. Draft welcome messages using voice engine
    const welcomeSms = await generateMessage('welcome_sms', {
      patientName: body.firstName,
      medication: body.preferredMedication || 'your prescribed medication',
    });

    const welcomeEmail = await generateMessage('welcome_email', {
      patientName: body.firstName,
      lastName: body.lastName,
      medication: body.preferredMedication || 'your prescribed medication',
      labList: labs.map((l) => l.name).join(', '),
    });

    // 5. Determine Mangomint tags
    const tags = determineTags(body);

    // 6. Calculate estimated revenue
    const revenue = estimateRevenue(body);

    // 7. Flag cross-sell opportunities
    const crossSellOps = await getCrossSellOpportunities({
      patientName: `${body.firstName} ${body.lastName}`,
      currentServices: ['glp1'],
      bmi: body.bmi,
      gender: body.gender,
      medicalHistory: body.medicalHistory,
    });

    // 8. Process intake through the main pipeline
    const processingResult = await processIntake({
      patientData: body,
      contraindications,
      labs,
      qualiphyBlock,
      tags,
      revenue,
    });

    const result: IntakeProcessingResult = {
      status: contraindications.cleared ? 'ready_for_labs' : 'requires_review',
      patient: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: body.phone,
        bmi: parseFloat(body.bmi.toFixed(1)),
        goalWeight: body.goalWeight || null,
      },
      contraindications,
      labs,
      qualiphyBlock,
      messages: {
        sms: welcomeSms,
        email: welcomeEmail,
      },
      mangomintTags: tags,
      revenue,
      crossSellOpportunities: crossSellOps,
      processingId: processingResult.id,
      nextSteps: contraindications.cleared
        ? [
            'Send welcome text + email',
            `Order labs: ${labs.map((l) => l.name).join(', ')}`,
            'Apply Mangomint tags',
            'Schedule Qualiphy GFE after labs received',
          ]
        : [
            'PROVIDER REVIEW REQUIRED - contraindication flags present',
            `Review: ${contraindications.hardContraindications.join(', ')}`,
            'Document clinical decision before proceeding',
          ],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/intake] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process intake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
