/**
 * AI Consult Co-pilot Engine
 *
 * Real-time consultation assistant that provides treatment recommendations,
 * talking points, cross-sell suggestions, and closing strategies based on
 * client profile, concerns, and conversation context.
 *
 * Capabilities:
 * 1. Pre-consult client intelligence briefing
 * 2. Real-time treatment recommendations during consult
 * 3. Objection handling scripts
 * 4. Cross-sell/upsell suggestions
 * 5. Pricing presentation strategies
 * 6. Closing technique recommendations
 * 7. Post-consult follow-up plan
 */

// ── TYPES ──

export interface ConsultInput {
  client: ClientProfile;
  concerns: string[];
  consultType: 'new_client' | 'existing_client' | 'follow_up' | 'upsell';
  interestedServices?: string[];
  budget?: 'budget' | 'moderate' | 'premium' | 'unknown';
  timeAvailable: number; // minutes
}

export interface ClientProfile {
  name: string;
  age?: number;
  gender?: 'female' | 'male' | 'other';
  skinType?: string;
  previousServices: string[];
  totalSpend: number;
  visitCount: number;
  lastVisit?: string;
  membershipStatus: 'none' | 'active' | 'cancelled';
  churnRisk?: number; // 0-100
  notes?: string;
}

// ── OUTPUT TYPES ──

export interface ConsultCopilotResult {
  clientBriefing: ClientBriefing;
  treatmentPlan: TreatmentPlan;
  talkingPoints: TalkingPoint[];
  objectionHandlers: ObjectionHandler[];
  crossSellOpportunities: CrossSellItem[];
  closingStrategy: ClosingStrategy;
  followUpPlan: FollowUpPlan;
  consultScore: number; // 0-100 potential score
}

export interface ClientBriefing {
  summary: string;
  keyInsights: string[];
  riskFlags: string[];
  opportunities: string[];
  ltv: number;
  segment: 'vip' | 'regular' | 'new' | 'at_risk';
}

export interface TreatmentPlan {
  primary: TreatmentRecommendation;
  alternatives: TreatmentRecommendation[];
  packages: PackageSuggestion[];
  timeline: TimelineStep[];
}

export interface TreatmentRecommendation {
  service: string;
  reason: string;
  price: number;
  duration: number; // minutes
  sessions: number;
  totalInvestment: number;
  results: string;
  downtime: string;
  financingEligible: boolean;
  financingMonthly?: number;
}

export interface PackageSuggestion {
  name: string;
  services: string[];
  price: number;
  savings: number;
  pitch: string;
}

export interface TimelineStep {
  week: number;
  treatment: string;
  description: string;
}

export interface TalkingPoint {
  topic: string;
  script: string;
  timing: 'opening' | 'during' | 'closing';
  priority: 'must_say' | 'should_say' | 'nice_to_say';
}

export interface ObjectionHandler {
  objection: string;
  response: string;
  technique: string; // e.g., "feel-felt-found", "reframe", "social proof"
}

export interface CrossSellItem {
  service: string;
  reason: string;
  script: string;
  addOnPrice: number;
  conversionLikelihood: number; // 0-100
}

export interface ClosingStrategy {
  approach: 'assumptive' | 'choice' | 'urgency' | 'value' | 'trial';
  script: string;
  financingPitch?: string;
  membershipPitch?: string;
  alternativeClose: string;
}

export interface FollowUpPlan {
  sameDay: string;
  nextDay: string;
  oneWeek: string;
  ifNoBook: string;
}

// ── SERVICE DATABASE ──

interface ServiceDetail {
  price: number;
  duration: number;
  sessions: number;
  results: string;
  downtime: string;
  concerns: string[];
  crossSells: string[];
  financingEligible: boolean;
}

// Extended service details for consult copilot (results, downtime, crossSells)
// Pricing/duration/sessions now sourced from unified catalog
import { UNIFIED_CATALOG, type UnifiedService } from '@/data/services/unified-catalog';

