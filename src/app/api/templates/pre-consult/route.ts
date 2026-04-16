import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getPreConsultTemplate, getAllPreConsultTemplates } from '@/lib/templates/pre-consult';

import { withSentry } from '@/lib/sentry-utils';

async function authorizeTemplateRequest(request: NextRequest): Promise<NextResponse | null> {
  const staffSession = await getSessionFromRequest(request).catch(() => null);
  if (staffSession) return null;
  const expectedSecret = process.env.TEMPLATE_API_SECRET || process.env.N8N_API_KEY;
  if (!expectedSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const provided = request.headers.get('x-webhook-secret') || request.headers.get('x-cron-secret');
  if (provided !== expectedSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

const Schema = z.object({
  step: z.string().optional().default('booking-confirmation'),
  firstName: z.string().min(1),
  serviceName: z.string().min(1),
  providerName: z.string().min(1),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  duration: z.number().optional(),
  isNewClient: z.boolean().optional(),
  depositAmount: z.number().optional(),
});

export async function POST(request: NextRequest) {
  return withSentry('templates/pre-consult', async () => {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('templates-pre-consult', ip, RATE_LIMITS.WEBHOOK);
    if (!allowed) return rateLimitResponse(resetIn);

    const unauthorized = await authorizeTemplateRequest(request);
    if (unauthorized) return unauthorized;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (parsed.data.step === 'all') {
      return NextResponse.json({
        templates: getAllPreConsultTemplates({
          ...parsed.data,
          serviceCategory: 'consult',
          appointmentDate: parsed.data.appointmentDate ?? '',
          appointmentTime: parsed.data.appointmentTime ?? '',
          duration: parsed.data.duration ?? 60,
          isNewClient: parsed.data.isNewClient ?? true,
          depositPaid: false,
        }),
      });
    }

    const template = getPreConsultTemplate(parsed.data.step, {
      ...parsed.data,
      serviceCategory: 'consult',
      appointmentDate: parsed.data.appointmentDate ?? '',
      appointmentTime: parsed.data.appointmentTime ?? '',
      duration: parsed.data.duration ?? 60,
      isNewClient: parsed.data.isNewClient ?? true,
      depositPaid: false,
    });
    if (!template) {
      return NextResponse.json({ error: 'Unknown step' }, { status: 400 });
    }

    return NextResponse.json(template);
  });
}
