/**
 * Ads War Machine — Creative Auto-Generator Engine
 *
 * Generates ad creatives at scale using 15 copy frameworks,
 * per-service templates, headline/description variants, CTA variations,
 * dynamic keyword insertion, RSA combinations, and SVG-based visuals
 * in 5 sizes across 10 visual templates.
 *
 * Brand: Luxury, clinically-assured, educational + aspirational.
 * CRITICAL: Always "injection" — never "infusion."
 */

// ── CONSTANTS ──

export const BRAND = {
  navy: '#0F1D2C',
  gold: '#C9A96E',
  cream: '#F8F6F1',
  white: '#FFFFFF',
  headingFont: 'Playfair Display',
  bodyFont: 'Montserrat',
  clinicName: 'Rani Beauty Clinic',
  tagline: 'Where Science Meets Luxury',
  location: 'Renton, WA',
  phone: '(425) 555-7264',
  url: 'ranibeautyclinic.com',
} as const;

export const AD_SIZES = {
  feed: { width: 1080, height: 1080, label: 'Feed (1:1)' },
  story: { width: 1080, height: 1920, label: 'Story/Reel (9:16)' },
  link: { width: 1200, height: 628, label: 'Link Preview (1.91:1)' },
  portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
  banner: { width: 728, height: 90, label: 'Banner (728x90)' },
} as const;

export type AdSize = keyof typeof AD_SIZES;

// ── COPY FRAMEWORK TYPES ──

export type CopyFramework =
  | 'pas' | 'aida' | 'bab' | 'fab' | 'story'
  | 'question' | 'stat' | 'testimonial' | 'social_proof'
  | 'urgency' | 'authority' | 'educational' | 'comparison'
  | 'lifestyle' | 'seasonal';

export type HeadlineStyle = 'short' | 'long' | 'question' | 'stat' | 'emotional';
export type DescriptionStyle = 'benefit' | 'social_proof' | 'educational';
export type CTAVariant = 'book_now' | 'see_results' | 'learn_more' | 'get_started' | 'claim_spot';

export const CTA_TEXT: Record<CTAVariant, string> = {
  book_now: 'Book Now',
  see_results: 'See Results',
  learn_more: 'Learn More',
  get_started: 'Get Started',
  claim_spot: 'Claim Your Spot',
};

export type VisualTemplate =
  | 'before_after' | 'service_spotlight' | 'testimonial_card'
  | 'educational_fact' | 'seasonal_promo' | 'provider_spotlight'
  | 'treatment_process' | 'results_timeline' | 'luxury_lifestyle'
  | 'comparison_chart';

// ── SERVICE CATALOG ──

export interface ServiceProfile {
  id: string;
  name: string;
  category: 'injectable' | 'laser' | 'facial' | 'body' | 'wellness' | 'skincare';
  priceRange: string;
  startingPrice: number;
  topBenefit: string;
  targetAudience: string;
  painPoints: string[];
  results: string[];
  timeframe: string;
  socialProofStat: string;
  keywords: string[];
}

