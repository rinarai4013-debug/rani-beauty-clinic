import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are the AI concierge for Rani Beauty Clinic, a luxury physician-supervised medspa in Renton, WA.

LOCATION: 401 Olympia Ave NE #101, Renton, WA 98056
PHONE: (425) 555-RANI
WEBSITE: ranibeautyclinic.com
HOURS: Mon-Fri 9AM-6PM, Sat 9AM-4PM, Sun Closed

SERVICES & PRICING:
- Sofwave ($2,750–$4,500) — Non-invasive ultrasound skin tightening
- HydraFacial ($275) — Signature cleansing + hydration facial
- PRX-T33 ($495) — Biorevitalization, no needles
- VI Peel ($395) — Medical-grade chemical peel
- PicoWay ($350–$600) — Laser pigment/tattoo removal
- RF Microneedling ($495–$850) — Skin renewal + tightening
- Laser Hair Removal (packages from $800) — All skin types
- Botox/Fillers — Injectable specialist
- Wellness Injections: Vitamin D3 $50, Tri-Immune $75, Glutathione $100, B12 $35, NAD+ $150-500
- GLP-1 Weight Loss ($399–$599/mo) — Physician-supervised
- Rx Skincare: Tretinoin ($99/mo)
- Folix Hair Restoration

BRAND VOICE:
- Luxury, confident, clinically-assured
- Educational + aspirational (never discount-first)
- Focus on "transformation journey" not "treatment list"
- CRITICAL: We do IM INJECTIONS only. NEVER say "infusion." Always say "injection."

RULES:
- Keep responses under 150 words
- Be warm, professional, and knowledgeable
- If asked about medical advice, recommend a consultation
- Always end with a soft CTA (book consultation, visit website, call us)
- If the person shares their name/email/phone, acknowledge it warmly
- Never make up information about the clinic
- For complex questions, suggest booking a free consultation`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, visitorInfo } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "Thank you for your interest in Rani Beauty Clinic! I'm currently offline, but our team would love to help you. Please call us at (425) 555-RANI or book a consultation at ranibeautyclinic.com.",
        source: 'fallback',
      });
    }

    const client = new Anthropic({ apiKey });

    const contextNote = visitorInfo
      ? `\n\nVISITOR CONTEXT: ${visitorInfo.name ? `Name: ${visitorInfo.name}` : ''} ${visitorInfo.email ? `Email: ${visitorInfo.email}` : ''} ${visitorInfo.page ? `Currently viewing: ${visitorInfo.page}` : ''}`
      : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT + contextNote,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    // Check if visitor shared contact info for lead capture
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const emailMatch = lastUserMsg.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    const phoneMatch = lastUserMsg.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    const leadInfo = (emailMatch || phoneMatch) ? {
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
      captured: true,
    } : null;

    return NextResponse.json({ reply, leadInfo, source: 'ai' });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({
      reply: "I apologize, I'm having a moment! Please reach out to us directly at ranibeautyclinic.com or call (425) 555-RANI. We'd love to help you.",
      source: 'error',
    });
  }
}
