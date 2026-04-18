import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import { env } from '@/lib/env';
import { Tables, updateRecord } from '@/lib/airtable/client';

export const dynamic = 'force-dynamic';

const MAX_JSON_REQUEST_BYTES = 128 * 1024;

const offerSelectionSchema = z.object({
  intakeId: z.string().min(1).optional(),
  selectedProductId: z.string().min(1),
  selectedProductLabel: z.string().min(1),
  category: z.string().min(1),
  requestedTrack: z.string().min(1),
  fulfillmentMode: z.enum(['clinic', 'home']),
  quotedRetail: z.coerce.number().nonnegative(),
  quotedGrossProfit: z.coerce.number().nonnegative(),
  quotedMarginPercent: z.coerce.number().nonnegative(),
});

function buildCheckoutUrl(requestedTrack: string, mode: 'clinic' | 'home'): string {
  if (requestedTrack === 'peptides') {
    return `/peptide/intake?checkout=${mode}`;
  }
  return `/glp1/intake?checkout=${mode}&track=${encodeURIComponent(requestedTrack)}`;
}

export async function POST(request: NextRequest) {
  return withSentry('consultation-offer-selection', async () => {
    try {
      const originError = enforceAllowedPublicOrigin(request);
      if (originError) return originError;

      const sizeError = enforceContentLength(request, MAX_JSON_REQUEST_BYTES);
      if (sizeError) return sizeError;

      const ip = getClientIP(request);
      const { allowed, resetIn } = rateLimit('consultation-offer-selection', ip, RATE_LIMITS.FORM);
      if (!allowed) return rateLimitResponse(resetIn);

      const parsed = offerSelectionSchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Invalid selection payload.' },
          { status: 400 }
        );
      }

      const payload = parsed.data;
      const checkoutUrl = buildCheckoutUrl(payload.requestedTrack, payload.fulfillmentMode);
      const providerLockMessage =
        'Provider signoff is required before prescription handoff or dispensing. Your request has been queued for clinical review.';

      if (env.AIRTABLE_PAT && env.AIRTABLE_BASE_ID && payload.intakeId) {
        try {
          await updateRecord(Tables.intakes(), payload.intakeId, {
            'Suggested Next Step (AI)': `${providerLockMessage} Selected: ${payload.selectedProductLabel} (${payload.fulfillmentMode}).`,
            'Program Plan (AI)': `Selected product: ${payload.selectedProductLabel} [${payload.category}] | track: ${payload.requestedTrack} | fulfillment: ${payload.fulfillmentMode} | quoted retail: $${payload.quotedRetail.toFixed(2)} | quoted gross profit: $${payload.quotedGrossProfit.toFixed(2)} | margin: ${payload.quotedMarginPercent.toFixed(1)}%.`,
            'Treatment Value (AI)': `${Math.round(payload.quotedRetail)}`,
          });
        } catch (error) {
          console.error('[consultation/offer-selection] Failed to persist selection:', error);
        }
      }

      return NextResponse.json({
        success: true,
        providerReviewRequired: true,
        providerReviewStatus: 'pending',
        prescriptionHandoffLocked: true,
        checkoutAllowed: true,
        checkoutUrl,
        message: providerLockMessage,
      });
    } catch (error) {
      console.error('[consultation/offer-selection] Unexpected error:', error);
      return NextResponse.json(
        { error: 'Unable to process offer selection right now. Please retry.' },
        { status: 500 }
      );
    }
  });
}
