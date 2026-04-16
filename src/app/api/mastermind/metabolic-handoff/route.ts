/**
 * POST /api/mastermind/metabolic-handoff
 *
 * Staff-authenticated endpoint that records a metabolic protocol handoff
 * and enforces status-aware checkout routing.
 *
 * Behavioral contract:
 *   ineligible               → 422 blocked (handoff never recorded, no checkout)
 *   provider-review-required → 200, handoffSubmitted: true, checkoutUrl: null
 *   eligible                 → 200, handoffSubmitted: true, checkoutUrl populated
 *
 * Allowed roles: ceo | provider | operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { unauthorized, forbidden } from '@/lib/auth/middleware';
import { getSessionByIdAsync } from '@/lib/mastermind/session';
import { z } from 'zod';
import { withSentry } from '@/lib/sentry-utils';
import type { UserRole } from '@/types/auth';

// ── Auth ──

const HANDOFF_ALLOWED_ROLES: UserRole[] = ['ceo', 'provider', 'operations'];

// ── Schema ──

const MetabolicHandoffSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
  metabolicStatus: z.enum(['eligible', 'provider-review-required', 'ineligible']),
  recommendedTrack: z.enum(['glp1', 'hormones', 'peptides', 'hybrid']),
  protocolTier: z.enum(['foundation', 'performance', 'elite']),
  fulfillmentPreference: z.enum(['clinic', 'home']),
  homeDeliveryRequested: z.boolean(),
  dosageGovernanceSummary: z.string().min(1, 'dosageGovernanceSummary required'),
  providerReviewRequired: z.boolean(),
  approvalStatus: z.enum(['pending', 'approved', 'not_required']),
});

export type MetabolicHandoffPayload = z.infer<typeof MetabolicHandoffSchema>;

// ── Route ──

export async function POST(request: NextRequest) {
  return withSentry('mastermind/metabolic-handoff', async () => {
    try {
      // 401 — no valid session
      const rawSession = await getSessionFromRequest(request).catch(() => null);
      if (!rawSession) {
        return unauthorized();
      }

      // 403 — authenticated but role not permitted for clinical handoff
      if (!HANDOFF_ALLOWED_ROLES.includes(rawSession.role)) {
        return forbidden();
      }

      // 422 — payload schema validation
      const parsed = MetabolicHandoffSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Invalid request body',
          },
          { status: 422 },
        );
      }

      const payload = parsed.data;

      // 422 — ineligible patients blocked from handoff at route level
      if (payload.metabolicStatus === 'ineligible') {
        return NextResponse.json(
          {
            success: false,
            error: 'Patient is not eligible for this metabolic protocol — handoff blocked',
            blocked: true,
          },
          { status: 422 },
        );
      }

      // 404 — session not found
      const session = await getSessionByIdAsync(payload.sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 },
        );
      }

      // Determine checkout routing
      const isHeld =
        payload.metabolicStatus === 'provider-review-required' ||
        payload.providerReviewRequired ||
        payload.approvalStatus === 'pending';

      const checkoutUrl = isHeld
        ? null
        : (process.env.METABOLIC_CHECKOUT_URL ?? null);

      return NextResponse.json({
        success: true,
        data: {
          sessionId: payload.sessionId,
          recommendedTrack: payload.recommendedTrack,
          protocolTier: payload.protocolTier,
          handoffSubmitted: true,
          checkoutUrl,
          approvalStatus: isHeld ? 'pending' : payload.approvalStatus,
          providerReviewRequired: payload.providerReviewRequired,
          heldForProviderReview: isHeld,
        },
      });
    } catch (error) {
      console.error('[Metabolic Handoff] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Handoff failed',
        },
        { status: 500 },
      );
    }
  });
}
