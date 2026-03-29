/**
 * Ads War Machine - Meta Creative Factory
 *
 * Auto-generates Meta (Facebook/Instagram) ad creatives at scale.
 * Produces ad formats, hook/body/CTA copy, audience-specific variants,
 * SVG-based visual templates, A/B test variants, creative fatigue
 * detection, and auto-refresh scheduling.
 *
 * Brand voice: Luxury, confident, clinically-assured.
 * CRITICAL: Always "injection" - never "infusion."
 */

import { BRAND, AD_SIZES, type AdSize, RANI_SERVICES, type ServiceProfile } from './creative-engine';
import {
  HEADLINES,
  DESCRIPTIONS,
  CTAS,
  SOCIAL_PROOF,
  URGENCY_ELEMENTS,
  TRUST_SIGNALS,
  SEASONAL_COPY,
  getSeasonalCopyForMonth,
  getHolidayCopyForMonth,
  type CTAAsset,
} from '@/data/ads/creative-library';

// ── TYPES ──

export type MetaAdFormat =
  | 'single_image'
  | 'carousel'
  | 'video_script'
  | 'story'
  | 'collection'
  | 'reels'
  | 'instant_experience'
  | 'dynamic_product'
  | 'slideshow'
  | 'lead_form';

export type AudienceSegment =
  | 'women_25_45'
  | 'women_45_65'
  | 'men_30_55'
  | 'pnw_locals'
  | 'new_clients'
  | 'retargeting';

export type SingleImageTemplate =
  | 'hero_benefit'
  | 'testimonial_card'
  | 'stat_spotlight'
  | 'service_menu'
  | 'urgency_offer';

export interface MetaCreative {
  id: string;
  format: MetaAdFormat;
  serviceId: string;
  serviceName: string;
  audienceSegment: AudienceSegment;
  hook: string;
  body: string;
  cta: string;
  headline: string;
  description: string;
  visualTemplate?: SingleImageTemplate;
  svgTemplate?: string;
  carouselCards?: CarouselCard[];
  videoScript?: VideoScript;
  storySlides?: StorySlide[];
  collectionItems?: CollectionItem[];
  abTestGroup: string;
  createdAt: string;
  status: 'draft' | 'active' | 'paused' | 'fatigued';
  performanceMetrics?: CreativePerformanceMetrics;
}

export interface CarouselCard {
  position: number;
  headline: string;
  description: string;
  cta: string;
  visualDescription: string;
  landingUrl: string;
}

export interface VideoScript {
  duration: number; // seconds
  hook: { text: string; timing: string };
  segments: VideoSegment[];
  endCard: { text: string; cta: string };
  voiceoverNotes: string;
  musicNote: string;
}

export interface VideoSegment {
  timing: string;
  visual: string;
  text: string;
  voiceover: string;
}

export interface StorySlide {
  position: number;
  type: 'hook' | 'content' | 'proof' | 'cta';
  text: string;
  backgroundNote: string;
  ctaButton?: string;
  stickerNote?: string;
}

export interface CollectionItem {
  title: string;
  description: string;
  price: string;
  landingUrl: string;
}

export interface CreativePerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  conversions: number;
  spent: number;
  cpa: number;
  roas: number;
  frequency: number;
  relevanceScore: number;
  daysRunning: number;
}

export interface CreativeFatigueResult {
  creativeId: string;
  isFatigued: boolean;
  fatigueScore: number; // 0-100
  signals: FatigueSignal[];
  recommendation: string;
  suggestedAction: 'refresh' | 'pause' | 'replace' | 'monitor';
  daysUntilFatigue?: number;
}

export interface FatigueSignal {
  signal: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  threshold: number;
}

export interface ABTestPlan {
  testName: string;
  hypothesis: string;
  controlVariant: MetaCreative;
  testVariants: MetaCreative[];
  metric: string;
  minSampleSize: number;
  estimatedDuration: string;
}

export interface CreativeRefreshSchedule {
  creativeId: string;
  currentAge: number; // days
  maxAge: number;
  refreshDate: string;
  newVariantQueued: boolean;
  priority: 'urgent' | 'scheduled' | 'monitoring';
}

// ── HOOK LIBRARY (50 hooks by service) ──

