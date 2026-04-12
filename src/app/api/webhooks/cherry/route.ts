import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchFirst, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';

// ─── Env ──────────────────────────────────────────────────────────
function getCherryWebhookSecret(): string {
  return process.env.CHERRY_WEBHOOK_SECRET || '';
}

// ─── Types ────────────────────────────────────────────────────────
const CherryWebhookDataSchema = z.object({
  amount: z.number().nonnegative().optional(),
  customerId: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  applicationId: z.string().trim().min(1).optional(),
});

const CherryWebhookPayloadSchema = z.object({
  event: z.string().trim().min(1),
  data: CherryWebhookDataSchema,
});

interface TreatmentPlanFields {
  [key: string]: unknown;
  Status?: string;
  'Client Name'?: string;
}

// ─── POST Handler ─────────────────────────────────────────────────
// Receives Cherry payment webhook events

export async function POST(request: NextRequest) {
  return withSentry('webhooks/cherry', async () => {
    try {
      // Read raw body for HMAC verification
      const rawBody = await request.text();

      // ── HMAC-SHA256 Signature Verification ──
      const secret = getCherryWebhookSecret();
      if (!secret) {
        console.error('[Cherry Webhook] CHERRY_WEBHOOK_SECRET not set — rejecting request');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
      } else {
        const signature = request.headers.get('x-webhook-signature');
        if (!signature) {
          console.error('[Cherry Webhook] Missing x-webhook-signature header');
          return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const crypto = await import('crypto');
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        const sigBuf = Buffer.from(signature, 'utf8');
        const expBuf = Buffer.from(expected, 'utf8');

        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          console.error('[Cherry Webhook] Invalid signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }

      // ── Zod Payload Validation ──
      let jsonBody: unknown;
      try {
        jsonBody = JSON.parse(rawBody);
      } catch {
        console.error('[Cherry Webhook] Malformed JSON body');
        return NextResponse.json({ error: 'Malformed JSON' }, { status: 422 });
      }

      const parsed = CherryWebhookPayloadSchema.safeParse(jsonBody);
      if (!parsed.success) {
        console.error('[Cherry Webhook] Invalid payload:', parsed.error.issues[0]?.message);
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 422 },
        );
      }

      const body = parsed.data;

      // Log the event for audit
      console.error('[Cherry Webhook] Received event:', {
        event: body.event,
        customerId: body.data?.customerId,
        applicationId: body.data?.applicationId,
        amount: body.data?.amount,
        status: body.data?.status,
        timestamp: new Date().toISOString(),
      });

      // Validate basic structure
      if (!body.event || !body.data) {
        console.error('[Cherry Webhook] Invalid payload: missing event or data');
        return NextResponse.json({ received: true, warning: 'Invalid payload' }, { status: 200 });
      }

      // Handle checkout.completed event
      if (body.event === 'checkout.completed') {
        const { customerId, applicationId } = body.data;

        if (!customerId && !applicationId) {
          console.error('[Cherry Webhook] checkout.completed missing customerId and applicationId');
          return NextResponse.json(
            { received: true, warning: 'No customer identifier' },
            { status: 200 },
          );
        }

        // Try to find the treatment plan by customer ID or application ID
        // Search by customerId in Client Name field (Cherry customerId maps to client)
        let treatmentPlans: { id: string; fields: TreatmentPlanFields }[] = [];

        if (applicationId) {
          // First try matching by applicationId if Cherry stores it somewhere
          // For now, log it and fall back to customerId
          console.error('[Cherry Webhook] Application ID:', applicationId);
        }

        if (customerId) {
          treatmentPlans = await fetchFirst<TreatmentPlanFields>(
            Tables.treatmentPlans(),
            1,
            {
              filterByFormula: `AND(OR({Status} = 'Sent', {Status} = 'Viewed', {Status} = 'Selected'), {Client Name} = '${customerId.replace(/'/g, "\\'")}')`,
              sort: [{ field: FIELDS.treatmentPlans.createdDate, direction: 'desc' }],
            },
            true,
          );
        }

        if (treatmentPlans.length > 0) {
          const plan = treatmentPlans[0];
          await updateRecord(Tables.treatmentPlans(), plan.id, {
            [FIELDS.treatmentPlans.status]: 'Booked',
          });

          console.error('[Cherry Webhook] Updated treatment plan to Booked:', {
            planId: plan.id,
            clientName: plan.fields['Client Name'],
            amount: body.data.amount,
          });
        } else {
          console.error('[Cherry Webhook] No matching treatment plan found for:', {
            customerId,
            applicationId,
          });
        }
      }

      // Always return 200 to acknowledge receipt
      return NextResponse.json({ received: true, event: body.event });
    } catch (error) {
      console.error('[Cherry Webhook] Error processing webhook:', error);
      // Return 200 even on error to prevent Cherry from retrying
      return NextResponse.json({ received: true, error: 'Processing error' }, { status: 200 });
    }
  });
}
