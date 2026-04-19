import {
  BOOMRX_FORMULARY_ITEMS,
  type BoomRxCategory,
  type BoomRxFormularyItem,
} from './boomrx-formulary';

export const CONSULT_SYMPTOM_OPTIONS = [
  'difficulty-losing-weight',
  'food-noise-cravings',
  'insulin-resistance-signs',
  'fatigue-low-energy',
  'brain-fog-focus',
  'poor-sleep-recovery',
  'slow-injury-healing',
  'inflammation-joint-pain',
  'gut-bloating-dysbiosis',
  'muscle-loss-low-performance',
  'low-libido-sexual-dysfunction',
  'perimenopause-menopause',
  'low-testosterone-signs',
  'thyroid-symptoms',
  'hair-thinning',
  'acne-breakouts',
  'hyperpigmentation-skin-dullness',
  'immune-fragility-frequent-illness',
] as const;

export type ConsultSymptom = (typeof CONSULT_SYMPTOM_OPTIONS)[number];

export interface SymptomMatchedRecommendation {
  item: BoomRxFormularyItem;
  score: number;
  rationale: string[];
}

export interface SymptomRecommendationBundle {
  normalizedSymptoms: string[];
  recommendations: SymptomMatchedRecommendation[];
  projectedMonthlyRetail: number;
  projectedMonthlyCOGS: number;
  projectedMonthlyGrossProfit: number;
  averageMarginPercent: number;
}

interface SymptomRule {
  categories: BoomRxCategory[];
  keywordBoosts: string[];
}

const SYMPTOM_RULES: Record<ConsultSymptom, SymptomRule> = {
  'difficulty-losing-weight': {
    categories: ['glp1', 'peptide', 'wellness'],
    keywordBoosts: ['semaglutide', 'tirzepatide', 'retatrutide', 'aod', 'lipo'],
  },
  'food-noise-cravings': {
    categories: ['glp1'],
    keywordBoosts: ['semaglutide', 'tirzepatide', 'liraglutide', 'glp'],
  },
  'insulin-resistance-signs': {
    categories: ['glp1', 'hormone'],
    keywordBoosts: ['semaglutide', 'tirzepatide', 'metformin', 'dhea'],
  },
  'fatigue-low-energy': {
    categories: ['wellness', 'hormone', 'peptide'],
    keywordBoosts: ['b12', 'nad', 'dhea', 'testosterone', 'thyroid', 'lipo'],
  },
  'brain-fog-focus': {
    categories: ['wellness', 'hormone', 'peptide'],
    keywordBoosts: ['nad', 'dhea', 'thyroid', 'testosterone', 'coq10'],
  },
  'poor-sleep-recovery': {
    categories: ['peptide', 'hormone'],
    keywordBoosts: ['sermorelin', 'tesamorelin', 'cjc', 'ipamorelin', 'progesterone'],
  },
  'slow-injury-healing': {
    categories: ['peptide'],
    keywordBoosts: ['bpc', '157', 'ghk', 'thymosin'],
  },
  'inflammation-joint-pain': {
    categories: ['peptide', 'wellness'],
    keywordBoosts: ['bpc', '157', 'ghk', 'glutathione'],
  },
  'gut-bloating-dysbiosis': {
    categories: ['peptide', 'wellness'],
    keywordBoosts: ['bpc', '157', 'glutathione', 'lipo'],
  },
  'muscle-loss-low-performance': {
    categories: ['hormone', 'peptide'],
    keywordBoosts: ['testosterone', 'dhea', 'sermorelin', 'tesamorelin'],
  },
  'low-libido-sexual-dysfunction': {
    categories: ['sexual-health', 'hormone', 'peptide'],
    keywordBoosts: ['pt-141', 'bremelanotide', 'tadalafil', 'sildenafil', 'testosterone'],
  },
  'perimenopause-menopause': {
    categories: ['hormone', 'wellness'],
    keywordBoosts: ['biest', 'estradiol', 'progesterone', 'dhea'],
  },
  'low-testosterone-signs': {
    categories: ['hormone'],
    keywordBoosts: ['testosterone', 'anastrozole', 'clomiphene', 'dhea'],
  },
  'thyroid-symptoms': {
    categories: ['hormone'],
    keywordBoosts: ['thyroid', 'liothyronine', 'levothyroxine', 't3', 't4'],
  },
  'hair-thinning': {
    categories: ['hair-skin', 'hormone', 'wellness'],
    keywordBoosts: ['minoxidil', 'finasteride', 'dutasteride', 'biotin', 'dhea'],
  },
  'acne-breakouts': {
    categories: ['hair-skin', 'hormone', 'wellness'],
    keywordBoosts: ['acne', 'spironolactone', 'retinoid', 'glutathione'],
  },
  'hyperpigmentation-skin-dullness': {
    categories: ['hair-skin', 'wellness', 'peptide'],
    keywordBoosts: ['glutathione', 'ghk', 'skin', 'melasma', 'vitamin'],
  },
  'immune-fragility-frequent-illness': {
    categories: ['wellness', 'peptide'],
    keywordBoosts: ['immune', 'vitamin', 'glutathione', 'thymosin', 'nad'],
  },
};