const SERVICE_DETAILS: Record<string, Omit<ServiceDetail, 'price' | 'duration' | 'sessions' | 'financingEligible'> & { catalogId?: string }> = {
  'HydraFacial': {
    results: 'Immediate glow, smoother texture, reduced pore size',
    downtime: 'None — can wear makeup same day',
    concerns: ['dull skin', 'congested pores', 'uneven texture', 'dehydration', 'fine lines'],
    crossSells: ['VI Peel', 'Dermaplaning Add-On', 'Red Light Therapy Add-On'],
    catalogId: 'hydrafacial-signature',
  },
  'Botox': {
    results: 'Visible in 3-7 days, full effect at 2 weeks, lasts 3-4 months',
    downtime: 'None — minor redness for 30 min',
    concerns: ['forehead lines', 'crow\'s feet', 'frown lines', 'brow lift', 'preventative aging'],
    crossSells: ['Fillers', 'HydraFacial', 'Skincare'],
  },
  'Fillers': {
    results: 'Immediate volume, natural-looking enhancement, lasts 9-18 months',
    downtime: 'Mild swelling 1-3 days',
    concerns: ['lip volume', 'cheek definition', 'nasolabial folds', 'jawline', 'under-eye hollows'],
    crossSells: ['Botox', 'HydraFacial', 'Skincare'],
  },
  'VI Peel': {
    results: 'Visible peeling days 3-5, new skin by day 7, series for optimal results',
    downtime: '5-7 days peeling, no social downtime after day 3',
    concerns: ['acne', 'hyperpigmentation', 'sun damage', 'melasma', 'uneven tone'],
    crossSells: ['HydraFacial', 'Medical-Grade Skincare Kit', 'PRX-T33'],
    catalogId: 'vi-peel',
  },
  'RF Microneedling': {
    results: 'Progressive improvement over 3-6 months, collagen remodeling',
    downtime: '2-3 days redness, can wear makeup after 24 hours',
    concerns: ['acne scars', 'fine lines', 'skin laxity', 'pore size', 'stretch marks'],
    crossSells: ['HydraFacial', 'PRX-T33', 'Sofwave'],
    catalogId: 'rf-micro-face',
  },
  'Laser Hair Removal': {
    results: '80-90% permanent reduction after full series',
    downtime: 'Mild redness 24 hours',
    concerns: ['unwanted hair', 'ingrown hairs', 'shaving irritation', 'smooth skin'],
    crossSells: ['HydraFacial', 'BioRePeel'],
    catalogId: 'lhr-full-brazilian',
  },
  'Sofwave': {
    results: 'Gradual tightening over 3-6 months, peak results at 12 weeks',
    downtime: 'None to minimal — mild swelling 24-48 hours',
    concerns: ['skin tightening', 'jowls', 'neck laxity', 'brow lift', 'non-surgical facelift'],
    crossSells: ['Botox', 'Fillers', 'HydraFacial'],
    catalogId: 'sofwave-full-face',
  },
  'GLP-1': {
    results: '15-20% body weight loss over 6-12 months',
    downtime: 'None',
    concerns: ['weight loss', 'obesity', 'metabolic health', 'body composition'],
    crossSells: ['Vitamin B12 Injection', 'NAD+ Injection', 'Body Composition Analysis'],
    catalogId: 'glp1-semaglutide-m1',
  },
  'ND:Yag Laser Facial': {
    results: 'Clearer skin in 1-2 weeks, full results after series of 3',
    downtime: '24-48 hours mild redness',
    concerns: ['acne', 'rosacea', 'sun damage', 'fine lines', 'acne scarring'],
    crossSells: ['HydraFacial', 'VI Peel', 'PRX-T33'],
    catalogId: 'laser-facial-ndyag',
  },
  'PRX-T33': {
    results: 'Immediate glow, progressive collagen stimulation over 2-4 weeks',
    downtime: 'None — no peeling, no social downtime',
    concerns: ['dull skin', 'aging', 'hyperpigmentation', 'acne scars', 'stretch marks'],
    crossSells: ['HydraFacial', 'RF Microneedling', 'Tretinoin'],
    catalogId: 'prx-t33',
  },
  'BioRePeel': {
    results: 'Instant radiance, progressive improvement over 7-10 days',
    downtime: 'None — zero downtime peel',
    concerns: ['dull skin', 'acne', 'aging', 'large pores', 'uneven texture'],
    crossSells: ['HydraFacial', 'VI Peel', 'Medical-Grade Skincare Kit'],
    catalogId: 'biorepeel-face',
  },
  'NAD+ Injection': {
    results: 'Energy boost within hours, cognitive clarity, cellular repair',
    downtime: 'None',
    concerns: ['fatigue', 'brain fog', 'aging', 'recovery', 'longevity'],
    crossSells: ['Vitamin B12 Injection', 'Glutathione Injection', 'Sermorelin'],
    catalogId: 'nad-injection',
  },
};