const HOOK_LIBRARY: Record<string, string[]> = {
  glp1: [
    'Finally, weight loss that works with your body',
    'What if losing weight didn\'t mean losing yourself?',
    'The weight loss program your doctor would actually recommend',
    'Stop dieting. Start a real weight loss program.',
    'I lost 30 lbs without a crash diet. Here\'s how.',
    'Medical weight loss is not what you think it is',
    'GLP-1 changed everything for me. Let me explain.',
    'Your metabolism is not broken. It just needs the right support.',
    'The science behind the most effective weight loss treatment right now',
    'What nobody tells you about medical weight loss',
  ],
  peptides: [
    'Your cells are asking for help',
    'Peptide therapy is the wellness secret you haven\'t tried yet',
    'What if your body could heal faster than you think?',
    'The anti-aging treatment that works from the inside out',
    'Elite athletes use peptides. Now you can too.',
    'Recovery time just got a whole lot shorter',
    'Your body already knows how to heal. Peptides help it remember.',
    'The longevity treatment that is actually backed by science',
  ],
  aesthetics: [
    'The treatment everyone is whispering about',
    'I got Botox and nobody could tell. That is the point.',
    'What does your skin say about you?',
    'Looking younger doesn\'t mean looking different',
    'The 15-minute treatment that changed my morning routine',
    'My dermatologist said this would happen. She was right.',
    'This is what "natural results" actually looks like',
    'I stopped using filters after this treatment',
  ],
  wellness: [
    'One injection, one week of energy',
    'Your immunity called. It needs backup.',
    'The afternoon slump ends today',
    'What one injection can do for your entire week',
    'PNW winter? Your immune system needs this.',
    'The difference between surviving and thriving',
    'Exhausted? Your body might be missing this.',
    'Wellness is not a luxury. It is a priority.',
  ],
  sofwave: [
    'A facelift without the scalpel exists',
    'What if you could tighten your skin without surgery?',
    'My jawline came back. No, I didn\'t have surgery.',
    'The non-surgical treatment dermatologists recommend most',
    'One session. Visible lift. Zero downtime.',
    'I skipped the facelift and did this instead',
  ],
  hydrafacial: [
    'Your skin after a HydraFacial is something else',
    'The facial that actually does what it promises',
    'I got a HydraFacial on my lunch break and went back to work glowing',
    'There\'s a reason this is the most popular facial in America',
    'This is not your typical facial',
    'Glass skin in 60 minutes. Not kidding.',
  ],
  laser_hair: [
    'I haven\'t shaved in 6 months and my skin is smoother than ever',
    'The math on laser hair removal vs. razors will surprise you',
    'Imagine never worrying about body hair again',
    'Summer is coming. Are you ready?',
  ],
};

// ── BODY COPY LIBRARY (30 variants by service) ──

const BODY_COPY_LIBRARY: Record<string, string[]> = {
  glp1: [
    'Our physician-supervised GLP-1 program pairs weekly injections with personalized monitoring. Real results, real support, starting at $399/month.',
    'Unlike fad diets, GLP-1 works with your body\'s natural hunger signals. Physician-supervised, compassionate care at Rani Beauty Clinic in Renton.',
    'Join hundreds of clients who chose medical weight loss over another diet. Weekly check-ins, body composition tracking, and a physician who actually listens.',
    'Semaglutide and tirzepatide programs tailored to your body. No one-size-fits-all. Just results. Book your consultation today.',
    'The weight loss journey that respects your timeline. Our GLP-1 program delivers visible, sustainable results with physician-supervised care every step of the way.',
  ],
  aesthetics: [
    'Expert Botox and filler injections that look like you, just refreshed. Physician-supervised care at Rani Beauty Clinic in Renton, WA.',
    'Whether you are preventing or correcting, our injection specialists create results so natural, people will think you just slept really well.',
    'At Rani Beauty Clinic, every injectable treatment is physician-supervised and personalized. No cookie-cutter approach. Book your consultation.',
    'From fine lines to volume loss, our injectable experts have a plan. Natural results, zero downtime, and walk-ins welcome for Botox.',
    'Preventative Botox in your 20s and 30s is one of the smartest investments in your appearance. Start today with our expert team.',
  ],
  wellness: [
    'B12 for energy. Glutathione for glow. Tri-Immune for protection. NAD+ for cellular repair. Quick IM injections, walk-ins welcome.',
    'Stop running on empty. Our wellness injection menu gives your body the nutrients it needs, delivered directly for maximum absorption.',
    'PNW weather draining your energy? Our immune-boosting and energy-restoring injections keep you going strong. In and out in 15 minutes.',
    'Whether you need an energy boost, immune support, or cellular repair, our wellness injection menu has you covered. Physician-supervised.',
    'Quick, effective, physician-supervised wellness injections starting at $35. No appointment needed for most injections.',
  ],
  sofwave: [
    'Sofwave uses FDA-cleared SUPERB ultrasound to lift and tighten skin in one session. No surgery, no needles, no downtime. Just visible results.',
    'Gravity is undefeated, but Sofwave comes close. Tighten sagging skin on your face, neck, and brow in a single appointment.',
    'The non-surgical facelift alternative that Renton clients are choosing over the scalpel. One session, visible lift, zero recovery.',
  ],
  hydrafacial: [
    'Deep cleanse, exfoliate, extract, and hydrate in one 60-minute session. The HydraFacial at Rani Beauty Clinic delivers skin that glows for days.',
    'Your skin deserves more than a regular facial. Our signature HydraFacial removes impurities and delivers antioxidants for that "just got back from vacation" look.',
    'The most-requested facial in our clinic for a reason. HydraFacial from $249. Walk-ins welcome when available.',
  ],
  peptides: [
    'BPC-157, Sermorelin, and advanced peptide therapy protocols supervised by our physician team. Recovery, anti-aging, and performance, tailored to your goals.',
    'Peptide therapy is not just for athletes. If you want faster recovery, better sleep, and anti-aging benefits, our physician-supervised protocols are designed for you.',
    'NAD+ injection therapy supports cellular repair, mental clarity, and sustained energy. Sessions from $150 at Rani Beauty Clinic.',
  ],
  laser_hair: [
    'Advanced laser hair removal for all skin types. Full body packages starting at $800. Permanent reduction with each session.',
    'Our advanced laser technology works on all skin tones with minimal discomfort. Say goodbye to razors and hello to smooth, permanent results.',
  ],
  vi_peel: [
    'The VI Peel targets hyperpigmentation, acne scarring, and sun damage. Safe for all skin types with visible results in 7 days.',
    'Summer sun damage? The VI Peel reverses it in one treatment. Starting at $395 at Rani Beauty Clinic.',
  ],
};

