import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

const RecommendSchema = z.object({
  primaryGoal: z.string().min(1),
  experience: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
});

const STATIC_RECOMMENDATION = {
  good: {
    title: 'Essential Glow',
    services: [{ name: 'HydraFacial', price: '$275', why: 'A strong first step for visible glow.' }],
    totalEstimate: '$275',
    timeline: '1 week',
  },
  better: {
    title: 'Skin Reset',
    services: [{ name: 'HydraFacial', price: '$275', why: 'Build momentum with a treatment series.' }],
    totalEstimate: '$770',
    timeline: '4 weeks',
  },
  best: {
    title: 'Transformation Plan',
    services: [{ name: 'Sofwave', price: '$2,750', why: 'Higher-impact option for structural results.' }],
    totalEstimate: '$3,500',
    timeline: '8 weeks',
  },
  personalNote: 'We can tailor this plan based on your goals, comfort, and timing.',
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('ai-recommend', ip, RATE_LIMITS.AI);
  if (!allowed) {
    return rateLimitResponse(resetIn);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RecommendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      recommendation: STATIC_RECOMMENDATION,
      source: 'static',
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 700,
      system: 'Return valid JSON with good, better, best, and personalNote fields for a medspa treatment recommendation.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify(parsed.data),
        },
      ],
    });

    const raw = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    const recommendation = JSON.parse(raw);

    return NextResponse.json({
      recommendation,
      source: 'ai',
    });
  } catch (error) {
    console.error('[ai/recommend]', error);
    return NextResponse.json({
      recommendation: STATIC_RECOMMENDATION,
      source: 'static',
    });
  }
}