// Build SERVICE_DB by merging catalog pricing with copilot details
const SERVICE_DB: Record<string, ServiceDetail> = {};

for (const [name, details] of Object.entries(SERVICE_DETAILS)) {
  const catalogEntry = details.catalogId
    ? UNIFIED_CATALOG.find((s: UnifiedService) => s.id === details.catalogId)
    : undefined;

  if (details.catalogId && !catalogEntry) {
    console.warn(`[copilot-engine] Catalog ID not found: "${details.catalogId}" for "${name}". Using fallback pricing.`);
  }

  SERVICE_DB[name] = {
    price: catalogEntry?.price ?? (name === 'Botox' ? 350 : name === 'Fillers' ? 650 : 225),
    duration: catalogEntry?.duration ?? 30,
    sessions: catalogEntry?.sessions ?? 1,
    financingEligible: catalogEntry?.financingEligible ?? false,
    results: details.results,
    downtime: details.downtime,
    concerns: details.concerns,
    crossSells: details.crossSells,
  };
}

// ── OBJECTION TEMPLATES ──

const COMMON_OBJECTIONS: Record<string, { response: string; technique: string }> = {
  'too expensive': {
    response: 'I completely understand — investing in yourself is a big decision. Many of our clients felt the same way initially, but found that the results were worth every penny. We also offer Cherry financing where you can split this into affordable monthly payments. Would you like me to show you what that would look like?',
    technique: 'feel-felt-found + financing bridge',
  },
  'need to think about it': {
    response: 'Absolutely, I want you to feel 100% confident in your decision. What specific questions can I help answer while you\'re here? Sometimes the things we\'re unsure about are the easiest to address face-to-face.',
    technique: 'isolate the objection',
  },
  'not sure it works': {
    response: 'That\'s a great question — I love that you want to be informed. Let me show you some of our before-and-after results from clients with similar concerns. We also have over 125 five-star Google reviews from real clients.',
    technique: 'social proof + evidence',
  },
  'want to compare prices': {
    response: 'I appreciate you doing your research — that shows you take this seriously. Here\'s what sets us apart: physician-supervised care, medical-grade equipment, and a team that treats this as medical practice, not just beauty. Our results and safety record reflect that quality.',
    technique: 'value reframe',
  },
  'scared of needles': {
    response: 'You\'re definitely not alone — many of our clients shared that concern before their first treatment. We use numbing cream and our providers are incredibly gentle. Most clients say they barely felt anything. Would it help to start with a smaller treatment area to see how comfortable you are?',
    technique: 'normalize + gradual commitment',
  },
  'need to ask partner': {
    response: 'Of course, it\'s great that you make decisions together. If it would help, I can prepare a summary of the treatment plan and pricing that you can share. Would it be helpful if I also included some before-and-after photos they could see?',
    technique: 'enable the conversation',
  },
};

// ── ENGINE ──

