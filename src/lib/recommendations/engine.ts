/**
 * Next-Best-Treatment Recommendation Engine
 *
 * Analyzes a client's treatment history, goals, and profile to suggest
 * their optimal next treatment. Used on the client profile page and
 * by n8n for automated follow-up recommendations.
 *
 * Logic:
 * 1. Treatment Pathways - What naturally follows their last treatment
 * 2. Service Gaps - Categories they haven't explored yet
 * 3. Timing - When treatments are due for maintenance
 * 4. Budget signals - Match to membership tier / spending history
 * 5. Cross-sell opportunities - Complementary services
 */

// ── TYPES ──

export interface RecommendationInput {
  treatmentHistory: TreatmentRecord[];
  membershipTier?: string;
  avgSpend: number;
  daysSinceLastVisit: number;
  primaryGoal?: string; // from quiz: glowing-skin, anti-aging, body-contouring, health-wellness
}

export interface TreatmentRecord {
  service: string;
  category: string;
  date: string;
  amountPaid: number;
}

export interface Recommendation {
  service: string;
  category: string;
  reason: string;
  urgency: 'now' | 'soon' | 'consider';
  estimatedPrice: string;
  confidence: number; // 0-100
}

export interface RecommendationResult {
  primary: Recommendation;
  alternatives: Recommendation[];
  insights: string[];
}

// ── TREATMENT PATHWAY MAP ──
// "If they just had X, suggest Y next"

const PATHWAYS: Record<string, { next: string[]; timing: string; category: string }> = {
  // Facials
  'HydraFacial': {
    next: ['VI Peel', 'RF Microneedling', 'HydraFacial Booster'],
    timing: 'Monthly maintenance recommended',
    category: 'Facial',
  },
  'VI Peel': {
    next: ['HydraFacial', 'PRX-T33', 'RF Microneedling'],
    timing: 'Every 4-6 weeks for series, then quarterly',
    category: 'Facial',
  },
  'PRX-T33': {
    next: ['HydraFacial', 'VI Peel', 'RF Microneedling'],
    timing: 'Series of 4, then quarterly maintenance',
    category: 'Facial',
  },
  'BioRePeel': {
    next: ['HydraFacial', 'VI Peel', 'PRX-T33'],
    timing: 'Every 2-4 weeks for series',
    category: 'Facial',
  },

  // Laser
  'Laser Hair Removal': {
    next: ['Laser Hair Removal', 'HydraFacial'],
    timing: 'Every 4-6 weeks until series complete',
    category: 'Laser',
  },
  'PicoWay': {
    next: ['PicoWay', 'HydraFacial', 'VI Peel'],
    timing: 'Every 4-8 weeks for series',
    category: 'Laser',
  },
  'Laser Facial': {
    next: ['HydraFacial', 'RF Microneedling', 'Sofwave'],
    timing: 'Every 4-6 weeks',
    category: 'Laser',
  },

  // Advanced
  'RF Microneedling': {
    next: ['HydraFacial', 'PRX-T33', 'Sofwave'],
    timing: 'Series of 3-4, then every 6 months',
    category: 'Facial',
  },
  'Sofwave': {
    next: ['HydraFacial', 'RF Microneedling', 'Botox'],
    timing: 'Annual maintenance',
    category: 'Laser',
  },

  // Injectables
  'Botox': {
    next: ['Botox', 'Dermal Fillers', 'HydraFacial'],
    timing: 'Every 3-4 months',
    category: 'Injectable',
  },
  'Dermal Fillers': {
    next: ['Botox', 'HydraFacial', 'RF Microneedling'],
    timing: 'Every 6-12 months depending on area',
    category: 'Injectable',
  },

  // Wellness
  'GLP-1': {
    next: ['GLP-1', 'Labs', 'Body Contouring'],
    timing: 'Monthly check-in and dose adjustment',
    category: 'Wellness',
  },
  'HRT': {
    next: ['HRT', 'Labs', 'Vitamin Injections'],
    timing: 'Quarterly follow-up and labs',
    category: 'Wellness',
  },
  'NAD+': {
    next: ['NAD+', 'Vitamin Injections', 'GLP-1'],
    timing: 'Monthly or bi-monthly',
    category: 'Wellness',
  },
};

