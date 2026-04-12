import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { buildRAGContext } from '@/lib/rag/knowledge-base';
import { RANI_SYSTEM_PROMPT } from '@/lib/voice/rani-voice';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { withSentry } from '@/lib/sentry-utils';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  content: z.string().min(1),
});

const ChatSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  visitorInfo: z.record(z.string(), z.unknown()).optional(),
});

function extractLeadInfo(text: string): { email?: string; phone?: string } | undefined {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0];

  if (!email && !phone) return undefined;
  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

function buildFallbackReply(message: string): string {
  if (/hydrafacial/i.test(message)) {
    return 'HydraFacial is one of our signature treatments and starts at $275. We can help you choose the right next step for your skin goals.';
  }

  if (/book|appointment|consult/i.test(message)) {
    return 'We would love to help you book. Tell us what treatment or result you are after and we can guide you to the best next step.';
  }

  return 'Thanks for reaching out to Rani Beauty Clinic. Share your goals and we can recommend the best next step for you.';
}

export async function POST(req: NextRequest) {
  return withSentry('ai/chat', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('ai', ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { messages } = parsed.data;
    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    const leadInfo = extractLeadInfo(messages.map((message) => message.content).join(' '));

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        reply: buildFallbackReply(latestUserMessage),
        source: 'fallback',
        actions: [],
        ...(leadInfo ? { leadInfo } : {}),
      });
    }

    try {
      const rag = buildRAGContext(latestUserMessage);
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 400,
        system: `${RANI_SYSTEM_PROMPT}\n\nKnowledge:\n${rag.contextText}`,
        messages: messages.map((message) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
      });

      const replyText = response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();

      const actions = replyText.includes('[BOOK_NOW]')
        ? [{ type: 'book_now', label: 'Book now' }]
        : [];

      return NextResponse.json({
        reply: replyText.replace(/\[BOOK_NOW\]/g, '').trim(),
        source: 'ai',
        actions,
        ...(leadInfo ? { leadInfo } : {}),
      });
    } catch (error) {
      console.error('[ai/chat]', error);
      return NextResponse.json(
        {
          reply: buildFallbackReply(latestUserMessage),
          source: 'fallback',
          actions: [],
          ...(leadInfo ? { leadInfo } : {}),
        },
        { status: 200 }
      );
    }

  });
}