// ── CTA LIBRARY (15 variants) ──

const CTA_LIBRARY: string[] = [
  'Book Your Consultation',
  'Book Now',
  'Schedule Today',
  'Claim Your Spot',
  'Start Your Journey',
  'Get Started',
  'See Available Times',
  'Learn More',
  'Request a Consultation',
  'See What Is Possible',
  'Take the First Step',
  'Check Eligibility',
  'Talk to a Specialist',
  'Reserve Your Appointment',
  'View Treatment Options',
];

// ── AUDIENCE CONFIGURATIONS ──

const AUDIENCE_CONFIG: Record<AudienceSegment, {
  label: string;
  ageMin: number;
  ageMax: number;
  gender: string;
  tone: string;
  themes: string[];
  hookAngle: string;
}> = {
  women_25_45: {
    label: 'Women 25-45',
    ageMin: 25, ageMax: 45, gender: 'female',
    tone: 'Confident, lifestyle-forward, aspirational',
    themes: ['confidence', 'self-care', 'lifestyle', 'prevention', 'glow'],
    hookAngle: 'Self-investment and confidence building',
  },
  women_45_65: {
    label: 'Women 45-65',
    ageMin: 45, ageMax: 65, gender: 'female',
    tone: 'Empowering, rejuvenation-focused, vitality',
    themes: ['rejuvenation', 'vitality', 'turning back time', 'energy', 'renewal'],
    hookAngle: 'Reclaiming vitality and youthful energy',
  },
  men_30_55: {
    label: 'Men 30-55',
    ageMin: 30, ageMax: 55, gender: 'male',
    tone: 'Performance-driven, direct, results-focused',
    themes: ['performance', 'energy', 'optimization', 'results', 'efficiency'],
    hookAngle: 'Performance optimization and energy recovery',
  },
  pnw_locals: {
    label: 'PNW Locals',
    ageMin: 25, ageMax: 65, gender: 'all',
    tone: 'Local community, weather-aware, outdoor lifestyle',
    themes: ['rainy season wellness', 'PNW lifestyle', 'local community', 'seasonal self-care', 'outdoor recovery'],
    hookAngle: 'Local references and PNW weather/lifestyle',
  },
  new_clients: {
    label: 'New Clients',
    ageMin: 21, ageMax: 65, gender: 'all',
    tone: 'Welcoming, educational, no-pressure',
    themes: ['first time', 'no pressure', 'consultation', 'education', 'getting started'],
    hookAngle: 'Making the first step feel easy and safe',
  },
  retargeting: {
    label: 'Retargeting',
    ageMin: 21, ageMax: 65, gender: 'all',
    tone: 'Reminder-based, urgency, social proof',
    themes: ['come back', 'limited time', 'others are booking', 'don\'t miss out', 'ready when you are'],
    hookAngle: 'Gentle nudge with social proof or scarcity',
  },
};