// ── CATEGORY CROSS-SELL MAP ──
// "If they only do category X, suggest trying Y"

const CROSS_SELL: Record<string, { suggest: string; reason: string; price: string }[]> = {
  'Facial': [
    { suggest: 'Botox', reason: 'Complement your skin treatments with wrinkle prevention', price: '$12-14/unit' },
    { suggest: 'GLP-1 Weight Management', reason: 'Complete your transformation with body wellness', price: '$349-699/mo' },
  ],
  'Laser': [
    { suggest: 'HydraFacial', reason: 'Hydrate and repair skin between laser sessions', price: '$199-399' },
    { suggest: 'Sofwave', reason: 'Add skin tightening to your laser regimen', price: '$1,150-3,999' },
  ],
  'Injectable': [
    { suggest: 'HydraFacial', reason: 'Maintain glowing skin between injectable visits', price: '$199-399' },
    { suggest: 'RF Microneedling', reason: 'Build collagen for longer-lasting results', price: '$495-1,500' },
    { suggest: 'Laser Facial', reason: 'Smooth textural work complements volume-based treatments', price: '$199-350' },
    { suggest: 'Sofwave', reason: 'Add skin tightening support after volume correction', price: '$1,150-3,999' },
  ],
  'Wellness': [
    { suggest: 'HydraFacial', reason: 'Invest in your skin while optimizing your health', price: '$199-399' },
    { suggest: 'Laser Hair Removal', reason: 'Popular add-on for wellness clients', price: '$79-499' },
  ],
  'Body': [
    { suggest: 'GLP-1 Weight Management', reason: 'Maximize body contouring with weight management', price: '$349-699/mo' },
    { suggest: 'HydraFacial', reason: 'Glow from the outside while sculpting the body', price: '$199-399' },
  ],
};

// ── PRICE ESTIMATES ──

const PRICE_MAP: Record<string, string> = {
  'HydraFacial': '$199-399',
  'HydraFacial Booster': '$299-575',
  'VI Peel': '$199-349',
  'PRX-T33': '$225-400',
  'BioRePeel': '$199-350',
  'RF Microneedling': '$495-1,500',
  'Sofwave': '$1,150-3,999',
  'PicoWay': '$200-500/session',
  'Laser Hair Removal': '$79-499',
  'Laser Facial': '$199-350',
  'Botox': '$12-14/unit',
  'Dermal Fillers': '$600-900/syringe',
  'GLP-1': '$349-699/mo',
  'HRT': '$199-399/mo',
  'NAD+': '$299-599',
  'Vitamin Injections': '$25-75',
  'Labs': '$25-249',
  'Body Contouring': '$500-2,000',
};

// ── MAINTENANCE TIMING ──

const MAINTENANCE_DAYS: Record<string, number> = {
  'HydraFacial': 30,
  'VI Peel': 42,
  'PRX-T33': 42,
  'BioRePeel': 21,
  'RF Microneedling': 42,
  'Sofwave': 365,
  'Botox': 100,
  'Dermal Fillers': 270,
  'Laser Hair Removal': 42,
  'PicoWay': 56,
  'Laser Facial': 42,
  'GLP-1': 30,
  'HRT': 90,
  'NAD+': 45,
};

const PATHWAY_KEYS = Object.keys(PATHWAYS).sort((a, b) => b.length - a.length);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPrimaryCategory(history: TreatmentRecord[]): string {
  const counts = new Map<string, number>();
  for (const item of history) {
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
  }
  let topCategory = 'Facial';
  let topCount = 0;
  for (const [category, count] of counts.entries()) {
    if (count > topCount) {
      topCategory = category;
      topCount = count;
    }
  }
  return topCategory;
}

// ── ENGINE ──

