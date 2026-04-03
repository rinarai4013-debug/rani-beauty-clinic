/**
 * Airtable-Backed Session Store
 *
 * Persists MastermindSession objects to the Automation Log table
 * in Airtable. Uses in-memory cache for performance with
 * write-through to Airtable for persistence across Vercel
 * serverless invocations.
 *
 * Table: Automation Log
 * Fields used:
 *   - Workflow: "mastermind_session" (filter key)
 *   - Action: session ID (unique lookup key)
 *   - Status: phase
 *   - Details: full session JSON
 *   - Timestamp: updatedAt
 */

import type { MastermindSession, MastermindPhase } from '@/types/mastermind';

const AIRTABLE_BASE = 'app1SwhSfwe8GKUg4';
const TABLE_NAME = 'Automation%20Log';
const WORKFLOW_KEY = 'mastermind_session';

function getAirtablePat(): string | null {
  return process.env.AIRTABLE_PAT || null;
}

function airtableUrl(path?: string): string {
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE_NAME}`;
  return path ? `${base}/${path}` : base;
}

function headers(): Record<string, string> {
  const pat = getAirtablePat();
  if (!pat) throw new Error('AIRTABLE_PAT not configured');
  return {
    'Authorization': `Bearer ${pat}`,
    'Content-Type': 'application/json',
  };
}

// ── In-memory cache (fast reads within same invocation) ──

const cache = new Map<string, { session: MastermindSession; recordId: string }>();

// ── Save ──

export async function saveSessionToAirtable(session: MastermindSession): Promise<void> {
  const pat = getAirtablePat();
  if (!pat) {
    console.warn('[SessionStore] AIRTABLE_PAT not set — session not persisted');
    return;
  }

  const sessionJson = JSON.stringify(session);
  const cached = cache.get(session.id);

  try {
    if (cached?.recordId) {
      // Update existing record
      await fetch(airtableUrl(cached.recordId), {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          fields: {
            Status: session.phase,
            Details: sessionJson,
            Timestamp: session.updatedAt,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });
    } else {
      // Check if record exists (from a previous cold start)
      const existing = await findSessionRecord(session.id);
      if (existing) {
        // Update
        await fetch(airtableUrl(existing.recordId), {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({
            fields: {
              Status: session.phase,
              Details: sessionJson,
              Timestamp: session.updatedAt,
            },
          }),
          signal: AbortSignal.timeout(8000),
        });
        cache.set(session.id, { session, recordId: existing.recordId });
      } else {
        // Create new record
        const res = await fetch(airtableUrl(), {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            typecast: true,
            records: [{
              fields: {
                Workflow: WORKFLOW_KEY,
                Action: session.id,
                Status: session.phase,
                Details: sessionJson,
                Timestamp: session.updatedAt,
              },
            }],
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        const recordId = data?.records?.[0]?.id;
        if (recordId) {
          cache.set(session.id, { session, recordId });
        }
      }
    }
  } catch (err) {
    console.error('[SessionStore] Airtable save failed:', err);
    // Cache still has the session for this invocation
  }

  // Always update in-memory cache
  if (!cache.has(session.id)) {
    cache.set(session.id, { session, recordId: '' });
  } else {
    cache.get(session.id)!.session = session;
  }
}

// ── Get by ID ──

export async function getSessionFromAirtable(id: string): Promise<MastermindSession | null> {
  // Check cache first
  const cached = cache.get(id);
  if (cached) return cached.session;

  // Query Airtable
  const found = await findSessionRecord(id);
  if (found) {
    cache.set(id, { session: found.session, recordId: found.recordId });
    return found.session;
  }

  return null;
}

// ── Get all ──

export async function getAllSessionsFromAirtable(): Promise<MastermindSession[]> {
  const pat = getAirtablePat();
  if (!pat) return Array.from(cache.values()).map(c => c.session);

  try {
    const filter = encodeURIComponent(`{Workflow}='${WORKFLOW_KEY}'`);
    const res = await fetch(
      `${airtableUrl()}?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=50`,
      { headers: headers(), signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const sessions: MastermindSession[] = [];

    for (const record of data?.records || []) {
      try {
        const session = JSON.parse(record.fields?.Details || '{}') as MastermindSession;
        if (session.id) {
          sessions.push(session);
          cache.set(session.id, { session, recordId: record.id });
        }
      } catch { /* skip corrupt */ }
    }

    return sessions;
  } catch (err) {
    console.error('[SessionStore] Airtable list failed:', err);
    return Array.from(cache.values()).map(c => c.session);
  }
}

// ── Delete ──

export async function deleteSessionFromAirtable(id: string): Promise<void> {
  const cached = cache.get(id);
  cache.delete(id);

  if (cached?.recordId) {
    try {
      await fetch(airtableUrl(cached.recordId), {
        method: 'DELETE',
        headers: headers(),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* best effort */ }
  }
}

// ── Internal: find record by session ID ──

async function findSessionRecord(sessionId: string): Promise<{ session: MastermindSession; recordId: string } | null> {
  const pat = getAirtablePat();
  if (!pat) return null;

  try {
    const filter = encodeURIComponent(`AND({Workflow}='${WORKFLOW_KEY}',{Action}='${sessionId}')`);
    const res = await fetch(
      `${airtableUrl()}?filterByFormula=${filter}&maxRecords=1`,
      { headers: headers(), signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    const record = data?.records?.[0];

    if (record?.fields?.Details) {
      const session = JSON.parse(record.fields.Details) as MastermindSession;
      return { session, recordId: record.id };
    }
  } catch (err) {
    console.error('[SessionStore] Airtable find failed:', err);
  }

  return null;
}
