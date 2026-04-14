/**
 * POST /api/mastermind/scan
 *
 * Runs the Aura Skin Scan.
 * Supports 3 modes:
 *   1. AI mode: Claude vision analyzes patient photo + intake data (ANTHROPIC_API_KEY set)
 *   2. Aura Device mode: Imports from Hexagon Aura 3D scanner + AI analysis
 *   3. Rule-based fallback: Deterministic scoring from intake data only
 *   4. Mock mode: Returns mock data (USE_MOCK_AI=true)
 *
 * Accepts { sessionId } to load/save from session, or inline { intakeData, sourcePhotoUrl }.
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { MedicalHistoryFormData } from '@/lib/consultation/medical-schema';
import { logEvent } from '@/lib/logging/structured-logger';

import { withSentry } from '@/lib/sentry-utils';

const MAX_SCAN_JSON_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  return withSentry('mastermind/scan', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const rawLength = request.headers.get('content-length');
      const contentLength = rawLength ? Number(rawLength) : NaN;
      if (Number.isFinite(contentLength) && contentLength > MAX_SCAN_JSON_BYTES) {
        return apiError(
          'Payload too large for scan request. Save scan media to session first, then re-run scan.',
          413,
        );
      }

      const parsed = await parseJsonBody(request, { maxBytes: MAX_SCAN_JSON_BYTES });
      if ('error' in parsed) return parsed.error;
      const { body } = parsed;

      const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
      let intakeData = body?.intakeData as Partial<ConsultationFormData> | undefined;
      let sourcePhotoUrl = body?.sourcePhotoUrl as string | undefined;
      const medicalData = body?.medicalData as Partial<MedicalHistoryFormData> | undefined;
      const useAuraDevice = body?.useAuraDevice === true;

      // Load from session if sessionId provided
      let session = null;
      if (sessionId) {
        session = await getSessionByIdAsync(sessionId);
        if (!session) return apiError('Session not found', 404);
        if (!intakeData && session.intakeData) {
          intakeData = session.intakeData as Partial<ConsultationFormData>;
        }
        if (!sourcePhotoUrl && session.sourcePhotoUrl) {
          sourcePhotoUrl = session.sourcePhotoUrl;
        }
      }

      if (!intakeData || typeof intakeData !== 'object') {
        return apiError('Missing intake data', 400);
      }

      if (sourcePhotoUrl === '[photo_ref_unavailable]') {
        return apiError(
          'Source photo is temporarily unavailable across instances. Please re-upload the Aura image/PDF and retry.',
          424,
        );
      }

      const useMock = process.env.USE_MOCK_AI === 'true';
      const hasAIKey = !!process.env.ANTHROPIC_API_KEY;
      let result;
      let source: string;

      if (useMock) {
        result = mockAuraScanResult();
        source = 'mock';
      } else if (useAuraDevice) {
        // Import from Hexagon Aura 3D scanner + Claude AI analysis
        try {
          const { findLatestScan } = await import('@/lib/mastermind/aura-device-integration');
          const { runAIAuraScanWithDevice } =
            await import('@/lib/mastermind/ai-aura-scan-with-device');
          const patientName =
            session?.patientName ||
            `${intakeData.firstName || ''} ${intakeData.lastName || ''}`.trim();
          const deviceScan = await findLatestScan(patientName);
          if (!deviceScan) {
            return apiError(`No Aura device scan found for "${patientName}"`, 404);
          }
          result = await runAIAuraScanWithDevice(deviceScan, intakeData);
          source = 'aura-device-ai';
        } catch (err) {
          logEvent('ai', 'warn', '[Scan] Aura device import failed, using fallback', {
            error: err instanceof Error ? err.message : String(err),
          });
          if (hasAIKey) {
            const { runAIAuraScan } = await import('@/lib/mastermind/ai-aura-scan');
            result = await runAIAuraScan(intakeData, sourcePhotoUrl);
            source = 'ai-fallback';
          } else {
            result = await runAuraScan(intakeData, medicalData);
            source = 'engine-fallback';
          }
        }
      } else if (hasAIKey) {
        // Claude AI vision scan
        try {
          const { runAIAuraScan } = await import('@/lib/mastermind/ai-aura-scan');
          result = await runAIAuraScan(intakeData, sourcePhotoUrl);
          source = 'ai';
        } catch (err) {
          logEvent('ai', 'warn', '[Scan] AI scan failed, falling back to rule engine', {
            error: err instanceof Error ? err.message : String(err),
          });
          result = await runAuraScan(intakeData, medicalData);
          source = 'engine-fallback';
        }
      } else {
        result = await runAuraScan(intakeData, medicalData);
        source = 'engine';
      }

      // Save to session if loaded
      if (session) {
        const updated = sessionReducer(session, { type: 'SET_SCAN_RESULT', result });
        await saveSessionAsync(updated);
      }

      return apiSuccess(result, { source });
    } catch (error) {
      logEvent('api', 'error', '[Aura Scan API] Error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return apiError(
        `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
      );
    }
  });
}
