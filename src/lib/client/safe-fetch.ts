/**
 * Client-side safe fetch helpers.
 *
 * Hardens the intake/scan/plan/simulate paths against the P0 failure class
 * where upstream proxies (Vercel edge, Next runtime, CDN) return HTML for
 * 413 "Request Entity Too Large", 500 "Internal Server Error", and 502/504
 * gateway errors. A blind `response.json()` on those bodies throws
 * "Unexpected token 'R'..." / "Unexpected token 'I'...".
 *
 * safeFetchJson: always reads text first, then JSON-parses defensively, and
 * normalizes the error message so callers can surface a human-readable line
 * without having to retrofit every call site.
 *
 * waitForSession: polls a readiness endpoint with bounded
 * exponential backoff + jitter to close the submit-to-followup race where
 * the session was just persisted but the next serverless invocation hasn't
 * read it yet (Airtable replication lag, cross-Lambda cache miss).
 */

export interface SafeFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  raw: string;
}

const NON_JSON_STATUS_HINTS: Record<number, string> = {
  413: 'Upload is too large. Reduce file sizes and try again.',
  502: 'Upstream service unavailable. Please retry.',
  503: 'Service temporarily unavailable. Please retry.',
  504: 'Request timed out. Please retry.',
};

function normalizeBody(raw: string): string {
  // Typical HTML error bodies start with "Request En..." / "Internal S..."
  // — truncate any HTML so users don't see raw markup.
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('<')) {
    const textOnly = trimmed.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return textOnly.slice(0, 200);
  }
  return trimmed.slice(0, 500);
}

export async function safeFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<SafeFetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error:
        err instanceof Error && err.name === 'AbortError'
          ? 'Request was cancelled.'
          : 'Network error. Check your connection and retry.',
      raw: '',
    };
  }

  const text = await response.text().catch(() => '');

  let parsed: T | null = null;
  let parseError: string | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as T;
    } catch {
      parseError = normalizeBody(text);
    }
  }

  if (!response.ok) {
    const hint = NON_JSON_STATUS_HINTS[response.status];
    const serverError =
      parsed && typeof parsed === 'object' && parsed && 'error' in parsed
        ? String((parsed as { error?: unknown }).error || '')
        : '';
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error:
        serverError ||
        hint ||
        (parseError
          ? `Server returned a non-JSON response (HTTP ${response.status}).`
          : `Request failed (HTTP ${response.status}).`),
      raw: text,
    };
  }

  if (parseError) {
    // 200-level but non-JSON body — treat as failure
    return {
      ok: false,
      status: response.status,
      data: null,
      error: 'Received a non-JSON response from the server.',
      raw: text,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null,
    raw: text,
  };
}

export interface WaitForSessionOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
}

/**
 * Poll GET /api/mastermind/sessions/[id] until it returns success, or
 * bail out after maxAttempts. Uses exponential backoff with jitter so
 * bursts of callers don't stampede Airtable.
 *
 * Returns true if the session was found within the budget, false otherwise.
 */
export async function waitForSession(
  sessionId: string,
  opts: WaitForSessionOptions = {},
): Promise<boolean> {
  const maxAttempts = opts.maxAttempts ?? 8;
  const baseDelayMs = opts.baseDelayMs ?? 250;
  const maxDelayMs = opts.maxDelayMs ?? 2_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (opts.signal?.aborted) return false;

    const result = await safeFetchJson<{ success: boolean; data?: unknown }>(
      `/api/mastermind/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: opts.signal,
        cache: 'no-store',
      },
    );

    if (result.ok && result.data && (result.data as { success?: boolean }).success) {
      return true;
    }

    // 404 while pending is expected; anything else still worth retrying
    // once to absorb transient proxy blips.
    if (attempt === maxAttempts - 1) break;

    const expo = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    const jitter = Math.random() * 0.35 * expo;
    await new Promise((r) => setTimeout(r, expo + jitter));
  }

  return false;
}