const TEXT_TO_SYMPTOM: Array<{ symptom: ConsultSymptom; cues: string[] }> = [
  { symptom: 'difficulty-losing-weight', cues: ['weight gain', 'lose weight', 'obesity', 'stubborn fat'] },
  { symptom: 'food-noise-cravings', cues: ['food noise', 'cravings', 'binge', 'snacking'] },
  { symptom: 'insulin-resistance-signs', cues: ['insulin resistance', 'prediabetes', 'a1c', 'pcos'] },
  { symptom: 'fatigue-low-energy', cues: ['fatigue', 'low energy', 'exhausted', 'burnout'] },
  { symptom: 'brain-fog-focus', cues: ['brain fog', 'focus', 'concentration', 'mental clarity'] },
  { symptom: 'poor-sleep-recovery', cues: ['sleep', 'insomnia', 'recovery'] },
  { symptom: 'slow-injury-healing', cues: ['injury', 'slow healing', 'post surgical', 'tendon'] },
  { symptom: 'inflammation-joint-pain', cues: ['inflammation', 'joint pain', 'aches', 'arthritis'] },
  { symptom: 'gut-bloating-dysbiosis', cues: ['bloating', 'gut', 'digestive', 'ibs'] },
  { symptom: 'muscle-loss-low-performance', cues: ['muscle loss', 'strength', 'performance', 'recomp'] },
  { symptom: 'low-libido-sexual-dysfunction', cues: ['libido', 'ed', 'sexual', 'arousal'] },
  { symptom: 'perimenopause-menopause', cues: ['menopause', 'perimenopause', 'hot flashes'] },
  { symptom: 'low-testosterone-signs', cues: ['low testosterone', 'low t', 'trt'] },
  { symptom: 'thyroid-symptoms', cues: ['thyroid', 'tsh', 'cold intolerance'] },
  { symptom: 'hair-thinning', cues: ['hair loss', 'thinning hair', 'alopecia'] },
  { symptom: 'acne-breakouts', cues: ['acne', 'breakouts', 'cystic'] },
  { symptom: 'hyperpigmentation-skin-dullness', cues: ['hyperpigmentation', 'melasma', 'dark spots', 'dull skin'] },
  { symptom: 'immune-fragility-frequent-illness', cues: ['frequent illness', 'immune', 'sick often'] },
];

function normalizeSymptoms(symptoms: string[], goals: string[]): string[] {
  const normalized = new Set<string>();
  const lowerTexts = [...symptoms, ...goals].map((value) => value.toLowerCase());

  for (const raw of symptoms) {
    const clean = raw.trim().toLowerCase();
    if (clean) normalized.add(clean);
  }

  for (const text of lowerTexts) {
    for (const mapping of TEXT_TO_SYMPTOM) {
      if (mapping.cues.some((cue) => text.includes(cue))) {
        normalized.add(mapping.symptom);
      }
    }
  }

  return Array.from(normalized);
}

function inferTrackCategoryBoost(track?: string): BoomRxCategory[] {
  const normalized = (track || '').toLowerCase();
  if (normalized.includes('glp')) return ['glp1', 'wellness'];
  if (normalized.includes('hormone')) return ['hormone', 'sexual-health', 'wellness'];
  if (normalized.includes('peptide')) return ['peptide', 'wellness'];
  if (normalized.includes('hybrid')) return ['glp1', 'hormone', 'peptide'];
  return [];
}

