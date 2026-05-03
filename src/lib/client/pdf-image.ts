'use client';

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
  maxBytes?: number;
};

type PdfTextExtractOptions = {
  maxPages?: number;
  maxChars?: number;
};

type CropCandidate = {
  left: number;
  top: number;
  width: number;
  height: number;
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = (async () => {
      const imported = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdfjs = imported as unknown as PdfJsModule;
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
    disableWorker: true,
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

function scaleCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(source.width * factor));
  canvas.height = Math.max(1, Math.floor(source.height * factor));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Failed to create canvas context for PDF compression');
  }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function cropCanvas(
  source: HTMLCanvasElement,
  crop: { left: number; top: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(crop.width));
  canvas.height = Math.max(1, Math.floor(crop.height));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Failed to create canvas context for PDF crop');
  }
  context.drawImage(
    source,
    crop.left,
    crop.top,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

function resizeCanvasToFit(
  source: HTMLCanvasElement,
  maxDimension: number
): HTMLCanvasElement {
  const largerSide = Math.max(source.width, source.height);
  if (largerSide <= maxDimension) return source;
  return scaleCanvas(source, maxDimension / largerSide);
}

function scorePhotoCandidate(canvas: HTMLCanvasElement): number {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return 0;

  const width = canvas.width;
  const height = canvas.height;
  const sampleStep = Math.max(4, Math.floor(Math.min(width, height) / 36));
  const image = context.getImageData(0, 0, width, height).data;
  let samples = 0;
  let whitePixels = 0;
  let darkPixels = 0;
  let chromaTotal = 0;
  let luminanceTotal = 0;
  let luminanceSquaredTotal = 0;
  let skinTonePixels = 0;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const offset = (y * width + x) * 4;
      const r = image[offset] ?? 255;
      const g = image[offset + 1] ?? 255;
      const b = image[offset + 2] ?? 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const luminance = (r * 0.299) + (g * 0.587) + (b * 0.114);
      const chroma = max - min;

      samples += 1;
      luminanceTotal += luminance;
      luminanceSquaredTotal += luminance * luminance;
      chromaTotal += chroma;
      if (r > 238 && g > 238 && b > 238) whitePixels += 1;
      if (r < 38 && g < 38 && b < 38) darkPixels += 1;
      if (r > 80 && g > 45 && b > 28 && r > b && g > b && chroma > 12) {
        skinTonePixels += 1;
      }
    }
  }

  if (!samples) return 0;

  const whiteRatio = whitePixels / samples;
  const darkRatio = darkPixels / samples;
  const chromaAverage = chromaTotal / samples;
  const luminanceAverage = luminanceTotal / samples;
  const luminanceVariance = Math.max(0, (luminanceSquaredTotal / samples) - (luminanceAverage * luminanceAverage));
  const skinRatio = skinTonePixels / samples;

  return (
    chromaAverage * 0.9 +
    Math.sqrt(luminanceVariance) * 0.75 +
    skinRatio * 70 -
    whiteRatio * 95 -
    darkRatio * 35
  );
}

async function encodeCanvasToBudget(
  canvas: HTMLCanvasElement,
  maxBytes: number,
  baseQuality: number
): Promise<Blob> {
  const qualityCandidates = [baseQuality, 0.72, 0.62, 0.52, 0.42];
  const scaleCandidates = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
  let smallestBlob: Blob | null = null;

  for (const scale of scaleCandidates) {
    const workingCanvas = scale === 1 ? canvas : scaleCanvas(canvas, scale);
    for (const quality of qualityCandidates) {
      const blob = await toBlob(workingCanvas, quality);
      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }
      if (blob.size <= maxBytes) {
        return blob;
      }
    }
  }

  if (smallestBlob) return smallestBlob;
  return toBlob(canvas, Math.min(baseQuality, 0.72));
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file as data URL'));
    reader.readAsDataURL(file);
  });
}

export async function convertPdfFirstPageToJpeg(
  pdfFile: File,
  options: PdfConvertOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1800;
  const quality = options.quality ?? 0.82;
  const maxBytes = options.maxBytes;
  const hasMaxBytes = typeof maxBytes === 'number' && Number.isFinite(maxBytes) && maxBytes > 0;

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
        const blob = hasMaxBytes
          ? await encodeCanvasToBudget(canvas, maxBytes, quality)
          : await toBlob(canvas, quality);

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

export async function convertAuraPdfFaceToJpeg(
  pdfFile: File,
  options: PdfConvertOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 420;
  const quality = options.quality ?? 0.66;
  const maxBytes = options.maxBytes ?? 28 * 1024;
  const pdf = await loadPdfDocument(pdfFile);

  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.55 });
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = Math.max(1, Math.floor(viewport.width));
    pageCanvas.height = Math.max(1, Math.floor(viewport.height));

    const context = pageCanvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to create canvas context for Aura PDF face extraction');
    }

    await page.render({ canvasContext: context, viewport }).promise;

    // Aura handout layouts vary by export version. Try several likely face
    // regions and keep the most photo-like crop so the simulator receives an
    // actual patient image instead of a blank metric/table region.
    const candidates: CropCandidate[] = [
      { left: 0.079, top: 0.323, width: 0.252, height: 0.186 },
      { left: 0.045, top: 0.16, width: 0.36, height: 0.34 },
      { left: 0.31, top: 0.16, width: 0.36, height: 0.34 },
      { left: 0.045, top: 0.27, width: 0.38, height: 0.34 },
      { left: 0.23, top: 0.25, width: 0.42, height: 0.36 },
      { left: 0.04, top: 0.20, width: 0.46, height: 0.46 },
    ];

    let bestCanvas: HTMLCanvasElement | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const candidate of candidates) {
      const crop = {
        left: pageCanvas.width * candidate.left,
        top: pageCanvas.height * candidate.top,
        width: pageCanvas.width * candidate.width,
        height: pageCanvas.height * candidate.height,
      };
      const candidateCanvas = cropCanvas(pageCanvas, crop);
      const score = scorePhotoCandidate(candidateCanvas);
      if (score > bestScore) {
        bestScore = score;
        bestCanvas = candidateCanvas;
      }
    }

    const faceCanvas = resizeCanvasToFit(bestCanvas || pageCanvas, maxDimension);
    const blob = await encodeCanvasToBudget(faceCanvas, maxBytes, quality);

    return new File([blob], `${baseName(pdfFile.name)}-aura-face.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
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
