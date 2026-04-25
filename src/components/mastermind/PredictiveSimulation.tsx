'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { SimulationComparison, SimulationFrame, AuraScanResult, MastermindPlan } from '@/types/mastermind';
import { generateSimulationComparison } from '@/lib/mastermind/simulation-engine';
import TimelineScrubber from './TimelineScrubber';
import SimulationMetrics from './SimulationMetrics';
import SimulationDisclaimer from '@/components/photo-simulation/SimulationDisclaimer';

/**
 * Renders a frame as a clearly-labeled data card when a real face simulation
 * is unavailable (no photo on file, or photo stripped from Airtable persistence).
 * Replaces the misleading "SVG image inside a face panel" rendering that was
 * audited as F-11 — viewers were reading projection cards as face transformations.
 */
function ProjectionCard({
  frame,
  accent,
  accentMuted,
}: {
  frame: SimulationFrame;
  accent: string;
  accentMuted: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8"
      style={{ background: `linear-gradient(135deg, ${accentMuted} 0%, #FFFFFF 100%)` }}
    >
      <p
        className="text-[10px] font-bold tracking-[0.22em] uppercase mb-3"
        style={{ color: accent }}
      >
        Projected outcome
      </p>
      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-1.5"
            style={{ backgroundColor: `${accent}15`, border: `2px solid ${accent}` }}
          >
            <span className="text-2xl font-bold" style={{ color: accent }}>
              {frame.auraScoreProjection}
            </span>
          </div>
          <p className="text-[9px] font-bold tracking-wider uppercase text-[#0F1D2C]/60">Aura Score</p>
        </div>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-1.5"
            style={{ backgroundColor: '#0F1D2C08', border: '2px solid #0F1D2C30' }}
          >
            <span className="text-2xl font-bold text-[#0F1D2C]">{frame.skinAgeProjection}</span>
          </div>
          <p className="text-[9px] font-bold tracking-wider uppercase text-[#0F1D2C]/60">Skin Age</p>
        </div>
      </div>
      <p className="text-[11px] text-center text-[#0F1D2C]/55 leading-snug max-w-[88%]">
        {frame.description}
      </p>
    </motion.div>
  );
}

interface PredictiveSimulationProps {
  scanResult: AuraScanResult;
  plan: MastermindPlan | null;
  sourcePhotoDataUrl: string | null;
}

