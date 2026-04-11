import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Tables, createRecord } from '@/lib/airtable/client';
import { upsertClientAttribution } from '@/lib/attribution/upsert-client-attribution';

import { withSentry } from '@/lib/sentry-utils';

// ── Zod schema ───────────────────────────────────────────────────
const SubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.string().max(100).optional().default('unknown'),
  leadSource: z.string().max(100).optional(),
  leadMedium: z.string().max(100).optional(),
  leadCampaign: z.string().max(150).optional(),
  leadAdSet: z.string().max(150).optional(),
  leadAd: z.string().max(150).optional(),
  leadOffer: z.string().max(150).optional(),
  leadLandingPage: z.string().max(500).optional(),
  leadKeyword: z.string().max(150).optional(),
  leadReferrer: z.string().max(500).optional(),
  attributionId: z.string().max(150).optional(),
  firstTouchAt: z.string().datetime().optional(),
  lastTouchAt: z.string().datetime().optional(),
  utm_source: z.string().max(150).optional(),
  utm_medium: z.string().max(150).optional(),
  utm_campaign: z.string().max(150).optional(),
  utm_content: z.string().max(150).optional(),
  utm_term: z.string().max(150).optional(),
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
});

// ── In-memory rate limiter (max 5 signups per IP per hour) ──────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Periodically prune expired entries to avoid memory leak
function pruneRateLimitMap() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

// Prune every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(pruneRateLimitMap, 10 * 60 * 1000);
}

// ── POST handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  return withSentry('subscribe', async () => {
    // 1. Rate limiting by IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // 2. Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 3. Honeypot check — bots get a silent 200
    const raw = body as Record<string, unknown>;
    if (typeof raw?.honeypot === 'string' && raw.honeypot.length > 0) {
      return NextResponse.json({ success: true });
    }

    // 4. Validate with Zod
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 422 },
      );
    }

    const {
      email,
      source,
      leadSource,
      leadMedium,
      leadCampaign,
      leadAdSet,
      leadAd,
      leadOffer,
      leadLandingPage,
      leadKeyword,
      leadReferrer,
      attributionId,
      firstTouchAt,
      lastTouchAt,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = parsed.data;

    // 5. Write to Airtable Intake table
    // Field names verified against live Airtable schema (matches contact/route.ts)
    const airtablePayload = {
      Email: email,
      'Processing Status': 'New',
      'Intake Summary (AI)': [
        `Newsletter signup from ${source}`,
        leadSource ? `Lead Source: ${leadSource}` : null,
        leadMedium ? `Lead Medium: ${leadMedium}` : null,
        leadCampaign ? `Lead Campaign: ${leadCampaign}` : null,
        leadAdSet ? `Lead Ad Set: ${leadAdSet}` : null,
        leadAd ? `Lead Ad: ${leadAd}` : null,
        leadOffer ? `Lead Offer: ${leadOffer}` : null,
        leadLandingPage ? `Lead Landing Page: ${leadLandingPage}` : null,
        leadKeyword ? `Lead Keyword: ${leadKeyword}` : null,
        leadReferrer ? `Lead Referrer: ${leadReferrer}` : null,
        attributionId ? `Attribution ID: ${attributionId}` : null,
        firstTouchAt ? `First Touch At: ${firstTouchAt}` : null,
        lastTouchAt ? `Last Touch At: ${lastTouchAt}` : null,
        utm_source ? `UTM Source: ${utm_source}` : null,
        utm_medium ? `UTM Medium: ${utm_medium}` : null,
        utm_campaign ? `UTM Campaign: ${utm_campaign}` : null,
        utm_content ? `UTM Content: ${utm_content}` : null,
        utm_term ? `UTM Term: ${utm_term}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    };

    try {
      await createRecord(Tables.intakes(), airtablePayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(
        '[subscribe] Airtable write failed:',
        errMsg,
        '| Payload fields:',
        Object.keys(airtablePayload).join(', '),
      );
      if (errMsg.includes('UNKNOWN_FIELD_NAME')) {
        console.error(
          '[subscribe] FIELD NAME MISMATCH — one or more fields in',
          Object.keys(airtablePayload),
          'do not exist in the Intake table. Verify field names at https://airtable.com/app1SwhSfwe8GKUg4',
        );
      }
      // Don't block the user — still attempt n8n
    }

    try {
      await upsertClientAttribution({
        email,
        leadSource,
        leadMedium,
        leadCampaign,
        leadAdSet,
        leadAd,
        leadOffer,
        leadLandingPage,
        leadKeyword,
        leadReferrer,
        attributionId,
        firstTouchAt,
        lastTouchAt,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
      });
    } catch (err) {
      console.error(
        '[subscribe] Client attribution upsert failed:',
        err instanceof Error ? err.message : err,
      );
    }

    // 6. Forward to n8n webhook if configured
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'email_subscribe',
            email,
            signupSource: source,
            leadSource,
            leadMedium,
            leadCampaign,
            leadAdSet,
            leadAd,
            leadOffer,
            leadLandingPage,
            leadKeyword,
            leadReferrer,
            attributionId,
            firstTouchAt,
            lastTouchAt,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            utm_term,
            submittedAt: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (err) {
        console.error('[subscribe] n8n webhook failed:', err);
      }
    }

    return NextResponse.json({ success: true });
  });
}