// ── MAIN FACTORY ──

export function generateCreativeSuite(config: {
  serviceId: string;
  audienceSegments?: AudienceSegment[];
  formats?: MetaAdFormat[];
  variantsPerFormat?: number;
}): MetaCreative[] {
  const { serviceId, audienceSegments = ['women_25_45'], formats = ['single_image'], variantsPerFormat = 3 } = config;
  const creatives: MetaCreative[] = [];

  const service = RANI_SERVICES.find(s => s.id === serviceId);
  const serviceName = service?.name || serviceId;
  const serviceCategory = getServiceCategory(serviceId);

  for (const segment of audienceSegments) {
    for (const format of formats) {
      for (let i = 0; i < variantsPerFormat; i++) {
        const creative = buildCreative(serviceId, serviceName, serviceCategory, segment, format, i);
        creatives.push(creative);
      }
    }
  }

  return creatives;
}

function buildCreative(
  serviceId: string,
  serviceName: string,
  serviceCategory: string,
  segment: AudienceSegment,
  format: MetaAdFormat,
  variantIndex: number,
): MetaCreative {
  const hooks = HOOK_LIBRARY[serviceCategory] || HOOK_LIBRARY['aesthetics'];
  const bodies = BODY_COPY_LIBRARY[serviceCategory] || BODY_COPY_LIBRARY['aesthetics'];
  const hook = hooks[variantIndex % hooks.length];
  const body = bodies[variantIndex % bodies.length];
  const cta = CTA_LIBRARY[variantIndex % CTA_LIBRARY.length];
  const headline = HEADLINES.find(h => h.service === serviceId)?.text || `${serviceName} at Rani Beauty Clinic`;
  const description = DESCRIPTIONS.find(d => d.service === serviceId)?.text || `Book your ${serviceName} treatment at Rani Beauty Clinic in Renton, WA.`;

  const audienceHook = adaptHookForAudience(hook, segment);
  const audienceBody = adaptBodyForAudience(body, segment);

  const id = `creative_${serviceId}_${segment}_${format}_v${variantIndex + 1}`;
  const now = new Date().toISOString();

  const creative: MetaCreative = {
    id,
    format,
    serviceId,
    serviceName,
    audienceSegment: segment,
    hook: audienceHook,
    body: audienceBody,
    cta,
    headline,
    description,
    abTestGroup: `group_${String.fromCharCode(65 + variantIndex)}`, // A, B, C...
    createdAt: now,
    status: 'draft',
  };

  // Format-specific content
  switch (format) {
    case 'single_image':
      creative.visualTemplate = getSingleImageTemplate(variantIndex);
      creative.svgTemplate = generateSVGTemplate(creative);
      break;
    case 'carousel':
      creative.carouselCards = generateCarouselCards(serviceId, serviceName);
      break;
    case 'video_script':
      creative.videoScript = generateVideoScript(serviceId, serviceName, hook, body, cta);
      break;
    case 'story':
      creative.storySlides = generateStorySlides(serviceId, serviceName, hook, cta);
      break;
    case 'collection':
      creative.collectionItems = generateCollectionItems(serviceId);
      break;
  }

  return creative;
}

// ── AUDIENCE ADAPTATION ──

function adaptHookForAudience(hook: string, segment: AudienceSegment): string {
  const config = AUDIENCE_CONFIG[segment];
  if (!config) return hook;

  // Add audience-specific framing
  switch (segment) {
    case 'men_30_55':
      return hook
        .replace('beauty', 'performance')
        .replace('glow', 'results')
        .replace('Looking younger', 'Performing at your best');
    case 'women_45_65':
      return hook.replace('looking different', 'looking refreshed');
    case 'pnw_locals':
      if (!hook.includes('PNW') && !hook.includes('Renton') && !hook.includes('Seattle')) {
        return hook;
      }
      return hook;
    default:
      return hook;
  }
}

function adaptBodyForAudience(body: string, segment: AudienceSegment): string {
  const config = AUDIENCE_CONFIG[segment];
  if (!config) return body;

  switch (segment) {
    case 'men_30_55':
      return body + '\n\nResults-driven care for men who value their time.';
    case 'pnw_locals':
      return body + '\n\nLocated in Renton, serving the greater PNW community.';
    case 'new_clients':
      return body + '\n\nFirst visit? Complimentary consultation, zero pressure.';
    case 'retargeting':
      return body + '\n\nStill thinking about it? Others are booking while you wait.';
    default:
      return body;
  }
}

// ── SINGLE IMAGE TEMPLATES ──

