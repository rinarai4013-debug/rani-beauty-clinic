/**
 * Cross-Sell Autopilot
 * Rani Beauty Clinic - Revenue Activation System
 *
 * Scans all active patients against a cross-sell matrix to identify
 * upgrade and add-on opportunities. Prioritizes by dollar uplift,
 * generates natural upsell messages in Rina's voice, and groups
 * recommendations by provider schedule for in-appointment delivery.
 *
 * Cross-sell philosophy: Every recommendation should genuinely improve
 * the patient's outcome. Never push a service that does not make clinical sense.
 * Rina's voice: warm, knowledgeable, like a friend who happens to be an expert.
 */

import { Tables, fetchAll } from '@/lib/airtable/client';
import { categorizeServices, findCrossSellOpportunities } from './ltv-calculator';

// ── Types ────────────────────────────────────────────────────────────────

export type CrossSellType =
  | 'add_on'        // Service to add alongside current
  | 'upgrade'       // Move to premium version
  | 'bundle'        // Package multiple services
  | 'recurring'     // Convert to membership/recurring
  | 'complementary' // Clinically complementary service
  | 'seasonal';     // Time-based recommendation

export interface CrossSellOpportunity {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;

  // Current state
  currentServices: string[];
  currentCategories: string[];
  currentMonthlySpend: number;

  // Recommendation
  recommendedService: string;
  recommendedCategory: string;
  crossSellType: CrossSellType;
  reason: string;
  clinicalRationale: string;

  // Financial impact
  estimatedMonthlyUplift: number;
  estimatedAnnualUplift: number;
  servicePrice: number;
  conversionLikelihood: number; // 0-1

  // Delivery
  suggestedPitchTiming: 'pre_appointment' | 'during_appointment' | 'post_appointment' | 'standalone';
  pitchMessage: string;
  talkingPoints: string[];
  objectionHandlers: { objection: string; response: string }[];

  // Tracking
  status: 'identified' | 'pitched' | 'accepted' | 'declined' | 'deferred';
  pitchedAt?: string;
  outcomeAt?: string;
  nextAppointmentDate?: string;
  provider: string;
}

export interface CrossSellDigest {
  date: string;
  totalOpportunities: number;
  totalPotentialUplift: number;
  byType: { type: CrossSellType; count: number; totalUplift: number }[];
  byProvider: ProviderCrossSellBundle[];
  topOpportunities: CrossSellOpportunity[];
  weeklyWins: CrossSellWin[];
  conversionMetrics: ConversionMetrics;
}

export interface ProviderCrossSellBundle {
  provider: string;
  date: string;
  patients: {
    patientName: string;
    appointmentTime?: string;
    opportunities: CrossSellOpportunity[];
    totalPotentialUplift: number;
  }[];
  totalOpportunities: number;
  totalPotentialUplift: number;
}

export interface CrossSellWin {
  patientName: string;
  originalService: string;
  addedService: string;
  upliftAmount: number;
  provider: string;
  date: string;
}

export interface ConversionMetrics {
  totalPitched: number;
  totalAccepted: number;
  totalDeclined: number;
  totalDeferred: number;
  overallConversionRate: number;
  byType: { type: CrossSellType; pitched: number; accepted: number; rate: number }[];
  avgUpliftPerConversion: number;
  totalRevenueAdded: number;
}

// ── Cross-Sell Matrix ────────────────────────────────────────────────────

interface CrossSellRule {
  fromService: string;
  fromCategory: string;
  toService: string;
  toCategory: string;
  type: CrossSellType;
  reason: string;
  clinicalRationale: string;
  estimatedPrice: number;
  monthlyValue: number;
  conversionLikelihood: number;
  pitchTiming: 'pre_appointment' | 'during_appointment' | 'post_appointment' | 'standalone';
}

