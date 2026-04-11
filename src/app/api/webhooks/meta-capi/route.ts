import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';

/**
 * POST /api/webhooks/meta-capi
 *
 * Proxies conversion events from trusted server-to-server callers (n8n,
 * backend jobs) to the Meta Conversions API. Hashes PII (email/phone)
 * with SHA-256 before forwarding per Meta's privacy rules, then POSTs
 * to graph.facebook.com/v18.0/{pixelId}/events using the Rani access
 * token.
 *
 * AUTHENTICATION (Wave 11 Horizon 1 P1-4 fix, 2026-04-10):
 *   This endpoint REQUIRES an HMAC-SHA256 signature in the
 *   `x-hub-signature-256` header, signed with `META_CAPI_WEBHOOK_SECRET`.
 *   If the secret is not configured, the endpoint fails closed (503).
 *   Previously, a missing secret was treated as a warning and the
 *   request was accepted unsigned — that made this route a free
 *   conversion-event injection point.
 *
 *   Callers must compute `sha256=<hex>` over the raw request body
 *   and put it in the `x-hub-signature-256` header. Example (Node):
 *
 *     const signature = 'sha256=' + crypto
 *       .createHmac('sha256', process.env.META_CAPI_WEBHOOK_SECRET)
 *       .update(rawBody)
 *       .digest('hex');
 */

function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || '769852657929598';
}

function getMetaAccessToken() {
  return process.env.META_CAPI_ACCESS_TOKEN;
}

function getMetaWebhookSecret() {
  return process.env.META_CAPI_WEBHOOK_SECRET;
}

const MetaUserDataSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  client_ip: z.string().trim().min(1).optional(),
  client_user_agent: z.string().trim().min(1).optional(),
});

const MetaCapiPayloadSchema = z.object({
  event_name: z.string().min(1),
  event_time: z.number().int().positive().optional(),
  event_source_url: z.string().trim().url().optional(),
  user_data: MetaUserDataSchema.partial().optional(),
  custom_data: z.record(z.unknown()).optional(),
});

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function POST(req: NextRequest) {
  return withSentry('webhooks/meta-capi', async () => {
    const accessToken = getMetaAccessToken();
    const pixelId = getMetaPixelId();

    if (!accessToken) {
      return NextResponse.json({ error: 'META_CAPI_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    // MANDATORY webhook secret. Without it, the endpoint cannot verify
    // signatures, so we fail closed rather than accept unsigned traffic.
    // (Wave 11 Horizon 1 P1-4 fix, 2026-04-10 — previously fail-open.)
    const webhookSecret = getMetaWebhookSecret();
    if (!webhookSecret) {
      console.error('[Meta CAPI] META_CAPI_WEBHOOK_SECRET is not configured — rejecting request');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    // Read raw body for HMAC verification
    const body = await req.text();

    // HMAC-SHA256 signature verification (Meta's x-hub-signature-256 header)
    const signature = req.headers.get('x-hub-signature-256');
    if (!signature) {
      console.error('[Meta CAPI] Missing x-hub-signature-256 header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const expectedSig =
      'sha256=' + crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error('[Meta CAPI] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
      let jsonBody: unknown = null;
      try {
        jsonBody = JSON.parse(body);
      } catch {
        // invalid JSON
      }
      const parsed = MetaCapiPayloadSchema.safeParse(jsonBody);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid META CAPI payload' }, { status: 400 });
      }

      const { event_name, event_time, user_data, custom_data, event_source_url } = parsed.data;

      const hashedUserData: Record<string, string> = {};
      if (user_data?.email) hashedUserData.em = sha256(user_data.email);
      if (user_data?.phone) hashedUserData.ph = sha256(user_data.phone.replace(/\D/g, ''));
      hashedUserData.client_ip_address =
        user_data?.client_ip || req.headers.get('x-forwarded-for') || '';
      hashedUserData.client_user_agent =
        user_data?.client_user_agent || req.headers.get('user-agent') || '';

      const eventData = {
        data: [
          {
            event_name,
            event_time: event_time || Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: event_source_url || 'https://www.ranibeautyclinic.com',
            user_data: hashedUserData,
            custom_data: custom_data || {},
          },
        ],
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        console.error('[Meta CAPI] Error:', result);
        return NextResponse.json(
          { error: 'Meta CAPI request failed', details: result },
          { status: 502 },
        );
      }

      return NextResponse.json({ success: true, events_received: result.events_received });
    } catch (error) {
      console.error('[Meta CAPI] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
