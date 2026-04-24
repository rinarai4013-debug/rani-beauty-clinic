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

// ── ENGINE ──

// Wave 11 Bug C fix: resolve service names by LONGEST key first so that
// multi-word pathway entries win over shorter substring matches.
// Previously `matchService('Botox + Dermal Fillers combo')` returned 'Botox'
// because the PATHWAYS object happened to insert it earlier — now
// 'Dermal Fillers' (14 chars) beats 'Botox' (5 chars) regardless of order.
const PATHWAY_KEYS_BY_LENGTH: string[] = Object.keys(PATHWAYS).sort(
  (a, b) => b.length - a.length,
);

function matchService(serviceName: string): string | null {
  const lower = serviceName.toLowerCase();
  for (const key of PATHWAY_KEYS_BY_LENGTH) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return null;
}

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Return the category that appears most frequently in the treatment history.
 * Ties broken by the most-recent visit's category (since `sorted` is already
 * newest-first, the first-seen category in iteration wins a tie).
 * Wave 11 Bug B fix: the gap-fill cross-sell bucket should reflect the
 * client's *dominant* spend category, not whatever they happened to book last.
 */
function mostUsedCategory(sorted: TreatmentRecord[]): string {
  if (sorted.length === 0) return 'Facial';
  const freq = new Map<string, number>();
  for (const t of sorted) {
    freq.set(t.category, (freq.get(t.category) ?? 0) + 1);
  }
  let best = sorted[0].category;
  let bestCount = 0;
  // Iterate newest-first so ties resolve to the most-recent category.
  for (const t of sorted) {
    const count = freq.get(t.category) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = t.category;
    }
  }
  return best;
}

// Wave 11 Bug A fix: explicit source tag drives the dedupe priority, so the
// engine no longer depends on push order to resolve collisions. Priority:
//
//   overdue  → a "you are past your maintenance window" call. Always wins
//              because it carries time-sensitive clinical information.
//   gap      → cross-sell recommendation. Beats plain pathway-next because
//              gap-fill reasons ("Maintain glowing skin between injectable
//              visits") are more specific than the generic "Great complement
//              to your X" pathway copy.
//   pathway  → pathway-next continuation rec.
//   goal     → goal-based rec for new clients with no history.
//   membership → Angel Glow Up upsell rec.
type RecSource = 'overdue' | 'gap' | 'pathway' | 'goal' | 'membership';
type TaggedRec = Recommendation & { _src: RecSource };
const SOURCE_PRIORITY: Record<RecSource, number> = {
  overdue: 0,
  gap: 1,
  pathway: 2,
  goal: 3,
  membership: 4,
};

