import {
  UNIFIED_CATALOG,
  getServicesByConcern,
  getServiceById,
} from '@/data/services/unified-catalog';
import type { UnifiedService } from '@/data/services/unified-catalog';

// ─── Interfaces ───────────────────────────────────────────────────────

export interface ClientProfile {
  skinConcerns: string[];
  treatmentInterests: string[];
  fitzpatrickType?: 1 | 2 | 3 | 4 | 5 | 6;
  downtimeTolerance?: 'none' | 'minimal' | 'moderate' | 'flexible';
  budgetBand?: 'value' | 'mid' | 'premium';
  urgency?: 'relaxed' | 'moderate' | 'event-driven';
  painTolerance?: 'low' | 'medium' | 'high';
  maintenanceWillingness?: 'low' | 'medium' | 'high';
  previousTreatments?: string[];
  seasonality?: 'summer' | 'fall' | 'winter' | 'spring';
  contraindications?: string[];
}

export interface RecommendedService {
  service: UnifiedService;
  phase: 1 | 2 | 3;
  reason: string;
  fitScore: number;
  quickWin?: boolean;
  anchorTreatment?: boolean;
  whyThisPhase?: string;
}

// ─── Constants ────────────────────────────────────────────────────────

// Map common intake concern labels to catalog concern keys
const CONCERN_ALIASES: Record<string, string[]> = {
  'acne': ['acne'],
  'breakouts': ['acne'],
  'aging': ['aging-skin'],
  'anti-aging': ['aging-skin'],
  'wrinkles': ['aging-skin'],
  'fine lines': ['aging-skin'],
  'pigmentation': ['hyperpigmentation'],
  'dark spots': ['hyperpigmentation'],
  'melasma': ['hyperpigmentation'],
  'sun damage': ['sun-damage', 'hyperpigmentation'],
  'dull skin': ['dull-skin'],
  'dullness': ['dull-skin'],
  'large pores': ['large-pores'],
  'pores': ['large-pores'],
  'sagging': ['skin-laxity'],
  'skin laxity': ['skin-laxity'],
  'loose skin': ['skin-laxity'],
  'body contouring': ['body-contouring'],
  'hair removal': ['unwanted-hair'],
  'unwanted hair': ['unwanted-hair'],
  'texture': ['acne', 'dull-skin'],
  'scarring': ['acne'],
  'acne scars': ['acne'],
  'redness': ['dull-skin'],
  'hydration': ['dull-skin'],
  'dehydration': ['dull-skin'],
  'weight loss': ['body-contouring'],
  'weight management': ['body-contouring'],
};

// Categories that go in each phase.
//
// Wave 11 Bug 2 fix: `facial` and `skincare` were previously listed in
// BOTH phase 1 and phase 3, but `assignPhase` iterates 1 → 2 → 3 and
// returns on the first match — which meant phase-3 maintenance facials
// were unreachable except via the post-hoc "empty phase" redistribution
// loop. Each category now lives in exactly ONE phase; maintenance-style
// services (facial, skincare) belong to phase 3 as their primary home.
//
// Wave 11 Bug 3 fix: `laser-hair-removal` was not in any phase set, so
// `assignPhase` fell through to the `price > 400 ? 2 : 1` ternary which
// can never return 3. It's now explicitly mapped to phase 2 (core
// treatment) where LHR sessions naturally belong.
const PHASE_CATEGORIES: Record<1 | 2 | 3, Set<string>> = {
  1: new Set(['consultation', 'chemical-peel', 'labs']),
  2: new Set(['rf-microneedling', 'skin-tightening', 'laser', 'scar-reduction', 'injectables', 'laser-hair-removal']),
  3: new Set(['wellness', 'skincare', 'facial', 'hair', 'weight-management', 'hormones']),
};

// Wave 11 Bug 5 follow-up: canonical variant markers. Each parentSlug has
// one "flagship" service that the dashboard/plan-builder should lead with
// (Signature HydraFacial rather than Express; Full Face Sofwave rather
// than Brow; Botox rather than a sub-variant). These get a small scoring
// boost AND are promoted to the front of same-score ties in the sort
// so the primary variant isn't silently dropped in favour of a
// sub-treatment that happened to be cheaper or catalog-order-earlier.
const CANONICAL_VARIANTS = new Set<string>([
  'hydrafacial-signature',
  'sofwave-full-face',
  'botox',
]);

