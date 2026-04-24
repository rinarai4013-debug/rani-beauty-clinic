import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


// Tier 1 zod (2026-04-11): the copilot engine declares a ConsultInput
// interface. Lock the POST body to that shape so random payloads
// don't crash the AI generator at runtime. Fields are intentionally
// permissive (strings + optionals) because consult data is soft —
// the engine tolerates missing fields — but types are enforced.
const ClientProfileSchema = z.object({
  name: z.string().min(1).max(200),
  age: z.number().int().positive().max(120).optional(),
  gender: z.enum(['female', 'male', 'other']).optional(),
  skinType: z.string().max(80).optional(),
  previousServices: z.array(z.string().max(200)).max(200).default([]),
  totalSpend: z.number().nonnegative().default(0),
  visitCount: z.number().int().nonnegative().default(0),
  lastVisit: z.string().max(40).optional(),
  membershipStatus: z.enum(['none', 'active', 'cancelled']).default('none'),
  churnRisk: z.number().min(0).max(100).optional(),
  notes: z.string().max(4000).optional(),
});

const ConsultInputSchema = z.object({
  client: ClientProfileSchema,
  concerns: z.array(z.string().max(200)).max(50),
  consultType: z.enum(['new_client', 'existing_client', 'follow_up', 'upsell']),
  interestedServices: z.array(z.string().max(200)).max(50).optional(),
  budget: z.enum(['budget', 'moderate', 'premium', 'unknown']).optional(),
  timeAvailable: z.number().int().positive().max(240),
});

async function getConsultGenerator() {
  const consultEngine = await import('@/lib/consult/copilot-engine');
  return (
    ('generateConsultBriefing' in consultEngine && typeof consultEngine.generateConsultBriefing === 'function'
      ? consultEngine.generateConsultBriefing
      : consultEngine.generateConsultCopilot) as (input: unknown) => unknown
  );
}

export async function GET() {
  return withSentry('dashboard/consult:get', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = 'dashboard-consult';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const generator = await getConsultGenerator();
      const consult = generator({
        client: {
          name: 'Sample Client',
          previousServices: [],
          totalSpend: 0,
          visitCount: 0,
          membershipStatus: 'none',
        },
        concerns: ['glow'],
        consultType: 'new_client',
        timeAvailable: 30,
      });
      const payload = { status: 'ok', consult };
      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[dashboard/consult][GET]', error);
      return NextResponse.json({ error: 'Failed to load consult intelligence' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withSentry('dashboard/consult:post', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }

    const parsed = ConsultInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid consult request body', details: parsed.error.issues },
        { status: 422 },
      );
    }

    try {
      const generator = await getConsultGenerator();
      const briefing = generator(parsed.data);
      return NextResponse.json({ status: 'ok', briefing });
    } catch (error) {
      console.error('[dashboard/consult][POST]', error);
      return NextResponse.json({ error: 'Failed to generate consult briefing' }, { status: 500 });
    }
  });
}
