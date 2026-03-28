// =============================================================================
// RaniOS Landing Page Engine
// Auto-generate SaaS marketing content by vertical, pricing, ROI
// =============================================================================

import type {
  Vertical,
  LandingPageContent,
  HeroSection,
  PainPoint,
  FeatureBlock,
  SocialProofSection,
  Testimonial,
  PricingTier,
  PricingSection,
  ComparisonRow,
  FaqItem,
  CtaSection,
  SeoMeta,
  RoiCalculatorInput,
  RoiCalculatorResult,
  RoiBreakdownItem,
  TierSlug,
  TierFeature,
  TierLimits,
} from './types';

// =============================================================================
// Vertical Content Definitions
// =============================================================================

const VERTICAL_CONFIG: Record<Vertical, {
  displayName: string;
  tagline: string;
  painPoints: PainPoint[];
  avgRevenue: number;
  avgProviders: number;
  searchTerms: string[];
}> = {
  medspa: {
    displayName: 'Medical Spa',
    tagline: 'AI-powered operations for modern medspas',
    painPoints: [
      { icon: 'clock', title: 'Hours lost to manual follow-ups', description: 'Your team spends 15+ hours a week on post-treatment calls, appointment reminders, and lead nurturing that should be automated.', solution: 'Automated follow-up sequences and AI phone receptionist handle 80% of communications.' },
      { icon: 'trending-down', title: 'Clients disappearing after first visit', description: 'Over 40% of medspa clients never return after their initial treatment. No systematic retention process exists.', solution: 'Churn prediction flags at-risk clients 30 days before they lapse, triggering targeted reactivation campaigns.' },
      { icon: 'dollar-sign', title: 'No insight into true service profitability', description: 'You know your top-line revenue but not which services actually make money after product costs, labor, and overhead.', solution: 'P&L Intelligence breaks down profitability by service, provider, and month with actionable margin analysis.' },
      { icon: 'calendar', title: 'Schedule gaps draining revenue', description: 'Empty appointment slots during peak hours cost your practice thousands in lost revenue every month.', solution: 'Schedule optimizer detects gaps in real time and suggests fill strategies with revenue potential scoring.' },
    ],
    avgRevenue: 75000,
    avgProviders: 3,
    searchTerms: ['medspa software', 'medical spa management', 'aesthetic clinic software'],
  },
  dental: {
    displayName: 'Dental Practice',
    tagline: 'Intelligent operations for growing dental practices',
    painPoints: [
      { icon: 'phone-missed', title: 'Missed calls turning into lost patients', description: 'Every unanswered call during lunch breaks and after hours is a potential $3,000+ patient walking to a competitor.', solution: 'AI phone receptionist handles calls 24/7, books appointments, and captures leads even outside office hours.' },
      { icon: 'users', title: 'Patients not completing treatment plans', description: 'Treatment acceptance rates hover around 50%. Patients accept during consult but never schedule follow-up procedures.', solution: 'Smart follow-up sequences and treatment plan reminders drive completion rates up 25%.' },
      { icon: 'star', title: 'Inconsistent online reviews', description: 'Happy patients leave silently while unhappy ones write reviews. Your online reputation does not reflect reality.', solution: 'Automated review requests after positive visits and AI-drafted responses to every review within hours.' },
      { icon: 'bar-chart', title: 'No visibility into practice performance', description: 'Monthly reports arrive weeks late. You cannot see daily trends or catch problems before they become costly.', solution: 'Real-time KPI dashboard with revenue anomaly detection and gamified performance tracking.' },
    ],
    avgRevenue: 100000,
    avgProviders: 2,
    searchTerms: ['dental practice management', 'dental software', 'dentist office software'],
  },
  dermatology: {
    displayName: 'Dermatology Practice',
    tagline: 'Advanced analytics for dermatology and skin care',
    painPoints: [
      { icon: 'file-text', title: 'Intake processing consuming clinical time', description: 'Reviewing new patient forms, medical histories, and photos takes 20+ minutes per consult that could be spent treating patients.', solution: 'AI intake intelligence pre-processes every submission, creating clinical summaries with risk flags and treatment suggestions.' },
      { icon: 'shuffle', title: 'Mixed medical and cosmetic workflows', description: 'Managing insurance-based dermatology alongside cash-pay cosmetics requires two different operational mindsets.', solution: 'Dual workflow support with separate analytics, pricing engines, and follow-up sequences for medical vs. cosmetic.' },
      { icon: 'trending-down', title: 'Cosmetic patients not returning for series', description: 'Patients start a laser series but drop off after 2-3 sessions, losing you thousands in planned revenue.', solution: 'Treatment pathway tracking with automated reminders and churn prediction for mid-series patients.' },
      { icon: 'shield', title: 'Reputation management across multiple platforms', description: 'Patients leave reviews on Google, Healthgrades, RealSelf, and Yelp. Monitoring them all is impossible manually.', solution: 'Centralized review monitoring across all platforms with AI-suggested responses and sentiment tracking.' },
    ],
    avgRevenue: 120000,
    avgProviders: 3,
    searchTerms: ['dermatology software', 'derm practice management', 'skin care clinic software'],
  },
  wellness: {
    displayName: 'Wellness Center',
    tagline: 'Holistic operations for wellness practitioners',
    painPoints: [
      { icon: 'repeat', title: 'Clients booking sporadically instead of consistently', description: 'Without a structured retention program, wellness clients visit when they remember rather than on an optimal schedule.', solution: 'AI-powered scheduling suggestions and membership programs keep clients on a consistent care cadence.' },
      { icon: 'credit-card', title: 'Pricing that does not reflect your value', description: 'You set prices based on competitors without understanding your actual cost structure or demand patterns.', solution: 'Dynamic pricing intelligence analyzes demand, costs, and competition to optimize your pricing strategy.' },
      { icon: 'message-square', title: 'No systematic client education', description: 'Clients do not understand the value of continued wellness treatments, leading to high one-and-done rates.', solution: 'Automated educational content sequences tied to each service, building understanding and loyalty over time.' },
      { icon: 'target', title: 'Marketing spend with no clear ROI', description: 'You spend on social media and ads but cannot trace a single dollar of ad spend to an actual booking.', solution: 'Full marketing attribution from ad click to booking, with AI-optimized campaign management.' },
    ],
    avgRevenue: 45000,
    avgProviders: 2,
    searchTerms: ['wellness center software', 'wellness practice management', 'holistic clinic software'],
  },
  chiropractic: {
    displayName: 'Chiropractic Practice',
    tagline: 'Smart practice management for chiropractors',
    painPoints: [
      { icon: 'calendar-x', title: 'No-shows destroying your daily schedule', description: 'With 15-minute adjustment slots, a single no-show creates an awkward gap and lost revenue that cannot be recovered.', solution: 'No-show prediction scores every appointment and triggers targeted reminders for high-risk bookings.' },
      { icon: 'users-x', title: 'Patient drop-off after initial care plan', description: 'Patients complete their acute care phase but fail to transition to maintenance care, cutting lifetime value in half.', solution: 'Intelligent care plan tracking with automated transition messaging and provider talking points.' },
      { icon: 'receipt', title: 'Insurance billing eating into margins', description: 'Processing claims, managing denials, and chasing payments consumes hours of admin time every week.', solution: 'Automated billing workflow tracking with denial management and revenue cycle analytics.' },
      { icon: 'megaphone', title: 'Difficulty attracting new patients', description: 'Word of mouth is inconsistent and paid advertising feels like guesswork without proper tracking.', solution: 'AI-powered marketing with Meta Ads optimization, Google review management, and referral tracking.' },
    ],
    avgRevenue: 55000,
    avgProviders: 1,
    searchTerms: ['chiropractic software', 'chiro practice management', 'chiropractor office software'],
  },
  plastic_surgery: {
    displayName: 'Plastic Surgery Practice',
    tagline: 'Premium operations for surgical aesthetics',
    painPoints: [
      { icon: 'user-check', title: 'High-value consults not converting', description: 'Each surgical consult costs $200+ in provider time. A 40% consult-to-surgery rate means 60% of that investment is wasted.', solution: 'AI consult co-pilot prepares provider briefings, objection handlers, and closing strategies tailored to each patient.' },
      { icon: 'shield', title: 'Managing patient expectations and outcomes', description: 'Inconsistent communication about recovery timelines and results leads to dissatisfied patients and reputation risk.', solution: 'Structured post-op communication sequences with milestone check-ins and outcome documentation.' },
      { icon: 'credit-card', title: 'Financing conversations are awkward', description: 'Discussing $15,000+ procedures requires financial confidence. Staff avoids financing discussions, losing viable patients.', solution: 'Integrated financing comparison tools and scripted financing presentations for front-desk staff.' },
      { icon: 'globe', title: 'Online presence not matching practice quality', description: 'Your surgical results are outstanding but your digital presence does not reflect the premium experience you deliver.', solution: 'AI-generated content engine creates professional social media content showcasing your work and expertise.' },
    ],
    avgRevenue: 200000,
    avgProviders: 2,
    searchTerms: ['plastic surgery software', 'cosmetic surgery management', 'surgical practice software'],
  },
  ophthalmology: {
    displayName: 'Ophthalmology Practice',
    tagline: 'Clear vision for practice operations',
    painPoints: [
      { icon: 'layers', title: 'Managing medical and elective workflows', description: 'Routine eye exams, medical ophthalmology, and elective procedures like LASIK each need different operational flows.', solution: 'Multi-workflow support with separate analytics, scheduling rules, and follow-up sequences per service line.' },
      { icon: 'clock', title: 'Long patient wait times', description: 'Complex diagnostic workflows and equipment bottlenecks create wait times that frustrate patients and hurt reviews.', solution: 'Schedule optimizer balances diagnostic, exam, and procedure slots to minimize bottlenecks and wait times.' },
      { icon: 'refresh-cw', title: 'Annual exam recall is inconsistent', description: 'Patients need annual exams but without a system, thousands of eligible patients go uncontacted each month.', solution: 'Automated recall campaigns triggered by last visit date with personalized outreach per patient segment.' },
      { icon: 'trending-up', title: 'Elective procedure marketing needs work', description: 'LASIK and premium IOL marketing requires different strategies than medical ophthalmology.', solution: 'Dedicated marketing engine for elective procedures with ROI tracking and conversion optimization.' },
    ],
    avgRevenue: 150000,
    avgProviders: 3,
    searchTerms: ['ophthalmology software', 'eye doctor practice management'],
  },
  veterinary: {
    displayName: 'Veterinary Practice',
    tagline: 'Healthy operations for animal care',
    painPoints: [
      { icon: 'bell', title: 'Vaccine and wellness reminders falling through', description: 'Pets due for annual exams and vaccinations slip through the cracks without consistent automated reminders.', solution: 'Automated care schedule tracking with multi-channel reminders (SMS, email, voice) for upcoming preventive care.' },
      { icon: 'phone', title: 'Emergency calls overwhelming regular scheduling', description: 'Urgent cases disrupt the daily schedule, pushing routine appointments and creating client frustration.', solution: 'AI phone triage and smart scheduling that accounts for emergency buffers without wasting capacity.' },
      { icon: 'package', title: 'Inventory management is manual and error-prone', description: 'Tracking medications, vaccines, and supplies across multiple SKUs leads to waste and stockouts.', solution: 'Automated inventory management with reorder alerts, expiration tracking, and usage-based par levels.' },
      { icon: 'heart', title: 'Client loyalty hard to measure and improve', description: 'You cannot identify which clients are at risk of leaving or which ones deserve VIP treatment.', solution: 'Client health scoring with lifetime value calculation, churn prediction, and loyalty program management.' },
    ],
    avgRevenue: 65000,
    avgProviders: 2,
    searchTerms: ['veterinary software', 'vet practice management', 'animal clinic software'],
  },
};

