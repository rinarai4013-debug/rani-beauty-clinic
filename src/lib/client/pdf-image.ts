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

    // Aura handouts place the neutral front-face image in a stable position on
    // page 1. Cropping this region gives the simulator an actual face source
    // while keeping the persisted data URL small enough for Airtable.
    const crop = {
      left: pageCanvas.width * 0.079,
      top: pageCanvas.height * 0.323,
      width: pageCanvas.width * 0.252,
      height: pageCanvas.height * 0.186,
    };
    const faceCanvas = resizeCanvasToFit(cropCanvas(pageCanvas, crop), maxDimension);
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
