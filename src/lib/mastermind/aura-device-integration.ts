/**
 * Aura 3D Imaging Device Integration
 *
 * Imports scan images from the Hexagon Aura 3D scanner desktop app
 * (com.hexagon.aura.da) into Mastermind consultation sessions.
 *
 * The Aura scanner stores handout images at a known macOS container path.
 * This module reads those images, converts to base64 data URLs (resized
 * for manageable payloads), and provides fuzzy patient name matching.
 *
 * Runs server-side only (Node.js fs/path/os).
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

// ── TYPES ──

export interface AuraDeviceScan {
  patientName: string;
  scanDate: string; // ISO date
  images: {
    front: string; // base64 data URL
    brownAreas: string;
    redAreas: string;
    wrinkles: string;
    pores: string;
    smoothness: string;
    overview?: string;
    distancesFront?: string;
    distancesRight?: string;
    anglesLeft?: string;
    anglesRight?: string;
  };
  expressions?: {
    smile?: string;
    angry?: string;
    kiss?: string;
    surprise?: string;
  };
  handoutPdfPath?: string;
}

export interface AvailableScan {
  name: string;
  date: string;
  imageCount: number;
}

// ── CONSTANTS ──

const LOG_PREFIX = '[Aura Device]';

const DEFAULT_AURA_DATA_DIR = path.join(
  'Library',
  'Containers',
  'com.hexagon.aura.da',
  'Data',
  'Library',
  'Application Support',
  'com.hexagon.aura.da',
  'temp',
  'handout',
  'images'
);

const MAX_IMAGE_WIDTH = 800;

// Image suffix map — maps our key names to Aura filename suffixes
const IMAGE_SUFFIX_MAP: Record<string, string> = {
  front: 'Neutral-0_Front',
  brownAreas: 'Neutral-0_BrownAreas_Front',
  redAreas: 'Neutral-0_RedAreas_Front',
  wrinkles: 'Neutral-0_Wrinkles_Front',
  pores: 'Neutral-0_Pores_Front',
  smoothness: 'Neutral-0_Smoothness_Front',
  overview: 'Neutral-0_OverviewAndSkinType_Front',
  distancesFront: 'Neutral-0_Distances_Front',
  distancesRight: 'Neutral-0_Distances_Right',
  anglesLeft: 'Neutral-0_Angles_Left',
  anglesRight: 'Neutral-0_Angles_Right',
};

const EXPRESSION_SUFFIX_MAP: Record<string, string> = {
  smile: 'Smile',
  angry: 'Angry',
  kiss: 'Kiss',
  surprise: 'Surprise',
};

// ── HELPERS ──

function getAuraDataDir(): string {
  const envDir = process.env.AURA_DATA_DIR;
  if (envDir) return envDir;
  return path.join(os.homedir(), DEFAULT_AURA_DATA_DIR);
}

/**
 * Read an image file, resize to max width, and return as base64 data URL.
 * Returns null if the file does not exist or cannot be read.
 */
