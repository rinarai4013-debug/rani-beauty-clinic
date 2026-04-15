/**
 * POST /api/metabolic/intake
 *
 * Public metabolic intake endpoint. Validates intake data, runs the
 * deterministic recommendation engine, and returns the structured
 * recommendation with safety gating.
 *
 * No AI dependency — pure deterministic scoring + safety logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRecord, Tables } from '@/lib/airtable/client';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import { logEvent } from '@/lib/logging/structured-logger';
import { withSentry } from '@/lib/sentry-utils';
import {
  metabolicIntakeSchema,
  generateMetabolicRecommendation,
} from '@/lib/metabolic/matrix';

const MAX_REQUEST_BYTES = 128 * 1024;

export async function POST(req: NextRequest) {
  return withSentry('metabolic/intake', async () => {
    const originError = enforceAllowedPublicOrigin(req);
    if (originError) return originError;

    const sizeError = enforceContentLength(req, MAX_REQUEST_BYTES);
    if (sizeError) return sizeError;

    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('metabolic-intake', ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = metabolicIntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid intake payload', details: parsed.error.issues },
        { status: 422 },
      );
    }

    const intake = parsed.data;
    const recommendation = generateMetabolicRecommendation(intake);

    const intakeSummary = [
      `Track: ${recommendation.recommendedTrack}`,
      `Status: ${recommendation.status}`,
      `Goals: ${intake.goals.join(', ')}`,
      `Symptoms: ${intake.symptoms.join(', ')}`,
      `Fulfillment Preference: ${intake.fulfillmentPreference}`,
      `Fulfillment Recommended: ${recommendation.fulfillment.recommended}`,
      recommendation.blockedTracks.length > 0 ? `Blocked Tracks: ${recommendation.blockedTracks.join(', ')}` : null,
      recommendation.riskFlags.length > 0 ? `Risk Flags: ${recommendation.riskFlags.join(' | ')}` : null,
      intake.notes ? `Notes: ${intake.notes}` : null,
      `Source: ${intake.source}`,
    ].filter(Boolean).join('\n');

    try {
      await createRecord(Tables.intakes(), {
        'Full Name': `${intake.firstName} ${intake.lastName}`.trim(),
        'Email': intake.email,
        ...(intake.phone ? { 'Phone Number': intake.phone } : {}),
        'Processing Status': 'New',
        'Intake Summary (AI)': intakeSummary,
      });
    } catch (error) {
      logEvent('api', 'warn', '[metabolic/intake] Airtable write failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        intake: {
          firstName: intake.firstName,
          lastName: intake.lastName,
          email: intake.email,
          goals: intake.goals,
          symptoms: intake.symptoms,
          fulfillmentPreference: intake.fulfillmentPreference,
        },
        recommendation,
      },
    });
  });
}
