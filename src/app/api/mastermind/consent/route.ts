/**
 * POST /api/mastermind/consent — Store a signed consent record
 * GET  /api/mastermind/consent?sessionId=xxx — Retrieve all consent records for a session
 *
 * Consent records are stored in the session's details JSON (persisted to Airtable).
 * Each consent record includes the full consent text, signature data URL, and metadata.
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSessionByIdAsync, saveSessionAsync } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { ConsentRecord } from '@/types/consent';

import { withSentry } from '@/lib/sentry-utils';
import { logEvent } from '@/lib/logging/structured-logger';

// ── POST: Store a consent record ──

export async function POST(request: NextRequest) {
  return withSentry('mastermind/consent', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const parsed = await parseJsonBody(request);
      if ('error' in parsed) return parsed.error;
      const { body } = parsed;

      // Validate required fields
      const record = body as unknown as ConsentRecord;
      if (!record.sessionId || typeof record.sessionId !== 'string') {
        return apiError('Missing or invalid sessionId', 400);
      }
      if (!record.consentType || typeof record.consentType !== 'string') {
        return apiError('Missing or invalid consentType', 400);
      }
      if (!record.signatureDataUrl || typeof record.signatureDataUrl !== 'string') {
        return apiError('Missing signature data', 400);
      }
      if (!record.patientName || typeof record.patientName !== 'string') {
        return apiError('Missing patientName', 400);
      }
      if (!record.signedAt || typeof record.signedAt !== 'string') {
        return apiError('Missing signedAt timestamp', 400);
      }

      const validTypes = [
        'general_treatment',
        'specific_procedure',
        'photo_release',
        'telehealth',
        'financial',
      ];
      if (!validTypes.includes(record.consentType)) {
        return apiError(`Invalid consentType. Must be one of: ${validTypes.join(', ')}`, 400);
      }

      // Load the session
      const session = await getSessionByIdAsync(record.sessionId);
      if (!session) {
        return apiError('Session not found', 404);
      }

      // Generate consent ID if not provided
      const consentId =
        record.id || `consent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      // Build the complete consent record
      const consentRecord: ConsentRecord = {
        id: consentId,
        sessionId: record.sessionId,
        patientName: record.patientName,
        patientEmail: record.patientEmail || session.patientEmail || '',
        consentType: record.consentType,
        consentText: record.consentText || '',
        treatmentNames: record.treatmentNames,
        signatureDataUrl: record.signatureDataUrl,
        signedAt: record.signedAt,
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: record.userAgent || request.headers.get('user-agent') || undefined,
        witnessName: record.witnessName,
      };

      // Store consent records in session — use a consent extension on the session object.
      // We store them as a JSON array in a custom property that gets serialized with the session.
      const sessionAny = session as unknown as Record<string, unknown>;
      const existingConsents: ConsentRecord[] = Array.isArray(sessionAny._consentRecords)
        ? (sessionAny._consentRecords as ConsentRecord[])
        : [];

      // Prevent duplicate consent types (replace if same type exists)
      const filteredConsents = existingConsents.filter(
        (c) => c.consentType !== consentRecord.consentType,
      );
      filteredConsents.push(consentRecord);

      sessionAny._consentRecords = filteredConsents;

      // Persist
      await saveSessionAsync(session);

      return apiSuccess(
        { consentId, consentType: consentRecord.consentType, signedAt: consentRecord.signedAt },
        { totalConsents: filteredConsents.length },
      );
    } catch (error) {
      logEvent('api', 'error', '[Mastermind Consent] POST error', { error: error instanceof Error ? error.message : String(error) });
      return apiError('Failed to store consent record');
    }
  });
}

// ── GET: Retrieve consent records for a session ──

export async function GET(request: NextRequest) {
  return withSentry('mastermind/consent', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const { searchParams } = new URL(request.url);
      const sessionId = searchParams.get('sessionId');

      if (!sessionId) {
        return apiError('Missing sessionId query parameter', 400);
      }

      // Load the session
      const session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return apiError('Session not found', 404);
      }

      const sessionAny = session as unknown as Record<string, unknown>;
      const consents: ConsentRecord[] = Array.isArray(sessionAny._consentRecords)
        ? (sessionAny._consentRecords as ConsentRecord[])
        : [];

      // Compute completeness
      const signedTypes = new Set(consents.map((c) => c.consentType));
      const requiredTypes: ConsentRecord['consentType'][] = ['general_treatment', 'financial'];

      // If the session has treatments, specific procedure consent is required
      if (session.mastermindPlan?.recommendations) {
        requiredTypes.push('specific_procedure');
      }

      // Photo release is always recommended
      requiredTypes.push('photo_release');

      const missingConsents = requiredTypes.filter((t) => !signedTypes.has(t));
      const allComplete = missingConsents.length === 0;

      return apiSuccess({
        consents: consents.map((c) => ({
          ...c,
          // Strip the full signature data URL from the list response to keep payload small.
          // Include a flag indicating the signature exists.
          signatureDataUrl: undefined,
          hasSignature: !!c.signatureDataUrl,
        })),
        allConsentsComplete: allComplete,
        missingConsents,
        totalSigned: consents.length,
      });
    } catch (error) {
      logEvent('api', 'error', '[Mastermind Consent] GET error', { error: error instanceof Error ? error.message : String(error) });
      return apiError('Failed to retrieve consent records');
    }
  });
}
