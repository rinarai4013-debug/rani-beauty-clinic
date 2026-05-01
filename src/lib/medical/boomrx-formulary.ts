import rawFormulary from './boomrx-formulary.raw.json';

export type BoomRxCategory =
  | 'glp1'
  | 'peptide'
  | 'hormone'
  | 'sexual-health'
  | 'wellness'
  | 'hair-skin'
  | 'unknown';

export interface BoomRxFormularyItem {
  id: string;
  label: string;
  baseProduct: string;
  category: BoomRxCategory;
  unitCost: number;
  monthlyCostEstimate: number;
  suggestedRetail: number;
  suggestedGrossProfit: number;
  suggestedMarginPercent: number;
  keywords: string[];
  source: 'boomrx-formulary';
}

interface RawFormularyPayload {
  pages: number;
  price_lines: string[];
}

const PRICE_REGEX = /\$([0-9]+(?:\.[0-9]{1,2})?)/;

const CATEGORY_MULTIPLIER: Record<BoomRxCategory, number> = {
  glp1: 2.25,
  peptide: 2.35,
  hormone: 2.4,
  'sexual-health': 2.45,
  wellness: 2.2,
  'hair-skin': 2.2,
  unknown: 2.15,
};

const CATEGORY_FLOOR_PRICE: Record<BoomRxCategory, number> = {
  glp1: 299,
  peptide: 229,
  hormone: 179,
  'sexual-health': 149,
  wellness: 99,
  'hair-skin': 99,
  unknown: 99,
};

const CATEGORY_KEYWORDS: Array<{ category: BoomRxCategory; keywords: string[] }> = [
  {
    category: 'glp1',
    keywords: [
      'semaglutide',
      'tirzepatide',
      'liraglutide',
      'retatrutide',
      'glp',
      'mounjaro',
      'zepbound',
      'wegovy',
      'ozempic',
      'rybelsus',
    ],
  },
  {
    category: 'peptide',
    keywords: [
      'peptide',
      'bpc',
      '157',
      'cjc',
      'ipamorelin',
      'tesamorelin',
      'sermorelin',
      'mots-c',
      'aod',
      'thymosin',
      'll-37',
      'ghk',
      'nad+',
    ],
  },
  {
    category: 'hormone',
    keywords: [
      'hrt',
      'trt',
      'testosterone',
      'estradiol',
      'estrogen',
      'progesterone',
      'dhea',
      'anastrozole',
      'biest',
      'thyroid',
      'liothyronine',
      'levothyroxine',
      'clomiphene',
    ],
  },
  {
    category: 'sexual-health',
    keywords: [
      'pt-141',
      'bremelanotide',
      'sildenafil',
      'tadalafil',
      'vardenafil',
      'sexual',
      'libido',
      'ed',
    ],
  },
  {
    category: 'hair-skin',
    keywords: ['minoxidil', 'finasteride', 'dutasteride', 'hair', 'skin', 'melasma', 'acne'],
  },
  {
    category: 'wellness',
    keywords: [
      'glutathione',
      'b12',
      'biotin',
      'vitamin',
      'mic',
      'lipo',
      'immune',
      'nad iv',
      'coq10',
    ],
  },
];

function splitMergedPriceLine(line: string): string[] {
  // Lines that contain multiple `$nnn.nn)` segments are extracted from a PDF merge artifact.
  const SPLIT_RE = /(\$\d+(?:\.\d{1,2})?\))/g;
  const matches = Array.from(line.matchAll(SPLIT_RE));
  if (matches.length <= 1) return [line];

  const out: string[] = [];
  let cursor = 0;
  for (const match of matches) {
    const end = (match.index ?? 0) + match[0].length;
    out.push(line.slice(cursor, end));
    cursor = end;
  }
  if (cursor < line.length) {
    out[out.length - 1] += line.slice(cursor);
  }
  return out
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeLabel(line: string): string {
  return line.replace(/\)\s*$/, '').replace(/\s+/g, ' ').trim();
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function inferCategory(normalized: string): BoomRxCategory {
  const lower = normalized.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => lower.includes(keyword))) {
      return entry.category;
    }
  }
  return 'unknown';
}

function estimateMonthlyUnits(normalized: string): number {
  const lower = normalized.toLowerCase();
  if (
    lower.includes('tablet') ||
    lower.includes('capsule') ||
    lower.includes('troche') ||
    lower.includes('odt') ||
    lower.includes('sublingual')
  ) {
    return 30;
  }
  return 1;
}

