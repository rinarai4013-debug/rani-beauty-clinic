// ─── Aftercare Instruction Map ────────────────────────────────────────────────
// Maps service catalog IDs and categories to pre/post care instructions.
// Used by the plan builder to display care instructions for each service phase.
// CRITICAL: "injection" only — never "infusion"

import { UNIFIED_CATALOG, type ServiceCategory } from '@/data/services/unified-catalog';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceCareInstructions {
  preCare: string[];
  postCare: string[];
  avoidAfter: string[];
  expectedDowntime: string;
}

// ─── Category-Level Care Map ─────────────────────────────────────────────────

const CATEGORY_CARE_MAP: Partial<Record<ServiceCategory, ServiceCareInstructions>> = {
  facial: {
    preCare: [
      'Arrive with clean skin, free of makeup and sunscreen',
      'Discontinue retinoids 48 hours before your appointment',
      'Avoid chemical exfoliants for 24 hours prior',
    ],
    postCare: [
      'No makeup for at least 6 hours after treatment',
      'Use a gentle, fragrance-free cleanser for 24 hours',
      'Apply SPF 30+ sunscreen the following morning and daily after',
      'Keep skin hydrated with a gentle moisturizer',
    ],
    avoidAfter: [
      'Makeup for 6 hours',
      'Direct sun exposure for 24 hours',
      'Harsh cleansers or exfoliants for 48 hours',
      'Saunas, steam rooms, or hot tubs for 24 hours',
    ],
    expectedDowntime: 'None — mild redness may last 1-2 hours',
  },

  'chemical-peel': {
    preCare: [
      'Discontinue retinoids and exfoliating acids 5 days before treatment',
      'Avoid prolonged sun exposure for 1 week prior',
      'Do not wax or use depilatory creams on treatment area for 1 week prior',
      'Arrive with clean, product-free skin',
    ],
    postCare: [
      'Do not pick, pull, or peel flaking skin — let it shed naturally',
      'Moisturize frequently with a gentle, fragrance-free moisturizer',
      'Apply SPF 30+ sunscreen daily — reapply every 2 hours if outdoors',
      'Use a gentle cleanser only — no scrubs or exfoliants',
      'Sleep on a clean pillowcase',
    ],
    avoidAfter: [
      'Direct sun exposure for 7 days',
      'Retinoids and exfoliating acids for 7 days post-peel',
      'Picking or peeling flaking skin',
      'Swimming pools, hot tubs, and saunas for 5 days',
      'Strenuous exercise for 48 hours (sweating can irritate skin)',
    ],
    expectedDowntime: '3-7 days of peeling depending on peel depth; redness 1-3 days',
  },

  'rf-microneedling': {
    preCare: [
      'Discontinue blood thinners (aspirin, ibuprofen, fish oil) 48 hours before — consult your prescriber first',
      'Avoid retinoids for 5 days before treatment',
      'No sun exposure or tanning for 1 week prior',
      'Arrive with clean, product-free skin',
    ],
    postCare: [
      'Apply provided post-treatment serum or gentle moisturizer as directed',
      'Keep treated area clean and hydrated',
      'Apply SPF 30+ sunscreen daily starting the following morning',
      'Redness is normal and typically resolves in 2-3 days',
      'Mild swelling may occur for 24-48 hours',
    ],
    avoidAfter: [
      'Makeup for 24 hours',
      'Direct sun exposure for 72 hours',
      'Strenuous exercise and sweating for 24 hours',
      'Retinoids and exfoliating acids for 5 days',
      'Swimming, hot tubs, and saunas for 48 hours',
    ],
    expectedDowntime: '1-3 days of redness; mild swelling for 24-48 hours',
  },

  'skin-tightening': {
    preCare: [
      'Arrive with clean skin, free of makeup and products',
      'Avoid excessive sun exposure for 1 week prior',
      'Stay well hydrated in the days leading up to treatment',
    ],
    postCare: [
      'Apply SPF 30+ sunscreen daily',
      'Mild redness is normal and typically fades within a few hours',
      'Keep skin moisturized with a gentle moisturizer',
      'Results develop gradually over 3-6 months as collagen remodels',
    ],
    avoidAfter: [
      'Excessive heat (saunas, hot tubs, steam rooms) for 24 hours',
      'Strenuous exercise for 24 hours',
      'Harsh skincare products for 48 hours',
    ],
    expectedDowntime: 'None — mild redness may last a few hours',
  },

  laser: {
    preCare: [
      'Avoid sun exposure and tanning for 2 weeks before treatment',
      'Discontinue retinoids 5 days before treatment',
      'No self-tanner for 2 weeks prior',
      'Arrive with clean, product-free skin',
    ],
    postCare: [
      'Apply SPF 30+ sunscreen daily — reapply every 2 hours if outdoors',
      'Keep treated area moisturized',
      'Use a gentle cleanser only',
      'Possible redness and mild swelling for 3-5 days — this is normal',
    ],
    avoidAfter: [
      'Direct sun exposure for 2 weeks',
      'Tanning beds and self-tanners for 2 weeks',
      'Retinoids and exfoliating acids for 7 days',
      'Picking or scratching the treated area',
      'Strenuous exercise for 48 hours',
    ],
    expectedDowntime: '3-5 days of redness; possible mild swelling',
  },

  'laser-hair-removal': {
    preCare: [
      'Shave the treatment area 24 hours before your appointment',
      'Do not wax, pluck, or use depilatory creams (laser needs the follicle intact)',
      'Avoid sun exposure and tanning for 2 weeks prior',
      'Discontinue retinoids and photosensitizing medications as directed',
      'Arrive with clean, product-free skin',
    ],
    postCare: [
      'Apply a soothing aloe gel or gentle moisturizer to the treated area',
      'Apply SPF 30+ sunscreen daily to exposed treated areas',
      'Treated hairs will shed naturally over 1-3 weeks',
    ],
    avoidAfter: [
      'Hot showers, saunas, and strenuous exercise for 24 hours',
      'Direct sun exposure for 1 week',
      'Waxing or plucking between sessions (shaving is fine)',
      'Deodorant on treated underarms for 24 hours',
      'Fragrant lotions on treated area for 24 hours',
    ],
    expectedDowntime: 'None — mild redness for a few hours',
  },

  injectables: {
    preCare: [
      'Discontinue blood thinners (aspirin, ibuprofen, fish oil, vitamin E) 48 hours before — consult your prescriber first',
      'Avoid alcohol for 24 hours before your appointment',
      'Arrive with clean, makeup-free skin on the treatment area',
    ],
    postCare: [
      'Do not lie down or bend over for 4 hours after Botox',
      'Avoid rubbing or massaging the treated area for 2 weeks',
      'Apply ice gently if there is swelling at the injection site',
      'Sleep face-up the first night after treatment',
    ],
    avoidAfter: [
      'Strenuous exercise for 24 hours',
      'Facial massages, facials, or microneedling for 2 weeks',
      'Lying flat for 4 hours post-Botox',
      'Alcohol for 24 hours',
      'Excessive heat (saunas, hot yoga) for 48 hours',
    ],
    expectedDowntime: 'None — mild swelling or bruising at injection sites for 1-3 days',
  },

  wellness: {
    preCare: [
      'Stay well hydrated before your appointment',
      'Eat a light meal or snack before your injection',
    ],
    postCare: [
      'Continue drinking plenty of water for the rest of the day',
      'Injection site may be mildly sore — this is normal and resolves quickly',
      'Light activity is fine immediately after',
    ],
    avoidAfter: [
      'Alcohol for 24 hours',
      'Intense exercise immediately after (wait 1-2 hours)',
    ],
    expectedDowntime: 'None — mild injection site soreness for a few hours',
  },

  'weight-management': {
    preCare: [
      'Fast for 10-12 hours if blood work is being drawn at this visit',
      'Gather your current medication list for review',
      'Have your food diary or tracking app ready to discuss',
    ],
    postCare: [
      'Eat small, frequent meals (5-6 per day instead of 3 large meals)',
      'Prioritize protein at every meal (minimum 60g daily)',
      'Stay hydrated — aim for 64-80 oz of water daily',
      'Track any side effects for discussion at your next appointment',
    ],
    avoidAfter: [
      'High-fat, greasy, or fried foods (worsen GI side effects)',
      'Alcohol for 24 hours after injection',
      'Large, heavy meals (eat small portions)',
      'Carbonated beverages (increase bloating)',
    ],
    expectedDowntime: 'None — mild nausea possible for 1-3 days after dose changes',
  },

  'scar-reduction': {
    preCare: [
      'Avoid sun exposure on the treatment area for 2 weeks prior',
      'Discontinue retinoids 5 days before treatment',
      'Arrive with clean, product-free skin',
    ],
    postCare: [
      'Keep the treated area clean and moisturized',
      'Apply SPF 30+ sunscreen daily to prevent hyperpigmentation',
      'Follow your clinician\'s specific wound care instructions',
    ],
    avoidAfter: [
      'Direct sun exposure on treated area until fully healed',
      'Picking, scratching, or scrubbing the treated area',
      'Harsh skincare products on the treatment zone for 7 days',
      'Swimming and hot tubs until skin has fully healed',
    ],
    expectedDowntime: '2-5 days of redness and mild swelling depending on treatment intensity',
  },

  skincare: {
    preCare: [
      'Discuss your current skincare routine with your provider',
      'Prepare to start slowly — especially with Tretinoin',
    ],
    postCare: [
      'Start with every-other-night application for Tretinoin, building to nightly',
      'Apply SPF 30+ sunscreen every morning — non-negotiable',
      'Use a gentle, hydrating moisturizer to manage dryness',
      'Expect a purging period of 4-6 weeks — this is normal and temporary',
    ],
    avoidAfter: [
      'Mixing Tretinoin with other actives (AHAs, BHAs, vitamin C) initially',
      'Skipping sunscreen (skin is significantly more sun-sensitive)',
      'Waxing on areas where Tretinoin is applied',
    ],
    expectedDowntime: 'No downtime — initial dryness, flaking, and purging for 4-6 weeks',
  },
};

