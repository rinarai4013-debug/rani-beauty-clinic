/**
 * Share token store: in-memory cache + Airtable persistence.
 *
 * Extracted from app/api/mastermind/share/route.ts so that
 * sibling route files can import resolveToken / saveTokenToAirtable
 * without triggering Next.js "invalid route export" errors.
 */
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

// ── Types ──

export interface ShareTokenRecord {
  token: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
}

// ── In-memory cache ──

const tokenCache = new Map<string, ShareTokenRecord>();

// ── Airtable persistence ──

const AIRTABLE_BASE = 'app1SwhSfwe8GKUg4';
const TABLE_NAME = 'Automation%20Log';
const SHARE_WORKFLOW_KEY = 'mastermind_share_token';

function getAirtablePat(): string | null {
  return process.env.AIRTABLE_PAT || null;
}

function airtableUrl(path?: string): string {
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE_NAME}`;
  return path ? `${base}/${path}` : base;
}

function atHeaders(): Record<string, string> {
  const pat = getAirtablePat();
  if (!pat) throw new Error('AIRTABLE_PAT not configured');
  return {
    Authorization: `Bearer ${pat}`,
    'Content-Type': 'application/json',
  };
}

export async function saveTokenToAirtable(record: ShareTokenRecord): Promise<void> {
  const pat = getAirtablePat();
  if (!pat) {
    console.warn('[Share] AIRTABLE_PAT not set — token not persisted');
    return;
  }
  try {
    const res = await fetch(airtableUrl(), {
      method: 'POST',
      headers: atHeaders(),
      body: JSON.stringify({
        typecast: true,
        records: [
          {
            fields: {
              Workflow: SHARE_WORKFLOW_KEY,
              Action: record.token,
              Status: 'active',
              Details: JSON.stringify(record),
              Timestamp: record.createdAt,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[Share] Airtable token save failed (${res.status}):`, errBody);
    }
  } catch (err) {
    console.error('[Share] Airtable token save error:', err);
  }
}

async function loadTokenFromAirtable(token: string): Promise<ShareTokenRecord | null> {
  const pat = getAirtablePat();
  if (!pat) return null;
  try {
    const safeToken = sanitizeFormulaValue(token);
    const filter = encodeURIComponent(
      `AND({Workflow}='${SHARE_WORKFLOW_KEY}',{Action}='${safeToken}')`
    );
    const res = await fetch(
      `${airtableUrl()}?filterByFormula=${filter}&maxRecords=1`,
      { headers: atHeaders(), signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    const row = data?.records?.[0];
    if (row?.fields?.Details) {
      return JSON.parse(row.fields.Details) as ShareTokenRecord;
    }
    console.warn(`[Share] Token not found in Airtable: ${token.substring(0, 12)}... (${data?.records?.length || 0} records)`);
  } catch (err) {
    console.error('[Share] Airtable token load error:', err);
  }
  return null;
}

// ── Cache cleanup ──

let lastCleanup = 0;
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  const nowISO = new Date().toISOString();
  for (const [key, record] of tokenCache) {
    if (record.expiresAt < nowISO) {
      tokenCache.delete(key);
    }
  }
}

// ── Public API ──

/**
 * Cache a token record (called after generating a new token).
 */
export function cacheToken(record: ShareTokenRecord): void {
  tokenCache.set(record.token, record);
}

/**
 * Resolve a token to its record.
 * Checks in-memory cache first, then falls back to Airtable.
 */
export async function resolveToken(token: string): Promise<ShareTokenRecord | null> {
  cleanupExpired();

  // Check cache
  const cached = tokenCache.get(token);
  if (cached) {
    if (new Date(cached.expiresAt) < new Date()) {
      tokenCache.delete(token);
      return null;
    }
    return cached;
  }

  // Fallback: load from Airtable (survives cold starts)
  const record = await loadTokenFromAirtable(token);
  if (record) {
    if (new Date(record.expiresAt) < new Date()) {
      return null; // expired
    }
    tokenCache.set(token, record);
    return record;
  }

  return null;
}
