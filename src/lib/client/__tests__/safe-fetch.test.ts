// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { safeFetchJson, waitForSession } from '../safe-fetch';

describe('safeFetchJson', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('parses a 200 JSON body', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: { sessionId: 'ms_abc' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    const res = await safeFetchJson<{ success: boolean; data: { sessionId: string } }>('/api/x');
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data?.data.sessionId).toBe('ms_abc');
    expect(res.error).toBeNull();
  });

  it('surfaces a human-readable error for HTML 413 Request Entity Too Large', async () => {
    global.fetch = vi.fn(async () =>
      new Response('Request Entity Too Large', {
        status: 413,
        headers: { 'Content-Type': 'text/html' },
      }),
    ) as unknown as typeof fetch;

    const res = await safeFetchJson('/api/consultation/submit', { method: 'POST' });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(413);
    expect(res.data).toBeNull();
    expect(res.error).toMatch(/too large/i);
    // crucially: no "Unexpected token 'R'" thrown
  });

  it('surfaces a human-readable error for HTML 500 Internal Server Error', async () => {
    global.fetch = vi.fn(async () =>
      new Response('<html><body>Internal Server Error</body></html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }),
    ) as unknown as typeof fetch;

    const res = await safeFetchJson('/api/x');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
    expect(res.error).toBeTruthy();
    expect(res.error).not.toMatch(/Unexpected token/i);
  });

  it('prefers server-provided error field on a 4xx JSON body', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: 'Missing form data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    const res = await safeFetchJson('/api/consultation/submit', { method: 'POST' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Missing form data');
  });

  it('maps AbortError to a cancelled message', async () => {
    global.fetch = vi.fn(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }) as unknown as typeof fetch;

    const res = await safeFetchJson('/api/x');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/cancelled/i);
  });
});

describe('waitForSession', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns true once the session becomes available after a transient 404', async () => {
    let call = 0;
    global.fetch = vi.fn(async () => {
      call += 1;
      if (call < 3) {
        return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: { id: 'ms_xyz' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const ok = await waitForSession('ms_xyz', {
      maxAttempts: 6,
      baseDelayMs: 10,
      maxDelayMs: 20,
    });
    expect(ok).toBe(true);
    expect(call).toBeGreaterThanOrEqual(3);
  });

  it('returns false when the session never appears within the budget', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    const ok = await waitForSession('ms_never', {
      maxAttempts: 3,
      baseDelayMs: 5,
      maxDelayMs: 10,
    });
    expect(ok).toBe(false);
  });
});
