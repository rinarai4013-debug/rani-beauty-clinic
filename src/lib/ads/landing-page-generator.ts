/**
 * Ads War Machine - Landing Page Generator
 *
 * Generates dynamic landing page configurations for ad campaigns.
 * Produces hero, problem, solution, pricing, testimonials, FAQ,
 * and CTA sections with UTM tracking and A/B test variants.
 *
 * CRITICAL: Always "injection" - never "infusion."
 */

import { RANI_SERVICES, type ServiceProfile, BRAND } from './creative-engine';
import { SOCIAL_PROOF, TRUST_SIGNALS, CTAS, getCTAsForService } from '@/data/ads/creative-library';

// ── TYPES ──

export type LandingPageTemplate =
  | 'glp1'
  | 'peptide'
  | 'aesthetic_injectable'
  | 'aesthetic_laser'
  | 'aesthetic_facial'
  | 'wellness_injection'
  | 'general_service'
  | 'brand_overview';

export type SectionType =
  | 'hero'
  | 'problem'
  | 'solution'
  | 'social_proof'
  | 'pricing'
  | 'process'
  | 'testimonials'
  | 'faq'
  | 'provider'
  | 'cta'
  | 'comparison'
  | 'guarantee'
  | 'urgency';

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  template: LandingPageTemplate;
  serviceId: string;
  serviceName: string;
  sections: LandingPageSection[];
  utm: UTMConfig;
  conversionTracking: ConversionTrackingConfig;
  mobileOptimizations: MobileOptimization[];
  abTestVariants: LandingPageVariant[];
  performanceScore: number;
}

export interface LandingPageSection {
  type: SectionType;
  order: number;
  headline: string;
  subheadline?: string;
  body: string;
  bullets?: string[];
  cta?: { text: string; url: string };
  image?: { alt: string; description: string };
  badge?: string;
  disclaimer?: string;
}

