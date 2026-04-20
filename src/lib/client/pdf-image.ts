'use client';

const PDFJS_CDN_VERSION = '4.10.38';
const PDFJS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_CDN_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_CDN_VERSION}/build/pdf.worker.min.mjs`;

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

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = (async () => {
      const runtimeImport = new Function('moduleUrl', 'return import(moduleUrl)') as (
        moduleUrl: string
      ) => Promise<{ default?: PdfJsModule } & Record<string, unknown>>;
      const imported = await runtimeImport(PDFJS_MODULE_URL);
      const pdfjs = (imported.default ?? imported) as unknown as PdfJsModule;

      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      }

      return pdfjs;
    })();
  }

  return pdfJsPromise;
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

  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(await pdfFile.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(1);
    let viewport = page.getViewport({ scale: 1.8 });
    const largerSide = Math.max(viewport.width, viewport.height);
    if (largerSide > maxDimension) {
      const downScale = maxDimension / largerSide;
      viewport = page.getViewport({ scale: 1.8 * downScale });
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
  } finally {
    await pdf.destroy?.();
  }
}