function getSingleImageTemplate(index: number): SingleImageTemplate {
  const templates: SingleImageTemplate[] = ['hero_benefit', 'testimonial_card', 'stat_spotlight', 'service_menu', 'urgency_offer'];
  return templates[index % templates.length];
}

// ── SVG TEMPLATE GENERATOR ──

export function generateSVGTemplate(creative: MetaCreative): string {
  const size = AD_SIZES.feed;
  const { navy, gold, cream, white } = BRAND;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}">
  <defs>
    <linearGradient id="bg_grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${navy};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a2d40;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${size.width}" height="${size.height}" fill="url(#bg_grad)" />
  <!-- Gold accent line -->
  <rect x="80" y="180" width="120" height="3" fill="${gold}" rx="1.5" />
  <!-- Logo area -->
  <text x="540" y="120" fill="${gold}" font-family="Playfair Display, serif" font-size="42" text-anchor="middle" font-weight="700">RANI</text>
  <text x="540" y="155" fill="${cream}" font-family="Montserrat, sans-serif" font-size="14" text-anchor="middle" letter-spacing="4">BEAUTY CLINIC</text>
  <!-- Hook text -->
  <text x="540" y="380" fill="${white}" font-family="Playfair Display, serif" font-size="48" text-anchor="middle" font-weight="600">
    <tspan x="540" dy="0">${escapeXml(creative.hook.split(' ').slice(0, 4).join(' '))}</tspan>
    <tspan x="540" dy="60">${escapeXml(creative.hook.split(' ').slice(4).join(' '))}</tspan>
  </text>
  <!-- Service name -->
  <text x="540" y="540" fill="${gold}" font-family="Montserrat, sans-serif" font-size="22" text-anchor="middle" letter-spacing="2">${escapeXml(creative.serviceName.toUpperCase())}</text>
  <!-- Body snippet -->
  <text x="540" y="620" fill="${cream}" font-family="Montserrat, sans-serif" font-size="18" text-anchor="middle" opacity="0.85">
    <tspan x="540" dy="0">${escapeXml(creative.body.split('.')[0])}.</tspan>
  </text>
  <!-- CTA Button -->
  <rect x="370" y="750" width="340" height="60" rx="30" fill="${gold}" filter="url(#shadow)" />
  <text x="540" y="788" fill="${navy}" font-family="Montserrat, sans-serif" font-size="18" text-anchor="middle" font-weight="700">${escapeXml(creative.cta.toUpperCase())}</text>
  <!-- Location -->
  <text x="540" y="900" fill="${cream}" font-family="Montserrat, sans-serif" font-size="14" text-anchor="middle" opacity="0.6">Renton, WA | ranibeautyclinic.com</text>
  <!-- Compliance disclaimer -->
  <text x="540" y="1040" fill="${cream}" font-family="Montserrat, sans-serif" font-size="11" text-anchor="middle" opacity="0.4">Results may vary. Physician-supervised treatments. See clinic for details.</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── CAROUSEL GENERATOR ──

function generateCarouselCards(serviceId: string, serviceName: string): CarouselCard[] {
  const cards: CarouselCard[] = [
    {
      position: 1,
      headline: `Why ${serviceName}?`,
      description: 'Discover why hundreds of clients trust Rani Beauty Clinic for their treatments.',
      cta: 'Learn More',
      visualDescription: 'Clean, luxury branded image with clinic interior. Navy/gold palette.',
      landingUrl: `https://ranibeautyclinic.com/services/${serviceId.replace('_', '-')}`,
    },
    {
      position: 2,
      headline: 'How It Works',
      description: 'A simple, straightforward process from consultation to visible results.',
      cta: 'See the Process',
      visualDescription: 'Step-by-step process infographic. 3 steps with icons.',
      landingUrl: `https://ranibeautyclinic.com/services/${serviceId.replace('_', '-')}`,
    },
    {
      position: 3,
      headline: 'What Clients Say',
      description: '"The best experience I\'ve had at any medspa. Results speak for themselves."',
      cta: 'Read Reviews',
      visualDescription: 'Testimonial card with 5-star rating. Clean, minimal design.',
      landingUrl: 'https://ranibeautyclinic.com/reviews',
    },
    {
      position: 4,
      headline: 'Physician-Supervised',
      description: 'Every treatment at Rani Beauty Clinic is supervised by our physician team.',
      cta: 'Meet Our Team',
      visualDescription: 'Provider headshots or clinic trust signals. Professional, warm.',
      landingUrl: 'https://ranibeautyclinic.com/about',
    },
    {
      position: 5,
      headline: 'Book Your Consultation',
      description: 'Ready to start? Book a free consultation today. Walk-ins welcome for select services.',
      cta: 'Book Now',
      visualDescription: 'Strong CTA card with gold button. Clinic exterior or booking interface.',
      landingUrl: 'https://ranibeautyclinic.com/book',
    },
  ];

  return cards;
}

