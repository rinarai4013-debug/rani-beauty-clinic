/**
 * Medical Cross-Sell Matrix
 * Rani Beauty Clinic
 *
 * Medical-specific cross-sell engine with timing rules,
 * revenue uplift calculations, and patient segmentation.
 */

import type {
  CrossSellRule,
  CrossSellTrigger,
  CrossSellRecommendation,
} from './types';

// ============================================================
// CROSS-SELL RULES
// ============================================================

/**
 * All cross-sell rules for medical patients.
 * Rules are ordered by priority (lower number = higher priority).
 */
export const CROSS_SELL_RULES: CrossSellRule[] = [
  // GLP-1 Cross-Sells
  {
    id: 'glp1-lipo-mino',
    name: 'GLP-1 + Lipo-Mino Add-On',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 2,
      minSatisfaction: 6,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: ['WELLNESS-PATIENT'],
    },
    recommendedService: 'wellness-lipo-mino',
    revenueUplift: 50,
    priority: 1,
    message: 'Many of our GLP-1 patients add a Lipo-Mino injection ($50/visit) for extra fat-burning support. Want to try it at your next visit?',
  },
  {
    id: 'glp1-sofwave',
    name: 'GLP-1 Weight Loss + Sofwave Skin Tightening',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 3,
      minSatisfaction: 7,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'sofwave-skin-tightening',
    revenueUplift: 3000,
    priority: 2,
    message: 'As you lose weight, skin tightening can help everything look toned and firm. Our Sofwave treatment is a great complement to your weight loss journey.',
  },
  {
    id: 'glp1-sermorelin',
    name: 'GLP-1 + Sermorelin Stack',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 3,
      minSatisfaction: 7,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: ['PEPTIDE-PATIENT'],
    },
    recommendedService: 'peptide-sermorelin',
    revenueUplift: 349,
    priority: 3,
    message: 'A lot of our patients stack Sermorelin with their GLP-1 for better muscle preservation and recovery during weight loss. It\'s $349/mo and pairs really well with what you\'re already doing.',
  },
  {
    id: 'glp1-b12-combo',
    name: 'GLP-1 + B12 Energy Boost',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 1,
      minSatisfaction: 5,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-b12',
    revenueUplift: 35,
    priority: 5,
    message: 'Quick energy boost? Our B12 injection ($35) is a popular add-on for GLP-1 patients. Takes 5 minutes.',
  },
  {
    id: 'glp1-vitamin-d',
    name: 'GLP-1 + Vitamin D3',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 1,
      minSatisfaction: 5,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-vitamin-d3',
    revenueUplift: 50,
    priority: 6,
    message: 'Vitamin D3 supports your metabolism and bone health during weight loss. Just $50 per injection.',
  },
  {
    id: 'glp1-biotin',
    name: 'GLP-1 + Biotin (Hair Support)',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 2,
      minSatisfaction: 5,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-biotin',
    revenueUplift: 45,
    priority: 7,
    message: 'Some patients notice hair thinning during weight loss. Our Biotin injection ($45) helps keep your hair strong and healthy.',
  },

  // Peptide Cross-Sells
  {
    id: 'peptide-nad-iv',
    name: 'Peptide Patient + NAD+ IV Drip',
    triggerService: 'peptide',
    triggerCondition: {
      minMonthsActive: 1,
      minSatisfaction: 6,
      requiredTags: ['PEPTIDE-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-nad-iv',
    revenueUplift: 200,
    priority: 4,
    message: 'Since you\'re already investing in peptide therapy, our NAD+ IV drip ($150-250) can amplify your results with cellular-level repair and energy.',
  },
  {
    id: 'peptide-glutathione',
    name: 'Peptide Patient + Glutathione Push',
    triggerService: 'peptide',
    triggerCondition: {
      minMonthsActive: 1,
      minSatisfaction: 6,
      requiredTags: ['PEPTIDE-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-glutathione-push',
    revenueUplift: 87,
    priority: 6,
    message: 'Add a Glutathione Push ($75-100) to your peptide regimen for antioxidant protection and skin brightening.',
  },

  // Hormone Cross-Sells
  {
    id: 'hormone-b12-vitd',
    name: 'Hormone Patient + B12 & Vitamin D Combo',
    triggerService: 'hormone',
    triggerCondition: {
      minMonthsActive: 1,
      minSatisfaction: 6,
      requiredTags: ['HORMONE-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-b12',
    revenueUplift: 85,
    priority: 5,
    message: 'Our hormone patients love the B12 + Vitamin D combo ($85 total). Supports your energy and hormonal balance.',
  },
  {
    id: 'hormone-tri-immune',
    name: 'Hormone Patient + Tri-Immune',
    triggerService: 'hormone',
    triggerCondition: {
      minMonthsActive: 2,
      minSatisfaction: 6,
      requiredTags: ['HORMONE-PATIENT'],
      excludeTags: [],
    },
    recommendedService: 'wellness-tri-immune',
    revenueUplift: 75,
    priority: 7,
    message: 'Keep your immune system strong while optimizing hormones. Our Tri-Immune boost ($75) is a great monthly add-on.',
  },

  // Universal Cross-Sells
  {
    id: 'referral-any',
    name: 'Happy Patient Referral Program',
    triggerService: 'any',
    triggerCondition: {
      minMonthsActive: 2,
      minSatisfaction: 8,
      requiredTags: [],
      excludeTags: ['REFERRAL-SOURCE'],
    },
    recommendedService: 'referral-credit',
    revenueUplift: 0, // referral value tracked separately
    priority: 10,
    message: 'You\'re doing so well! Know someone who\'d love these results? Refer a friend and you both get $50 credit toward any service.',
  },
  {
    id: 'upgrade-vip',
    name: 'Monthly to VIP Transform Upgrade',
    triggerService: 'glp1',
    triggerCondition: {
      minMonthsActive: 2,
      minSatisfaction: 8,
      requiredTags: ['GLP1-PATIENT'],
      excludeTags: ['VIP'],
    },
    recommendedService: 'glp1-vip-transform',
    revenueUplift: 400,
    priority: 2,
    message: 'Ready to go all-in? Our VIP Transform Program ($1,199/3 months) includes weekly check-ins, priority provider access, and nutrition guidance.',
  },
];

// ============================================================
// CROSS-SELL ENGINE
// ============================================================

/** Patient data needed for cross-sell evaluation */
export interface PatientCrossSellProfile {
  patientId: string;
  monthsActive: number;
  satisfaction: number;
  tags: string[];
  currentServices: string[];
  monthlySpend: number;
  lastCrossSellDate: Date | null;
}

/**
 * Evaluates whether a cross-sell trigger condition is met for a patient.
 */
export function evaluateTrigger(
  trigger: CrossSellTrigger,
  profile: PatientCrossSellProfile
): boolean {
  // Check minimum months active
  if (profile.monthsActive < trigger.minMonthsActive) return false;

  // Check satisfaction threshold
  if (trigger.minSatisfaction && profile.satisfaction < trigger.minSatisfaction) return false;

  // Check required tags
  if (trigger.requiredTags && trigger.requiredTags.length > 0) {
    const hasAll = trigger.requiredTags.every((tag) => profile.tags.includes(tag));
    if (!hasAll) return false;
  }

  // Check excluded tags
  if (trigger.excludeTags && trigger.excludeTags.length > 0) {
    const hasExcluded = trigger.excludeTags.some((tag) => profile.tags.includes(tag));
    if (hasExcluded) return false;
  }

  return true;
}

/**
 * Minimum days between cross-sell attempts to avoid overwhelming patients.
 */
export const CROSS_SELL_COOLDOWN_DAYS = 14;

/**
 * Checks if enough time has passed since the last cross-sell attempt.
 */
export function isCrossSellCooldownMet(lastCrossSellDate: Date | null, asOf?: Date): boolean {
  if (!lastCrossSellDate) return true;
  const now = asOf ?? new Date();
  const daysSince = (now.getTime() - lastCrossSellDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= CROSS_SELL_COOLDOWN_DAYS;
}

/**
 * Generates cross-sell recommendations for a patient.
 * Returns rules sorted by priority, filtered by timing rules.
 */
export function generateRecommendations(
  profile: PatientCrossSellProfile,
  asOf?: Date
): CrossSellRecommendation[] {
  // Check cooldown
  if (!isCrossSellCooldownMet(profile.lastCrossSellDate, asOf)) {
    return [];
  }

  const recommendations: CrossSellRecommendation[] = [];

  for (const rule of CROSS_SELL_RULES) {
    // Skip if patient already has the recommended service
    if (profile.currentServices.includes(rule.recommendedService)) continue;

    // Check if trigger service matches patient
    const matchesTrigger =
      rule.triggerService === 'any' ||
      profile.currentServices.some((s) => s.includes(rule.triggerService));

    if (!matchesTrigger) continue;

    // Evaluate trigger conditions
    if (!evaluateTrigger(rule.triggerCondition, profile)) continue;

    recommendations.push({
      patientId: profile.patientId,
      rule,
      estimatedUplift: rule.revenueUplift,
      generatedAt: asOf ?? new Date(),
      presented: false,
      accepted: null,
    });
  }

  // Sort by priority (lower number = higher priority)
  recommendations.sort((a, b) => a.rule.priority - b.rule.priority);

  return recommendations;
}

/**
 * Returns the top N cross-sell recommendations for a patient.
 */
export function getTopRecommendations(
  profile: PatientCrossSellProfile,
  maxResults: number = 3,
  asOf?: Date
): CrossSellRecommendation[] {
  return generateRecommendations(profile, asOf).slice(0, maxResults);
}

// ============================================================
// REVENUE UPLIFT CALCULATOR
// ============================================================

/** Revenue uplift summary for a patient */
export interface RevenueUpliftSummary {
  patientId: string;
  currentMonthlySpend: number;
  potentialUpliftPerMonth: number;
  potentialUpliftPerYear: number;
  recommendations: CrossSellRecommendation[];
  totalPotentialMonthly: number;
  percentIncrease: number;
}

/**
 * Calculates potential revenue uplift for a patient across all eligible cross-sells.
 */
export function calculateRevenueUplift(
  profile: PatientCrossSellProfile,
  asOf?: Date
): RevenueUpliftSummary {
  const recommendations = generateRecommendations(profile, asOf);

  const totalUplift = recommendations.reduce((sum, r) => sum + r.estimatedUplift, 0);
  const totalPotentialMonthly = profile.monthlySpend + totalUplift;
  const percentIncrease =
    profile.monthlySpend > 0
      ? ((totalUplift / profile.monthlySpend) * 100)
      : 0;

  return {
    patientId: profile.patientId,
    currentMonthlySpend: profile.monthlySpend,
    potentialUpliftPerMonth: totalUplift,
    potentialUpliftPerYear: totalUplift * 12,
    recommendations,
    totalPotentialMonthly,
    percentIncrease: Math.round(percentIncrease * 10) / 10,
  };
}

/**
 * Calculates total revenue uplift across all patients.
 */
export function calculatePortfolioUplift(
  profiles: PatientCrossSellProfile[]
): {
  totalCurrentMRR: number;
  totalPotentialUplift: number;
  totalPotentialMRR: number;
  avgUpliftPerPatient: number;
  patientsWithOpportunities: number;
  topOpportunities: Array<{ patientId: string; uplift: number; topRecommendation: string }>;
} {
  let totalCurrentMRR = 0;
  let totalPotentialUplift = 0;
  let patientsWithOpportunities = 0;
  const opportunities: Array<{ patientId: string; uplift: number; topRecommendation: string }> = [];

  for (const profile of profiles) {
    totalCurrentMRR += profile.monthlySpend;
    const uplift = calculateRevenueUplift(profile);

    if (uplift.recommendations.length > 0) {
      patientsWithOpportunities++;
      totalPotentialUplift += uplift.potentialUpliftPerMonth;
      opportunities.push({
        patientId: profile.patientId,
        uplift: uplift.potentialUpliftPerMonth,
        topRecommendation: uplift.recommendations[0].rule.name,
      });
    }
  }

  // Sort opportunities by uplift (highest first)
  opportunities.sort((a, b) => b.uplift - a.uplift);

  return {
    totalCurrentMRR,
    totalPotentialUplift,
    totalPotentialMRR: totalCurrentMRR + totalPotentialUplift,
    avgUpliftPerPatient:
      patientsWithOpportunities > 0
        ? Math.round(totalPotentialUplift / patientsWithOpportunities)
        : 0,
    patientsWithOpportunities,
    topOpportunities: opportunities.slice(0, 10),
  };
}

// ============================================================
// CROSS-SELL TRACKING
// ============================================================

/**
 * Records that a cross-sell was presented to a patient.
 */
export function markPresented(recommendation: CrossSellRecommendation): CrossSellRecommendation {
  return { ...recommendation, presented: true };
}

/**
 * Records the patient's response to a cross-sell.
 */
export function markResponse(
  recommendation: CrossSellRecommendation,
  accepted: boolean
): CrossSellRecommendation {
  return { ...recommendation, accepted };
}

/**
 * Calculates cross-sell conversion rate from a set of recommendations.
 */
export function calculateConversionRate(
  recommendations: CrossSellRecommendation[]
): { presented: number; accepted: number; rate: number } {
  const presented = recommendations.filter((r) => r.presented).length;
  const accepted = recommendations.filter((r) => r.accepted === true).length;
  const rate = presented > 0 ? (accepted / presented) * 100 : 0;

  return {
    presented,
    accepted,
    rate: Math.round(rate * 10) / 10,
  };
}

/**
 * Generates a cross-sell report summary.
 */
export function formatCrossSellReport(
  profiles: PatientCrossSellProfile[],
  historicalRecommendations: CrossSellRecommendation[]
): string {
  const portfolio = calculatePortfolioUplift(profiles);
  const conversion = calculateConversionRate(historicalRecommendations);

  const lines = [
    'Cross-Sell Report',
    '='.repeat(45),
    '',
    `Current MRR: $${portfolio.totalCurrentMRR.toLocaleString()}`,
    `Potential Monthly Uplift: $${portfolio.totalPotentialUplift.toLocaleString()}`,
    `Potential MRR (if all accepted): $${portfolio.totalPotentialMRR.toLocaleString()}`,
    `Patients with Opportunities: ${portfolio.patientsWithOpportunities}`,
    `Avg Uplift per Patient: $${portfolio.avgUpliftPerPatient}`,
    '',
    `Conversion Rate: ${conversion.rate}% (${conversion.accepted}/${conversion.presented} presented)`,
    '',
    'Top Opportunities:',
  ];

  for (const opp of portfolio.topOpportunities.slice(0, 5)) {
    lines.push(`  ${opp.patientId}: +$${opp.uplift}/mo (${opp.topRecommendation})`);
  }

  return lines.join('\n');
}
