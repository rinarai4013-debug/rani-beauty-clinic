import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import { parseJsonBody } from '@/lib/mastermind/api-helpers';

function mockRequest(params: {
  contentLength?: string;
  jsonImpl: () => Promise<unknown>;
}): NextRequest {
  return {
    headers: new Headers(params.contentLength ? { 'content-length': params.contentLength } : undefined),
    json: params.jsonImpl,
  } as unknown as NextRequest;
}

describe('parseJsonBody', () => {
  it('returns parsed body for valid JSON', async () => {
    const req = mockRequest({
      contentLength: '24',
      jsonImpl: async () => ({ sessionId: 'sess_123' }),
    });

    const parsed = await parseJsonBody(req);
    expect('body' in parsed).toBe(true);
    if ('body' in parsed) {
      expect(parsed.body.sessionId).toBe('sess_123');
    }
  });

  it('returns 413 when content-length exceeds maxBytes', async () => {
    const req = mockRequest({
      contentLength: String(5 * 1024 * 1024),
      jsonImpl: async () => ({ ignored: true }),
    });

    const parsed = await parseJsonBody(req, { maxBytes: 4 * 1024 * 1024 });
    expect('error' in parsed).toBe(true);
    if ('error' in parsed) {
      expect(parsed.error.status).toBe(413);
    }
  });

  it('returns 400 when json parsing fails', async () => {
    const req = mockRequest({
      contentLength: '100',
      jsonImpl: async () => {
        throw new Error('Unexpected token in JSON');
      },
    });

    const parsed = await parseJsonBody(req);
    expect('error' in parsed).toBe(true);
    if ('error' in parsed) {
      expect(parsed.error.status).toBe(400);
    }
  });

  it('returns 408 on timeout-like parse errors', async () => {
    const req = mockRequest({
      contentLength: '100',
      jsonImpl: async () => {
        throw new Error('request timed out while reading body');
      },
    });

    const parsed = await parseJsonBody(req);
    expect('error' in parsed).toBe(true);
    if ('error' in parsed) {
      expect(parsed.error.status).toBe(408);
    }
  });
});
