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
  request: NextRequest,
  options?: {
    maxBytes?: number;
  }
): Promise<{ body: Record<string, unknown> } | { error: NextResponse }> {
  const maxBytes = options?.maxBytes ?? 4 * 1024 * 1024;
  const rawLength = request.headers.get('content-length');
  const contentLength = rawLength ? Number(rawLength) : NaN;

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: `Payload too large. Maximum ${Math.round(maxBytes / (1024 * 1024))}MB JSON body.`,
        },
        { status: 413 },
      ),
    };
  }

  try {
    const body = await request.json();
    return { body };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const likelyTooLarge =
      message.includes('too large') ||
      message.includes('body exceeded') ||
      message.includes('size limit');
    const likelyTimeout =
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('aborted');

    if (likelyTooLarge) {
      return {
        error: NextResponse.json(
          {
            success: false,
            error: `Payload too large. Maximum ${Math.round(maxBytes / (1024 * 1024))}MB JSON body.`,
          },
          { status: 413 },
        ),
      };
    }

    if (likelyTimeout) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Request timed out while parsing JSON body' },
          { status: 408 },
        ),
      };
    }

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