function matchService(serviceName: string): string | null {
  const lower = serviceName.toLowerCase();
  for (const key of PATHWAY_KEYS) {
    const keyLower = key.toLowerCase();
    const boundaryMatch = new RegExp(`\\b${escapeRegex(keyLower)}\\b`);
    if (boundaryMatch.test(lower)) {
      return key;
    }
  }
  for (const key of PATHWAY_KEYS) {
    if (lower.includes(key.toLowerCase())) {
      return key;
    }
  }
  return null;
}

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function recommendNextTreatment(input: RecommendationInput): RecommendationResult {
  const { treatmentHistory, avgSpend, daysSinceLastVisit, primaryGoal } = input;
  const recommendations: Recommendation[] = [];
  const insights: string[] = [];

  // Sort history newest first
  const sorted = [...treatmentHistory].sort((a, b) => b.date.localeCompare(a.date));

  // 1. PATHWAY-BASED: What follows their most recent treatment?
  if (sorted.length > 0) {
    const lastService = matchService(sorted[0].service);
    if (lastService && PATHWAYS[lastService]) {
      const pathway = PATHWAYS[lastService];
      const computedDaysSince = getDaysSince(sorted[0].date);
      const daysSinceLast = daysSinceLastVisit > 0 ? daysSinceLastVisit : computedDaysSince;
      const maintenanceDays = MAINTENANCE_DAYS[lastService] || 30;

      // Check if they're overdue for repeat
      if (daysSinceLast >= maintenanceDays) {
        recommendations.push({
          service: lastService,
          category: pathway.category,
          reason: `Your last ${lastService} was ${daysSinceLast} days ago. ${pathway.timing}.`,
          urgency: daysSinceLast > maintenanceDays * 1.5 ? 'now' : 'soon',
          estimatedPrice: PRICE_MAP[lastService] || 'Contact for pricing',
          confidence: 85,
        });
        insights.push(`Overdue for ${lastService} maintenance by ${daysSinceLast - maintenanceDays} days`);
      }

      // Suggest next in pathway
      for (const nextService of pathway.next) {
        if (nextService === lastService) continue; // Skip if it's a repeat
        const alreadyHad = sorted.some(t => matchService(t.service) === nextService);
        recommendations.push({
          service: nextService,
          category: PATHWAYS[nextService]?.category || pathway.category,
          reason: alreadyHad
            ? `Continue your ${nextService} treatments for best results`
            : `Great complement to your ${lastService} - enhances and extends results`,
          urgency: 'soon',
          estimatedPrice: PRICE_MAP[nextService] || 'Contact for pricing',
          confidence: alreadyHad ? 75 : 65,
        });
      }
    }
  }

  // 2. CATEGORY GAPS: What categories haven't they tried?
  const categoriesUsed = new Set(sorted.map(t => t.category));
  const allCategories = ['Facial', 'Laser', 'Injectable', 'Wellness', 'Body'];
  const gaps = allCategories.filter(c => !categoriesUsed.has(c));

  if (gaps.length > 0 && gaps.length < allCategories.length) {
    for (const gap of gaps.slice(0, 2)) {
      // Find a cross-sell from their most-used category
      const primaryCategory = getPrimaryCategory(sorted);
      const crossSells = CROSS_SELL[primaryCategory] || [];
      const relevant = crossSells.find(cs => {
        const canonicalGap = PATHWAYS[cs.suggest]?.category === gap;
        if (canonicalGap) {
          return true;
        }
        const pathwayKey = PATHWAY_KEYS.find(key => {
          const keyLower = key.toLowerCase();
          return cs.suggest.toLowerCase().split(/[^a-z0-9]+/).includes(keyLower)
            || keyLower.includes(cs.suggest.toLowerCase())
            || cs.suggest.toLowerCase().includes(keyLower);
        });
        return Boolean(pathwayKey && PATHWAYS[pathwayKey]?.category === gap);
      });
      if (relevant) {
        const resolvedService = PATHWAYS[relevant.suggest]
          ? relevant.suggest
          : PATHWAY_KEYS.find(key => {
            const keyLower = key.toLowerCase();
            return relevant.suggest.toLowerCase().includes(keyLower);
          }) || relevant.suggest;
        recommendations.push({
          service: resolvedService,
          category: gap,
          reason: relevant.reason,
          urgency: 'consider',
          estimatedPrice: PRICE_MAP[resolvedService] || relevant.price,
          confidence: 50,
        });
      }
    }
    insights.push(`Haven't explored: ${gaps.join(', ')}`);
  }

  // 3. GOAL-BASED: Match to their stated primary goal
  if (primaryGoal && sorted.length === 0) {
    const goalMap: Record<string, Recommendation[]> = {
      'glowing-skin': [
        { service: 'HydraFacial', category: 'Facial', reason: 'Perfect starting treatment for glowing skin', urgency: 'now', estimatedPrice: '$199-399', confidence: 90 },
        { service: 'VI Peel', category: 'Facial', reason: 'Deeper resurfacing for radiant results', urgency: 'consider', estimatedPrice: '$199-349', confidence: 70 },
      ],
      'anti-aging': [
        { service: 'Botox', category: 'Injectable', reason: 'Most effective wrinkle prevention treatment', urgency: 'now', estimatedPrice: '$12-14/unit', confidence: 90 },
        { service: 'RF Microneedling', category: 'Facial', reason: 'Build collagen and tighten skin naturally', urgency: 'soon', estimatedPrice: '$495-1,500', confidence: 75 },
        { service: 'Sofwave', category: 'Laser', reason: 'Non-invasive skin tightening and lifting', urgency: 'consider', estimatedPrice: '$1,150-3,999', confidence: 65 },
      ],
      'body-contouring': [
        { service: 'Laser Hair Removal', category: 'Laser', reason: 'Smooth, hair-free skin - most popular body treatment', urgency: 'now', estimatedPrice: '$79-499', confidence: 85 },
        { service: 'GLP-1', category: 'Wellness', reason: 'Medical weight management for lasting body transformation', urgency: 'soon', estimatedPrice: '$349-699/mo', confidence: 70 },
      ],
      'health-wellness': [
        { service: 'GLP-1', category: 'Wellness', reason: 'Physician-supervised weight management', urgency: 'now', estimatedPrice: '$349-699/mo', confidence: 85 },
        { service: 'NAD+', category: 'Wellness', reason: 'Cellular energy and anti-aging from the inside out', urgency: 'soon', estimatedPrice: '$299-599', confidence: 70 },
        { service: 'HRT', category: 'Wellness', reason: 'Hormone optimization for peak wellness', urgency: 'consider', estimatedPrice: '$199-399/mo', confidence: 60 },
      ],
    };

    const goalRecs = goalMap[primaryGoal];
    if (goalRecs) {
      recommendations.push(...goalRecs);
      insights.push(`Recommendations based on stated goal: ${primaryGoal}`);
    }
  }

  // 4. MEMBERSHIP UPSELL: If they're high-spend without membership
  if (!input.membershipTier && avgSpend > 300 && sorted.length >= 3) {
    const membershipRecommendation: Recommendation = {
      service: 'Angel Glow Up Membership',
      category: 'Wellness',
      reason: `High-value client with strong recency (${daysSinceLastVisit} days since last visit) should be moved into membership.`,
      urgency: 'soon',
      estimatedPrice: '$179/mo',
      confidence: 68,
    };
    recommendations.push(membershipRecommendation);
    insights.push('High-value client without membership - consider Angel Glow Up pitch');
  }

  // 5. DEDUPE & SORT by confidence
  const seen = new Set<string>();
  const deduped = recommendations.filter(r => {
    if (seen.has(r.service)) return false;
    seen.add(r.service);
    return true;
  });
  deduped.sort((a, b) => b.confidence - a.confidence);

  const primary = deduped[0] || {
    service: 'HydraFacial',
    category: 'Facial',
    reason: 'Our most popular treatment - perfect for any skin type',
    urgency: 'now' as const,
    estimatedPrice: '$199-399',
    confidence: 50,
  };

  return {
    primary,
    alternatives: deduped.slice(1, 4),
    insights,
  };
}
