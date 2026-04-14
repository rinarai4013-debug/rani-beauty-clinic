/**
 * POST /api/consultation/submit
 *
 * Receives wizard form data + photos, creates a MastermindSession,
 * and optionally runs the Aura Scan. Returns session ID.
 *
 * Flow:
 *   1. Parse multipart FormData (JSON data + photo files)
 *   2. Process first photo via Sharp → base64 data URL
 *   3. Create MastermindSession with intake data + source photo
 *   4. Optionally trigger Aura Scan (async, non-blocking)
 *   5. Return session ID for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createSession, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { submitIntakeSchema } from '@/lib/consultation/schema';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import {
  metabolicIntakeSchema,
  type MetabolicGoal,
  type MetabolicRecommendation,
  type MetabolicSymptom,
  type MetabolicTrack,
} from '@/lib/metabolic/matrix';
import { buildUnifiedIntakeDecisionBundle } from '@/lib/metabolic/unified-intake-engine';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import {
  enforceAllowedPublicOrigin,
  enforceContentLength,
  normalizeEmailForLimit,
} from '@/lib/security/public-intent-guard';
import { logEvent } from '@/lib/logging/structured-logger';
import { withSentry } from '@/lib/sentry-utils';

const MAX_PHOTO_WIDTH = 1200;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_JSON_REQUEST_BYTES = 512 * 1024;
const MAX_MULTIPART_REQUEST_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

type ConsultationIntakePayload = Partial<ConsultationFormData> & {
  metabolicRecommendation?: MetabolicRecommendation;
  metabolicProgramBundle?: {
    primaryTrack: MetabolicTrack;
    alternatives: Array<{
      track: MetabolicTrack;
      status: MetabolicRecommendation['status'];
      recommendedFulfillment: 'clinic' | 'home';
    }>;
  };
};

const TRACK_HINTS: Array<{ track: MetabolicTrack; terms: string[] }> = [
  { track: 'glp1', terms: ['glp', 'semaglutide', 'tirzepatide', 'weight-management', 'weight loss', 'ozempic', 'mounjaro'] },
  { track: 'hormones', terms: ['hormone', 'hrt', 'trt', 'thyroid', 'menopause', 'andropause'] },
  { track: 'peptides', terms: ['peptide', 'bpc', 'cjc', 'ipamorelin', 'recovery', 'performance'] },
  { track: 'hybrid', terms: ['hybrid', 'combined', 'combination', 'glp + hormone'] },
];

const GOAL_HINTS: Array<{ goal: MetabolicGoal; terms: string[] }> = [
  { goal: 'weight-loss', terms: ['weight loss', 'lose weight', 'fat loss', 'slim'] },
  { goal: 'body-recomposition', terms: ['recomposition', 'tone', 'muscle', 'body contour'] },
  { goal: 'metabolic-health', terms: ['metabolic', 'blood sugar', 'insulin', 'a1c'] },
  { goal: 'energy', terms: ['energy', 'fatigue', 'tired'] },
  { goal: 'hormone-balance', terms: ['hormone', 'menopause', 'libido', 'cycle'] },
  { goal: 'recovery', terms: ['recovery', 'injury', 'inflammation'] },
  { goal: 'longevity', terms: ['longevity', 'healthy aging', 'optimize healthspan'] },
  { goal: 'performance', terms: ['performance', 'athletic', 'stamina'] },
];

const SYMPTOM_HINTS: Array<{ symptom: MetabolicSymptom; terms: string[] }> = [
  { symptom: 'appetite-dysregulation', terms: ['appetite', 'hungry', 'overeating'] },
  { symptom: 'sugar-cravings', terms: ['sugar craving', 'sweet craving', 'carb craving'] },
  { symptom: 'weight-plateau', terms: ['plateau', 'stalled', 'not losing'] },
  { symptom: 'fatigue', terms: ['fatigue', 'low energy', 'tired'] },
  { symptom: 'brain-fog', terms: ['brain fog', 'focus', 'concentration'] },
  { symptom: 'low-libido', terms: ['low libido', 'libido'] },
  { symptom: 'poor-sleep', terms: ['poor sleep', 'insomnia', 'sleep'] },
  { symptom: 'mood-swings', terms: ['mood', 'irritable', 'anxious'] },
  { symptom: 'slow-recovery', terms: ['slow recovery', 'recover slowly', 'sore'] },
  { symptom: 'inflammation', terms: ['inflammation', 'inflamed'] },
  { symptom: 'muscle-loss', terms: ['muscle loss', 'sarcopenia'] },
  { symptom: 'water-retention', terms: ['water retention', 'bloating fluid'] },
  { symptom: 'gut-bloating', terms: ['gut', 'bloating', 'bloat'] },
];

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function hasAnyTerm(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function inferTrack(intakeData: Partial<ConsultationFormData>): MetabolicTrack | undefined {
  const intakeRecord = intakeData as Record<string, unknown>;
  if (typeof intakeRecord.metabolicTrackPreference === 'string') {
    const raw = intakeRecord.metabolicTrackPreference;
    if (raw === 'glp1' || raw === 'hormones' || raw === 'peptides' || raw === 'hybrid') return raw;
  }

  const interests = normalizeList(intakeData.treatmentInterests).join(' ').toLowerCase();
  if (!interests) return undefined;
  return TRACK_HINTS.find((entry) => hasAnyTerm(interests, entry.terms))?.track;
}

function inferGoals(text: string): MetabolicGoal[] {
  const matches = GOAL_HINTS.filter((entry) => hasAnyTerm(text, entry.terms)).map((entry) => entry.goal);
  return matches.length > 0 ? matches : ['metabolic-health'];
}

function inferSymptoms(text: string): MetabolicSymptom[] {
  const matches = SYMPTOM_HINTS.filter((entry) => hasAnyTerm(text, entry.terms)).map((entry) => entry.symptom);
  return matches.length > 0 ? matches : ['fatigue'];
}

function buildMetabolicFromConsultation(
  intakeData: Partial<ConsultationFormData>,
  patientName: string,
  patientEmail: string,
) {
  const intakeRecord = intakeData as Record<string, unknown>;
  const concernText = normalizeList(intakeData.skinConcerns).join(', ');
  const targetAreaText = normalizeList(intakeData.targetAreas).join(', ');
  const treatmentText = normalizeList(intakeData.treatmentInterests).join(', ');
  const goalsText = typeof intakeData.goals === 'string' ? intakeData.goals : '';
  const historyText = typeof intakeData.treatmentHistory === 'string' ? intakeData.treatmentHistory : '';

  const inferenceText = [goalsText, historyText, concernText, targetAreaText, treatmentText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const [firstToken, ...restTokens] = patientName.trim().split(/\s+/).filter(Boolean);
  const firstName = (typeof intakeData.firstName === 'string' && intakeData.firstName.trim()) || firstToken || 'Patient';
  const lastName = (typeof intakeData.lastName === 'string' && intakeData.lastName.trim()) || restTokens.join(' ') || 'Consultation';

  const candidate = {
    firstName,
    lastName,
    email: patientEmail,
    phone: typeof intakeData.phone === 'string' ? intakeData.phone : '',
    goals: inferGoals(inferenceText),
    symptoms: inferSymptoms(inferenceText),
    preferredTrack: inferTrack(intakeData),
    fulfillmentPreference: intakeRecord.fulfillmentPreference === 'home' ? 'home' : 'clinic',
    timelineWeeks: intakeData.timeline === 'asap' ? 4 : undefined,
    currentMeds: historyText,
    notes: goalsText,
    source: 'consultation-submit',
    medicalFlags: {
      pregnant: intakeData.pregnant === true,
      breastfeeding: intakeData.breastfeeding === true,
      thyroidCancerHistory: intakeRecord.thyroidCancerHistory === true,
      pancreatitisHistory: intakeRecord.pancreatitisHistory === true,
      gallbladderDisease: intakeRecord.gallbladderDisease === true,
      uncontrolledHypertension: intakeRecord.uncontrolledHypertension === true,
      severeDepression: intakeRecord.severeDepression === true,
      eatingDisorderHistory: intakeRecord.eatingDisorderHistory === true,
    },
    labs: {
      baselineLabsCompleted: intakeRecord.baselineLabsCompleted === true,
    },
  };

  const parsed = metabolicIntakeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export async function POST(request: NextRequest) {
  return withSentry('consultation/submit', async () => {
    try {
    const originError = enforceAllowedPublicOrigin(request);
    if (originError) return originError;

    const contentType = request.headers.get('content-type') || '';
    const requestLimit = contentType.includes('multipart/form-data')
      ? MAX_MULTIPART_REQUEST_BYTES
      : MAX_JSON_REQUEST_BYTES;
    const sizeError = enforceContentLength(request, requestLimit);
    if (sizeError) return sizeError;

    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('consultation-submit', ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    const formData = await request.formData();

    // 1. Parse JSON data
    const dataField = formData.get('data');
    if (!dataField || typeof dataField !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing form data' },
        { status: 400 }
      );
    }

    // Tier 1 zod (2026-04-11): upgrade from z.record(z.unknown()) to
    // submitIntakeSchema — this locks name/email/phone/skinConcerns/
    // targetAreas/etc. to their declared types when present. Still
    // .partial() + .passthrough() so wizards that bail out mid-way
    // don't get rejected, and unknown keys flow through for logging.
    let intakeData: Partial<ConsultationFormData>;
    let rawIntakeJson: unknown;
    try {
      rawIntakeJson = JSON.parse(dataField);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid form data JSON' },
        { status: 400 }
      );
    }

    const parsed = submitIntakeSchema.safeParse(rawIntakeJson);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data payload',
          details: parsed.error.issues,
        },
        { status: 422 }
      );
    }
    intakeData = parsed.data as Partial<ConsultationFormData>;

    // 2. Process scan media — extract first valid image as source
    let sourcePhotoUrl: string | null = null;
    const photoFiles = formData.getAll('photos');
    const auraFiles = formData.getAll('aura');
    const mediaFiles = [...photoFiles, ...auraFiles];

    for (const file of mediaFiles) {
      if (!(file instanceof File)) continue;
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_PHOTO_SIZE) continue;

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        let image = isPdf
          ? sharp(buffer, { density: 144, pages: 1 }).flatten({ background: '#ffffff' })
          : sharp(buffer);
        const metadata = await image.metadata();

        if (metadata.width && metadata.width > MAX_PHOTO_WIDTH) {
          image = image.resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true });
        }

        const processed = await image.jpeg({ quality: 85 }).toBuffer();
        sourcePhotoUrl = `data:image/jpeg;base64,${processed.toString('base64')}`;
        break; // Use first valid photo as simulation source
      } catch (err) {
        logEvent('api', 'warn', '[Consultation Submit] Photo processing failed', {
          error: err instanceof Error ? err.message : String(err),
        });
        continue;
      }
    }

    // 3. Create MastermindSession
    const patientName = `${intakeData.firstName || ''} ${intakeData.lastName || ''}`.trim();
    const patientEmail = (intakeData.email as string) || '';

    if (!patientEmail) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 },
      );
    }

    if (!sourcePhotoUrl && auraFiles.some((f) => f instanceof File && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')))) {
      logEvent('api', 'warn', '[Consultation Submit] Aura PDF uploaded but no image extracted');
    }

    const metabolicIntake = buildMetabolicFromConsultation(intakeData, patientName, patientEmail);
    const metabolicBundle = metabolicIntake
      ? buildUnifiedIntakeDecisionBundle(metabolicIntake)
      : null;
    const metabolicRecommendation = metabolicBundle?.primary.recommendation ?? null;
    const metabolicPackages = metabolicBundle?.primary.packages ?? [];
    const dosagePlan = metabolicBundle?.primary.dosagePlan ?? null;
    const trajectory = metabolicBundle?.primary.trajectory ?? null;

    const scopedLimit = rateLimit(
      'consultation-submit-email',
      `${ip}:${normalizeEmailForLimit(patientEmail)}`,
      { limit: 3, windowMs: 10 * 60_000 },
    );
    if (!scopedLimit.allowed) return rateLimitResponse(scopedLimit.resetIn);

    const intakePayload: ConsultationIntakePayload = metabolicRecommendation
      ? {
          ...intakeData,
          metabolicRecommendation,
          ...(metabolicBundle
            ? {
                metabolicProgramBundle: {
                  primaryTrack: metabolicBundle.primaryTrack,
                  alternatives: metabolicBundle.alternatives.map((program) => ({
                    track: program.track,
                    status: program.recommendation.status,
                    recommendedFulfillment: program.recommendation.fulfillment.recommended,
                  })),
                },
              }
            : {}),
        }
      : intakeData;

    const session = createSession({
      intakeData: intakePayload,
      patientName,
      patientEmail,
      sourcePhotoUrl,
    });
    await saveSessionAsync(session);

    // 4. Write to Airtable Client Intakes table (non-blocking — CRM pipeline + n8n triggers)
    // Include rich intake data so clinic staff can act on it immediately
    try {
      const concerns = Array.isArray(intakeData.skinConcerns)
        ? (intakeData.skinConcerns as string[]).join(', ')
        : '';
      const areas = Array.isArray(intakeData.targetAreas)
        ? (intakeData.targetAreas as string[]).join(', ')
        : '';
      const goals = typeof intakeData.goals === 'string' ? intakeData.goals : '';
      const timeline = typeof intakeData.timeline === 'string' ? intakeData.timeline : '';
      const budget = typeof intakeData.budget === 'string' ? intakeData.budget : '';

      const intakeSummaryLines = [
        `Skin Concerns: ${concerns || 'Not specified'}`,
        `Target Areas: ${areas || 'Not specified'}`,
        goals ? `Goals: ${goals}` : '',
        timeline ? `Timeline: ${timeline}` : '',
        budget ? `Budget: ${budget}` : '',
        sourcePhotoUrl ? 'Photo: Uploaded' : 'Photo: None',
        `Session ID: ${session.id}`,
      ].filter(Boolean);

      if (metabolicRecommendation) {
        const tierSummary = metabolicRecommendation.tiers
          .map((tier) => `${tier.title} (${tier.monthlyEstimate})`)
          .join(' | ');

        intakeSummaryLines.push(
          '',
          `Metabolic Track: ${metabolicRecommendation.recommendedTrack}`,
          `Metabolic Status: ${metabolicRecommendation.status}`,
          `Metabolic Fulfillment: ${metabolicRecommendation.fulfillment.recommended}`,
          ...(metabolicBundle
            ? [`Metabolic Alternatives: ${metabolicBundle.alternatives.map((program) => program.track).join(', ')}`]
            : []),
          `Metabolic Tiers: ${tierSummary}`,
          `Provider Dosing Framework: ${metabolicRecommendation.providerHandoff.dosingFramework.slice(0, 2).join(' / ')}`,
        );
      }

      const intakeSummary = intakeSummaryLines.join('\n');

      await rateLimitedQuery(async () => {
        await Tables.intakes().create(
          {
            'Full Name': patientName,
            'Email': patientEmail,
            'Phone Number': (intakeData.phone as string) || '',
            'Processing Status': 'New',
            'Intake Summary (AI)': intakeSummary,
          },
          { typecast: true }
        );
      });
    } catch (err) {
      // Airtable write failure is non-blocking — session still created
      logEvent('api', 'warn', '[Consultation Submit] Airtable intake write failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // 5. Auto-run Aura Scan (truly non-blocking — don't hold up the response)
    // The scan can take 10-30s with Claude AI; returning the session ID
    // immediately prevents Vercel function timeouts and gives the client
    // a responsive experience. The dashboard polls for scan completion.
    const useMock = process.env.USE_MOCK_AI === 'true';
    const useAIScan = !!process.env.ANTHROPIC_API_KEY && !useMock;

    const scanPromise = (async () => {
      try {
        let scanResult;
        if (useMock) {
          scanResult = mockAuraScanResult();
        } else if (useAIScan) {
          const { runAIAuraScan } = await import('@/lib/mastermind/ai-aura-scan');
          scanResult = await runAIAuraScan(intakeData, sourcePhotoUrl || undefined);
        } else {
          scanResult = await runAuraScan(intakeData);
        }

        const scanned = sessionReducer(session, {
          type: 'SET_SCAN_RESULT',
          result: scanResult,
        });
        await saveSessionAsync(scanned);
        logEvent('api', 'info', '[Consultation Submit] Auto-scan completed', {
          sessionId: session.id,
        });
      } catch (err) {
        logEvent('api', 'error', '[Consultation Submit] Auto-scan failed', {
          sessionId: session.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    // For mock/rule-based scans (fast), wait briefly so the session
    // is ready when the dashboard loads. For AI scans, don't block.
    if (useMock || !useAIScan) {
      await scanPromise;
    }
    // AI scan runs in background — client polls /api/mastermind/session for completion

    // 6. Return session ID
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        patientName,
        hasPhoto: !!sourcePhotoUrl,
        phase: session.phase,
        metabolicRecommendation: metabolicRecommendation
          ? {
              track: metabolicRecommendation.recommendedTrack,
              status: metabolicRecommendation.status,
              fulfillment: metabolicRecommendation.fulfillment.recommended,
              tiers: metabolicRecommendation.tiers.map((tier) => ({
                tier: tier.tier,
                title: tier.title,
                monthlyEstimate: tier.monthlyEstimate,
              })),
            }
          : null,
        metabolicPackages: metabolicPackages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          tier: pkg.tier,
          monthlyEstimate: pkg.monthlyEstimate,
          fulfillmentModes: pkg.fulfillmentModes,
          pulseSchedule: pkg.pulseSchedule,
          doseFramework: pkg.doseFramework,
          improvementTargets: pkg.improvementTargets,
        })),
        metabolicProgramBundle: metabolicBundle
          ? {
              primaryTrack: metabolicBundle.primaryTrack,
              alternatives: metabolicBundle.alternatives.map((program) => ({
                track: program.track,
                status: program.recommendation.status,
                fulfillment: program.recommendation.fulfillment.recommended,
              })),
            }
          : null,
        dosagePlan,
        trajectory,
      },
    });
    } catch (error) {
      logEvent('api', 'error', '[Consultation Submit] Error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Submission failed',
        },
        { status: 500 }
      );
    }
  });
}