function extractBaseProduct(normalized: string): string {
  const priceIndex = normalized.indexOf('$');
  const withoutPrice = priceIndex >= 0 ? normalized.slice(0, priceIndex) : normalized;

  return withoutPrice
    .replace(/\b(?:injectable|capsule|tablet|cream|troche|odt|sublingual|solution)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(normalized: string): string[] {
  const tokens = normalized
    .toLowerCase()
    .replace(/[^a-z0-9+/-]+/g, ' ')
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  return Array.from(new Set(tokens)).slice(0, 20);
}

function roundToRetail(price: number): number {
  return Math.max(25, Math.ceil(price / 5) * 5);
}

function parseLine(line: string, index: number): BoomRxFormularyItem | null {
  const normalized = normalizeLabel(line);
  const allPrices = normalized.match(/\$[0-9]+(?:\.[0-9]{1,2})?/g) || [];
  if (allPrices.length !== 1) return null;

  const priceMatch = normalized.match(PRICE_REGEX);
  if (!priceMatch) return null;

  const unitCost = Number(priceMatch[1]);
  if (!Number.isFinite(unitCost) || unitCost <= 0) return null;

  const category = inferCategory(normalized);
  const monthlyUnits = estimateMonthlyUnits(normalized);
  const monthlyCostEstimate = Number((unitCost * monthlyUnits).toFixed(2));
  const multiplier = CATEGORY_MULTIPLIER[category];
  const floor = CATEGORY_FLOOR_PRICE[category];
  const suggestedRetail = Math.max(roundToRetail(monthlyCostEstimate * multiplier), floor);
  const suggestedGrossProfit = Number((suggestedRetail - monthlyCostEstimate).toFixed(2));
  const suggestedMarginPercent = Number(
    ((suggestedGrossProfit / Math.max(suggestedRetail, 1)) * 100).toFixed(1)
  );

  const labelWithoutTrailingPrice = normalized.replace(/\s*\$[0-9]+(?:\.[0-9]{1,2})?\s*$/, '').trim();
  const baseProduct = extractBaseProduct(labelWithoutTrailingPrice) || labelWithoutTrailingPrice;
  const id = `boomrx-${slugify(baseProduct || normalized)}-${String(index + 1).padStart(3, '0')}`;

  return {
    id,
    label: labelWithoutTrailingPrice,
    baseProduct,
    category,
    unitCost,
    monthlyCostEstimate,
    suggestedRetail,
    suggestedGrossProfit,
    suggestedMarginPercent,
    keywords: extractKeywords(labelWithoutTrailingPrice),
    source: 'boomrx-formulary',
  };
}

const formularyPayload = rawFormulary as RawFormularyPayload;

export const BOOMRX_FORMULARY_ITEMS: BoomRxFormularyItem[] = formularyPayload.price_lines
  .flatMap((line, index) =>
    splitMergedPriceLine(line).map((lineFragment, splitIndex) => ({
      line: lineFragment,
      index: Number(`${index}${String(splitIndex).padStart(2, '0')}`),
    })),
  )
  .map(({ line, index }) => parseLine(line, index))
  .filter((item): item is BoomRxFormularyItem => item !== null);

export function searchBoomRxFormulary(query: string, limit = 30): BoomRxFormularyItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return BOOMRX_FORMULARY_ITEMS.slice(0, limit);

  return BOOMRX_FORMULARY_ITEMS.filter((item) => item.label.toLowerCase().includes(q))
    .sort((a, b) => b.suggestedGrossProfit - a.suggestedGrossProfit)
    .slice(0, limit);
}

export function getBoomRxFormularyStats(): {
  pages: number;
  itemCount: number;
  byCategory: Record<BoomRxCategory, number>;
  averageSuggestedMargin: number;
} {
  const byCategory: Record<BoomRxCategory, number> = {
    glp1: 0,
    peptide: 0,
    hormone: 0,
    'sexual-health': 0,
    wellness: 0,
    'hair-skin': 0,
    unknown: 0,
  };

  let totalMargin = 0;
  for (const item of BOOMRX_FORMULARY_ITEMS) {
    byCategory[item.category] += 1;
    totalMargin += item.suggestedMarginPercent;
  }

  return {
    pages: formularyPayload.pages,
    itemCount: BOOMRX_FORMULARY_ITEMS.length,
    byCategory,
    averageSuggestedMargin: Number((totalMargin / Math.max(BOOMRX_FORMULARY_ITEMS.length, 1)).toFixed(1)),
  };
}