// ─── Service-Specific Overrides ──────────────────────────────────────────────
// For services that need care instructions different from their category default

const SERVICE_CARE_OVERRIDES: Record<string, ServiceCareInstructions> = {
  // VI Peel has stricter post-care than generic chemical-peel
  'vi-peel': {
    preCare: [
      'Discontinue retinoids and exfoliating acids 5 days before treatment',
      'Avoid prolonged sun exposure for 1 week prior',
      'Do not wax treatment area for 1 week prior',
      'Notify your provider of any active cold sores or skin infections',
    ],
    postCare: [
      'Do NOT wash your face for 4 hours after application',
      'Apply the provided VI Peel post-peel protectant as directed',
      'Peeling typically begins on day 3 and completes by day 7',
      'Do not pick, pull, or peel — let skin shed naturally',
      'Moisturize frequently with provided or approved moisturizer',
      'Apply SPF 30+ sunscreen daily',
    ],
    avoidAfter: [
      'Direct sun exposure for 7 days',
      'Retinoids for 10 days post-peel',
      'Picking or peeling flaking skin',
      'Swimming, saunas, and hot tubs for 7 days',
      'Strenuous exercise for 48 hours',
      'Makeup for 24 hours after peel removal',
    ],
    expectedDowntime: '5-7 days of peeling; redness for 1-3 days',
  },

  // BioRePeel is zero-downtime, different from other peels
  'biorepeel-face': {
    preCare: [
      'Discontinue retinoids 3 days before treatment',
      'Arrive with clean, product-free skin',
    ],
    postCare: [
      'Apply SPF 30+ sunscreen daily',
      'Keep skin hydrated with a gentle moisturizer',
      'Skin may feel slightly tight for a few hours — this is normal',
    ],
    avoidAfter: [
      'Direct sun exposure for 48 hours',
      'Retinoids for 3 days',
      'Harsh exfoliants for 48 hours',
    ],
    expectedDowntime: 'None — zero downtime; mild tightness for a few hours',
  },
};

