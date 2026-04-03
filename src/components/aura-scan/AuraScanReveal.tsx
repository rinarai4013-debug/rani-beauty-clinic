'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuraScanResult, SkinAnalysisCategory, CategoryScore } from '@/types/mastermind';
import AuraScoreGauge from './AuraScoreGauge';
import SkinAnalysisGrid from './SkinAnalysisGrid';
import ConcernCards from './ConcernCards';
import PredictiveMetrics from './PredictiveMetrics';
import ZoneDetailPanel from './ZoneDetailPanel';

interface AuraScanRevealProps {
  scanResult: AuraScanResult;
  patientPhotos?: string[];
  onComplete?: () => void;
}

type RevealPhase = 'scanning' | 'score' | 'analysis' | 'complete';

export default function AuraScanReveal({
  scanResult,
  patientPhotos,
  onComplete,
}: AuraScanRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('scanning');
  const [selectedCategory, setSelectedCategory] = useState<CategoryScore | null>(null);

  // Auto-advance through phases
  const advancePhase = useCallback(() => {
    setPhase((prev) => {
      switch (prev) {
        case 'scanning': return 'score';
        case 'score': return 'analysis';
        case 'analysis':
          onComplete?.();
          return 'complete';
        default: return prev;
      }
    });
  }, [onComplete]);

  const handleCategoryClick = useCallback(
    (category: SkinAnalysisCategory) => {
      const found = scanResult.auraDeviceAnalysis.categories.find(
        (c) => c.category === category
      );
      if (found) setSelectedCategory(found);
    },
    [scanResult.auraDeviceAnalysis.categories]
  );

  // Find related concerns for the selected category
  const relatedConcerns = selectedCategory
    ? scanResult.detectedConcerns.filter(
        (c) => c.concern === selectedCategory.category ||
               c.concern.replace(/_/g, '') === selectedCategory.category.toLowerCase()
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Scanning Animation */}
      <AnimatePresence mode="wait">
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 py-16"
          >
            {/* Pulse rings */}
            <div className="relative w-32 h-32">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-[#C9A96E]"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{
                    scale: [0.8, 1.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeOut',
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#C9A96E]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#C9A96E] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="font-heading text-2xl text-[#0F1D2C] mb-2">
                Analyzing Your Skin
              </h2>
              <p className="font-body text-sm text-[#0F1D2C]/50">
                Scanning across 5 dimensions and 8 health indicators...
              </p>
            </div>

            {/* Auto-advance after animation */}
            <motion.div
              onAnimationComplete={advancePhase}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Reveal */}
      {(phase === 'score' || phase === 'analysis' || phase === 'complete') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-4 py-8"
        >
          <AuraScoreGauge score={scanResult.auraScore} size="lg" />

          {phase === 'score' && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              onClick={advancePhase}
              className="mt-4 px-6 py-3 rounded-xl bg-[#0F1D2C] text-white font-body font-medium text-sm hover:bg-[#0F1D2C]/90 transition-colors"
            >
              See Full Analysis
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Full Analysis */}
      {(phase === 'analysis' || phase === 'complete') && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-10"
        >
          {/* AURA-style 2x3 grid */}
          <SkinAnalysisGrid
            analysis={scanResult.auraDeviceAnalysis}
            patientPhotos={patientPhotos}
            onCategoryClick={handleCategoryClick}
          />

          {/* Concern Cards */}
          <ConcernCards concerns={scanResult.detectedConcerns} />

          {/* Predictive Metrics */}
          <PredictiveMetrics
            metrics={scanResult.predictiveMetrics}
            currentScore={scanResult.auraScore.overall}
          />

          {/* Medical Flags */}
          {scanResult.medicalFlags.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-lg text-[#0F1D2C]">Medical Considerations</h3>
              {scanResult.medicalFlags.map((flag, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    flag.severity === 'critical'
                      ? 'border-red-200 bg-red-50'
                      : flag.severity === 'warning'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-body text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                      flag.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : flag.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {flag.severity}
                    </span>
                    <div>
                      <p className="font-body text-sm font-medium text-[#0F1D2C]">{flag.flag}</p>
                      <p className="font-body text-xs text-[#0F1D2C]/60 mt-1">{flag.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {phase === 'analysis' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <button
                type="button"
                onClick={advancePhase}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#D4B87A] text-white font-body font-semibold text-sm hover:shadow-lg hover:shadow-[#C9A96E]/25 transition-all"
              >
                Generate Treatment Plan
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Zone Detail Panel */}
      <ZoneDetailPanel
        category={selectedCategory}
        relatedConcerns={relatedConcerns}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}