const CROSS_SELL_RULES: CrossSellRule[] = [
  // GLP-1 cross-sells
  {
    fromService: 'GLP-1', fromCategory: 'GLP-1',
    toService: 'Tri-Immune Injection', toCategory: 'Wellness',
    type: 'complementary',
    reason: 'Immune support during weight loss',
    clinicalRationale: 'GLP-1 patients benefit from immune support as their body adjusts to metabolic changes. Tri-Immune provides vitamin C, zinc, and glutathione for comprehensive immune defense.',
    estimatedPrice: 75, monthlyValue: 75, conversionLikelihood: 0.55,
    pitchTiming: 'during_appointment',
  },
  {
    fromService: 'GLP-1', fromCategory: 'GLP-1',
    toService: 'B12 Injection', toCategory: 'Wellness',
    type: 'add_on',
    reason: 'Energy boost during caloric deficit',
    clinicalRationale: 'Many GLP-1 patients experience reduced energy due to decreased caloric intake. B12 injections help maintain energy levels and support metabolism.',
    estimatedPrice: 35, monthlyValue: 35, conversionLikelihood: 0.65,
    pitchTiming: 'during_appointment',
  },
  {
    fromService: 'GLP-1', fromCategory: 'GLP-1',
    toService: 'Glutathione Injection', toCategory: 'Wellness',
    type: 'complementary',
    reason: 'Skin brightness during transformation',
    clinicalRationale: 'As patients lose weight, glutathione supports skin health, brightness, and detoxification. Patients love the visible glow it provides.',
    estimatedPrice: 100, monthlyValue: 100, conversionLikelihood: 0.45,
    pitchTiming: 'during_appointment',
  },
  {
    fromService: 'GLP-1', fromCategory: 'GLP-1',
    toService: 'Sofwave', toCategory: 'Body',
    type: 'complementary',
    reason: 'Skin tightening as body composition changes',
    clinicalRationale: 'Significant weight loss can lead to skin laxity. Sofwave SUPERB provides non-invasive skin tightening that helps the skin keep up with the body transformation.',
    estimatedPrice: 3300, monthlyValue: 275, conversionLikelihood: 0.25,
    pitchTiming: 'standalone',
  },
  {
    fromService: 'GLP-1', fromCategory: 'GLP-1',
    toService: 'RF Microneedling', toCategory: 'Body',
    type: 'complementary',
    reason: 'Collagen stimulation for skin elasticity',
    clinicalRationale: 'RF microneedling stimulates collagen production in areas where skin may become lax during weight loss. Excellent for face, neck, and body.',
    estimatedPrice: 495, monthlyValue: 165, conversionLikelihood: 0.30,
    pitchTiming: 'standalone',
  },

  // Injectable cross-sells
  {
    fromService: 'Botox', fromCategory: 'Injectable',
    toService: 'HydraFacial', toCategory: 'Facial',
    type: 'complementary',
    reason: 'Skin prep between injectable sessions',
    clinicalRationale: 'HydraFacial keeps skin hydrated and healthy between injectable appointments. The cleansing and hydration extend the life of your results.',
    estimatedPrice: 275, monthlyValue: 92, conversionLikelihood: 0.50,
    pitchTiming: 'post_appointment',
  },
  {
    fromService: 'Botox', fromCategory: 'Injectable',
    toService: 'Tretinoin', toCategory: 'Wellness',
    type: 'add_on',
    reason: 'Medical-grade skincare to maintain results',
    clinicalRationale: 'Tretinoin accelerates skin renewal and collagen production between injectable treatments. Patients who use it consistently see better, longer-lasting results.',
    estimatedPrice: 99, monthlyValue: 99, conversionLikelihood: 0.45,
    pitchTiming: 'post_appointment',
  },
  {
    fromService: 'Fillers', fromCategory: 'Injectable',
    toService: 'PicoWay', toCategory: 'Laser',
    type: 'complementary',
    reason: 'Address pigmentation for complete rejuvenation',
    clinicalRationale: 'Fillers restore volume, but pigmentation can still age the face. PicoWay addresses brown spots and uneven tone for a truly complete refresh.',
    estimatedPrice: 450, monthlyValue: 150, conversionLikelihood: 0.35,
    pitchTiming: 'standalone',
  },
  {
    fromService: 'Botox', fromCategory: 'Injectable',
    toService: 'VI Peel', toCategory: 'Facial',
    type: 'complementary',
    reason: 'Texture improvement between filler sessions',
    clinicalRationale: 'While injectables address lines and volume, chemical peels address skin texture, tone, and clarity. Together they create a comprehensive anti-aging approach.',
    estimatedPrice: 395, monthlyValue: 99, conversionLikelihood: 0.40,
    pitchTiming: 'standalone',
  },

  // Laser cross-sells
  {
    fromService: 'PicoWay', fromCategory: 'Laser',
    toService: 'HydraFacial', toCategory: 'Facial',
    type: 'complementary',
    reason: 'Post-laser skin recovery and hydration',
    clinicalRationale: 'After laser treatments, skin needs deep hydration and gentle care. HydraFacial provides recovery support and maintains the clear, bright results.',
    estimatedPrice: 275, monthlyValue: 92, conversionLikelihood: 0.55,
    pitchTiming: 'post_appointment',
  },
  {
    fromService: 'Laser Hair Removal', fromCategory: 'Laser',
    toService: 'PRX-T33', toCategory: 'Facial',
    type: 'add_on',
    reason: 'Skin quality improvement alongside hair removal',
    clinicalRationale: 'While you are already investing in smooth skin with laser hair removal, PRX-T33 biorevitalization takes skin quality to another level with no downtime.',
    estimatedPrice: 495, monthlyValue: 165, conversionLikelihood: 0.30,
    pitchTiming: 'standalone',
  },

  // Facial cross-sells
  {
    fromService: 'HydraFacial', fromCategory: 'Facial',
    toService: 'Botox', toCategory: 'Injectable',
    type: 'upgrade',
    reason: 'Add preventative injectables for complete anti-aging',
    clinicalRationale: 'HydraFacial addresses skin quality, but for dynamic lines and wrinkles, adding Botox creates a truly comprehensive anti-aging plan. Many patients wish they had started sooner.',
    estimatedPrice: 350, monthlyValue: 117, conversionLikelihood: 0.35,
    pitchTiming: 'during_appointment',
  },
  {
    fromService: 'HydraFacial', fromCategory: 'Facial',
    toService: 'Tretinoin', toCategory: 'Wellness',
    type: 'add_on',
    reason: 'Take the glow home with prescription skincare',
    clinicalRationale: 'HydraFacial gives you a monthly reset, but daily tretinoin keeps the momentum going between visits. It is the number one evidence-based anti-aging ingredient.',
    estimatedPrice: 99, monthlyValue: 99, conversionLikelihood: 0.50,
    pitchTiming: 'post_appointment',
  },
  {
    fromService: 'VI Peel', fromCategory: 'Facial',
    toService: 'PicoWay', toCategory: 'Laser',
    type: 'upgrade',
    reason: 'Advanced pigmentation treatment',
    clinicalRationale: 'Chemical peels are great for surface-level concerns. For deeper pigmentation, PicoWay laser targets melanin at the cellular level for more dramatic results.',
    estimatedPrice: 450, monthlyValue: 150, conversionLikelihood: 0.30,
    pitchTiming: 'standalone',
  },

  // Wellness cross-sells
  {
    fromService: 'B12 Injection', fromCategory: 'Wellness',
    toService: 'NAD+ Injection', toCategory: 'Wellness',
    type: 'upgrade',
    reason: 'Premium anti-aging and cellular rejuvenation',
    clinicalRationale: 'You clearly value feeling your best. NAD+ is the next level, supporting cellular repair, energy production, and longevity at the deepest level.',
    estimatedPrice: 300, monthlyValue: 150, conversionLikelihood: 0.35,
    pitchTiming: 'during_appointment',
  },
  {
    fromService: 'Vitamin D3 Injection', fromCategory: 'Wellness',
    toService: 'GLP-1 Starter', toCategory: 'GLP-1',
    type: 'upgrade',
    reason: 'Full medical weight management program',
    clinicalRationale: 'For patients interested in comprehensive wellness, our GLP-1 weight management program provides medically supervised weight loss with outstanding results.',
    estimatedPrice: 399, monthlyValue: 399, conversionLikelihood: 0.20,
    pitchTiming: 'standalone',
  },

  // Membership upsells
  {
    fromService: 'HydraFacial', fromCategory: 'Facial',
    toService: 'Rani Membership', toCategory: 'Membership',
    type: 'recurring',
    reason: 'Save with monthly membership',
    clinicalRationale: 'You are already coming regularly for HydraFacials. Our membership saves you money each month and includes priority scheduling plus exclusive member perks.',
    estimatedPrice: 199, monthlyValue: 199, conversionLikelihood: 0.40,
    pitchTiming: 'post_appointment',
  },

  // Seasonal
  {
    fromService: 'Any', fromCategory: 'Any',
    toService: 'Sofwave', toCategory: 'Body',
    type: 'seasonal',
    reason: 'Summer skin tightening season',
    clinicalRationale: 'Spring is the perfect time to start Sofwave treatments. You will see full results in 3-6 months, just in time for summer.',
    estimatedPrice: 3300, monthlyValue: 275, conversionLikelihood: 0.15,
    pitchTiming: 'standalone',
  },
];