export default function PredictiveSimulation({
  scanResult,
  plan,
  sourcePhotoDataUrl,
}: PredictiveSimulationProps) {
  const [comparison, setComparison] = useState<SimulationComparison | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withIndex, setWithIndex] = useState(0);
  const [withoutIndex, setWithoutIndex] = useState(0);
  const generatedRef = useRef(false);

  // Generate simulation on mount if we have a source photo
  useEffect(() => {
    if (!sourcePhotoDataUrl || generatedRef.current) return;
    generatedRef.current = true;

    (async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateSimulationComparison({
          sourceImageDataUrl: sourcePhotoDataUrl,
          scanResult,
          plan,
        });
        setComparison(result);
      } catch (err) {
        console.error('Simulation generation failed:', err);
        setError('Failed to generate simulation. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    })();
  }, [sourcePhotoDataUrl, scanResult, plan]);

  const handleRegenerate = useCallback(async () => {
    if (!sourcePhotoDataUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateSimulationComparison({
        sourceImageDataUrl: sourcePhotoDataUrl,
        scanResult,
        plan,
      });
      setComparison(result);
      setWithIndex(0);
      setWithoutIndex(0);
    } catch {
      setError('Regeneration failed.');
    } finally {
      setIsGenerating(false);
    }
  }, [sourcePhotoDataUrl, scanResult, plan]);

  // No source photo
  if (!sourcePhotoDataUrl) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F8F6F1] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#0F1D2C]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h3 className="font-body text-sm font-medium text-[#0F1D2C]/60">
          Photo Required for Simulation
        </h3>
        <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
          Upload a photo in the consultation wizard to see predictive results.
        </p>
      </div>
    );
  }

  // Generating
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-rani-gold-accessible animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="font-body text-sm font-medium text-[#0F1D2C]">
            Generating Your Two Futures
          </h3>
          <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
            Rendering treatment progression and aging simulation...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-sm text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={handleRegenerate}
          className="px-4 py-2 rounded-xl bg-[#0F1D2C] text-white font-body text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!comparison) return null;

  const withFrames = comparison.withTreatment.frames;
  const withoutFrames = comparison.withoutTreatment.frames;
  const currentWithFrame = withFrames[withIndex] || null;
  const currentWithoutFrame = withoutFrames[withoutIndex] || null;

  return (
    <div className="space-y-6">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0F1D2C] text-center">
        Your Skin&apos;s Two Futures
      </h2>
      {(() => {
        const isProjectionMode =
          (currentWithFrame?.kind === 'data-projection') ||
          (currentWithoutFrame?.kind === 'data-projection');
        return isProjectionMode ? (
          <p className="font-body text-xs text-[#0F1D2C]/50 text-center max-w-2xl mx-auto -mt-3">
            Data-driven projections from consultation findings. Not a face simulation — upload a clinical photo to view a true visual progression.
          </p>
        ) : null;
      })()}

      {/* Dual Image Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WITH Treatment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#059669]" />
            <h3 className="font-body text-sm font-semibold text-[#059669]">
              With Your Treatment Plan
            </h3>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F6F1] border border-[#059669]/20">
            <AnimatePresence mode="wait">
              {currentWithFrame && (
                currentWithFrame.kind === 'photo-simulation' ? (
                  <motion.img
                    key={currentWithFrame.timepoint}
                    src={currentWithFrame.imageDataUrl}
                    alt={`With treatment — ${currentWithFrame.timepoint}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <ProjectionCard
                    key={currentWithFrame.timepoint}
                    frame={currentWithFrame}
                    accent="#059669"
                    accentMuted="#D1FAE5"
                  />
                )
              )}
            </AnimatePresence>

            {/* Timepoint + projection-mode badge */}
            {currentWithFrame && (
              <>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#059669] text-white font-body text-xs font-medium">
                  {currentWithFrame.timepoint}
                </div>
                {currentWithFrame.kind === 'data-projection' && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#0F1D2C]/85 text-white/95 font-body text-[10px] font-bold tracking-[0.18em] uppercase">
                    Data projection
                  </div>
                )}
              </>
            )}
          </div>

          {/* Timeline Scrubber */}
          <TimelineScrubber
            timepoints={withFrames.map((f) => f.timepoint)}
            activeIndex={withIndex}
            onChange={setWithIndex}
            color="#059669"
          />

          {/* Description */}
          {currentWithFrame && (
            <p className="font-body text-xs text-[#0F1D2C]/50 text-center px-4">
              {currentWithFrame.description}
            </p>
          )}
        </div>

        {/* WITHOUT Treatment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#DC2626]" />
            <h3 className="font-body text-sm font-semibold text-[#DC2626]">
              Without Treatment
            </h3>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F6F1] border border-[#DC2626]/20">
            <AnimatePresence mode="wait">
              {currentWithoutFrame && (
                currentWithoutFrame.kind === 'photo-simulation' ? (
                  <motion.img
                    key={currentWithoutFrame.timepoint}
                    src={currentWithoutFrame.imageDataUrl}
                    alt={`Without treatment — ${currentWithoutFrame.timepoint}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <ProjectionCard
                    key={currentWithoutFrame.timepoint}
                    frame={currentWithoutFrame}
                    accent="#DC2626"
                    accentMuted="#FEE2E2"
                  />
                )
              )}
            </AnimatePresence>

            {/* Timepoint + projection-mode badge */}
            {currentWithoutFrame && (
              <>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#DC2626] text-white font-body text-xs font-medium">
                  {currentWithoutFrame.timepoint}
                </div>
                {currentWithoutFrame.kind === 'data-projection' && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#0F1D2C]/85 text-white/95 font-body text-[10px] font-bold tracking-[0.18em] uppercase">
                    Data projection
                  </div>
                )}
              </>
            )}
          </div>

          {/* Timeline Scrubber */}
          <TimelineScrubber
            timepoints={withoutFrames.map((f) => f.timepoint)}
            activeIndex={withoutIndex}
            onChange={setWithoutIndex}
            color="#DC2626"
          />

          {/* Description */}
          {currentWithoutFrame && (
            <p className="font-body text-xs text-[#0F1D2C]/50 text-center px-4">
              {currentWithoutFrame.description}
            </p>
          )}
        </div>
      </div>

      {/* Metrics */}
      <SimulationMetrics
        comparison={comparison}
        withFrame={currentWithFrame}
        withoutFrame={currentWithoutFrame}
        currentScore={scanResult.auraScore.overall}
      />

      {/* Disclaimer */}
      <SimulationDisclaimer />
    </div>
  );
}
