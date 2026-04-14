/**
 * POST /api/mastermind/metabolic-handoff
 *
 * Staff-authenticated route for submitting a metabolic protocol handoff
 * from the Mastermind Presentation Mode. Writes to Airtable Client Intakes
 * and logs the handoff action to the session activity log.
 *
 * This replaces the previous pattern of posting to /api/contact from the
 * dashboard, which bypassed staff auth and created CRM records
 * indistinguishable from public website visitors.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { forbidden, unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import { logEvent } from '@/lib/logging/structured-logger';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { withSentry } from '@/lib/sentry-utils';

const HandoffSchema = z.object({
  sessionId: z.string().min(1),
  patientName: z.string().min(1).max(120),
  patientEmail: z.string().email(),
  patientPhone: z.string().max(30).optional().default(''),
  selectedPackageName: z.string().min(1).max(200),
  recommendedTrack: z.enum(['glp1', 'hormones', 'peptides', 'hybrid']),
  protocolTier: z.enum(['start', 'transform', 'elite']),
  fulfillmentPreference: z.enum(['clinic', 'home']),
  homeDeliveryRequested: z.boolean(),
  dosageGovernanceSummary: z.string().max(3000),
  mastermindPackageTier: z.string().max(50).optional().default(''),
  goalsSummary: z.string().max(1200).optional().default(''),
  symptomsSummary: z.string().max(1200).optional().default(''),
});

export async function POST(request: NextRequest) {
  return withSentry('mastermind/metabolic-handoff', async () => {
    try {
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) return unauthorized();
      if (authSession.role !== 'ceo' && authSession.role !== 'provider') return forbidden();

      const parsed = await parseJsonBody(request);
      if ('error' in parsed) return parsed.error;

      const validated = HandoffSchema.safeParse(parsed.body);
      if (!validated.success) {
        return apiError(
          `Invalid handoff payload: ${validated.error.issues.map((i) => i.message).join(', ')}`,
          422,
        );
      }

      const data = validated.data;
      const providerName = authSession.name || authSession.username || 'Staff';
      const providerId = authSession.username || 'staff';

      // Verify session exists
      const session = await getSessionByIdAsync(data.sessionId);
      if (!session) return apiError('Session not found', 404);

      // Write to Airtable Client Intakes with metabolic context
      const intakeSummary = [
        `Metabolic Track: ${data.recommendedTrack}`,
        `Protocol Tier: ${data.protocolTier}`,
        `Fulfillment: ${data.fulfillmentPreference}`,
        `Home Delivery: ${data.homeDeliveryRequested ? 'Yes' : 'No'}`,
        `Package: ${data.selectedPackageName}`,
        data.mastermindPackageTier ? `Mastermind Package: ${data.mastermindPackageTier}` : null,
        data.goalsSummary ? `Goals: ${data.goalsSummary}` : null,
        data.symptomsSummary ? `Symptoms: ${data.symptomsSummary}` : null,
        `Session ID: ${data.sessionId}`,
        '',
        'Dosage Governance Summary',
        data.dosageGovernanceSummary,
      ].filter(Boolean).join('\n');

      try {
        await rateLimitedQuery(async () => {
          await Tables.intakes().create(
            {
              'Full Name': data.patientName,
              'Email': data.patientEmail,
              'Phone Number': data.patientPhone,
              'Processing Status': 'New',
              'Intake Summary (AI)': intakeSummary,
            },
            { typecast: true },
          );
        });
      } catch (err) {
        logEvent('api', 'warn', '[Metabolic Handoff] Airtable intake write failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Push handoff into provider-review queue state first
      const withProviderReview = sessionReducer(session, {
        type: 'SET_PROVIDER_REVIEW',
        review: {
          providerId,
          providerName,
          modifications: [],
          clinicalNotes: [
            'Metabolic protocol handoff pending provider signoff before launch.',
            `Track: ${data.recommendedTrack}`,
            `Tier: ${data.protocolTier}`,
            `Fulfillment: ${data.fulfillmentPreference}`,
            `Home Delivery Requested: ${data.homeDeliveryRequested ? 'Yes' : 'No'}`,
            `Dosage Governance: ${data.dosageGovernanceSummary}`,
          ],
          approvalStatus: 'pending',
        },
      });

      const withStatus = sessionReducer(withProviderReview, {
        type: 'SET_CLINIC_STATUS',
        status: 'reviewed',
        actor: providerName,
      });

      const nextNotes = [
        withStatus.clinicNotes,
        `Metabolic handoff submitted by ${providerName}: ${data.recommendedTrack} track, ${data.protocolTier} tier, ${data.fulfillmentPreference} fulfillment. Provider signoff required before launch.`,
      ]
        .filter(Boolean)
        .join('\n');

      const updated = sessionReducer(withStatus, {
        type: 'SET_CLINIC_NOTES',
        notes: nextNotes,
        actor: providerName,
      });
      await saveSessionAsync(updated);

      logEvent('api', 'info', '[Metabolic Handoff] Submitted', {
        sessionId: data.sessionId,
        track: data.recommendedTrack,
        tier: data.protocolTier,
        fulfillment: data.fulfillmentPreference,
      });

      return apiSuccess({
        sessionId: data.sessionId,
        track: data.recommendedTrack,
        tier: data.protocolTier,
        fulfillment: data.fulfillmentPreference,
        homeDeliveryRequested: data.homeDeliveryRequested,
        providerReviewRequired: true,
        approvalStatus: 'pending',
      });
    } catch (error) {
      logEvent('api', 'error', '[Metabolic Handoff] Error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return apiError('Metabolic handoff failed', 500);
    }
  });
}