export function generateConsultCopilot(input: ConsultInput): ConsultCopilotResult {
  const clientBriefing = buildClientBriefing(input);
  const treatmentPlan = buildTreatmentPlan(input);
  const talkingPoints = generateTalkingPoints(input);
  const objectionHandlers = prepareObjectionHandlers(input);
  const crossSellOpportunities = identifyCrossSells(input, treatmentPlan);
  const closingStrategy = determineClosingStrategy(input, treatmentPlan);
  const followUpPlan = createFollowUpPlan(input);
  const consultScore = calculateConsultScore(input, treatmentPlan);

  return {
    clientBriefing,
    treatmentPlan,
    talkingPoints,
    objectionHandlers,
    crossSellOpportunities,
    closingStrategy,
    followUpPlan,
    consultScore,
  };
}

// ── CLIENT BRIEFING ──

function buildClientBriefing(input: ConsultInput): ClientBriefing {
  const { client } = input;
  const insights: string[] = [];
  const riskFlags: string[] = [];
  const opportunities: string[] = [];

  // Segment
  let segment: ClientBriefing['segment'] = 'new';
  if (client.totalSpend > 5000) segment = 'vip';
  else if (client.visitCount > 3) segment = 'regular';
  else if ((client.churnRisk || 0) > 60) segment = 'at_risk';

  // Insights
  if (client.visitCount > 0) {
    insights.push(`Returning client — ${client.visitCount} visits, $${client.totalSpend.toLocaleString()} lifetime spend`);
  }
  if (client.previousServices.length > 0) {
    insights.push(`Previous services: ${client.previousServices.join(', ')}`);
  }
  if (client.membershipStatus === 'active') {
    insights.push('Active Angel Glow member — offer member pricing');
  }
  if (client.age && client.age < 30) {
    insights.push('Under 30 — great candidate for preventative treatments');
  }
  if (client.age && client.age > 45) {
    insights.push('45+ — focus on results-driven treatments (Sofwave, RF Microneedling)');
  }

  // Risk flags
  if (client.churnRisk && client.churnRisk > 60) {
    riskFlags.push(`High churn risk (${client.churnRisk}/100) — prioritize retention strategies`);
  }
  if (client.membershipStatus === 'cancelled') {
    riskFlags.push('Cancelled membership — understand why and consider win-back offer');
  }
  if (client.lastVisit) {
    const daysSince = Math.ceil(
      (new Date().getTime() - new Date(client.lastVisit).getTime()) / 86400000
    );
    if (daysSince > 90) riskFlags.push(`${daysSince} days since last visit — re-engagement priority`);
  }

  // Opportunities
  const unusedServices = Object.keys(SERVICE_DB).filter(
    s => !client.previousServices.includes(s)
  );
  if (unusedServices.length > 0) {
    opportunities.push(`Cross-sell opportunity: Client hasn't tried ${unusedServices.slice(0, 3).join(', ')}`);
  }
  if (client.membershipStatus === 'none' && client.visitCount >= 2) {
    opportunities.push('Membership conversion candidate — 2+ visits, no current membership');
  }
  if (client.totalSpend > 1000 && client.membershipStatus !== 'active') {
    opportunities.push(`High spender ($${client.totalSpend.toLocaleString()}) — VIP treatment, loyalty offer`);
  }

  // LTV estimate
  const avgVisitValue = client.visitCount > 0 ? client.totalSpend / client.visitCount : 300;
  const estimatedLTV = Math.round(avgVisitValue * 12); // projected annual

  const summary = input.consultType === 'new_client'
    ? `New client consultation. Focus on building rapport, understanding goals, and presenting a clear treatment pathway.`
    : `Returning client (${client.visitCount} visits). ${segment === 'vip' ? 'VIP treatment — white glove experience.' : segment === 'at_risk' ? 'At risk of churning — retention focus.' : 'Focus on deepening relationship and expanding services.'}`;

  return {
    summary,
    keyInsights: insights,
    riskFlags,
    opportunities,
    ltv: estimatedLTV,
    segment,
  };
}

// ── TREATMENT PLAN ──

