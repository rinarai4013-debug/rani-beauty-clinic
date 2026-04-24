/**
 * Shared test utilities for API route integration tests.
 *
 * Provides mock factories for sessions, Airtable records, request builders,
 * and common assertion helpers used across all test suites.
 */

import { vi } from 'vitest';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'ceo' | 'frontdesk' | 'provider' | 'marketing' | 'operations';

export interface MockSession {
  username: string;
  role: UserRole;
  displayName: string;
}

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  fields: T;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Default authenticated CEO session */
export const CEO_SESSION: MockSession = {
  username: 'rina',
  role: 'ceo',
  displayName: 'Rina',
};

export const FRONTDESK_SESSION: MockSession = {
  username: 'front',
  role: 'frontdesk',
  displayName: 'Front Desk',
};

export const PROVIDER_SESSION: MockSession = {
  username: 'mom',
  role: 'provider',
  displayName: 'Mom',
};

export const MARKETING_SESSION: MockSession = {
  username: 'mkt',
  role: 'marketing',
  displayName: 'Marketing',
};

export const OPERATIONS_SESSION: MockSession = {
  username: 'ops',
  role: 'operations',
  displayName: 'Operations',
};

/**
 * Installs a mock for `@/lib/auth/session` that returns the given session
 * from `getSession()`. Pass `null` for unauthenticated.
 */
export function mockGetSession(session: MockSession | null) {
  vi.doMock('@/lib/auth/session', () => ({
    getSession: vi.fn().mockResolvedValue(session),
    createSession: vi.fn().mockResolvedValue('mock-jwt-token'),
    verifySession: vi.fn().mockResolvedValue(session),
    getSessionCookieConfig: vi.fn().mockReturnValue({
      name: 'rani-session',
      value: 'mock-jwt-token',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400,
    }),
    COOKIE_NAME: 'rani-session',
  }));
}

// ---------------------------------------------------------------------------
// Airtable mock helpers
// ---------------------------------------------------------------------------

/** Build a minimal Airtable-style record */
export function airtableRecord<T extends Record<string, unknown>>(
  id: string,
  fields: T,
): AirtableRecord<T> {
  return { id, fields };
}

/** Convenience - generate N records with sequential IDs */
export function airtableRecords<T extends Record<string, unknown>>(
  prefix: string,
  fieldsArray: T[],
): AirtableRecord<T>[] {
  return fieldsArray.map((fields, i) =>
    airtableRecord(`${prefix}_${String(i + 1).padStart(3, '0')}`, fields),
  );
}

/**
 * Returns a mock for `@/lib/airtable/client` with configurable `fetchAll`,
 * `fetchFirst`, `createRecord`, and `rateLimitedQuery` implementations.
 */
export function createAirtableMock(overrides: {
  fetchAll?: (..._args: unknown[]) => Promise<AirtableRecord[]>;
  fetchFirst?: (..._args: unknown[]) => Promise<AirtableRecord[]>;
  createRecord?: (..._args: unknown[]) => Promise<string>;
  rateLimitedQuery?: <T>(fn: () => Promise<T>) => Promise<T>;
} = {}) {
  const mockTable = () => ({
    find: vi.fn(),
    select: vi.fn().mockReturnValue({
      firstPage: vi.fn(),
      all: vi.fn(),
    }),
    create: vi.fn(),
    update: vi.fn(),
  });

  return {
    Tables: {
      appointments: mockTable,
      transactions: mockTable,
      clients: mockTable,
      memberships: mockTable,
      messagesLog: mockTable,
      reviews: mockTable,
      kpis: mockTable,
      alerts: mockTable,
      intakes: mockTable,
      intakeIntelligence: mockTable,
      competitorIntel: mockTable,
      packages: mockTable,
    },
    fetchAll: overrides.fetchAll ?? vi.fn().mockResolvedValue([]),
    fetchFirst: overrides.fetchFirst ?? vi.fn().mockResolvedValue([]),
    createRecord: overrides.createRecord ?? vi.fn().mockResolvedValue('rec_new_001'),
    rateLimitedQuery: overrides.rateLimitedQuery ?? vi.fn().mockImplementation(<T>(fn: () => Promise<T>) => fn()),
  };
}

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------