// Categories considered aggressive for Fitzpatrick and seasonality scoring
const AGGRESSIVE_LASER_CATEGORIES = new Set(['laser', 'scar-reduction']);
const AGGRESSIVE_PEEL_IDS = new Set(['vi-peel']); // deeper peels
const RF_CATEGORIES = new Set(['rf-microneedling']);
const HYDRATION_CATEGORIES = new Set(['facial']);
const LIGHT_PEEL_IDS = new Set(['biorepeel-face', 'biorepeel-face-neck', 'prx-t33']);

// High-downtime service IDs/categories
const HIGH_DOWNTIME_CATEGORIES = new Set(['rf-microneedling', 'scar-reduction']);
const MODERATE_DOWNTIME_CATEGORIES = new Set(['chemical-peel', 'laser']);
const NO_DOWNTIME_CATEGORIES = new Set(['facial', 'wellness', 'skincare', 'consultation', 'labs']);

// Quick-win eligible: fast visible results, low downtime
const QUICK_WIN_IDS = new Set([
  'hydrafacial-signature', 'hydrafacial-express', 'biorepeel-face',
  'biorepeel-face-neck', 'prx-t33', 'laser-facial-ndyag',
  'vi-peel', 'glutathione-injection',
]);

// Anchor treatment: deep-work, structural treatments
const ANCHOR_IDS = new Set([
  'sofwave-full-face', 'sofwave-full-face-neck', 'sofwave-lower-face', 'sofwave-brow',
  'sofwave-neck', 'rf-micro-face', 'rf-micro-face-neck', 'prx-t33',
  'scar-combination', 'scar-rf-micro', 'scar-laser-small',
]);

// Premium-tier service IDs (only included for premium budget)
const PREMIUM_SERVICE_SLUGS = new Set(['sofwave', 'dermal-fillers']);

// Contraindication hard-exclusion map
const CONTRAINDICATION_EXCLUSIONS: Record<string, Set<string>> = {
  'pregnancy': new Set(['botox', 'dermal-fillers', 'tretinoin', 'vi-peel', 'biorepeel-face', 'biorepeel-face-neck', 'biorepeel-back', 'biorepeel-intimate', 'biorepeel-underarms', 'biorepeel-hands', 'prx-t33']),
  'blood-thinners': new Set(['botox', 'dermal-fillers', 'rf-micro-face', 'rf-micro-face-neck', 'rf-micro-abdomen-small', 'rf-micro-back-legs', 'rf-micro-arms', 'rf-micro-buttocks', 'rf-micro-abdomen-large', 'rf-micro-legs']),
  'retinoid-use': new Set(['vi-peel', 'laser-facial-ndyag']),
  'active-infection': new Set(['rf-micro-face', 'rf-micro-face-neck', 'botox', 'dermal-fillers']),
  'keloid-prone': new Set(['rf-micro-face', 'rf-micro-face-neck', 'scar-rf-micro', 'scar-combination']),
  'autoimmune': new Set(['botox', 'dermal-fillers']),
};

// ─── Phase explanations ───────────────────────────────────────────────

