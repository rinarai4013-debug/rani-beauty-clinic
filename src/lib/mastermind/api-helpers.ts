/**
 * Shared API helpers for Mastermind route handlers.
 *
 * Extracts the repeated JSON-parsing + error-response patterns
 * used across all mastermind routes into a single utility.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Safely parse a JSON request body. Returns the parsed body
 * or a pre-built 400 error response.
 */
export async function parseJsonBody(
  request: NextRequest
): Promise<{ body: Record<string, unknown> } | { error: NextResponse }> {
  try {
    const body = await request.json();
    return { body };
  } catch {
    return {
      error: NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}

/** Standard error response for mastermind routes */
export function apiError(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Standard success response for mastermind routes */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}
