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

/**
 * Typed error class for Airtable write failures.
 *
 * `kind: "limit"` — the workspace/base/table is over its record cap. This is
 * an OPERATOR problem (upgrade the plan) that callers must surface to the
 * user rather than silently swallow. The session is still readable in memory
 * for this invocation but will NOT survive the next cold start.
 *
 * `kind: "timeout"` — Airtable did not respond in our 8s budget. Likely
 * transient; caller should still surface rather than false-success.
 *
 * `kind: "http"` — any other non-2xx response.
 *
 * `kind: "unknown"` — exceptions we could not classify.
 */
export type SessionStoreErrorKind = 'limit' | 'timeout' | 'http' | 'unknown';

export class SessionStoreError extends Error {
  readonly kind: SessionStoreErrorKind;
  readonly status?: number;
  readonly bodySnippet?: string;
  readonly airtableErrorType?: string;
  readonly operation: 'create' | 'update' | 'read' | 'delete';
  readonly sessionId: string;

  constructor(opts: {
    kind: SessionStoreErrorKind;
    operation: 'create' | 'update' | 'read' | 'delete';
    sessionId: string;
    status?: number;
    bodySnippet?: string;
    airtableErrorType?: string;
    message: string;
  }) {
    super(opts.message);
    this.name = 'SessionStoreError';
    this.kind = opts.kind;
    this.operation = opts.operation;
    this.sessionId = opts.sessionId;
    this.status = opts.status;
    this.bodySnippet = opts.bodySnippet;
    this.airtableErrorType = opts.airtableErrorType;
  }
}

const LIMIT_ERROR_TYPES = new Set([
  'LIMIT_CHECK_TOO_MANY_RECORDS_IN_TABLE',
  'TOO_MANY_RECORDS_IN_BASE',
  'INVALID_RECORDS_LIMIT_REACHED',
]);

/**
 * Classify an Airtable error response body into a typed kind.
 * Accepts both raw JSON string and parsed object.
 */
export function classifyAirtableError(body: unknown): {
  kind: SessionStoreErrorKind;
  airtableErrorType?: string;
} {
  let parsed: any = body;
  if (typeof body === 'string') {
    try { parsed = JSON.parse(body); } catch { /* keep as string */ }
  }
  const errorType =
    parsed && typeof parsed === 'object' && parsed.error && typeof parsed.error === 'object'
      ? (parsed.error.type as string | undefined)
      : parsed && typeof parsed === 'object' && typeof parsed.error === 'string'
        ? (parsed.error as string)
        : undefined;

  if (errorType && LIMIT_ERROR_TYPES.has(errorType)) return { kind: 'limit', airtableErrorType: errorType };
  if (errorType) return { kind: 'http', airtableErrorType: errorType };
  return { kind: 'http' };
}

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
  // Keep a placeholder so we know an image exists
  const stripped = { ...session };
  if (stripped.sourcePhotoUrl && stripped.sourcePhotoUrl.length > 5000) {
    stripped.sourcePhotoUrl = '[base64_stripped]';
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

  /**
   * Incident 2026-04-19 hardening: previously any non-2xx response here was
   * logged-and-swallowed, so the API route returned `{ success: true }` to
   * the client while the session never actually landed in Airtable. Now any
   * non-2xx (especially Airtable's `TOO_MANY_RECORDS_IN_BASE` 422) throws a
   * typed `SessionStoreError` so the caller can decide whether to surface.
   */
  let persistedError: SessionStoreError | null = null;
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
        const { kind, airtableErrorType } = classifyAirtableError(errBody);
        persistedError = new SessionStoreError({
          kind,
          operation: 'update',
          sessionId: session.id,
          status: res.status,
          bodySnippet: errBody.slice(0, 300),
          airtableErrorType,
          message: `[SessionStore] PATCH failed (${res.status}) ${airtableErrorType ?? ''}`.trim(),
        });
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
          const { kind, airtableErrorType } = classifyAirtableError(errBody);
          persistedError = new SessionStoreError({
            kind,
            operation: 'update',
            sessionId: session.id,
            status: res.status,
            bodySnippet: errBody.slice(0, 300),
            airtableErrorType,
            message: `[SessionStore] PATCH (found) failed (${res.status}) ${airtableErrorType ?? ''}`.trim(),
          });
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
          const { kind, airtableErrorType } = classifyAirtableError(errBody);
          persistedError = new SessionStoreError({
            kind,
            operation: 'create',
            sessionId: session.id,
            status: res.status,
            bodySnippet: errBody.slice(0, 300),
            airtableErrorType,
            message: `[SessionStore] CREATE failed (${res.status}) ${airtableErrorType ?? ''}`.trim(),
          });
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
    // AbortSignal.timeout throws a DOMException with name "TimeoutError".
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      persistedError = new SessionStoreError({
        kind: 'timeout',
        operation: cached?.recordId ? 'update' : 'create',
        sessionId: session.id,
        message: '[SessionStore] Airtable save timed out after 8s',
      });
    } else {
      persistedError = new SessionStoreError({
        kind: 'unknown',
        operation: cached?.recordId ? 'update' : 'create',
        sessionId: session.id,
        message: `[SessionStore] Airtable save failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Always update in-memory cache — the session is still usable for this
  // invocation even if Airtable persistence failed. This preserves the old
  // behavior that callers who swallow the error still observe.
  if (!cache.has(session.id)) {
    cache.set(session.id, { session, recordId: '' });
  } else {
    cache.get(session.id)!.session = session;
  }

  if (persistedError) {
    // Structured log for ops — easy to grep and alert on.
    console.error(
      JSON.stringify({
        event: 'session_store.save_failed',
        kind: persistedError.kind,
        operation: persistedError.operation,
        sessionId: persistedError.sessionId,
        status: persistedError.status,
        airtableErrorType: persistedError.airtableErrorType,
        bodySnippet: persistedError.bodySnippet,
      }),
    );
    throw persistedError;
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
    console.log(`[SessionStore] Loaded ${data?.records?.length || 0} sessions from Airtable`);
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
      return { session, recordId: record.id };
    }
  } catch (err) {
    console.error('[SessionStore] Airtable find failed:', err);
  }

  return null;
}