// ── Pitch Message Generation ────────────────────────────────────────────

/**
 * Generate a natural pitch message in Rina's voice.
 * Warm, knowledgeable, never pushy. Like a friend making a suggestion.
 */
function generatePitchMessage(
  patientFirstName: string,
  rule: CrossSellRule,
  currentService: string,
): string {
  const templates: Record<CrossSellType, string[]> = {
    add_on: [
      `${patientFirstName}, since you're already here for your ${currentService}, I want to mention something that would pair really well. ${rule.reason}. A lot of my patients add ${rule.toService} and love the results.`,
      `Hey ${patientFirstName}, quick thought. You know how much I care about your results. Adding ${rule.toService} to your routine would make a real difference. ${rule.reason}.`,
    ],
    upgrade: [
      `${patientFirstName}, I've been thinking about your treatment plan. You've been great with ${currentService}, and I think you're ready for the next step. ${rule.toService} would take your results to a whole new level.`,
      `${patientFirstName}, you know I always keep an eye on what's best for you. Based on where you are with ${currentService}, ${rule.toService} could be a real game-changer for your goals.`,
    ],
    bundle: [
      `${patientFirstName}, I put together something I think you'll love. Combining ${currentService} with ${rule.toService} gives you better results and saves you money. Win-win.`,
    ],
    recurring: [
      `${patientFirstName}, since you're coming in regularly for ${currentService}, have you thought about our membership? You'd save every month and get some exclusive perks.`,
    ],
    complementary: [
      `${patientFirstName}, there's something I've been wanting to bring up. ${rule.reason}. ${rule.toService} would complement your ${currentService} beautifully.`,
      `${patientFirstName}, as your provider, I always want to make sure we're covering all the bases. ${rule.toService} works really well alongside ${currentService}. ${rule.reason}.`,
    ],
    seasonal: [
      `${patientFirstName}, the timing is perfect for something I've been wanting to suggest. ${rule.reason}. ${rule.toService} would be an amazing addition to your plan right now.`,
    ],
  };

  const options = templates[rule.type] || templates.complementary;
  // Deterministic selection based on patient name
  const index = patientFirstName.length % options.length;
  return options[index];
}

