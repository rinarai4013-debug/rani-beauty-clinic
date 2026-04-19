/**
 * POST /api/consultation/submit
 *
 * Receives wizard form data + photos, creates a MastermindSession,
 * and optionally runs the Aura Scan. Returns legacy session payload
 * plus additive medical offer metadata for conversion workflows.
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createSession, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import {
  BUDGET_OPTIONS,
  SKIN_CONCERN_OPTIONS,
  SKIN_TYPES,
  TIMELINE_OPTIONS,
  submitIntakeSchema,
} from '@/lib/consultation/schema';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import {
  enforceAllowedPublicOrigin,
  enforceContentLength,
  normalizeEmailForLimit,
} from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';
import type { MedicalOfferProduct, MedicalOffersPayload } from '@/types/mastermind';
import {
  BOOMRX_FORMULARY_ITEMS,
  type BoomRxCategory,
  type BoomRxFormularyItem,
} from '@/lib/medical/boomrx-formulary';
import {
  recommendBoomRxBySymptoms,
  type SymptomMatchedRecommendation,
  type SymptomRecommendationBundle,
} from '@/lib/medical/symptom-product-matrix';

const MAX_PHOTO_WIDTH = 1200;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB each
const MAX_PHOTOS = 3;
const MAX_TOTAL_PHOTO_SIZE = 30 * 1024 * 1024; // 30MB total
const MAX_JSON_REQUEST_BYTES = 512 * 1024;
const MAX_MULTIPART_REQUEST_BYTES = 35 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const BOOMRX_RECOMMENDATION_LIMIT = 8;

type RequestedTrack = 'glp1' | 'hormones' | 'peptides' | 'hybrid';

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

const ALLOWED_SKIN_CONCERNS = new Set<string>(SKIN_CONCERN_OPTIONS as readonly string[]);
const ALLOWED_SKIN_TYPES = new Set<string>(SKIN_TYPES as readonly string[]);
const ALLOWED_TIMELINES = new Set<string>(TIMELINE_OPTIONS as readonly string[]);
const ALLOWED_BUDGETS = new Set<string>(BUDGET_OPTIONS as readonly string[]);

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

const LEGACY_SKIN_TYPE_MAP: Record<string, ConsultationFormData['skinType']> = {
  normal: 'normal',
  dry: 'dry',
  oily: 'oily',
  oil: 'oily',
  combination: 'combination',
  combo: 'combination',
  sensitive: 'sensitive',
};

function coerceString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [trimmed];
  }
  return [];
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
  const rawConcerns = [
    ...coerceStringArray(payload.skinConcerns),
    ...coerceStringArray(payload.concerns),
  ];
  if (rawConcerns.length === 0) return undefined;

  const normalized = new Set<string>();
  for (const concern of rawConcerns) {
    const key = concern.toLowerCase();
    const mapped = LEGACY_CONCERN_MAP[key] ?? [key];
    for (const mappedValue of mapped) {
      if (ALLOWED_SKIN_CONCERNS.has(mappedValue)) {
        normalized.add(mappedValue);
      }
    }
  }

  return normalized.size > 0 ? Array.from(normalized) : undefined;
}

function normalizeBudget(value: unknown): ConsultationFormData['budget'] | undefined {
  const raw = coerceString(value);
  if (!raw) return undefined;
  const key = raw.toLowerCase();

  if (ALLOWED_BUDGETS.has(key)) return key as ConsultationFormData['budget'];
  return LEGACY_BUDGET_MAP[key];
}

function normalizeTimeline(payload: Record<string, unknown>): ConsultationFormData['timeline'] | undefined {
  const explicitTimeline = coerceString(payload.timeline)?.toLowerCase();
  if (explicitTimeline) {
    if (ALLOWED_TIMELINES.has(explicitTimeline)) return explicitTimeline as ConsultationFormData['timeline'];
    if (explicitTimeline.includes('event')) return 'event';
    if (explicitTimeline.includes('soon') || explicitTimeline.includes('asap') || explicitTimeline.includes('urgent')) {
      return 'asap';
    }
    if (explicitTimeline.includes('maint')) return 'ongoing';
    if (explicitTimeline.includes('gradual')) return 'gradual';
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
  const asArray = coerceStringArray(rawGoals);
  if (asArray.length > 0) return asArray.join(', ').slice(0, 2000);

  const concernFallback = coerceStringArray(payload.concerns);
  if (concernFallback.length > 0) {
    return concernFallback.join(', ').slice(0, 2000);
  }
  return undefined;
}

function normalizeSkinType(value: unknown): ConsultationFormData['skinType'] | undefined {
  const raw = coerceString(value)?.toLowerCase();
  if (!raw) return undefined;
  if (ALLOWED_SKIN_TYPES.has(raw)) return raw as ConsultationFormData['skinType'];
  return LEGACY_SKIN_TYPE_MAP[raw];
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
  const normalizedTargetAreas = coerceStringArray(payload.targetAreas);
  payload.targetAreas = normalizedTargetAreas.length > 0 ? normalizedTargetAreas : undefined;
  const normalizedTreatmentInterests = coerceStringArray(payload.treatmentInterests);
  payload.treatmentInterests = normalizedTreatmentInterests.length > 0
    ? normalizedTreatmentInterests
    : undefined;
  payload.goals = normalizeGoals(payload);
  payload.budget = normalizeBudget(payload.budget);
  payload.timeline = normalizeTimeline(payload);
  payload.skinType = normalizeSkinType(payload.skinType);

  return payload;
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
    if (key === 'photos') continue;
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

function inferRequestedTrack(intakeData: Partial<ConsultationFormData>): RequestedTrack {
  const interests = Array.isArray(intakeData.treatmentInterests)
    ? intakeData.treatmentInterests.join(' ').toLowerCase()
    : '';
  const concerns = Array.isArray(intakeData.skinConcerns)
    ? intakeData.skinConcerns.join(' ').toLowerCase()
    : '';
  const goals = typeof intakeData.goals === 'string' ? intakeData.goals.toLowerCase() : '';
  const history = typeof intakeData.treatmentHistory === 'string' ? intakeData.treatmentHistory.toLowerCase() : '';
  const text = `${interests} ${concerns} ${goals} ${history}`;

  if (
    text.includes('peptide') ||
    text.includes('bpc') ||
    text.includes('nad') ||
    text.includes('recovery')
  ) {
    return 'peptides';
  }
  if (
    text.includes('hormone') ||
    text.includes('trt') ||
    text.includes('testosterone') ||
    text.includes('thyroid')
  ) {
    return 'hormones';
  }
  if (
    text.includes('weight') ||
    text.includes('glp') ||
    text.includes('semaglutide') ||
    text.includes('tirzepatide') ||
    text.includes('metabolic')
  ) {
    return 'glp1';
  }
  return 'hybrid';
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
}

function deriveConsultSymptoms(intakeData: Partial<ConsultationFormData>): string[] {
  const concerns = toStringArray(intakeData.skinConcerns);
  const areas = toStringArray(intakeData.targetAreas);
  const interests = toStringArray(intakeData.treatmentInterests);
  const goalTokens = typeof intakeData.goals === 'string'
    ? intakeData.goals
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 3)
    : [];

  return Array.from(new Set([
    ...concerns,
    ...areas,
    ...interests,
    ...goalTokens,
  ]));
}

function trackBoostCategories(requestedTrack: RequestedTrack): BoomRxCategory[] {
  if (requestedTrack === 'glp1') return ['glp1', 'wellness'];
  if (requestedTrack === 'hormones') return ['hormone', 'sexual-health', 'wellness'];
  if (requestedTrack === 'peptides') return ['peptide', 'wellness'];
  return ['glp1', 'hormone', 'peptide', 'sexual-health', 'wellness', 'hair-skin'];
}

function buildFallbackBoomRxBundle(input: {
  symptoms: string[];
  requestedTrack: RequestedTrack;
}): SymptomRecommendationBundle {
  const normalizedSymptoms = input.symptoms.map((symptom) => symptom.toLowerCase());
  const boostedCategories = new Set(trackBoostCategories(input.requestedTrack));

  const recommendations = BOOMRX_FORMULARY_ITEMS
    .filter((item): item is BoomRxFormularyItem => Boolean(item))
    .map((item) => {
      const trackScore = boostedCategories.has(item.category) ? 3 : 1;
      const keywordHits = item.keywords.filter((keyword) =>
        normalizedSymptoms.some((symptom) => symptom.includes(keyword) || keyword.includes(symptom)),
      );
      return {
        item,
        score: trackScore + keywordHits.length,
        rationale: keywordHits.length > 0
          ? ['catalog-fallback', ...keywordHits.slice(0, 3).map((hit) => `keyword:${hit}`)]
          : ['catalog-fallback'],
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.item.suggestedGrossProfit - a.item.suggestedGrossProfit;
    })
    .slice(0, BOOMRX_RECOMMENDATION_LIMIT);

  const projectedMonthlyRetail = toMoney(
    recommendations.reduce((sum, entry) => sum + toMoney(entry.item.suggestedRetail), 0),
  );
  const projectedMonthlyCOGS = toMoney(
    recommendations.reduce((sum, entry) => sum + toMoney(entry.item.monthlyCostEstimate), 0),
  );
  const projectedMonthlyGrossProfit = toMoney(projectedMonthlyRetail - projectedMonthlyCOGS);
  const averageMarginPercent =
    recommendations.length > 0
      ? toMoney(
        recommendations.reduce((sum, entry) => sum + toMoney(entry.item.suggestedMarginPercent), 0)
          / recommendations.length,
      )
      : 0;

  return {
    normalizedSymptoms,
    recommendations,
    projectedMonthlyRetail,
    projectedMonthlyCOGS,
    projectedMonthlyGrossProfit,
    averageMarginPercent,
  };
}

function normalizeBoomRxBundle(bundle: SymptomRecommendationBundle): SymptomRecommendationBundle {
  const recommendations = bundle.recommendations
    .filter((entry): entry is SymptomMatchedRecommendation => Boolean(entry?.item))
    .slice(0, BOOMRX_RECOMMENDATION_LIMIT)
    .map((entry) => ({
      ...entry,
      item: {
        ...entry.item,
        monthlyCostEstimate: toMoney(entry.item.monthlyCostEstimate),
        suggestedRetail: toMoney(entry.item.suggestedRetail),
        suggestedGrossProfit: toMoney(entry.item.suggestedGrossProfit),
        suggestedMarginPercent: toMoney(entry.item.suggestedMarginPercent),
      },
    }));

  const projectedMonthlyRetail = toMoney(
    recommendations.reduce((sum, entry) => sum + entry.item.suggestedRetail, 0),
  );
  const projectedMonthlyCOGS = toMoney(
    recommendations.reduce((sum, entry) => sum + entry.item.monthlyCostEstimate, 0),
  );

  return {
    normalizedSymptoms: toStringArray(bundle.normalizedSymptoms),
    recommendations,
    projectedMonthlyRetail,
    projectedMonthlyCOGS,
    projectedMonthlyGrossProfit: toMoney(projectedMonthlyRetail - projectedMonthlyCOGS),
    averageMarginPercent:
      recommendations.length > 0
        ? toMoney(
          recommendations.reduce((sum, entry) => sum + entry.item.suggestedMarginPercent, 0)
            / recommendations.length,
        )
        : 0,
  };
}

function buildBoomRxBundle(input: {
  symptoms: string[];
  goals?: string[];
  requestedTrack: RequestedTrack;
}): SymptomRecommendationBundle {
  const normalizedSymptoms = input.symptoms.map((symptom) => symptom.toLowerCase());

  try {
    const bundle = recommendBoomRxBySymptoms({
      symptoms: normalizedSymptoms,
      goals: input.goals,
      requestedTrack: input.requestedTrack,
      limit: BOOMRX_RECOMMENDATION_LIMIT,
    });
    const normalizedBundle = normalizeBoomRxBundle(bundle);
    if (normalizedBundle.recommendations.length === 0) {
      throw new Error('BoomRx engine returned zero recommendations');
    }
    return normalizedBundle;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn('[Consultation Submit] BoomRx recommender failed, using fallback:', reason);
    return buildFallbackBoomRxBundle({
      symptoms: normalizedSymptoms,
      requestedTrack: input.requestedTrack,
    });
  }
}

function buildMedicalOffers(intakeData: Partial<ConsultationFormData>): MedicalOffersPayload {
  const requestedTrack = inferRequestedTrack(intakeData);
  const symptomTerms = deriveConsultSymptoms(intakeData);
  const boomRxBundle = buildBoomRxBundle({
    symptoms: symptomTerms,
    goals: typeof intakeData.goals === 'string' && intakeData.goals.trim()
      ? [intakeData.goals]
      : [],
    requestedTrack,
  });

  const ranked: MedicalOfferProduct[] = boomRxBundle.recommendations.map((entry) => ({
    id: entry.item.id,
    product: entry.item.baseProduct,
    label: entry.item.label,
    category: entry.item.category,
    score: entry.score,
    monthlyCostEstimate: toMoney(entry.item.monthlyCostEstimate),
    suggestedRetail: toMoney(entry.item.suggestedRetail),
    suggestedGrossProfit: toMoney(entry.item.suggestedGrossProfit),
    suggestedMarginPercent: toMoney(entry.item.suggestedMarginPercent),
    rationale: entry.rationale,
    selected: true,
  }));

  const checkoutPaths =
    requestedTrack === 'peptides'
      ? { clinic: '/peptide/intake?checkout=clinic', home: '/peptide/intake?checkout=home' }
      : {
          clinic: `/glp1/intake?checkout=clinic&track=${encodeURIComponent(requestedTrack)}`,
          home: `/glp1/intake?checkout=home&track=${encodeURIComponent(requestedTrack)}`,
        };

  return {
    providerReviewRequired: true,
    checkoutPaths,
    requestedTrack,
    normalizedSymptoms: boomRxBundle.normalizedSymptoms,
    recommendationCount: ranked.length,
    projectedMonthlyRetail: boomRxBundle.projectedMonthlyRetail,
    projectedMonthlyCOGS: boomRxBundle.projectedMonthlyCOGS,
    projectedMonthlyGrossProfit: boomRxBundle.projectedMonthlyGrossProfit,
    averageMarginPercent: boomRxBundle.averageMarginPercent,
    recommendedProducts: ranked,
  };
}

function isPdfUpload(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'application/pdf' || name.endsWith('.pdf');
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

      let intakeData: Partial<ConsultationFormData>;
      const rawIntakeJson = await parseMultipartIntakePayload(formData);
      if (!rawIntakeJson || typeof rawIntakeJson !== 'object') {
        return NextResponse.json(
          { success: false, error: 'Missing form data' },
          { status: 400 }
        );
      }

      const normalizedIntakeCandidate = coerceLegacySubmitPayload(rawIntakeJson);
      const parsed = submitIntakeSchema.safeParse(normalizedIntakeCandidate);
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

      let sourcePhotoUrl: string | null = null;
      const photoFiles = formData.getAll('photos').filter((value): value is File => value instanceof File);
      const auraFiles = formData.getAll('aura').filter((value): value is File => value instanceof File);
      let auraUploadStatus: string | null = null;
      if (photoFiles.length > MAX_PHOTOS) {
        return NextResponse.json(
          { success: false, error: `Only ${MAX_PHOTOS} photos are allowed` },
          { status: 400 }
        );
      }
      const totalPhotoBytes = photoFiles.reduce((sum, photo) => sum + photo.size, 0);
      if (totalPhotoBytes > MAX_TOTAL_PHOTO_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Total photo upload must be 30MB or less' },
          { status: 413 }
        );
      }

      for (const file of photoFiles) {
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

      // Backward compatibility: older clients may upload Aura file directly as multipart "aura".
      // Keep the intake successful and attach what we can.
      if (!sourcePhotoUrl && auraFiles.length > 0) {
        const auraFile = auraFiles[0];
        if (isPdfUpload(auraFile)) {
          auraUploadStatus = `Aura PDF received (${auraFile.name || 'document.pdf'})`;
        } else if (ALLOWED_TYPES.includes(auraFile.type) && auraFile.size <= MAX_PHOTO_SIZE) {
          try {
            const auraBuffer = Buffer.from(await auraFile.arrayBuffer());
            let auraImage = sharp(auraBuffer);
            const auraMeta = await auraImage.metadata();
            if (auraMeta.width && auraMeta.width > MAX_PHOTO_WIDTH) {
              auraImage = auraImage.resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true });
            }
            const processedAura = await auraImage.jpeg({ quality: 85 }).toBuffer();
            sourcePhotoUrl = `data:image/jpeg;base64,${processedAura.toString('base64')}`;
            auraUploadStatus = `Aura image received (${auraFile.name || 'upload'})`;
          } catch (err) {
            console.warn('[Consultation Submit] Aura upload processing failed:', err);
            auraUploadStatus = 'Aura upload received (processing failed)';
          }
        } else {
          auraUploadStatus = 'Aura upload received (unsupported format or size)';
        }
      }

      const patientName = `${intakeData.firstName || ''} ${intakeData.lastName || ''}`.trim();
      const patientEmail = (intakeData.email as string) || '';

      if (!patientEmail) {
        return NextResponse.json(
          { success: false, error: 'Email is required' },
          { status: 400 },
        );
      }

      const scopedLimit = rateLimit(
        'consultation-submit-email',
        `${ip}:${normalizeEmailForLimit(patientEmail)}`,
        { limit: 3, windowMs: 10 * 60_000 },
      );
      if (!scopedLimit.allowed) return rateLimitResponse(scopedLimit.resetIn);

      const includeMedicalOffers =
        (intakeData as Record<string, unknown>).includeMedicalOffers !== false;
      const medicalOffers = includeMedicalOffers
        ? buildMedicalOffers(intakeData)
        : null;

      const session = createSession({
        intakeData,
        patientName,
        patientEmail,
        sourcePhotoUrl,
        medicalOffers,
      });
      await saveSessionAsync(session);

      let intakeId: string | null = null;
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

        const flagLabels: [boolean, string][] = [
          [intakeData.pregnant === true, 'pregnant'],
          [intakeData.breastfeeding === true, 'breastfeeding'],
          [intakeData.bloodThinners === true, 'blood thinners'],
          [intakeData.keloidHistory === true, 'keloid history'],
          [intakeData.activeSkinInfection === true, 'active skin infection'],
          [intakeData.isotretinoinHistory === true, 'isotretinoin history'],
          [intakeData.hasAutoimmune === true, 'autoimmune condition'],
        ];
        const activeFlags = flagLabels.filter(([v]) => v).map(([, l]) => l);

        const intakeSummary = [
          `Skin Concerns: ${concerns || 'Not specified'}`,
          `Target Areas: ${areas || 'Not specified'}`,
          goals ? `Goals: ${goals}` : '',
          timeline ? `Timeline: ${timeline}` : '',
          budget ? `Budget: ${budget}` : '',
          `Medical Flags: ${activeFlags.length > 0 ? activeFlags.join(', ') : 'None reported'}`,
          sourcePhotoUrl ? 'Photo: Uploaded' : 'Photo: None',
          auraUploadStatus ? `Aura Upload: ${auraUploadStatus}` : '',
          `Session ID: ${session.id}`,
        ].filter(Boolean).join('\n');

        intakeId = await rateLimitedQuery(async () => {
          const record = await Tables.intakes().create(
            {
              'Full Name': patientName,
              'Email': patientEmail,
              'Phone Number': (intakeData.phone as string) || '',
              'Processing Status': 'New',
              'Intake Summary (AI)': intakeSummary,
            },
            { typecast: true }
          );
          return record.id;
        });
      } catch (err) {
        console.warn('[Consultation Submit] Airtable intake write failed:', err);
      }

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
          console.error(`[Consultation Submit] Auto-scan completed for session ${session.id}`);
        } catch (err) {
          console.error('[Consultation Submit] Auto-scan failed:', err);
        }
      })();

      if (useMock || !useAIScan) {
        await scanPromise;
      }

      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          patientName,
          hasPhoto: !!sourcePhotoUrl,
          phase: session.phase,
        },
        sessionId: session.id,
        patientName,
        hasPhoto: !!sourcePhotoUrl,
        phase: session.phase,
        intakeId,
        medicalOffers,
        auraUploadStatus,
      });
    } catch (error) {
      console.error('[Consultation Submit] Error:', error);
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
