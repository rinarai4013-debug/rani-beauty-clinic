/**
 * POST /api/mastermind/complete
 *
 * Completes a Mastermind consultation session.
 * Thin orchestration:
 *   1. Validate session readiness
 *   2. Build completion result (PDF + automation payload)
 *   3. Fire n8n webhook (best-effort, non-blocking)
 *   4. Mark session as completed
 *   5. Return stable completion response with webhook status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import {
  buildCompletionResult,
  buildN8nWebhookPayload,
  type ConsultationCompletionResult,
} from '@/lib/mastermind/post-consultation';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';


const CompletionBodySchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

export async function POST(request: NextRequest) {
  return withSentry('mastermind/complete', async () => {
  try {
    const parsed = CompletionBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    // Load session
    const session = await getSessionByIdAsync(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate we have enough data to complete
    if (!session.auraScanResult || !session.mastermindPlan || !session.providerReview || !session.selectedPackageTier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session is not ready for completion. Required: scan, plan, provider review, package selection.',
          missing: {
            scan: !session.auraScanResult,
            plan: !session.mastermindPlan,
            review: !session.providerReview,
            package: !session.selectedPackageTier,
          },
        },
        { status: 400 }
      );
    }

    // Build completion result
    let completionResult: ConsultationCompletionResult;
    try {
      completionResult = buildCompletionResult(session);
    } catch (err) {
      console.error('[Mastermind Complete] Build error:', err);
      return NextResponse.json(
        {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to build completion',
        },
        { status: 500 }
      );
    }

    // Fire n8n webhook (best-effort — track status for response)
    let webhookStatus: 'sent' | 'failed' | 'skipped' = 'skipped';
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[Mastermind Complete] N8N_WEBHOOK_URL not set — skipping webhook');
    } else {
      const n8nPayload = buildN8nWebhookPayload(completionResult);
      try {
        await fireWebhook(webhookUrl, n8nPayload);
        webhookStatus = 'sent';
      } catch (err) {
        webhookStatus = 'failed';
        // Non-blocking: log but don't fail the completion
        console.error('[Mastermind Complete] n8n webhook failed:', err);
      }
    }

    // Mark session as completed
    const completed = sessionReducer(session, { type: 'COMPLETE' });
    await saveSessionAsync(completed);

    // Return stable response with webhook status
    return NextResponse.json({
      success: true,
      data: {
        sessionId: completionResult.sessionId,
        status: completionResult.status,
        completedAt: completionResult.completedAt,
        pdf: {
          filename: completionResult.pdf.filename,
          generatedAt: completionResult.pdf.generatedAt,
        },
        automationPayload: completionResult.automationPayload,
        webhookStatus,
      },
    });
  } catch (error) {
    console.error('[Mastermind Complete API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Completion failed',
      },
      { status: 500 }
    );
  }

  });
}

// ── Webhook Helper ──

function getWebhookTimeoutMs(): number {
  const parsed = Number(process.env.WEBHOOK_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
}

async function fireWebhook(url: string, payload: unknown): Promise<void> {
  const webhookEndpoint = url.endsWith('/')
    ? `${url}webhook/mastermind-complete`
    : `${url}/webhook/mastermind-complete`;

  const response = await fetch(webhookEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(getWebhookTimeoutMs()),
  });

  if (!response.ok) {
    throw new Error(`Webhook responded with ${response.status}`);
  }
}
