// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Webhook Handler
// Receives QBO change notifications for real-time sync
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { handleWebhook } from '@/lib/integrations/quickbooks/sync';
import type { QBOWebhookNotification } from '@/lib/integrations/quickbooks/types';

/**
 * Verify the webhook signature using the Intuit verifier token.
 * QBO signs webhooks with HMAC-SHA256 using the verifier token as the key.
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  verifierToken: string,
): boolean {
  const hash = createHmac('sha256', verifierToken)
    .update(payload)
    .digest('base64');

  return hash === signature;
}

/**
 * POST /api/integrations/quickbooks/webhooks
 * Handles QBO webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('intuit-signature');

    // Verify webhook signature
    const verifierToken = process.env.QBO_WEBHOOK_VERIFIER_TOKEN;
    if (verifierToken && signature) {
      if (!verifyWebhookSignature(body, signature, verifierToken)) {
        console.error('[QBO Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const notification: QBOWebhookNotification = JSON.parse(body);

    // Validate the notification structure
    if (!notification.eventNotifications || !Array.isArray(notification.eventNotifications)) {
      return NextResponse.json({ error: 'Invalid notification format' }, { status: 400 });
    }

    // Process the webhook asynchronously
    const result = await handleWebhook(notification);

    console.log('[QBO Webhook] Processed:', {
      processed: result.processed,
      errors: result.errors.length,
    });

    // QBO expects a 200 response within 10 seconds
    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('[QBO Webhook Error]', error);
    // Return 200 to prevent QBO from retrying (log the error instead)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/integrations/quickbooks/webhooks
 * QBO sends a GET request to verify the webhook endpoint during setup.
 * Respond with the challenge token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' });
}
