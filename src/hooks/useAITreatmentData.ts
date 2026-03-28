'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { ClientProfile, TreatmentProtocol } from '@/types/ai-treatment';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

// ── AI Advisor Hook (POST-based, manual trigger) ──

interface AdvisorResult {
  treatmentPlan: import('@/types/ai-treatment').TreatmentPlan;
  skinAnalysis: import('@/types/ai-treatment').SkinAnalysis;
  outcomePrediction: import('@/types/ai-treatment').OutcomePrediction;
  copilot: import('@/types/ai-treatment').ConsultationCopilotResult;
}

export function useAIAdvisor() {
  const [data, setData] = useState<AdvisorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (profile: ClientProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, generate };
}

// ── Protocols List Hook ──

export function useProtocols(category?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const url = `/api/ai/protocols${params.toString() ? `?${params}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 min
  });

  return {
    data: data?.data as { protocols: TreatmentProtocol[]; categories: Array<{ category: string; count: number; label: string }> } | undefined,
    isLoading,
    error,
    mutate,
  };
}

// ── Single Protocol Hook ──

export function useProtocol(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/ai/protocols?id=${id}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  return {
    data: data?.data as TreatmentProtocol | undefined,
    isLoading,
    error,
  };
}

// ── Quiz Results Hook (POST-based) ──

export function useQuizResults() {
  const [data, setData] = useState<{
    skinAnalysis: import('@/types/ai-treatment').SkinAnalysis;
    treatmentPlan: import('@/types/ai-treatment').TreatmentPlan;
    outcomePrediction: import('@/types/ai-treatment').OutcomePrediction;
    shareableCard: import('@/types/ai-treatment').ShareableCard;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (answers: import('@/types/ai-treatment').QuizAnswers) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, submit };
}

// ── Outcome Prediction Hook ──

export function useOutcomePrediction() {
  const [data, setData] = useState<import('@/types/ai-treatment').OutcomePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const predict = useCallback(async (profile: ClientProfile, treatmentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, treatmentId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, predict };
}

// ── Skin Analysis Hook ──

export function useSkinAnalysis() {
  const [data, setData] = useState<import('@/types/ai-treatment').SkinAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyze = useCallback(async (
    assessmentInput: Parameters<typeof import('@/lib/ai/skin-analysis').performSkinAnalysis>[0],
    fitzpatrickInput: Parameters<typeof import('@/lib/ai/skin-analysis').performSkinAnalysis>[1],
    glogauInput: Parameters<typeof import('@/lib/ai/skin-analysis').performSkinAnalysis>[2],
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/skin-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentInput, fitzpatrickInput, glogauInput }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, analyze };
}