async function imageToBase64(filePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) return null;

    const buffer = await sharp(filePath)
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .png({ quality: 85, compressionLevel: 6 })
      .toBuffer();

    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to read image: ${filePath}`, err);
    return null;
  }
}

/**
 * Parse an Aura filename to extract patient name and date.
 * Expected format: {Name}_{Date}_Neutral-0_Front.png
 * Date format in filenames: DD.MM.YYYY or similar
 *
 * Returns null if the filename doesn't match expected patterns.
 */
function parseAuraFilename(filename: string): { name: string; date: string; suffix: string } | null {
  // Remove .png extension
  const base = filename.replace(/\.png$/i, '');

  // Try to match the pattern: Name_Name_DD.MM.YYYY_Suffix
  // The date portion contains dots (DD.MM.YYYY)
  const datePattern = /(\d{2}\.\d{2}\.\d{4})/;
  const match = base.match(datePattern);

  if (!match) return null;

  const dateStr = match[1];
  const dateIndex = base.indexOf(dateStr);

  // Everything before the date (minus trailing underscore) is the name
  const namePart = base.substring(0, dateIndex).replace(/_$/, '');
  // Everything after the date (minus leading underscore) is the suffix
  const suffixPart = base.substring(dateIndex + dateStr.length).replace(/^_/, '');

  if (!namePart) return null;

  // Convert DD.MM.YYYY to ISO date
  const [day, month, year] = dateStr.split('.');
  const isoDate = `${year}-${month}-${day}`;

  return {
    name: namePart,
    date: isoDate,
    suffix: suffixPart,
  };
}

/**
 * Normalize a name for comparison: lowercase, replace underscores with spaces, trim.
 */
function normalizeName(name: string): string {
  return name.replace(/_/g, ' ').toLowerCase().trim();
}

/**
 * Fuzzy match: checks if the query matches the candidate name.
 * Supports exact match, case-insensitive match, first-name-only match,
 * and partial substring match.
 */
function nameMatches(query: string, candidate: string): boolean {
  const q = normalizeName(query);
  const c = normalizeName(candidate);

  // Exact match
  if (q === c) return true;

  // Query is a substring of candidate or vice versa
  if (c.includes(q) || q.includes(c)) return true;

  // First name match
  const queryFirst = q.split(' ')[0];
  const candidateFirst = c.split(' ')[0];
  if (queryFirst === candidateFirst && queryFirst.length >= 3) return true;

  // Last name match
  const queryParts = q.split(' ');
  const candidateParts = c.split(' ');
  if (queryParts.length > 1 && candidateParts.length > 1) {
    const queryLast = queryParts[queryParts.length - 1];
    const candidateLast = candidateParts[candidateParts.length - 1];
    if (queryLast === candidateLast && queryLast.length >= 3) return true;
  }

  return false;
}

/**
 * Score a name match for sorting (higher = better match).
 */
function nameMatchScore(query: string, candidate: string): number {
  const q = normalizeName(query);
  const c = normalizeName(candidate);

  if (q === c) return 100;
  if (c.startsWith(q) || q.startsWith(c)) return 80;
  if (c.includes(q) || q.includes(c)) return 60;

  const queryFirst = q.split(' ')[0];
  const candidateFirst = c.split(' ')[0];
  if (queryFirst === candidateFirst) return 50;

  return 0;
}

// ── PUBLIC API ──

/**
 * Scan the Aura data directory for available patient scans.
 * Groups images by patient name + date and returns a summary list.
 */
export function listAvailableScans(): AvailableScan[] {
  const dataDir = getAuraDataDir();

  if (!fs.existsSync(dataDir)) {
    console.warn(`${LOG_PREFIX} Aura data directory not found: ${dataDir}`);
    return [];
  }

  let files: string[];
  try {
    files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.png'));
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to read Aura data directory:`, err);
    return [];
  }

  // Group files by name + date
  const scanMap = new Map<string, { name: string; date: string; count: number }>();

  for (const file of files) {
    const parsed = parseAuraFilename(file);
    if (!parsed) continue;

    const key = `${parsed.name}__${parsed.date}`;
    const existing = scanMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      scanMap.set(key, { name: parsed.name, date: parsed.date, count: 1 });
    }
  }

  // Convert to array, sorted by date descending (most recent first)
  return Array.from(scanMap.values())
    .map((s) => ({
      name: s.name.replace(/_/g, ' '),
      date: s.date,
      imageCount: s.count,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Import a specific patient's scan images as base64 data URLs.
 * Reads all matching images from the Aura data directory, resizes them,
 * and returns a complete AuraDeviceScan object.
 */
export async function importAuraScan(
  patientName: string,
  scanDate: string
): Promise<AuraDeviceScan | null> {
  const dataDir = getAuraDataDir();

  if (!fs.existsSync(dataDir)) {
    console.error(`${LOG_PREFIX} Aura data directory not found: ${dataDir}`);
    return null;
  }

  // Convert name to underscore format for filename matching
  const fileNamePrefix = patientName.replace(/\s+/g, '_');

  // Convert ISO date back to DD.MM.YYYY for filename matching
  const [year, month, day] = scanDate.split('-');
  const fileDateStr = `${day}.${month}.${year}`;

  const basePrefix = `${fileNamePrefix}_${fileDateStr}`;

  // Also try matching with original underscored name from the directory
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.png'));

  // Find files that match this patient + date (fuzzy on name)
  const matchingFiles = files.filter((f) => {
    const parsed = parseAuraFilename(f);
    if (!parsed) return false;
    if (parsed.date !== scanDate) return false;
    return nameMatches(patientName, parsed.name);
  });

  if (matchingFiles.length === 0) {
    // Try exact prefix match as fallback
    const prefixMatches = files.filter((f) =>
      f.toLowerCase().startsWith(basePrefix.toLowerCase())
    );
    if (prefixMatches.length === 0) {
      console.warn(
        `${LOG_PREFIX} No images found for "${patientName}" on ${scanDate}`
      );
      return null;
    }
    matchingFiles.push(...prefixMatches);
  }

  // Build the scan object
  const images: Record<string, string> = {};
  const expressions: Record<string, string> = {};

  // Process core analysis images
  for (const [key, suffix] of Object.entries(IMAGE_SUFFIX_MAP)) {
    const matchFile = matchingFiles.find((f) =>
      f.includes(`_${suffix}.png`) || f.endsWith(`_${suffix}.png`)
    );
    if (matchFile) {
      const filePath = path.join(dataDir, matchFile);
      const base64 = await imageToBase64(filePath);
      if (base64) {
        images[key] = base64;
      }
    }
  }

  // Process expression images (look for Front views)
  for (const [key, exprName] of Object.entries(EXPRESSION_SUFFIX_MAP)) {
    const matchFile = matchingFiles.find(
      (f) => f.includes(`_${exprName}`) && f.includes('_Front.png')
    );
    if (matchFile) {
      const filePath = path.join(dataDir, matchFile);
      const base64 = await imageToBase64(filePath);
      if (base64) {
        expressions[key] = base64;
      }
    }
  }

  // Must have at least the front image
  if (!images.front) {
    console.warn(
      `${LOG_PREFIX} Front image not found for "${patientName}" on ${scanDate}`
    );
    return null;
  }

  // Must have at least one analysis image (brownAreas, redAreas, wrinkles, pores, or smoothness)
  const analysisKeys = ['brownAreas', 'redAreas', 'wrinkles', 'pores', 'smoothness'];
  const hasAnalysis = analysisKeys.some((k) => k in images);
  if (!hasAnalysis) {
    console.warn(
      `${LOG_PREFIX} No analysis images found for "${patientName}" on ${scanDate}. Found front only.`
    );
  }

  // Find handout PDF
  const handoutPdf = findHandoutPdf(patientName);

  const scan: AuraDeviceScan = {
    patientName: patientName.replace(/_/g, ' '),
    scanDate,
    images: {
      front: images.front,
      brownAreas: images.brownAreas || '',
      redAreas: images.redAreas || '',
      wrinkles: images.wrinkles || '',
      pores: images.pores || '',
      smoothness: images.smoothness || '',
      overview: images.overview,
      distancesFront: images.distancesFront,
      distancesRight: images.distancesRight,
      anglesLeft: images.anglesLeft,
      anglesRight: images.anglesRight,
    },
    expressions: Object.keys(expressions).length > 0 ? (expressions as AuraDeviceScan['expressions']) : undefined,
    handoutPdfPath: handoutPdf || undefined,
  };

  return scan;
}

/**
 * Find the most recent scan matching a patient name (fuzzy match).
 * Searches all available scans and returns the best match with the latest date.
 */
export async function findLatestScan(patientName: string): Promise<AuraDeviceScan | null> {
  const scans = listAvailableScans();

  if (scans.length === 0) {
    console.warn(`${LOG_PREFIX} No scans available`);
    return null;
  }

  // Find matching scans, scored by name match quality
  const matches = scans
    .filter((s) => nameMatches(patientName, s.name))
    .map((s) => ({
      ...s,
      score: nameMatchScore(patientName, s.name),
    }))
    .sort((a, b) => {
      // Sort by match score first, then by date (most recent)
      if (b.score !== a.score) return b.score - a.score;
      return b.date.localeCompare(a.date);
    });

  if (matches.length === 0) {
    console.warn(`${LOG_PREFIX} No matching scans for "${patientName}"`);
    return null;
  }

  const best = matches[0];
  return importAuraScan(best.name, best.date);
}

/**
 * Find the handout PDF on the desktop for a given patient name.
 * Aura saves PDFs as: ~/Desktop/{Name}_handout_{Date}_{Time}.pdf
 */
export function findHandoutPdf(patientName: string): string | null {
  const desktopDir = path.join(os.homedir(), 'Desktop');

  if (!fs.existsSync(desktopDir)) return null;

  try {
    const files = fs.readdirSync(desktopDir).filter((f) => f.endsWith('.pdf'));

    // Normalize patient name for matching
    const nameUnderscore = patientName.replace(/\s+/g, '_');

    // Find matching handout PDFs
    const matches = files
      .filter((f) => {
        const lower = f.toLowerCase();
        return (
          lower.includes('handout') &&
          (lower.startsWith(nameUnderscore.toLowerCase()) ||
            lower.includes(nameUnderscore.toLowerCase()))
        );
      })
      .sort()
      .reverse(); // Most recent first (date is in filename)

    if (matches.length > 0) {
      return path.join(desktopDir, matches[0]);
    }
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to search desktop for PDFs:`, err);
  }

  return null;
}
