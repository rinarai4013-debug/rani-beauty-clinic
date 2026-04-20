import { NextRequest, NextResponse } from 'next/server';
import { captureWebhookEvent } from '@/lib/sentry-utils';
import {
  extractMangomintSignature,
  processMangomintWebhook,
  type MangomintEventType,
  verifyMangomintSignature,
} from '@/lib/webhooks/mangomint';

export function createMangomintWebhookHandler(eventType: MangomintEventType) {
  return async function handleWebhook(request: NextRequest) {
    const secret = process.env.MANGOMINT_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'MANGOMINT_WEBHOOK_SECRET is not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = extractMangomintSignature(request.headers);

    if (!verifyMangomintSignature(signature, rawBody, secret)) {
      captureWebhookEvent('mangomint', eventType, false, { reason: 'invalid_signature' });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Payload must be an object' }, { status: 400 });
    }

    try {
      const result = await processMangomintWebhook(eventType, payload as Record<string, unknown>);
      captureWebhookEvent('mangomint', eventType, true, { forwardedToN8n: result.forwardedToN8n });

      return NextResponse.json({
        received: true,
        eventType,
        forwardedToN8n: result.forwardedToN8n,
      });
    } catch (error) {
      console.error(`[webhook:mangomint:${eventType}]`, error);
      captureWebhookEvent('mangomint', eventType, false, { reason: 'handler_error' });
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
    }
  };
}
