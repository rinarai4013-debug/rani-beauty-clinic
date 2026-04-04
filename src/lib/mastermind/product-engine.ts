/**
 * Rani Beauty Clinic — Product Recommendation Engine
 *
 * Analyzes a patient's current skincare routine (AM/PM) and generates
 * a personalized Skincare Rx with keep/replace/remove/add recommendations.
 * Maps every recommendation to Rani's retail catalog for revenue capture.
 *
 * Revenue target: $100K+/month retail via intelligent product prescribing.
 */

import {
  PRODUCT_CATALOG,
  type RetailProduct,
  type ProductCategory,
} from './product-catalog';

// ── Public Types ───────────────────────────────────────────────────────

export interface ProductRecommendation {
  currentProduct?: string;
  action: 'keep' | 'replace' | 'remove' | 'add';
  reason: string;
  recommendedProduct?: {
    name: string;
    brand: string;
    price: number;
    raniCarries: boolean;
    margin?: number;
    activeIngredients: string[];
  };
  timing: 'am' | 'pm' | 'both';
  step: number;
}

export interface SkincareRx {
  amRoutine: ProductRecommendation[];
  pmRoutine: ProductRecommendation[];
  contraindications: string[];
  estimatedAnnualSpend: number;
  estimatedMargin: number;
  summary: string;
}

export interface RevenueProjection {
  perPatientAnnual: number;
  perPatientMargin: number;
  monthly50: number;
  monthly100: number;
  monthly200: number;
  margin50: number;
  margin100: number;
  margin200: number;
}

// ── Ingredient Intelligence ────────────────────────────────────────────

/** Known active ingredient keywords mapped from common product names */
const INGREDIENT_KEYWORDS: Record<string, string[]> = {
  retinol: ['retinol', 'retinoid', 'retin-a', 'tretinoin', 'adapalene', 'differin', 'tazarotene', 'retinal', 'retinaldehyde'],
  'vitamin c': ['vitamin c', 'ascorbic acid', 'l-ascorbic', 'ascorbyl', 'vit c', 'ce ferulic', 'c e ferulic'],
  niacinamide: ['niacinamide', 'nicotinamide', 'vitamin b3', 'niacin'],
  aha: ['glycolic', 'lactic acid', 'mandelic', 'aha', 'alpha hydroxy', 'fruit acid'],
  bha: ['salicylic', 'bha', 'beta hydroxy', 'willow bark'],
  hyaluronic: ['hyaluronic', 'ha', 'sodium hyaluronate'],
  spf: ['spf', 'sunscreen', 'sunblock', 'sun protection', 'zinc oxide', 'titanium dioxide', 'uv clear', 'uv protect'],
  benzoyl: ['benzoyl peroxide', 'bp', 'benzoyl'],
  peptides: ['peptide', 'matrixyl', 'argireline', 'copper peptide', 'ghk-cu', 'growth factor'],
  azelaic: ['azelaic acid', 'azelaic'],
  'kojic acid': ['kojic acid', 'kojic'],
  hydroquinone: ['hydroquinone', 'hq'],
  ceramides: ['ceramide', 'ceramides'],
  squalane: ['squalane', 'squalene'],
};

/** Ingredient conflict pairs: [ingredientA, ingredientB, severity, explanation] */
const INGREDIENT_CONFLICTS: [string, string, 'warning' | 'avoid', string][] = [
  ['retinol', 'aha', 'avoid', 'Retinol + AHA can cause excessive irritation, peeling, and barrier damage. Use on alternating nights.'],
  ['retinol', 'bha', 'warning', 'Retinol + BHA may increase sensitivity. Monitor for dryness or irritation.'],
  ['retinol', 'vitamin c', 'warning', 'Retinol + Vitamin C can destabilize each other. Use Vitamin C in AM, retinol in PM.'],
  ['retinol', 'benzoyl', 'avoid', 'Benzoyl peroxide degrades retinol on contact. Never layer together.'],
  ['retinol', 'azelaic', 'warning', 'Both are potent actives. Start slow to avoid irritation.'],
  ['vitamin c', 'niacinamide', 'warning', 'High-concentration Vitamin C + niacinamide may reduce efficacy. Use at different times or choose formulations designed to pair.'],
  ['vitamin c', 'aha', 'warning', 'Both are acidic. Layering can lower pH too far and cause irritation.'],
  ['vitamin c', 'benzoyl', 'avoid', 'Benzoyl peroxide oxidizes Vitamin C, rendering it ineffective.'],
  ['aha', 'bha', 'warning', 'Double-acid layering can over-exfoliate. Alternate or use a single formula combining both.'],
  ['hydroquinone', 'benzoyl', 'avoid', 'Benzoyl peroxide can stain skin when combined with hydroquinone.'],
];