/**
 * Generate talking points for in-appointment delivery.
 */
function generateTalkingPoints(rule: CrossSellRule): string[] {
  return [
    rule.clinicalRationale,
    `Expected investment: $${rule.estimatedPrice}${rule.monthlyValue !== rule.estimatedPrice ? ` (approximately $${rule.monthlyValue}/month equivalent)` : ''}`,
    `Many of our patients who do ${rule.fromService} also add ${rule.toService} and see significantly better outcomes.`,
    'No pressure at all. I just want to make sure you know about all the options available to you.',
    rule.type === 'recurring' ? 'Our membership includes priority scheduling and exclusive member pricing.' : `We can schedule this alongside your regular ${rule.fromService} appointments for convenience.`,
  ];
}

/**
 * Generate objection handlers for common pushback.
 */
function generateObjectionHandlers(rule: CrossSellRule): { objection: string; response: string }[] {
  return [
    {
      objection: 'I need to think about it',
      response: 'Of course! No rush at all. I just wanted to plant the seed. We can talk more about it at your next visit if you are curious.',
    },
    {
      objection: 'It sounds expensive',
      response: `I totally understand. Here is how I think about it: ${rule.toService} at $${rule.estimatedPrice} can actually extend and protect the investment you are already making in ${rule.fromService}. We also have financing options if that helps.`,
    },
    {
      objection: 'I do not have time for more appointments',
      response: `That is a great point. We can actually schedule ${rule.toService} on the same day as your ${rule.fromService}. No extra trips needed.`,
    },
    {
      objection: 'I am happy with my current results',
      response: 'That is wonderful, and I am glad you are seeing results! This is more about optimizing and protecting what you have already achieved. Think of it as an investment in maintaining your results long-term.',
    },
  ];
}

// ── Core Engine ────────────────────────────────────────────────────────

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
  categories: string[];
  monthlySpend: number;
  nextAppointmentDate?: string;
  provider: string;
}

/**
 * Scan a single patient against the cross-sell matrix.
 */
