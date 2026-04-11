// @vitest-environment node
/**
 * Tier 1 validation helper tests (2026-04-11).
 *
 * These cover the happy path + the three failure modes we need
 * uniform handling for across every mutation route:
 *   - malformed JSON → 400
 *   - schema mismatch → 422 with details
 *   - passthrough of parsed data with correct type
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import {
  parseJsonWithSchema,
  parseTextWithSchema,
} from '../parse-body';

const Schema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
});

function makeRequest(body: string | object | null, contentType = 'application/json') {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: typeof body === 'string' ? body : body === null ? 'null' : JSON.stringify(body),
  };
  return new NextRequest('http://localhost/api/test', init);
}

describe('parseJsonWithSchema', () => {
  it('returns ok with typed data on valid body', async () => {
    const result = await parseJsonWithSchema(
      makeRequest({ name: 'Rina', age: 40 }),
      Schema,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Rina');
      expect(result.data.age).toBe(40);
    }
  });

  it('returns 400 on malformed JSON', async () => {
    const result = await parseJsonWithSchema(
      makeRequest('{not json'),
      Schema,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe('Malformed JSON body');
      expect(body.details).toBeUndefined();
    }
  });

  it('returns 422 with details on schema mismatch', async () => {
    const result = await parseJsonWithSchema(
      makeRequest({ name: '', age: -1 }),
      Schema,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(422);
      const body = await result.response.json();
      expect(body.error).toBe('Invalid request body');
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns 422 when body is null', async () => {
    const result = await parseJsonWithSchema(makeRequest(null), Schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(422);
    }
  });

  it('returns 422 when required fields are missing', async () => {
    const result = await parseJsonWithSchema(
      makeRequest({ name: 'Rina' }),
      Schema,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(422);
      const body = await result.response.json();
      expect(body.details.some((i: { path: string[] }) => i.path.includes('age'))).toBe(true);
    }
  });
});

describe('parseTextWithSchema (HMAC-preserving path)', () => {
  it('returns ok with typed data on valid body', () => {
    const raw = JSON.stringify({ name: 'Rina', age: 40 });
    const result = parseTextWithSchema(raw, Schema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Rina');
      expect(result.data.age).toBe(40);
    }
  });

  it('returns 400 on malformed JSON text', () => {
    const result = parseTextWithSchema('{not json', Schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });

  it('returns 422 on schema mismatch', () => {
    const raw = JSON.stringify({ name: '', age: 'forty' });
    const result = parseTextWithSchema(raw, Schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(422);
    }
  });

  it('is synchronous (no promise)', () => {
    // Regression guard — webhook handlers rely on this being sync
    // so they can compose it inline after the HMAC check.
    const raw = JSON.stringify({ name: 'Rina', age: 40 });
    const result = parseTextWithSchema(raw, Schema);
    expect(result).not.toBeInstanceOf(Promise);
  });
});
