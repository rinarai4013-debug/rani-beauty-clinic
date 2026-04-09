import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import {
  getPostTreatmentTemplate,
  getAllPostTreatmentTemplates,
  getAftercareLinkForService,
  getNextRecommendedService,
} from '@/lib/templates/post-treatment';

const Schema = z.object({
  step: z.string().optional().default('immediate'),
  firstName: z.string().min(1),
  serviceName: z.string().min(1),
  providerName: z.string().min(1),
  appointmentDate: z.string().optional(),
});

function authorizeWebhook(request: NextRequest): NextResponse | null {
  if (!process.env.N8N_API_KEY) return null;
  const provided = request.headers.get('x-webhook-secret');
  if (provided !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('templates-post-treatment', ip, RATE_LIMITS.WEBHOOK);
  if (!allowed) return rateLimitResponse(resetIn);

  const unauthorized = authorizeWebhook(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
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
}
