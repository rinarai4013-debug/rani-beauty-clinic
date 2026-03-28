/**
 * Medical Services Catalog
 * Rani Beauty Clinic
 *
 * Full service definitions with pricing, margins, clinical requirements,
 * and metadata for all medical weight loss and wellness services.
 */

import type { ServiceDefinition, ServiceCategory, RevenueCalc } from './types';

// ============================================================
// GLP-1 SERVICES
// ============================================================

export const SEMAGLUTIDE_MONTHLY: ServiceDefinition = {
  id: 'glp1-sema-monthly',
  name: 'Semaglutide Monthly Program',
  category: 'glp1',
  priceRange: { min: 299, max: 499 },
  margin: 65,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Medullary thyroid carcinoma (personal or family history)',
    'Multiple Endocrine Neoplasia syndrome type 2 (MEN2)',
    'Type 1 Diabetes',
    'Pregnancy',
    'Breastfeeding',
    'History of pancreatitis',
    'Severe gastroparesis',
  ],
  labsRequired: ['CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Free T4'],
  refillCadence: 30,
  description: 'Monthly compounded semaglutide injection program for medical weight loss. Includes dose titration management and monthly check-ins.',
  isActive: true,
};

export const TIRZEPATIDE_MONTHLY: ServiceDefinition = {
  id: 'glp1-tirz-monthly',
  name: 'Tirzepatide Monthly Program',
  category: 'glp1',
  priceRange: { min: 399, max: 599 },
  margin: 60,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Medullary thyroid carcinoma (personal or family history)',
    'Multiple Endocrine Neoplasia syndrome type 2 (MEN2)',
    'Type 1 Diabetes',
    'Pregnancy',
    'Breastfeeding',
    'History of pancreatitis',
    'Severe gastroparesis',
  ],
  labsRequired: ['CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Free T4'],
  refillCadence: 30,
  description: 'Monthly compounded tirzepatide injection program for medical weight loss. Dual GIP/GLP-1 receptor agonist with dose titration management.',
  isActive: true,
};

export const VIP_TRANSFORM: ServiceDefinition = {
  id: 'glp1-vip-transform',
  name: 'VIP Transform Program',
  category: 'glp1',
  priceRange: { min: 1199, max: 1199 },
  margin: 70,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Medullary thyroid carcinoma (personal or family history)',
    'Multiple Endocrine Neoplasia syndrome type 2 (MEN2)',
    'Type 1 Diabetes',
    'Pregnancy',
    'Breastfeeding',
    'History of pancreatitis',
    'Severe gastroparesis',
  ],
  labsRequired: ['CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Free T4', 'Insulin', 'Vitamin D'],
  refillCadence: 90,
  description: '3-month VIP weight loss program. Includes premium GLP-1 medication, weekly check-ins, nutrition guidance, body composition tracking, and priority provider access.',
  isActive: true,
};

// ============================================================
// PEPTIDE SERVICES
// ============================================================

export const NAD_PLUS: ServiceDefinition = {
  id: 'peptide-nad-plus',
  name: 'NAD+ Injection Therapy',
  category: 'peptide',
  priceRange: { min: 399, max: 399 },
  margin: 55,
  requiresLabs: false,
  requiresGFE: true,
  contraindications: [
    'Active cancer treatment',
    'Pregnancy',
    'Breastfeeding',
    'Severe liver disease',
  ],
  labsRequired: [],
  refillCadence: 30,
  description: 'NAD+ injection therapy for cellular energy, anti-aging, and cognitive support. Monthly subscription program.',
  isActive: true,
};

export const SERMORELIN: ServiceDefinition = {
  id: 'peptide-sermorelin',
  name: 'Sermorelin Growth Hormone Peptide',
  category: 'peptide',
  priceRange: { min: 349, max: 349 },
  margin: 58,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Active cancer',
    'Pregnancy',
    'Breastfeeding',
    'Pituitary disorders',
    'Hypothalamic disorders',
  ],
  labsRequired: ['IGF-1', 'CMP', 'CBC'],
  refillCadence: 30,
  description: 'Sermorelin injection therapy for growth hormone optimization. Supports muscle recovery, fat loss, sleep quality, and anti-aging.',
  isActive: true,
};

