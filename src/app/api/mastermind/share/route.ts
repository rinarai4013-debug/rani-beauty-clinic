/**
 * POST /api/mastermind/share
 *
 * Generates a secure, time-limited share token for a Mastermind session.
 * The resulting URL is given to the patient so they can revisit their
 * personalized treatment plan at home — no login required.
 *
 * Body: { sessionId: string, expiresIn?: number }
 *   expiresIn — milliseconds until link expires (default 7 days)
 *
 * Returns: { shareUrl: string, token: string, expiresAt: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionByIdAsync } from '@/lib/mastermind/session';

// ── Share token store: in-memory cache + Airtable persistence ──
// Tokens are persisted to Airtable so patient share links survive
// Vercel cold starts and serverless function recycling.

export interface ShareTokenRecord {
  token: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
}

const tokenCache = new Map<string, ShareTokenRecord>();

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

async function saveTokenToAirtable(record: ShareTokenRecord): Promise<void> {
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
    const filter = encodeURIComponent(
      `AND({Workflow}='${SHARE_WORKFLOW_KEY}',{Action}='${token}')`
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
  } catch (err) {
    console.error('[Share] Airtable token load error:', err);
  }
  return null;
}

// Periodic cleanup of expired tokens from cache (runs at most once per minute)
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

/**
 * Resolve a token to its record (exported for sibling routes).
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

// ── Constants ──

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days cap

// ── POST Handler ──

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { sessionId, expiresIn } = body as {
      sessionId?: string;
      expiresIn?: number;
    };

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Validate expiresIn
    const ttl =
      typeof expiresIn === 'number' && expiresIn > 0
        ? Math.min(expiresIn, MAX_EXPIRY_MS)
        : SEVEN_DAYS_MS;

    // Verify session exists
    const session = await getSessionByIdAsync(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Session must be at least plan_ready to share
    const shareablePhases = [
      'plan_ready',
      'provider_review',
      'approved',
      'simulating',
      'simulation_ready',
      'presenting',
      'completed',
    ];
    if (!shareablePhases.includes(session.phase)) {
      return NextResponse.json(
        {
          success: false,
          error: `Session is in "${session.phase}" phase. A plan must be generated before sharing.`,
        },
        { status: 422 }
      );
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    const record: ShareTokenRecord = {
      token,
      sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store the token (in-memory + Airtable for persistence across cold starts)
    tokenCache.set(token, record);
    // Airtable write is non-blocking — cache ensures immediate availability
    saveTokenToAirtable(record).catch((err) => {
      console.error('[Share] Background token persist failed:', err);
    });

    // Build the patient-facing URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ranibeautyclinic.com';
    const shareUrl = `${siteUrl}/my-plan/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[Share] Token generation failed:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