export interface UTMConfig {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

export interface ConversionTrackingConfig {
  primaryGoal: string;
  secondaryGoals: string[];
  metaPixelEvents: string[];
  googleConversionId?: string;
  googleConversionLabel?: string;
  customEvents: { name: string; trigger: string }[];
}

export interface MobileOptimization {
  element: string;
  optimization: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface LandingPageVariant {
  variantId: string;
  label: string;
  changes: { section: SectionType; field: string; value: string }[];
  hypothesis: string;
}

export interface LandingPagePerformance {
  pageId: string;
  views: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgTimeOnPage: number;
  conversionRate: number;
  leads: number;
  bookings: number;
  costPerLead: number;
  score: number; // 0-100
}

// ── CONSTANTS ──

const CLINIC_INFO = {
  name: 'Rani Beauty Clinic',
  address: '401 Olympia Ave NE, Suite 101, Renton, WA 98056',
  phone: '(425) 555-7264',
  url: 'ranibeautyclinic.com',
  hours: 'Mon-Sat 9AM-6PM',
};

// ── SERVICE DATA FOR LANDING PAGES ──

interface ServiceLandingData {
  serviceId: string;
  template: LandingPageTemplate;
  heroHeadline: string;
  heroSubheadline: string;
  problemStatements: string[];
  solutionPoints: string[];
  process: { step: number; title: string; description: string }[];
  pricing: { label: string; price: string; note?: string }[];
  faqs: { question: string; answer: string }[];
  testimonials: { quote: string; name: string; treatment: string }[];
  complianceDisclaimer: string;
}

const SERVICE_LANDING_DATA: ServiceLandingData[] = [
  {
    serviceId: 'glp1',
    template: 'glp1',
    heroHeadline: 'Medical Weight Loss That Actually Works',
    heroSubheadline: 'Physician-supervised GLP-1 therapy with personalized dosing, weekly check-ins, and real results. Start your transformation at Rani Beauty Clinic in Renton, WA.',
    problemStatements: [
      'You have tried every diet, but the weight keeps coming back',
      'You are tired of programs that treat everyone the same',
      'You want medical guidance, not another meal plan',
      'Your metabolism feels like it is working against you',
    ],
    solutionPoints: [
      'Physician-supervised GLP-1 injections (semaglutide/tirzepatide)',
      'Personalized dosing adjusted to your body and goals',
      'Weekly check-ins with body composition tracking',
      'Nutritional guidance that fits your lifestyle',
      'Ongoing support throughout your transformation',
    ],
    process: [
      { step: 1, title: 'Free Consultation', description: 'Meet with our physician to discuss your goals, medical history, and determine eligibility for GLP-1 therapy.' },
      { step: 2, title: 'Personalized Plan', description: 'Receive a custom dosing schedule, nutrition guidance, and milestone targets tailored to your body.' },
      { step: 3, title: 'Weekly Injections', description: 'Quick weekly IM injections at our clinic with body composition tracking and physician monitoring.' },
      { step: 4, title: 'Ongoing Support', description: 'Regular check-ins, dose adjustments, and celebrating milestones together as you transform.' },
    ],
    pricing: [
      { label: 'GLP-1 Monthly Program', price: 'From $399/mo', note: 'Includes weekly injections, monitoring, and physician oversight' },
      { label: 'Premium Program', price: 'From $599/mo', note: 'Includes additional body composition tracking and nutrition coaching' },
    ],
    faqs: [
      { question: 'Who is eligible for GLP-1 weight loss?', answer: 'GLP-1 therapy is typically recommended for adults with a BMI of 27+ with at least one weight-related condition, or BMI of 30+. Our physician will assess your eligibility during your free consultation.' },
      { question: 'How quickly will I see results?', answer: 'Most patients notice appetite changes within the first 1-2 weeks. Visible weight loss typically occurs within 4-8 weeks. Individual results vary based on starting point, dosage, and lifestyle factors.' },
      { question: 'Are the injections painful?', answer: 'GLP-1 injections use a very fine needle and are administered as quick IM injections. Most patients describe minimal discomfort.' },
      { question: 'Do you accept insurance?', answer: 'Our GLP-1 program is self-pay. We offer Cherry financing for affordable monthly payments. Your consultation is complimentary.' },
      { question: 'What happens if I stop the medication?', answer: 'Our program includes lifestyle guidance to help maintain your results. Your physician will work with you on a maintenance plan tailored to your needs.' },
    ],
    testimonials: [
      { quote: 'I lost 35 lbs in 4 months. The weekly check-ins kept me accountable and the dosing was adjusted perfectly for my body.', name: 'Lisa M.', treatment: 'GLP-1 Program' },
      { quote: 'After years of yo-yo dieting, this is the first program that actually works. The physician supervision makes all the difference.', name: 'Sarah K.', treatment: 'GLP-1 Program' },
      { quote: 'I was skeptical, but the results speak for themselves. Down 25 lbs and I feel amazing.', name: 'Jennifer R.', treatment: 'GLP-1 Program' },
    ],
    complianceDisclaimer: 'Results may vary. GLP-1 therapy requires medical evaluation. Not suitable for everyone. Side effects may include nausea, decreased appetite, and injection site reactions. Consult with our physician to determine if this treatment is right for you.',
  },
  {
    serviceId: 'botox',
    template: 'aesthetic_injectable',
    heroHeadline: 'Expert Botox That Looks Like You, Just Better',
    heroSubheadline: 'Natural-looking results by physician-supervised injection specialists. 15 minutes, zero downtime. Walk-ins welcome at Rani Beauty Clinic in Renton.',
    problemStatements: [
      'Forehead lines making you look tired even when you are not',
      'Crow\'s feet aging your eyes faster than you would like',
      'Frown lines that never relax, even when you are happy',
      'You want prevention, not correction, down the road',
    ],
    solutionPoints: [
      'Expert Botox injections by physician-supervised specialists',
      'Natural results that preserve your expressions',
      '15-minute treatment with zero downtime',
      'Preventative options for clients in their 20s and 30s',
      'Results visible in 3-5 days, lasting 3-4 months',
    ],
    process: [
      { step: 1, title: 'Consultation', description: 'Discuss your concerns and goals. Our specialist maps out a treatment plan for natural results.' },
      { step: 2, title: 'Treatment', description: 'Quick, precise injections tailored to your facial anatomy. Most treatments take 10-15 minutes.' },
      { step: 3, title: 'Results', description: 'See smoothing begin in 3-5 days. Full results visible at 2 weeks. Enjoy your refreshed look.' },
    ],
    pricing: [
      { label: 'Botox', price: '$12-14/unit', note: 'Average treatment: 20-40 units' },
    ],
    faqs: [
      { question: 'Will I look frozen or unnatural?', answer: 'Absolutely not. Our specialists focus on natural results that soften lines while preserving your ability to express emotions. You will look refreshed, not "done."' },
      { question: 'How long does Botox last?', answer: 'Typical results last 3-4 months. Regular treatments can extend results over time as the muscles are retrained.' },
      { question: 'Is Botox safe?', answer: 'Botox has been FDA-approved for cosmetic use since 2002 and has an excellent safety profile. All treatments at Rani are physician-supervised.' },
      { question: 'What is preventative Botox?', answer: 'Starting Botox in your late 20s to early 30s can prevent deep wrinkles from forming. It is one of the most effective anti-aging strategies.' },
    ],
    testimonials: [
      { quote: 'Nobody can tell I got Botox and that is exactly the point. I just look well-rested.', name: 'Diana P.', treatment: 'Botox' },
      { quote: 'I was nervous for my first time, but the team made it so easy. In and out in 15 minutes.', name: 'Ashley T.', treatment: 'Botox' },
    ],
    complianceDisclaimer: 'Results may vary. Botox is a prescription treatment administered by licensed professionals. Side effects may include temporary bruising, headache, or mild discomfort at injection sites. Consult with our provider for personalized recommendations.',
  },
  {
    serviceId: 'hydrafacial',
    template: 'aesthetic_facial',
    heroHeadline: 'The Facial That Actually Delivers',
    heroSubheadline: 'Deep cleanse, exfoliate, and hydrate in one 60-minute session. Walk out glowing. HydraFacial at Rani Beauty Clinic, Renton, WA.',
    problemStatements: [
      'Your skin looks dull and dehydrated despite your skincare routine',
      'Pores are clogged and nothing seems to clear them',
      'Regular facials feel relaxing but never deliver real results',
      'You need a treatment that fits into your busy schedule',
    ],
    solutionPoints: [
      'Patented vortex technology deep-cleans and hydrates simultaneously',
      'Customized serums for your specific skin concerns',
      'Visible results in just one 60-minute session',
      'No downtime, return to normal activities immediately',
      'Addresses fine lines, pores, oiliness, and dehydration',
    ],
    process: [
      { step: 1, title: 'Cleanse & Peel', description: 'Gentle exfoliation uncovers a fresh layer of skin.' },
      { step: 2, title: 'Extract & Hydrate', description: 'Painless suction removes debris while hydrating serums are delivered.' },
      { step: 3, title: 'Fuse & Protect', description: 'Antioxidants and peptides are infused to maximize your glow.' },
    ],
    pricing: [
      { label: 'Signature HydraFacial', price: '$249', note: '60-minute treatment' },
    ],
    faqs: [
      { question: 'How often should I get a HydraFacial?', answer: 'Monthly treatments are ideal for maintaining results. Many clients come every 4-6 weeks.' },
      { question: 'Is there any downtime?', answer: 'None at all. Many clients get HydraFacials during their lunch break and return to work with glowing skin.' },
      { question: 'What skin types is HydraFacial good for?', answer: 'HydraFacial is safe and effective for all skin types, including sensitive skin.' },
    ],
    testimonials: [
      { quote: 'My skin has never looked this good. I get a HydraFacial every month and the results just keep getting better.', name: 'Jennifer R.', treatment: 'HydraFacial' },
    ],
    complianceDisclaimer: 'Results may vary. HydraFacial is a non-invasive treatment suitable for most skin types. Consult with our team if you have active skin conditions.',
  },
  {
    serviceId: 'wellness',
    template: 'wellness_injection',
    heroHeadline: 'One Injection. One Week of Energy.',
    heroSubheadline: 'B12, Glutathione, NAD+, Tri-Immune, and Vitamin D3 injections. Quick IM injections for energy, immunity, and recovery. Walk-ins welcome.',
    problemStatements: [
      'You are running on empty and coffee is not cutting it anymore',
      'PNW weather has your immune system under constant stress',
      'Your body is not recovering like it used to',
      'Oral supplements are not delivering the results you need',
    ],
    solutionPoints: [
      'Direct IM injection for maximum absorption (skip the digestive system)',
      'Feel the difference within hours, not weeks',
      'Full menu: B12, Glutathione, NAD+, Tri-Immune, Vitamin D3',
      'Quick 10-15 minute visits, walk-ins welcome',
      'Physician-supervised with clinical-grade formulations',
    ],
    process: [
      { step: 1, title: 'Choose Your Injection', description: 'Select from our wellness menu based on your needs, or get a recommendation from our team.' },
      { step: 2, title: 'Quick Visit', description: 'In and out in 10-15 minutes. No appointment required for most injections.' },
      { step: 3, title: 'Feel the Difference', description: 'Most clients notice improved energy, clarity, or immune support within hours.' },
    ],
    pricing: [
      { label: 'B12', price: '$35' },
      { label: 'Vitamin D3', price: '$50' },
      { label: 'Tri-Immune Boost', price: '$75' },
      { label: 'Glutathione', price: '$100' },
      { label: 'NAD+', price: '$150-500' },
    ],
    faqs: [
      { question: 'Why injections instead of supplements?', answer: 'IM injections deliver nutrients directly into your body, bypassing the digestive system for near-100% absorption. Oral supplements typically absorb only 20-50%.' },
      { question: 'How often should I get wellness injections?', answer: 'Most clients benefit from weekly or bi-weekly injections. Our team can recommend a schedule based on your goals.' },
      { question: 'Do I need an appointment?', answer: 'Walk-ins are welcome for most wellness injections during business hours. NAD+ sessions should be booked in advance.' },
      { question: 'Are there any side effects?', answer: 'Side effects are rare and typically limited to mild soreness at the injection site. All injections are administered by trained medical professionals.' },
    ],
    testimonials: [
      { quote: 'I get a B12 and Tri-Immune combo every other week. My energy levels and immune health have never been better.', name: 'Mark D.', treatment: 'Wellness Injections' },
    ],
    complianceDisclaimer: 'Results may vary. Wellness injections are not intended to diagnose, treat, cure, or prevent any disease. Individual results depend on health status and lifestyle factors.',
  },
  {
    serviceId: 'peptides',
    template: 'peptide',
    heroHeadline: 'Peptide Therapy for Peak Performance',
    heroSubheadline: 'Physician-supervised BPC-157, Sermorelin, and advanced peptide protocols for recovery, anti-aging, and cellular renewal at Rani Beauty Clinic.',
    problemStatements: [
      'Recovery from workouts or injuries takes longer than it should',
      'Your energy and mental clarity are declining with age',
      'Sleep quality has dropped and it is affecting everything',
      'You want anti-aging that works at the cellular level',
    ],
    solutionPoints: [
      'BPC-157 for accelerated healing and gut health',
      'Sermorelin for natural growth hormone support',
      'NAD+ for cellular repair and mental clarity',
      'Physician-supervised protocols tailored to your goals',
      'Backed by clinical research and administered safely',
    ],
    process: [
      { step: 1, title: 'Consultation', description: 'In-depth assessment of your health goals, bloodwork review, and protocol design.' },
      { step: 2, title: 'Custom Protocol', description: 'Your physician creates a peptide protocol tailored to your specific needs and goals.' },
      { step: 3, title: 'Treatment & Monitoring', description: 'Regular treatment sessions with ongoing monitoring and protocol adjustments.' },
    ],
    pricing: [
      { label: 'NAD+ Injection', price: 'From $150' },
      { label: 'Peptide Therapy Program', price: 'From $400/mo', note: 'Custom protocols with physician monitoring' },
    ],
    faqs: [
      { question: 'What are peptides?', answer: 'Peptides are short chains of amino acids that signal your body to perform specific functions like healing, growth hormone release, or cellular repair.' },
      { question: 'Are peptide therapies safe?', answer: 'When administered by qualified medical professionals, peptide therapies have an excellent safety profile. All protocols at Rani are physician-supervised.' },
      { question: 'How long until I see results?', answer: 'Some benefits (like improved sleep and energy) may be noticed within 1-2 weeks. Full results typically develop over 4-12 weeks depending on the protocol.' },
    ],
    testimonials: [
      { quote: 'Peptide therapy changed my recovery time completely. I feel 10 years younger in terms of energy and performance.', name: 'James R.', treatment: 'Peptide Therapy' },
    ],
    complianceDisclaimer: 'Results may vary. Peptide therapy requires medical evaluation and ongoing supervision. Not a replacement for standard medical care. Individual results depend on health status, protocol, and compliance.',
  },
];

// ── MAIN GENERATOR ──

export function generateLandingPage(config: {
  serviceId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  includeABVariants?: boolean;
}): LandingPage {
  const { serviceId, utmSource, utmMedium, utmCampaign, includeABVariants = true } = config;

  const serviceData = SERVICE_LANDING_DATA.find(s => s.serviceId === serviceId);
  const service = RANI_SERVICES.find(s => s.id === serviceId);

  if (!serviceData || !service) {
    return generateGenericLandingPage(serviceId, utmSource, utmMedium, utmCampaign);
  }

  const sections = buildSections(serviceData, service);
  const utm = buildUTMConfig(utmSource, utmMedium, utmCampaign, serviceId);
  const tracking = buildConversionTracking(serviceId);
  const mobileOpts = buildMobileOptimizations();
  const abVariants = includeABVariants ? buildABVariants(serviceData) : [];
  const score = calculatePageScore(sections);

  const slug = `${serviceId.replace('_', '-')}-${utmSource}-${utmCampaign}`.toLowerCase();

  return {
    id: `lp_${serviceId}_${utmSource}_${Date.now()}`,
    slug,
    title: `${service.name} at Rani Beauty Clinic | Renton, WA`,
    metaTitle: `${service.name} in Renton, WA | Rani Beauty Clinic`,
    metaDescription: serviceData.heroSubheadline.slice(0, 155),
    template: serviceData.template,
    serviceId,
    serviceName: service.name,
    sections,
    utm,
    conversionTracking: tracking,
    mobileOptimizations: mobileOpts,
    abTestVariants: abVariants,
    performanceScore: score,
  };
}

// ── SECTION BUILDER ──

function buildSections(data: ServiceLandingData, service: ServiceProfile): LandingPageSection[] {
  const sections: LandingPageSection[] = [];

  // 1. Hero
  sections.push({
    type: 'hero',
    order: 1,
    headline: data.heroHeadline,
    subheadline: data.heroSubheadline,
    body: '',
    cta: { text: getCTAsForService(data.serviceId)[0]?.text || 'Book Now', url: '/book' },
    badge: 'Physician-Supervised',
    image: { alt: `${service.name} at Rani Beauty Clinic`, description: 'Hero image of clinic interior or treatment room' },
  });

  // 2. Problem
  sections.push({
    type: 'problem',
    order: 2,
    headline: 'Does This Sound Like You?',
    body: 'If any of these resonate, you are not alone. Hundreds of our clients started exactly where you are.',
    bullets: data.problemStatements,
  });

  // 3. Solution
  sections.push({
    type: 'solution',
    order: 3,
    headline: `How ${service.name} at Rani Beauty Clinic Helps`,
    body: `Our physician-supervised ${service.name.toLowerCase()} protocol is designed to deliver visible, lasting results.`,
    bullets: data.solutionPoints,
    image: { alt: `${service.name} treatment process`, description: 'Clean, professional treatment room image' },
  });

  // 4. Social Proof
  const relevantProof = SOCIAL_PROOF.filter(sp => !sp.service || sp.service === data.serviceId);
  sections.push({
    type: 'social_proof',
    order: 4,
    headline: 'Trusted by Thousands',
    body: relevantProof.map(sp => sp.text).join(' | '),
    bullets: TRUST_SIGNALS.slice(0, 4).map(ts => ts.text),
  });

  // 5. Process
  sections.push({
    type: 'process',
    order: 5,
    headline: 'How It Works',
    body: `Getting started with ${service.name} at Rani Beauty Clinic is simple.`,
    bullets: data.process.map(p => `${p.step}. ${p.title}: ${p.description}`),
  });

  // 6. Pricing
  sections.push({
    type: 'pricing',
    order: 6,
    headline: 'Transparent Pricing',
    body: 'No hidden fees. No surprises. Financing available through Cherry for treatments over $400.',
    bullets: data.pricing.map(p => `${p.label}: ${p.price}${p.note ? ` (${p.note})` : ''}`),
    cta: { text: 'Book Your Consultation', url: '/book' },
  });

  // 7. Testimonials
  sections.push({
    type: 'testimonials',
    order: 7,
    headline: 'What Our Clients Say',
    body: data.testimonials.map(t => `"${t.quote}" - ${t.name}, ${t.treatment}`).join('\n\n'),
  });

  // 8. FAQ
  sections.push({
    type: 'faq',
    order: 8,
    headline: 'Frequently Asked Questions',
    body: data.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'),
  });

  // 9. Provider
  sections.push({
    type: 'provider',
    order: 9,
    headline: 'Meet Your Provider Team',
    body: 'Every treatment at Rani Beauty Clinic is physician-supervised by our board-certified team. Your safety and satisfaction are our top priorities.',
    image: { alt: 'Rani Beauty Clinic provider team', description: 'Professional headshots of provider team' },
  });

  // 10. Final CTA
  sections.push({
    type: 'cta',
    order: 10,
    headline: 'Ready to Get Started?',
    subheadline: 'Book your free consultation today. No pressure, just answers.',
    body: `${CLINIC_INFO.name}\n${CLINIC_INFO.address}\n${CLINIC_INFO.phone}\n${CLINIC_INFO.hours}`,
    cta: { text: 'Book Your Free Consultation', url: '/book' },
    disclaimer: data.complianceDisclaimer,
  });

  return sections;
}

// ── GENERIC LANDING PAGE ──

function generateGenericLandingPage(
  serviceId: string,
  utmSource: string,
  utmMedium: string,
  utmCampaign: string,
): LandingPage {
  const service = RANI_SERVICES.find(s => s.id === serviceId);
  const serviceName = service?.name || serviceId;

  const sections: LandingPageSection[] = [
    {
      type: 'hero',
      order: 1,
      headline: `${serviceName} at Rani Beauty Clinic`,
      subheadline: `Physician-supervised ${serviceName.toLowerCase()} treatments in Renton, WA. Book your consultation today.`,
      body: '',
      cta: { text: 'Book Now', url: '/book' },
      badge: 'Physician-Supervised',
    },
    {
      type: 'solution',
      order: 2,
      headline: `Why Choose Rani for ${serviceName}?`,
      body: `Our physician-supervised team delivers ${serviceName.toLowerCase()} with clinical precision and luxury care.`,
      bullets: [
        'Physician-supervised treatments',
        'Personalized treatment plans',
        '5-star rated clinic',
        'Cherry financing available',
      ],
    },
    {
      type: 'cta',
      order: 3,
      headline: 'Book Your Consultation',
      body: `${CLINIC_INFO.name}\n${CLINIC_INFO.address}\n${CLINIC_INFO.phone}`,
      cta: { text: 'Book Now', url: '/book' },
      disclaimer: 'Results may vary. All treatments are physician-supervised. Consult with our team for personalized recommendations.',
    },
  ];

  return {
    id: `lp_generic_${serviceId}_${Date.now()}`,
    slug: `${serviceId}-landing`,
    title: `${serviceName} | Rani Beauty Clinic | Renton, WA`,
    metaTitle: `${serviceName} in Renton, WA | Rani Beauty Clinic`,
    metaDescription: `Physician-supervised ${serviceName.toLowerCase()} at Rani Beauty Clinic in Renton, WA. Book your consultation today.`,
    template: 'general_service',
    serviceId,
    serviceName,
    sections,
    utm: buildUTMConfig(utmSource, utmMedium, utmCampaign, serviceId),
    conversionTracking: buildConversionTracking(serviceId),
    mobileOptimizations: buildMobileOptimizations(),
    abTestVariants: [],
    performanceScore: 60,
  };
}

// ── UTM CONFIG ──

function buildUTMConfig(source: string, medium: string, campaign: string, serviceId: string): UTMConfig {
  return {
    source,
    medium,
    campaign,
    content: serviceId,
    term: serviceId.replace('_', '+'),
  };
}

// ── CONVERSION TRACKING ──

function buildConversionTracking(serviceId: string): ConversionTrackingConfig {
  return {
    primaryGoal: 'consultation_booking',
    secondaryGoals: ['phone_call', 'form_submission', 'chat_initiation'],
    metaPixelEvents: ['Lead', 'Schedule', 'Contact', 'ViewContent'],
    customEvents: [
      { name: 'landing_page_view', trigger: 'Page load' },
      { name: 'scroll_50', trigger: 'User scrolls 50% of page' },
      { name: 'scroll_100', trigger: 'User scrolls to bottom' },
      { name: 'cta_click', trigger: 'User clicks any CTA button' },
      { name: 'faq_expand', trigger: 'User expands any FAQ item' },
      { name: 'phone_click', trigger: 'User clicks phone number link' },
      { name: 'time_on_page_30s', trigger: 'User spends 30+ seconds on page' },
      { name: 'time_on_page_60s', trigger: 'User spends 60+ seconds on page' },
      { name: `service_${serviceId}_interest`, trigger: 'User interacts with service details' },
    ],
  };
}

// ── MOBILE OPTIMIZATIONS ──

function buildMobileOptimizations(): MobileOptimization[] {
  return [
    { element: 'Hero CTA', optimization: 'Sticky bottom CTA bar on mobile (48px+ touch target)', priority: 'critical' },
    { element: 'Phone number', optimization: 'Click-to-call with tel: link and visible phone icon', priority: 'critical' },
    { element: 'Form', optimization: 'Single-column form with large input fields (16px+ font to prevent iOS zoom)', priority: 'critical' },
    { element: 'Images', optimization: 'Next.js Image component with lazy loading and WebP format', priority: 'high' },
    { element: 'Navigation', optimization: 'Collapsed to hamburger with prominent "Book Now" CTA in header', priority: 'high' },
    { element: 'Testimonials', optimization: 'Horizontal scroll carousel on mobile', priority: 'medium' },
    { element: 'FAQ', optimization: 'Accordion with full-width tap targets', priority: 'medium' },
    { element: 'Pricing', optimization: 'Card layout that stacks vertically on mobile', priority: 'medium' },
    { element: 'Social proof', optimization: 'Trust badges in horizontal scroll row above fold', priority: 'high' },
    { element: 'Page speed', optimization: 'Target LCP < 2.5s, FID < 100ms, CLS < 0.1', priority: 'critical' },
  ];
}

// ── A/B TEST VARIANTS ──

function buildABVariants(data: ServiceLandingData): LandingPageVariant[] {
  return [
    {
      variantId: 'variant_headline',
      label: 'Alternative Headline',
      changes: [
        { section: 'hero', field: 'headline', value: data.solutionPoints[0] },
      ],
      hypothesis: 'Benefit-first headline may increase conversion rate by emphasizing the primary value proposition.',
    },
    {
      variantId: 'variant_cta_text',
      label: 'Alternative CTA',
      changes: [
        { section: 'hero', field: 'cta', value: 'See Available Times' },
        { section: 'cta', field: 'cta', value: 'Check My Eligibility' },
      ],
      hypothesis: 'Lower-commitment CTA language may reduce friction and increase click-through rate.',
    },
    {
      variantId: 'variant_social_first',
      label: 'Social Proof Before Problem',
      changes: [
        { section: 'social_proof', field: 'order', value: '2' },
        { section: 'problem', field: 'order', value: '4' },
      ],
      hypothesis: 'Leading with social proof before problem agitation may build trust faster.',
    },
    {
      variantId: 'variant_pricing_above',
      label: 'Pricing Above Process',
      changes: [
        { section: 'pricing', field: 'order', value: '4' },
        { section: 'process', field: 'order', value: '6' },
      ],
      hypothesis: 'Showing pricing earlier may pre-qualify visitors and reduce bounce rate from price-sensitive users.',
    },
  ];
}

// ── PAGE PERFORMANCE SCORING ──

function calculatePageScore(sections: LandingPageSection[]): number {
  let score = 0;

  // Has hero with CTA
  if (sections.some(s => s.type === 'hero' && s.cta)) score += 15;

  // Has problem/solution
  if (sections.some(s => s.type === 'problem')) score += 10;
  if (sections.some(s => s.type === 'solution')) score += 10;

  // Has social proof
  if (sections.some(s => s.type === 'social_proof')) score += 10;

  // Has testimonials
  if (sections.some(s => s.type === 'testimonials')) score += 10;

  // Has pricing
  if (sections.some(s => s.type === 'pricing')) score += 10;

  // Has FAQ
  if (sections.some(s => s.type === 'faq')) score += 10;

  // Has process
  if (sections.some(s => s.type === 'process')) score += 5;

  // Has final CTA
  if (sections.some(s => s.type === 'cta')) score += 10;

  // Has compliance disclaimer
  if (sections.some(s => s.disclaimer)) score += 5;

  // Has provider section
  if (sections.some(s => s.type === 'provider')) score += 5;

  return Math.min(100, score);
}

// ── SCORING UTILITY ──

export function scoreLandingPagePerformance(metrics: {
  bounceRate: number;
  avgTimeOnPage: number;
  conversionRate: number;
  mobileConversionRate: number;
  loadTime: number;
}): { score: number; recommendations: string[] } {
  let score = 50;
  const recs: string[] = [];

  // Bounce rate
  if (metrics.bounceRate < 40) score += 15;
  else if (metrics.bounceRate < 60) score += 5;
  else { score -= 10; recs.push('High bounce rate. Improve hero section and page load speed.'); }

  // Time on page
  if (metrics.avgTimeOnPage > 120) score += 10;
  else if (metrics.avgTimeOnPage > 60) score += 5;
  else { score -= 5; recs.push('Low time on page. Add more engaging content or video.'); }

  // Conversion rate
  if (metrics.conversionRate > 8) score += 20;
  else if (metrics.conversionRate > 5) score += 10;
  else if (metrics.conversionRate > 3) score += 5;
  else { score -= 10; recs.push('Low conversion rate. Test new CTAs, add urgency, or simplify the form.'); }

  // Mobile conversion
  if (metrics.mobileConversionRate > 5) score += 10;
  else if (metrics.mobileConversionRate < 2) { score -= 10; recs.push('Poor mobile conversion. Check mobile UX, form usability, and click-to-call.'); }

  // Load time
  if (metrics.loadTime < 2) score += 10;
  else if (metrics.loadTime < 3) score += 5;
  else { score -= 10; recs.push('Slow page load. Optimize images, defer scripts, enable caching.'); }

  return { score: Math.max(0, Math.min(100, score)), recommendations: recs };
}

// ── BATCH GENERATION ──

export function generateAllLandingPages(
  utmSource: string,
  utmMedium: string,
  utmCampaign: string,
): LandingPage[] {
  const serviceIds = SERVICE_LANDING_DATA.map(s => s.serviceId);
  return serviceIds.map(serviceId =>
    generateLandingPage({ serviceId, utmSource, utmMedium, utmCampaign })
  );
}
