'use client';

/**
 * Full-Screen Presentation Route
 *
 * /dashboard/mastermind/[sessionId]/present
 *
 * Renders PresentationMode in a full-screen context.
 * All data flows through useMastermindFlow — no bespoke fetching.
 * Gracefully handles missing data (shows what's available).
 */

import { useParams, useRouter } from 'next/navigation';
import { useMastermindFlow } from '@/hooks/useMastermindFlow';
import PresentationMode from '@/components/mastermind/PresentationMode';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const flow = useMastermindFlow(sessionId);

  // Loading
  if (flow.isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0F1D2C] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#C9A96E] animate-spin mx-auto" />
          <p className="font-body text-white/40 text-sm mt-4">Loading consultation...</p>
        </div>
      </div>
    );
  }

  // Error or session not found
  if (flow.error || !flow.session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0F1D2C] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="font-body text-white/60 text-sm">
            {flow.error ? 'Failed to load session' : 'Session not found'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/mastermind')}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-white/10 text-white/60 font-body text-sm hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mastermind
          </button>
        </div>
      </div>
    );
  }

  // No slides available (no scan data at minimum)
  if (flow.availableSlides.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0F1D2C] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="font-[family-name:var(--font-heading)] text-xl text-white">
            Not Ready for Presentation
          </h2>
          <p className="font-body text-white/40 text-sm">
            This consultation needs at least an Aura Scan before it can be presented.
            Complete the earlier phases first.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/mastermind/${sessionId}`)}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-white/10 text-white/60 font-body text-sm hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Session
          </button>
        </div>
      </div>
    );
  }

  const handleExit = () => {
    router.push(`/dashboard/mastermind/${sessionId}`);
  };

  return (
    <PresentationMode
      session={flow.session}
      slides={flow.availableSlides}
      currentSlideIndex={flow.currentSlideIndex}
      onGoToSlide={flow.goToSlide}
      onNext={flow.nextSlide}
      onPrev={flow.prevSlide}
      onExit={handleExit}
      onSelectPackage={flow.selectPackage}
      onGeneratePdf={flow.generatePdf}
      onComplete={flow.completeConsultation}
      selectedPackage={flow.selectedPackage}
      financingOptions={flow.financingOptions}
      selectedFinancing={flow.selectedFinancing}
      onSelectFinancing={flow.selectFinancingTerm}
      pdfLoading={flow.pdfLoading}
      completing={flow.completing}
      scoreProjection={flow.scoreProjection}
      costOfDelay={flow.costOfDelay}
      comparisonMetrics={flow.comparisonMetrics}
    />
  );
}