function buildTreatmentPlan(input: ConsultInput): TreatmentPlan {
  // Match concerns to services
  const matchedServices = matchConcernsToServices(input.concerns);

  // Sort by relevance
  const sorted = matchedServices.sort((a, b) => b.score - a.score);

  const primary = buildRecommendation(sorted[0]?.service || 'HydraFacial');
  const alternatives = sorted.slice(1, 3).map(s => buildRecommendation(s.service));

  // Build packages
  const packages: PackageSuggestion[] = [];
  if (sorted.length >= 2) {
    const svc1 = SERVICE_DB[sorted[0].service];
    const svc2 = SERVICE_DB[sorted[1].service];
    if (svc1 && svc2) {
      const totalPrice = svc1.price + svc2.price;
      const packagePrice = Math.round(totalPrice * 0.85);
      packages.push({
        name: 'Personalized Glow Package',
        services: [sorted[0].service, sorted[1].service],
        price: packagePrice,
        savings: totalPrice - packagePrice,
        pitch: `Based on your goals, I recommend combining ${sorted[0].service} and ${sorted[1].service}. Together they address your concerns comprehensively, and as a package you save $${totalPrice - packagePrice}.`,
      });
    }
  }

  // Build timeline
  const timeline: TimelineStep[] = [
    { week: 0, treatment: primary.service, description: `Start with ${primary.service} — ${primary.results}` },
  ];
  if (alternatives.length > 0) {
    timeline.push({
      week: 4,
      treatment: alternatives[0].service,
      description: `Add ${alternatives[0].service} to address remaining concerns`,
    });
  }
  timeline.push({
    week: 8,
    treatment: 'Follow-up',
    description: 'Assessment visit — evaluate results and adjust plan',
  });

  return { primary, alternatives, packages, timeline };
}

function matchConcernsToServices(concerns: string[]): { service: string; score: number }[] {
  const scores = new Map<string, number>();

  for (const concern of concerns) {
    const lowerConcern = concern.toLowerCase();

    for (const [service, details] of Object.entries(SERVICE_DB)) {
      const matchScore = details.concerns.reduce((score, svcConcern) => {
        if (lowerConcern.includes(svcConcern.toLowerCase()) || svcConcern.toLowerCase().includes(lowerConcern)) {
          return score + 1;
        }
        return score;
      }, 0);

      if (matchScore > 0) {
        scores.set(service, (scores.get(service) || 0) + matchScore);
      }
    }
  }

  return Array.from(scores.entries())
    .map(([service, score]) => ({ service, score }))
    .sort((a, b) => b.score - a.score);
}

function buildRecommendation(serviceName: string): TreatmentRecommendation {
  const svc = SERVICE_DB[serviceName] || SERVICE_DB['HydraFacial'];
  const totalInvestment = svc.price * svc.sessions;

  return {
    service: serviceName,
    reason: `Directly addresses your concerns with proven results`,
    price: svc.price,
    duration: svc.duration,
    sessions: svc.sessions,
    totalInvestment,
    results: svc.results,
    downtime: svc.downtime,
    financingEligible: svc.financingEligible,
    financingMonthly: svc.financingEligible ? Math.round(totalInvestment / 6) : undefined,
  };
}

// ── TALKING POINTS ──

