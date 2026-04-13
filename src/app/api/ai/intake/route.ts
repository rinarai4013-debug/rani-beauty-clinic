import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { logEvent } from '@/lib/logging/structured-logger';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';

const IntakeSchema = z.object({
  intakeData: z.record(z.string(), z.unknown()),
});

const MAX_AI_REQUEST_BYTES = 256 * 1024;

const FALLBACK_INTELLIGENCE = {
  summary: 'New client inquiry captured. Review goals and recommend the best starter treatment.',
  riskFlags: [],
  clientTier: 'mid-value',
  recommendedPackage: {
    name: 'Glow Package',
    services: ['HydraFacial'],
    estimatedValue: '$275',
    timeline: '2-4 weeks',
  },
  consultScript: ['Welcome them warmly', 'Clarify their goals', 'Recommend an achievable first step'],
  upsellOpportunities: ['Membership'],
  urgency: 'medium',
  suggestedNextStep: 'Schedule a consultation this week',
};

export async function POST(req: NextRequest) {
  return withSentry('ai/intake', async () => {
    const originError = enforceAllowedPublicOrigin(req);
    if (originError) return originError;

    const sizeError = enforceContentLength(req, MAX_AI_REQUEST_BYTES);
    if (sizeError) return sizeError;

    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('ai-intake', ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_leads')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = IntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 700,
        system: 'Return valid JSON with intake intelligence for a medspa consultation.',
        messages: [
          {
            role: 'user',
            content: JSON.stringify(parsed.data.intakeData),
          },
        ],
      });

      const raw = response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();

      return NextResponse.json({
        intelligence: JSON.parse(raw),
        source: 'ai',
      });
    } catch (error) {
      logEvent('ai', 'error', '[ai/intake] request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({
        intelligence: FALLBACK_INTELLIGENCE,
        source: 'fallback',
      });
    }
  });
}
