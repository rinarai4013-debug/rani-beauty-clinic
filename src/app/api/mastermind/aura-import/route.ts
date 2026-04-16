/**
 * GET/POST /api/mastermind/aura-import
 *
 * Import Aura 3D scanner images into a Mastermind session.
 *
 * GET  — List available scans from the Aura device
 * POST — Import a scan into an active Mastermind session
 */

import { NextRequest } from 'next/server';
import {
  listAvailableScans,
  importAuraScan,
  findLatestScan,
} from '@/lib/mastermind/aura-device-integration';
import { runAIAuraScanWithDevice } from '@/lib/mastermind/ai-aura-scan-with-device';
import { getSessionFromAirtable, saveSessionToAirtable } from '@/lib/mastermind/session-store';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';

import { withSentry } from '@/lib/sentry-utils';
import { logEvent } from '@/lib/logging/structured-logger';

/**
 * GET — List available scans from the Aura device.
 * Returns array of { name, date, imageCount }.
 */
export async function GET() {
  return withSentry('mastermind/aura-import', async () => {
    try {
      const scans = listAvailableScans();
      return apiSuccess(scans, { source: 'aura-device', count: scans.length });
    } catch (error) {
      logEvent('api', 'error', '[Aura Import API] GET error', { error: error instanceof Error ? error.message : String(error) });
      return apiError('Failed to list Aura scans');
    }
  });
}

/**
 * POST — Import a scan into a Mastermind session.
 *
 * Body: { sessionId: string, patientName: string, scanDate?: string }
 *
 * - Finds the matching Aura scan (latest if no date specified)
 * - Converts all images to base64
 * - Stores the front image as the session's sourcePhotoUrl
 * - Sends all scan images to the AI Aura Scan engine for analysis
 * - Updates the session with scan results
 * - Returns the imported scan data
 */
export async function POST(request: NextRequest) {
  return withSentry('mastermind/aura-import', async () => {
    try {
      const parsed = await parseJsonBody(request);
      if ('error' in parsed) return parsed.error;
      const { body } = parsed;

      const sessionId = body.sessionId as string | undefined;
      const patientName = body.patientName as string | undefined;
      const scanDate = body.scanDate as string | undefined;

      if (!sessionId) {
        return apiError('Missing sessionId', 400);
      }
      if (!patientName) {
        return apiError('Missing patientName', 400);
      }

      // 1. Find the session
      const session = await getSessionFromAirtable(sessionId);
      if (!session) {
        return apiError(`Session not found: ${sessionId}`, 404);
      }

      // 2. Import the Aura scan (specific date or latest)
      logEvent('api', 'info', '[Aura Import API] Importing scan', { patientName, scanDate: scanDate || 'latest' });

      let deviceScan;
      if (scanDate) {
        deviceScan = await importAuraScan(patientName, scanDate);
      } else {
        deviceScan = await findLatestScan(patientName);
      }

      if (!deviceScan) {
        return apiError(
          `No Aura scan found for "${patientName}"${scanDate ? ` on ${scanDate}` : ''}. ` +
            'Ensure the Aura scanner app has completed the scan and images are saved.',
          404,
        );
      }

      // 3. Store the front image as the session's source photo
      session.sourcePhotoUrl = deviceScan.images.front;
      session.phase = 'scanning';
      session.updatedAt = new Date().toISOString();
      await saveSessionToAirtable(session);

      // 4. Run AI analysis on the device scan images
      logEvent('ai', 'info', '[Aura Import API] Running AI analysis on device scan images');

      const useMock = process.env.USE_MOCK_AI === 'true';
      let scanResult;

      if (useMock) {
        // In mock mode, use the existing mock scan result
        const { mockAuraScanResult } = await import('@/lib/mastermind/mock-data');
        scanResult = mockAuraScanResult();
        logEvent('ai', 'warn', '[Aura Import API] Using mock scan result (USE_MOCK_AI=true)');
      } else {
        // Run the real AI analysis with device images
        scanResult = await runAIAuraScanWithDevice(deviceScan, session.intakeData || {});
      }

      // 5. Update session with scan results
      session.auraScanResult = scanResult;
      session.phase = 'scan_complete';
      session.updatedAt = new Date().toISOString();
      await saveSessionToAirtable(session);

      logEvent('ai', 'info', '[Aura Import API] Import complete', { auraScoreOverall: scanResult?.auraScore?.overall, auraScoreGrade: scanResult?.auraScore?.grade });

      return apiSuccess(
        {
          scan: {
            patientName: deviceScan.patientName,
            scanDate: deviceScan.scanDate,
            imageKeys: Object.entries(deviceScan.images)
              .filter(([, v]) => !!v)
              .map(([k]) => k),
            expressionKeys: deviceScan.expressions
              ? Object.entries(deviceScan.expressions)
                  .filter(([, v]) => !!v)
                  .map(([k]) => k)
              : [],
            handoutPdfPath: deviceScan.handoutPdfPath || null,
          },
          scanResult,
          session: {
            id: session.id,
            phase: session.phase,
            updatedAt: session.updatedAt,
          },
        },
        {
          source: useMock ? 'mock' : 'aura-device-ai',
          imageCount: Object.values(deviceScan.images).filter(Boolean).length,
        },
      );
    } catch (error) {
      logEvent('api', 'error', '[Aura Import API] POST error', { error: error instanceof Error ? error.message : String(error) });
      return apiError(
        `Aura import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });
}
