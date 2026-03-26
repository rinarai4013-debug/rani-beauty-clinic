import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import Anthropic from '@anthropic-ai/sdk';
import { buildRAGContext } from '@/lib/rag/knowledge-base';
import { logEvent } from '@/lib/logging/structured-logger';
import { RANI_SYSTEM_PROMPT } from '@/lib/voice/rani-voice';
import { captureAgentExecution } from '@/lib/sentry-utils';

// Simple rate limiter: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = RANI_SYSTEM_PROMPT;

interface ChatAction {
  type: 'book_now';
  label: string;
  url: string;
}

function extractActions(reply: string): { cleanReply: string; actions: ChatAction[] } {
  const actions: ChatAction[] = [];
  let cleanReply = reply;

  if (cleanReply.includes('[BOOK_NOW]')) {
    actions.push({
      type: 'book_now',
      label: 'Book a Consultation',
      url: 'https://ranibeautyclinic.com/#booking',
    });
    cleanReply = cleanReply.replace(/\s*\[BOOK_NOW\]\s*/g, ' ').trim();
  }

  return { cleanReply, actions };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    logEvent('ai', 'warn', 'Chat rate limit hit', { ip });
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { messages, visitorInfo } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "Thank you for your interest in Rani Beauty Clinic! I'm currently offline, but our team would love to help you. Please call us at (425) 539-4440 or book a consultation at ranibeautyclinic.com.",
        actions: [{ type: 'book_now', label: 'Book Now', url: 'https://ranibeautyclinic.com/#booking' }],
        source: 'fallback',
      });
    }

    // Query RAG knowledge base with the latest user message
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    let ragContext = '';

    try {
      const rag = buildRAGContext(lastUserMsg, { maxContextLength: 2000 });
      if (rag.confidence > 20 && rag.contextText.length > 0) {
        ragContext = `\n\nKNOWLEDGE BASE CONTEXT (use this to inform your answer):\n${rag.contextText}`;
      }
    } catch {
      // RAG lookup failed - continue without it
    }

    const client = new Anthropic({ apiKey });

    const contextNote = visitorInfo
      ? `\n\nVISITOR CONTEXT: ${visitorInfo.name ? `Name: ${visitorInfo.name}` : ''} ${visitorInfo.email ? `Email: ${visitorInfo.email}` : ''} ${visitorInfo.page ? `Currently viewing: ${visitorInfo.page}` : ''}`
      : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT + ragContext + contextNote,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const rawReply = response.content[0].type === 'text' ? response.content[0].text : '';
    const { cleanReply, actions } = extractActions(rawReply);

    // Check if visitor shared contact info for lead capture
    const emailMatch = lastUserMsg.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    const phoneMatch = lastUserMsg.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    const leadInfo = (emailMatch || phoneMatch) ? {
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
      captured: true,
    } : null;

    return NextResponse.json({ reply: cleanReply, actions, leadInfo, source: 'ai' });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'ai-chat' } });
    console.error('AI chat error:', error);
    return NextResponse.json({
      reply: "I apologize, I'm having a moment! Please reach out to us directly at ranibeautyclinic.com or call (425) 539-4440. We'd love to help you.",
      actions: [{ type: 'book_now', label: 'Book Now', url: 'https://ranibeautyclinic.com/#booking' }],
      source: 'error',
    });
  }
}
