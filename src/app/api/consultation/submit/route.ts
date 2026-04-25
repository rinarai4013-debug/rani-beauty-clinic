/**
 * POST /api/consultation/submit
 *
 * Receives consultation intake data + photos, creates a MastermindSession,
 * and optionally runs the Aura Scan pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createSession, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import {
  extractAuraPdfInsights,
  extractAuraPdfInsightsFromText,
  applyAuraPdfInsightsToScan,
  type AuraPdfInsights,
} from '@/lib/mastermind/aura-pdf';
import { parseAuraPdfTextFallbackMarkers } from '@/lib/mastermind/aura-pdf-fallback';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import {
  submitIntakeSchema,
  type ConsultationFormData,
  type ConsultationSubmitData,
} from '@/lib/consultation/schema';
import { recommendBoomRxBySymptoms } from '@/lib/medical/symptom-product-matrix';
import {
  BOOMRX_FORMULARY_ITEMS,
  type BoomRxCategory,
} from '@/lib/medical/boomrx-formulary';
import { generateFullMetabolicRecommendation, type MetabolicIntake } from '@/lib/metabolic/matrix';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import {
  enforceAllowedPublicOrigin,
  enforceContentLength,
  normalizeEmailForLimit,
} from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';
import { SessionStoreError } from '@/lib/mastermind/session-store';
import { logEvent } from '@/lib/logging/structured-logger';

const MAX_PHOTO_WIDTH = 1200;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB each
const MAX_AURA_PDF_SIZE = 10 * 1024 * 1024; // 10MB per Aura PDF
const MAX_PHOTOS = 5;
const MAX_TOTAL_UPLOAD_SIZE = 30 * 1024 * 1024; // 30MB total
const MAX_JSON_REQUEST_BYTES = 512 * 1024;
const MAX_MULTIPART_REQUEST_BYTES = 35 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

const LEGACY_CONCERN_MAP: Record<string, string[]> = {
  acne: ['acne'],
  'acne-scars': ['acne', 'dull-skin'],
  hyperpigmentation: ['hyperpigmentation'],
  'fine-lines': ['aging-skin'],
  texture: ['dull-skin', 'large-pores'],
  laxity: ['skin-laxity'],
  dryness: ['dull-skin'],
  'hair-removal': ['unwanted-hair'],
  scars: ['dull-skin'],
  undereye: ['aging-skin', 'hyperpigmentation'],
  rosacea: ['sun-damage'],
  'large-pores': ['large-pores'],
};

const LEGACY_BUDGET_MAP: Record<string, ConsultationFormData['budget']> = {
  'under-500': 'starter',
  '500-1500': 'moderate',
  '1500-3000': 'premium',
  '3000-5000': 'investment',
  '5000-plus': 'investment',
};

const CONCERN_TO_MEDICAL_SYMPTOM: Record<string, string> = {
  acne: 'acne-breakouts',
  'aging-skin': 'poor-sleep-recovery',
  hyperpigmentation: 'hyperpigmentation-skin-dullness',
  'skin-laxity': 'muscle-loss-low-performance',
  'dull-skin': 'hyperpigmentation-skin-dullness',
  'body-contouring': 'difficulty-losing-weight',
  'sun-damage': 'hyperpigmentation-skin-dullness',
  'large-pores': 'acne-breakouts',
};

const METABOLIC_GOAL_HINTS: Record<string, Array<MetabolicIntake['goals'][number]>> = {
  glp1: ['weight-loss', 'body-recomposition', 'metabolic-health'],
  hormones: ['hormone-balance', 'energy', 'longevity'],
  peptides: ['recovery', 'performance', 'longevity'],
  hybrid: ['weight-loss', 'hormone-balance', 'recovery'],
};

const METABOLIC_SYMPTOM_HINTS: Record<string, Array<MetabolicIntake['symptoms'][number]>> = {
  glp1: ['appetite-dysregulation', 'sugar-cravings', 'weight-plateau'],
  hormones: ['fatigue', 'brain-fog', 'low-libido', 'poor-sleep', 'mood-swings'],
  peptides: ['slow-recovery', 'inflammation', 'muscle-loss', 'fatigue'],
  hybrid: ['appetite-dysregulation', 'fatigue', 'poor-sleep', 'slow-recovery'],
};

function getPayloadCandidate(rawPayload: unknown): Record<string, unknown> {
  if (!rawPayload || typeof rawPayload !== 'object') return {};

  const payload = rawPayload as Record<string, unknown>;
  const candidateKeys = ['data', 'payload', 'intake'];

  for (const key of candidateKeys) {
    const value = payload[key];
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
  }

  return payload;
}

function coerceString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
    return filtered.length > 0 ? filtered : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.includes(',')) {
      const parts = trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return parts.length > 0 ? parts : undefined;
    }
    return [trimmed];
  }

  return undefined;
}

function normalizePhone(value: unknown): string | undefined {
  const raw = coerceString(value);
  if (!raw) return undefined;

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    const local = digits.slice(1);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return undefined;
}

function normalizeDob(value: unknown): string | undefined {
  const raw = coerceString(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age >= 18 ? raw : undefined;
}

function normalizeSkinConcerns(payload: Record<string, unknown>): string[] | undefined {
  const concerns = [
    ...(coerceStringArray(payload.skinConcerns) ?? []),
    ...(coerceStringArray(payload.concerns) ?? []),
  ];

  if (concerns.length === 0) return undefined;

  const normalized = new Set<string>();
  for (const concern of concerns) {
    const key = concern.toLowerCase();
    const mapped = LEGACY_CONCERN_MAP[key] ?? [key];
    for (const item of mapped) {
      normalized.add(item);
    }
  }

  return normalized.size > 0 ? Array.from(normalized) : undefined;
}

function normalizeBudget(value: unknown): ConsultationFormData['budget'] | undefined {
  const raw = coerceString(value);
  if (!raw) return undefined;
  const key = raw.toLowerCase();

  if (key === 'starter' || key === 'moderate' || key === 'premium' || key === 'investment') {
    return key as ConsultationFormData['budget'];
  }
  return LEGACY_BUDGET_MAP[key];
}

function normalizeTimeline(payload: Record<string, unknown>): ConsultationFormData['timeline'] | undefined {
  const raw = coerceString(payload.timeline)?.toLowerCase();
  if (raw) {
    if (raw === 'event' || raw === 'gradual' || raw === 'ongoing' || raw === 'asap') {
      return raw as ConsultationFormData['timeline'];
    }
    if (raw.includes('event')) return 'event';
    if (raw.includes('maint')) return 'ongoing';
    if (raw.includes('soon') || raw.includes('asap') || raw.includes('urgent')) return 'asap';
  }

  const hasUpcomingEvent =
    payload.hasUpcomingEvent === true ||
    coerceString(payload.hasUpcomingEvent)?.toLowerCase() === 'yes';
  return hasUpcomingEvent ? 'event' : undefined;
}

function normalizeGoals(payload: Record<string, unknown>): string | undefined {
  const rawGoals = payload.goals;
  if (typeof rawGoals === 'string') {
    const trimmed = rawGoals.trim();
    return trimmed || undefined;
  }

  const goalArray = coerceStringArray(rawGoals);
  if (goalArray && goalArray.length > 0) return goalArray.join(', ').slice(0, 2000);

  const concernsFallback = coerceStringArray(payload.concerns);
  if (concernsFallback && concernsFallback.length > 0) return concernsFallback.join(', ').slice(0, 2000);

  return undefined;
}

function coerceLegacySubmitPayload(rawPayload: unknown): Record<string, unknown> {
  if (!rawPayload || typeof rawPayload !== 'object') return {};

  const payload = { ...(rawPayload as Record<string, unknown>) };
  payload.firstName = coerceString(payload.firstName);
  payload.lastName = coerceString(payload.lastName);
  payload.email = coerceString(payload.email)?.toLowerCase();
  payload.phone = normalizePhone(payload.phone);
  payload.dob = normalizeDob(payload.dob);
  payload.skinConcerns = normalizeSkinConcerns(payload);
  const targetAreas = coerceStringArray(payload.targetAreas);
  const treatmentInterests = coerceStringArray(payload.treatmentInterests);
  if (targetAreas) payload.targetAreas = targetAreas;
  else delete payload.targetAreas;
  if (treatmentInterests) payload.treatmentInterests = treatmentInterests;
  else delete payload.treatmentInterests;
  payload.goals = normalizeGoals(payload);
  payload.timeline = normalizeTimeline(payload);
  payload.budget = normalizeBudget(payload.budget);
  return payload;
}

function deriveRequestedTrack(intakeData: Partial<ConsultationSubmitData>): MetabolicIntake['preferredTrack'] {
  const interests = Array.isArray(intakeData.treatmentInterests)
    ? intakeData.treatmentInterests.map((item) => String(item).toLowerCase())
    : [];

  if (interests.some((item) => item.includes('glp') || item.includes('weight'))) return 'glp1';
  if (interests.some((item) => item.includes('hormone') || item.includes('trt') || item.includes('thyroid'))) return 'hormones';
  if (interests.some((item) => item.includes('peptide') || item.includes('nad') || item.includes('bpc') || item.includes('cjc'))) return 'peptides';
  return undefined;
}

function normalizeClinicalSymptoms(intakeData: Partial<ConsultationSubmitData>): string[] {
  const mapped = new Set<string>();
  const concerns = Array.isArray(intakeData.skinConcerns)
    ? intakeData.skinConcerns.map((item) => String(item).toLowerCase())
    : [];
  const goalsRaw = typeof intakeData.goals === 'string' ? intakeData.goals.toLowerCase() : '';
  const timeline = typeof intakeData.timeline === 'string' ? intakeData.timeline.toLowerCase() : '';

  for (const concern of concerns) {
    const mappedSymptom = CONCERN_TO_MEDICAL_SYMPTOM[concern];
    if (mappedSymptom) mapped.add(mappedSymptom);
  }

  if (goalsRaw.includes('weight') || goalsRaw.includes('fat') || concerns.includes('body-contouring')) {
    mapped.add('difficulty-losing-weight');
    mapped.add('food-noise-cravings');
  }
  if (goalsRaw.includes('energy') || goalsRaw.includes('fatigue')) {
    mapped.add('fatigue-low-energy');
  }
  if (goalsRaw.includes('recovery') || goalsRaw.includes('heal')) {
    mapped.add('slow-injury-healing');
  }
  if (timeline === 'asap') {
    mapped.add('inflammation-joint-pain');
  }

  if (mapped.size === 0) {
    mapped.add('fatigue-low-energy');
  }

  return Array.from(mapped);
}

type MedicalOfferSummary = {
  requestedTrack: string;
  normalizedSymptoms: string[];
  providerReviewRequired: boolean;
  recommendedProducts: Array<{
    id: string;
    label: string;
    category: string;
    score: number;
    suggestedRetail: number;
    suggestedGrossProfit: number;
    suggestedMarginPercent: number;
    rationale: string[];
  }>;
  projectedMonthlyRetail: number;
  projectedMonthlyCOGS: number;
  projectedMonthlyGrossProfit: number;
  averageMarginPercent: number;
};

function getTrackFallbackCategories(track: string): BoomRxCategory[] {
  switch (track) {
    case 'glp1':
      return ['glp1', 'wellness'];
    case 'hormones':
      return ['hormone', 'sexual-health', 'wellness'];
    case 'peptides':
      return ['peptide', 'wellness'];
    default:
      return ['wellness', 'glp1', 'hormone', 'peptide'];
  }
}

function buildCatalogFallbackOffers(
  requestedTrack: string,
  normalizedSymptoms: string[],
): MedicalOfferSummary {
  const categoryPriority = getTrackFallbackCategories(requestedTrack);
  const ranked = [...BOOMRX_FORMULARY_ITEMS]
    .filter((item) => categoryPriority.includes(item.category))
    .sort((left, right) => {
      if (right.suggestedGrossProfit !== left.suggestedGrossProfit) {
        return right.suggestedGrossProfit - left.suggestedGrossProfit;
      }
      return right.suggestedRetail - left.suggestedRetail;
    });

  const fallbackProducts = (ranked.length > 0 ? ranked : BOOMRX_FORMULARY_ITEMS)
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      score: 1,
      suggestedRetail: item.suggestedRetail,
      suggestedGrossProfit: item.suggestedGrossProfit,
      suggestedMarginPercent: item.suggestedMarginPercent,
      rationale: ['catalog-fallback'],
    }));

  const projectedMonthlyRetail = fallbackProducts.reduce(
    (sum, item) => sum + item.suggestedRetail,
    0,
  );
  const projectedMonthlyGrossProfit = fallbackProducts.reduce(
    (sum, item) => sum + item.suggestedGrossProfit,
    0,
  );
  const projectedMonthlyCOGS = Number(
    Math.max(projectedMonthlyRetail - projectedMonthlyGrossProfit, 0).toFixed(2),
  );
  const averageMarginPercent = Number(
    (
      fallbackProducts.reduce((sum, item) => sum + item.suggestedMarginPercent, 0) /
      Math.max(fallbackProducts.length, 1)
    ).toFixed(1),
  );

  return {
    requestedTrack,
    normalizedSymptoms,
    providerReviewRequired: true,
    recommendedProducts: fallbackProducts,
    projectedMonthlyRetail,
    projectedMonthlyCOGS,
    projectedMonthlyGrossProfit,
    averageMarginPercent,
  };
}

function buildMedicalOffers(intakeData: Partial<ConsultationSubmitData>): MedicalOfferSummary | null {
  const requestedTrack = deriveRequestedTrack(intakeData) ?? 'glp1';
  const goalsText = typeof intakeData.goals === 'string' ? intakeData.goals : '';
  const normalizedSymptoms = normalizeClinicalSymptoms(intakeData);

  try {
    const bundle = recommendBoomRxBySymptoms({
      symptoms: normalizedSymptoms,
      goals: goalsText ? [goalsText] : [],
      requestedTrack,
      limit: 10,
    });

    return {
      requestedTrack,
      normalizedSymptoms: bundle.normalizedSymptoms,
      providerReviewRequired: true,
      recommendedProducts: bundle.recommendations.map((candidate) => ({
        id: candidate.item.id,
        label: candidate.item.label,
        category: candidate.item.category,
        score: candidate.score,
        suggestedRetail: candidate.item.suggestedRetail,
        suggestedGrossProfit: candidate.item.suggestedGrossProfit,
        suggestedMarginPercent: candidate.item.suggestedMarginPercent,
        rationale: candidate.rationale,
      })),
      projectedMonthlyRetail: bundle.projectedMonthlyRetail,
      projectedMonthlyCOGS: bundle.projectedMonthlyCOGS,
      projectedMonthlyGrossProfit: bundle.projectedMonthlyGrossProfit,
      averageMarginPercent: bundle.averageMarginPercent,
    };
  } catch (error) {
    console.warn('[Consultation Submit] Medical offer generation failed:', error);
    return buildCatalogFallbackOffers(requestedTrack, normalizedSymptoms);
  }
}

function buildMetabolicRecommendation(
  intakeData: Partial<ConsultationSubmitData>,
): ReturnType<typeof generateFullMetabolicRecommendation> | null {
  const requestedTrack = deriveRequestedTrack(intakeData);
  if (!requestedTrack) return null;

  const goals = METABOLIC_GOAL_HINTS[requestedTrack] ?? METABOLIC_GOAL_HINTS.glp1;
  const symptoms = METABOLIC_SYMPTOM_HINTS[requestedTrack] ?? METABOLIC_SYMPTOM_HINTS.glp1;

  const intakeExtras = intakeData as Record<string, unknown>;
  const currentMeds =
    typeof intakeExtras.medications === 'string'
      ? intakeExtras.medications
      : typeof intakeExtras.currentMeds === 'string'
        ? intakeExtras.currentMeds
        : '';
  const baselineLabsCompleted =
    intakeExtras.requiresLabWork === true ||
    intakeExtras.baselineLabsCompleted === true;

  const payload: MetabolicIntake = {
    firstName: intakeData.firstName || 'Unknown',
    lastName: intakeData.lastName || 'Unknown',
    email: intakeData.email || 'unknown@rani.local',
    phone: typeof intakeData.phone === 'string' ? intakeData.phone : undefined,
    goals,
    symptoms,
    preferredTrack: requestedTrack,
    fulfillmentPreference: 'clinic',
    currentMeds,
    notes: typeof intakeData.clinicalNotes === 'string' ? intakeData.clinicalNotes : '',
    source: 'consultation-submit',
    medicalFlags: {
      pregnant: intakeData.pregnant === true,
      breastfeeding: intakeData.breastfeeding === true,
      thyroidCancerHistory:
        intakeData.thyroidCancerHistory === true ||
        intakeData.medullaryThyroidCancerFamily === true ||
        /\b(medullary|thyroid cancer|MTC)\b/i.test(String(intakeData.medicalHistory || '')),
      pancreatitisHistory:
        intakeData.pancreatitisHistory === true ||
        /\bpancreatitis\b/i.test(String(intakeData.medicalHistory || '')) ||
        /\bpancreatitis\b/i.test(String(intakeData.medications || '')),
      gallbladderDisease:
        intakeData.gallbladderDisease === true ||
        /\b(gallstone|gallbladder|cholecyst)/i.test(String(intakeData.medicalHistory || '')),
      uncontrolledHypertension:
        intakeData.uncontrolledHypertension === true ||
        /\buncontrolled hypertension\b|\bsevere htn\b/i.test(String(intakeData.medicalHistory || '')),
      severeDepression:
        intakeData.severeDepression === true ||
        /\bsevere depression\b|\bsuicidal\b/i.test(String(intakeData.medicalHistory || '')),
      eatingDisorderHistory:
        intakeData.eatingDisorderHistory === true ||
        /\b(anorexia|bulimia|binge eating)\b/i.test(String(intakeData.medicalHistory || '')),
    },
    labs: {
      baselineLabsCompleted,
      latestA1c: undefined,
      fastingGlucose: undefined,
      tsh: undefined,
    },
    biometrics: {
      heightInches: undefined,
      weightLbs: undefined,
      bmi: undefined,
    },
    peptideHistory: {
      priorPeptideExposure: false,
      tolerance: 'unknown',
      preferredRoute: 'no-preference',
    },
  };

  try {
    return generateFullMetabolicRecommendation(payload, { forceTrack: requestedTrack });
  } catch (error) {
    console.warn('[Consultation Submit] Metabolic recommendation generation failed:', error);
    return null;
  }
}

async function parseMultipartIntakePayload(formData: FormData): Promise<unknown> {
  const parseCandidate = async (value: FormDataEntryValue | null): Promise<unknown | null> => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
    if (value instanceof File) {
      const text = (await value.text()).trim();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    return null;
  };

  const dataLikeFields: Array<FormDataEntryValue | null> = [
    formData.get('data'),
    formData.get('payload'),
    formData.get('intake'),
  ];

  for (const candidate of dataLikeFields) {
    const parsed = await parseCandidate(candidate);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  }

  const fallback: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'photos' || key === 'aura') continue;
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (key in fallback) {
      const current = fallback[key];
      if (Array.isArray(current)) {
        current.push(trimmed);
      } else {
        fallback[key] = [current, trimmed];
      }
    } else {
      fallback[key] = trimmed;
    }
  }

  return fallback;
}

function isPdfUpload(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'application/pdf' || name.endsWith('.pdf');
}

function buildAuraPdfMetricsSummary(insights: AuraPdfInsights): string {
  const parts: string[] = [];
  if (typeof insights.absoluteScores.wrinkles === 'number') {
    parts.push(`Wrinkles ${insights.absoluteScores.wrinkles}/5`);
  }
  if (typeof insights.absoluteScores.texture === 'number') {
    parts.push(`Texture ${insights.absoluteScores.texture}/5`);
  }
  if (typeof insights.absoluteScores.brownSpots === 'number') {
    parts.push(`Brown Spots ${insights.absoluteScores.brownSpots}/5`);
  }
  if (typeof insights.absoluteScores.redAreas === 'number') {
    parts.push(`Red Areas ${insights.absoluteScores.redAreas}/5`);
  }
  if (typeof insights.absoluteScores.pores === 'number') {
    parts.push(`Pores ${insights.absoluteScores.pores}/5`);
  }
  if (typeof insights.peerSkinScore === 'number') {
    parts.push(`Peer Skin Score ${insights.peerSkinScore}`);
  }
  return parts.join(', ');
}

function buildAuraPdfClinicalNote(insights: AuraPdfInsights): string {
  const metrics = buildAuraPdfMetricsSummary(insights);
  const textSnippet = insights.textSummary
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(0, 24)
    .join('\n');

  return [
    `Aura PDF (${insights.provenance}) attached.`,
    metrics ? `Parsed metrics: ${metrics}.` : '',
    textSnippet ? `Extracted report context:\n${textSnippet}` : '',
  ]
    .filter(Boolean)
    .join('\n');
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

      const isMultipart = contentType.includes('multipart/form-data');
      const isJson = contentType.includes('application/json') || contentType.includes('+json');

      let formData: FormData | null = null;
      let rawIntakePayload: unknown;

      if (isMultipart) {
        formData = await request.formData();
        rawIntakePayload = await parseMultipartIntakePayload(formData);
      } else if (isJson) {
        rawIntakePayload = await request.json().catch(() => null);
      } else {
        rawIntakePayload = await request.json().catch(() => null);
      }

      rawIntakePayload = getPayloadCandidate(rawIntakePayload);

      if (!rawIntakePayload || typeof rawIntakePayload !== 'object') {
        return NextResponse.json({ success: false, error: 'Missing form data' }, { status: 400 });
      }
      if (Object.keys(rawIntakePayload as Record<string, unknown>).length === 0) {
        return NextResponse.json({ success: false, error: 'Missing form data' }, { status: 400 });
      }

      const normalizedIntake = coerceLegacySubmitPayload(rawIntakePayload);
      const parsed = submitIntakeSchema.safeParse(normalizedIntake);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid form data payload',
            details: parsed.error.issues,
          },
          { status: 422 },
        );
      }
      const intakeData = parsed.data as Partial<ConsultationSubmitData>;
      const markerParse = parseAuraPdfTextFallbackMarkers(
        typeof intakeData.clinicalNotes === 'string' ? intakeData.clinicalNotes : undefined
      );
      intakeData.clinicalNotes = markerParse.cleanedNotes;

      let sourcePhotoUrl: string | null = null;
      const photoEntries = formData ? formData.getAll('photos') : [];
      const auraEntries = formData ? formData.getAll('aura') : [];
      const photoFiles = photoEntries.filter((value): value is File => value instanceof File);
      const auraFiles = auraEntries.filter((value): value is File => value instanceof File);
      const invalidAuraFiles = auraFiles.filter((file) => !isPdfUpload(file));
      if (invalidAuraFiles.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Aura uploads must be PDF only. Upload images as skin photos.',
          },
          { status: 400 },
        );
      }
      const oversizedAuraFile = auraFiles.find((file) => isPdfUpload(file) && file.size > MAX_AURA_PDF_SIZE);
      if (oversizedAuraFile) {
        return NextResponse.json(
          {
            success: false,
            error: `Aura PDF exceeds ${Math.round(MAX_AURA_PDF_SIZE / (1024 * 1024))}MB upload limit`,
          },
          { status: 413 },
        );
      }
      let auraUploadStatus: string | null = null;
      const auraUploadWarnings: string[] = [];
      let auraPdfInsights: AuraPdfInsights | null = null;
      const hadSkinPhotoUpload = photoFiles.length > 0;

      const auraPdfFiles = auraFiles.filter(isPdfUpload);

      for (const auraPdfFile of auraPdfFiles) {
        try {
          const extracted = await extractAuraPdfInsights(auraPdfFile);
          if (extracted) {
            auraPdfInsights = extracted;
            break;
          }
        } catch (error) {
          console.warn(
            '[Consultation Submit] Aura PDF parsing failed:',
            auraPdfFile.name,
            error,
          );
          auraUploadWarnings.push(
            `Aura PDF "${auraPdfFile.name}" could not be parsed automatically.`,
          );
        }
      }
      if (auraPdfFiles.length > 0) {
        const name = auraPdfFiles[0]?.name || 'document.pdf';
        if (auraPdfInsights) {
          auraUploadStatus = `Aura PDF received + parsed (${buildAuraPdfMetricsSummary(auraPdfInsights) || name})`;
        } else {
          auraUploadStatus = `Aura PDF received but not parsed (${name})`;
          auraUploadWarnings.push(
            `Aura PDF "${name}" did not contain recognizable Aura device scores. Continuing with intake-only fallback.`,
          );
        }
      }

      if (!auraPdfInsights && markerParse.markers.length > 0) {
        for (const marker of markerParse.markers) {
          const parsedFromText = extractAuraPdfInsightsFromText(marker.text, marker.name);
          if (parsedFromText) {
            auraPdfInsights = parsedFromText;
            break;
          }
        }
        if (auraPdfInsights) {
          const parsedMetrics = buildAuraPdfMetricsSummary(auraPdfInsights);
          auraUploadStatus = parsedMetrics
            ? `Aura PDF text fallback parsed (${parsedMetrics})`
            : 'Aura PDF text fallback parsed';
        } else {
          auraUploadStatus = `Aura PDF text fallback received (${markerParse.markers.length} report${markerParse.markers.length === 1 ? '' : 's'})`;
        }
      }

      if (!auraPdfInsights && auraPdfFiles.length > 0 && markerParse.markers.length === 0) {
        auraUploadWarnings.push(
          'Aura PDF conversion is pending. Continuing with intake + scan fallback so the consultation is not blocked.',
        );
      }

      if (photoFiles.length > MAX_PHOTOS) {
        return NextResponse.json(
          { success: false, error: `Only ${MAX_PHOTOS} skin photos are allowed` },
          { status: 400 },
        );
      }

      const totalUploadBytes = [...photoFiles, ...auraFiles].reduce((sum, file) => sum + file.size, 0);
      if (totalUploadBytes > MAX_TOTAL_UPLOAD_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Total upload size must be 30MB or less' },
          { status: 413 },
        );
      }

      for (const file of [...photoFiles, ...auraFiles]) {
        if (isPdfUpload(file)) continue;
        if (!ALLOWED_TYPES.includes(file.type)) continue;
        if (file.size > MAX_PHOTO_SIZE) continue;

        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          let image = sharp(buffer);
          const metadata = await image.metadata();
          if (metadata.width && metadata.width > MAX_PHOTO_WIDTH) {
            image = image.resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true });
          }
          const processed = await image.jpeg({ quality: 85 }).toBuffer();
          sourcePhotoUrl = `data:image/jpeg;base64,${processed.toString('base64')}`;
          break;
        } catch (err) {
          console.warn('[Consultation Submit] Photo processing failed:', err);
        }
      }

      if (auraPdfInsights) {
        const existingClinicalNotes =
          typeof intakeData.clinicalNotes === 'string' ? intakeData.clinicalNotes.trim() : '';
        intakeData.clinicalNotes = [existingClinicalNotes, buildAuraPdfClinicalNote(auraPdfInsights)]
          .filter(Boolean)
          .join('\n\n');
      }

      const patientName = `${intakeData.firstName || ''} ${intakeData.lastName || ''}`.trim();
      const patientEmail = (intakeData.email as string) || '';
      if (!patientEmail) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }

      const scopedLimit = rateLimit(
        'consultation-submit-email',
        `${ip}:${normalizeEmailForLimit(patientEmail)}`,
        { limit: 3, windowMs: 10 * 60_000 },
      );
      if (!scopedLimit.allowed) return rateLimitResponse(scopedLimit.resetIn);

      const session = createSession({
        intakeData,
        patientName,
        patientEmail,
        sourcePhotoUrl,
      });

      try {
        await saveSessionAsync(session);
      } catch (err) {
        if (err instanceof SessionStoreError && err.kind === 'limit') {
          return NextResponse.json(
            {
              success: false,
              errorKind: 'capacity',
              error:
                "We can't save your consultation right now. Our records system is at capacity — please try again shortly or call (425) 539-4440.",
              details: { airtableErrorType: err.airtableErrorType, operation: err.operation },
            },
            { status: 503 },
          );
        }
        if (err instanceof SessionStoreError && err.kind === 'timeout') {
          return NextResponse.json(
            { success: false, errorKind: 'timeout', error: 'Your consultation is taking longer than expected to save. Please try again in a moment.' },
            { status: 504 },
          );
        }
        console.error('[Consultation Submit] Session persistence failed:', err);
        return NextResponse.json(
          {
            success: false,
            errorKind: 'persist',
            error: 'Intake system is temporarily unavailable. Please retry in a minute.',
          },
          { status: 503 },
        );
      }

      const medicalOffers = buildMedicalOffers(intakeData);
      const metabolicRecommendation = buildMetabolicRecommendation(intakeData);

      // CRM write is non-blocking for submission success, but we still annotate failures.
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

        let intakeSummary = [
          `Skin Concerns: ${concerns || 'Not specified'}`,
          `Target Areas: ${areas || 'Not specified'}`,
          goals ? `Goals: ${goals}` : '',
          timeline ? `Timeline: ${timeline}` : '',
          budget ? `Budget: ${budget}` : '',
          sourcePhotoUrl ? 'Photo: Uploaded' : 'Photo: None',
          auraUploadStatus ? `Aura Upload: ${auraUploadStatus}` : '',
          auraPdfInsights ? `Aura PDF Source: ${auraPdfInsights.provenance}` : '',
          medicalOffers
            ? `Recommended products: ${medicalOffers.recommendedProducts
                .slice(0, 3)
                .map((item) => item.label)
                .join(', ')}`
            : '',
          metabolicRecommendation
            ? `Metabolic track: ${metabolicRecommendation.recommendedTrack} (${metabolicRecommendation.status})`
            : '',
          `Session ID: ${session.id}`,
        ]
          .filter(Boolean)
          .join('\n');
        if (auraUploadWarnings.length > 0) {
          intakeSummary = [
            intakeSummary,
            ...auraUploadWarnings.map((warning) => `Aura Note: ${warning}`),
          ].join('\n');
        }

        await rateLimitedQuery(async () => {
          await Tables.intakes().create(
            {
              'Full Name': patientName,
              Email: patientEmail,
              'Phone Number': (intakeData.phone as string) || '',
              'Processing Status': 'New',
              'Intake Summary (AI)': intakeSummary,
            },
            { typecast: true },
          );
        });
      } catch (err) {
        console.warn('[Consultation Submit] Airtable intake write failed:', err);
      }

      const useMock = process.env.USE_MOCK_AI === 'true';
      const useAIScan = !!process.env.ANTHROPIC_API_KEY && !useMock;
      const analysisAttempted = hadSkinPhotoUpload;
      const analysisSkipped = analysisAttempted && !sourcePhotoUrl;
      const analysisReason = analysisSkipped
        ? 'Uploaded photo is too large for real-time analysis. Please retry with a smaller image.'
        : undefined;

      const scanPromise = (async () => {
        try {
          let scanResult;
          let source = 'engine';
          if (useMock) {
            scanResult = mockAuraScanResult();
            source = 'mock';
          } else if (auraPdfInsights && !sourcePhotoUrl) {
            const ruleScan = await runAuraScan(intakeData);
            scanResult = applyAuraPdfInsightsToScan(ruleScan, auraPdfInsights);
            source = 'aura-pdf-fallback';
          } else if (useAIScan && sourcePhotoUrl) {
            const { runAIAuraScan } = await import('@/lib/mastermind/ai-aura-scan');
            scanResult = await runAIAuraScan(intakeData, sourcePhotoUrl || undefined);
            source = 'ai-photo';
          } else if (useAIScan) {
            scanResult = await runAuraScan(intakeData);
            source = 'engine-fallback-no-photo';
          } else {
            scanResult = await runAuraScan(intakeData);
            source = 'engine';
          }

          const scanned = sessionReducer(session, { type: 'SET_SCAN_RESULT', result: scanResult });
          await saveSessionAsync(scanned);
          logEvent('api', 'info', 'mastermind.auto_scan.completed', { source, sessionId: session.id });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(JSON.stringify({ event: 'mastermind.auto_scan.failed', sessionId: session.id, error: message }));
          // Persist the failure so the dashboard can render it.
          try {
            const errored = sessionReducer(session, {
              type: 'SET_SCAN_ERROR',
              error: { at: new Date().toISOString(), message, source: 'auto-scan' },
            } as never);
            await saveSessionAsync(errored);
          } catch (persistErr) {
            console.error('[Consultation Submit] Could not persist scan error:', persistErr);
          }
        }
      })();

      // For fast non-AI scan paths, return with scan already persisted.
      if (useMock || !useAIScan) {
        await scanPromise;
      }

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        data: {
          sessionId: session.id,
          patientName,
          hasPhoto: !!sourcePhotoUrl,
          phase: session.phase,
        },
        auraUploadStatus,
        auraUploadWarnings,
        analysisStatus: {
          attempted: analysisAttempted,
          skipped: analysisSkipped,
          reason: analysisReason,
        },
        medicalOffers,
        metabolicRecommendation,
      });
    } catch (error) {
      console.error('[Consultation Submit] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Submission failed',
        },
        { status: 500 },
      );
    }
  });
}