export const GLUTATHIONE_INJECTION: ServiceDefinition = {
  id: 'peptide-glutathione',
  name: 'Glutathione Injection Therapy',
  category: 'peptide',
  priceRange: { min: 299, max: 299 },
  margin: 60,
  requiresLabs: false,
  requiresGFE: true,
  contraindications: [
    'Pregnancy',
    'Breastfeeding',
    'Sulfite sensitivity',
  ],
  labsRequired: [],
  refillCadence: 30,
  description: 'Glutathione injection therapy for detox, skin brightening, and immune support. The body\'s master antioxidant.',
  isActive: true,
};

export const GHK_CU: ServiceDefinition = {
  id: 'peptide-ghk-cu',
  name: 'GHK-Cu Copper Peptide',
  category: 'peptide',
  priceRange: { min: 349, max: 349 },
  margin: 55,
  requiresLabs: false,
  requiresGFE: true,
  contraindications: [
    'Pregnancy',
    'Breastfeeding',
    'Copper sensitivity',
    'Wilson\'s disease',
  ],
  labsRequired: [],
  refillCadence: 30,
  description: 'GHK-Cu peptide injection for tissue repair, collagen production, and skin regeneration.',
  isActive: true,
};

export const PT_141: ServiceDefinition = {
  id: 'peptide-pt141',
  name: 'PT-141 (Bremelanotide)',
  category: 'peptide',
  priceRange: { min: 299, max: 299 },
  margin: 58,
  requiresLabs: false,
  requiresGFE: true,
  contraindications: [
    'Pregnancy',
    'Breastfeeding',
    'Uncontrolled hypertension',
    'Cardiovascular disease',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'PT-141 injection therapy for sexual wellness. Activates melanocortin receptors for improved intimate function.',
  isActive: true,
};

export const BPC_157: ServiceDefinition = {
  id: 'peptide-bpc157',
  name: 'BPC-157 Recovery Peptide',
  category: 'peptide',
  priceRange: { min: 349, max: 349 },
  margin: 55,
  requiresLabs: false,
  requiresGFE: true,
  contraindications: [
    'Pregnancy',
    'Breastfeeding',
    'Active cancer',
  ],
  labsRequired: [],
  refillCadence: 30,
  description: 'BPC-157 injection therapy for accelerated tissue repair, gut healing, and injury recovery.',
  isActive: true,
};

// ============================================================
// HORMONE SERVICES
// ============================================================

export const TESTOSTERONE_THERAPY: ServiceDefinition = {
  id: 'hormone-testosterone',
  name: 'Testosterone Optimization',
  category: 'hormone',
  priceRange: { min: 349, max: 499 },
  margin: 60,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Prostate cancer',
    'Breast cancer',
    'Pregnancy',
    'Breastfeeding',
    'Polycythemia',
    'Severe sleep apnea (untreated)',
    'Heart failure (severe)',
  ],
  labsRequired: ['Total Testosterone', 'Free Testosterone', 'Estradiol', 'DHEA-S', 'Cortisol', 'TSH', 'Free T4', 'CMP', 'CBC', 'PSA'],
  refillCadence: 30,
  description: 'Testosterone optimization therapy with comprehensive lab monitoring. For patients with clinically low testosterone levels.',
  isActive: true,
};

export const THYROID_THERAPY: ServiceDefinition = {
  id: 'hormone-thyroid',
  name: 'Thyroid Optimization',
  category: 'hormone',
  priceRange: { min: 299, max: 399 },
  margin: 62,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Thyroid cancer',
    'Pregnancy (requires specialist)',
    'Untreated adrenal insufficiency',
  ],
  labsRequired: ['TSH', 'Free T4', 'Free T3', 'TPO Antibodies', 'Thyroglobulin Antibodies', 'CMP'],
  refillCadence: 30,
  description: 'Thyroid optimization therapy for patients with suboptimal thyroid function. Includes comprehensive thyroid panel monitoring.',
  isActive: true,
};

