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

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { getSessionByIdAsyncRetry, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { MedicalHistoryFormData } from '@/lib/consultation/medical-schema';
import { isUnrenderablePhoto } from '@/lib/mastermind/image-markers';

import { withSentry } from '@/lib/sentry-utils';

export async function POST(request: NextRequest) {
  return withSentry('mastermind/scan', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const parsed = await parseJsonBody(request);
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
        session = await getSessionByIdAsyncRetry(sessionId);
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

      const hadUnrenderableSourcePhoto = Boolean(
        sourcePhotoUrl && isUnrenderablePhoto(sourcePhotoUrl)
      );

      // If the source photo is a placeholder marker, continue with fallback
      // intake-only scan; the downstream UI handles data-driven simulation.
      if (hadUnrenderableSourcePhoto) {
        console.warn('[Scan] Source photo unavailable, continuing with fallback scan data path.');
        sourcePhotoUrl = undefined;
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
          console.warn('[Scan] Aura device import failed, falling back:', err);
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
          console.warn('[Scan] AI scan failed, falling back to rule engine:', err);
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

      return apiSuccess(result, { source, photoUnavailable: hadUnrenderableSourcePhoto });
    } catch (error) {
      console.error('[Aura Scan API] Error:', error);
      try {
        const fallback = mockAuraScanResult();
        return apiSuccess(fallback, { source: 'fallback', fallback: true, error: String(error) });
      } catch {
        return apiError('Scan failed');
      }
    }
  });
}
