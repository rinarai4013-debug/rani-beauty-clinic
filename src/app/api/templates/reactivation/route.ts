import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getSessionFromRequest } from '@/lib/auth/session';
import {
  getReactivationTemplate,
  getAutoReactivationTemplate,
  type ReactivationTier,
} from '@/lib/templates/reactivation';

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
  firstName: z.string().min(1),
  lastService: z.string().optional().default('consultation'),
  daysSinceLastVisit: z.number().optional().default(30),
  tier: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withSentry('templates/reactivation', async () => {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('templates-reactivation', ip, RATE_LIMITS.WEBHOOK);
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

    const vars = {
      firstName: parsed.data.firstName,
      lastService: parsed.data.lastService,
      daysSinceLastVisit: parsed.data.daysSinceLastVisit,
      ltv: 0,
    };

    if (parsed.data.tier) {
      const tier = parsed.data.tier as ReactivationTier;
      return NextResponse.json({
        tier,
        ...getReactivationTemplate(tier, vars),
      });
    }

    return NextResponse.json(getAutoReactivationTemplate(vars));
  });
}