function scoreItemAgainstSymptoms(
  item: BoomRxFormularyItem,
  symptoms: string[],
  trackBoostCategories: BoomRxCategory[]
): SymptomMatchedRecommendation | null {
  let score = 0;
  const rationale: string[] = [];
  const label = item.label.toLowerCase();

  for (const rawSymptom of symptoms) {
    const symptom = rawSymptom as ConsultSymptom;
    const rule = SYMPTOM_RULES[symptom];
    if (!rule) continue;

    if (rule.categories.includes(item.category)) {
      score += 3;
      rationale.push(`category-match:${symptom}`);
    }

    for (const keyword of rule.keywordBoosts) {
      if (label.includes(keyword)) {
        score += 2;
        rationale.push(`keyword:${keyword}`);
      }
    }
  }

  if (trackBoostCategories.includes(item.category)) {
    score += 2;
    rationale.push('track-boost');
  }

  if (score <= 0) return null;
  return { item, score, rationale: Array.from(new Set(rationale)) };
}

function buildRecommendationsByScore(recommendations: Array<SymptomMatchedRecommendation>) {
  const bestByProduct = new Map<string, SymptomMatchedRecommendation>();

  for (const recommendation of recommendations) {
    const key = `${recommendation.item.baseProduct.toLowerCase()}|${recommendation.item.category}`;
    const existing = bestByProduct.get(key);
    if (
      !existing ||
      recommendation.score > existing.score ||
      (recommendation.score === existing.score &&
        recommendation.item.suggestedGrossProfit > existing.item.suggestedGrossProfit)
    ) {
      bestByProduct.set(key, recommendation);
    }
  }

  return Array.from(bestByProduct.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.item.suggestedGrossProfit - a.item.suggestedGrossProfit;
  });
}

function summarizeRecommendations(
  normalizedSymptoms: string[],
  recommendations: SymptomMatchedRecommendation[],
): Omit<SymptomRecommendationBundle, 'normalizedSymptoms'> {
  const projectedMonthlyRetail = recommendations.reduce(
    (sum, recommendation) => sum + recommendation.item.suggestedRetail,
    0
  );
  const projectedMonthlyCOGS = recommendations.reduce(
    (sum, recommendation) => sum + recommendation.item.monthlyCostEstimate,
    0
  );
  const projectedMonthlyGrossProfit = Number(
    (projectedMonthlyRetail - projectedMonthlyCOGS).toFixed(2)
  );
  const averageMarginPercent = Number(
    (
      recommendations.reduce(
        (sum, recommendation) => sum + recommendation.item.suggestedMarginPercent,
        0
      ) / Math.max(recommendations.length, 1)
    ).toFixed(1)
  );

  return {
    recommendations,
    projectedMonthlyRetail,
    projectedMonthlyCOGS: Number(projectedMonthlyCOGS.toFixed(2)),
    projectedMonthlyGrossProfit,
    averageMarginPercent,
  };
}

function buildFallbackRecommendations(
  trackBoostCategories: BoomRxCategory[],
  limit: number
): SymptomMatchedRecommendation[] {
  const fallbackCandidates = BOOMRX_FORMULARY_ITEMS.map((item) => {
    const isTrackMatch = trackBoostCategories.includes(item.category);
    const score = isTrackMatch ? 3 : 1;
    const rationale = isTrackMatch
      ? ['track-boost-fallback']
      : ['catalog-balance-fallback'];
    return { item, score, rationale };
  });

  const trackFallback = trackBoostCategories.length > 0
    ? fallbackCandidates.filter((entry) => entry.item.category !== 'unknown' && trackBoostCategories.includes(entry.item.category))
    : [];

  const ranked = (trackFallback.length > 0 ? trackFallback : fallbackCandidates)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.item.suggestedGrossProfit - a.item.suggestedGrossProfit;
    })
    .slice(0, limit);

  return ranked;
}

export function recommendBoomRxBySymptoms(input: {
  symptoms: string[];
  goals?: string[];
  requestedTrack?: string;
  limit?: number;
}): SymptomRecommendationBundle {
  const goals = input.goals ?? [];
  const normalizedSymptoms = normalizeSymptoms(input.symptoms, goals);
  const limit = Math.max(1, Math.min(input.limit ?? 12, 30));
  const trackBoostCategories = inferTrackCategoryBoost(input.requestedTrack);

  const scored = BOOMRX_FORMULARY_ITEMS.map((item) =>
    scoreItemAgainstSymptoms(item, normalizedSymptoms, trackBoostCategories)
  ).filter((value): value is SymptomMatchedRecommendation => value !== null);

  let recommendations = buildRecommendationsByScore(scored).slice(0, limit);
  if (recommendations.length === 0) {
    recommendations = buildFallbackRecommendations(trackBoostCategories, limit).slice(0, limit);
  }

  const summary = summarizeRecommendations(normalizedSymptoms, recommendations);

  return {
    normalizedSymptoms,
    ...summary,
  };
}
