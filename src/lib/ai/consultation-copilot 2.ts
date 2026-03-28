/**
 * Live Consultation Copilot
 *
 * Real-time consultation assistant providing:
 * - Treatment suggestions during consultation
 * - Objection handling scripts (price, pain, downtime, "I need to think about it")
 * - Upsell/cross-sell prompts
 * - Medical history red flags
 * - Insurance/financing talking points
 * - Competitor comparison responses
 * - Closing techniques for medical aesthetics
 * - Post-consultation follow-up template generation
 * - Consultation scoring (conversion likelihood)
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type {
  ConsultationContext,
  ConsultationCopilotResult,
  RealTimeSuggestion,
  CopilotObjectionHandler,
  UpsellPrompt,
  MedicalFlag,
  FinancingPoint,
  CompetitorResponse,
  ClosingTechnique,
  FollowUpTemplate,
  ConversionScore,
  ConversionFactor,
  EngagementSignal,
  ClientProfile,
  SkinConcern,
} from '@/types/ai-treatment';
import { CONCERN_MAP, COMBINATION_LIBRARY } from './treatment-advisor';

// ── OBJECTION HANDLER DATABASE ──

const OBJECTION_HANDLERS: CopilotObjectionHandler[] = [
  // Price objections
  {
    objection: 'That\'s more than I expected to spend',
    category: 'price',
    response: 'I completely understand — investing in your skin is a significant decision. Let me show you how this breaks down per session. Many of our clients find that when they compare what they spend on products that aren\'t working, this treatment actually saves money while delivering real, visible results.',
    technique: 'reframe',
    followUp: 'Would you like me to show you our package pricing or membership options? Most of our clients save 10-15% that way.',
  },
  {
    objection: 'I can\'t afford it right now',
    category: 'price',
    response: 'I hear you, and the last thing we want is for finances to stand between you and feeling confident in your skin. We have financing through Cherry that lets you spread payments over 6-12 months — many clients pay as little as $75-150 per month for their entire treatment plan.',
    technique: 'enable',
    followUp: 'The application takes about 60 seconds and doesn\'t affect your credit score to check. Would you like to see what you qualify for?',
  },
  {
    objection: 'That\'s cheaper at another clinic',
    category: 'price',
    response: 'Price is important, and I\'m glad you\'re doing your research. What we find is that the expertise of the provider and the quality of products used make the real difference in your results. All our treatments use genuine, FDA-approved products and are performed by an experienced, physician-supervised provider. When you factor in the quality of your results and the safety of your experience, you\'re actually getting incredible value.',
    technique: 'social_proof',
    followUp: 'Would you like to see some before-and-after photos from our actual clients? The results speak for themselves.',
  },
  // Pain objections
  {
    objection: 'I\'m worried about the pain',
    category: 'pain',
    response: 'That\'s completely normal to be concerned about, and I appreciate you sharing that. We use the best numbing techniques available — most of our clients are pleasantly surprised at how comfortable the treatment actually is. On a scale of 1-10, most patients rate the discomfort at a 2-3, and it\'s over quickly.',
    technique: 'normalize',
    followUp: 'Would it help if I walked you through exactly what you\'ll feel at each step? Knowledge really does take away the anxiety.',
  },
  {
    objection: 'Will this hurt?',
    category: 'pain',
    response: 'Great question — comfort is something we take very seriously here. We use premium numbing cream and our provider has a very gentle technique. Most clients describe the sensation as a slight pinch that lasts just a moment. Many of our clients say it was much easier than they expected.',
    technique: 'feel-felt-found',
    followUp: 'We also have options to make it even more comfortable if you\'d like. The most important thing is that you feel relaxed and cared for.',
  },
  // Downtime objections
  {
    objection: 'I can\'t have any downtime',
    category: 'downtime',
    response: 'Absolutely — we have excellent zero-downtime options. Botox, HydraFacial, and Sofwave all have literally no downtime. You can go right back to work, pick up the kids, or head to dinner after your appointment.',
    technique: 'reframe',
    followUp: 'Let me show you which of these would be the best fit for your specific concerns. Zero downtime doesn\'t mean zero results!',
  },
  {
    objection: 'I have an event coming up, is there enough time?',
    category: 'downtime',
    response: 'Great timing — let\'s work backwards from your event date to create the perfect timeline. For zero-downtime glow, HydraFacial is our go-to for 1-3 days before. For injectables, we recommend at least 2 weeks before so any minor swelling resolves and results are at their peak.',
    technique: 'reframe',
    followUp: 'When is your event? I\'ll create a custom countdown plan so you look absolutely stunning.',
  },
  // Think about it
  {
    objection: 'I need to think about it',
    category: 'think_about_it',
    response: 'Of course — this is an important decision and I want you to feel completely confident. What I find is that most people who say they need to think about it have one specific question or concern that we haven\'t addressed yet. Is there anything specific that\'s holding you back?',
    technique: 'isolate',
    followUp: 'I\'ll send you a summary of everything we discussed today, including your personalized plan and pricing. That way you have all the details at your fingertips. Can I also book a tentative follow-up? There\'s no obligation — just to hold a spot for you.',
  },
  {
    objection: 'I want to talk to my partner/spouse first',
    category: 'think_about_it',
    response: 'That\'s totally reasonable — it\'s great that you make decisions together. What I\'d love to do is send you a clear summary with photos, pricing, and the treatment plan so you can share it with them. Many of our clients\' partners are really supportive once they see the plan — it shows how thoughtful the approach is.',
    technique: 'enable',
    followUp: 'Would it be helpful if I included some before-and-after examples in what I send you? Visuals really help explain what we\'re proposing.',
  },
  // Competitor
  {
    objection: 'I\'m comparing with another clinic',
    category: 'competitor',
    response: 'I think that\'s smart — you should absolutely compare. What I can tell you is that at Rani Beauty Clinic, every treatment is physician-supervised, we use only premium products, and we take the time to create a personalized plan rather than a one-size-fits-all approach. Our results speak for themselves.',
    technique: 'social_proof',
    followUp: 'What clinic are you comparing with? I\'d love to help you understand the differences so you can make the best decision for yourself.',
  },
  // Skepticism
  {
    objection: 'I\'ve had a bad experience before',
    category: 'skepticism',
    response: 'I\'m so sorry to hear that — unfortunately, not all clinics hold themselves to the same standards. Can you share what happened? I want to understand your concerns so we can make sure your experience here is completely different. Our approach is conservative and safety-first — we always under-promise and over-deliver.',
    technique: 'feel-felt-found',
    followUp: 'Would it help to start with something small and low-commitment, like a HydraFacial? You\'ll get to experience our level of care firsthand with zero risk.',
  },
  {
    objection: 'Do these treatments actually work?',
    category: 'skepticism',
    response: 'I love that question — healthy skepticism is actually a sign of a great client. These treatments are backed by decades of clinical research and FDA clearance. But I\'d rather show you than tell you — let me pull up some actual before-and-after photos from clients with similar concerns to yours.',
    technique: 'social_proof',
    followUp: 'We also have hundreds of 5-star reviews from real clients. Want me to show you some of the reviews from people who had the same treatment we\'re discussing?',
  },
  // Timing
  {
    objection: 'I don\'t have time for multiple sessions',
    category: 'timing',
    response: 'Time is our most valuable resource — I completely get it. The good news is that many of our most popular treatments are done in under 30 minutes. We also offer combination treatments so you can address multiple concerns in a single visit, maximizing your time.',
    technique: 'reframe',
    followUp: 'Let me show you a streamlined plan that gets the most impact with the fewest visits. We\'re experts at working with busy schedules.',
  },
];

// ── COMPETITOR RESPONSES ──

const COMPETITOR_RESPONSES: CompetitorResponse[] = [
  {
    competitor: 'LaserAway',
    commonClaim: 'They offer cheaper laser hair removal packages',
    ourAdvantage: 'Physician-supervised treatments with customized protocols, premium devices, and personalized attention — not a conveyor-belt model.',
    response: 'LaserAway is a large chain that operates on volume. At Rani, every treatment is physician-supervised and personally tailored to your skin type. We use the latest technology and never rush through treatments. Our results consistently outperform chain clinics because of that personalized attention.',
  },
  {
    competitor: 'Groupon/Deal Sites',
    commonClaim: 'I found a similar treatment for 70% less on Groupon',
    ourAdvantage: 'Guaranteed authentic products, experienced providers, and actual results — not discounted treatments from clinics that need deal sites to fill chairs.',
    response: 'We strongly recommend caution with Groupon aesthetic treatments. The discount often comes from using diluted products, less experienced providers, or cutting corners on safety. Your face and health deserve premium care. We price our treatments to reflect the quality of products and expertise you receive.',
  },
  {
    competitor: 'Med Spa Chains',
    commonClaim: 'They have more locations and bigger brand names',
    ourAdvantage: 'Boutique experience with consistent provider relationship, personalized treatment plans, and VIP-level attention at every visit.',
    response: 'Boutique clinics like Rani offer something chain med spas cannot — a real relationship with your provider who knows your face, your goals, and your history. You\'re never just a number here. Our provider sees your entire journey and adjusts your plan as you progress.',
  },
  {
    competitor: 'At-Home Devices',
    commonClaim: 'I can buy a microneedling/LED device and do it at home',
    ourAdvantage: 'Professional-grade treatments deliver 10-50x more results than at-home devices. There\'s simply no comparison in efficacy.',
    response: 'At-home devices can be a nice supplement to professional treatments, but they\'re a completely different level of intensity and results. Our RF microneedling, for example, reaches depths and energy levels that are impossible to replicate at home. Think of it like brushing your teeth vs. going to the dentist — both are important, but they serve different purposes.',
  },
  {
    competitor: 'DIY/Natural Remedies',
    commonClaim: 'I\'d rather use natural products and home remedies',
    ourAdvantage: 'Evidence-based treatments with clinical data showing real, measurable results — complementary to a healthy lifestyle.',
    response: 'A healthy lifestyle and good skincare are absolutely foundational — we fully support that. Professional treatments complement those efforts by doing what topicals simply cannot: stimulating collagen deep in the skin, precisely targeting muscle movement, and restoring volume. They work together for the best possible results.',
  },
];

// ── CLOSING TECHNIQUES ──

const CLOSING_TECHNIQUES: ClosingTechnique[] = [
  {
    name: 'Assumptive Close',
    approach: 'assumptive',
    script: 'Based on everything we\'ve discussed, I think the best next step is to get you scheduled for your first treatment. Would Tuesday or Thursday work better for your schedule?',
    bestFor: 'Clients who are engaged, asking detailed questions, and showing positive body language',
  },
  {
    name: 'Choice Close',
    approach: 'choice',
    script: 'You have two great options: we could start with the Botox to address the forehead lines first, or the HydraFacial series for overall skin health. Both are excellent starting points — which feels right for you?',
    bestFor: 'Clients who seem overwhelmed by options or are comparing multiple treatments',
  },
  {
    name: 'Urgency Close',
    approach: 'urgency',
    script: 'Since you mentioned your anniversary in 8 weeks, if we start this week, your results will be at their absolute peak for your celebration. The timing is actually perfect.',
    bestFor: 'Clients with an upcoming event or seasonal consideration',
  },
  {
    name: 'Value Close',
    approach: 'value',
    script: 'When you add up what you\'re currently spending on products that aren\'t giving you results — probably $100-200/month — this treatment plan at $XX/month is actually comparable, but with results you can actually see and feel.',
    bestFor: 'Clients who are value-conscious and need ROI framing',
  },
  {
    name: 'Trial Close',
    approach: 'trial',
    script: 'I know it can feel like a big commitment. What if we start with just one session — think of it as a test drive? You\'ll see the quality of care, meet our provider, and experience the results firsthand. No pressure, no obligation for more.',
    bestFor: 'First-time clients, skeptical clients, or those who need a low-risk entry point',
  },
  {
    name: 'Summary Close',
    approach: 'summary',
    script: 'So to recap: we\'re addressing your top concern of [X] with [treatment], you\'ll see results within [timeframe], and with our membership, you\'re looking at $XX/month. This is a plan that\'s going to make you feel amazing. Shall we get you booked?',
    bestFor: 'After a thorough consultation when all concerns have been addressed',
  },
];

// ── MAIN COPILOT FUNCTION ──

export function generateConsultationCopilot(context: ConsultationContext): ConsultationCopilotResult {
  const suggestions = generateSuggestions(context);
  const objectionHandlers = selectRelevantObjections(context);
  const upsellPrompts = generateUpsells(context);
  const medicalFlags = checkMedicalFlags(context.client);
  const financingPoints = generateFinancingPoints(context);
  const competitorResponses = COMPETITOR_RESPONSES;
  const closingTechniques = selectClosingTechniques(context);
  const followUpTemplates = generateFollowUpTemplates(context);
  const conversionScore = calculateConversionScore(context);

  return {
    suggestions,
    objectionHandlers,
    upsellPrompts,
    medicalFlags,
    financingTalkingPoints: financingPoints,
    competitorResponses,
    closingTechniques,
    followUpTemplates,
    conversionScore,
  };
}

// ── SUGGESTION GENERATION ──

function generateSuggestions(context: ConsultationContext): RealTimeSuggestion[] {
  const suggestions: RealTimeSuggestion[] = [];
  const { client, interestedServices = [], consultType } = context;
  let idCounter = 1;

  // Primary treatment suggestions based on concerns
  for (const concern of client.concerns.slice(0, 3)) {
    const mapping = CONCERN_MAP[concern];
    if (!mapping) continue;

    const topTreatment = mapping.treatments[0];
    suggestions.push({
      id: `sug-${idCounter++}`,
      type: 'treatment',
      title: topTreatment.name,
      suggestion: `Recommend ${topTreatment.name} for their ${concern.replace(/_/g, ' ')} concern`,
      reasoning: `This is our highest-rated treatment for ${concern.replace(/_/g, ' ')} with a ${topTreatment.fitScoreBase}% fit score.`,
      relevanceScore: topTreatment.fitScoreBase,
      timing: 'now',
    });
  }

  // Combination suggestion
  if (client.concerns.length >= 2) {
    const combo = findBestCombination(client.concerns);
    if (combo) {
      suggestions.push({
        id: `sug-${idCounter++}`,
        type: 'treatment',
        title: combo.name,
        suggestion: `Suggest the "${combo.name}" combination protocol`,
        reasoning: combo.synergy,
        relevanceScore: 88,
        timing: 'later_in_consult',
      });
    }
  }

  // Skincare add-on
  suggestions.push({
    id: `sug-${idCounter++}`,
    type: 'skincare',
    title: 'Professional Skincare Consultation',
    suggestion: 'Recommend a tailored at-home skincare routine to maximize treatment results',
    reasoning: 'Clients with professional skincare routines see 30-40% better treatment outcomes.',
    relevanceScore: 75,
    timing: 'later_in_consult',
  });

  // Membership pitch (for non-members)
  if (consultType === 'new_client' || (client.treatmentHistory && client.treatmentHistory.length === 0)) {
    suggestions.push({
      id: `sug-${idCounter++}`,
      type: 'membership',
      title: 'Rani Membership',
      suggestion: 'Introduce membership benefits — 10% off all treatments, priority booking, exclusive events',
      reasoning: 'New clients who join membership have 3x higher lifetime value and 60% higher retention.',
      relevanceScore: 82,
      timing: 'later_in_consult',
    });
  }

  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function findBestCombination(concerns: SkinConcern[]): typeof COMBINATION_LIBRARY[0] | undefined {
  // Score each combination by how many of the client's concerns it addresses
  const scored = COMBINATION_LIBRARY.map(combo => {
    let relevance = 0;
    for (const concern of concerns) {
      const mapping = CONCERN_MAP[concern];
      if (!mapping) continue;
      for (const t of mapping.treatments) {
        if (combo.treatments.some(ct => t.name.includes(ct) || ct.includes(t.name.split(' — ')[0]))) {
          relevance++;
        }
      }
    }
    return { combo, relevance };
  });

  const best = scored.sort((a, b) => b.relevance - a.relevance)[0];
  return best && best.relevance > 0 ? best.combo : undefined;
}

// ── OBJECTION SELECTION ──

function selectRelevantObjections(context: ConsultationContext): CopilotObjectionHandler[] {
  const relevant: CopilotObjectionHandler[] = [];

  // Always include price objections
  relevant.push(...OBJECTION_HANDLERS.filter(o => o.category === 'price'));

  // Include based on client type
  if (context.consultType === 'new_client') {
    relevant.push(...OBJECTION_HANDLERS.filter(o => o.category === 'skepticism'));
    relevant.push(...OBJECTION_HANDLERS.filter(o => o.category === 'think_about_it'));
  }

  // Include based on pain tolerance
  if (context.client.painTolerance === 'low') {
    relevant.push(...OBJECTION_HANDLERS.filter(o => o.category === 'pain'));
  }

  // Include downtime objections
  if (context.client.downtimeAvailability === 'none' || context.client.downtimeAvailability === 'minimal') {
    relevant.push(...OBJECTION_HANDLERS.filter(o => o.category === 'downtime'));
  }

  // Include competitor objections if they mentioned comparing
  if (context.engagementSignals?.some(s => s.type === 'compared_competitor')) {
    relevant.push(...OBJECTION_HANDLERS.filter(o => o.category === 'competitor'));
  }

  // Deduplicate
  const seen = new Set<string>();
  return relevant.filter(o => {
    if (seen.has(o.objection)) return false;
    seen.add(o.objection);
    return true;
  });
}

// ── UPSELL GENERATION ──

function generateUpsells(context: ConsultationContext): UpsellPrompt[] {
  const upsells: UpsellPrompt[] = [];
  const { interestedServices = [], client } = context;

  // HydraFacial add-on for any treatment
  if (!interestedServices.includes('HydraFacial')) {
    upsells.push({
      currentService: interestedServices[0] || 'any treatment',
      suggestedAddOn: 'HydraFacial — Signature',
      pitch: 'Add a HydraFacial to today\'s visit for an instant glow boost. It\'s the perfect complement to any treatment and takes just 30 minutes.',
      addedValue: 'Immediate visible radiance + deep hydration that enhances the results of your primary treatment',
      additionalCost: 275,
      conversionLikelihood: 45,
    });
  }

  // Botox upsell for filler clients
  if (interestedServices.some(s => s.toLowerCase().includes('filler'))) {
    upsells.push({
      currentService: 'Dermal Fillers',
      suggestedAddOn: 'Botox',
      pitch: 'Adding Botox to your filler treatment creates a complete rejuvenation. While fillers restore volume, Botox relaxes the muscles that create wrinkles — together, they\'re more powerful than either alone.',
      addedValue: 'Comprehensive anti-aging addressing both volume loss AND dynamic wrinkles in one visit',
      additionalCost: 350,
      conversionLikelihood: 60,
    });
  }

  // Lip flip for lip filler clients
  if (interestedServices.some(s => s.toLowerCase().includes('lip'))) {
    upsells.push({
      currentService: 'Lip Filler',
      suggestedAddOn: 'Botox Lip Flip',
      pitch: 'Add a lip flip for just $150 — it makes your lip filler look even better by gently rolling the upper lip outward, showing more of that beautiful volume.',
      addedValue: 'Enhanced lip appearance with subtle upper lip eversion that perfectly complements your filler',
      additionalCost: 150,
      conversionLikelihood: 55,
    });
  }

  // Wellness injection add-on
  upsells.push({
    currentService: interestedServices[0] || 'any treatment',
    suggestedAddOn: 'NAD+ or B12 Injection',
    pitch: 'While you\'re here, add a quick wellness injection — NAD+ for cellular energy or B12 for a vitality boost. Takes just 5 minutes and makes your visit even more worthwhile.',
    addedValue: 'Energy boost + cellular health support that enhances your overall wellness and treatment outcomes',
    additionalCost: 50,
    conversionLikelihood: 40,
  });

  // Skincare add-on
  if (client.lifestyleFactors?.skincare === 'none' || client.lifestyleFactors?.skincare === 'basic') {
    upsells.push({
      currentService: interestedServices[0] || 'any treatment',
      suggestedAddOn: 'Prescription Skincare (Tretinoin)',
      pitch: 'To maximize your treatment results, I\'d love to set you up with prescription-strength skincare. Tretinoin is the gold standard — it\'s what every dermatologist recommends and it makes every other treatment work better.',
      addedValue: 'Medical-grade skincare that extends treatment results, improves skin quality daily, and prevents future aging',
      additionalCost: 99,
      conversionLikelihood: 35,
    });
  }

  return upsells.sort((a, b) => b.conversionLikelihood - a.conversionLikelihood);
}

// ── MEDICAL FLAGS ──

function checkMedicalFlags(client: ClientProfile): MedicalFlag[] {
  const flags: MedicalFlag[] = [];
  const mh = client.medicalHistory;

  if (mh.pregnant) {
    flags.push({
      flag: 'PREGNANCY — Most treatments contraindicated',
      severity: 'critical',
      action: 'Do not proceed with injectables, energy devices, or chemical treatments. HydraFacial and gentle facials may be appropriate.',
      relatedTreatments: ['All injectables', 'RF Microneedling', 'Sofwave', 'Chemical Peels', 'Laser treatments'],
    });
  }

  if (mh.breastfeeding) {
    flags.push({
      flag: 'BREASTFEEDING — Many treatments contraindicated',
      severity: 'critical',
      action: 'Avoid injectables and energy-based devices. Gentle facial treatments may be appropriate.',
      relatedTreatments: ['All injectables', 'RF Microneedling', 'Chemical Peels'],
    });
  }

  if (mh.bloodThinners) {
    flags.push({
      flag: 'Blood thinner use — Increased bruising risk',
      severity: 'warning',
      action: 'Verify if patient can safely discontinue 7 days before injectable treatments. Consult prescribing physician.',
      relatedTreatments: ['Botox', 'Dermal Fillers'],
    });
  }

  if (mh.autoimmune) {
    flags.push({
      flag: 'Autoimmune condition — Requires physician clearance',
      severity: 'warning',
      action: 'Obtain physician clearance before filler treatments. Monitor for unusual reactions. Consider test area first.',
      relatedTreatments: ['Dermal Fillers'],
    });
  }

  if (mh.keloidHistory) {
    flags.push({
      flag: 'History of keloid scarring',
      severity: 'warning',
      action: 'Perform test patch before RF microneedling or chemical peels. Conservative approach recommended.',
      relatedTreatments: ['RF Microneedling', 'Chemical Peels', 'Laser treatments'],
    });
  }

  if (mh.isotretinoin) {
    flags.push({
      flag: 'Recent isotretinoin (Accutane) use',
      severity: 'critical',
      action: 'Must wait 6 months after completing isotretinoin before resurfacing treatments. Injectables and HydraFacial are safe.',
      relatedTreatments: ['RF Microneedling', 'Chemical Peels', 'Laser Hair Removal'],
    });
  }

  if (mh.activeSkinInfection) {
    flags.push({
      flag: 'Active skin infection in treatment area',
      severity: 'critical',
      action: 'Do not treat until infection is fully resolved. Reschedule appointment.',
      relatedTreatments: ['All treatments'],
    });
  }

  if (mh.allergies.length > 0) {
    flags.push({
      flag: `Known allergies: ${mh.allergies.join(', ')}`,
      severity: 'info',
      action: 'Verify no cross-reactivity with treatment products. Document in chart.',
      relatedTreatments: ['Review all planned treatments'],
    });
  }

  if (mh.recentSunExposure) {
    flags.push({
      flag: 'Recent significant sun exposure',
      severity: 'warning',
      action: 'Wait 2-4 weeks before laser/peel treatments. Assess for active tan.',
      relatedTreatments: ['Chemical Peels', 'Laser Hair Removal', 'PicoWay'],
    });
  }

  return flags;
}

// ── FINANCING ──

function generateFinancingPoints(context: ConsultationContext): FinancingPoint[] {
  const points: FinancingPoint[] = [];
  const estimatedTotalCost = estimateTreatmentCost(context);

  if (estimatedTotalCost >= 500) {
    points.push({
      option: 'Cherry Financing — 6 months',
      monthlyPayment: Math.round(estimatedTotalCost / 6),
      term: '6 months',
      talkingPoint: `With Cherry financing, you can spread your investment over 6 months at just $${Math.round(estimatedTotalCost / 6)}/month. Quick application, same-day approval, and it doesn\'t affect your credit score to check.`,
    });
  }

  if (estimatedTotalCost >= 1000) {
    points.push({
      option: 'Cherry Financing — 12 months',
      monthlyPayment: Math.round(estimatedTotalCost / 12),
      term: '12 months',
      talkingPoint: `For maximum flexibility, 12-month financing brings your payment to just $${Math.round(estimatedTotalCost / 12)}/month — that\'s less than many people spend on their daily coffee habit.`,
    });
  }

  points.push({
    option: 'Rani Membership',
    monthlyPayment: 199,
    term: 'Ongoing monthly',
    talkingPoint: 'Our $199/month membership includes 10% off all treatments, priority booking, and exclusive member events. Most regular clients save $500-1,000 per year with membership.',
  });

  return points;
}

function estimateTreatmentCost(context: ConsultationContext): number {
  let total = 0;
  for (const concern of context.client.concerns.slice(0, 3)) {
    const mapping = CONCERN_MAP[concern];
    if (mapping && mapping.treatments.length > 0) {
      total += mapping.treatments[0].price * mapping.treatments[0].sessions;
    }
  }
  return total || 500;
}

// ── CLOSING TECHNIQUES ──

function selectClosingTechniques(context: ConsultationContext): ClosingTechnique[] {
  const techniques: ClosingTechnique[] = [];

  // Always include assumptive and summary
  techniques.push(...CLOSING_TECHNIQUES.filter(t => t.approach === 'assumptive' || t.approach === 'summary'));

  // Trial close for new/skeptical clients
  if (context.consultType === 'new_client') {
    techniques.push(...CLOSING_TECHNIQUES.filter(t => t.approach === 'trial'));
  }

  // Value close for budget-conscious
  if (context.client.budget === 'essential' || context.client.budget === 'value') {
    techniques.push(...CLOSING_TECHNIQUES.filter(t => t.approach === 'value'));
  }

  // Urgency close if event mentioned
  if (context.engagementSignals?.some(s => s.type === 'mentioned_event')) {
    techniques.push(...CLOSING_TECHNIQUES.filter(t => t.approach === 'urgency'));
  }

  // Choice close for undecided
  techniques.push(...CLOSING_TECHNIQUES.filter(t => t.approach === 'choice'));

  // Deduplicate
  const seen = new Set<string>();
  return techniques.filter(t => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

// ── FOLLOW-UP TEMPLATES ──

function generateFollowUpTemplates(context: ConsultationContext): FollowUpTemplate[] {
  const clientName = context.client.name.split(' ')[0];

  return [
    {
      timing: 'same_day',
      channel: 'sms',
      body: `Hi ${clientName}! It was wonderful meeting you today at Rani Beauty Clinic. I put together your personalized treatment plan — check your email for all the details. If any questions come up, I\'m just a text away! 💫`,
    },
    {
      timing: 'same_day',
      channel: 'email',
      subject: `Your Personalized Treatment Plan — ${clientName}`,
      body: `Dear ${clientName},\n\nThank you for your consultation today at Rani Beauty Clinic. It was a pleasure discussing your aesthetic goals and creating a personalized plan for you.\n\nBased on our conversation, here\'s a summary of what we discussed:\n\n[Treatment plan details]\n\nI\'ve also included information about our financing options and membership program in case those interest you.\n\nWe\'re holding a spot for you on [date] — just reply to this email or give us a call to confirm.\n\nLooking forward to being part of your transformation journey!\n\nWarm regards,\nRani Beauty Clinic`,
    },
    {
      timing: 'next_day',
      channel: 'sms',
      body: `Good morning ${clientName}! Just checking in — did you have a chance to review the treatment plan from yesterday? Happy to answer any questions. We do have a few openings this week if you\'d like to get started! 😊`,
    },
    {
      timing: 'three_days',
      channel: 'email',
      subject: `Still thinking about your treatment plan, ${clientName}?`,
      body: `Hi ${clientName},\n\nI wanted to follow up on our consultation from earlier this week. I know it\'s a big decision, and I want to make sure you have everything you need.\n\nA few things that might help:\n- Before & after photos from similar clients\n- Financing options starting at $XX/month\n- Our 100% satisfaction approach\n\nWould you like to schedule a quick 10-minute call to address any questions? Or if you\'re ready to move forward, we have availability this week.\n\nBest,\nRani Beauty Clinic`,
    },
    {
      timing: 'one_week',
      channel: 'sms',
      body: `Hi ${clientName}! It\'s been a week since your consult and I wanted to see how you\'re feeling about everything. Our schedule is filling up for the next few weeks — would you like me to save a spot for you? No pressure at all, just want to make sure you don\'t miss out. 🌟`,
    },
  ];
}

// ── CONVERSION SCORING ──

function calculateConversionScore(context: ConsultationContext): ConversionScore {
  const factors: ConversionFactor[] = [];
  let totalScore = 50; // Base score

  // Engagement signals
  const signals = context.engagementSignals || [];

  if (signals.some(s => s.type === 'asked_price')) {
    factors.push({ factor: 'Asked about pricing', impact: 'positive', weight: 10, detail: 'Price inquiry indicates serious interest' });
    totalScore += 10;
  }

  if (signals.some(s => s.type === 'asked_results')) {
    factors.push({ factor: 'Asked about results', impact: 'positive', weight: 12, detail: 'Wanting to see results indicates purchase intent' });
    totalScore += 12;
  }

  if (signals.some(s => s.type === 'asked_financing')) {
    factors.push({ factor: 'Asked about financing', impact: 'positive', weight: 15, detail: 'Financing inquiry strongly indicates purchase intent' });
    totalScore += 15;
  }

  if (signals.some(s => s.type === 'mentioned_event')) {
    factors.push({ factor: 'Has an upcoming event', impact: 'positive', weight: 12, detail: 'Time-bound goal creates natural urgency' });
    totalScore += 12;
  }

  if (signals.some(s => s.type === 'compared_competitor')) {
    factors.push({ factor: 'Comparing with competitors', impact: 'neutral', weight: -5, detail: 'Still in evaluation phase — need to differentiate' });
    totalScore -= 5;
  }

  if (signals.some(s => s.type === 'brought_partner')) {
    factors.push({ factor: 'Brought partner/friend', impact: 'positive', weight: 8, detail: 'Support system present — group decision making' });
    totalScore += 8;
  }

  // Client type factors
  if (context.consultType === 'existing_client') {
    factors.push({ factor: 'Existing client', impact: 'positive', weight: 15, detail: 'Existing relationship and trust established' });
    totalScore += 15;
  }

  if (context.consultType === 'new_client') {
    factors.push({ factor: 'New client', impact: 'neutral', weight: -5, detail: 'First visit — trust still being built' });
    totalScore -= 5;
  }

  // Budget alignment
  if (context.client.budget === 'luxury') {
    factors.push({ factor: 'Luxury budget indicated', impact: 'positive', weight: 10, detail: 'Budget not a barrier to conversion' });
    totalScore += 10;
  } else if (context.client.budget === 'essential') {
    factors.push({ factor: 'Budget-conscious', impact: 'negative', weight: -8, detail: 'Price sensitivity may require financing presentation' });
    totalScore -= 8;
  }

  // Medical flags reduce score
  const flags = checkMedicalFlags(context.client);
  const criticalFlags = flags.filter(f => f.severity === 'critical');
  if (criticalFlags.length > 0) {
    factors.push({ factor: `${criticalFlags.length} medical contraindication(s)`, impact: 'negative', weight: -20, detail: 'Treatment options may be limited' });
    totalScore -= 20;
  }

  totalScore = Math.max(5, Math.min(95, totalScore));

  const recommendation = totalScore >= 75
    ? 'High conversion potential — use assumptive close and book today.'
    : totalScore >= 50
      ? 'Moderate potential — address remaining concerns, present financing, and set up follow-up.'
      : 'Needs nurturing — focus on education, build trust, offer a low-commitment first treatment, and plan follow-up sequence.';

  return {
    score: totalScore,
    factors,
    recommendation,
  };
}

// ── EXPORTS ──

export {
  OBJECTION_HANDLERS,
  COMPETITOR_RESPONSES,
  CLOSING_TECHNIQUES,
};
