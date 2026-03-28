import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { intakeData } = body;

    if (!intakeData) {
      return NextResponse.json({ error: 'Intake data is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an intake intelligence analyst for Rani Beauty Clinic, a luxury physician-supervised medspa.

Analyze this client intake and provide actionable intelligence for the provider.

INTAKE DATA:
${JSON.stringify(intakeData, null, 2)}

AVAILABLE SERVICES:
- Sofwave ($2,750-$4,500) - skin tightening
- HydraFacial ($275) - signature facial
- PRX-T33 ($495) - biorevitalization
- VI Peel ($395) - chemical peel
- PicoWay ($350-$600) - laser pigment removal
- RF Microneedling ($495-$850) - skin renewal
- Laser Hair Removal (from $800)
- Botox/Fillers - injectables
- Wellness Injections: D3 $50, Tri-Immune $75, Glutathione $100, B12 $35, NAD+ $150-500
- GLP-1 Weight Loss ($399-$599/mo)
- Tretinoin Rx ($99/mo)
- Folix Hair Restoration

IMPORTANT: We do IM INJECTIONS only. Never say "infusion."

Respond with valid JSON:
{
  "summary": "2-3 sentence overview of client profile and needs",
  "riskFlags": ["list of any concerns or contraindications to flag"],
  "clientTier": "high-value | mid-value | entry-level",
  "recommendedPackage": {
    "name": "Custom package name",
    "services": ["service1", "service2"],
    "estimatedValue": "$X,XXX",
    "timeline": "X weeks/months"
  },
  "consultScript": [
    "Key talking point 1",
    "Key talking point 2",
    "Key talking point 3"
  ],
  "upsellOpportunities": ["opportunity1", "opportunity2"],
  "urgency": "high | medium | low",
  "suggestedNextStep": "What to do next"
}`
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const intelligence = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ intelligence, source: 'ai' });
  } catch (error) {
    console.error('AI intake error:', error);
    return NextResponse.json({ error: 'Failed to analyze intake' }, { status: 500 });
  }
}
