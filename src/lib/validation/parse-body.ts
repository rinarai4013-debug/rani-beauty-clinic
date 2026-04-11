/**
 * Shared request-body validation helpers for API route handlers.
 *
 * Tier 1 zod validation pass (2026-04-11) — every mutation handler
 * that accepts a JSON body should funnel through `parseJsonWithSchema`
 * (for handlers that can call `request.json()`) or `parseTextWithSchema`
 * (for webhook handlers that need the raw body to verify an HMAC
 * signature before parsing).
 *
 * The goal is uniform 422 responses on malformed payloads, with
 * `parsed.error.issues` echoed back so callers can self-correct in
 * dev without us having to trawl structured logs.
 *
 * Usage:
 *
 *   const parsed = await parseJsonWithSchema(request, MySchema);
 *   if (!parsed.ok) return parsed.response;
 *   const body = parsed.data; // typed as z.infer<typeof MySchema>
 *
 * For webhook routes:
 *
 *   const rawBody = await request.text();
 *   // ... verify HMAC using rawBody ...
 *   const parsed = parseTextWithSchema(rawBody, MySchema);
 *   if (!parsed.ok) return parsed.response;
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ZodSchema, ZodIssue } from 'zod';

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

interface ErrorResponseBody {
  error: string;
  details?: ZodIssue[];
}

function errorResponse(
  message: string,
  status: number,
  details?: ZodIssue[],
): NextResponse {
  const body: ErrorResponseBody = { error: message };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

/**
 * Parse a JSON request body and validate it against a zod schema.
 *
 * Returns either `{ ok: true, data }` with fully typed, parsed data,
 * or `{ ok: false, response }` with a pre-built NextResponse that
 * the caller should return directly.
 *
 * - Malformed JSON → 400
 * - Schema mismatch → 422 with `details: parsed.error.issues`
 */
export async function parseJsonWithSchema<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: errorResponse('Malformed JSON body', 400),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse(
        'Invalid request body',
        422,
        parsed.error.issues,
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Parse a text body that has already been read from the request
 * (typically because the caller needed to verify an HMAC signature
 * against the raw bytes first) and validate it against a zod schema.
 *
 * Same error surface as `parseJsonWithSchema`.
 */
export function parseTextWithSchema<T>(
  rawBody: string,
  schema: ZodSchema<T>,
): ParseResult<T> {
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      response: errorResponse('Malformed JSON body', 400),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse(
        'Invalid request body',
        422,
        parsed.error.issues,
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
