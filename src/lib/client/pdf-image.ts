'use client';

const PDFJS_MODULE_PATH = '/vendor/pdfjs/pdf.min.mjs';
const PDFJS_WORKER_PATH = '/vendor/pdfjs/pdf.worker.min.mjs';

type PdfJsModule = {
  version?: string;
  getDocument: (input: unknown) => { promise: Promise<PdfDocument> };
  GlobalWorkerOptions?: { workerSrc?: string };
};

type PdfDocument = {
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy?: () => Promise<void> | void;
};

type PdfPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => {
    promise: Promise<void>;
  };
};

type PdfConvertOptions = {
  maxDimension?: number;
  quality?: number;
};

type PdfTextExtractOptions = {
  maxPages?: number;
  maxChars?: number;
};

type AuraPdfCategory = 'wrinkles' | 'texture' | 'brownSpots' | 'redAreas' | 'pores';

export type AuraPdfClientInsights = {
  provenance: string;
  absoluteScores: Partial<Record<AuraPdfCategory, number>>;
  peerScores: Partial<Record<AuraPdfCategory, number>>;
  peerSkinScore: number | null;
};

export const AURA_PDF_EXTRACT_MARKER = 'AURA_PDF_EXTRACT::';

const AURA_CATEGORY_LABELS: Record<AuraPdfCategory, string> = {
  wrinkles: 'Wrinkles',
  texture: 'Texture',
  brownSpots: 'Brown Spots',
  redAreas: 'Red Areas',
  pores: 'Pores',
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = (async () => {
      const moduleUrl = new URL(PDFJS_MODULE_PATH, window.location.origin).toString();
      const workerUrl = new URL(PDFJS_WORKER_PATH, window.location.origin).toString();
      const imported = await import(/* webpackIgnore: true */ moduleUrl);
      const pdfjs = (imported.default ?? imported) as unknown as PdfJsModule;

      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      }

      return pdfjs;
    })();
  }

  return pdfJsPromise;
}

async function loadPdfDocument(pdfFile: File): Promise<PdfDocument> {
  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(await pdfFile.arrayBuffer());
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  return loadingTask.promise;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '-');
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode PDF preview image'));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function convertPdfFirstPageToJpeg(
  pdfFile: File,
  options: PdfConvertOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1800;
  const quality = options.quality ?? 0.82;

  const pdf = await loadPdfDocument(pdfFile);

  try {
    const page = await pdf.getPage(1);
    const candidateScales = [1.8, 1.25, 1.0, 0.8];
    let lastError: unknown = null;

    for (const baseScale of candidateScales) {
      try {
        let viewport = page.getViewport({ scale: baseScale });
        const largerSide = Math.max(viewport.width, viewport.height);
        if (largerSide > maxDimension) {
          const downScale = maxDimension / largerSide;
          viewport = page.getViewport({ scale: baseScale * downScale });
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
          throw new Error('Failed to create canvas context for PDF conversion');
        }

        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await toBlob(canvas, quality);

        return new File([blob], `${baseName(pdfFile.name)}-page1.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to render Aura PDF page to image');
  } finally {
    await pdf.destroy?.();
  }
}

export async function extractPdfTextSummary(
  pdfFile: File,
  options: PdfTextExtractOptions = {}
): Promise<string> {
  const maxPages = Math.max(1, options.maxPages ?? 3);
  const maxChars = Math.max(500, options.maxChars ?? 4000);
  const pdf = await loadPdfDocument(pdfFile);

  try {
    const fragments: string[] = [];
    const pageCount = (pdf as unknown as { numPages?: number }).numPages ?? maxPages;
    const pagesToRead = Math.min(maxPages, pageCount);

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await (
        page as unknown as { getTextContent: () => Promise<{ items?: Array<{ str?: string }> }> }
      ).getTextContent();
      for (const item of textContent.items || []) {
        const text = typeof item?.str === 'string' ? item.str.trim() : '';
        if (text) fragments.push(text);
      }

      if (fragments.join('\n').length >= maxChars) break;
    }

    return fragments.join('\n').slice(0, maxChars);
  } finally {
    await pdf.destroy?.();
  }
}

function parseFloatSafe(raw: string): number | null {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseCategoryValues(text: string, label: string): number[] {
  const values: number[] = [];
  const regex = new RegExp(`${label}[\\s\\S]{0,40}?Score\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, 'gi');
  let match = regex.exec(text);
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
  return value >= -3 && value <= 3 ? roundToOneDecimal(value) : null;
}

export function extractAuraPdfInsightsFromText(
  text: string,
  provenance: string
): AuraPdfClientInsights | null {
  const normalized = text.trim();
  if (!normalized) return null;

  const absoluteScores: Partial<Record<AuraPdfCategory, number>> = {};
  const peerScores: Partial<Record<AuraPdfCategory, number>> = {};

  for (const [category, label] of Object.entries(AURA_CATEGORY_LABELS) as Array<
    [AuraPdfCategory, string]
  >) {
    const values = parseCategoryValues(normalized, label);
    const absolute = pickAbsolute(values);
    const peer = pickPeer(values);
    if (absolute !== null) absoluteScores[category] = roundToOneDecimal(absolute);
    if (peer !== null) peerScores[category] = roundToOneDecimal(peer);
  }

  const hasAnyMetrics = Object.keys(absoluteScores).length > 0 || Object.keys(peerScores).length > 0;
  const peerSkinScore = parsePeerSkinScore(normalized);
  if (!hasAnyMetrics && peerSkinScore === null) return null;

  return {
    provenance,
    absoluteScores,
    peerScores,
    peerSkinScore,
  };
}

export function encodeAuraPdfExtractMarker(insights: AuraPdfClientInsights): string {
  return `${AURA_PDF_EXTRACT_MARKER}${JSON.stringify(insights)}`;
}
