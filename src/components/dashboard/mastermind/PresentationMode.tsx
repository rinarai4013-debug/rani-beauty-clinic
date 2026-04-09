'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MastermindSession } from '@/types/mastermind';

import {
  SlideWelcome,
  SlideAuraScore,
  SlideSkinStory,
  SlideCostOfWaiting,
  SlideTreatmentJourney,
  SlideTreatmentDetails,
  SlideSkincareRx,
  SlidePackages,
  SlideFinancing,
  SlideClosing,
} from './slides';

// ── Slide metadata for presenter notes ──
const SLIDE_META = [
  { title: 'Welcome', notes: 'Warm greeting. Auto-advances in 4s. Establish trust and luxury tone.' },
  { title: 'Aura Score', notes: 'THE big reveal. Let the counter build anticipation. Pause on the grade reveal. Walk through each category.' },
  { title: 'Skin Story', notes: 'Zone-by-zone walkthrough. Focus on top 3 concerns. Use the AI narrative to personalize.' },
  { title: 'Cost of Waiting', notes: 'Data-driven urgency. Show both trajectories. Let the cost number land before moving on.' },
  { title: 'Treatment Journey', notes: 'Big picture timeline. Show them the full journey. Each phase has a clear milestone.' },
  { title: 'Treatment Details', notes: 'Tap to expand any treatment. Highlight AI confidence. Answer questions about specific treatments here.' },
  { title: 'Skincare Rx', notes: 'Value-add slide. Show you care about their routine beyond treatments. Build trust before the package pitch.' },
  { title: 'Your Packages', notes: 'The close begins. Let them compare naturally. Transform is highlighted. Watch their eyes for interest signals.' },
  { title: 'Financing', notes: 'Remove the price objection. Use the term slider to show affordable options. "Same results, comfortable payments."' },
  { title: 'Let\'s Begin', notes: 'Warm close. No pressure. Offer both options: book now or take it home. Confetti adds celebration energy.' },
];

// ── Progress bar ──
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.04] z-50">
      <motion.div
        className="h-full bg-[#C9A96E]"
        initial={false}
        animate={{ width: `${((current + 1) / total) * 100}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Presenter notes (hover-reveal at bottom) ──
function PresenterNotes({ notes, slideTitle }: { notes: string; slideTitle: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full px-6"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Hover trigger area */}
      <div className="h-8" />
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-black/80 backdrop-blur-md rounded-lg px-5 py-3 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
              <span className="text-xs text-[#C9A96E] font-medium uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {slideTitle}
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {notes}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Slide navigation arrows ──
function NavArrows({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  return (
    <>
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label="Previous slide"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label="Next slide"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}

// ── Fullscreen toggle ──
function FullscreenButton({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      document.exitFullscreen?.();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  };

  return (
    <button
      onClick={toggle}
      className="absolute top-4 right-4 z-40 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors opacity-30 hover:opacity-80"
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 1v4H1M9 1v4h4M5 13V9H1M9 13V9h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ── Slide counter ──
function SlideCounter({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="absolute top-4 left-4 z-40 text-xs text-white/20 tabular-nums opacity-30 hover:opacity-80 transition-opacity"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {current + 1} / {total}
    </div>
  );
}

// ── Main Presentation Mode ──

interface PresentationModeProps {
  session: MastermindSession;
  onSelectPackage?: (tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => void;
  onBookSession?: () => void;
  onShareLink?: () => void;
  onClose?: () => void;
}

export default function PresentationMode({
  session,
  onSelectPackage,
  onBookSession,
  onShareLink,
  onClose,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const TOTAL_SLIDES = 10;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= TOTAL_SLIDES) return;
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
    },
    [currentSlide]
  );

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  // Touch/swipe support for iPad
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only register horizontal swipes (ignore vertical scrolling)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) next();
        else prev();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [next, prev]);

  // Extract first name from patient name
  const firstName = session.patientName?.split(' ')[0] || 'Guest';

  // Gather all treatments from plan
  const allTreatments = session.mastermindPlan
    ? [
        ...session.mastermindPlan.recommendations.primary,
        ...session.mastermindPlan.recommendations.complementary,
        ...session.mastermindPlan.recommendations.maintenance,
      ]
    : [];

  // Slide transition variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const handleSelectPackage = (tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => {
    onSelectPackage?.(tier);
    // Auto-advance to financing slide
    goTo(8);
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return <SlideWelcome firstName={firstName} onAutoAdvance={next} />;
      case 1:
        return session.auraScanResult ? (
          <SlideAuraScore
            auraScore={session.auraScanResult.auraScore}
            deviceAnalysis={session.auraScanResult.auraDeviceAnalysis}
          />
        ) : null;
      case 2:
        return session.auraScanResult && session.mastermindPlan ? (
          <SlideSkinStory
            zoneAnalysis={session.auraScanResult.zoneAnalysis}
            patientFacingSummary={session.mastermindPlan.aiSummary.patientFacing}
          />
        ) : null;
      case 3:
        return session.auraScanResult && session.simulationComparison ? (
          <SlideCostOfWaiting
            predictiveMetrics={session.auraScanResult.predictiveMetrics}
            currentScore={session.auraScanResult.auraScore.overall}
            simulationComparison={session.simulationComparison}
          />
        ) : null;
      case 4:
        return session.mastermindPlan ? (
          <SlideTreatmentJourney
            sequencing={session.mastermindPlan.sequencing}
            treatments={allTreatments.map((t) => ({ id: t.id, treatmentName: t.treatmentName }))}
          />
        ) : null;
      case 5:
        return allTreatments.length > 0 ? (
          <SlideTreatmentDetails treatments={allTreatments} />
        ) : null;
      case 6:
        return session.mastermindPlan ? (
          <SlideSkincareRx plan={session.mastermindPlan} />
        ) : null;
      case 7:
        return session.mastermindPlan ? (
          <SlidePackages
            packages={session.mastermindPlan.packages}
            onSelectPackage={handleSelectPackage}
          />
        ) : null;
      case 8:
        return session.mastermindPlan ? (
          <SlideFinancing
            packages={session.mastermindPlan.packages}
            selectedTier={session.selectedPackageTier}
          />
        ) : null;
      case 9:
        return (
          <SlideClosing
            patientName={firstName}
            providerName={session.providerReview?.providerName}
            onBookSession={onBookSession}
            onShareLink={onShareLink}
          />
        );
      default:
        return null;
    }
  };

  const meta = SLIDE_META[currentSlide];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-[#0F1D2C] overflow-hidden select-none"
      style={{ touchAction: 'pan-y' }}
      onClick={(e) => {
        // Click on right half = next, left half = prev (exclude buttons)
        if ((e.target as HTMLElement).closest('button')) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clickX = e.clientX - rect.left;
        if (clickX > rect.width * 0.6) next();
        else if (clickX < rect.width * 0.4) prev();
      }}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 left-14 z-40 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors opacity-30 hover:opacity-80"
          aria-label="Close presentation"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <SlideCounter current={currentSlide} total={TOTAL_SLIDES} />
      <FullscreenButton containerRef={containerRef} />
      <NavArrows
        onPrev={prev}
        onNext={next}
        hasPrev={currentSlide > 0}
        hasNext={currentSlide < TOTAL_SLIDES - 1}
      />

      {/* Slide content with transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {renderSlide()}
        </motion.div>
      </AnimatePresence>

      {/* Presenter notes */}
      {meta && <PresenterNotes notes={meta.notes} slideTitle={meta.title} />}

      {/* Progress bar */}
      <ProgressBar current={currentSlide} total={TOTAL_SLIDES} />
    </div>
  );
}
