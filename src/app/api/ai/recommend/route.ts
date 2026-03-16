import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SERVICES = [
  { name: 'Sofwave', category: 'Skin Tightening', price: '$2,750–$4,500', description: 'Non-invasive ultrasound skin tightening for face and body. FDA-cleared. No downtime.' },
  { name: 'HydraFacial', category: 'Facial', price: '$275', description: 'Signature cleansing, extraction, and hydration facial. Immediate glow.' },
  { name: 'PRX-T33', category: 'Biorevitalization', price: '$495', description: 'No-needle biorevitalization for skin renewal. Stimulates collagen without peeling.' },
  { name: 'VI Peel', category: 'Chemical Peel', price: '$395', description: 'Medical-grade chemical peel for pigmentation, acne, and anti-aging.' },
  { name: 'PicoWay', category: 'Laser', price: '$350–$600', description: 'Advanced laser for pigment removal, tattoo removal, and skin revitalization.' },
  { name: 'RF Microneedling', category: 'Skin Renewal', price: '$495–$850', description: 'Radiofrequency microneedling for scars, pores, and skin tightening.' },
  { name: 'Laser Hair Removal', category: 'Laser', price: 'Packages from $800', description: 'Permanent hair reduction for all skin types.' },
  { name: 'Botox', category: 'Injectable', price: 'Varies', description: 'Neurotoxin for wrinkle prevention and smoothing. Quick, minimal downtime.' },
  { name: 'Dermal Fillers', category: 'Injectable', price: 'Varies', description: 'Hyaluronic acid fillers for volume restoration and contouring.' },
  { name: 'Vitamin D3 Injection', category: 'Wellness', price: '$50', description: 'IM injection for vitamin D optimization.' },
  { name: 'Tri-Immune Injection', category: 'Wellness', price: '$75', description: 'Glutathione + Vitamin C + Zinc IM injection for immune support.' },
  { name: 'Glutathione Injection', category: 'Wellness', price: '$100', description: 'Master antioxidant IM injection for skin brightening and detox.' },
  { name: 'B12 Injection', category: 'Wellness', price: '$35', description: 'Energy-boosting IM injection.' },
  { name: 'NAD+ Injection', category: 'Wellness', price: '$150–$500', description: 'Anti-aging IM injection for cellular repair and energy.' },
  { name: 'GLP-1 Weight Loss', category: 'Weight Management', price: '$399–$599/mo', description: 'Physician-supervised GLP-1 weight management program.' },
  { name: 'Tretinoin Rx Skincare', category: 'Skincare', price: '$99/mo', description: 'Prescription-strength retinoid for anti-aging and acne.' },
  { name: 'Folix Hair Restoration', category: 'Hair', price: 'Varies', description: 'Advanced hair restoration treatment.' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryGoal, experience, timeline, budget } = body;

    if (!primaryGoal) {
      return NextResponse.json({ error: 'Primary goal is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        recommendation: getStaticRecommendation(primaryGoal, experience, timeline),
        source: 'static',
      });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are the AI treatment advisor for Rani Beauty Clinic, a luxury medical aesthetics clinic in Renton, WA. Based on the client's quiz answers, recommend a personalized 3-tier treatment plan (Good, Better, Best).

CLIENT QUIZ ANSWERS:
- Primary Goal: ${primaryGoal}
- Experience Level: ${experience || 'Not specified'}
- Timeline: ${timeline || 'Not specified'}
- Budget Preference: ${budget || 'Not specified'}

AVAILABLE SERVICES:
${SERVICES.map(s => `- ${s.name} (${s.category}): ${s.price} — ${s.description}`).join('\n')}

IMPORTANT RULES:
- Rani does IM INJECTIONS only. NEVER say "infusion." Always say "injection."
- Be warm, confident, and clinically-assured
- Focus on transformation journey, not treatment list

Respond ONLY with valid JSON in this exact format:
{
  "good": {
    "title": "Essential Glow",
    "services": [{"name": "...", "price": "...", "why": "one sentence"}],
    "totalEstimate": "$XXX",
    "timeline": "X weeks"
  },
  "better": {
    "title": "Complete Transformation",
    "services": [{"name": "...", "price": "...", "why": "one sentence"}],
    "totalEstimate": "$X,XXX",
    "timeline": "X weeks"
  },
  "best": {
    "title": "Ultimate Experience",
    "services": [{"name": "...", "price": "...", "why": "one sentence"}],
    "totalEstimate": "$X,XXX",
    "timeline": "X weeks"
  },
  "personalNote": "2-3 sentence personalized message about their transformation journey"
}`
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        recommendation: getStaticRecommendation(primaryGoal, experience, timeline),
        source: 'static',
      });
    }

    const recommendation = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recommendation, source: 'ai' });
  } catch (error) {
    console.error('AI recommend error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}

function getStaticRecommendation(goal: string, experience: string, timeline: string) {
  const plans: Record<string, { good: string[]; better: string[]; best: string[] }> = {
    'glowing-skin': {
      good: ['HydraFacial'],
      better: ['HydraFacial', 'PRX-T33'],
      best: ['HydraFacial', 'PRX-T33', 'Tretinoin Rx Skincare'],
    },
    'anti-aging': {
      good: ['Botox', 'HydraFacial'],
      better: ['Botox', 'RF Microneedling', 'VI Peel'],
      best: ['Botox', 'Sofwave', 'RF Microneedling', 'Tretinoin Rx Skincare'],
    },
    'body-contouring': {
      good: ['Laser Hair Removal'],
      better: ['Laser Hair Removal', 'GLP-1 Weight Loss'],
      best: ['Laser Hair Removal', 'GLP-1 Weight Loss', 'Sofwave'],
    },
    'health-wellness': {
      good: ['B12 Injection', 'Vitamin D3 Injection'],
      better: ['Tri-Immune Injection', 'Glutathione Injection', 'B12 Injection'],
      best: ['NAD+ Injection', 'Glutathione Injection', 'GLP-1 Weight Loss'],
    },
  };

  const plan = plans[goal] || plans['glowing-skin'];
  const mapServices = (names: string[]) =>
    names.map(n => {
      const s = SERVICES.find(svc => svc.name === n);
      return { name: n, price: s?.price || 'Varies', why: s?.description || '' };
    });

  return {
    good: { title: 'Essential Glow', services: mapServices(plan.good), totalEstimate: 'From $275', timeline: '1–2 weeks' },
    better: { title: 'Complete Transformation', services: mapServices(plan.better), totalEstimate: 'From $770', timeline: '4–6 weeks' },
    best: { title: 'Ultimate Experience', services: mapServices(plan.best), totalEstimate: 'From $3,500', timeline: '8–12 weeks' },
    personalNote: 'Your skin journey is unique, and we\'re here to guide you every step of the way. Book a complimentary consultation to create your personalized plan with our expert team.',
  };
}