export function recommendNextTreatment(input: RecommendationInput): RecommendationResult {
  const { treatmentHistory, avgSpend, primaryGoal } = input;
  const recommendations: TaggedRec[] = [];
  const insights: string[] = [];

  // Sort history newest first
  const sorted = [...treatmentHistory].sort((a, b) => b.date.localeCompare(a.date));

  // 1. PATHWAY-BASED: What follows their most recent treatment?
  if (sorted.length > 0) {
    const lastService = matchService(sorted[0].service);
    if (lastService && PATHWAYS[lastService]) {
      const pathway = PATHWAYS[lastService];
      // Wave 11 Bug E fix: respect a caller-provided `daysSinceLastVisit`
      // when it's a positive finite value. Callers (e.g. the dashboard
      // client profile) often have a more authoritative "last visit" date
      // from Airtable than the transaction log we can reconstruct here.
      // A default of 0 (set by API wrappers) still falls back to the
      // per-treatment date math so zero-day-ago tests keep their semantics.
      const callerDays = input.daysSinceLastVisit;
      const daysSinceLast =
        Number.isFinite(callerDays) && callerDays > 0
          ? callerDays
          : getDaysSince(sorted[0].date);
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
          _src: 'overdue',
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
          _src: 'pathway',
        });
      }
    }
  }

  // 2. CATEGORY GAPS: What categories haven't they tried?
  const categoriesUsed = new Set(sorted.map(t => t.category));
  const allCategories = ['Facial', 'Laser', 'Injectable', 'Wellness', 'Body'];
  const gaps = allCategories.filter(c => !categoriesUsed.has(c));

  if (gaps.length > 0 && gaps.length < allCategories.length) {
    // Wave 11 Bug B fix: use the client's *most-used* category as the
    // cross-sell bucket, not whichever category they booked most recently.
    const primaryCategory = mostUsedCategory(sorted);
    const crossSells = CROSS_SELL[primaryCategory] || [];
    // Wave 11 Bug A fix: walk every gap — removing the previous `slice(0, 2)`
    // clip that made cross-sells unreachable for clients with many unexplored
    // categories (e.g. Facial-only never seeing the GLP-1 gap-fill).
    for (const gap of gaps) {
      const relevant = crossSells.find(cs => {
        const exactCat = PATHWAYS[cs.suggest]?.category;
        if (exactCat) return exactCat === gap;
        // Fuzzy-resolve "GLP-1 Weight Management" → PATHWAYS['GLP-1'].
        const pathwayKey = PATHWAY_KEYS_BY_LENGTH.find(key => cs.suggest.includes(key));
        return pathwayKey ? PATHWAYS[pathwayKey].category === gap : false;
      });
      if (relevant) {
        const resolvedService = PATHWAYS[relevant.suggest]
          ? relevant.suggest
          : PATHWAY_KEYS_BY_LENGTH.find(key => relevant.suggest.includes(key)) || relevant.suggest;
        recommendations.push({
          service: resolvedService,
          category: gap,
          reason: relevant.reason,
          urgency: 'consider',
          estimatedPrice: PRICE_MAP[resolvedService] || relevant.price,
          confidence: 50,
          _src: 'gap',
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
      for (const r of goalRecs) {
        recommendations.push({ ...r, _src: 'goal' });
      }
      insights.push(`Recommendations based on stated goal: ${primaryGoal}`);
    }
  }

  // 4. MEMBERSHIP UPSELL: If they're high-spend without membership
  if (!input.membershipTier && avgSpend > 300 && sorted.length >= 3) {
    insights.push('High-value client without membership - consider Angel Glow Up pitch');
    // Wave 11 Bug D fix: emit an actual actionable rec in addition to the
    // insight. Previously this was the only strategy that never produced a
    // rec, breaking the "5 strategies → 5 rec producers" contract documented
    // at the top of this file. Confidence 55 keeps it below pathway (65) and
    // overdue (85) so it surfaces as an alternative, never as `primary` unless
    // nothing else qualifies.
    recommendations.push({
      service: 'Angel Glow Up Membership',
      category: 'Membership',
      reason: `At your average spend of $${Math.round(avgSpend)} per visit, an Angel Glow Up membership pays for itself in ~2 visits per month.`,
      urgency: 'soon',
      estimatedPrice: '$199-399/mo',
      confidence: 55,
      _src: 'membership',
    });
  }

  // 5. DEDUPE by source priority (overdue > gap > pathway > goal > membership)
  //    then SORT by confidence. This guarantees:
  //      - overdue recs survive even when a gap rec for the same service
  //        also fires (keeping the clinically-important overdue reason/conf);
  //      - gap recs win over pathway-next recs for the same service so the
  //        more specific cross-sell copy is surfaced instead of the generic
  //        "Great complement to your X" fallback.
  const bySvc = new Map<string, TaggedRec>();
  for (const rec of recommendations) {
    const existing = bySvc.get(rec.service);
    if (!existing || SOURCE_PRIORITY[rec._src] < SOURCE_PRIORITY[existing._src]) {
      bySvc.set(rec.service, rec);
    }
  }
  const deduped: Recommendation[] = Array.from(bySvc.values())
    .map(({ _src: __source, ...rec }) => rec)
    .sort((a, b) => b.confidence - a.confidence);

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
    // Wave 11 Bug A follow-up: bump the alternatives window from 3 to 5 so
    // cross-sell gap-fill recs (confidence 50) aren't crowded out by a full
    // pathway-next triplet (confidence 65). The CEO dashboard still shows the
    // top 3 visually, but API consumers (the client profile page) can surface
    // the full list.
    alternatives: deduped.slice(1, 6),
    insights,
  };
}
