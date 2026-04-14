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

import type { MastermindSession, MastermindPhase, SimulationFrame } from '@/types/mastermind';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

const AIRTABLE_BASE = 'app1SwhSfwe8GKUg4';
const TABLE_NAME = 'Automation%20Log';
const WORKFLOW_KEY = 'mastermind_session';
const PHOTO_WORKFLOW_PREFIX = 'mastermind_photo_';
const PHOTO_REF_PREFIX = 'airtable://photo/';
const PHOTO_INLINE_LIMIT = 5000;
const PHOTO_CHUNK_SIZE = 45000;
const MAX_PHOTO_CHUNKS = 250;

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

  // Strip large base64 data before persisting to Airtable (100KB field limit)
  const stripped = { ...session };
  if (
    stripped.sourcePhotoUrl &&
    stripped.sourcePhotoUrl.startsWith('data:image/') &&
    stripped.sourcePhotoUrl.length > PHOTO_INLINE_LIMIT
  ) {
    try {
      stripped.sourcePhotoUrl = await storeSourcePhotoInChunks(session.id, stripped.sourcePhotoUrl);
    } catch (error) {
      console.error('[SessionStore] Source photo chunk storage failed:', error);
      stripped.sourcePhotoUrl = '[base64_stripped]';
    }
  }
  if (stripped.simulationComparison) {
    stripped.simulationComparison = {
      ...stripped.simulationComparison,
      withTreatment: stripped.simulationComparison.withTreatment ? {
        ...stripped.simulationComparison.withTreatment,
        frames: stripped.simulationComparison.withTreatment.frames.map((f: SimulationFrame) => ({
          ...f,
          imageDataUrl: f.imageDataUrl && f.imageDataUrl.length > 5000 ? '[base64_stripped]' : f.imageDataUrl,
        })),
      } : stripped.simulationComparison.withTreatment,
      withoutTreatment: stripped.simulationComparison.withoutTreatment ? {
        ...stripped.simulationComparison.withoutTreatment,
        frames: stripped.simulationComparison.withoutTreatment.frames.map((f: SimulationFrame) => ({
          ...f,
          imageDataUrl: f.imageDataUrl && f.imageDataUrl.length > 5000 ? '[base64_stripped]' : f.imageDataUrl,
        })),
      } : stripped.simulationComparison.withoutTreatment,
    };
  }
  const sessionJson = JSON.stringify(stripped);
  const jsonSize = sessionJson.length;
  if (jsonSize > 90000) {
    console.warn(`[SessionStore] Session JSON is ${(jsonSize / 1024).toFixed(0)}KB — may exceed Airtable field limit`);
  }
  const cached = cache.get(session.id);

  try {
    if (cached?.recordId) {
      // Update existing record
      const res = await fetch(airtableUrl(cached.recordId), {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          typecast: true,
          fields: {
            Status: session.phase,
            Details: sessionJson,
            Timestamp: session.updatedAt,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`[SessionStore] PATCH failed (${res.status}):`, errBody);
      }
    } else {
      // Check if record exists (from a previous cold start)
      const existing = await findSessionRecord(session.id);
      if (existing) {
        // Update
        const res = await fetch(airtableUrl(existing.recordId), {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({
            typecast: true,
            fields: {
              Status: session.phase,
              Details: sessionJson,
              Timestamp: session.updatedAt,
            },
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.error(`[SessionStore] PATCH (found) failed (${res.status}):`, errBody);
        }
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
        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.error(`[SessionStore] CREATE failed (${res.status}):`, errBody);
        } else {
          const data = await res.json();
          const recordId = data?.records?.[0]?.id;
          if (recordId) {
            cache.set(session.id, { session, recordId });
          } else {
            console.warn('[SessionStore] CREATE succeeded but no recordId in response');
          }
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
      `${airtableUrl()}?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=100`,
      { headers: headers(), signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) {
      console.error(`[SessionStore] Airtable list HTTP ${res.status}`);
      return Array.from(cache.values()).map(c => c.session);
    }
    const data = await res.json();
    const sessions: MastermindSession[] = [];

    for (const record of data?.records || []) {
      try {
        const session = JSON.parse(record.fields?.Details || '{}') as MastermindSession;
        if (session.id) {
          await hydrateSourcePhoto(session);
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
    const safeSessionId = sanitizeFormulaValue(sessionId);
    const filter = encodeURIComponent(`AND({Workflow}='${WORKFLOW_KEY}',{Action}='${safeSessionId}')`);
    const res = await fetch(
      `${airtableUrl()}?filterByFormula=${filter}&maxRecords=1`,
      { headers: headers(), signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    const record = data?.records?.[0];

    if (record?.fields?.Details) {
      const session = JSON.parse(record.fields.Details) as MastermindSession;
      await hydrateSourcePhoto(session);
      return { session, recordId: record.id };
    }
  } catch (err) {
    console.error('[SessionStore] Airtable find failed:', err);
  }

  return null;
}

function chunkString(value: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < value.length; i += size) {
    out.push(value.slice(i, i + size));
  }
  return out;
}

function buildPhotoWorkflowKey(sessionId: string): string {
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nonce = Date.now().toString(36);
  return `${PHOTO_WORKFLOW_PREFIX}${safeSessionId}_${nonce}`;
}

function buildPhotoRef(workflowKey: string): string {
  return `${PHOTO_REF_PREFIX}${workflowKey}`;
}

function getWorkflowKeyFromRef(ref: string): string | null {
  if (!ref.startsWith(PHOTO_REF_PREFIX)) return null;
  const workflowKey = ref.slice(PHOTO_REF_PREFIX.length).trim();
  return workflowKey || null;
}

async function storeSourcePhotoInChunks(sessionId: string, dataUrl: string): Promise<string> {
  const chunks = chunkString(dataUrl, PHOTO_CHUNK_SIZE);
  if (chunks.length > MAX_PHOTO_CHUNKS) {
    throw new Error(`Source photo has too many chunks (${chunks.length})`);
  }

  const workflowKey = buildPhotoWorkflowKey(sessionId);
  const timestamp = new Date().toISOString();

  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10);
    const records = batch.map((chunk, batchIndex) => {
      const chunkIndex = i + batchIndex;
      return {
        fields: {
          Workflow: workflowKey,
          Action: `chunk_${String(chunkIndex).padStart(4, '0')}`,
          Status: 'scan_complete',
          Details: chunk,
          Timestamp: timestamp,
        },
      };
    });

    const res = await fetch(airtableUrl(), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ typecast: true, records }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Chunk write failed (${res.status}): ${errBody.slice(0, 200)}`);
    }
  }

  return buildPhotoRef(workflowKey);
}

async function loadSourcePhotoFromRef(ref: string): Promise<string | null> {
  const workflowKey = getWorkflowKeyFromRef(ref);
  if (!workflowKey) return null;

  try {
    const safeWorkflow = sanitizeFormulaValue(workflowKey);
    const filter = encodeURIComponent(`{Workflow}='${safeWorkflow}'`);
    const res = await fetch(
      `${airtableUrl()}?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=Action&sort%5B0%5D%5Bdirection%5D=asc&maxRecords=${MAX_PHOTO_CHUNKS}`,
      { headers: headers(), signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const chunks = (data?.records || [])
      .map((record: { fields?: { Details?: string } }) => record.fields?.Details || '')
      .filter((part: string) => part.length > 0);

    if (chunks.length === 0) return null;

    const combined = chunks.join('');
    if (!combined.startsWith('data:image/')) return null;
    return combined;
  } catch {
    return null;
  }
}

async function hydrateSourcePhoto(session: MastermindSession): Promise<void> {
  if (!session.sourcePhotoUrl || typeof session.sourcePhotoUrl !== 'string') return;

  if (session.sourcePhotoUrl.startsWith(PHOTO_REF_PREFIX)) {
    const hydrated = await loadSourcePhotoFromRef(session.sourcePhotoUrl);
    if (hydrated) {
      session.sourcePhotoUrl = hydrated;
      return;
    }

    // Keep signal explicit for callers that want to report a user-facing error.
    session.sourcePhotoUrl = '[photo_ref_unavailable]';
    return;
  }

  if (session.sourcePhotoUrl === '[base64_stripped]') {
    session.sourcePhotoUrl = '[photo_ref_unavailable]';
  }
}