/** Treatment contraindications: products to stop before specific treatments */
const TREATMENT_CONTRAINDICATIONS: Record<string, { ingredients: string[]; daysBefore: number; reason: string }> = {
  'chemical-peel': {
    ingredients: ['retinol', 'aha', 'bha', 'benzoyl', 'azelaic'],
    daysBefore: 7,
    reason: 'Discontinue retinoids and acids 7 days before chemical peels to prevent over-exfoliation and burns.',
  },
  'vi-peel': {
    ingredients: ['retinol', 'aha', 'bha', 'benzoyl'],
    daysBefore: 7,
    reason: 'Stop all retinoids and exfoliating acids 7 days before VI Peel.',
  },
  laser: {
    ingredients: ['retinol', 'vitamin c', 'aha', 'bha'],
    daysBefore: 14,
    reason: 'Discontinue actives 14 days before laser treatments to reduce burn/hyperpigmentation risk.',
  },
  'rf-microneedling': {
    ingredients: ['retinol', 'aha', 'bha', 'benzoyl'],
    daysBefore: 7,
    reason: 'Stop retinoids and acids 7 days before RF microneedling to ensure barrier integrity.',
  },
  'sofwave': {
    ingredients: ['retinol'],
    daysBefore: 3,
    reason: 'Pause retinoids 3 days before Sofwave for optimal skin tolerance.',
  },
  'hydrafacial': {
    ingredients: ['retinol'],
    daysBefore: 3,
    reason: 'Pause retinoids 3 days before HydraFacial for comfort.',
  },
};

/** Skin type modifiers: flag harsh ingredients for sensitive types */
const HARSH_FOR_SKIN_TYPE: Record<string, string[]> = {
  sensitive: ['aha', 'bha', 'benzoyl', 'retinol', 'hydroquinone'],
  dry: ['benzoyl', 'bha'],
  rosacea: ['aha', 'bha', 'retinol', 'benzoyl', 'vitamin c'],
};

// ── Internal Helpers ───────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/** Detect active ingredients in a product name or description */
function detectIngredients(productText: string): string[] {
  const normalized = normalizeText(productText);
  const found: string[] = [];

  for (const [ingredient, keywords] of Object.entries(INGREDIENT_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      found.push(ingredient);
    }
  }

  return found;
}

/** Detect product category from name */
function detectCategory(productText: string): ProductCategory {
  const n = normalizeText(productText);
  if (/cleanser|cleansing|wash|foaming/i.test(n)) return 'cleanser';
  if (/toner|tonic|essence|mist/i.test(n)) return 'toner';
  if (/spf|sunscreen|sunblock|sun protect/i.test(n)) return 'spf';
  if (/moisturiz|cream|lotion|balm|butter/i.test(n)) return 'moisturizer';
  if (/eye cream|eye gel|eye serum/i.test(n)) return 'eye';
  if (/mask|peel.*off/i.test(n)) return 'mask';
  if (/serum|oil|ampoule|concentrate/i.test(n)) return 'serum';
  if (/tretinoin|rx|prescription/i.test(n)) return 'rx';
  return 'treatment';
}