export const RANI_SERVICES: ServiceProfile[] = [
  {
    id: 'botox',
    name: 'Botox',
    category: 'injectable',
    priceRange: '$12-14/unit',
    startingPrice: 200,
    topBenefit: 'Smooth fine lines and wrinkles with zero downtime',
    targetAudience: 'Women 28-55 wanting to prevent or reduce wrinkles',
    painPoints: ['Forehead lines making you look tired', 'Crow\'s feet aging your eyes', 'Frown lines that never relax'],
    results: ['Visibly smoother skin in 3-5 days', 'Natural-looking results that last 3-4 months', 'Preventative aging benefits when started early'],
    timeframe: '15-minute treatment, results in 3-5 days',
    socialProofStat: '98% client satisfaction rate',
    keywords: ['botox renton', 'botox near me', 'wrinkle treatment', 'anti-aging injections', 'forehead lines treatment'],
  },
  {
    id: 'fillers',
    name: 'Dermal Fillers',
    category: 'injectable',
    priceRange: '$600-800/syringe',
    startingPrice: 600,
    topBenefit: 'Restore youthful volume and sculpt your perfect profile',
    targetAudience: 'Women 30-60 seeking volume restoration or facial contouring',
    painPoints: ['Hollow under-eyes making you look exhausted', 'Thinning lips losing their shape', 'Lost cheek volume creating a gaunt look'],
    results: ['Instant volume restoration', 'Natural-looking lip enhancement', 'Results lasting 12-18 months'],
    timeframe: '30-minute treatment, immediate results',
    socialProofStat: 'Over 500 filler treatments performed',
    keywords: ['dermal fillers renton', 'lip filler near me', 'cheek filler', 'under eye filler', 'facial contouring'],
  },
  {
    id: 'sofwave',
    name: 'Sofwave',
    category: 'laser',
    priceRange: '$2,750-$4,500',
    startingPrice: 2750,
    topBenefit: 'Non-invasive skin tightening with no downtime',
    targetAudience: 'Women 35-65 wanting skin tightening without surgery',
    painPoints: ['Sagging jawline making you look older', 'Loose neck skin you can\'t hide', 'Fine lines that creams can\'t fix'],
    results: ['Visible lifting in a single session', 'Collagen stimulation that improves over 3 months', 'FDA-cleared SUPERB technology'],
    timeframe: '30-45 minute treatment, results develop over 12 weeks',
    socialProofStat: 'FDA-cleared with 94% patient satisfaction',
    keywords: ['sofwave renton', 'skin tightening near me', 'non-surgical facelift', 'jowl treatment', 'neck tightening'],
  },
  {
    id: 'hydrafacial',
    name: 'HydraFacial',
    category: 'facial',
    priceRange: '$275',
    startingPrice: 275,
    topBenefit: 'Deep cleanse, extract, and hydrate for instant glow',
    targetAudience: 'Women 25-55 wanting visible skin improvement',
    painPoints: ['Dull, congested skin that won\'t clear up', 'Uneven texture you can feel', 'Pre-event skin that needs to glow'],
    results: ['Instantly brighter, clearer complexion', 'Reduced pore size and congestion', 'Plumper, hydrated skin in 30 minutes'],
    timeframe: '30-minute treatment, immediate glow',
    socialProofStat: 'Most popular treatment — clients rebook monthly',
    keywords: ['hydrafacial renton', 'hydrafacial near me', 'deep cleanse facial', 'glow facial', 'medical facial'],
  },
  {
    id: 'prx',
    name: 'PRX-T33',
    category: 'facial',
    priceRange: '$495',
    startingPrice: 495,
    topBenefit: 'Biorevitalization that rebuilds skin from within',
    targetAudience: 'Women 30-55 seeking deep skin renewal without peeling',
    painPoints: ['Skin texture that won\'t improve', 'Acne scars that won\'t fade', 'Dull skin lacking radiance'],
    results: ['Immediate skin tightening and glow', 'No peeling or downtime', 'Collagen regeneration over 6-8 weeks'],
    timeframe: '20-minute treatment, no downtime',
    socialProofStat: 'Revolutionary Italian biorevitalization technology',
    keywords: ['prx-t33 renton', 'biorevitalization near me', 'no downtime peel', 'skin rejuvenation', 'collagen boost treatment'],
  },
  {
    id: 'vi_peel',
    name: 'VI Peel',
    category: 'facial',
    priceRange: '$395',
    startingPrice: 395,
    topBenefit: 'Medical-grade peel for transformative skin renewal',
    targetAudience: 'Women 25-55 with hyperpigmentation, acne scarring, or sun damage',
    painPoints: ['Dark spots that won\'t fade', 'Acne scars affecting your confidence', 'Sun damage making skin look older'],
    results: ['Visible improvement in pigmentation', 'Smoother, more even skin tone', 'Fresh, renewed complexion in 7 days'],
    timeframe: '30-minute application, 7-day peel process',
    socialProofStat: 'Clinically proven for all skin types',
    keywords: ['vi peel renton', 'chemical peel near me', 'hyperpigmentation treatment', 'acne scar peel', 'medical peel'],
  },
  {
    id: 'picoway',
    name: 'PicoWay',
    category: 'laser',
    priceRange: '$350-$600',
    startingPrice: 350,
    topBenefit: 'Advanced laser technology for pigment and skin renewal',
    targetAudience: 'Women 25-55 with pigmentation, melasma, or tattoo removal needs',
    painPoints: ['Stubborn pigmentation that won\'t respond to topicals', 'Melasma that keeps coming back', 'Uneven skin tone ruining your confidence'],
    results: ['Targets pigment at the cellular level', 'Safe for all skin types', 'Gradual clearing with each session'],
    timeframe: '15-30 minute sessions, results build over 3-6 treatments',
    socialProofStat: 'Picosecond technology — 100x faster than traditional lasers',
    keywords: ['picoway renton', 'laser pigment removal', 'melasma treatment', 'skin pigmentation laser', 'picosecond laser'],
  },
  {
    id: 'rf_microneedling',
    name: 'RF Microneedling',
    category: 'laser',
    priceRange: '$495-$850',
    startingPrice: 495,
    topBenefit: 'Radiofrequency energy combined with microneedling for deep skin remodeling',
    targetAudience: 'Women 30-60 seeking skin tightening and texture improvement',
    painPoints: ['Large pores that won\'t shrink', 'Acne scars creating uneven texture', 'Loss of firmness and elasticity'],
    results: ['Tighter, firmer skin from within', 'Reduced pore size and scarring', 'Collagen and elastin stimulation'],
    timeframe: '45-minute treatment, 3-5 day recovery',
    socialProofStat: 'Combines two proven technologies for superior results',
    keywords: ['rf microneedling renton', 'radiofrequency microneedling', 'skin tightening microneedling', 'acne scar treatment', 'morpheus8 alternative'],
  },
  {
    id: 'laser_hair',
    name: 'Laser Hair Removal',
    category: 'laser',
    priceRange: 'Packages from $800',
    startingPrice: 800,
    topBenefit: 'Permanent hair reduction with medical-grade laser technology',
    targetAudience: 'Women 20-50 tired of shaving, waxing, or tweezing',
    painPoints: ['Constant shaving irritation and razor bumps', 'Embarrassing unwanted hair', 'Time wasted on temporary hair removal'],
    results: ['Up to 90% permanent hair reduction', 'Smooth, stubble-free skin', 'Freedom from daily shaving'],
    timeframe: '6-8 sessions, results after 2-3 treatments',
    socialProofStat: 'Most effective on all skin tones with latest technology',
    keywords: ['laser hair removal renton', 'permanent hair removal', 'laser hair removal near me', 'full body laser', 'bikini laser hair removal'],
  },
  {
    id: 'glp1',
    name: 'GLP-1 Weight Loss',
    category: 'wellness',
    priceRange: '$399-$599/mo',
    startingPrice: 399,
    topBenefit: 'Physician-supervised weight management with GLP-1 injections',
    targetAudience: 'Adults 25-65 seeking medically-supervised weight loss',
    painPoints: ['Diets that never work long-term', 'Weight that won\'t budge no matter what', 'Feeling frustrated with your body'],
    results: ['Clinically proven weight reduction', 'Reduced appetite and cravings', 'Physician-monitored progress'],
    timeframe: 'Monthly program with weekly injections',
    socialProofStat: 'FDA-approved medications with clinical trials',
    keywords: ['glp-1 weight loss renton', 'semaglutide near me', 'medical weight loss', 'weight loss injections', 'ozempic alternative clinic'],
  },
  {
    id: 'wellness_injections',
    name: 'Wellness Injections',
    category: 'wellness',
    priceRange: '$35-$500',
    startingPrice: 35,
    topBenefit: 'Direct nutrient delivery for optimal health and vitality',
    targetAudience: 'Health-conscious adults 25-60 seeking energy and immune support',
    painPoints: ['Constant fatigue despite sleeping enough', 'Frequent illness and weak immunity', 'Supplements that don\'t seem to work'],
    results: ['Immediate energy boost with B12', 'Enhanced immune defense with Tri-Immune', 'Radiant skin with Glutathione'],
    timeframe: 'Quick 10-minute injection, feel benefits within hours',
    socialProofStat: '100% bioavailability — bypasses digestive system',
    keywords: ['vitamin injections renton', 'b12 injection near me', 'glutathione injection', 'nad+ therapy', 'immune boost injection'],
  },
  {
    id: 'rx_skincare',
    name: 'Rx Skincare',
    category: 'skincare',
    priceRange: '$99/mo',
    startingPrice: 99,
    topBenefit: 'Prescription-strength skincare delivered to your door',
    targetAudience: 'Women 25-55 wanting medical-grade skincare results',
    painPoints: ['Over-the-counter products not working', 'Fine lines appearing faster than expected', 'Acne that won\'t clear with drugstore products'],
    results: ['Clinical-grade anti-aging with Tretinoin', 'Clearer, smoother skin within weeks', 'Physician-supervised skincare regimen'],
    timeframe: 'Monthly subscription, visible results in 4-8 weeks',
    socialProofStat: 'Tretinoin is the gold standard in dermatology',
    keywords: ['prescription skincare renton', 'tretinoin near me', 'medical grade skincare', 'anti-aging prescription', 'rx skincare clinic'],
  },
  {
    id: 'folix',
    name: 'Folix Hair Restoration',
    category: 'wellness',
    priceRange: 'Consultation required',
    startingPrice: 500,
    topBenefit: 'Advanced hair restoration for thinning and hair loss',
    targetAudience: 'Adults 30-65 experiencing hair thinning or loss',
    painPoints: ['Thinning hair affecting your confidence', 'Hairline receding and nothing works', 'Hair loss products with no results'],
    results: ['Stimulated hair growth and thickness', 'Non-surgical restoration approach', 'Visible improvement over treatment course'],
    timeframe: 'Treatment series, results over 3-6 months',
    socialProofStat: 'Advanced growth factor technology',
    keywords: ['hair restoration renton', 'hair loss treatment near me', 'hair thinning treatment', 'prp hair restoration', 'non-surgical hair growth'],
  },
  {
    id: 'memberships',
    name: 'Rani Membership',
    category: 'skincare',
    priceRange: 'From $199/mo',
    startingPrice: 199,
    topBenefit: 'VIP access to treatments at exclusive member pricing',
    targetAudience: 'Regular clients wanting consistent care at better value',
    painPoints: ['Want consistent treatments but worried about cost', 'Not sure how to maintain results between visits', 'Want VIP treatment and priority booking'],
    results: ['Savings of 15-25% on regular treatments', 'Priority booking and exclusive perks', 'Consistent treatment plan for optimal results'],
    timeframe: 'Monthly membership with rollover credits',
    socialProofStat: 'Members save an average of $1,800/year',
    keywords: ['medspa membership renton', 'beauty membership near me', 'aesthetic membership', 'monthly treatment plan', 'vip beauty club'],
  },
  {
    id: 'consultation',
    name: 'Free Consultation',
    category: 'injectable',
    priceRange: 'Complimentary',
    startingPrice: 0,
    topBenefit: 'Personalized treatment plan from our expert team',
    targetAudience: 'Anyone curious about medical aesthetics or specific treatments',
    painPoints: ['Not sure which treatment is right for you', 'Overwhelmed by options and conflicting information', 'Want expert guidance before committing'],
    results: ['Customized treatment roadmap', 'Clear pricing with no surprises', 'Expert recommendations for your goals'],
    timeframe: '30-minute complimentary consultation',
    socialProofStat: '90% of consultations convert to treatment plans',
    keywords: ['free consultation medspa', 'aesthetic consultation renton', 'medspa near me', 'beauty consultation free', 'skin treatment consultation'],
  },
];

