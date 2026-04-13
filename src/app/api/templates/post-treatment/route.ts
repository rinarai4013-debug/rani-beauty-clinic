import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import {
  getPostTreatmentTemplate,
  getAllPostTreatmentTemplates,
  getAftercareLinkForService,
  getNextRecommendedService,
} from '@/lib/templates/post-treatment';

import { withSentry } from '@/lib/sentry-utils';

const Schema = z.object({
  step: z.string().optional().default('immediate'),
  firstName: z.string().min(1),
  serviceName: z.string().min(1),
  providerName: z.string().min(1),
  appointmentDate: z.string().optional(),
});

const MAX_TEMPLATE_BYTES = 128 * 1024;

async function authorizeTemplateRequest(request: NextRequest): Promise<NextResponse | null> {
  const staffSession = await getSessionFromRequest(request).catch(() => null);
  if (staffSession) return null;

  const expectedSecret = process.env.TEMPLATE_API_SECRET || process.env.N8N_API_KEY;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provided = request.headers.get('x-webhook-secret') || request.headers.get('x-cron-secret');
  if (provided !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  return withSentry('templates/post-treatment', async () => {
    const originError = enforceAllowedPublicOrigin(request);
    if (originError) return originError;

    const sizeError = enforceContentLength(request, MAX_TEMPLATE_BYTES);
    if (sizeError) return sizeError;

    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('templates-post-treatment', ip, RATE_LIMITS.WEBHOOK);
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

    const { step, firstName, serviceName, providerName, appointmentDate } = parsed.data;
    const vars = {
      firstName,
      serviceName,
      providerName,
      appointmentDate: appointmentDate ?? '',
      aftercareLink: getAftercareLinkForService(serviceName),
      nextRecommendedService: getNextRecommendedService(serviceName),
    };

    if (step === 'all') {
      return NextResponse.json({ templates: getAllPostTreatmentTemplates(vars) });
    }

    const template = getPostTreatmentTemplate(step, vars);
    if (!template) {
      return NextResponse.json({ error: 'Unknown step' }, { status: 400 });
    }

    return NextResponse.json(template);
  });
}