function generateTalkingPoints(input: ConsultInput): TalkingPoint[] {
  const points: TalkingPoint[] = [];
  const { client } = input;

  // Opening
  if (input.consultType === 'new_client') {
    points.push({
      topic: 'Welcome & Rapport',
      script: `Welcome to Rani Beauty Clinic, ${client.name}! I'm so glad you're here. Before we dive into anything, I'd love to hear more about what brought you in today and what your goals are.`,
      timing: 'opening',
      priority: 'must_say',
    });
  } else {
    points.push({
      topic: 'Client Recognition',
      script: `Great to see you again, ${client.name}! ${client.previousServices.length > 0 ? `How have you been feeling since your last ${client.previousServices[client.previousServices.length - 1]}?` : 'How have you been?'}`,
      timing: 'opening',
      priority: 'must_say',
    });
  }

  // During - Concerns
  points.push({
    topic: 'Active Listening',
    script: 'Tell me more about that — when did you first notice this concern, and how does it affect your confidence?',
    timing: 'during',
    priority: 'must_say',
  });

  // Social proof
  points.push({
    topic: 'Social Proof',
    script: `We see so many clients with similar concerns, and the results have been incredible. We have over 125 five-star Google reviews, and our physicians oversee every treatment plan.`,
    timing: 'during',
    priority: 'should_say',
  });

  // Physician oversight
  points.push({
    topic: 'Medical Authority',
    script: 'One thing that sets us apart is that every treatment plan is designed and supervised by our medical director, Dr. Landfield. You\'re getting medical-grade care in a luxury setting.',
    timing: 'during',
    priority: 'should_say',
  });

  // Financing mention
  if (input.budget === 'budget' || input.budget === 'unknown') {
    points.push({
      topic: 'Financing Bridge',
      script: 'We also partner with Cherry for 0% financing on treatments over $500. Many of our clients find this makes it easier to invest in the full treatment plan right away.',
      timing: 'closing',
      priority: 'should_say',
    });
  }

  // Membership
  if (client.membershipStatus !== 'active') {
    points.push({
      topic: 'Membership Introduction',
      script: 'Have you heard about our Angel Glow membership? It includes monthly treatments, exclusive pricing, and priority booking. It\'s the best way to maintain your results consistently.',
      timing: 'closing',
      priority: 'nice_to_say',
    });
  }

  return points;
}

// ── OBJECTION HANDLERS ──

function prepareObjectionHandlers(input: ConsultInput): ObjectionHandler[] {
  const handlers: ObjectionHandler[] = [];

  for (const [objection, handler] of Object.entries(COMMON_OBJECTIONS)) {
    handlers.push({
      objection,
      response: handler.response,
      technique: handler.technique,
    });
  }

  // Add budget-specific handler
  if (input.budget === 'budget') {
    handlers.unshift({
      objection: 'I have a limited budget',
      response: `I totally understand. Let\'s find the best treatment within your comfort zone. We can start with a single treatment and build from there. ${input.interestedServices?.some(s => SERVICE_DB[s]?.financingEligible) ? 'We also have 0% financing through Cherry if you\'d like to spread the investment.' : ''}`,
      technique: 'meet them where they are',
    });
  }

  return handlers;
}

// ── CROSS-SELL ──

function identifyCrossSells(input: ConsultInput, plan: TreatmentPlan): CrossSellItem[] {
  const crossSells: CrossSellItem[] = [];
  const primaryService = SERVICE_DB[plan.primary.service];

  if (!primaryService) return crossSells;

  for (const crossSellName of primaryService.crossSells) {
    const crossSellService = SERVICE_DB[crossSellName];
    if (!crossSellService) continue;

    // Skip if client already does this service regularly
    if (input.client.previousServices.includes(crossSellName)) continue;

    const likelihood = calculateCrossSellLikelihood(input, crossSellName);

    crossSells.push({
      service: crossSellName,
      reason: `Complements ${plan.primary.service} for enhanced results`,
      script: `Since you're doing ${plan.primary.service}, many of our clients also love adding ${crossSellName}. It really amplifies the results, especially for ${crossSellService.concerns[0] || 'overall skin health'}.`,
      addOnPrice: crossSellService.price,
      conversionLikelihood: likelihood,
    });
  }

  return crossSells.sort((a, b) => b.conversionLikelihood - a.conversionLikelihood);
}

function calculateCrossSellLikelihood(input: ConsultInput, service: string): number {
  let likelihood = 40;

  // VIP clients more likely to add on
  if (input.client.totalSpend > 3000) likelihood += 20;

  // Members more likely
  if (input.client.membershipStatus === 'active') likelihood += 15;

  // Budget awareness
  if (input.budget === 'premium') likelihood += 15;
  if (input.budget === 'budget') likelihood -= 20;

  // Lower cost add-ons more likely
  const svc = SERVICE_DB[service];
  if (svc && svc.price < 100) likelihood += 10;

  return Math.max(10, Math.min(90, likelihood));
}