export function scanPatientForCrossSells(patient: PatientData): CrossSellOpportunity[] {
  const opportunities: CrossSellOpportunity[] = [];
  const alreadyHas = new Set(patient.services.map(s => s.toLowerCase()));
  const alreadyRecommended = new Set<string>();
  const firstName = patient.name.split(' ')[0] || patient.name;

  for (const rule of CROSS_SELL_RULES) {
    // Check if patient has the "from" service/category
    const hasFromService = rule.fromService === 'Any' ||
      patient.services.some(s => s.toLowerCase().includes(rule.fromService.toLowerCase())) ||
      patient.categories.some(c => c.toLowerCase().includes(rule.fromCategory.toLowerCase()));

    if (!hasFromService) continue;

    // Skip if patient already has the "to" service
    if (alreadyHas.has(rule.toService.toLowerCase())) continue;

    // Skip duplicates
    if (alreadyRecommended.has(rule.toService)) continue;
    alreadyRecommended.add(rule.toService);

    const pitchMessage = generatePitchMessage(firstName, rule, patient.services[0] || rule.fromService);
    const talkingPoints = generateTalkingPoints(rule);
    const objectionHandlers = generateObjectionHandlers(rule);

    opportunities.push({
      id: `cs-${patient.id}-${rule.toService.replace(/\s/g, '-').toLowerCase()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      currentServices: patient.services,
      currentCategories: patient.categories,
      currentMonthlySpend: patient.monthlySpend,
      recommendedService: rule.toService,
      recommendedCategory: rule.toCategory,
      crossSellType: rule.type,
      reason: rule.reason,
      clinicalRationale: rule.clinicalRationale,
      estimatedMonthlyUplift: rule.monthlyValue,
      estimatedAnnualUplift: rule.monthlyValue * 12,
      servicePrice: rule.estimatedPrice,
      conversionLikelihood: rule.conversionLikelihood,
      suggestedPitchTiming: rule.pitchTiming,
      pitchMessage,
      talkingPoints,
      objectionHandlers,
      status: 'identified',
      nextAppointmentDate: patient.nextAppointmentDate,
      provider: patient.provider,
    });
  }

  // Sort by dollar impact (monthly uplift * conversion likelihood)
  return opportunities.sort((a, b) =>
    (b.estimatedMonthlyUplift * b.conversionLikelihood) -
    (a.estimatedMonthlyUplift * a.conversionLikelihood)
  );
}

/**
 * Scan all active patients and return all cross-sell opportunities.
 */
export async function scanAllPatients(): Promise<CrossSellOpportunity[]> {
  // Fetch active clients with their appointment history
  const [clients, appointments, transactions] = await Promise.all([
    fetchAll<{ Client: string; Email: string; Phone: string; Status: string }>(
      Tables.clients(),
      { filterByFormula: `{Status} = 'Active'` },
      true,
    ),
    fetchAll<{ 'Service Name': string; 'Service Category': string; Date: string; Provider: string; Status: string }>(
      Tables.appointments(),
      { filterByFormula: `{Status} = 'Completed'` },
    ),
    fetchAll<{ Amount: number; Date: string; 'Service Name': string; Status: string }>(
      Tables.transactions(),
      { filterByFormula: `{Status} = 'Completed'` },
    ),
  ]);

  const allOpportunities: CrossSellOpportunity[] = [];

  for (const client of clients) {
    // Get client's services and spending
    const clientAppts = appointments; // In production, filter by linked record
    const services = [...new Set(clientAppts.map(a => a.fields['Service Name']).filter(Boolean))];
    const categories = categorizeServices(services);
    const provider = clientAppts[0]?.fields.Provider || 'Rina';

    const totalRevenue = transactions.reduce((s, t) => s + (t.fields.Amount || 0), 0);
    const monthlySpend = Math.round(totalRevenue / 6); // approximate

    // Find next appointment
    const now = new Date();
    const upcomingAppts = appointments
      .filter(a => new Date(a.fields.Date) > now)
      .sort((a, b) => new Date(a.fields.Date).getTime() - new Date(b.fields.Date).getTime());

    const patientData: PatientData = {
      id: client.id,
      name: client.fields.Client || 'Unknown',
      email: client.fields.Email || '',
      phone: client.fields.Phone || '',
      services,
      categories,
      monthlySpend,
      nextAppointmentDate: upcomingAppts[0]?.fields.Date,
      provider,
    };

    const opportunities = scanPatientForCrossSells(patientData);
    allOpportunities.push(...opportunities);
  }

  // Sort all by dollar impact
  return allOpportunities.sort((a, b) =>
    (b.estimatedMonthlyUplift * b.conversionLikelihood) -
    (a.estimatedMonthlyUplift * a.conversionLikelihood)
  );
}

/**
 * Group cross-sell opportunities by provider and date for in-appointment delivery.
 */
export function groupByProviderSchedule(
  opportunities: CrossSellOpportunity[],
): ProviderCrossSellBundle[] {
  const providerMap = new Map<string, Map<string, CrossSellOpportunity[]>>();

  for (const opp of opportunities) {
    const provider = opp.provider || 'Rina';
    const date = opp.nextAppointmentDate || 'unscheduled';

    if (!providerMap.has(provider)) {
      providerMap.set(provider, new Map());
    }
    const dateMap = providerMap.get(provider)!;
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(opp);
  }

  const bundles: ProviderCrossSellBundle[] = [];

  for (const [provider, dateMap] of providerMap) {
    for (const [date, opps] of dateMap) {
      // Group by patient
      const patientMap = new Map<string, CrossSellOpportunity[]>();
      for (const opp of opps) {
        const existing = patientMap.get(opp.patientId) || [];
        existing.push(opp);
        patientMap.set(opp.patientId, existing);
      }

      const patients = Array.from(patientMap.entries()).map(([, patientOpps]) => ({
        patientName: patientOpps[0].patientName,
        appointmentTime: patientOpps[0].nextAppointmentDate,
        opportunities: patientOpps.slice(0, 3), // max 3 per patient
        totalPotentialUplift: patientOpps.reduce((s, o) => s + o.estimatedMonthlyUplift, 0),
      }));

      bundles.push({
        provider,
        date,
        patients,
        totalOpportunities: opps.length,
        totalPotentialUplift: opps.reduce((s, o) => s + o.estimatedMonthlyUplift, 0),
      });
    }
  }

  return bundles.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build the weekly cross-sell digest.
 */
export async function buildWeeklyDigest(): Promise<CrossSellDigest> {
  const opportunities = await scanAllPatients();
  const providerBundles = groupByProviderSchedule(opportunities);

  // Count by type
  const typeCounts = new Map<CrossSellType, { count: number; uplift: number }>();
  for (const opp of opportunities) {
    const existing = typeCounts.get(opp.crossSellType) || { count: 0, uplift: 0 };
    existing.count++;
    existing.uplift += opp.estimatedMonthlyUplift;
    typeCounts.set(opp.crossSellType, existing);
  }

  const byType = Array.from(typeCounts.entries())
    .map(([type, data]) => ({ type, count: data.count, totalUplift: data.uplift }))
    .sort((a, b) => b.totalUplift - a.totalUplift);

  const totalPotentialUplift = opportunities.reduce((s, o) =>
    s + (o.estimatedMonthlyUplift * o.conversionLikelihood), 0);

  return {
    date: new Date().toISOString(),
    totalOpportunities: opportunities.length,
    totalPotentialUplift: Math.round(totalPotentialUplift),
    byType,
    byProvider: providerBundles,
    topOpportunities: opportunities.slice(0, 20),
    weeklyWins: [], // populated from tracking data
    conversionMetrics: {
      totalPitched: 0,
      totalAccepted: 0,
      totalDeclined: 0,
      totalDeferred: 0,
      overallConversionRate: 0,
      byType: byType.map(t => ({ type: t.type, pitched: 0, accepted: 0, rate: 0 })),
      avgUpliftPerConversion: 0,
      totalRevenueAdded: 0,
    },
  };
}

/**
 * Export cross-sell opportunities as CSV.
 */
export function exportCrossSellCSV(opportunities: CrossSellOpportunity[]): string {
  const headers = [
    'Patient Name',
    'Current Services',
    'Recommended Service',
    'Type',
    'Reason',
    'Monthly Uplift',
    'Annual Uplift',
    'Service Price',
    'Conversion Likelihood',
    'Pitch Timing',
    'Provider',
    'Next Appointment',
    'Status',
  ];

  const rows = opportunities.map(o => [
    `"${o.patientName}"`,
    `"${o.currentServices.join(', ')}"`,
    `"${o.recommendedService}"`,
    o.crossSellType,
    `"${o.reason}"`,
    `$${o.estimatedMonthlyUplift}`,
    `$${o.estimatedAnnualUplift}`,
    `$${o.servicePrice}`,
    `${Math.round(o.conversionLikelihood * 100)}%`,
    o.suggestedPitchTiming,
    o.provider,
    o.nextAppointmentDate || 'None',
    o.status,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
