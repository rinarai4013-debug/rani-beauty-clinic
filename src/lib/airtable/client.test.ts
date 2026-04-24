// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Airtable SDK before importing the client
vi.mock('airtable', () => {
  const mockTable = {
    select: vi.fn().mockReturnValue({
      firstPage: vi.fn().mockResolvedValue([]),
      eachPage: vi.fn((_pageFn: unknown, doneFn: (_err?: Error) => void) => doneFn()),
    }),
    create: vi.fn().mockResolvedValue({ id: 'recNew123' }),
    update: vi.fn().mockResolvedValue({}),
  };
  const mockBase = vi.fn(() => mockTable);
  return {
    default: vi.fn().mockImplementation(() => ({
      base: vi.fn(() => mockBase),
    })),
  };
});

// Set env vars before importing client
vi.hoisted(() => {
  process.env.AIRTABLE_PAT = 'test-pat';
  process.env.AIRTABLE_BASE_ID = 'appTEST123';
});

import { rateLimitedQuery } from './client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('rateLimitedQuery', () => {
  it('resolves with the function return value', async () => {
    const result = await rateLimitedQuery(() => Promise.resolve('hello'));
    expect(result).toBe('hello');
  });

  it('rejects when the wrapped function throws', async () => {
    await expect(
      rateLimitedQuery(() => Promise.reject(new Error('Airtable error')))
    ).rejects.toThrow('Airtable error');
  });

  it('processes multiple queued requests in order', async () => {
    const order: number[] = [];
    const p1 = rateLimitedQuery(async () => { order.push(1); return 1; });
    const p2 = rateLimitedQuery(async () => { order.push(2); return 2; });
    const p3 = rateLimitedQuery(async () => { order.push(3); return 3; });

    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('retries on 429 rate limit errors', async () => {
    let attempt = 0;
    const result = await rateLimitedQuery(async () => {
      attempt++;
      if (attempt === 1) {
        const err = new Error('Rate limited') as Error & { statusCode: number };
        err.statusCode = 429;
        throw err;
      }
      return 'success after retry';
    });
    expect(result).toBe('success after retry');
    expect(attempt).toBe(2);
  });

  it('retries on 5xx server errors', async () => {
    let attempt = 0;
    const result = await rateLimitedQuery(async () => {
      attempt++;
      if (attempt === 1) {
        const err = new Error('Server error') as Error & { statusCode: number };
        err.statusCode = 500;
        throw err;
      }
      return 'recovered';
    });
    expect(result).toBe('recovered');
    expect(attempt).toBe(2);
  });

  it('propagates non-retryable errors immediately', async () => {
    await expect(
      rateLimitedQuery(async () => {
        const err = new Error('Not found') as Error & { statusCode: number };
        err.statusCode = 404;
        throw err;
      })
    ).rejects.toThrow('Not found');
  });
});
