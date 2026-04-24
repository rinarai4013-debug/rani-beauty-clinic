'use client';

/**
 * useMastermindFlow — Centralized presentation flow hook
 *
 * Reads from MastermindSession via useMastermindSession and
 * exposes derived selectors + action dispatchers for the
 * presentation phase. Components never compute their own
 * view models — they read from this hook.
 */

import { useCallback, useMemo, useState } from 'react';
import { useMastermindSession } from '@/hooks/useMastermindSessions';
import {
  isReadyForPresentation,
  isReadyForPdf,
  isReadyForCompletion,
  getSelectedPackage,
  getScoreProjection,
  getCostOfDelay,
  getComparisonMetrics,
  getAvailableSlides,
  calculateFinancingOptions,
  getPlanTotalCost,
  getAllTreatments,
  type FinancingOption,
} from '@/lib/mastermind/index';

interface PresentationState {
  currentSlideIndex: number;
  isFullscreen: boolean;
  selectedFinancingTerm: number | null; // months
}

export function useMastermindFlow(sessionId: string | null) {
  const {
    session,
    error,
    isLoading,
    dispatch,
    mutate,
    hasScan,
    hasPlan,
    hasReview,
    hasSimulation,
  } = useMastermindSession(sessionId);

  // ── Local presentation state ──
  const [presentationState, setPresentationState] = useState<PresentationState>({
    currentSlideIndex: 0,
    isFullscreen: false,
    selectedFinancingTerm: null,
  });

  // ── Derived selectors (all from MastermindSession) ──
  const readyForPresentation = useMemo(
    () => (session ? isReadyForPresentation(session) : false),
    [session]
  );

  const readyForPdf = useMemo(
    () => (session ? isReadyForPdf(session) : false),
    [session]
  );

  const readyForCompletion = useMemo(
    () => (session ? isReadyForCompletion(session) : false),
    [session]
  );

  const selectedPackage = useMemo(
    () => (session ? getSelectedPackage(session) : null),
    [session]
  );

  const scoreProjection = useMemo(
    () => (session ? getScoreProjection(session) : null),
    [session]
  );

  const costOfDelay = useMemo(
    () => (session ? getCostOfDelay(session) : null),
    [session]
  );

  const comparisonMetrics = useMemo(
    () => (session ? getComparisonMetrics(session) : null),
    [session]
  );

  const availableSlides = useMemo(
    () => (session ? getAvailableSlides(session) : []),
    [session]
  );

  const currentSlide = useMemo(
    () => availableSlides[presentationState.currentSlideIndex] || null,
    [availableSlides, presentationState.currentSlideIndex]
  );

  const financingOptions = useMemo(() => {
    if (!selectedPackage) return [];
    return calculateFinancingOptions(selectedPackage.price);
  }, [selectedPackage]);

  const selectedFinancing = useMemo<FinancingOption | null>(() => {
    if (!presentationState.selectedFinancingTerm) return null;
    return (
      financingOptions.find(
        (f) => f.termMonths === presentationState.selectedFinancingTerm
      ) || null
    );
  }, [financingOptions, presentationState.selectedFinancingTerm]);

  const allTreatments = useMemo(
    () => (session?.mastermindPlan ? getAllTreatments(session.mastermindPlan) : []),
    [session?.mastermindPlan]
  );

  const planTotalCost = useMemo(
    () => (session?.mastermindPlan ? getPlanTotalCost(session.mastermindPlan) : 0),
    [session?.mastermindPlan]
  );

  // ── Actions ──

  const setSourcePhoto = useCallback(
    async (url: string) => {
      await dispatch({ type: 'SET_SOURCE_PHOTO', url });
    },
    [dispatch]
  );

  const selectPackage = useCallback(
    async (tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => {
      await dispatch({ type: 'SELECT_PACKAGE', tier });
    },
    [dispatch]
  );

  const selectFinancingTerm = useCallback((months: number | null) => {
    setPresentationState((prev) => ({
      ...prev,
      selectedFinancingTerm: months,
    }));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < availableSlides.length) {
        setPresentationState((prev) => ({
          ...prev,
          currentSlideIndex: index,
        }));
      }
    },
    [availableSlides.length]
  );

  const nextSlide = useCallback(() => {
    goToSlide(presentationState.currentSlideIndex + 1);
  }, [goToSlide, presentationState.currentSlideIndex]);

  const prevSlide = useCallback(() => {
    goToSlide(presentationState.currentSlideIndex - 1);
  }, [goToSlide, presentationState.currentSlideIndex]);

  const enterPresentation = useCallback(async () => {
    if (!session) return;
    await dispatch({ type: 'SET_PHASE', phase: 'presenting' });
    setPresentationState((prev) => ({
      ...prev,
      currentSlideIndex: 0,
      isFullscreen: true,
    }));
  }, [dispatch, session]);

  const exitPresentation = useCallback(() => {
    setPresentationState((prev) => ({
      ...prev,
      isFullscreen: false,
    }));
  }, []);

  // ── PDF Generation ──

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const generatePdf = useCallback(async (): Promise<string | null> => {
    if (!sessionId || !readyForPdf) return null;
    setPdfLoading(true);
    setPdfError(null);

    try {
      const res = await fetch('/api/mastermind/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);
      const json = await res.json();
      const pdfUrl = json.data?.pdfUrl;

      if (pdfUrl) {
        await dispatch({ type: 'SET_PDF_URL', url: pdfUrl });
      }

      return pdfUrl || null;
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF generation failed');
      return null;
    } finally {
      setPdfLoading(false);
    }
  }, [sessionId, readyForPdf, dispatch]);

  // ── Consultation Completion ──

  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const completeConsultation = useCallback(async () => {
    if (!sessionId || !readyForCompletion) return null;
    setCompleting(true);
    setCompletionError(null);

    try {
      const res = await fetch('/api/mastermind/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) throw new Error(`Completion failed: ${res.status}`);
      const json = await res.json();

      await dispatch({ type: 'COMPLETE' });
      return json.data || null;
    } catch (err) {
      setCompletionError(
        err instanceof Error ? err.message : 'Completion failed'
      );
      return null;
    } finally {
      setCompleting(false);
    }
  }, [sessionId, readyForCompletion, dispatch]);

  return {
    // Session state
    session,
    error,
    isLoading,
    dispatch,
    mutate,

    // Source photo
    sourcePhotoUrl: session?.sourcePhotoUrl || null,

    // Phase checks
    hasScan,
    hasPlan,
    hasReview,
    hasSimulation,
    readyForPresentation,
    readyForPdf,
    readyForCompletion,

    // Derived data
    selectedPackage,
    scoreProjection,
    costOfDelay,
    comparisonMetrics,
    allTreatments,
    planTotalCost,

    // Presentation navigation
    availableSlides,
    currentSlide,
    currentSlideIndex: presentationState.currentSlideIndex,
    isFullscreen: presentationState.isFullscreen,
    goToSlide,
    nextSlide,
    prevSlide,
    enterPresentation,
    exitPresentation,

    // Photo
    setSourcePhoto,

    // Package & financing
    selectPackage,
    financingOptions,
    selectedFinancing,
    selectFinancingTerm,

    // PDF
    pdfLoading,
    pdfError,
    generatePdf,

    // Completion
    completing,
    completionError,
    completeConsultation,
  };
}