// ── COPY GENERATION ──

export interface GeneratedCopy {
  framework: CopyFramework;
  service: ServiceProfile;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  keywords: string[];
}

export interface HeadlineVariant {
  style: HeadlineStyle;
  text: string;
}

export interface DescriptionVariant {
  style: DescriptionStyle;
  text: string;
}

const FRAMEWORK_GENERATORS: Record<CopyFramework, (service: ServiceProfile) => Omit<GeneratedCopy, 'framework' | 'service' | 'keywords'>> = {
  pas: (s) => ({
    headline: `Tired of ${s.painPoints[0].toLowerCase()}?`,
    primaryText: `${s.painPoints[0]}. It affects how you feel every time you look in the mirror. But it doesn't have to be this way.\n\n${s.topBenefit} at Rani Beauty Clinic — where science meets luxury.\n\n${s.results[0]}. ${s.timeframe}.\n\n${s.socialProofStat}.`,
    description: `${s.topBenefit}. Starting at ${s.priceRange}. Book your consultation today.`,
    cta: CTA_TEXT.book_now,
  }),

  aida: (s) => ({
    headline: `${s.name}: ${s.results[0]}`,
    primaryText: `Imagine looking in the mirror and loving what you see.\n\n${s.topBenefit} — backed by clinical science and delivered with luxury care at Rani Beauty Clinic.\n\nOur clients experience:\n✓ ${s.results[0]}\n✓ ${s.results[1]}\n✓ ${s.results[2] || s.timeframe}\n\nLimited availability this month. Secure your appointment now.`,
    description: `Experience ${s.name} at Rani Beauty Clinic. ${s.socialProofStat}.`,
    cta: CTA_TEXT.claim_spot,
  }),

  bab: (s) => ({
    headline: `From ${s.painPoints[0].split(' ').slice(0, 4).join(' ')}... to Confidence`,
    primaryText: `BEFORE: ${s.painPoints[0]}. You've tried everything.\n\nAFTER: ${s.results[0]}. ${s.results[1]}.\n\nTHE BRIDGE: ${s.name} at Rani Beauty Clinic. ${s.topBenefit}.\n\n${s.timeframe}. Starting at ${s.priceRange}.`,
    description: `See the transformation. ${s.name} at Rani Beauty Clinic — ${s.topBenefit.toLowerCase()}.`,
    cta: CTA_TEXT.see_results,
  }),

  fab: (s) => ({
    headline: `${s.name} — ${s.topBenefit.split(' ').slice(0, 6).join(' ')}`,
    primaryText: `FEATURE: ${s.name} — the latest in medical aesthetics technology.\n\nADVANTAGE: ${s.topBenefit}.\n\nBENEFIT: ${s.results[0]}. ${s.results[1]}.\n\nAt Rani Beauty Clinic, every treatment is performed by experienced, physician-supervised providers.\n\n${s.priceRange} | ${s.timeframe}`,
    description: `${s.name}: ${s.topBenefit}. Physician-supervised care in Renton, WA.`,
    cta: CTA_TEXT.learn_more,
  }),

  story: (s) => ({
    headline: `Her ${s.name} Journey Changed Everything`,
    primaryText: `She walked in feeling self-conscious about ${s.painPoints[0].toLowerCase()}.\n\nAfter her ${s.name} treatment at Rani Beauty Clinic, she couldn't stop smiling.\n\n"I wish I'd done this sooner," she told us.\n\n${s.results[0]}. ${s.results[1]}.\n\nYour transformation story starts with a consultation.\n\n${s.socialProofStat}.`,
    description: `Real results, real confidence. ${s.name} at Rani Beauty Clinic.`,
    cta: CTA_TEXT.get_started,
  }),

  question: (s) => ({
    headline: `What if ${s.painPoints[0].toLowerCase()} was no longer an issue?`,
    primaryText: `What would you do if you could finally address ${s.painPoints[0].toLowerCase()}?\n\nWhat if the solution was a ${s.timeframe.toLowerCase()} treatment?\n\nAt Rani Beauty Clinic, we make it possible with ${s.name}.\n\n${s.results[0]}.\n${s.results[1]}.\n\nThe only question left: when do you want to start?`,
    description: `${s.name}: ${s.topBenefit}. Book your free consultation at Rani Beauty Clinic.`,
    cta: CTA_TEXT.book_now,
  }),

  stat: (s) => ({
    headline: `${s.socialProofStat}`,
    primaryText: `The numbers don't lie: ${s.socialProofStat.toLowerCase()}.\n\n${s.name} at Rani Beauty Clinic delivers ${s.results[0].toLowerCase()}.\n\nWhy our clients choose us:\n→ Physician-supervised treatments\n→ Luxury clinical environment\n→ Personalized treatment plans\n→ ${s.topBenefit}\n\nStarting at ${s.priceRange}. Experience the Rani difference.`,
    description: `${s.socialProofStat}. ${s.name} starting at ${s.priceRange}.`,
    cta: CTA_TEXT.see_results,
  }),

  testimonial: (s) => ({
    headline: `"${s.name} at Rani Changed My Life"`,
    primaryText: `"I was so frustrated with ${s.painPoints[0].toLowerCase()}. Nothing worked until I found Rani Beauty Clinic.\n\nThe team was incredible — professional, warm, and so knowledgeable. After my ${s.name} treatment, I saw ${s.results[0].toLowerCase()}.\n\nI recommend Rani to everyone!" — Verified Client\n\n${s.socialProofStat}.\n\nJoin hundreds of happy clients.`,
    description: `See why clients love ${s.name} at Rani Beauty Clinic. ${s.socialProofStat}.`,
    cta: CTA_TEXT.book_now,
  }),

  social_proof: (s) => ({
    headline: `Join Hundreds Who Chose ${s.name}`,
    primaryText: `${s.socialProofStat}.\n\nEvery week, more clients discover the Rani Beauty Clinic difference:\n\n⭐ 5-star rated on Google\n⭐ Physician-supervised treatments\n⭐ ${s.results[0]}\n⭐ ${s.results[1]}\n\n${s.name} starting at ${s.priceRange}.\n\nDon't just take our word for it — see the results for yourself.`,
    description: `5-star rated ${s.name} in Renton, WA. ${s.socialProofStat}.`,
    cta: CTA_TEXT.see_results,
  }),

  urgency: (s) => ({
    headline: `Limited ${s.name} Appointments This Month`,
    primaryText: `Our ${s.name} slots fill fast — and we only take a limited number of new clients each month to ensure every patient gets the attention they deserve.\n\n${s.topBenefit}.\n\n${s.results[0]}. ${s.results[1]}.\n\nDon't wait for the perfect moment. The perfect moment is when you decide to invest in yourself.\n\nStarting at ${s.priceRange}.`,
    description: `Limited availability for ${s.name}. Secure your appointment at Rani Beauty Clinic.`,
    cta: CTA_TEXT.claim_spot,
  }),

  authority: (s) => ({
    headline: `Physician-Supervised ${s.name} in Renton`,
    primaryText: `At Rani Beauty Clinic, your ${s.name} treatment is always performed under physician supervision — because your safety and results are non-negotiable.\n\nOur clinical team brings:\n✓ Medical expertise in aesthetic procedures\n✓ Ongoing advanced training\n✓ Personalized treatment protocols\n✓ ${s.topBenefit}\n\n${s.socialProofStat}.\n\n${s.priceRange} | ${s.location || 'Renton, WA'}`,
    description: `Physician-supervised ${s.name}. Expert care at Rani Beauty Clinic.`,
    cta: CTA_TEXT.book_now,
  }),

  educational: (s) => ({
    headline: `What You Need to Know About ${s.name}`,
    primaryText: `Thinking about ${s.name}? Here's what makes it different:\n\n${s.topBenefit}.\n\nHow it works:\n1. ${s.timeframe}\n2. ${s.results[0]}\n3. ${s.results[1]}\n\nIs it right for you? Our complimentary consultation includes a personalized assessment and treatment plan.\n\nKnowledge is power. Informed clients get the best results.`,
    description: `Learn about ${s.name}: how it works, what to expect, and results timeline.`,
    cta: CTA_TEXT.learn_more,
  }),

  comparison: (s) => ({
    headline: `${s.name} vs. At-Home Alternatives`,
    primaryText: `You've tried the creams. You've watched the tutorials. But medical-grade ${s.name} delivers what at-home solutions can't:\n\n❌ At-Home: Minimal results, months of waiting\n✅ ${s.name}: ${s.results[0]}\n\n❌ At-Home: One-size-fits-all approach\n✅ ${s.name}: Personalized to your skin and goals\n\n❌ At-Home: No medical supervision\n✅ ${s.name}: Physician-supervised at Rani Beauty Clinic\n\nInvest in what actually works.`,
    description: `Why ${s.name} outperforms at-home alternatives. Expert care at Rani Beauty Clinic.`,
    cta: CTA_TEXT.get_started,
  }),

  lifestyle: (s) => ({
    headline: `The Confidence to Show Up Fully`,
    primaryText: `Imagine walking into every room with total confidence.\n\nNo more avoiding cameras. No more canceling plans because you don't feel your best.\n\n${s.name} at Rani Beauty Clinic helps you:\n→ ${s.results[0]}\n→ ${s.results[1]}\n→ Feel like the best version of yourself\n\n${s.topBenefit}. ${s.timeframe}.\n\nBecause you deserve to feel as beautiful as you are.`,
    description: `Confidence starts here. ${s.name} at Rani Beauty Clinic — ${s.priceRange}.`,
    cta: CTA_TEXT.book_now,
  }),

  seasonal: (s) => ({
    headline: `This Season, Invest in You: ${s.name}`,
    primaryText: `New season, new you? Make it real.\n\nThis is the perfect time to start your ${s.name} journey at Rani Beauty Clinic.\n\nWhy now?\n✓ ${s.results[0]}\n✓ ${s.results[1]}\n✓ Be ready for every event, every photo, every moment\n\n${s.topBenefit}. Starting at ${s.priceRange}.\n\n${s.socialProofStat}. Start your transformation today.`,
    description: `Seasonal refresh with ${s.name}. Starting at ${s.priceRange} at Rani Beauty Clinic.`,
    cta: CTA_TEXT.claim_spot,
  }),
};