// ── VIDEO SCRIPT GENERATOR ──

function generateVideoScript(
  serviceId: string,
  serviceName: string,
  hook: string,
  body: string,
  cta: string,
): VideoScript {
  return {
    duration: 30,
    hook: {
      text: hook,
      timing: '0-3s',
    },
    segments: [
      {
        timing: '3-8s',
        visual: 'Clean clinic interior, luxury ambiance, provider preparing treatment room',
        text: `At Rani Beauty Clinic, ${serviceName} is more than a treatment.`,
        voiceover: `At Rani Beauty Clinic, ${serviceName} is more than a treatment. It is a transformation.`,
      },
      {
        timing: '8-15s',
        visual: 'Close-up of treatment preparation (without patient face). Professional, clinical setting.',
        text: body.split('.')[0] + '.',
        voiceover: body.split('.').slice(0, 2).join('.') + '.',
      },
      {
        timing: '15-22s',
        visual: 'Happy client (stock or consented) leaving clinic. Bright, confident energy.',
        text: 'Physician-supervised care. Real results.',
        voiceover: 'Every treatment is physician-supervised. Every result is real.',
      },
      {
        timing: '22-27s',
        visual: 'Social proof overlay: 5 stars, review quotes, client count.',
        text: 'Trusted by 2,000+ clients in Renton and the PNW.',
        voiceover: 'Trusted by over two thousand clients in Renton and the greater PNW.',
      },
    ],
    endCard: {
      text: `${serviceName} at Rani Beauty Clinic\nRenton, WA | ranibeautyclinic.com`,
      cta,
    },
    voiceoverNotes: 'Warm, confident female voice. Not overly clinical. Luxury spa tone with medical credibility.',
    musicNote: 'Subtle ambient/lounge music. Think luxury hotel lobby. No lyrics.',
  };
}

// ── STORY AD GENERATOR ──

function generateStorySlides(
  serviceId: string,
  serviceName: string,
  hook: string,
  cta: string,
): StorySlide[] {
  return [
    {
      position: 1,
      type: 'hook',
      text: hook,
      backgroundNote: 'Navy gradient background with gold accent. Large, bold text.',
      stickerNote: 'Poll sticker: "Have you tried this?" Yes/Not Yet',
    },
    {
      position: 2,
      type: 'content',
      text: `${serviceName} at Rani Beauty Clinic\nPhysician-supervised | Renton, WA`,
      backgroundNote: 'Clinic interior or treatment room. Elegant, warm lighting.',
    },
    {
      position: 3,
      type: 'proof',
      text: '"The results speak for themselves" - 5 Star Review',
      backgroundNote: 'Testimonial overlay on clean background. Stars visible.',
      stickerNote: 'Countdown sticker to limited availability',
    },
    {
      position: 4,
      type: 'cta',
      text: cta,
      backgroundNote: 'Gold gradient with navy text. Clear CTA button.',
      ctaButton: 'Swipe Up / Book Now',
    },
  ];
}

// ── COLLECTION AD GENERATOR ──

function generateCollectionItems(serviceId: string): CollectionItem[] {
  const service = RANI_SERVICES.find(s => s.id === serviceId);
  if (!service) return [];

  const items: CollectionItem[] = [
    { title: service.name, description: service.topBenefit, price: `From ${service.priceRange}`, landingUrl: `https://ranibeautyclinic.com/services/${serviceId.replace('_', '-')}` },
  ];

  // Add related services
  const relatedServices = RANI_SERVICES.filter(s => s.category === service.category && s.id !== serviceId).slice(0, 3);
  for (const rs of relatedServices) {
    items.push({
      title: rs.name,
      description: rs.topBenefit,
      price: `From ${rs.priceRange}`,
      landingUrl: `https://ranibeautyclinic.com/services/${rs.id.replace('_', '-')}`,
    });
  }

  return items;
}

// ── A/B TEST VARIANT GENERATOR ──

