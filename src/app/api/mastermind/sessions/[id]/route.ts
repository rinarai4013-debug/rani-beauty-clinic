/**
 * GET /api/mastermind/sessions/[id] — Get session by ID
 * PATCH /api/mastermind/sessions/[id] — Update session fields
 *
 * PATCH uses authenticated provider identity for review attribution.
 * Falls back to anonymous if auth is unavailable (dev/testing).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, saveSession, sessionReducer } from '@/lib/mastermind/session';
import { requireAuth } from '@/lib/auth/middleware';
import type { MastermindSessionAction, PlanModification } from '@/types/mastermind';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionById(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('[Mastermind Session] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionById(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const action = body?.action as MastermindSessionAction | undefined;

    if (!action || typeof action !== 'object' || !('type' in action) || !action.type) {
      return NextResponse.json(
        { success: false, error: 'Missing action with type' },
        { status: 400 }
      );
    }

    // Inject authenticated provider identity into review actions
    const enrichedAction = await enrichWithProviderIdentity(request, action);

    const updated = sessionReducer(session, enrichedAction);
    saveSession(updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Mastermind Session] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

/**
 * Enriches review-related actions with real provider identity
 * when authenticated. Falls back safely when auth is unavailable.
 */
async function enrichWithProviderIdentity(
  request: NextRequest,
  action: MastermindSessionAction
): Promise<MastermindSessionAction> {
  // Only enrich actions that carry provider identity
  if (
    action.type !== 'SET_PROVIDER_REVIEW' &&
    action.type !== 'ADD_MODIFICATION' &&
    action.type !== 'SET_APPROVAL_STATUS'
  ) {
    return action;
  }

  // Try to get authenticated session — non-blocking
  const authSession = await requireAuth(request).catch(() => null);

  if (!authSession) {
    // No auth available — return action as-is (dev/testing fallback)
    return action;
  }

  const providerId = authSession.username;
  const providerName = authSession.displayName;

  if (action.type === 'SET_PROVIDER_REVIEW') {
    return {
      ...action,
      review: {
        ...action.review,
        providerId,
        providerName,
      },
    };
  }

  if (action.type === 'ADD_MODIFICATION') {
    return {
      ...action,
      modification: {
        ...action.modification,
        providerId,
      },
    };
  }

  // SET_APPROVAL_STATUS — no provider field to enrich, just return as-is
  return action;
}