/**
 * Generate ad copy using a specific framework for a specific service
 */
export function generateCopy(framework: CopyFramework, service: ServiceProfile): GeneratedCopy {
  const generator = FRAMEWORK_GENERATORS[framework];
  const generated = generator(service);
  return {
    framework,
    service,
    ...generated,
    keywords: service.keywords,
  };
}

/**
 * Generate all 15 framework variants for a single service
 */
export function generateAllFrameworks(service: ServiceProfile): GeneratedCopy[] {
  const frameworks: CopyFramework[] = [
    'pas', 'aida', 'bab', 'fab', 'story', 'question', 'stat',
    'testimonial', 'social_proof', 'urgency', 'authority', 'educational',
    'comparison', 'lifestyle', 'seasonal',
  ];
  return frameworks.map(f => generateCopy(f, service));
}

// ── HEADLINE GENERATOR ──

/**
 * Generate 5 headline variants (short, long, question, stat, emotional) for a service
 */
export function generateHeadlines(service: ServiceProfile): HeadlineVariant[] {
  return [
    { style: 'short', text: `${service.name} — Real Results` },
    { style: 'long', text: `${service.topBenefit} at Rani Beauty Clinic` },
    { style: 'question', text: `Ready to Try ${service.name}?` },
    { style: 'stat', text: service.socialProofStat },
    { style: 'emotional', text: `Confidence Starts with ${service.name}` },
  ];
}