export function generateABTestVariants(
  baseCreative: MetaCreative,
  variationsCount: number = 3,
): ABTestPlan {
  const variants: MetaCreative[] = [];
  const serviceCategory = getServiceCategory(baseCreative.serviceId);
  const hooks = HOOK_LIBRARY[serviceCategory] || HOOK_LIBRARY['aesthetics'];
  const bodies = BODY_COPY_LIBRARY[serviceCategory] || BODY_COPY_LIBRARY['aesthetics'];

  for (let i = 1; i <= variationsCount; i++) {
    const variant: MetaCreative = {
      ...baseCreative,
      id: `${baseCreative.id}_variant_${i}`,
      hook: hooks[(hooks.indexOf(baseCreative.hook) + i) % hooks.length] || hooks[i % hooks.length],
      body: i % 2 === 0 ? bodies[(bodies.indexOf(baseCreative.body) + 1) % bodies.length] || bodies[0] : baseCreative.body,
      cta: CTA_LIBRARY[(CTA_LIBRARY.indexOf(baseCreative.cta) + i) % CTA_LIBRARY.length],
      abTestGroup: `group_${String.fromCharCode(66 + i - 1)}`, // B, C, D...
      status: 'draft',
    };

    if (variant.format === 'single_image') {
      variant.svgTemplate = generateSVGTemplate(variant);
    }

    variants.push(variant);
  }

  return {
    testName: `${baseCreative.serviceName} ${baseCreative.format} ${baseCreative.audienceSegment} test`,
    hypothesis: `Testing hook/CTA variations for ${baseCreative.serviceName} targeting ${AUDIENCE_CONFIG[baseCreative.audienceSegment]?.label || baseCreative.audienceSegment}`,
    controlVariant: baseCreative,
    testVariants: variants,
    metric: 'cpa',
    minSampleSize: 1000,
    estimatedDuration: '7-14 days',
  };
}

// ── CREATIVE FATIGUE DETECTOR ──

export function detectCreativeFatigue(
  creative: MetaCreative,
): CreativeFatigueResult {
  const metrics = creative.performanceMetrics;
  if (!metrics) {
    return {
      creativeId: creative.id,
      isFatigued: false,
      fatigueScore: 0,
      signals: [],
      recommendation: 'No performance data available. Monitor once live.',
      suggestedAction: 'monitor',
    };
  }

  const signals: FatigueSignal[] = [];
  let fatigueScore = 0;

  // Signal 1: High frequency (>3.5)
  if (metrics.frequency > 3.5) {
    const severity = metrics.frequency > 5 ? 'high' : metrics.frequency > 4 ? 'medium' : 'low';
    signals.push({ signal: 'High ad frequency', severity, value: metrics.frequency, threshold: 3.5 });
    fatigueScore += metrics.frequency > 5 ? 35 : metrics.frequency > 4 ? 20 : 10;
  }

  // Signal 2: CTR decline (< 1.0% for Meta)
  if (metrics.ctr < 1.0) {
    const severity = metrics.ctr < 0.5 ? 'high' : metrics.ctr < 0.7 ? 'medium' : 'low';
    signals.push({ signal: 'Low click-through rate', severity, value: metrics.ctr, threshold: 1.0 });
    fatigueScore += metrics.ctr < 0.5 ? 30 : metrics.ctr < 0.7 ? 20 : 10;
  }

  // Signal 3: Age (>21 days)
  if (metrics.daysRunning > 21) {
    const severity = metrics.daysRunning > 45 ? 'high' : metrics.daysRunning > 30 ? 'medium' : 'low';
    signals.push({ signal: 'Creative age', severity, value: metrics.daysRunning, threshold: 21 });
    fatigueScore += metrics.daysRunning > 45 ? 20 : metrics.daysRunning > 30 ? 12 : 5;
  }

  // Signal 4: Low relevance score (<5)
  if (metrics.relevanceScore < 5) {
    const severity = metrics.relevanceScore < 3 ? 'high' : 'medium';
    signals.push({ signal: 'Low relevance score', severity, value: metrics.relevanceScore, threshold: 5 });
    fatigueScore += metrics.relevanceScore < 3 ? 25 : 15;
  }

  // Signal 5: Rising CPA
  if (metrics.cpa > 0 && metrics.roas < 1.5) {
    signals.push({ signal: 'Poor return on ad spend', severity: 'high', value: metrics.roas, threshold: 1.5 });
    fatigueScore += 20;
  }

  const isFatigued = fatigueScore >= 40;
  fatigueScore = Math.min(100, fatigueScore);

  let recommendation: string;
  let suggestedAction: CreativeFatigueResult['suggestedAction'];

  if (fatigueScore >= 70) {
    recommendation = 'Creative is severely fatigued. Replace immediately with a fresh variant.';
    suggestedAction = 'replace';
  } else if (fatigueScore >= 40) {
    recommendation = 'Creative is showing fatigue signals. Refresh copy/visual or rotate in a new variant within 3-5 days.';
    suggestedAction = 'refresh';
  } else if (fatigueScore >= 20) {
    recommendation = 'Early fatigue signals detected. Monitor daily and prepare replacement variants.';
    suggestedAction = 'monitor';
  } else {
    recommendation = 'Creative is performing well. Continue running and monitor weekly.';
    suggestedAction = 'monitor';
  }

  // Estimate days until fatigue
  let daysUntilFatigue: number | undefined;
  if (!isFatigued && metrics.daysRunning > 0) {
    const dailyFatigueRate = fatigueScore / metrics.daysRunning;
    if (dailyFatigueRate > 0) {
      daysUntilFatigue = Math.round((40 - fatigueScore) / dailyFatigueRate);
    }
  }

  return {
    creativeId: creative.id,
    isFatigued,
    fatigueScore,
    signals,
    recommendation,
    suggestedAction,
    daysUntilFatigue,
  };
}