// ── CLOSING STRATEGY ──

function determineClosingStrategy(input: ConsultInput, plan: TreatmentPlan): ClosingStrategy {
  const totalValue = plan.primary.totalInvestment;
  const isHighTicket = totalValue > 1000;
  const isNewClient = input.consultType === 'new_client';

  let approach: ClosingStrategy['approach'];
  let script = '';
  let financingPitch: string | undefined;
  let membershipPitch: string | undefined;

  if (isNewClient && !isHighTicket) {
    approach = 'assumptive';
    script = `Based on everything we discussed, ${plan.primary.service} is going to be perfect for you. Let me get you scheduled — do you prefer mornings or afternoons?`;
  } else if (isHighTicket) {
    approach = 'value';
    script = `The total investment for your ${plan.primary.service} ${plan.primary.sessions > 1 ? 'series' : 'treatment'} is $${totalValue.toLocaleString()}. When you think about the confidence and results you'll get — and that this is physician-supervised care — it's an investment in yourself that pays dividends every day. Should we get started?`;
    financingPitch = `We also have 0% financing through Cherry. That would make this just $${plan.primary.financingMonthly || Math.round(totalValue / 6)}/month — less than a daily coffee. Want me to check what you qualify for? It takes 30 seconds.`;
  } else if (input.client.membershipStatus !== 'active' && input.client.visitCount >= 2) {
    approach = 'choice';
    script = `Would you like to book just today's ${plan.primary.service}, or would you like to look at our Angel Glow membership? As a member, you'd get this treatment at a better price plus monthly benefits.`;
    membershipPitch = 'Our Angel Glow members save an average of 15% on treatments, plus you get priority booking and exclusive member events.';
  } else {
    approach = 'assumptive';
    script = `Let's get you scheduled for your ${plan.primary.service}. We have openings this week — what works best for you?`;
  }

  const alternativeClose = `If you'd like to start smaller, we could begin with just a single ${plan.primary.service} session ($${plan.primary.price}) and see how you love the results before committing to the full plan.`;

  return { approach, script, financingPitch, membershipPitch, alternativeClose };
}

// ── FOLLOW-UP PLAN ──

function createFollowUpPlan(input: ConsultInput): FollowUpPlan {
  const { client } = input;

  return {
    sameDay: `Send personalized text: "Hi ${client.name}, it was great meeting you today! Here's a summary of what we discussed: [treatment plan]. Let me know if you have any questions!"`,
    nextDay: `Follow-up text with before/after photos relevant to their concerns. Include direct booking link.`,
    oneWeek: `If no booking: "Hi ${client.name}, just checking in! We're holding our [current promotion] for a few more days. Would you like to take advantage of it?"`,
    ifNoBook: `Add to reactivation sequence. Tag concerns in CRM for retargeting. Consider offering a "consult credit" — $50 off first treatment within 30 days.`,
  };
}

// ── CONSULT SCORE ──

function calculateConsultScore(input: ConsultInput, plan: TreatmentPlan): number {
  let score = 50;

  // Higher value = higher potential
  if (plan.primary.totalInvestment > 2000) score += 15;
  else if (plan.primary.totalInvestment > 500) score += 10;

  // Returning clients close at higher rate
  if (input.client.visitCount > 3) score += 15;
  else if (input.client.visitCount > 0) score += 8;

  // Members have higher conversion
  if (input.client.membershipStatus === 'active') score += 10;

  // Known budget helps
  if (input.budget === 'premium') score += 10;
  if (input.budget !== 'unknown') score += 5;

  // Multiple concerns = more opportunity
  if (input.concerns.length > 2) score += 5;

  // Specific interest shows intent
  if (input.interestedServices && input.interestedServices.length > 0) score += 10;

  return Math.min(100, score);
}