// ── DESCRIPTION GENERATOR ──

/**
 * Generate 3 description variants (benefit-led, social-proof-led, educational)
 */
export function generateDescriptions(service: ServiceProfile): DescriptionVariant[] {
  return [
    { style: 'benefit', text: `${service.topBenefit}. Starting at ${service.priceRange}. Book your free consultation at Rani Beauty Clinic.` },
    { style: 'social_proof', text: `${service.socialProofStat}. Join hundreds of satisfied clients. ${service.name} at Rani Beauty Clinic — Renton, WA.` },
    { style: 'educational', text: `${service.results[0]}. ${service.timeframe}. Physician-supervised ${service.name} at Rani Beauty Clinic.` },
  ];
}

// ── DYNAMIC KEYWORD INSERTION (Google Ads) ──

export interface DKITemplate {
  headline: string;
  description: string;
  displayUrl: string;
  finalUrl: string;
  service: string;
}

/**
 * Generate Dynamic Keyword Insertion templates for Google Ads
 */
export function generateDKITemplates(service: ServiceProfile): DKITemplate[] {
  return [
    {
      headline: `{KeyWord:${service.name}} in Renton`,
      description: `${service.topBenefit}. Book now at Rani Beauty Clinic. Physician-supervised care.`,
      displayUrl: `ranibeautyclinic.com/${service.id}`,
      finalUrl: `https://ranibeautyclinic.com/${service.id === 'consultation' ? 'book' : service.id}`,
      service: service.id,
    },
    {
      headline: `Best {KeyWord:${service.name}} Near You`,
      description: `${service.socialProofStat}. Starting at ${service.priceRange}. Free consultation available.`,
      displayUrl: `ranibeautyclinic.com/${service.id}`,
      finalUrl: `https://ranibeautyclinic.com/${service.id === 'consultation' ? 'book' : service.id}`,
      service: service.id,
    },
    {
      headline: `{KeyWord:${service.name}} — ${service.priceRange}`,
      description: `${service.results[0]}. Physician-supervised at Rani Beauty Clinic in Renton, WA.`,
      displayUrl: `ranibeautyclinic.com/${service.id}`,
      finalUrl: `https://ranibeautyclinic.com/${service.id === 'consultation' ? 'book' : service.id}`,
      service: service.id,
    },
  ];
}

// ── RESPONSIVE SEARCH AD COMBINATIONS ──

export interface RSACombination {
  headlines: string[]; // up to 15
  descriptions: string[]; // up to 4
  pinnedHeadlines?: Record<number, number>; // position -> headline index
  pinnedDescriptions?: Record<number, number>;
  service: string;
  finalUrl: string;
}

/**
 * Generate Responsive Search Ad with 15 headlines x 4 descriptions
 */
export function generateRSA(service: ServiceProfile): RSACombination {
  const headlines = [
    // Short brand + service
    `${service.name} at Rani Beauty Clinic`,
    `${service.name} in Renton WA`,
    `Physician-Supervised ${service.name}`,
    // Benefit-driven
    service.topBenefit.length <= 30 ? service.topBenefit : service.topBenefit.split(' ').slice(0, 5).join(' '),
    service.results[0].length <= 30 ? service.results[0] : service.results[0].split(' ').slice(0, 5).join(' '),
    // Question hooks
    `Ready for ${service.name}?`,
    `Tired of ${service.painPoints[0].split(' ').slice(0, 3).join(' ')}?`,
    // Stat/proof
    service.socialProofStat.length <= 30 ? service.socialProofStat : service.socialProofStat.split(' ').slice(0, 5).join(' '),
    // Price
    `${service.name} from ${service.priceRange}`,
    `Starting at ${service.priceRange}`,
    // CTA-oriented
    `Book ${service.name} Today`,
    `Free ${service.name} Consultation`,
    // Luxury brand
    `Luxury ${service.name} Experience`,
    `Where Science Meets Luxury`,
    // Urgency
    `Limited ${service.name} Spots Available`,
  ].map(h => h.slice(0, 30)); // Google max headline length

  const descriptions = [
    `${service.topBenefit}. Physician-supervised care at Rani Beauty Clinic. Book your free consultation today.`.slice(0, 90),
    `${service.socialProofStat}. Experience ${service.name} at our luxury Renton clinic. ${service.timeframe}.`.slice(0, 90),
    `${service.results[0]}. ${service.results[1]}. Starting at ${service.priceRange}. Call now.`.slice(0, 90),
    `Expert ${service.name} in Renton, WA. ${service.timeframe}. 5-star rated. Schedule your visit today.`.slice(0, 90),
  ];

  return {
    headlines,
    descriptions,
    pinnedHeadlines: { 1: 0 }, // Pin brand headline to position 1
    service: service.id,
    finalUrl: `https://ranibeautyclinic.com/${service.id === 'consultation' ? 'book' : service.id}`,
  };
}

// ── SVG VISUAL GENERATOR ──