// ── AUTO-REFRESH SCHEDULE ──

export function generateRefreshSchedule(
  creatives: MetaCreative[],
): CreativeRefreshSchedule[] {
  const schedule: CreativeRefreshSchedule[] = [];

  for (const creative of creatives) {
    const metrics = creative.performanceMetrics;
    const daysRunning = metrics?.daysRunning || 0;
    const fatigue = detectCreativeFatigue(creative);

    let maxAge = 30; // default 30-day lifecycle
    if (metrics && metrics.roas > 3.0) maxAge = 45; // extend high performers
    if (metrics && metrics.roas < 1.5) maxAge = 14; // shorten poor performers

    const refreshDate = new Date();
    if (fatigue.daysUntilFatigue) {
      refreshDate.setDate(refreshDate.getDate() + fatigue.daysUntilFatigue);
    } else {
      refreshDate.setDate(refreshDate.getDate() + Math.max(0, maxAge - daysRunning));
    }

    let priority: CreativeRefreshSchedule['priority'];
    if (fatigue.isFatigued) priority = 'urgent';
    else if (daysRunning > maxAge * 0.7) priority = 'scheduled';
    else priority = 'monitoring';

    schedule.push({
      creativeId: creative.id,
      currentAge: daysRunning,
      maxAge,
      refreshDate: refreshDate.toISOString().split('T')[0],
      newVariantQueued: fatigue.isFatigued,
      priority,
    });
  }

  return schedule.sort((a, b) => {
    const pOrder = { urgent: 0, scheduled: 1, monitoring: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

// ── BULK CREATIVE GENERATION ──

export function generateFullCreativeSuite(services: string[]): MetaCreative[] {
  const allCreatives: MetaCreative[] = [];
  const segments: AudienceSegment[] = ['women_25_45', 'women_45_65', 'men_30_55', 'pnw_locals'];
  const formats: MetaAdFormat[] = ['single_image', 'carousel', 'video_script', 'story'];

  for (const serviceId of services) {
    for (const segment of segments) {
      for (const format of formats) {
        const creatives = generateCreativeSuite({
          serviceId,
          audienceSegments: [segment],
          formats: [format],
          variantsPerFormat: 2,
        });
        allCreatives.push(...creatives);
      }
    }
  }

  return allCreatives;
}

// ── UTILITIES ──

function getServiceCategory(serviceId: string): string {
  const categoryMap: Record<string, string> = {
    glp1: 'glp1',
    botox: 'aesthetics',
    fillers: 'aesthetics',
    hydrafacial: 'hydrafacial',
    laser_hair: 'laser_hair',
    rf_microneedling: 'aesthetics',
    sofwave: 'sofwave',
    vi_peel: 'vi_peel',
    picoway: 'aesthetics',
    prx: 'aesthetics',
    wellness: 'wellness',
    nad: 'peptides',
    peptides: 'peptides',
    b12: 'wellness',
    glutathione: 'wellness',
    tri_immune: 'wellness',
  };
  return categoryMap[serviceId] || 'aesthetics';
}

export function getCreativeStats(creatives: MetaCreative[]): {
  total: number;
  byFormat: Record<string, number>;
  bySegment: Record<string, number>;
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  fatigued: number;
} {
  const byFormat: Record<string, number> = {};
  const bySegment: Record<string, number> = {};
  const byService: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let fatigued = 0;

  for (const c of creatives) {
    byFormat[c.format] = (byFormat[c.format] || 0) + 1;
    bySegment[c.audienceSegment] = (bySegment[c.audienceSegment] || 0) + 1;
    byService[c.serviceId] = (byService[c.serviceId] || 0) + 1;
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    if (c.status === 'fatigued') fatigued++;
  }

  return { total: creatives.length, byFormat, bySegment, byService, byStatus, fatigued };
}
