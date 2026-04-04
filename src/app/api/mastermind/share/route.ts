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

// ── In-memory token store with automatic cleanup ──
// In production this would be Airtable-backed; the Map provides fast
// lookups within a single Vercel instance and survives for the lifetime
// of the serverless function cold-start window.

export interface ShareTokenRecord {
  token: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
}

const tokenStore = new Map<string, ShareTokenRecord>();

// Periodic cleanup of expired tokens (runs at most once per minute)
let lastCleanup = 0;
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  const nowISO = new Date().toISOString();
  for (const [key, record] of tokenStore) {
    if (record.expiresAt < nowISO) {
      tokenStore.delete(key);
    }
  }
}

/** Resolve a token to its record (exported for sibling routes). */
export function resolveToken(token: string): ShareTokenRecord | null {
  cleanupExpired();
  const record = tokenStore.get(token);
  if (!record) return null;
  if (new Date(record.expiresAt) < new Date()) {
    tokenStore.delete(token);
    return null;
  }
  return record;
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

    // Store the token
    tokenStore.set(token, record);

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