const PHASE_EXPLANATIONS: Record<string, Record<1 | 2 | 3, string>> = {
  'facial': {
    1: 'Establishes a hydrated baseline and gives you an immediate glow before deeper treatments begin',
    2: 'Maintains skin health between intensive treatments and supports recovery',
    3: 'Periodic facials keep results fresh and your skin barrier strong long-term',
  },
  'chemical-peel': {
    1: 'Jumpstarts cell turnover and preps your skin surface for the advanced treatments ahead',
    2: 'Deeper peels address stubborn pigmentation and texture now that your skin is conditioned',
    3: 'Maintenance peels extend and protect the improvements from your core treatment series',
  },
  'rf-microneedling': {
    1: 'When skin is already prepped, starting RF microneedling early accelerates collagen remodeling',
    2: 'Now that your skin is prepped, RF microneedling drives collagen production for lasting structural improvement',
    3: 'Follow-up RF sessions maintain collagen density and continue tightening over time',
  },
  'skin-tightening': {
    1: 'Sofwave delivers immediate lift with results that build over 3 months — starting early maximizes your timeline',
    2: 'Sofwave at this stage provides the structural lift that complements your foundation treatments',
    3: 'A maintenance Sofwave session preserves your lift and resets collagen production',
  },
  'laser': {
    1: 'A laser facial early on addresses surface-level concerns and preps deeper layers for what follows',
    2: 'Laser treatments at this stage target deeper pigmentation and scarring for transformative results',
    3: 'Maintenance laser sessions keep pigmentation at bay and refine texture long-term',
  },
  'injectables': {
    1: 'Starting with injectables delivers the most immediately visible change to set the tone',
    2: 'Injectables at this stage complement the structural work from energy-based devices',
    3: 'Touch-up injections maintain your results and keep everything looking natural',
  },
  'skincare': {
    1: 'Building a medical-grade routine from day one optimizes every treatment that follows',
    2: 'Active skincare ingredients amplify your in-clinic treatment results between sessions',
    3: 'Maintains and builds on your results at home between clinic visits',
  },
  'scar-reduction': {
    1: 'Early scar assessment sets realistic expectations and establishes a treatment baseline',
    2: 'Scar revision at this stage gives the most dramatic improvement with your skin already conditioned',
    3: 'Follow-up scar sessions refine texture and smooth remaining irregularities',
  },
  'wellness': {
    1: 'Wellness injections boost your body from the inside, creating a stronger foundation for aesthetic results',
    2: 'Supporting your body with key nutrients enhances healing and recovery between treatments',
    3: 'Ongoing wellness support sustains your energy and skin health for the long haul',
  },
  'consultation': {
    1: 'A comprehensive assessment ensures every treatment in your plan is tailored to your unique skin',
    2: 'A mid-plan check-in lets us adjust your protocol based on how your skin is responding',
    3: 'A maintenance consultation reviews your progress and plans next steps to protect your investment',
  },
  'labs': {
    1: 'Baseline labs ensure your body is ready and help us personalize your treatment approach',
    2: 'Mid-program labs track your response and let us fine-tune dosing or protocols',
    3: 'Follow-up labs confirm everything is on track for long-term health and results',
  },
  'weight-management': {
    1: 'Starting GLP-1 therapy early lets the weight loss compound alongside your aesthetic treatments',
    2: 'Dose titration at this stage maximizes fat loss while your body adapts',
    3: 'Maintenance dosing sustains your weight loss and protects the body contouring results you have achieved',
  },
  'hair': {
    1: 'Starting hair restoration early means visible thickness sooner — hair growth takes time',
    2: 'Continued treatments strengthen new growth and target remaining thinning areas',
    3: 'Maintenance sessions protect your hair density investment long-term',
  },
  'laser-hair-removal': {
    1: 'Starting laser hair removal in Phase 1 spaces sessions properly for the hair growth cycle',
    2: 'Continuing laser sessions during active treatment maximizes permanent reduction',
    3: 'Touch-up sessions catch any regrowth and lock in your smooth results',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function normalizeConcerns(rawConcerns: string[]): string[] {
  const catalogConcerns = new Set<string>();
  for (const raw of rawConcerns) {
    const lower = raw.toLowerCase().trim();
    const aliases = CONCERN_ALIASES[lower];
    if (aliases) {
      aliases.forEach((a) => catalogConcerns.add(a));
    } else {
      catalogConcerns.add(lower);
    }
  }
  return [...catalogConcerns];
}

function isExcludedByContraindications(
  service: UnifiedService,
  contraindications: string[]
): boolean {
  for (const contra of contraindications) {
    const lower = contra.toLowerCase().trim();
    const exclusions = CONTRAINDICATION_EXCLUSIONS[lower];
    if (exclusions && exclusions.has(service.id)) {
      return true;
    }
  }
  return false;
}

function isRecentlyHad(service: UnifiedService, previousTreatments: string[]): boolean {
  // Wave 11 Bug 1 fix: strip empty / whitespace-only entries and require a
  // minimum token length of 3 before using them in substring matching.
  // Previously `['']` produced a match against every service (since every
  // string includes `''`), silently applying a -30 penalty across the
  // whole plan. Single-character tokens like `'b'` also matched Botox,
  // BioRePeel, B12, etc. — any length-1 or length-2 token was basically
  // unusable as a "recently had" signal. The threshold of 3 keeps all
  // real service names (`botox`, `sofwave`, `hydrafacial`) while blocking
  // the poison inputs.
  const prevLower = previousTreatments
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length >= 3);
  if (prevLower.length === 0) return false;
  const serviceLower = service.name.toLowerCase();
  const slugLower = service.parentSlug?.toLowerCase() ?? '';
  return prevLower.some(
    (prev) =>
      serviceLower.includes(prev) ||
      (slugLower.length > 0 && prev.includes(slugLower)) ||
      (slugLower.length > 0 && slugLower.includes(prev)) ||
      prev.includes(service.id)
  );
}

function scoreService(
  service: UnifiedService,
  catalogConcerns: string[],
  treatmentInterests: string[],
  profile?: ClientProfile
): number {
  let score = 0;

  // ── Concern match (strongest signal) ──
  const concernMatches = service.concerns.filter((c) => catalogConcerns.includes(c)).length;
  score += concernMatches * 30;

  // ── Treatment interest match ──
  const interestLower = treatmentInterests.map((i) => i.toLowerCase());
  if (interestLower.some((i) => service.name.toLowerCase().includes(i))) score += 15;
  if (interestLower.some((i) => service.category.includes(i))) score += 10;

  // ── Prefer face treatments (most common concern area) ──
  if (service.bodyAreas.includes('face')) score += 5;

  // ── Prefer financing-eligible (higher-value treatments) ──
  if (service.financingEligible) score += 3;

  // Wave 11 Bug 5 follow-up: the previous `-5 for price > 2000` penalty
  // was too coarse — it arbitrarily dinged Sofwave Full Face ($2250),
  // Full Face + Neck ($3999), and other flagship premium variants with
  // the same flat penalty, making them systematically lose parentSlug
  // dedupe ties to cheaper sub-treatments (e.g. Sofwave Brow $1150).
  // The budget-band scoring block below already handles
  // budget-appropriate penalties (value band dings > $800), so the
  // blanket luxury penalty is redundant and removed.

  // ── Prefer standard session counts ──
  if (service.sessions >= 3) score += 5;

  // ── Prefer canonical / flagship variants of each parentSlug ──
  // Wave 11 Bug 5 follow-up: keeps the primary variant (e.g. "Signature
  // HydraFacial", "Sofwave Full Face") from being silently replaced by a
  // sub-treatment that happens to be cheaper.
  if (CANONICAL_VARIANTS.has(service.id)) score += 5;

  // ── Profile-based scoring adjustments ──
  if (profile) {
    // Fitzpatrick type: penalize aggressive laser for types 4-6, prefer RF/chemical
    if (profile.fitzpatrickType && profile.fitzpatrickType >= 4) {
      if (AGGRESSIVE_LASER_CATEGORIES.has(service.category)) {
        score -= 20;
      }
      if (RF_CATEGORIES.has(service.category) || service.category === 'chemical-peel') {
        score += 10;
      }
    }

    // Downtime tolerance
    if (profile.downtimeTolerance) {
      if (profile.downtimeTolerance === 'none') {
        if (HIGH_DOWNTIME_CATEGORIES.has(service.category)) score -= 25;
        if (MODERATE_DOWNTIME_CATEGORIES.has(service.category)) score -= 10;
        if (NO_DOWNTIME_CATEGORIES.has(service.category)) score += 10;
      } else if (profile.downtimeTolerance === 'minimal') {
        if (HIGH_DOWNTIME_CATEGORIES.has(service.category)) score -= 15;
        if (NO_DOWNTIME_CATEGORIES.has(service.category)) score += 5;
      } else if (profile.downtimeTolerance === 'flexible') {
        if (HIGH_DOWNTIME_CATEGORIES.has(service.category)) score += 5;
      }
    }

    // Budget band
    if (profile.budgetBand) {
      if (profile.budgetBand === 'value') {
        if (service.price > 800) score -= 15;
        if (service.price <= 350) score += 5;
        if (PREMIUM_SERVICE_SLUGS.has(service.parentSlug ?? '')) score -= 20;
      } else if (profile.budgetBand === 'premium') {
        if (PREMIUM_SERVICE_SLUGS.has(service.parentSlug ?? '')) score += 10;
        if (service.financingEligible) score += 5;
      }
    }

    // Urgency: event-driven → quick results
    if (profile.urgency === 'event-driven') {
      if (service.sessions <= 1) score += 10;
      if (QUICK_WIN_IDS.has(service.id)) score += 10;
      if (service.sessions >= 6) score -= 10;
    } else if (profile.urgency === 'relaxed') {
      if (service.sessions >= 3) score += 5;
    }

    // Pain tolerance
    if (profile.painTolerance === 'low') {
      if (RF_CATEGORIES.has(service.category)) score -= 15;
      if (HYDRATION_CATEGORIES.has(service.category)) score += 10;
      if (LIGHT_PEEL_IDS.has(service.id)) score += 5;
    } else if (profile.painTolerance === 'high') {
      // No penalty on anything — all options open
      if (RF_CATEGORIES.has(service.category)) score += 3;
    }

    // Previous treatments: penalize recently had
    if (profile.previousTreatments && profile.previousTreatments.length > 0) {
      if (isRecentlyHad(service, profile.previousTreatments)) {
        score -= 30;
      }
    }

    // Seasonality
    if (profile.seasonality === 'summer') {
      if (AGGRESSIVE_LASER_CATEGORIES.has(service.category)) score -= 15;
      if (AGGRESSIVE_PEEL_IDS.has(service.id)) score -= 10;
      if (HYDRATION_CATEGORIES.has(service.category)) score += 10;
    } else if (profile.seasonality === 'winter') {
      if (AGGRESSIVE_LASER_CATEGORIES.has(service.category)) score += 10;
      if (service.category === 'chemical-peel') score += 5;
    }
  }

  return score;
}

function assignPhase(service: UnifiedService): 1 | 2 | 3 {
  for (const [phase, categories] of Object.entries(PHASE_CATEGORIES)) {
    if (categories.has(service.category)) {
      return Number(phase) as 1 | 2 | 3;
    }
  }
  return service.price > 400 ? 2 : 1;
}

function generateReason(service: UnifiedService, matchedConcerns: string[]): string {
  if (matchedConcerns.length > 0) {
    return `Addresses ${matchedConcerns.join(', ')}`;
  }
  return `Recommended for your treatment goals`;
}

function getWhyThisPhase(service: UnifiedService, phase: 1 | 2 | 3): string {
  const categoryExplanations = PHASE_EXPLANATIONS[service.category];
  if (categoryExplanations && categoryExplanations[phase]) {
    return categoryExplanations[phase];
  }
  // Fallback explanations by phase
  const fallbacks: Record<1 | 2 | 3, string> = {
    1: 'Lays the groundwork for your transformation with foundational care',
    2: 'Delivers the core treatment intensity for maximum visible improvement',
    3: 'Protects and extends your results with ongoing maintenance',
  };
  return fallbacks[phase];
}

// ─── Core recommendation logic ────────────────────────────────────────

function buildRecommendations(
  skinConcerns: string[],
  treatmentInterests: string[],
  profile?: ClientProfile
): RecommendedService[] {
  if (skinConcerns.length === 0 && treatmentInterests.length === 0) {
    return [];
  }

  const catalogConcerns = normalizeConcerns(skinConcerns);
  const contraindications = profile?.contraindications ?? [];

  // Find all matching services
  const candidateSet = new Set<string>();
  const candidates: { service: UnifiedService; matchedConcerns: string[] }[] = [];

  for (const concern of catalogConcerns) {
    const matches = getServicesByConcern(concern);
    for (const svc of matches) {
      if (!candidateSet.has(svc.id)) {
        // Hard-exclude contraindicated services
        if (contraindications.length > 0 && isExcludedByContraindications(svc, contraindications)) {
          continue;
        }
        candidateSet.add(svc.id);
        candidates.push({
          service: svc,
          matchedConcerns: [concern],
        });
      } else {
        const existing = candidates.find((c) => c.service.id === svc.id);
        if (existing) existing.matchedConcerns.push(concern);
      }
    }
  }

  // If no concern matches, try interest-based search
  if (candidates.length === 0) {
    for (const interest of treatmentInterests) {
      const lower = interest.toLowerCase();
      for (const svc of UNIFIED_CATALOG) {
        if (
          !candidateSet.has(svc.id) &&
          (svc.name.toLowerCase().includes(lower) ||
            svc.category.includes(lower) ||
            svc.description.toLowerCase().includes(lower))
        ) {
          if (contraindications.length > 0 && isExcludedByContraindications(svc, contraindications)) {
            continue;
          }
          candidateSet.add(svc.id);
          candidates.push({ service: svc, matchedConcerns: [] });
        }
      }
    }
  }

  // Score and sort. Wave 11 Bug 5 follow-up: ties are broken by canonical
  // variant preference (flagships win ties over sub-treatments of the same
  // parent slug) before falling back to insertion order.
  const scored = candidates
    .map((c) => ({
      ...c,
      fitScore: scoreService(c.service, catalogConcerns, treatmentInterests, profile),
      phase: assignPhase(c.service),
    }))
    .sort((a, b) => {
      if (a.fitScore !== b.fitScore) return b.fitScore - a.fitScore;
      const aCan = CANONICAL_VARIANTS.has(a.service.id) ? 1 : 0;
      const bCan = CANONICAL_VARIANTS.has(b.service.id) ? 1 : 0;
      return bCan - aCan;
    });

  // Determine max per phase based on budget
  const maxPerPhase = profile?.budgetBand === 'value' ? 2 : 3;
  const maxTotal = profile?.budgetBand === 'value' ? 6 : 8;

  // Select top services per phase
  const phaseCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  const selected: RecommendedService[] = [];

  for (const candidate of scored) {
    if (selected.length >= maxTotal) break;
    if (phaseCounts[candidate.phase] >= maxPerPhase) {
      const altPhase = ([1, 2, 3] as const).find((p) => phaseCounts[p] < maxPerPhase);
      if (!altPhase) continue;
      candidate.phase = altPhase;
    }

    // Avoid duplicate parent slugs in same phase
    if (candidate.service.parentSlug) {
      const hasSameParent = selected.some(
        (s) => s.phase === candidate.phase && s.service.parentSlug === candidate.service.parentSlug
      );
      if (hasSameParent) continue;
    }

    phaseCounts[candidate.phase]++;
    selected.push({
      service: candidate.service,
      phase: candidate.phase,
      reason: generateReason(candidate.service, candidate.matchedConcerns),
      fitScore: candidate.fitScore,
      whyThisPhase: getWhyThisPhase(candidate.service, candidate.phase),
    });
  }

  // Ensure at least 1 service per phase if possible
  const emptyPhases = ([1, 2, 3] as const).filter((p) => !selected.some((s) => s.phase === p));
  for (const phase of emptyPhases) {
    const donorPhase = ([1, 2, 3] as const).find(
      (p) => selected.filter((s) => s.phase === p).length > 1
    );
    if (donorPhase) {
      const items = selected.filter((s) => s.phase === donorPhase);
      const last = items[items.length - 1];
      last.phase = phase;
      last.whyThisPhase = getWhyThisPhase(last.service, phase);
    }
  }

  // ── Tag Quick Win ──
  // Must be in Phase 1, gives fast visible results
  const phase1Items = selected.filter((s) => s.phase === 1);
  const quickWinCandidate = phase1Items.find((s) => QUICK_WIN_IDS.has(s.service.id));
  if (quickWinCandidate) {
    quickWinCandidate.quickWin = true;
  } else if (phase1Items.length > 0) {
    // Fallback: pick the highest-scored Phase 1 item in a no-downtime category
    const fallback = phase1Items.find((s) => NO_DOWNTIME_CATEGORIES.has(s.service.category));
    if (fallback) fallback.quickWin = true;
  }

  // ── Tag Anchor Treatment ──
  // The deep-work treatment across the whole plan
  const anchorCandidate = selected.find((s) => ANCHOR_IDS.has(s.service.id));
  if (anchorCandidate) {
    anchorCandidate.anchorTreatment = true;
  } else {
    // Fallback: highest-scored service in Phase 2
    const phase2Items = selected.filter((s) => s.phase === 2);
    if (phase2Items.length > 0) {
      phase2Items[0].anchorTreatment = true;
    }
  }

  return selected;
}

// ─── Exported overloaded function ─────────────────────────────────────

/**
 * Generate AI-recommended treatment plan from a rich client profile.
 * Returns services organized into 3 phases with quickWin and anchorTreatment tags.
 */
export function recommendTreatmentPlan(profile: ClientProfile): RecommendedService[];
/**
 * Generate AI-recommended treatment plan from client concerns and interests.
 * Returns services organized into 3 phases, ready to populate the plan builder.
 * @deprecated Prefer the ClientProfile overload for richer recommendations.
 */
export function recommendTreatmentPlan(
  concerns: string[],
  interests?: string[]
): RecommendedService[];
export function recommendTreatmentPlan(
  profileOrConcerns: ClientProfile | string[],
  interests?: string[]
): RecommendedService[] {
  if (Array.isArray(profileOrConcerns)) {
    // Legacy call: recommendTreatmentPlan(concerns, interests)
    return buildRecommendations(profileOrConcerns, interests ?? []);
  }
  // New call: recommendTreatmentPlan(profile)
  const profile = profileOrConcerns;
  return buildRecommendations(
    profile.skinConcerns,
    profile.treatmentInterests,
    profile
  );
}