/** Map category to routine step number */
function categoryToStep(cat: ProductCategory): number {
  const map: Record<ProductCategory, number> = {
    cleanser: 1,
    toner: 2,
    serum: 3,
    treatment: 3,
    rx: 3,
    moisturizer: 4,
    spf: 5,
    eye: 6,
    mask: 7,
  };
  return map[cat] ?? 3;
}

/** Find the best Rani replacement product for a given set of needs */
function findReplacement(
  concerns: string[],
  skinType: string,
  category: ProductCategory,
  timing: 'am' | 'pm' | 'both',
  excludeIds: Set<string>
): RetailProduct | null {
  const candidates = PRODUCT_CATALOG.filter((p) => {
    if (excludeIds.has(p.id)) return false;
    // Prefer same category, but allow serum/treatment crossover
    const catMatch =
      p.category === category ||
      (category === 'serum' && p.category === 'treatment') ||
      (category === 'treatment' && p.category === 'serum');
    if (!catMatch) return false;
    // Timing must be compatible
    if (p.timing !== 'both' && p.timing !== timing && timing !== 'both') return false;
    // Skin type
    const typeMatch = p.skinTypes.includes('all') || p.skinTypes.includes(skinType);
    if (!typeMatch) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  // Score by concern overlap
  const scored = candidates.map((p) => {
    const concernScore = concerns.filter((c) => p.concerns.includes(c)).length;
    const raniBonus = p.raniCarries ? 3 : 0; // prefer Rani products
    const marginBonus = p.margin * 2;
    return { product: p, score: concernScore + raniBonus + marginBonus };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.product ?? null;
}

/** Convert RetailProduct to the recommendation product format */
function toRecommendedProduct(p: RetailProduct): ProductRecommendation['recommendedProduct'] {
  return {
    name: p.name,
    brand: p.brand,
    price: p.price,
    raniCarries: p.raniCarries,
    margin: p.margin,
    activeIngredients: p.activeIngredients,
  };
}

// ── Parse Routines ─────────────────────────────────────────────────────

interface ParsedProduct {
  raw: string;
  ingredients: string[];
  category: ProductCategory;
  step: number;
}

function parseProductList(productText: string): ParsedProduct[] {
  if (!productText || !productText.trim()) return [];

  // Split by common delimiters: newlines, commas, semicolons, numbered lists
  const lines = productText
    .split(/[\n;]|,\s*(?=[A-Z])|(?:\d+[\.\)]\s*)/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  return lines.map((raw) => {
    const ingredients = detectIngredients(raw);
    const category = detectCategory(raw);
    return {
      raw,
      ingredients,
      category,
      step: categoryToStep(category),
    };
  });
}

// ── Core Engine ────────────────────────────────────────────────────────

export function generateSkincareRx(
  amProducts: string,
  pmProducts: string,
  currentProducts: string,
  concerns: string[],
  skinType: string,
  treatmentInterests: string[],
  age?: number
): SkincareRx {
  const normalizedSkinType = normalizeText(skinType || 'normal');
  const normalizedConcerns = concerns.map(normalizeText);

  // Parse product lists
  const amParsed = parseProductList(amProducts);
  const pmParsed = parseProductList(pmProducts);
  const allCurrentParsed = parseProductList(currentProducts);

  // Combine all known ingredients across routines
  const allIngredients = new Set<string>();
  [...amParsed, ...pmParsed, ...allCurrentParsed].forEach((p) =>
    p.ingredients.forEach((i) => allIngredients.add(i))
  );

  // Track used product IDs to avoid duplicates in recommendations
  const usedProductIds = new Set<string>();

  // ── 1. Detect ingredient conflicts ────────────────────────────────
  const conflicts: string[] = [];
  for (const [a, b, severity, explanation] of INGREDIENT_CONFLICTS) {
    if (allIngredients.has(a) && allIngredients.has(b)) {
      conflicts.push(`[${severity.toUpperCase()}] ${explanation}`);
    }
  }

  // ── 2. Detect treatment contraindications ─────────────────────────
  const contraindications: string[] = [];
  for (const treatment of treatmentInterests) {
    const normalizedTreatment = normalizeText(treatment);
    // Find matching contraindication rule
    for (const [key, rule] of Object.entries(TREATMENT_CONTRAINDICATIONS)) {
      if (normalizedTreatment.includes(key)) {
        const conflicting = rule.ingredients.filter((i) => allIngredients.has(i));
        if (conflicting.length > 0) {
          contraindications.push(
            `Stop ${conflicting.join(', ')} at least ${rule.daysBefore} days before ${treatment}. ${rule.reason}`
          );
        }
      }
    }
  }

  // ── 3. Detect harshness for skin type ─────────────────────────────
  const harshWarnings: string[] = [];
  const harshIngredients = HARSH_FOR_SKIN_TYPE[normalizedSkinType] ?? [];
  for (const ingredient of harshIngredients) {
    if (allIngredients.has(ingredient)) {
      harshWarnings.push(
        `${ingredient} may be too harsh for ${skinType} skin. Consider reducing frequency or buffering.`
      );
    }
  }

  // ── 4. Analyze AM routine ─────────────────────────────────────────
  const amRecommendations: ProductRecommendation[] = [];
  const amCategories = new Set<ProductCategory>();

  for (const product of amParsed) {
    amCategories.add(product.category);

    // Check for removals (contraindicated ingredients)
    const hasContraindicated = product.ingredients.some((ing) =>
      treatmentInterests.some((t) => {
        const rule = Object.entries(TREATMENT_CONTRAINDICATIONS).find(([k]) =>
          normalizeText(t).includes(k)
        );
        return rule && rule[1].ingredients.includes(ing);
      })
    );

    if (hasContraindicated) {
      const replacement = findReplacement(normalizedConcerns, normalizedSkinType, product.category, 'am', usedProductIds);
      if (replacement) usedProductIds.add(replacement.id);
      amRecommendations.push({
        currentProduct: product.raw,
        action: 'remove',
        reason: `Contains ingredients contraindicated with your planned treatments. ${
          replacement ? 'Switch to a compatible alternative.' : 'Discontinue before treatment.'
        }`,
        recommendedProduct: replacement ? toRecommendedProduct(replacement) : undefined,
        timing: 'am',
        step: product.step,
      });
      continue;
    }

    // Check for Rani replacement opportunity (upgrade path)
    const raniAlternative = PRODUCT_CATALOG.find((p) => {
      if (usedProductIds.has(p.id)) return false;
      if (p.timing !== 'both' && p.timing !== 'am') return false;
      const catMatch =
        p.category === product.category ||
        (product.category === 'serum' && p.category === 'treatment') ||
        (product.category === 'treatment' && p.category === 'serum');
      if (!catMatch) return false;
      // Must share at least one active ingredient
      const ingredientOverlap = p.activeIngredients.some((ai) =>
        product.ingredients.includes(ai)
      );
      return ingredientOverlap;
    });

    if (raniAlternative) {
      usedProductIds.add(raniAlternative.id);
      amRecommendations.push({
        currentProduct: product.raw,
        action: 'replace',
        reason: `Upgrade to medical-grade ${raniAlternative.brand} for superior results. ${
          raniAlternative.raniCarries ? 'Available at Rani today.' : 'Professional-grade formula.'
        }`,
        recommendedProduct: toRecommendedProduct(raniAlternative),
        timing: 'am',
        step: product.step,
      });
    } else {
      // Product is fine — keep it
      amRecommendations.push({
        currentProduct: product.raw,
        action: 'keep',
        reason: 'Product is appropriate for your routine and compatible with your treatment plan.',
        timing: 'am',
        step: product.step,
      });
    }
  }

  // ── 5. AM missing essentials ──────────────────────────────────────
  // Must have: cleanser, SPF, moisturizer
  if (!amCategories.has('cleanser')) {
    const cleanser = findReplacement(normalizedConcerns, normalizedSkinType, 'cleanser', 'am', usedProductIds);
    if (cleanser) {
      usedProductIds.add(cleanser.id);
      amRecommendations.push({
        action: 'add',
        reason: 'Every AM routine needs a gentle cleanser. Cleansing removes overnight oil and prep skin for actives.',
        recommendedProduct: toRecommendedProduct(cleanser),
        timing: 'am',
        step: 1,
      });
    }
  }

  if (!amCategories.has('spf')) {
    const spf = PRODUCT_CATALOG.find(
      (p) => p.category === 'spf' && !usedProductIds.has(p.id)
    );
    if (spf) {
      usedProductIds.add(spf.id);
      amRecommendations.push({
        action: 'add',
        reason: 'SPF is THE most important anti-aging product. Without it, all other skincare is compromised. Non-negotiable for every AM routine.',
        recommendedProduct: toRecommendedProduct(spf),
        timing: 'am',
        step: 5,
      });
    }
  }

  if (!amCategories.has('moisturizer') && !amCategories.has('serum')) {
    const moisturizer = findReplacement(normalizedConcerns, normalizedSkinType, 'moisturizer', 'am', usedProductIds);
    if (moisturizer) {
      usedProductIds.add(moisturizer.id);
      amRecommendations.push({
        action: 'add',
        reason: 'A hydrating moisturizer locks in serums and protects the skin barrier throughout the day.',
        recommendedProduct: toRecommendedProduct(moisturizer),
        timing: 'am',
        step: 4,
      });
    }
  }

  // Add Vitamin C if not present and concerns warrant it
  if (
    !allIngredients.has('vitamin c') &&
    normalizedConcerns.some((c) =>
      ['aging-skin', 'dull-skin', 'hyperpigmentation', 'sun-damage', 'fine-lines'].includes(c)
    )
  ) {
    const vitC = PRODUCT_CATALOG.find(
      (p) =>
        p.activeIngredients.includes('vitamin c') &&
        p.category === 'serum' &&
        (p.timing === 'am' || p.timing === 'both') &&
        !usedProductIds.has(p.id)
    );
    if (vitC) {
      usedProductIds.add(vitC.id);
      amRecommendations.push({
        action: 'add',
        reason: 'Vitamin C is the gold-standard antioxidant for brightening, collagen support, and UV defense. Best used in AM.',
        recommendedProduct: toRecommendedProduct(vitC),
        timing: 'am',
        step: 3,
      });
    }
  }

  // ── 6. Analyze PM routine ─────────────────────────────────────────
  const pmRecommendations: ProductRecommendation[] = [];
  const pmCategories = new Set<ProductCategory>();

  for (const product of pmParsed) {
    pmCategories.add(product.category);

    // Check for removals
    const hasContraindicated = product.ingredients.some((ing) =>
      treatmentInterests.some((t) => {
        const rule = Object.entries(TREATMENT_CONTRAINDICATIONS).find(([k]) =>
          normalizeText(t).includes(k)
        );
        return rule && rule[1].ingredients.includes(ing);
      })
    );

    if (hasContraindicated) {
      const replacement = findReplacement(normalizedConcerns, normalizedSkinType, product.category, 'pm', usedProductIds);
      if (replacement) usedProductIds.add(replacement.id);
      pmRecommendations.push({
        currentProduct: product.raw,
        action: 'remove',
        reason: `Contains ingredients contraindicated with your planned treatments. Discontinue before procedure.`,
        recommendedProduct: replacement ? toRecommendedProduct(replacement) : undefined,
        timing: 'pm',
        step: product.step,
      });
      continue;
    }

    // Check for Rani replacement opportunity
    const raniAlternative = PRODUCT_CATALOG.find((p) => {
      if (usedProductIds.has(p.id)) return false;
      if (p.timing !== 'both' && p.timing !== 'pm') return false;
      const catMatch =
        p.category === product.category ||
        (product.category === 'serum' && p.category === 'treatment') ||
        (product.category === 'treatment' && p.category === 'serum');
      if (!catMatch) return false;
      const ingredientOverlap = p.activeIngredients.some((ai) =>
        product.ingredients.includes(ai)
      );
      return ingredientOverlap;
    });

    if (raniAlternative) {
      usedProductIds.add(raniAlternative.id);
      pmRecommendations.push({
        currentProduct: product.raw,
        action: 'replace',
        reason: `Upgrade to medical-grade ${raniAlternative.brand} for superior results. ${
          raniAlternative.raniCarries ? 'Available at Rani today.' : 'Professional-grade formula.'
        }`,
        recommendedProduct: toRecommendedProduct(raniAlternative),
        timing: 'pm',
        step: product.step,
      });
    } else {
      pmRecommendations.push({
        currentProduct: product.raw,
        action: 'keep',
        reason: 'Product is appropriate for your routine and compatible with your treatment plan.',
        timing: 'pm',
        step: product.step,
      });
    }
  }

  // ── 7. PM missing essentials ──────────────────────────────────────
  if (!pmCategories.has('cleanser')) {
    const cleanser = findReplacement(normalizedConcerns, normalizedSkinType, 'cleanser', 'pm', usedProductIds);
    if (cleanser) {
      usedProductIds.add(cleanser.id);
      pmRecommendations.push({
        action: 'add',
        reason: 'PM cleansing removes makeup, SPF, and the day\'s debris. Essential for preventing breakouts and allowing actives to penetrate.',
        recommendedProduct: toRecommendedProduct(cleanser),
        timing: 'pm',
        step: 1,
      });
    }
  }

  if (!pmCategories.has('moisturizer')) {
    const moisturizer = findReplacement(normalizedConcerns, normalizedSkinType, 'moisturizer', 'pm', usedProductIds);
    if (moisturizer) {
      usedProductIds.add(moisturizer.id);
      pmRecommendations.push({
        action: 'add',
        reason: 'A rich PM moisturizer supports overnight repair and seals in treatment serums.',
        recommendedProduct: toRecommendedProduct(moisturizer),
        timing: 'pm',
        step: 4,
      });
    }
  }

  // Add retinoid if not present and age/concerns warrant it
  if (
    !allIngredients.has('retinol') &&
    (age === undefined || age >= 25) &&
    normalizedConcerns.some((c) =>
      ['aging-skin', 'fine-lines', 'acne', 'hyperpigmentation', 'large-pores', 'deep-wrinkles'].includes(c)
    )
  ) {
    // Do NOT recommend retinoid if upcoming treatment contraindicates it
    const retinoidSafe = !treatmentInterests.some((t) => {
      const rule = Object.entries(TREATMENT_CONTRAINDICATIONS).find(([k]) =>
        normalizeText(t).includes(k)
      );
      return rule && rule[1].ingredients.includes('retinol');
    });

    if (retinoidSafe) {
      const retinoid = PRODUCT_CATALOG.find(
        (p) =>
          p.activeIngredients.includes('tretinoin') &&
          p.raniCarries &&
          !usedProductIds.has(p.id)
      );
      if (retinoid) {
        usedProductIds.add(retinoid.id);
        pmRecommendations.push({
          action: 'add',
          reason: 'Tretinoin is the #1 proven anti-aging ingredient. Prescription-strength for maximum collagen stimulation and cell turnover. Available exclusively through Rani.',
          recommendedProduct: toRecommendedProduct(retinoid),
          timing: 'pm',
          step: 3,
        });
      }
    }
  }

  // Add peptides/growth factors if concerns include laxity or advanced aging
  if (
    normalizedConcerns.some((c) =>
      ['skin-laxity', 'collagen-loss', 'deep-wrinkles'].includes(c)
    ) &&
    !allIngredients.has('peptides')
  ) {
    const peptideProduct = PRODUCT_CATALOG.find(
      (p) =>
        p.activeIngredients.includes('peptides') &&
        (p.timing === 'pm' || p.timing === 'both') &&
        p.category === 'serum' &&
        !usedProductIds.has(p.id)
    );
    if (peptideProduct) {
      usedProductIds.add(peptideProduct.id);
      pmRecommendations.push({
        action: 'add',
        reason: 'Growth factor and peptide serums accelerate collagen production and repair. A cornerstone of advanced anti-aging.',
        recommendedProduct: toRecommendedProduct(peptideProduct),
        timing: 'pm',
        step: 3,
      });
    }
  }

  // Add GHK-Cu if Rani carries it and patient has laxity concerns
  if (
    normalizedConcerns.some((c) =>
      ['skin-laxity', 'aging-skin', 'collagen-loss'].includes(c)
    ) &&
    !allIngredients.has('peptides')
  ) {
    const ghkcu = PRODUCT_CATALOG.find(
      (p) =>
        p.activeIngredients.includes('ghk-cu') &&
        p.raniCarries &&
        !usedProductIds.has(p.id)
    );
    if (ghkcu) {
      usedProductIds.add(ghkcu.id);
      pmRecommendations.push({
        action: 'add',
        reason: 'GHK-Cu copper peptide is a powerful signal molecule for skin renewal. Exclusive to Rani — compounded by Olympia Pharmacy.',
        recommendedProduct: toRecommendedProduct(ghkcu),
        timing: 'pm',
        step: 3,
      });
    }
  }

  // Add brightening if hyperpigmentation concerns
  if (
    normalizedConcerns.some((c) =>
      ['hyperpigmentation', 'dark-spots', 'melasma', 'uneven-tone'].includes(c)
    ) &&
    !allIngredients.has('hydroquinone') &&
    !allIngredients.has('kojic acid')
  ) {
    const brightening = PRODUCT_CATALOG.find(
      (p) =>
        p.id === 'rani-brightening' &&
        !usedProductIds.has(p.id)
    );
    if (brightening) {
      usedProductIds.add(brightening.id);
      pmRecommendations.push({
        action: 'add',
        reason: 'Prescription brightening cream targets stubborn hyperpigmentation that OTC products cannot address. Available exclusively through Rani.',
        recommendedProduct: toRecommendedProduct(brightening),
        timing: 'pm',
        step: 3,
      });
    }
  }

  // ── 8. Sort by step ───────────────────────────────────────────────
  amRecommendations.sort((a, b) => a.step - b.step);
  pmRecommendations.sort((a, b) => a.step - b.step);

  // ── 9. Revenue calculation ────────────────────────────────────────
  const allRecommended = [...amRecommendations, ...pmRecommendations]
    .filter((r) => r.recommendedProduct && (r.action === 'replace' || r.action === 'add'));

  // Deduplicate by product name (same product may appear in AM and PM)
  const uniqueProducts = new Map<string, ProductRecommendation['recommendedProduct']>();
  for (const rec of allRecommended) {
    if (rec.recommendedProduct) {
      uniqueProducts.set(rec.recommendedProduct.name, rec.recommendedProduct);
    }
  }

  const totalProductCost = Array.from(uniqueProducts.values()).reduce(
    (sum, p) => sum + (p?.price ?? 0),
    0
  );

  // Assume product replenishment every 2-3 months (average 2.5 months per product)
  const annualReplenishments = 12 / 2.5; // ~4.8 times per year
  const estimatedAnnualSpend = Math.round(totalProductCost * annualReplenishments);

  const totalMarginDollars = Array.from(uniqueProducts.values()).reduce(
    (sum, p) => sum + (p?.price ?? 0) * (p?.margin ?? 0.5),
    0
  );
  const estimatedMargin = Math.round(totalMarginDollars * annualReplenishments);

  // ── 10. Generate summary ──────────────────────────────────────────
  const keepCount = [...amRecommendations, ...pmRecommendations].filter((r) => r.action === 'keep').length;
  const replaceCount = [...amRecommendations, ...pmRecommendations].filter((r) => r.action === 'replace').length;
  const removeCount = [...amRecommendations, ...pmRecommendations].filter((r) => r.action === 'remove').length;
  const addCount = [...amRecommendations, ...pmRecommendations].filter((r) => r.action === 'add').length;

  const summaryParts: string[] = [];
  if (keepCount > 0) summaryParts.push(`${keepCount} product${keepCount > 1 ? 's' : ''} to keep`);
  if (replaceCount > 0) summaryParts.push(`${replaceCount} upgrade${replaceCount > 1 ? 's' : ''} to medical-grade`);
  if (removeCount > 0) summaryParts.push(`${removeCount} product${removeCount > 1 ? 's' : ''} to discontinue`);
  if (addCount > 0) summaryParts.push(`${addCount} essential step${addCount > 1 ? 's' : ''} to add`);

  let summary = `Your personalized Skincare Rx: ${summaryParts.join(', ')}.`;

  if (conflicts.length > 0) {
    summary += ` We identified ${conflicts.length} ingredient interaction${conflicts.length > 1 ? 's' : ''} in your current routine that should be addressed.`;
  }
  if (contraindications.length > 0) {
    summary += ` Important: ${contraindications.length} product${contraindications.length > 1 ? 's' : ''} must be paused before your upcoming treatments.`;
  }

  if (estimatedAnnualSpend > 0) {
    summary += ` Estimated annual skincare investment: $${estimatedAnnualSpend.toLocaleString()}.`;
  }

  return {
    amRoutine: amRecommendations,
    pmRoutine: pmRecommendations,
    contraindications: [...contraindications, ...conflicts, ...harshWarnings],
    estimatedAnnualSpend,
    estimatedMargin,
    summary,
  };
}

// ── Revenue Projection ─────────────────────────────────────────────────

export function calculateRevenueProjection(rx: SkincareRx): RevenueProjection {
  const perPatientAnnual = rx.estimatedAnnualSpend;
  const perPatientMargin = rx.estimatedMargin;
  const monthlySpend = perPatientAnnual / 12;
  const monthlyMargin = perPatientMargin / 12;

  return {
    perPatientAnnual,
    perPatientMargin,
    monthly50: Math.round(monthlySpend * 50),
    monthly100: Math.round(monthlySpend * 100),
    monthly200: Math.round(monthlySpend * 200),
    margin50: Math.round(monthlyMargin * 50),
    margin100: Math.round(monthlyMargin * 100),
    margin200: Math.round(monthlyMargin * 200),
  };
}

// ── Stock Recommendations ──────────────────────────────────────────────

export interface StockRecommendation {
  product: RetailProduct;
  projectedMonthlyUnits: number;
  projectedMonthlyRevenue: number;
  projectedMonthlyMargin: number;
  reason: string;
}

/**
 * Analyze which products Rani does NOT carry but should stock,
 * based on aggregate patient demand signals.
 */
export function getStockRecommendations(patientVolume: number = 100): StockRecommendation[] {
  const notCarried = PRODUCT_CATALOG.filter((p) => !p.raniCarries);

  return notCarried.map((product) => {
    // Estimate capture rate based on category (SPF highest, specialty lowest)
    let captureRate: number;
    switch (product.category) {
      case 'spf':
        captureRate = 0.40; // 40% of patients need SPF
        break;
      case 'cleanser':
        captureRate = 0.30;
        break;
      case 'serum':
        captureRate = 0.25;
        break;
      case 'moisturizer':
        captureRate = 0.20;
        break;
      default:
        captureRate = 0.15;
    }

    const monthlyUnits = Math.round(patientVolume * captureRate);
    const monthlyRevenue = monthlyUnits * product.price;
    const monthlyMargin = Math.round(monthlyRevenue * product.margin);

    return {
      product,
      projectedMonthlyUnits: monthlyUnits,
      projectedMonthlyRevenue: monthlyRevenue,
      projectedMonthlyMargin: monthlyMargin,
      reason: `${product.brand} ${product.name} addresses ${product.concerns.slice(0, 3).join(', ')}. At ${Math.round(captureRate * 100)}% capture, projects $${monthlyRevenue.toLocaleString()}/mo revenue.`,
    };
  }).sort((a, b) => b.projectedMonthlyMargin - a.projectedMonthlyMargin);
}
