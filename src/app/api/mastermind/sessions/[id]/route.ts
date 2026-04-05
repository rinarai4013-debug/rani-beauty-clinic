/**
 * GET /api/mastermind/sessions/[id] — Get session by ID
 * PATCH /api/mastermind/sessions/[id] — Update session fields
 *
 * PATCH uses authenticated provider identity for review attribution.
 * Falls back to anonymous if auth is unavailable (dev/testing).
 */

import { NextRequest } from 'next/server';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { requireAuth, unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { MastermindSessionAction, PlanModification } from '@/types/mastermind';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check — allow unauthenticated in development
    const authSession = await requireAuth(_request).catch(() => null);
    if (!authSession && process.env.NODE_ENV !== 'development') {
      return unauthorized();
    }

    const { id } = await params;
    const session = await getSessionByIdAsync(id);

    if (!session) {
      return apiError('Session not found', 404);
    }

    return apiSuccess(session);
  } catch (error) {
    console.error('[Mastermind Session] GET error:', error);
    return apiError('Failed to fetch session');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check — allow unauthenticated in development
    const authSession = await requireAuth(request).catch(() => null);
    if (!authSession && process.env.NODE_ENV !== 'development') {
      return unauthorized();
    }

    const { id } = await params;
    const session = await getSessionByIdAsync(id);

    if (!session) {
      return apiError('Session not found', 404);
    }

    const parsed = await parseJsonBody(request);
    if ('error' in parsed) return parsed.error;
    const { body } = parsed;

    const action = body?.action as MastermindSessionAction | undefined;

    if (!action || typeof action !== 'object' || !('type' in action) || !action.type) {
      return apiError('Missing action with type', 400);
    }

    // Inject authenticated provider identity into review actions
    const enrichedAction = await enrichWithProviderIdentity(request, action);

    const updated = sessionReducer(session, enrichedAction);
    await saveSessionAsync(updated);

    return apiSuccess(updated);
  } catch (error) {
    console.error('[Mastermind Session] PATCH error:', error);
    return apiError('Failed to update session');
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
  // Enrich staff-trackable actions with actor identity
  const staffActions = [
    'SET_PROVIDER_REVIEW', 'ADD_MODIFICATION', 'SET_APPROVAL_STATUS',
    'SET_CLINIC_STATUS', 'SET_CLINIC_NOTES', 'SET_SHARE_TOKEN',
  ];
  if (!staffActions.includes(action.type)) {
    return action;
  }

  // Try to get authenticated session — non-blocking
  const authSession = await requireAuth(request).catch(() => null);

  if (!authSession) {
    // No auth available — return action as-is (dev/testing fallback)
    return action;
  }

  const providerId = authSession.username;
  const providerName = authSession.name;

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

  // Inject actor into staff-trackable actions for activity log attribution
  if (action.type === 'SET_CLINIC_STATUS') {
    return { ...action, actor: providerName };
  }
  if (action.type === 'SET_CLINIC_NOTES') {
    return { ...action, actor: providerName };
  }
  if (action.type === 'SET_SHARE_TOKEN') {
    return { ...action, actor: providerName };
  }

  // SET_APPROVAL_STATUS — no provider field to enrich, just return as-is
  return action;
}
