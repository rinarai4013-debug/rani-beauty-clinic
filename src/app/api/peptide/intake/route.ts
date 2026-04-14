import { NextRequest, NextResponse } from 'next/server';
import { Tables, createRecord } from '@/lib/airtable/client';
import { getClientIP, RATE_LIMITS, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';
import { logEvent } from '@/lib/logging/structured-logger';
import { peptideIntakeSchema } from '@/lib/metabolic/peptide-intake-schema';
import { generatePeptideRecommendation } from '@/lib/metabolic/peptide-tier-matrix';
import { buildPeptideDoseGovernance } from '@/lib/metabolic/dosing-engine';
import { buildPeptideTierTrajectory } from '@/lib/metabolic/trajectory-engine';
import { metabolicIntakeSchema, type MetabolicGoal, type MetabolicSymptom } from '@/lib/metabolic/matrix';
import { buildUnifiedIntakeDecisionBundle } from '@/lib/metabolic/unified-intake-engine';

const MAX_REQUEST_BYTES = 128 * 1024;

const PEPTIDE_TO_METABOLIC_GOALS: Record<string, MetabolicGoal> = {
  recovery: 'recovery',
  performance: 'performance',
  longevity: 'longevity',
  'body-recomposition': 'body-recomposition',
  'gut-health': 'metabolic-health',
  'skin-rejuvenation': 'longevity',
  'injury-repair': 'recovery',
  'immune-support': 'metabolic-health',
};

const PEPTIDE_TO_METABOLIC_SYMPTOMS: Record<string, MetabolicSymptom> = {
  'slow-recovery': 'slow-recovery',
  inflammation: 'inflammation',
  'gut-bloating': 'gut-bloating',
  'poor-sleep': 'poor-sleep',
  fatigue: 'fatigue',
  'muscle-loss': 'muscle-loss',
  'joint-pain': 'slow-recovery',
  'post-surgical-healing': 'slow-recovery',
  'tendon-injury': 'slow-recovery',
  'skin-dullness': 'brain-fog',
  'hair-thinning': 'fatigue',
  'immune-fragility': 'inflammation',
};

export async function POST(req: NextRequest) {
  return withSentry('peptide/intake', async () => {
    const originError = enforceAllowedPublicOrigin(req);
    if (originError) return originError;

    const sizeError = enforceContentLength(req, MAX_REQUEST_BYTES);
    if (sizeError) return sizeError;

    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('peptide-intake', ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = peptideIntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid peptide intake payload', details: parsed.error.issues },
        { status: 422 },
      );
    }

    const intake = parsed.data;
    const recommendation = generatePeptideRecommendation(intake);
    const selectedTier =
      recommendation.recommendedTier === 'foundation'
        ? 'foundation'
        : recommendation.recommendedTier === 'performance'
          ? 'performance'
          : 'elite';
    const dosage = buildPeptideDoseGovernance(
      selectedTier,
      recommendation.fulfillment.recommended,
      intake.labs.baselineLabsCompleted,
    );
    const trajectory = buildPeptideTierTrajectory(selectedTier, 6);

    const mappedGoals = intake.goals
      .map((goal) => PEPTIDE_TO_METABOLIC_GOALS[goal])
      .filter((goal): goal is MetabolicGoal => Boolean(goal));
    const mappedSymptoms = intake.symptoms
      .map((symptom) => PEPTIDE_TO_METABOLIC_SYMPTOMS[symptom])
      .filter((symptom): symptom is MetabolicSymptom => Boolean(symptom));

    const metabolicCandidate = metabolicIntakeSchema.safeParse({
      firstName: intake.firstName,
      lastName: intake.lastName,
      email: intake.email,
      phone: intake.phone,
      goals: mappedGoals.length > 0 ? mappedGoals : ['recovery'],
      symptoms: mappedSymptoms.length > 0 ? mappedSymptoms : ['fatigue'],
      preferredTrack: 'peptides',
      fulfillmentPreference: intake.fulfillmentPreference,
      currentMeds: intake.currentMeds,
      notes: '',
      source: intake.source,
      medicalFlags: {
        pregnant: intake.medicalFlags.pregnant,
        breastfeeding: intake.medicalFlags.breastfeeding,
        thyroidCancerHistory: intake.medicalFlags.activeCancer,
        pancreatitisHistory: false,
        gallbladderDisease: false,
        uncontrolledHypertension: false,
        severeDepression: false,
        eatingDisorderHistory: false,
      },
      labs: {
        baselineLabsCompleted: intake.labs.baselineLabsCompleted,
      },
    });

    const crossSellBundle = metabolicCandidate.success
      ? buildUnifiedIntakeDecisionBundle(metabolicCandidate.data)
      : null;

    const summary = [
      `Peptide Track: ${recommendation.track}`,
      `Tier: ${recommendation.recommendedTier}`,
      `Status: ${recommendation.status}`,
      `Fulfillment Preference: ${intake.fulfillmentPreference}`,
      `Fulfillment Recommended: ${recommendation.fulfillment.recommended}`,
      `Goals: ${intake.goals.join(', ')}`,
      `Symptoms: ${intake.symptoms.join(', ')}`,
      recommendation.blockedCompounds.length > 0
        ? `Blocked Compounds: ${recommendation.blockedCompounds.join(', ')}`
        : null,
      recommendation.riskFlags.length > 0
        ? `Risk Flags: ${recommendation.riskFlags.join(' | ')}`
        : null,
      crossSellBundle
        ? `Cross-Sell Tracks: ${crossSellBundle.alternatives.map((program) => program.track).join(', ')}`
        : null,
      `Current Meds: ${intake.currentMeds || 'none provided'}`,
      `Source: ${intake.source}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await createRecord(Tables.intakes(), {
        'Full Name': `${intake.firstName} ${intake.lastName}`.trim(),
        Email: intake.email,
        ...(intake.phone ? { 'Phone Number': intake.phone } : {}),
        'Processing Status': 'New',
        'Intake Summary (AI)': summary,
      });
    } catch (error) {
      logEvent('api', 'warn', '[peptide/intake] Airtable write failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        intake: {
          firstName: intake.firstName,
          lastName: intake.lastName,
          email: intake.email,
          goals: intake.goals,
          symptoms: intake.symptoms,
          fulfillmentPreference: intake.fulfillmentPreference,
        },
        recommendation,
        dosage,
        trajectory,
        crossSellBundle,
        nextSteps: {
          clinic: '/peptide/intake?checkout=clinic',
          home: '/peptide/intake?checkout=home',
        },
      },
    });
  });
}
