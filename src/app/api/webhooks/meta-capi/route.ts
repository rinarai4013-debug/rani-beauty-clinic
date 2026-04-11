import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import { logWebhookEvent } from '@/lib/logging/structured-logger';
import { verifyWebhookSignature } from '@/lib/webhooks/verify-signature';
import { z } from 'zod';

interface MetaCapiPayload {
  event_name?: string;
  event_name_1?: string;
  event?: string;
  data?: Record<string, unknown>;
}

const metaCapiPayloadSchema = z.object({
  event_name: z.string().optional(),
  event_name_1: z.string().optional(),
  event: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

// POST - receive Meta CAPI webhook events
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('meta-capi-webhook', ip, RATE_LIMITS.WEBHOOK);
  if (!allowed) {
    return rateLimitResponse(resetIn);
  }

  const rawBody = await request.text();
  if (!env.META_CAPI_WEBHOOK_SECRET) {
    logWebhookEvent('meta-capi', 'config', false, { error: 'Missing META_CAPI_WEBHOOK_SECRET' });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const signature = request.headers.get('x-hub-signature-256') ?? request.headers.get('x-meta-signature');
  if (!verifyWebhookSignature({
    rawBody,
    signature,
    secret: env.META_CAPI_WEBHOOK_SECRET,
    signaturePrefix: 'sha256=',
  })) {
    logWebhookEvent('meta-capi', 'verify', false, { error: 'Invalid signature' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: MetaCapiPayload;
  try {
    const parsed = metaCapiPayloadSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      logWebhookEvent('meta-capi', 'parse', false, { error: 'Invalid payload schema' });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    logWebhookEvent('meta-capi', 'parse', false, { error: 'Invalid JSON payload' });
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const event = body.event_name || body.event_name_1 || body.event || 'unknown';
  logWebhookEvent('meta-capi', 'received', true, {
    event,
    hasData: Boolean(body.data),
    payloadSample: JSON.stringify(body).slice(0, 300),
  });

  return NextResponse.json({ received: true, event });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
