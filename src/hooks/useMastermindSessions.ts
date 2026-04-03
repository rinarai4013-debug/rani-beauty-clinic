'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import type { MastermindSession, MastermindSessionAction } from '@/types/mastermind';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data;
};

/** List all mastermind sessions */
export function useMastermindSessions() {
  const { data, error, isLoading, mutate } = useSWR<MastermindSession[]>(
    '/api/mastermind/sessions',
    fetcher,
    { refreshInterval: 30000, dedupingInterval: 10000 }
  );

  return {
    sessions: data || [],
    error,
    isLoading,
    mutate,
  };
}

/** Get a single session by ID */
export function useMastermindSession(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MastermindSession>(
    id ? `/api/mastermind/sessions/${id}` : null,
    fetcher,
    { refreshInterval: 15000, dedupingInterval: 5000 }
  );

  /** Dispatch an action to update the session */
  const dispatch = async (action: MastermindSessionAction) => {
    if (!id) return;

    // Optimistic update
    const optimistic = data ? applyOptimisticUpdate(data, action) : undefined;
    if (optimistic) {
      mutate(optimistic, false);
    }

    try {
      const res = await fetch(`/api/mastermind/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Update failed');
      const json = await res.json();
      mutate(json.data);
      // Also refresh the session list
      globalMutate('/api/mastermind/sessions');
    } catch {
      // Revert on error
      mutate();
    }
  };

  /** Validate the current plan */
  const validate = async () => {
    if (!id) return null;
    try {
      const res = await fetch(`/api/mastermind/sessions/${id}/validate`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  };

  return {
    session: data || null,
    error,
    isLoading,
    mutate,
    dispatch,
    validate,
    // Partial data helpers
    hasScan: !!data?.auraScanResult,
    hasPlan: !!data?.mastermindPlan,
    hasReview: !!data?.providerReview,
    hasSimulation: !!data?.simulationComparison,
  };
}

/** Apply optimistic updates for responsive UI */
function applyOptimisticUpdate(
  session: MastermindSession,
  action: MastermindSessionAction
): MastermindSession | undefined {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...session, phase: action.phase, updatedAt: new Date().toISOString() };
    case 'SET_APPROVAL_STATUS':
      return session.providerReview
        ? {
            ...session,
            providerReview: { ...session.providerReview, approvalStatus: action.status },
            phase: action.status === 'approved' ? 'approved' : session.phase,
            updatedAt: new Date().toISOString(),
          }
        : undefined;
    case 'SELECT_PACKAGE':
      return { ...session, selectedPackageTier: action.tier, updatedAt: new Date().toISOString() };
    case 'SET_SOURCE_PHOTO':
      return { ...session, sourcePhotoUrl: action.url, updatedAt: new Date().toISOString() };
    default:
      return undefined;
  }
}