// ─── Combined Lookup Map ─────────────────────────────────────────────────────

export const SERVICE_CARE_MAP: Record<string, ServiceCareInstructions> = (() => {
  const map: Record<string, ServiceCareInstructions> = {};

  // First, populate from category defaults for every catalog service
  for (const svc of UNIFIED_CATALOG) {
    const categoryInstructions = CATEGORY_CARE_MAP[svc.category];
    if (categoryInstructions) {
      map[svc.id] = categoryInstructions;
    }
  }

  // Then, apply service-specific overrides
  for (const [serviceId, instructions] of Object.entries(SERVICE_CARE_OVERRIDES)) {
    map[serviceId] = instructions;
  }

  // Also index by category key for direct category lookups
  for (const [category, instructions] of Object.entries(CATEGORY_CARE_MAP)) {
    map[category] = instructions;
  }

  return map;
})();

// ─── Lookup Function ─────────────────────────────────────────────────────────

/**
 * Look up care instructions for a service by its catalog ID or by category name.
 * Returns null if no matching instructions are found.
 */
export function getCareInstructions(serviceId: string): ServiceCareInstructions | null {
  // Direct lookup by service ID or category
  if (SERVICE_CARE_MAP[serviceId]) {
    return SERVICE_CARE_MAP[serviceId];
  }

  // Try to find the service in the catalog and use its category
  const service = UNIFIED_CATALOG.find((s) => s.id === serviceId);
  if (service) {
    const categoryInstructions = CATEGORY_CARE_MAP[service.category];
    if (categoryInstructions) {
      return categoryInstructions;
    }
  }

  return null;
}
