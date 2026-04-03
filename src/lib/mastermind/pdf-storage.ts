/**
 * PDF Storage — Persistent PDF file management
 *
 * Stores generated PDF HTML files on the server filesystem
 * and returns stable URLs for retrieval. Files are served
 * via the /api/mastermind/pdf/[filename] route.
 *
 * Storage location: /tmp/rani-pdfs/ (server-local)
 * URL pattern: /api/mastermind/pdf/serve?file={filename}
 *
 * On Vercel: /tmp persists within a single serverless invocation
 * lifecycle. PDFs may need regeneration after cold starts — the
 * PDF route handles this via data URL fallback. For cross-deploy
 * persistence, add @vercel/blob (clean seam: replace storePdf/
 * retrievePdf implementations, keep interface unchanged).
 */

import { writeFile, mkdir, readFile, access } from 'fs/promises';
import { join } from 'path';

// Storage directory — /tmp is writable on Vercel and local
const STORAGE_DIR = join(process.cwd(), '.next', 'cache', 'rani-pdfs');
const FALLBACK_DIR = '/tmp/rani-pdfs';

let resolvedDir: string | null = null;

async function getStorageDir(): Promise<string> {
  if (resolvedDir) return resolvedDir;

  // Try primary dir first, fallback to /tmp
  for (const dir of [STORAGE_DIR, FALLBACK_DIR]) {
    try {
      await mkdir(dir, { recursive: true });
      resolvedDir = dir;
      return dir;
    } catch {
      continue;
    }
  }

  throw new Error('Cannot create PDF storage directory');
}

// ── Store ──

export interface StoredPdf {
  filename: string;
  url: string;
  storedAt: string;
  sizeBytes: number;
}

export async function storePdf(
  html: string,
  filename: string,
  baseUrl?: string
): Promise<StoredPdf> {
  const dir = await getStorageDir();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = join(dir, safeName);

  await writeFile(filePath, html, 'utf-8');

  // Build URL — use the serve route
  const base = baseUrl || '';
  const url = `${base}/api/mastermind/pdf/serve?file=${encodeURIComponent(safeName)}`;

  return {
    filename: safeName,
    url,
    storedAt: new Date().toISOString(),
    sizeBytes: Buffer.byteLength(html, 'utf-8'),
  };
}

// ── Retrieve ──

export async function retrievePdf(filename: string): Promise<string | null> {
  const dir = await getStorageDir();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = join(dir, safeName);

  try {
    await access(filePath);
    return readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ── Check Existence ──

export async function pdfExists(filename: string): Promise<boolean> {
  const dir = await getStorageDir();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  try {
    await access(join(dir, safeName));
    return true;
  } catch {
    return false;
  }
}
