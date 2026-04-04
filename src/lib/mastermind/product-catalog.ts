/**
 * Rani Beauty Clinic — Retail Product Catalog
 *
 * Single source of truth for all skincare products Rani currently carries
 * and high-margin medspa brands recommended for stocking.
 *
 * Revenue target: $100K+/month retail
 */

// ── Types ──────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'spf'
  | 'treatment'
  | 'eye'
  | 'mask'
  | 'rx';

export interface RetailProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  costToClinic: number;
  margin: number; // 0-1
  activeIngredients: string[];
  skinTypes: string[];
  concerns: string[];
  raniCarries: boolean;
  routineStep: number; // 1=cleanser, 2=toner, 3=treatment/serum, 4=moisturizer, 5=spf, 6=eye, 7=mask
  timing: 'am' | 'pm' | 'both';
  description: string;
  contraindications?: string[];
}

// ── Catalog ────────────────────────────────────────────────────────────

export const PRODUCT_CATALOG: RetailProduct[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // CURRENTLY AVAILABLE — Rani / Olympia Pharmacy
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'rani-ghkcu-05',
    name: 'GHK-Cu Tighten Cream 0.5%',
    brand: 'Rani Rx (Olympia)',
    category: 'treatment',
    price: 149,
    costToClinic: 45,
    margin: 0.70,
    activeIngredients: ['ghk-cu', 'copper peptide'],
    skinTypes: ['normal', 'dry', 'combination', 'mature'],
    concerns: ['aging-skin', 'skin-laxity', 'fine-lines', 'dull-skin'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Copper peptide cream for firming and skin renewal. Entry-level concentration.',
  },
  {
    id: 'rani-ghkcu-2',
    name: 'GHK-Cu Tighten Cream 2%',
    brand: 'Rani Rx (Olympia)',
    category: 'treatment',
    price: 169,
    costToClinic: 50,
    margin: 0.70,
    activeIngredients: ['ghk-cu', 'copper peptide'],
    skinTypes: ['normal', 'dry', 'combination', 'mature'],
    concerns: ['aging-skin', 'skin-laxity', 'fine-lines', 'collagen-loss'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Mid-strength copper peptide cream for visible firming and wrinkle reduction.',
  },
  {
    id: 'rani-ghkcu-4',
    name: 'GHK-Cu Tighten Cream 4%',
    brand: 'Rani Rx (Olympia)',
    category: 'treatment',
    price: 199,
    costToClinic: 60,
    margin: 0.70,
    activeIngredients: ['ghk-cu', 'copper peptide'],
    skinTypes: ['normal', 'dry', 'mature'],
    concerns: ['aging-skin', 'skin-laxity', 'deep-wrinkles', 'collagen-loss'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Maximum-strength copper peptide cream for advanced anti-aging and skin tightening.',
  },
  {
    id: 'rani-nadvantage',
    name: 'NADvantage Glow Cream',
    brand: 'Rani Rx (Olympia)',
    category: 'moisturizer',
    price: 149,
    costToClinic: 45,
    margin: 0.70,
    activeIngredients: ['nad+', 'niacinamide', 'peptides'],
    skinTypes: ['all'],
    concerns: ['dull-skin', 'aging-skin', 'uneven-tone', 'fine-lines'],
    raniCarries: true,
    routineStep: 4,
    timing: 'both',
    description: 'NAD+-infused glow cream that brightens, repairs, and energizes skin at the cellular level.',
  },
  {
    id: 'rani-tretinoin-025',
    name: 'Tretinoin Rx 0.025%',
    brand: 'Rani Rx (Olympia)',
    category: 'rx',
    price: 99,
    costToClinic: 25,
    margin: 0.75,
    activeIngredients: ['tretinoin', 'retinoid'],
    skinTypes: ['sensitive', 'normal', 'combination'],
    concerns: ['acne', 'aging-skin', 'fine-lines', 'hyperpigmentation'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Prescription-strength retinoid for acne and anti-aging. Starter strength.',
    contraindications: ['chemical-peel', 'laser', 'rf-microneedling'],
  },
  {
    id: 'rani-tretinoin-05',
    name: 'Tretinoin Rx 0.05%',
    brand: 'Rani Rx (Olympia)',
    category: 'rx',
    price: 119,
    costToClinic: 30,
    margin: 0.75,
    activeIngredients: ['tretinoin', 'retinoid'],
    skinTypes: ['normal', 'combination', 'oily'],
    concerns: ['acne', 'aging-skin', 'fine-lines', 'hyperpigmentation', 'large-pores'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Mid-strength prescription retinoid for moderate acne and anti-aging.',
    contraindications: ['chemical-peel', 'laser', 'rf-microneedling'],
  },
  {
    id: 'rani-tretinoin-1',
    name: 'Tretinoin Rx 0.1%',
    brand: 'Rani Rx (Olympia)',
    category: 'rx',
    price: 149,
    costToClinic: 35,
    margin: 0.77,
    activeIngredients: ['tretinoin', 'retinoid'],
    skinTypes: ['normal', 'oily'],
    concerns: ['acne', 'aging-skin', 'deep-wrinkles', 'hyperpigmentation', 'large-pores'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Maximum-strength prescription retinoid for stubborn acne and advanced anti-aging.',
    contraindications: ['chemical-peel', 'laser', 'rf-microneedling'],
  },
  {
    id: 'rani-brightening',
    name: 'Rx Brightening Cream',
    brand: 'Rani Rx (Olympia)',
    category: 'treatment',
    price: 99,
    costToClinic: 25,
    margin: 0.75,
    activeIngredients: ['hydroquinone', 'kojic acid', 'niacinamide', 'vitamin c'],
    skinTypes: ['all'],
    concerns: ['hyperpigmentation', 'dark-spots', 'melasma', 'uneven-tone'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Prescription brightening formula targeting stubborn hyperpigmentation and dark spots.',
  },
  {
    id: 'rani-manetain',
    name: 'ManeTain Hair Loss Solution',
    brand: 'Rani Rx (Olympia)',
    category: 'treatment',
    price: 149,
    costToClinic: 45,
    margin: 0.70,
    activeIngredients: ['minoxidil', 'finasteride', 'biotin'],
    skinTypes: ['all'],
    concerns: ['hair-loss', 'hair-thinning'],
    raniCarries: true,
    routineStep: 3,
    timing: 'pm',
    description: 'Compounded hair loss solution combining prescription and nutraceutical actives.',
  },
  {
    id: 'rani-skincare-kit',
    name: 'Medical-Grade Skincare Kit',
    brand: 'Rani Rx (Olympia)',
    category: 'treatment',
    price: 195,
    costToClinic: 55,
    margin: 0.72,
    activeIngredients: ['tretinoin', 'niacinamide', 'hyaluronic acid', 'vitamin c'],
    skinTypes: ['all'],
    concerns: ['aging-skin', 'dull-skin', 'hyperpigmentation', 'acne'],
    raniCarries: true,
    routineStep: 3,
    timing: 'both',
    description: 'Complete medical-grade skincare regimen curated by Rani providers.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RECOMMENDED TO STOCK — High-Margin Medspa Brands
  // ═══════════════════════════════════════════════════════════════════════

  // ── SPF ──────────────────────────────────────────────────────────────
  {
    id: 'eltamd-uv-clear',
    name: 'UV Clear Broad-Spectrum SPF 46',
    brand: 'EltaMD',
    category: 'spf',
    price: 39,
    costToClinic: 15.60,
    margin: 0.60,
    activeIngredients: ['zinc oxide', 'niacinamide', 'hyaluronic acid'],
    skinTypes: ['all', 'acne-prone', 'sensitive', 'rosacea'],
    concerns: ['sun-protection', 'acne', 'rosacea', 'hyperpigmentation'],
    raniCarries: false,
    routineStep: 5,
    timing: 'am',
    description: 'Lightweight, oil-free SPF with niacinamide. #1 dermatologist-recommended sunscreen.',
  },
  {
    id: 'colorescience-spf50',
    name: 'Sunforgettable Total Protection SPF 50',
    brand: 'Colorescience',
    category: 'spf',
    price: 45,
    costToClinic: 18,
    margin: 0.60,
    activeIngredients: ['zinc oxide', 'titanium dioxide', 'iron oxides'],
    skinTypes: ['all', 'sensitive'],
    concerns: ['sun-protection', 'hyperpigmentation', 'post-procedure'],
    raniCarries: false,
    routineStep: 5,
    timing: 'am',
    description: 'Mineral brush-on SPF powder. Perfect for reapplication over makeup. Post-procedure safe.',
  },

  // ── Vitamin C Serums ─────────────────────────────────────────────────
  {
    id: 'skinceuticals-ce-ferulic',
    name: 'C E Ferulic',
    brand: 'SkinCeuticals',
    category: 'serum',
    price: 182,
    costToClinic: 91,
    margin: 0.50,
    activeIngredients: ['vitamin c', 'vitamin e', 'ferulic acid'],
    skinTypes: ['normal', 'dry', 'combination', 'mature'],
    concerns: ['aging-skin', 'fine-lines', 'dull-skin', 'sun-damage', 'hyperpigmentation'],
    raniCarries: false,
    routineStep: 3,
    timing: 'am',
    description: 'Gold-standard vitamin C serum. 15% L-ascorbic acid with vitamin E and ferulic acid.',
  },
  {
    id: 'obagi-pro-c',
    name: 'Professional-C Serum 20%',
    brand: 'Obagi',
    category: 'serum',
    price: 117,
    costToClinic: 52.65,
    margin: 0.55,
    activeIngredients: ['vitamin c', 'l-ascorbic acid'],
    skinTypes: ['normal', 'oily', 'combination'],
    concerns: ['aging-skin', 'dull-skin', 'hyperpigmentation', 'fine-lines'],
    raniCarries: false,
    routineStep: 3,
    timing: 'am',
    description: 'High-concentration vitamin C serum for brightening and antioxidant protection.',
  },

  // ── Hyaluronic Acid ──────────────────────────────────────────────────
  {
    id: 'skinceuticals-ha-intensifier',
    name: 'H.A. Intensifier',
    brand: 'SkinCeuticals',
    category: 'serum',
    price: 105,
    costToClinic: 52.50,
    margin: 0.50,
    activeIngredients: ['hyaluronic acid', 'proxylane', 'licorice root'],
    skinTypes: ['all'],
    concerns: ['dehydration', 'fine-lines', 'dull-skin', 'post-procedure'],
    raniCarries: false,
    routineStep: 3,
    timing: 'both',
    description: 'Multi-molecular hyaluronic acid serum that amplifies skin\'s HA levels by 30%.',
  },
  {
    id: 'pca-ha-serum',
    name: 'Hyaluronic Acid Boosting Serum',
    brand: 'PCA Skin',
    category: 'serum',
    price: 115,
    costToClinic: 51.75,
    margin: 0.55,
    activeIngredients: ['hyaluronic acid', 'niacinamide', 'ceramides'],
    skinTypes: ['all', 'sensitive', 'dry'],
    concerns: ['dehydration', 'fine-lines', 'skin-barrier'],
    raniCarries: false,
    routineStep: 3,
    timing: 'both',
    description: 'Nourishing HA serum with ceramide complex for deep hydration and barrier support.',
  },

  // ── Cleansers ────────────────────────────────────────────────────────
  {
    id: 'zo-exfoliating-cleanser',
    name: 'Exfoliating Cleanser',
    brand: 'ZO Skin Health',
    category: 'cleanser',
    price: 47,
    costToClinic: 21.15,
    margin: 0.55,
    activeIngredients: ['salicylic acid', 'jojoba esters'],
    skinTypes: ['normal', 'oily', 'combination', 'acne-prone'],
    concerns: ['acne', 'large-pores', 'dull-skin', 'oiliness'],
    raniCarries: false,
    routineStep: 1,
    timing: 'both',
    description: 'Exfoliating gel cleanser with microbeads for deep pore cleansing.',
  },
  {
    id: 'is-clinical-cleansing',
    name: 'Cleansing Complex',
    brand: 'iS Clinical',
    category: 'cleanser',
    price: 44,
    costToClinic: 19.80,
    margin: 0.55,
    activeIngredients: ['salicylic acid', 'glycolic acid', 'chamomile', 'centella asiatica'],
    skinTypes: ['all', 'sensitive', 'acne-prone'],
    concerns: ['acne', 'dull-skin', 'large-pores', 'redness'],
    raniCarries: false,
    routineStep: 1,
    timing: 'both',
    description: 'Gentle yet effective cleanser with botanical and bio-nutrient complex.',
  },

  // ── Growth Factor Serums ─────────────────────────────────────────────
  {
    id: 'zo-growth-factor',
    name: 'Growth Factor Serum',
    brand: 'ZO Skin Health',
    category: 'serum',
    price: 162,
    costToClinic: 72.90,
    margin: 0.55,
    activeIngredients: ['growth factors', 'peptides', 'retinol'],
    skinTypes: ['normal', 'dry', 'combination', 'mature'],
    concerns: ['aging-skin', 'fine-lines', 'skin-laxity', 'dull-skin'],
    raniCarries: false,
    routineStep: 3,
    timing: 'pm',
    description: 'DNA repair complex with retinol to restore and strengthen skin.',
    contraindications: ['chemical-peel', 'laser'],
  },
  {
    id: 'skinmedica-tns',
    name: 'TNS Advanced+ Serum',
    brand: 'SkinMedica',
    category: 'serum',
    price: 295,
    costToClinic: 147.50,
    margin: 0.50,
    activeIngredients: ['growth factors', 'peptides', 'retinol', 'vitamin c', 'hyaluronic acid'],
    skinTypes: ['all', 'mature'],
    concerns: ['aging-skin', 'fine-lines', 'deep-wrinkles', 'skin-laxity', 'dull-skin'],
    raniCarries: false,
    routineStep: 3,
    timing: 'pm',
    description: 'All-in-one growth factor serum with 93% improvement in skin smoothness.',
  },
  {
    id: 'defenage-bioserum',
    name: '8-in-1 BioSerum',
    brand: 'DefenAge',
    category: 'serum',
    price: 198,
    costToClinic: 99,
    margin: 0.50,
    activeIngredients: ['defensins', 'niacinamide', 'hyaluronic acid', 'beta-glucan'],
    skinTypes: ['all'],
    concerns: ['aging-skin', 'fine-lines', 'large-pores', 'dull-skin', 'uneven-tone'],
    raniCarries: false,
    routineStep: 3,
    timing: 'both',
    description: 'Defensin molecule serum that activates dormant stem cells for age-repair.',
  },

  // ── Regenerative / Post-Procedure ────────────────────────────────────
  {
    id: 'alastin-regen-nectar',
    name: 'Regenerating Skin Nectar',
    brand: 'Alastin',
    category: 'serum',
    price: 195,
    costToClinic: 97.50,
    margin: 0.50,
    activeIngredients: ['trihex technology', 'peptides', 'lipids'],
    skinTypes: ['all'],
    concerns: ['post-procedure', 'aging-skin', 'skin-laxity', 'collagen-loss'],
    raniCarries: false,
    routineStep: 3,
    timing: 'both',
    description: 'TriHex Technology serum for pre/post-procedure optimization. Clears elastin debris.',
  },
  {
    id: 'alastin-restorative',
    name: 'Restorative Skin Complex',
    brand: 'Alastin',
    category: 'moisturizer',
    price: 290,
    costToClinic: 145,
    margin: 0.50,
    activeIngredients: ['trihex technology', 'peptides', 'niacinamide', 'arbutin'],
    skinTypes: ['all', 'mature'],
    concerns: ['aging-skin', 'deep-wrinkles', 'skin-laxity', 'collagen-loss', 'post-procedure'],
    raniCarries: false,
    routineStep: 4,
    timing: 'both',
    description: 'Award-winning anti-aging moisturizer. TriHex Technology rebuilds collagen and elastin.',
  },

  // ── Active Serum / Multi-Corrective ──────────────────────────────────
  {
    id: 'is-clinical-active',
    name: 'Active Serum',
    brand: 'iS Clinical',
    category: 'serum',
    price: 148,
    costToClinic: 66.60,
    margin: 0.55,
    activeIngredients: ['glycolic acid', 'salicylic acid', 'arbutin', 'mushroom extract'],
    skinTypes: ['normal', 'oily', 'combination', 'acne-prone'],
    concerns: ['acne', 'aging-skin', 'hyperpigmentation', 'large-pores'],
    raniCarries: false,
    routineStep: 3,
    timing: 'pm',
    description: 'Botanical serum targeting acne, aging, and hyperpigmentation simultaneously.',
    contraindications: ['chemical-peel'],
  },

  // ── Neck / Body ──────────────────────────────────────────────────────
  {
    id: 'revision-nectifirm',
    name: 'Nectifirm Advanced',
    brand: 'Revision Skincare',
    category: 'treatment',
    price: 100,
    costToClinic: 45,
    margin: 0.55,
    activeIngredients: ['peptides', 'plant extracts', 'antioxidants'],
    skinTypes: ['all', 'mature'],
    concerns: ['skin-laxity', 'aging-skin', 'neck-lines'],
    raniCarries: false,
    routineStep: 3,
    timing: 'pm',
    description: 'Neck and decolletage firming cream. Clinical improvement in 8 weeks.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

/** Get all products Rani currently carries */
export function getRaniProducts(): RetailProduct[] {
  return PRODUCT_CATALOG.filter((p) => p.raniCarries);
}

/** Get all products recommended for stocking */
export function getRecommendedStock(): RetailProduct[] {
  return PRODUCT_CATALOG.filter((p) => !p.raniCarries);
}

/** Get products by category */
export function getProductsByCategory(category: ProductCategory): RetailProduct[] {
  return PRODUCT_CATALOG.filter((p) => p.category === category);
}

/** Get products by concern */
export function getProductsForConcern(concern: string): RetailProduct[] {
  return PRODUCT_CATALOG.filter((p) => p.concerns.includes(concern));
}

/** Get products suitable for skin type */
export function getProductsForSkinType(skinType: string): RetailProduct[] {
  return PRODUCT_CATALOG.filter(
    (p) => p.skinTypes.includes('all') || p.skinTypes.includes(skinType)
  );
}

/** Get total monthly revenue potential at a given patient volume */
export function projectMonthlyRevenue(
  avgBasketSize: number,
  patientsPerMonth: number
): { revenue: number; margin: number } {
  const revenue = avgBasketSize * patientsPerMonth;
  const avgMargin = PRODUCT_CATALOG.reduce((sum, p) => sum + p.margin, 0) / PRODUCT_CATALOG.length;
  return {
    revenue: Math.round(revenue),
    margin: Math.round(revenue * avgMargin),
  };
}

/** Get catalog summary stats */
export function getCatalogStats() {
  const carried = PRODUCT_CATALOG.filter((p) => p.raniCarries);
  const recommended = PRODUCT_CATALOG.filter((p) => !p.raniCarries);
  const avgPrice = PRODUCT_CATALOG.reduce((s, p) => s + p.price, 0) / PRODUCT_CATALOG.length;
  const avgMargin = PRODUCT_CATALOG.reduce((s, p) => s + p.margin, 0) / PRODUCT_CATALOG.length;

  return {
    totalProducts: PRODUCT_CATALOG.length,
    currentlyCarried: carried.length,
    recommendedToStock: recommended.length,
    averagePrice: Math.round(avgPrice),
    averageMargin: Math.round(avgMargin * 100),
    brands: [...new Set(PRODUCT_CATALOG.map((p) => p.brand))],
  };
}