export interface GeneratedVisual {
  template: VisualTemplate;
  size: AdSize;
  svg: string;
  width: number;
  height: number;
  service: string;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ' ' + word;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

function svgTextLines(lines: string[], x: number, startY: number, lineHeight: number, attrs: string): string {
  return lines.map((line, i) =>
    `<text x="${x}" y="${startY + i * lineHeight}" ${attrs}>${escapeXml(line)}</text>`
  ).join('\n');
}

const TEMPLATE_GENERATORS: Record<VisualTemplate, (service: ServiceProfile, w: number, h: number) => string> = {
  before_after: (s, w, h) => {
    const midX = w / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.cream}"/>
  <rect x="0" y="0" width="${midX - 4}" height="${h}" fill="${BRAND.navy}" opacity="0.05"/>
  <rect x="${midX + 4}" y="0" width="${midX - 4}" height="${h}" fill="${BRAND.gold}" opacity="0.08"/>
  <line x1="${midX}" y1="0" x2="${midX}" y2="${h}" stroke="${BRAND.gold}" stroke-width="3"/>
  <rect x="${midX * 0.15}" y="${h * 0.25}" width="${midX * 0.7}" height="${h * 0.45}" rx="12" fill="${BRAND.navy}" opacity="0.1"/>
  <text x="${midX * 0.5}" y="${h * 0.5}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.025)}" opacity="0.5">Before Photo</text>
  <rect x="${midX + midX * 0.15}" y="${h * 0.25}" width="${midX * 0.7}" height="${h * 0.45}" rx="12" fill="${BRAND.gold}" opacity="0.15"/>
  <text x="${midX + midX * 0.5}" y="${h * 0.5}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.025)}" opacity="0.5">After Photo</text>
  <text x="${midX * 0.5}" y="${h * 0.15}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.035)}" font-weight="700">BEFORE</text>
  <text x="${midX + midX * 0.5}" y="${h * 0.15}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.035)}" font-weight="700">AFTER</text>
  <rect x="${w * 0.1}" y="${h * 0.78}" width="${w * 0.8}" height="${h * 0.12}" rx="8" fill="${BRAND.navy}"/>
  <text x="${w * 0.5}" y="${h * 0.84}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.03)}" font-weight="700">${escapeXml(s.name)} Results</text>
  <text x="${w * 0.5}" y="${h * 0.88}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.018)}">${escapeXml(BRAND.clinicName)}</text>
  <text x="${w * 0.5}" y="${h * 0.95}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.015)}">${BRAND.url}</text>
</svg>`;
  },

  service_spotlight: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.navy}"/>
  <rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.88}" height="${h * 0.88}" rx="16" fill="none" stroke="${BRAND.gold}" stroke-width="2"/>
  <circle cx="${w * 0.5}" cy="${h * 0.25}" r="${Math.min(w, h) * 0.12}" fill="${BRAND.gold}" opacity="0.15"/>
  <text x="${w * 0.5}" y="${h * 0.28}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.06)}" font-weight="700">✦</text>
  <text x="${w * 0.5}" y="${h * 0.42}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.045)}" font-weight="700">${escapeXml(s.name)}</text>
  ${svgTextLines(wrapText(s.topBenefit, 35), w * 0.5, h * 0.52, h * 0.04, `text-anchor="middle" fill="${BRAND.cream}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.022)}"`)}
  <rect x="${w * 0.25}" y="${h * 0.66}" width="${w * 0.5}" height="${h * 0.08}" rx="40" fill="${BRAND.gold}"/>
  <text x="${w * 0.5}" y="${h * 0.71}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.022)}" font-weight="700">${escapeXml(s.priceRange)}</text>
  <text x="${w * 0.5}" y="${h * 0.82}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="600">Book Now →</text>
  <text x="${w * 0.5}" y="${h * 0.92}" text-anchor="middle" fill="${BRAND.cream}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" opacity="0.7">${escapeXml(BRAND.clinicName)} · ${BRAND.url}</text>
</svg>`,

  testimonial_card: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.cream}"/>
  <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" rx="20" fill="${BRAND.white}" stroke="${BRAND.gold}" stroke-width="1.5"/>
  <text x="${w * 0.5}" y="${h * 0.2}" text-anchor="middle" fill="${BRAND.gold}" font-family="serif" font-size="${Math.round(w * 0.08)}" opacity="0.3">"</text>
  ${svgTextLines(wrapText(`I was amazed by my ${s.name} results. The team at Rani made me feel so confident and cared for.`, 40), w * 0.5, h * 0.35, h * 0.05, `text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.022)}" font-style="italic"`)}
  <text x="${w * 0.5}" y="${h * 0.58}" text-anchor="middle" fill="${BRAND.gold}" font-size="${Math.round(w * 0.025)}">★★★★★</text>
  <text x="${w * 0.5}" y="${h * 0.65}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.018)}" font-weight="600">— Verified ${escapeXml(s.name)} Client</text>
  <line x1="${w * 0.3}" y1="${h * 0.72}" x2="${w * 0.7}" y2="${h * 0.72}" stroke="${BRAND.gold}" stroke-width="1"/>
  <text x="${w * 0.5}" y="${h * 0.8}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.025)}" font-weight="700">${escapeXml(BRAND.clinicName)}</text>
  <text x="${w * 0.5}" y="${h * 0.86}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.015)}" opacity="0.6">${escapeXml(s.socialProofStat)}</text>
</svg>`,

  educational_fact: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.white}"/>
  <rect x="0" y="0" width="${w}" height="${h * 0.06}" fill="${BRAND.gold}"/>
  <text x="${w * 0.5}" y="${h * 0.14}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.03)}" font-weight="700">DID YOU KNOW?</text>
  ${svgTextLines(wrapText(s.results[0] + '. ' + s.results[1] + '.', 40), w * 0.5, h * 0.28, h * 0.05, `text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.022)}"`)}
  <rect x="${w * 0.15}" y="${h * 0.52}" width="${w * 0.7}" height="${h * 0.02}" rx="2" fill="${BRAND.gold}" opacity="0.3"/>
  <text x="${w * 0.5}" y="${h * 0.62}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.032)}" font-weight="700">${escapeXml(s.name)}</text>
  ${svgTextLines(wrapText(s.topBenefit, 40), w * 0.5, h * 0.7, h * 0.04, `text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" opacity="0.8"`)}
  <rect x="${w * 0.3}" y="${h * 0.82}" width="${w * 0.4}" height="${h * 0.07}" rx="30" fill="${BRAND.navy}"/>
  <text x="${w * 0.5}" y="${h * 0.86}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.018)}" font-weight="600">Learn More</text>
  <text x="${w * 0.5}" y="${h * 0.96}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.014)}" opacity="0.5">${escapeXml(BRAND.clinicName)} · ${BRAND.url}</text>