/**
 * Builds a minimal object that satisfies what Next.js route handlers expect.
 * Using plain objects + `new URL` since we cannot instantiate real NextRequest
 * in vitest without the full Next.js runtime.
 */
export function buildRequest(
  method: string,
  url: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    ip?: string;
  } = {},
): Request {
  const { body, headers = {}, ip } = options;
  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...(ip ? { 'x-forwarded-for': ip } : {}),
      ...headers,
    },
  };

  if (body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

export function buildGetRequest(
  path: string,
  params?: Record<string, string>,
): Request {
  const url = new URL(path, 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return buildRequest('GET', url.toString());
}

export function buildPostRequest(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return buildRequest('POST', `http://localhost:3000${path}`, { body, headers });
}

// ---------------------------------------------------------------------------
// Response assertion helpers
// ---------------------------------------------------------------------------

export async function expectJsonStatus(response: Response, status: number) {
  expect(response.status).toBe(status);
  return response.json();
}

export async function expectSuccess(response: Response) {
  const data = await expectJsonStatus(response, 200);
  return data;
}

export async function expectUnauthorized(response: Response) {
  const data = await expectJsonStatus(response, 401);
  expect(data.error).toBeDefined();
  return data;
}

export async function expectForbidden(response: Response) {
  const data = await expectJsonStatus(response, 403);
  expect(data.error).toBeDefined();
  return data;
}

export async function expectBadRequest(response: Response) {
  const data = await expectJsonStatus(response, 400);
  expect(data.error).toBeDefined();
  return data;
}

export async function expectServerError(response: Response) {
  const data = await expectJsonStatus(response, 500);
  expect(data.error).toBeDefined();
  return data;
}

// ---------------------------------------------------------------------------
// Cache mock
// ---------------------------------------------------------------------------

export function createCacheMock() {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn((key: string) => store.get(key) ?? null),
    set: vi.fn((key: string, value: unknown) => { store.set(key, value); }),
    invalidate: vi.fn((key: string) => { store.delete(key); }),
    invalidatePrefix: vi.fn((prefix: string) => {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    }),
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/** Generate an ISO date string for N days ago */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Today as ISO date string */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Generate a valid HMAC-SHA256 hex signature for webhook testing */
export async function hmacSha256(secret: string, body: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// ---------------------------------------------------------------------------
// Common mock setup for Sentry, logging, etc.
// ---------------------------------------------------------------------------

export function mockCommonDeps() {
  vi.doMock('@sentry/nextjs', () => ({
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  }));

  vi.doMock('@/lib/logging/structured-logger', () => ({
    logEvent: vi.fn(),
    logAuthFailure: vi.fn(),
    logWebhookEvent: vi.fn(),
  }));

  vi.doMock('@/lib/sentry-utils', () => ({
    captureAuthEvent: vi.fn(),
    captureWebhookEvent: vi.fn(),
    captureCheckoutEvent: vi.fn(),
    captureAgentExecution: vi.fn(),
    withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
  }));
}

/** Mock the rate-limit module to always allow */
export function mockRateLimitAllow() {
  vi.doMock('@/lib/rate-limit', () => ({
    rateLimit: vi.fn().mockReturnValue({ allowed: true, resetIn: 0 }),
    getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
    rateLimitResponse: vi.fn(),
    RATE_LIMITS: {
      WEBHOOK: { maxRequests: 100, windowMs: 60000 },
      API: { maxRequests: 60, windowMs: 60000 },
    },
  }));
}

/** Mock the env/feature flags module */
export function mockEnv(overrides: Record<string, string | boolean> = {}) {
  vi.doMock('@/lib/env', () => ({
    env: {
      STRIPE_SECRET_KEY: 'sk_test_fake',
      CHERRY_WEBHOOK_SECRET: 'cherry_secret_123',
      N8N_WEBHOOK_URL: 'https://n8n.example.com',
      ...overrides,
    },
    hasFeature: {
      n8n: vi.fn().mockReturnValue(false),
      stripe: vi.fn().mockReturnValue(true),
    },
  }));
}
