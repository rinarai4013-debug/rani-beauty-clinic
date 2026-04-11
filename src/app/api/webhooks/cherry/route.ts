import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchFirst, updateRecord } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { FIELDS } from '@/lib/airtable/tables';
import { env } from '@/lib/env';
import { verifyWebhookSignature } from '@/lib/webhooks/verify-signature';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────
interface CherryWebhookPayload {
  event: string;
  data: {
    amount?: number;
    customerId?: string;
    status?: string;
    applicationId?: string;
  };
}

interface TreatmentPlanFields {
  [key: string]: unknown;
  Status?: string;
  'Client Name'?: string;
}

const checkoutCompletedDataSchema = z.object({
  customerId: z.string().optional(),
  applicationId: z.string().optional(),
  amount: z.number().optional(),
  status: z.string().optional(),
});

const cherryWebhookSchema = z.object({
  event: z.string().min(1),
  data: checkoutCompletedDataSchema,
});

// ─── POST Handler ─────────────────────────────────────────────────
// Receives Cherry payment webhook events

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!env.CHERRY_WEBHOOK_SECRET) {
      console.error('[Cherry Webhook] CHERRY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    const signature = request.headers.get('x-cherry-signature');
    if (!verifyWebhookSignature({
      rawBody,
      signature,
      secret: env.CHERRY_WEBHOOK_SECRET,
      signaturePrefix: 'sha256=',
    })) {
      console.error('[Cherry Webhook] Invalid or missing signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const json = JSON.parse(rawBody) as unknown;
    const parsed = cherryWebhookSchema.safeParse(json);
    if (!parsed.success) {
      console.error('[Cherry Webhook] Invalid payload shape', {
        error: parsed.error.issues,
      });
      return NextResponse.json({ received: true, warning: 'Invalid payload' }, { status: 200 });
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
        return NextResponse.json({ received: true, warning: 'No customer identifier' }, { status: 200 });
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
            filterByFormula: `AND(OR({Status} = 'Sent', {Status} = 'Viewed', {Status} = 'Selected'), {Client Name} = '${sanitizeFormulaValue(customerId)}')`,
            sort: [{ field: FIELDS.treatmentPlans.createdDate, direction: 'desc' }],
          },
          true
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
}