</svg>`,

  seasonal_promo: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${BRAND.navy}"/><stop offset="100%" stop-color="#1a2d42"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#sg)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.15}" r="${Math.min(w, h) * 0.2}" fill="${BRAND.gold}" opacity="0.06"/>
  <circle cx="${w * 0.15}" cy="${h * 0.85}" r="${Math.min(w, h) * 0.15}" fill="${BRAND.gold}" opacity="0.04"/>
  <text x="${w * 0.5}" y="${h * 0.15}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="600" letter-spacing="4">SEASONAL SPECIAL</text>
  <text x="${w * 0.5}" y="${h * 0.35}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.05)}" font-weight="700">${escapeXml(s.name)}</text>
  ${svgTextLines(wrapText(s.topBenefit, 30), w * 0.5, h * 0.48, h * 0.05, `text-anchor="middle" fill="${BRAND.cream}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.022)}"`)}
  <rect x="${w * 0.2}" y="${h * 0.65}" width="${w * 0.6}" height="${h * 0.1}" rx="8" fill="${BRAND.gold}" opacity="0.15"/>
  <text x="${w * 0.5}" y="${h * 0.71}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.035)}" font-weight="700">${escapeXml(s.priceRange)}</text>
  <rect x="${w * 0.3}" y="${h * 0.8}" width="${w * 0.4}" height="${h * 0.07}" rx="30" fill="${BRAND.gold}"/>
  <text x="${w * 0.5}" y="${h * 0.845}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="700">Claim Your Spot</text>
  <text x="${w * 0.5}" y="${h * 0.95}" text-anchor="middle" fill="${BRAND.cream}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.014)}" opacity="0.6">${escapeXml(BRAND.clinicName)} · ${BRAND.location}</text>
</svg>`,

  provider_spotlight: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.cream}"/>
  <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" rx="16" fill="${BRAND.white}"/>
  <circle cx="${w * 0.5}" cy="${h * 0.25}" r="${Math.min(w, h) * 0.1}" fill="${BRAND.navy}" opacity="0.1"/>
  <text x="${w * 0.5}" y="${h * 0.27}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.025)}" opacity="0.4">Provider Photo</text>
  <text x="${w * 0.5}" y="${h * 0.42}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.03)}" font-weight="700">Meet Your Provider</text>
  <text x="${w * 0.5}" y="${h * 0.48}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}">${escapeXml(s.name)} Specialist</text>
  ${svgTextLines(wrapText(`Physician-supervised ${s.name} with personalized care and attention to your unique goals.`, 40), w * 0.5, h * 0.57, h * 0.04, `text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.018)}" opacity="0.7"`)}
  <text x="${w * 0.5}" y="${h * 0.75}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="600">Book with Our Expert →</text>
  <text x="${w * 0.5}" y="${h * 0.88}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.022)}" font-weight="700">${escapeXml(BRAND.clinicName)}</text>
</svg>`,

  treatment_process: (s, w, h) => {
    const steps = [
      { num: '01', label: 'Consultation', desc: 'Personalized assessment' },
      { num: '02', label: 'Treatment', desc: s.timeframe.split(',')[0] || s.timeframe },
      { num: '03', label: 'Results', desc: s.results[0].split('.')[0] },
    ];
    const stepW = w * 0.25;
    const startX = w * 0.12;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.navy}"/>
  <text x="${w * 0.5}" y="${h * 0.12}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" font-weight="600" letter-spacing="3">YOUR ${escapeXml(s.name.toUpperCase())} JOURNEY</text>
  <text x="${w * 0.5}" y="${h * 0.22}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.035)}" font-weight="700">3 Simple Steps</text>
  ${steps.map((step, i) => {
    const cx = startX + i * (stepW + w * 0.03) + stepW / 2;
    return `
    <circle cx="${cx}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.06}" fill="${BRAND.gold}" opacity="0.15"/>
    <text x="${cx}" y="${h * 0.4}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.035)}" font-weight="700">${step.num}</text>
    <text x="${cx}" y="${h * 0.52}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="600">${escapeXml(step.label)}</text>
    <text x="${cx}" y="${h * 0.57}" text-anchor="middle" fill="${BRAND.cream}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.015)}" opacity="0.7">${escapeXml(step.desc)}</text>
    ${i < 2 ? `<line x1="${cx + Math.min(w, h) * 0.07}" y1="${h * 0.38}" x2="${cx + stepW + w * 0.03 - Math.min(w, h) * 0.07}" y2="${h * 0.38}" stroke="${BRAND.gold}" stroke-width="1.5" stroke-dasharray="6,4"/>` : ''}`;
  }).join('')}
  <rect x="${w * 0.3}" y="${h * 0.72}" width="${w * 0.4}" height="${h * 0.08}" rx="30" fill="${BRAND.gold}"/>
  <text x="${w * 0.5}" y="${h * 0.77}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="700">Start Your Journey</text>
  <text x="${w * 0.5}" y="${h * 0.92}" text-anchor="middle" fill="${BRAND.cream}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.014)}" opacity="0.5">${escapeXml(BRAND.clinicName)} · ${BRAND.url}</text>
</svg>`;
  },

  results_timeline: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.white}"/>
  <text x="${w * 0.5}" y="${h * 0.1}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.032)}" font-weight="700">${escapeXml(s.name)} Results Timeline</text>
  <line x1="${w * 0.15}" y1="${h * 0.2}" x2="${w * 0.15}" y2="${h * 0.78}" stroke="${BRAND.gold}" stroke-width="2"/>
  ${['Day 1: Treatment complete', 'Week 1: Initial results visible', 'Month 1: Full results developing', 'Month 3+: Optimal results'].map((item, i) => `
    <circle cx="${w * 0.15}" cy="${h * (0.25 + i * 0.14)}" r="6" fill="${BRAND.gold}"/>
    <text x="${w * 0.22}" y="${h * (0.25 + i * 0.14) + 1}" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="600" dominant-baseline="middle">${escapeXml(item)}</text>
  `).join('')}
  <rect x="${w * 0.15}" y="${h * 0.84}" width="${w * 0.7}" height="${h * 0.08}" rx="8" fill="${BRAND.navy}"/>
  <text x="${w * 0.5}" y="${h * 0.89}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.018)}" font-weight="600">${escapeXml(BRAND.clinicName)} · Book Your ${escapeXml(s.name)} Today</text>
</svg>`,

  luxury_lifestyle: (s, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="lg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${BRAND.cream}"/><stop offset="100%" stop-color="${BRAND.white}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#lg)"/>
  <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.9}" height="${h * 0.55}" rx="16" fill="${BRAND.navy}" opacity="0.04"/>
  <text x="${w * 0.5}" y="${h * 0.35}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" opacity="0.3">Lifestyle Image</text>
  <text x="${w * 0.5}" y="${h * 0.7}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.038)}" font-weight="700">Radiate Confidence</text>
  ${svgTextLines(wrapText(`${s.name} — ${s.topBenefit.toLowerCase()}.`, 35), w * 0.5, h * 0.78, h * 0.04, `text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" opacity="0.7"`)}
  <text x="${w * 0.5}" y="${h * 0.9}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.02)}" font-weight="600">${escapeXml(BRAND.clinicName)} →</text>