// =============================================================================
// Landing Page Content Generator
// =============================================================================

export function generateLandingPageContent(vertical: Vertical): LandingPageContent {
  const config = VERTICAL_CONFIG[vertical];

  return {
    vertical,
    hero: generateHeroSection(vertical),
    painPoints: config.painPoints,
    features: generateFeatureBlocks(vertical),
    socialProof: generateSocialProof(vertical),
    pricing: generatePricingSection(),
    faq: generateFaqItems(vertical),
    cta: generateCtaSection(vertical),
    seo: generateSeoMeta(vertical),
  };
}

function generateHeroSection(vertical: Vertical): HeroSection {
  const config = VERTICAL_CONFIG[vertical];

  const headlines: Record<Vertical, string> = {
    medspa: 'The AI Operating System Your Medspa Has Been Missing',
    dental: 'Run a Smarter Dental Practice with AI-Powered Operations',
    dermatology: 'Advanced Intelligence for Modern Dermatology Practices',
    wellness: 'Grow Your Wellness Practice on Autopilot',
    chiropractic: 'The Smart Way to Manage Your Chiropractic Practice',
    plastic_surgery: 'Premium Practice Management for Surgical Aesthetics',
    ophthalmology: 'Intelligent Operations for Forward-Thinking Eye Care',
    veterinary: 'Modern Practice Management for Veterinary Professionals',
  };

  return {
    headline: headlines[vertical],
    subheadline: `${config.displayName} owners are using RaniOS to automate operations, predict client behavior, and grow revenue with AI. Join 200+ practices already transforming their business.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'See Demo',
    badgeText: 'Trusted by 200+ practices',
    stats: [
      { label: 'Revenue increase', value: '+32%' },
      { label: 'Time saved weekly', value: '15 hrs' },
      { label: 'Client retention', value: '+28%' },
      { label: 'ROI within', value: '60 days' },
    ],
  };
}

function generateFeatureBlocks(vertical: Vertical): FeatureBlock[] {
  return [
    {
      title: 'AI Intake Intelligence',
      description: 'Every new patient form gets analyzed by AI before they walk in the door. Risk flags, treatment suggestions, and consult scripts prepared automatically.',
      icon: 'brain',
      screenshot: `/screenshots/${vertical}/intake.png`,
      benefits: ['Save 20+ min per new patient', 'Never miss a contraindication', 'Personalized treatment plans instantly'],
    },
    {
      title: 'Predictive Client Analytics',
      description: 'Know which clients are about to leave, which appointments will no-show, and which services are underpriced before it impacts your bottom line.',
      icon: 'activity',
      screenshot: `/screenshots/${vertical}/analytics.png`,
      benefits: ['Churn prediction with 85% accuracy', 'No-show risk scoring', 'Revenue anomaly alerts'],
    },
    {
      title: 'Automated Operations',
      description: 'From post-treatment follow-ups to inventory reordering, every repetitive task runs on autopilot so your team focuses on patient care.',
      icon: 'zap',
      screenshot: `/screenshots/${vertical}/automation.png`,
      benefits: ['19 pre-built automation workflows', 'Smart scheduling optimization', 'Auto-generated content calendar'],
    },
    {
      title: 'Gamified Performance Dashboard',
      description: 'Turn daily operations into a competitive experience. Track clinic scores, provider leaderboards, and achievement milestones that drive results.',
      icon: 'award',
      screenshot: `/screenshots/${vertical}/dashboard.png`,
      benefits: ['Real-time KPI tracking', 'Provider performance rankings', 'Monthly achievement goals'],
    },
    {
      title: 'AI Consult Co-pilot',
      description: 'Walk into every consultation with a complete intelligence briefing. Client history, talking points, objection handlers, and closing strategies at your fingertips.',
      icon: 'message-circle',
      screenshot: `/screenshots/${vertical}/consult.png`,
      benefits: ['Pre-consult client intelligence', 'Treatment plan builder', 'Objection handling scripts'],
    },
    {
      title: 'Marketing Intelligence',
      description: 'Stop guessing with your marketing budget. AI analyzes every ad dollar, generates content, and manages your online reputation across platforms.',
      icon: 'trending-up',
      screenshot: `/screenshots/${vertical}/marketing.png`,
      benefits: ['Meta Ads AI optimization', 'Social content auto-generation', 'Review monitoring + responses'],
    },
  ];
}

// =============================================================================
// Pricing Configuration
// =============================================================================

export function getPricingTiers(): PricingTier[] {
  return [
    {
      slug: 'starter',
      name: 'Starter',
      monthlyPrice: 199,
      annualPrice: 1990,
      description: 'Everything you need to modernize a single-provider practice.',
      highlight: 'Best for solo practitioners',
      features: generateTierFeatures('starter'),
      limits: {
        providers: 1,
        locations: 1,
        apiCalls: 5000,
        storage: '5 GB',
        integrations: 5,
        aiCalls: 1000,
        emailsPerMonth: 2000,
        automations: 5,
      },
      cta: 'Start Free Trial',
      isPopular: false,
    },
    {
      slug: 'pro',
      name: 'Pro',
      monthlyPrice: 499,
      annualPrice: 4990,
      description: 'Full intelligence suite for growing multi-provider practices.',
      highlight: 'Most popular',
      features: generateTierFeatures('pro'),
      limits: {
        providers: 5,
        locations: 2,
        apiCalls: 25000,
        storage: '25 GB',
        integrations: 15,
        aiCalls: 5000,
        emailsPerMonth: 10000,
        automations: 'unlimited',
      },
      cta: 'Start Free Trial',
      isPopular: true,
    },
    {
      slug: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 999,
      annualPrice: 9990,
      description: 'White-label, unlimited scale, and dedicated support for premium practices.',
      highlight: 'Best for multi-location',
      features: generateTierFeatures('enterprise'),
      limits: {
        providers: 'unlimited',
        locations: 'unlimited',
        apiCalls: 'unlimited',
        storage: '100 GB',
        integrations: 'unlimited',
        aiCalls: 'unlimited',
        emailsPerMonth: 'unlimited',
        automations: 'unlimited',
      },
      cta: 'Contact Sales',
      isPopular: false,
    },
  ];
}

function generateTierFeatures(tier: TierSlug): TierFeature[] {
  const all: Array<{ name: string; starter: boolean; pro: boolean; enterprise: boolean; detail: Record<TierSlug, string | null> }> = [
    { name: 'AI Intake Intelligence', starter: true, pro: true, enterprise: true, detail: { starter: 'Basic analysis', pro: 'Full analysis + risk flags', enterprise: 'Custom AI models' } },
    { name: 'Operations Dashboard', starter: true, pro: true, enterprise: true, detail: { starter: 'Core KPIs', pro: 'Full dashboard + gamification', enterprise: 'Custom dashboards' } },
    { name: 'Appointment Management', starter: true, pro: true, enterprise: true, detail: { starter: null, pro: null, enterprise: null } },
    { name: 'Client CRM', starter: true, pro: true, enterprise: true, detail: { starter: 'Basic profiles', pro: '360-degree profiles', enterprise: 'Custom fields + segments' } },
    { name: 'Automated Follow-ups', starter: true, pro: true, enterprise: true, detail: { starter: '3 sequences', pro: '10 sequences', enterprise: 'Unlimited' } },
    { name: 'Churn Prediction', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: '5-factor model', enterprise: 'Custom factors' } },
    { name: 'No-Show Prediction', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: null, enterprise: null } },
    { name: 'Dynamic Pricing', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: '6 strategies', enterprise: 'Custom strategies' } },
    { name: 'Schedule Optimizer', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: null, enterprise: null } },
    { name: 'P&L Intelligence', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: null, enterprise: null } },
    { name: 'Social Content Engine', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: 'Weekly calendar', enterprise: 'Daily + custom' } },
    { name: 'Meta Ads AI', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: null, enterprise: null } },
    { name: 'AI Consult Co-pilot', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: null, enterprise: null } },
    { name: 'AI Phone Receptionist', starter: false, pro: false, enterprise: true, detail: { starter: null, pro: null, enterprise: '24/7 coverage' } },
    { name: 'RAG Knowledge Base', starter: false, pro: false, enterprise: true, detail: { starter: null, pro: null, enterprise: 'Custom documents' } },
    { name: 'White-Label Portal', starter: false, pro: false, enterprise: true, detail: { starter: null, pro: null, enterprise: 'Full branding' } },
    { name: 'Custom Domain', starter: false, pro: false, enterprise: true, detail: { starter: null, pro: null, enterprise: 'SSL included' } },
    { name: 'API Access', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: 'Standard', enterprise: 'Priority + webhooks' } },
    { name: 'Email Support', starter: true, pro: true, enterprise: true, detail: { starter: '48h response', pro: '24h response', enterprise: '4h response' } },
    { name: 'Phone Support', starter: false, pro: true, enterprise: true, detail: { starter: null, pro: 'Business hours', enterprise: '24/7' } },
    { name: 'Dedicated Success Manager', starter: false, pro: false, enterprise: true, detail: { starter: null, pro: null, enterprise: 'Named CSM' } },
    { name: 'SLA Guarantee', starter: false, pro: false, enterprise: true, detail: { starter: null, pro: null, enterprise: '99.9% uptime' } },
  ];

  return all.map((f) => ({
    name: f.name,
    included: f[tier],
    detail: f.detail[tier],
  }));
}

// =============================================================================
// Feature Comparison Table Generator
// =============================================================================

export function generateComparisonTable(): ComparisonRow[] {
  const categories = [
    'AI Intelligence', 'Automation', 'Analytics', 'Platform', 'Support',
  ];

  const features: ComparisonRow[] = [
    { feature: 'AI Intake Intelligence', category: 'AI Intelligence', starter: true, pro: true, enterprise: true },
    { feature: 'Treatment Recommendations', category: 'AI Intelligence', starter: true, pro: true, enterprise: true },
    { feature: 'Churn Prediction Engine', category: 'AI Intelligence', starter: false, pro: true, enterprise: true },
    { feature: 'Dynamic Pricing Intelligence', category: 'AI Intelligence', starter: false, pro: true, enterprise: true },
    { feature: 'Revenue Anomaly Detection', category: 'AI Intelligence', starter: false, pro: true, enterprise: true },
    { feature: 'AI Consult Co-pilot', category: 'AI Intelligence', starter: false, pro: true, enterprise: true },
    { feature: 'RAG Knowledge Base', category: 'AI Intelligence', starter: false, pro: false, enterprise: true },
    { feature: 'Custom AI Model Training', category: 'AI Intelligence', starter: false, pro: false, enterprise: true },
    { feature: 'Automated Follow-up Sequences', category: 'Automation', starter: '3 sequences', pro: '10 sequences', enterprise: 'Unlimited' },
    { feature: 'Review Monitoring + Responses', category: 'Automation', starter: true, pro: true, enterprise: true },
    { feature: 'Schedule Optimizer', category: 'Automation', starter: false, pro: true, enterprise: true },
    { feature: 'Inventory Auto-Management', category: 'Automation', starter: false, pro: true, enterprise: true },
    { feature: 'Social Media Content Engine', category: 'Automation', starter: false, pro: true, enterprise: true },
    { feature: 'AI Phone Receptionist', category: 'Automation', starter: false, pro: false, enterprise: true },
    { feature: 'Custom Workflows', category: 'Automation', starter: false, pro: false, enterprise: true },
    { feature: 'Basic KPI Dashboard', category: 'Analytics', starter: true, pro: true, enterprise: true },
    { feature: 'P&L Financial Intelligence', category: 'Analytics', starter: false, pro: true, enterprise: true },
    { feature: 'Meta Ads AI Manager', category: 'Analytics', starter: false, pro: true, enterprise: true },
    { feature: 'Provider Performance Analytics', category: 'Analytics', starter: false, pro: true, enterprise: true },
    { feature: 'Multi-location Analytics', category: 'Analytics', starter: false, pro: false, enterprise: true },
    { feature: 'Providers', category: 'Platform', starter: '1', pro: 'Up to 5', enterprise: 'Unlimited' },
    { feature: 'Integrations', category: 'Platform', starter: '5', pro: '15', enterprise: 'Unlimited' },
    { feature: 'API Access', category: 'Platform', starter: false, pro: true, enterprise: true },
    { feature: 'White-Label Portal', category: 'Platform', starter: false, pro: false, enterprise: true },
    { feature: 'Custom Domain', category: 'Platform', starter: false, pro: false, enterprise: true },
    { feature: 'Email Support', category: 'Support', starter: '48h', pro: '24h', enterprise: '4h' },
    { feature: 'Phone Support', category: 'Support', starter: false, pro: true, enterprise: true },
    { feature: 'Onboarding Assistance', category: 'Support', starter: false, pro: true, enterprise: true },
    { feature: 'Dedicated Success Manager', category: 'Support', starter: false, pro: false, enterprise: true },
    { feature: 'SLA Guarantee', category: 'Support', starter: false, pro: false, enterprise: '99.9%' },
  ];

  return features;
}

// =============================================================================
// Pricing Page Generator
// =============================================================================

function generatePricingSection(): PricingSection {
  return {
    headline: 'Simple, transparent pricing',
    subheadline: 'Every plan includes a 14-day free trial. No credit card required. Cancel anytime.',
    tiers: getPricingTiers(),
    comparisonTable: generateComparisonTable(),
  };
}

// =============================================================================
// ROI Calculator
// =============================================================================

export function calculateRoi(input: RoiCalculatorInput): RoiCalculatorResult {
  const config = VERTICAL_CONFIG[input.vertical] || VERTICAL_CONFIG.medspa;

  // Revenue increase projections
  const revenueIncreasePercent = 0.25 + (input.noShowRate / 100) * 0.15;
  const projectedRevenueIncrease = Math.round(input.currentMonthlyRevenue * revenueIncreasePercent);

  // Time savings
  const hourlyRate = 45; // avg admin hourly rate
  const timeSavedHours = Math.round(input.hoursOnAdmin * 0.65); // 65% reduction
  const timeSavedValue = timeSavedHours * hourlyRate * 4; // monthly value

  // No-show reduction
  const currentNoShowCost = input.currentMonthlyRevenue * (input.noShowRate / 100);
  const noShowReduction = 0.55; // 55% reduction in no-shows
  const noShowSavings = Math.round(currentNoShowCost * noShowReduction);

  // Admin cost reduction
  const adminCostReduction = Math.round(input.currentSoftwareCost * 0.3);

  // Breakdown items
  const breakdown: RoiBreakdownItem[] = [
    {
      category: 'Revenue Growth',
      currentCost: 0,
      projectedCost: 0,
      savings: projectedRevenueIncrease,
      description: 'Increased bookings from automated follow-ups, better retention, and schedule optimization',
    },
    {
      category: 'Staff Time Savings',
      currentCost: input.hoursOnAdmin * hourlyRate * 4,
      projectedCost: (input.hoursOnAdmin - timeSavedHours) * hourlyRate * 4,
      savings: timeSavedValue,
      description: 'Reduced manual admin work through automation of follow-ups, reminders, and data entry',
    },
    {
      category: 'No-Show Recovery',
      currentCost: Math.round(currentNoShowCost),
      projectedCost: Math.round(currentNoShowCost * (1 - noShowReduction)),
      savings: noShowSavings,
      description: 'Recovered revenue from predictive no-show prevention and targeted reminders',
    },
    {
      category: 'Software Consolidation',
      currentCost: input.currentSoftwareCost,
      projectedCost: input.currentSoftwareCost - adminCostReduction,
      savings: adminCostReduction,
      description: 'Reduced tool sprawl by consolidating multiple subscriptions into one platform',
    },
  ];

  const totalAnnualBenefit = (projectedRevenueIncrease + timeSavedValue + noShowSavings + adminCostReduction) * 12;
  const annualCost = 499 * 12; // Assume Pro plan
  const roiMultiple = Math.round((totalAnnualBenefit / annualCost) * 10) / 10;
  const monthlyBenefit = projectedRevenueIncrease + timeSavedValue + noShowSavings + adminCostReduction;
  const paybackPeriodDays = monthlyBenefit > 0 ? Math.round((499 / monthlyBenefit) * 30) : 999;

  return {
    projectedRevenueIncrease,
    projectedRevenueIncreasePercent: Math.round(revenueIncreasePercent * 100),
    timeSavedHours,
    timeSavedValue,
    noShowReduction: Math.round(noShowReduction * 100),
    noShowSavings,
    adminCostReduction,
    totalAnnualBenefit,
    roiMultiple,
    paybackPeriodDays,
    breakdown,
  };
}

// =============================================================================
// Social Proof
// =============================================================================

function generateSocialProof(vertical: Vertical): SocialProofSection {
  const testimonials: Testimonial[] = [
    {
      id: 'test-1',
      name: 'Dr. Sarah Chen',
      title: 'Medical Director',
      company: 'Luminous Medspa',
      avatar: '/testimonials/sarah-chen.jpg',
      quote: 'RaniOS transformed how we operate. The AI intake intelligence alone saves us 3 hours a day. Our team is focused on patient care instead of paperwork.',
      rating: 5,
      vertical: 'medspa',
      metrics: [{ label: 'Revenue increase', value: '+38%' }, { label: 'Time saved', value: '15 hrs/wk' }],
    },
    {
      id: 'test-2',
      name: 'Dr. Michael Torres',
      title: 'Practice Owner',
      company: 'Coastal Dental Group',
      avatar: '/testimonials/michael-torres.jpg',
      quote: 'The no-show prediction alone paid for the entire subscription in month one. We went from a 22% no-show rate down to 8%.',
      rating: 5,
      vertical: 'dental',
      metrics: [{ label: 'No-show reduction', value: '64%' }, { label: 'Monthly savings', value: '$4,200' }],
    },
    {
      id: 'test-3',
      name: 'Dr. Emily Park',
      title: 'Dermatologist',
      company: 'Park Dermatology',
      avatar: '/testimonials/emily-park.jpg',
      quote: 'The consult co-pilot is like having a business strategist in every room. Our consult-to-treatment conversion went from 45% to 72%.',
      rating: 5,
      vertical: 'dermatology',
      metrics: [{ label: 'Conversion rate', value: '+60%' }, { label: 'Avg ticket', value: '+$420' }],
    },
    {
      id: 'test-4',
      name: 'Jennifer Walsh',
      title: 'Owner',
      company: 'Serenity Wellness Center',
      avatar: '/testimonials/jennifer-walsh.jpg',
      quote: 'We were spending 20 hours a week on admin tasks. RaniOS automated almost all of it. I finally have time to focus on growing the business.',
      rating: 5,
      vertical: 'wellness',
      metrics: [{ label: 'Admin reduction', value: '80%' }, { label: 'Client retention', value: '+34%' }],
    },
  ];

  // Filter for relevant vertical, fall back to all
  const relevant = testimonials.filter((t) => t.vertical === vertical);
  const selected = relevant.length >= 2 ? relevant : testimonials.slice(0, 3);

  return {
    testimonials: selected,
    logos: [
      '/logos/clinic-1.svg', '/logos/clinic-2.svg', '/logos/clinic-3.svg',
      '/logos/clinic-4.svg', '/logos/clinic-5.svg', '/logos/clinic-6.svg',
    ],
    stats: [
      { label: 'Practices using RaniOS', value: '200+' },
      { label: 'AI calls processed monthly', value: '500K+' },
      { label: 'Average revenue increase', value: '32%' },
      { label: 'Average time saved weekly', value: '15 hours' },
    ],
  };
}

// =============================================================================
// FAQ Generator
// =============================================================================

function generateFaqItems(vertical: Vertical): FaqItem[] {
  const config = VERTICAL_CONFIG[vertical];

  return [
    { question: 'How long does setup take?', answer: 'Most practices are fully operational within 48 hours. Our guided onboarding wizard walks you through connecting your existing tools, importing your data, and configuring your AI engines. Enterprise customers get dedicated onboarding support.', category: 'Getting Started' },
    { question: 'Do I need to switch my current practice management software?', answer: 'No. RaniOS works alongside your existing tools (Mangomint, Boulevard, Vagaro, etc.) through direct integrations. We sync data from your current systems to power our AI intelligence layer.', category: 'Getting Started' },
    { question: 'Is my patient data secure?', answer: 'Absolutely. RaniOS is HIPAA-compliant with end-to-end encryption, SOC 2 Type II certification, and strict access controls. Your data is never used to train AI models or shared with third parties.', category: 'Security' },
    { question: 'What happens when my 14-day trial ends?', answer: 'You choose a plan to continue, or your account is paused (not deleted). Your data is preserved for 90 days so you can reactivate anytime. No credit card is required to start the trial.', category: 'Billing' },
    { question: 'Can I switch plans later?', answer: 'Yes. Upgrade instantly and get prorated credit for your current billing period. Downgrades take effect at the next billing cycle. No penalties or lock-in contracts.', category: 'Billing' },
    { question: 'How accurate are the AI predictions?', answer: 'Our churn prediction model achieves 85% accuracy, and no-show predictions are 78% accurate on average. Accuracy improves over time as the system learns from your specific practice patterns.', category: 'AI' },
    { question: `Does it work for ${config.displayName.toLowerCase()} specifically?`, answer: `Yes. RaniOS includes vertical-specific templates, service catalogs, and AI models tuned for ${config.displayName.toLowerCase()} practices. From intake analysis to treatment pathways, everything is tailored to your specialty.`, category: 'Features' },
    { question: 'What kind of support do you offer?', answer: 'Starter plans include email support (48-hour response). Pro plans add phone support during business hours and priority response. Enterprise plans include 24/7 support and a dedicated customer success manager.', category: 'Support' },
  ];
}

// =============================================================================
// CTA Configuration
// =============================================================================

function generateCtaSection(vertical: Vertical): CtaSection {
  const config = VERTICAL_CONFIG[vertical];

  return {
    headline: `Ready to transform your ${config.displayName.toLowerCase()}?`,
    subheadline: 'Start your 14-day free trial today. No credit card required. Full access to all Pro features.',
    buttonText: 'Start Your Free Trial',
    buttonUrl: '/onboarding',
    trialDuration: 14,
    noCardRequired: true,
  };
}

// =============================================================================
// SEO Meta Generator
// =============================================================================

function generateSeoMeta(vertical: Vertical): SeoMeta {
  const config = VERTICAL_CONFIG[vertical];

  return {
    title: `RaniOS for ${config.displayName}s | AI-Powered Practice Management`,
    description: `${config.tagline}. Automate follow-ups, predict client behavior, optimize scheduling, and grow revenue with 12+ AI engines. 14-day free trial.`,
    keywords: [
      ...config.searchTerms,
      'AI practice management', 'clinic automation', 'patient retention software',
      'medspa intelligence', 'healthcare AI', 'practice analytics',
    ],
    ogImage: `/og/${vertical}-landing.png`,
    canonical: `https://ranios.com/${vertical}`,
  };
}

// =============================================================================
// CTA A/B Test Variants
// =============================================================================

export function getCtaVariants(): Array<{
  id: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  variant: 'A' | 'B' | 'C';
}> {
  return [
    {
      id: 'cta-a',
      headline: 'Ready to get started?',
      subheadline: 'Start your 14-day free trial today. No credit card required.',
      buttonText: 'Start Free Trial',
      variant: 'A',
    },
    {
      id: 'cta-b',
      headline: 'See the difference AI makes',
      subheadline: 'Book a personalized demo and see RaniOS with your actual clinic data.',
      buttonText: 'Book My Demo',
      variant: 'B',
    },
    {
      id: 'cta-c',
      headline: 'Calculate your ROI in 60 seconds',
      subheadline: 'Enter your practice stats and see exactly how much RaniOS can save you.',
      buttonText: 'Calculate My ROI',
      variant: 'C',
    },
  ];
}

// =============================================================================
// Available Verticals
// =============================================================================

export function getAvailableVerticals(): Array<{ vertical: Vertical; displayName: string; tagline: string }> {
  return Object.entries(VERTICAL_CONFIG).map(([key, config]) => ({
    vertical: key as Vertical,
    displayName: config.displayName,
    tagline: config.tagline,
  }));
}
