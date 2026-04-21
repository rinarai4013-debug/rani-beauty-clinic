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
  applyAuraPdfInsightsToScan,
  type AuraPdfInsights,
} from '@/lib/mastermind/aura-pdf';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { submitIntakeSchema } from '@/lib/consultation/schema';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import {
  enforceAllowedPublicOrigin,
  enforceContentLength,
  normalizeEmailForLimit,
} from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';

const MAX_PHOTO_WIDTH = 1200;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB each
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
  const concerns = [
    ...coerceStringArray(payload.skinConcerns),
    ...coerceStringArray(payload.concerns),
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
  if (goalArray.length > 0) return goalArray.join(', ').slice(0, 2000);

  const concernsFallback = coerceStringArray(payload.concerns);
  if (concernsFallback.length > 0) return concernsFallback.join(', ').slice(0, 2000);

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
  payload.targetAreas = coerceStringArray(payload.targetAreas);
  payload.treatmentInterests = coerceStringArray(payload.treatmentInterests);
  payload.goals = normalizeGoals(payload);
  payload.timeline = normalizeTimeline(payload);
  payload.budget = normalizeBudget(payload.budget);
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

      const formData = await request.formData();

      let intakeData: Partial<ConsultationFormData>;
      const rawIntakeJson = await parseMultipartIntakePayload(formData);
      if (!rawIntakeJson || typeof rawIntakeJson !== 'object') {
        return NextResponse.json({ success: false, error: 'Missing form data' }, { status: 400 });
      }

      const normalizedIntake = coerceLegacySubmitPayload(rawIntakeJson);
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
      intakeData = parsed.data as Partial<ConsultationFormData>;

      let sourcePhotoUrl: string | null = null;
      const photoFiles = formData.getAll('photos').filter((value): value is File => value instanceof File);
      const auraFiles = formData.getAll('aura').filter((value): value is File => value instanceof File);
      let auraUploadStatus: string | null = null;
      let auraPdfInsights: AuraPdfInsights | null = null;

      const auraPdfFile = auraFiles.find((file) => isPdfUpload(file));
      if (auraPdfFile) {
        try {
          auraPdfInsights = await extractAuraPdfInsights(auraPdfFile);
        } catch (error) {
          console.warn('[Consultation Submit] Aura PDF parsing failed:', error);
        }
        if (auraPdfInsights) {
          const parsedMetrics = buildAuraPdfMetricsSummary(auraPdfInsights);
          auraUploadStatus = parsedMetrics
            ? `Aura PDF received + parsed (${parsedMetrics})`
            : `Aura PDF received (${auraPdfFile.name || 'document.pdf'})`;
        } else {
          auraUploadStatus = `Aura PDF received (${auraPdfFile.name || 'document.pdf'})`;
        }
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

      // Backward compatibility: dashboard intake can upload aura as separate multipart field.
      if (!sourcePhotoUrl && auraFiles.length > 0) {
        const auraFile = auraFiles[0];
        if (isPdfUpload(auraFile)) {
          if (!auraUploadStatus) {
            auraUploadStatus = `Aura PDF received (${auraFile.name || 'document.pdf'})`;
          }
        } else if (ALLOWED_TYPES.includes(auraFile.type) && auraFile.size <= MAX_PHOTO_SIZE) {
          try {
            const buffer = Buffer.from(await auraFile.arrayBuffer());
            let image = sharp(buffer);
            const metadata = await image.metadata();
            if (metadata.width && metadata.width > MAX_PHOTO_WIDTH) {
              image = image.resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true });
            }
            const processed = await image.jpeg({ quality: 85 }).toBuffer();
            sourcePhotoUrl = `data:image/jpeg;base64,${processed.toString('base64')}`;
            auraUploadStatus = `Aura image received (${auraFile.name || 'upload'})`;
          } catch (err) {
            console.warn('[Consultation Submit] Aura upload processing failed:', err);
            auraUploadStatus = 'Aura upload received (processing failed)';
          }
        } else {
          auraUploadStatus = 'Aura upload received (unsupported format or size)';
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
        console.error('[Consultation Submit] Session persistence failed:', err);
        return NextResponse.json(
          {
            success: false,
            error: 'Intake system is temporarily unavailable. Please retry in a minute.',
          },
          { status: 503 },
        );
      }

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

        const intakeSummary = [
          `Skin Concerns: ${concerns || 'Not specified'}`,
          `Target Areas: ${areas || 'Not specified'}`,
          goals ? `Goals: ${goals}` : '',
          timeline ? `Timeline: ${timeline}` : '',
          budget ? `Budget: ${budget}` : '',
          sourcePhotoUrl ? 'Photo: Uploaded' : 'Photo: None',
          auraUploadStatus ? `Aura Upload: ${auraUploadStatus}` : '',
          auraPdfInsights ? `Aura PDF Source: ${auraPdfInsights.provenance}` : '',
          `Session ID: ${session.id}`,
        ]
          .filter(Boolean)
          .join('\n');

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
          } else if (useAIScan) {
            const { runAIAuraScan } = await import('@/lib/mastermind/ai-aura-scan');
            scanResult = await runAIAuraScan(intakeData, sourcePhotoUrl || undefined);
            source = 'ai';
          } else {
            scanResult = await runAuraScan(intakeData);
            source = 'engine';
          }

          const scanned = sessionReducer(session, { type: 'SET_SCAN_RESULT', result: scanResult });
          await saveSessionAsync(scanned);
          console.error(
            `[Consultation Submit] Auto-scan completed for session ${session.id} (source: ${source})`
          );
        } catch (err) {
          console.error('[Consultation Submit] Auto-scan failed:', err);
        }
      })();

      // For fast non-AI scan paths, return with scan already persisted.
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
        auraUploadStatus,
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