</svg>`,

  comparison_chart: (s, w, h) => {
    const rows = [
      ['Results', 'Minimal', 'Clinical-Grade'],
      ['Supervision', 'None', 'Physician'],
      ['Personalization', 'Generic', 'Customized'],
      ['Technology', 'Consumer', 'Medical'],
    ];
    const rowH = h * 0.08;
    const startY = h * 0.35;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.white}"/>
  <text x="${w * 0.5}" y="${h * 0.1}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.headingFont}" font-size="${Math.round(w * 0.03)}" font-weight="700">${escapeXml(s.name)}: Why Choose Rani?</text>
  <text x="${w * 0.35}" y="${h * 0.22}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" font-weight="600" opacity="0.5">At-Home</text>
  <text x="${w * 0.7}" y="${h * 0.22}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" font-weight="600">Rani Beauty Clinic</text>
  <line x1="${w * 0.1}" y1="${h * 0.26}" x2="${w * 0.9}" y2="${h * 0.26}" stroke="${BRAND.gold}" stroke-width="1"/>
  ${rows.map((row, i) => `
    <text x="${w * 0.12}" y="${startY + i * rowH}" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" font-weight="600">${row[0]}</text>
    <text x="${w * 0.35}" y="${startY + i * rowH}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" opacity="0.5">${row[1]}</text>
    <text x="${w * 0.7}" y="${startY + i * rowH}" text-anchor="middle" fill="${BRAND.gold}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.016)}" font-weight="600">${row[2]}</text>
    ${i < rows.length - 1 ? `<line x1="${w * 0.1}" y1="${startY + i * rowH + rowH * 0.4}" x2="${w * 0.9}" y2="${startY + i * rowH + rowH * 0.4}" stroke="${BRAND.cream}" stroke-width="1"/>` : ''}
  `).join('')}
  <rect x="${w * 0.25}" y="${h * 0.78}" width="${w * 0.5}" height="${h * 0.08}" rx="30" fill="${BRAND.navy}"/>
  <text x="${w * 0.5}" y="${h * 0.83}" text-anchor="middle" fill="${BRAND.white}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.018)}" font-weight="600">See the Difference →</text>
  <text x="${w * 0.5}" y="${h * 0.94}" text-anchor="middle" fill="${BRAND.navy}" font-family="${BRAND.bodyFont}" font-size="${Math.round(w * 0.014)}" opacity="0.5">${BRAND.url}</text>
</svg>`;
  },
};

/**
 * Generate SVG visual for a template + service + size
 */
export function generateVisual(template: VisualTemplate, service: ServiceProfile, size: AdSize): GeneratedVisual {
  const dims = AD_SIZES[size];
  const generator = TEMPLATE_GENERATORS[template];
  return {
    template,
    size,
    svg: generator(service, dims.width, dims.height),
    width: dims.width,
    height: dims.height,
    service: service.id,
  };
}

/**
 * Generate all 10 visual templates for a service in a specific size
 */
export function generateAllVisuals(service: ServiceProfile, size: AdSize): GeneratedVisual[] {
  const templates: VisualTemplate[] = [
    'before_after', 'service_spotlight', 'testimonial_card', 'educational_fact',
    'seasonal_promo', 'provider_spotlight', 'treatment_process', 'results_timeline',
    'luxury_lifestyle', 'comparison_chart',
  ];
  return templates.map(t => generateVisual(t, service, size));
}

// ── BATCH GENERATION ──

export interface CreativeBatch {
  service: ServiceProfile;
  copy: GeneratedCopy[];
  headlines: HeadlineVariant[];
  descriptions: DescriptionVariant[];
  dkiTemplates: DKITemplate[];
  rsa: RSACombination;
  visuals: GeneratedVisual[];
  generatedAt: string;
}

/**
 * Generate a complete creative batch: all frameworks, headlines, descriptions,
 * DKI templates, RSA, and visuals in all sizes for a single service
 */
export function generateCreativeBatch(service: ServiceProfile, sizes: AdSize[] = ['feed']): CreativeBatch {
  return {
    service,
    copy: generateAllFrameworks(service),
    headlines: generateHeadlines(service),
    descriptions: generateDescriptions(service),
    dkiTemplates: generateDKITemplates(service),
    rsa: generateRSA(service),
    visuals: sizes.flatMap(size => generateAllVisuals(service, size)),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate creative batches for ALL Rani services
 */
export function generateFullCatalog(sizes: AdSize[] = ['feed']): CreativeBatch[] {
  return RANI_SERVICES.map(s => generateCreativeBatch(s, sizes));
}

/**
 * Get a specific service profile by ID
 */
export function getServiceById(id: string): ServiceProfile | undefined {
  return RANI_SERVICES.find(s => s.id === id);
}

/**
 * Get all available copy frameworks
 */
export function getFrameworks(): { id: CopyFramework; label: string; description: string }[] {
  return [
    { id: 'pas', label: 'PAS', description: 'Problem-Agitate-Solve: Identify pain, amplify it, offer the solution' },
    { id: 'aida', label: 'AIDA', description: 'Attention-Interest-Desire-Action: Classic funnel framework' },
    { id: 'bab', label: 'Before-After-Bridge', description: 'Show transformation from current state to desired state' },
    { id: 'fab', label: 'FAB', description: 'Features-Advantages-Benefits: Technical to emotional progression' },
    { id: 'story', label: 'Story Arc', description: 'Narrative-driven copy with client journey' },
    { id: 'question', label: 'Question Hook', description: 'Opens with compelling questions to engage reader' },
    { id: 'stat', label: 'Stat Hook', description: 'Leads with compelling statistics or social proof data' },
    { id: 'testimonial', label: 'Testimonial', description: 'Client voice-driven copy with quotes' },
    { id: 'social_proof', label: 'Social Proof', description: 'Leverages reviews, ratings, and client numbers' },
    { id: 'urgency', label: 'Urgency', description: 'Ethical urgency via limited slots and availability' },
    { id: 'authority', label: 'Authority', description: 'Physician-supervised credibility and clinical expertise' },
    { id: 'educational', label: 'Educational', description: 'Informative approach that builds trust through knowledge' },
    { id: 'comparison', label: 'Comparison', description: 'Professional vs at-home comparison' },
    { id: 'lifestyle', label: 'Lifestyle', description: 'Aspirational confidence and identity-driven' },
    { id: 'seasonal', label: 'Seasonal', description: 'Time-based seasonal relevance and urgency' },
  ];
}