export const DHEA_THERAPY: ServiceDefinition = {
  id: 'hormone-dhea',
  name: 'DHEA Optimization',
  category: 'hormone',
  priceRange: { min: 249, max: 349 },
  margin: 65,
  requiresLabs: true,
  requiresGFE: true,
  contraindications: [
    'Hormone-sensitive cancers',
    'Pregnancy',
    'Breastfeeding',
    'PCOS (relative)',
    'Liver disease',
  ],
  labsRequired: ['DHEA-S', 'Cortisol', 'Total Testosterone', 'Estradiol', 'CMP'],
  refillCadence: 30,
  description: 'DHEA optimization therapy for adrenal support, energy, and hormonal balance.',
  isActive: true,
};

// ============================================================
// WELLNESS INJECTION SERVICES
// ============================================================

export const B12_INJECTION: ServiceDefinition = {
  id: 'wellness-b12',
  name: 'B12 Injection',
  category: 'wellness_injection',
  priceRange: { min: 35, max: 35 },
  margin: 80,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [
    'Cobalt allergy',
    'Leber\'s hereditary optic neuropathy',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'Vitamin B12 injection for energy, focus, and metabolism support.',
  isActive: true,
};

export const BIOTIN_INJECTION: ServiceDefinition = {
  id: 'wellness-biotin',
  name: 'Biotin Injection',
  category: 'wellness_injection',
  priceRange: { min: 45, max: 45 },
  margin: 78,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [],
  labsRequired: [],
  refillCadence: null,
  description: 'Biotin injection for hair, skin, and nail health. Popular add-on for GLP-1 patients.',
  isActive: true,
};

export const GLUTATHIONE_PUSH: ServiceDefinition = {
  id: 'wellness-glutathione-push',
  name: 'Glutathione Push',
  category: 'wellness_injection',
  priceRange: { min: 75, max: 100 },
  margin: 70,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [
    'Sulfite sensitivity',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'IV glutathione push for skin brightening, detox, and immune support.',
  isActive: true,
};

export const NAD_IV_DRIP: ServiceDefinition = {
  id: 'wellness-nad-iv',
  name: 'NAD+ IV Drip',
  category: 'wellness_injection',
  priceRange: { min: 150, max: 250 },
  margin: 55,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [
    'Active cancer treatment',
    'Severe liver disease',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'NAD+ IV drip therapy for cellular repair, energy, cognitive function, and anti-aging.',
  isActive: true,
};

export const VITAMIN_D3_INJECTION: ServiceDefinition = {
  id: 'wellness-vitamin-d3',
  name: 'Vitamin D3 Injection',
  category: 'wellness_injection',
  priceRange: { min: 50, max: 50 },
  margin: 82,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [
    'Hypercalcemia',
    'Granulomatous diseases',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'High-dose Vitamin D3 injection for immune support, bone health, and mood.',
  isActive: true,
};

export const TRI_IMMUNE_INJECTION: ServiceDefinition = {
  id: 'wellness-tri-immune',
  name: 'Tri-Immune Boost',
  category: 'wellness_injection',
  priceRange: { min: 75, max: 75 },
  margin: 72,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [
    'Shellfish allergy (zinc source dependent)',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'Tri-Immune injection (Glutathione, Zinc, Vitamin C) for maximum immune defense.',
  isActive: true,
};

export const LIPO_MINO_INJECTION: ServiceDefinition = {
  id: 'wellness-lipo-mino',
  name: 'Lipo-Mino Injection',
  category: 'wellness_injection',
  priceRange: { min: 50, max: 50 },
  margin: 75,
  requiresLabs: false,
  requiresGFE: false,
  contraindications: [
    'Sulfa allergy',
  ],
  labsRequired: [],
  refillCadence: null,
  description: 'Lipotropic + B-vitamin injection for enhanced fat burning and energy. Popular GLP-1 add-on.',
  isActive: true,
};

// ============================================================
// CATALOG COLLECTIONS
// ============================================================

/** All GLP-1 services */
export const GLP1_SERVICES: ServiceDefinition[] = [
  SEMAGLUTIDE_MONTHLY,
  TIRZEPATIDE_MONTHLY,
  VIP_TRANSFORM,
];

/** All peptide services */
export const PEPTIDE_SERVICES: ServiceDefinition[] = [
  NAD_PLUS,
  SERMORELIN,
  GLUTATHIONE_INJECTION,
  GHK_CU,
  PT_141,
  BPC_157,
];

/** All hormone services */
export const HORMONE_SERVICES: ServiceDefinition[] = [
  TESTOSTERONE_THERAPY,
  THYROID_THERAPY,
  DHEA_THERAPY,
];

/** All wellness injection services */
export const WELLNESS_INJECTION_SERVICES: ServiceDefinition[] = [
  B12_INJECTION,
  BIOTIN_INJECTION,
  GLUTATHIONE_PUSH,
  NAD_IV_DRIP,
  VITAMIN_D3_INJECTION,
  TRI_IMMUNE_INJECTION,
  LIPO_MINO_INJECTION,
];

/** Complete services catalog */
export const ALL_SERVICES: ServiceDefinition[] = [
  ...GLP1_SERVICES,
  ...PEPTIDE_SERVICES,
  ...HORMONE_SERVICES,
  ...WELLNESS_INJECTION_SERVICES,
];

/** Services by category */
export const SERVICES_BY_CATEGORY: Record<ServiceCategory, ServiceDefinition[]> = {
  glp1: GLP1_SERVICES,
  peptide: PEPTIDE_SERVICES,
  hormone: HORMONE_SERVICES,
  wellness_injection: WELLNESS_INJECTION_SERVICES,
};

// ============================================================
// CATALOG LOOKUPS
// ============================================================

/**
 * Finds a service by its ID.
 */
export function getServiceById(serviceId: string): ServiceDefinition | undefined {
  return ALL_SERVICES.find((s) => s.id === serviceId);
}

/**
 * Finds services by category.
 */
export function getServicesByCategory(category: ServiceCategory): ServiceDefinition[] {
  return SERVICES_BY_CATEGORY[category] ?? [];
}

/**
 * Returns all services that require lab work.
 */
export function getServicesRequiringLabs(): ServiceDefinition[] {
  return ALL_SERVICES.filter((s) => s.requiresLabs);
}

/**
 * Returns all services that require a Good Faith Exam.
 */
export function getServicesRequiringGFE(): ServiceDefinition[] {
  return ALL_SERVICES.filter((s) => s.requiresGFE);
}

/**
 * Returns all active services.
 */
export function getActiveServices(): ServiceDefinition[] {
  return ALL_SERVICES.filter((s) => s.isActive);
}

/**
 * Returns services that match a set of keywords (name or description).
 */
export function searchServices(query: string): ServiceDefinition[] {
  const lower = query.toLowerCase();
  return ALL_SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.id.toLowerCase().includes(lower)
  );
}

// ============================================================
// PRICING & REVENUE
// ============================================================

/**
 * Calculates average price for a service.
 */
export function getAveragePrice(service: ServiceDefinition): number {
  return (service.priceRange.min + service.priceRange.max) / 2;
}

/**
 * Calculates gross profit for a service at a given price.
 */
export function calculateGrossProfit(service: ServiceDefinition, price: number): number {
  return price * (service.margin / 100);
}

/**
 * Calculates cost of goods sold for a service at a given price.
 */
export function calculateCOGS(service: ServiceDefinition, price: number): number {
  return price * (1 - service.margin / 100);
}

/**
 * Calculates annual revenue projection for a service.
 */
export function calculateAnnualRevenue(service: ServiceDefinition, price?: number): RevenueCalc {
  const monthlyPrice = price ?? getAveragePrice(service);

  if (service.refillCadence === null) {
    // One-time service
    return {
      monthly: 0,
      quarterly: 0,
      annual: monthlyPrice,
      perVisit: monthlyPrice,
    };
  }

  const visitsPerMonth = 30 / service.refillCadence;
  const monthly = monthlyPrice;
  const quarterly = service.refillCadence === 90 ? monthlyPrice : monthly * 3;
  const annual = service.refillCadence === 90 ? monthlyPrice * 4 : monthly * 12;

  return {
    monthly,
    quarterly,
    annual,
    perVisit: monthlyPrice / visitsPerMonth,
  };
}

/**
 * Returns the total required labs across multiple services (deduplicated).
 */
export function getRequiredLabsForServices(serviceIds: string[]): string[] {
  const labSet = new Set<string>();
  for (const id of serviceIds) {
    const service = getServiceById(id);
    if (service) {
      for (const lab of service.labsRequired) {
        labSet.add(lab);
      }
    }
  }
  return Array.from(labSet).sort();
}

/**
 * Returns all contraindications across multiple services (deduplicated).
 */
export function getContraindicationsForServices(serviceIds: string[]): string[] {
  const contraSet = new Set<string>();
  for (const id of serviceIds) {
    const service = getServiceById(id);
    if (service) {
      for (const c of service.contraindications) {
        contraSet.add(c);
      }
    }
  }
  return Array.from(contraSet).sort();
}

/**
 * Calculates the estimated monthly revenue for a patient based on their services.
 */
export function estimatePatientMonthlyRevenue(serviceIds: string[]): number {
  let total = 0;
  for (const id of serviceIds) {
    const service = getServiceById(id);
    if (!service) continue;

    const avgPrice = getAveragePrice(service);
    if (service.refillCadence === null) {
      // One-time: amortize over 12 months
      total += avgPrice / 12;
    } else if (service.refillCadence === 90) {
      // Quarterly: divide by 3
      total += avgPrice / 3;
    } else {
      // Monthly
      total += avgPrice;
    }
  }
  return Math.round(total);
}

/**
 * Returns a formatted pricing table for display.
 */
export function formatPricingTable(category?: ServiceCategory): string {
  const services = category ? getServicesByCategory(category) : ALL_SERVICES;
  const lines: string[] = [
    'Service'.padEnd(40) + 'Price'.padEnd(18) + 'Margin'.padEnd(10) + 'Labs?'.padEnd(8) + 'GFE?',
    '-'.repeat(84),
  ];

  for (const service of services) {
    const priceStr =
      service.priceRange.min === service.priceRange.max
        ? `$${service.priceRange.min}`
        : `$${service.priceRange.min}-$${service.priceRange.max}`;
    const cadence = service.refillCadence
      ? service.refillCadence === 90
        ? '/3mo'
        : '/mo'
      : '/visit';

    lines.push(
      service.name.padEnd(40) +
        `${priceStr}${cadence}`.padEnd(18) +
        `${service.margin}%`.padEnd(10) +
        (service.requiresLabs ? 'Yes' : 'No').padEnd(8) +
        (service.requiresGFE ? 'Yes' : 'No')
    );
  }

  return lines.join('\n');
}

/**
 * Returns catalog summary statistics.
 */
export function getCatalogStats(): {
  totalServices: number;
  activeServices: number;
  byCategory: Record<ServiceCategory, number>;
  avgMargin: number;
  highestPrice: { service: string; price: number };
  lowestPrice: { service: string; price: number };
} {
  const active = getActiveServices();
  const byCategory: Record<ServiceCategory, number> = {
    glp1: GLP1_SERVICES.length,
    peptide: PEPTIDE_SERVICES.length,
    hormone: HORMONE_SERVICES.length,
    wellness_injection: WELLNESS_INJECTION_SERVICES.length,
  };

  const avgMargin =
    ALL_SERVICES.reduce((sum, s) => sum + s.margin, 0) / ALL_SERVICES.length;

  let highestPrice = { service: '', price: 0 };
  let lowestPrice = { service: '', price: Infinity };

  for (const s of ALL_SERVICES) {
    if (s.priceRange.max > highestPrice.price) {
      highestPrice = { service: s.name, price: s.priceRange.max };
    }
    if (s.priceRange.min < lowestPrice.price) {
      lowestPrice = { service: s.name, price: s.priceRange.min };
    }
  }

  return {
    totalServices: ALL_SERVICES.length,
    activeServices: active.length,
    byCategory,
    avgMargin: Math.round(avgMargin * 10) / 10,
    highestPrice,
    lowestPrice,
  };
}
