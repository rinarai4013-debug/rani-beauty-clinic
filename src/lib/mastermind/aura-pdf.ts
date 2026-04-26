import type {
  AuraScanResult,
  AuraGrade,
  ConcernSeverity,
  ConcernUrgency,
  CategoryScore,
  FacialZone,
} from '@/types/mastermind';

type PdfJsModule = {
  getDocument: (input: unknown) => { promise: Promise<PdfDocument> };
  GlobalWorkerOptions?: { workerSrc?: string };
};

type PdfDocument = {
  numPages?: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy?: () => Promise<void> | void;
};

type PdfPage = {
  getTextContent: () => Promise<{ items?: Array<{ str?: string }> }>;
};

type AuraPdfCategory = 'wrinkles' | 'texture' | 'brownSpots' | 'redAreas' | 'pores';

export type AuraPdfInsights = {
  textSummary: string;
  absoluteScores: Partial<Record<AuraPdfCategory, number>>;
  peerScores: Partial<Record<AuraPdfCategory, number>>;
  peerSkinScore: number | null;
  provenance: string;
};

const CATEGORY_LABELS: Record<AuraPdfCategory, string> = {
  wrinkles: 'Wrinkles',
  texture: 'Texture',
  brownSpots: 'Brown Spots',
  redAreas: 'Red Areas',
  pores: 'Pores',
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJsModule(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = (async () => {
      const imported = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdfjs = imported as unknown as PdfJsModule;
      return pdfjs;
    })();
  }

  return pdfJsPromise;
}

async function extractTextWithPdfJs(bytes: Uint8Array, maxPages: number, maxChars: number): Promise<string> {
  const pdfjs = await loadPdfJsModule();
  const task = pdfjs.getDocument({
    data: bytes,
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  const pdf = await task.promise;

  try {
    const fragments: string[] = [];
    const pagesToRead = Math.min(maxPages, pdf.numPages ?? maxPages);
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      for (const item of content.items || []) {
        const token = typeof item?.str === 'string' ? item.str.trim() : '';
        if (token) fragments.push(token);
      }

      if (fragments.join('\n').length >= maxChars) break;
    }

    return fragments.join('\n').slice(0, maxChars);
  } finally {
    await pdf.destroy?.();
  }
}

function extractTextFallback(bytes: Uint8Array, maxChars: number): string {
  const raw = Buffer.from(bytes).toString('utf8');
  const normalized = raw
    .replace(/\u0000+/g, ' ')
    .replace(/[^\x20-\x7E -￿\r\n]+/g, ' ');
  return normalized.replace(/\s{2,}/g, ' ').trim().slice(0, maxChars);
}

function parseFloatSafe(raw: string): number | null {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCategoryValues(text: string, label: string): number[] {
  const values: number[] = [];
  const regex = new RegExp(`${label}[\\s\\S]{0,40}?Score\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, 'gi');
  let match: RegExpExecArray | null = regex.exec(text);
  while (match) {
    const value = parseFloatSafe(match[1]);
    if (value !== null) values.push(value);
    match = regex.exec(text);
  }
  return values;
}

function pickAbsolute(values: number[]): number | null {
  for (const value of values) {
    if (value >= 0.5 && value <= 5.0) return value;
  }
  return null;
}

function pickPeer(values: number[]): number | null {
  if (values.length >= 2) {
    const second = values[1];
    if (second >= -3 && second <= 3) return second;
  }
  for (const value of values) {
    if (value >= -3 && value <= 3 && value < 0.5) return value;
  }
  return null;
}

function parsePeerSkinScore(text: string): number | null {
  const regex = /Skin Score[\s\S]{0,140}?(-?\d+(?:\.\d+)?)/i;
  const match = regex.exec(text);
  if (!match) return null;
  const value = parseFloatSafe(match[1]);
  if (value === null) return null;
  return value >= -3 && value <= 3 ? value : null;
}

function severityFromAbsolute(score: number): ConcernSeverity {
  if (score >= 3.8) return 'severe';
  if (score >= 2.4) return 'moderate';
  return 'mild';
}

function urgencyFromSeverity(severity: ConcernSeverity): ConcernUrgency {
  if (severity === 'severe') return 'high';
  if (severity === 'moderate') return 'medium';
  return 'low';
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function scoreToGrade(score: number): AuraGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function gradeToLabel(grade: AuraGrade): string {
  const labels: Record<AuraGrade, string> = {
    'A+': 'Exceptional',
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Needs Attention',
    F: 'Requires Intervention',
  };
  return labels[grade];
}

export async function extractAuraPdfInsights(
  pdfFile: File,
  options: { maxPages?: number; maxChars?: number } = {}
): Promise<AuraPdfInsights | null> {
  const maxPages = Math.max(1, options.maxPages ?? 3);
  const maxChars = Math.max(1000, options.maxChars ?? 6000);
  const bytes = new Uint8Array(await pdfFile.arrayBuffer());

  let text = '';
  try {
    text = await extractTextWithPdfJs(bytes, maxPages, maxChars);
  } catch (error) {
    console.warn('[Aura PDF] pdf.js extraction failed, using raw fallback:', error);
    text = extractTextFallback(bytes, maxChars);
  }

  if (!text) return null;

  const insights = extractAuraPdfInsightsFromText(text, pdfFile.name || 'aura-handout.pdf');
  if (insights) return insights;

  // A syntactically valid PDF is still not a parsed Aura handout unless we can
  // extract at least one score. Callers can continue with intake fallback.
  return null;
}

export function extractAuraPdfInsightsFromText(
  textInput: string,
  provenance: string
): AuraPdfInsights | null {
  const text = textInput.trim();
  if (!text) return null;

  const absoluteScores: Partial<Record<AuraPdfCategory, number>> = {};
  const peerScores: Partial<Record<AuraPdfCategory, number>> = {};
  for (const [category, label] of Object.entries(CATEGORY_LABELS) as Array<[AuraPdfCategory, string]>) {
    const values = parseCategoryValues(text, label);
    const absolute = pickAbsolute(values);
    const peer = pickPeer(values);
    if (absolute !== null) absoluteScores[category] = roundToOneDecimal(absolute);
    if (peer !== null) peerScores[category] = roundToOneDecimal(peer);
  }

  const peerSkinScore = parsePeerSkinScore(text);
  const hasAnyScore =
    Object.keys(absoluteScores).length > 0 ||
    Object.keys(peerScores).length > 0 ||
    peerSkinScore !== null;

  if (!hasAnyScore) return null;

  return {
    textSummary: text.slice(0, 6000),
    absoluteScores,
    peerScores,
    peerSkinScore,
    provenance: provenance || 'aura-handout.pdf',
  };
}

function categoryKeyToConcern(category: AuraPdfCategory): AuraScanResult['detectedConcerns'][number]['concern'] {
  const mapping: Record<AuraPdfCategory, AuraScanResult['detectedConcerns'][number]['concern']> = {
    wrinkles: 'wrinkles',
    texture: 'texture',
    brownSpots: 'pigmentation',
    redAreas: 'redness',
    pores: 'pores',
  };
  return mapping[category];
}

function categoryKeyToZones(category: AuraPdfCategory): FacialZone[] {
  const mapping: Record<AuraPdfCategory, FacialZone[]> = {
    wrinkles: ['forehead', 'glabella', 'periorbital_left', 'periorbital_right'],
    texture: ['cheeks_left', 'cheeks_right', 'forehead'],
    brownSpots: ['cheeks_left', 'cheeks_right', 'forehead'],
    redAreas: ['cheeks_left', 'cheeks_right'],
    pores: ['cheeks_left', 'cheeks_right', 'chin'],
  };
  return mapping[category];
}

function auraPdfConcernDescription(
  category: AuraPdfCategory,
  severity: ConcernSeverity,
  absolute: number,
  provenance: string,
): string {
  const label = CATEGORY_LABELS[category];
  return `${label} measured ${absolute}/5 (${severity}) on the Aura handout PDF (${provenance}).`;
}

function auraPdfClinicalNote(
  category: AuraPdfCategory,
  severity: ConcernSeverity,
  absolute: number,
  peer: number | undefined,
): string {
  const label = CATEGORY_LABELS[category];
  const peerText = typeof peer === 'number' ? ` Peer comparison score: ${peer}.` : '';
  return `${label} — ${severity} grade from Aura PDF absolute score ${absolute}/5.${peerText} Confirm visually during provider review before final treatment selection.`;
}

export function applyAuraPdfInsightsToScan(
  scanResult: AuraScanResult,
  insights: AuraPdfInsights
): AuraScanResult {
  const next = structuredClone(scanResult);
  const updatedCategories: CategoryScore[] = next.auraDeviceAnalysis.categories.map((category) => {
    const key = category.category as AuraPdfCategory;
    const absolute = insights.absoluteScores[key];
    const peer = insights.peerScores[key];
    if (absolute === undefined && peer === undefined) return category;

    const severity = absolute !== undefined ? severityFromAbsolute(absolute) : category.severity;
    return {
      ...category,
      absoluteScore: absolute !== undefined ? absolute : category.absoluteScore,
      peerScore: peer !== undefined ? peer : category.peerScore,
      severity,
      description: `${category.label} parsed from Aura handout PDF (${insights.provenance}).`,
    };
  });
  next.auraDeviceAnalysis.categories = updatedCategories;

  const absoluteValues = Object.values(insights.absoluteScores).filter((value): value is number => typeof value === 'number');
  if (absoluteValues.length > 0) {
    const average = absoluteValues.reduce((sum, value) => sum + value, 0) / absoluteValues.length;
    const overall = Math.round(95 - ((average - 1) / 4) * 60);
    next.auraScore.overall = Math.max(35, Math.min(97, overall));
    next.auraScore.grade = scoreToGrade(next.auraScore.overall);
    next.auraScore.label = gradeToLabel(next.auraScore.grade);
  }

  if (insights.peerSkinScore !== null) {
    next.auraDeviceAnalysis.compositeSkinScore = roundToOneDecimal(insights.peerSkinScore);
  }

  for (const [category, absolute] of Object.entries(insights.absoluteScores) as Array<[AuraPdfCategory, number]>) {
    const concernKey = categoryKeyToConcern(category);
    const concern = next.detectedConcerns.find((item) =>
      item.concern === concernKey || item.concern.toLowerCase().includes(concernKey)
    );
    const severity = severityFromAbsolute(absolute);
    const peer = insights.peerScores[category];
    const score = Math.round(((absolute - 1) / 4) * 100);
    const zones = categoryKeyToZones(category);
    const description = auraPdfConcernDescription(category, severity, absolute, insights.provenance);
    const clinicalNote = auraPdfClinicalNote(category, severity, absolute, peer);

    if (!concern) {
      next.detectedConcerns.push({
        id: `aura_pdf_${category}`,
        concern: concernKey,
        severity,
        urgency: urgencyFromSeverity(severity),
        score,
        zones,
        trending: 'stable',
        description,
        clinicalNote,
      });
      continue;
    }

    concern.severity = severity;
    concern.urgency = urgencyFromSeverity(severity);
    concern.score = score;
    concern.zones = zones;
    concern.description = description;
    concern.clinicalNote = clinicalNote;
  }

  return next;
}
