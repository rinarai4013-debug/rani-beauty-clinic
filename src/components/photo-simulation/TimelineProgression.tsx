'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { applyClientSideFilters } from '@/lib/photo-simulation/ai-simulation';

import type { SkinAnalysisResult } from '@/lib/photo-simulation/skin-analysis';

// ─── Types ─────────────────────────────────────────────────────────────

interface TimelineProgressionProps {
  photo: File;
  treatments: string[];
  skinAnalysis?: SkinAnalysisResult;
}

interface TimelinePanel {
  timeframe: '1-month' | '3-months' | '6-months';
  label: string;
  description: string;
  improvements: string[];
  highlighted?: boolean;
}

interface SimulationState {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  usedAI: boolean;
}

// ─── Timeline Data ─────────────────────────────────────────────────────

function getImprovementsForTreatments(
  treatments: string[],
  timeframe: '1-month' | '3-months' | '6-months',
): string[] {
  const allImprovements: Record<string, Record<string, string[]>> = {
    'HydraFacial': {
      '1-month': ['Initial hydration boost', 'Pore visibility reduced'],
      '3-months': ['Sustained glow', 'Smoother texture', 'Minimized pores'],
      '6-months': ['Transformed skin clarity', 'Even complexion', 'Dewy radiance'],
    },
    'RF Microneedling': {
      '1-month': ['Collagen stimulation begins', 'Mild texture improvement'],
      '3-months': ['Visible pore reduction', 'Smoother scarring', 'Firmer skin'],
      '6-months': ['Dramatic scar reduction', 'Tightened skin', 'Refined texture'],
    },
    'Sofwave': {
      '1-month': ['Initial tightening response', 'Subtle lift'],
      '3-months': ['Visible jawline definition', 'Lifted brows', 'Firmer neck'],
      '6-months': ['Peak collagen remodeling', 'Sculpted contours', 'Youthful lift'],
    },
    'VI Peel': {
      '1-month': ['Brighter complexion', 'Surface spots fading'],
      '3-months': ['Even skin tone', 'Reduced hyperpigmentation', 'Clearer skin'],
      '6-months': ['Dramatically even tone', 'Minimized dark spots', 'Radiant glow'],
    },
    'Botox': {
      '1-month': ['Smoothed forehead lines', 'Relaxed expression lines'],
      '3-months': ['Natural, refreshed look', 'Reduced crow\'s feet'],
      '6-months': ['Preventive wrinkle benefit', 'Consistently smooth skin'],
    },
    'Dermal Fillers': {
      '1-month': ['Enhanced volume', 'Defined contours'],
      '3-months': ['Natural-looking fullness', 'Smoothed folds'],
      '6-months': ['Sustained volume', 'Youthful proportions', 'Harmonious features'],
    },
    'Laser Facial': {
      '1-month': ['Reduced redness', 'Initial tone correction'],
      '3-months': ['Clear, even skin', 'Sun damage fading', 'Smoother texture'],
      '6-months': ['Transformed complexion', 'Minimal discoloration', 'Renewed skin'],
    },
    'BioRePeel': {
      '1-month': ['Instant radiance', 'Refreshed appearance'],
      '3-months': ['Improved skin quality', 'Refined pores', 'Healthy glow'],
      '6-months': ['Deep skin renewal', 'Lasting luminosity', 'Even texture'],
    },
    'PRX-T33': {
      '1-month': ['Deep hydration', 'Plumper skin feel'],
      '3-months': ['Collagen-rich appearance', 'Firmer skin', 'Reduced fine lines'],
      '6-months': ['Visibly younger skin', 'Dense collagen network', 'Lasting plumpness'],
    },
    'GLP-1': {
      '1-month': ['Initial contour changes', 'Subtle definition'],
      '3-months': ['Slimmer face contour', 'Defined jawline', 'Improved profile'],
      '6-months': ['Dramatic facial contouring', 'Sculpted jawline', 'Harmonious proportions'],
    },
  };

  const improvements = new Set<string>();
  for (const treatment of treatments) {
    const key = Object.keys(allImprovements).find(
      (k) => k.toLowerCase() === treatment.toLowerCase() || treatment.toLowerCase().includes(k.toLowerCase()),
    );
    const treatmentData = key ? allImprovements[key] : null;
    if (treatmentData?.[timeframe]) {
      for (const imp of treatmentData[timeframe]) {
        improvements.add(imp);
      }
    }
  }

  if (improvements.size === 0) {
    const defaults: Record<string, string[]> = {
      '1-month': ['Initial skin improvement', 'Enhanced radiance'],
      '3-months': ['Visible transformation', 'Healthier complexion', 'Improved texture'],
      '6-months': ['Peak results achieved', 'Dramatic improvement', 'Lasting transformation'],
    };
    return defaults[timeframe] || ['Improved skin health'];
  }

  return Array.from(improvements).slice(0, 4);
}

const TIMELINE_PANELS: TimelinePanel[] = [
  {
    timeframe: '1-month',
    label: '1 Month',
    description: 'Subtle Improvement',
    improvements: [],
  },
  {
    timeframe: '3-months',
    label: '3 Months',
    description: 'Visible Transformation',
    improvements: [],
    highlighted: true,
  },
  {
    timeframe: '6-months',
    label: '6 Months',
    description: 'Peak Results',
    improvements: [],
  },
];

// ─── Score Projection ──────────────────────────────────────────────────

function projectScores(
  currentScore: number,
  treatments: string[],
): { month1: number; month3: number; month6: number } {
  const treatmentCount = treatments.length;
  const baseImprovement = Math.min(40, treatmentCount * 8);

  return {
    month1: Math.min(100, Math.round(currentScore + baseImprovement * 0.3)),
    month3: Math.min(100, Math.round(currentScore + baseImprovement * 0.65)),
    month6: Math.min(100, Math.round(currentScore + baseImprovement * 1.0)),
  };
}

// ─── Component ─────────────────────────────────────────────────────────

export default function TimelineProgression({
  photo,
  treatments,
  skinAnalysis,
}: TimelineProgressionProps) {
  const [simulations, setSimulations] = useState<Record<string, SimulationState>>({
    '1-month': { imageUrl: null, loading: true, error: null, usedAI: false },
    '3-months': { imageUrl: null, loading: true, error: null, usedAI: false },
    '6-months': { imageUrl: null, loading: true, error: null, usedAI: false },
  });
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const currentScore = skinAnalysis?.overallScore ?? 62;
  const projectedScores = projectScores(currentScore, treatments);

  // Convert photo File to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Generate simulation for a specific timeframe
  const generateSimulation = useCallback(
    async (timeframe: '1-month' | '3-months' | '6-months') => {
      setSimulations((prev) => ({
        ...prev,
        [timeframe]: { ...prev[timeframe], loading: true, error: null },
      }));

      try {
        const photoBase64 = await fileToBase64(photo);

        const response = await fetch('/api/simulation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoBase64,
            treatments,
            timeframe,
            intensity: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed (${response.status})`);
        }

        const result = await response.json();

        // Check if the API used AI (confidence > 0.7 typically means Replicate)
        const usedAI = result.confidence > 0.7;

        setSimulations((prev) => ({
          ...prev,
          [timeframe]: {
            imageUrl: result.imageUrl,
            loading: false,
            error: null,
            usedAI,
          },
        }));

        // If fallback (no AI), apply canvas filters client-side
        if (!usedAI) {
          // Wait for next tick so the canvas/image is rendered
          requestAnimationFrame(() => {
            const canvas = canvasRefs.current[timeframe];
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const img = new Image();
                img.onload = () => {
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  ctx.drawImage(img, 0, 0);
                  applyClientSideFilters(canvas, treatments, timeframe, 0.7);
                  // Update with filtered result
                  const filteredUrl = canvas.toDataURL('image/jpeg', 0.92);
                  setSimulations((prev) => ({
                    ...prev,
                    [timeframe]: { ...prev[timeframe], imageUrl: filteredUrl },
                  }));
                };
                img.src = result.imageUrl;
              }
            }
          });
        }
      } catch (error) {
        console.error(`[TimelineProgression] Error generating ${timeframe}:`, error);
        setSimulations((prev) => ({
          ...prev,
          [timeframe]: {
            imageUrl: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Generation failed',
            usedAI: false,
          },
        }));
      }
    },
    [photo, treatments, fileToBase64],
  );

  // Generate all 3 timeframes on mount
  useEffect(() => {
    if (!photo || treatments.length === 0) return;

    // Stagger requests slightly to avoid rate limiting
    generateSimulation('1-month');
    const timer3 = setTimeout(() => generateSimulation('3-months'), 800);
    const timer6 = setTimeout(() => generateSimulation('6-months'), 1600);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer6);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, treatments.join(',')]);

  const scoreData = [
    { label: 'Current', score: currentScore },
    { label: '1 Month', score: projectedScores.month1 },
    { label: '3 Months', score: projectedScores.month3 },
    { label: '6 Months', score: projectedScores.month6 },
  ];
  const maxScore = Math.max(...scoreData.map((d) => d.score));

  return (
    <div className="space-y-8">
      {/* Timeline Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIMELINE_PANELS.map((panel, index) => {
          const sim = simulations[panel.timeframe];
          const improvements = getImprovementsForTreatments(treatments, panel.timeframe);

          return (
            <motion.div
              key={panel.timeframe}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5, ease: 'easeOut' }}
              className={`relative rounded-2xl overflow-hidden border transition-all ${
                panel.highlighted
                  ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/10 ring-1 ring-[#C9A96E]/20'
                  : 'border-[#0F1D2C]/10 hover:border-[#C9A96E]/40'
              } bg-white`}
            >
              {/* Highlighted badge */}
              {panel.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#C9A96E] to-[#B8944D] text-white text-xs font-semibold text-center py-1.5 z-10">
                  <Sparkles className="inline w-3 h-3 mr-1 -mt-0.5" />
                  RECOMMENDED TIMELINE
                </div>
              )}

              {/* Image area */}
              <div
                className={`relative aspect-square bg-[#F8F6F1] ${panel.highlighted ? 'mt-7' : ''}`}
              >
                <AnimatePresence mode="wait">
                  {sim.loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    >
                      {/* Shimmer placeholder */}
                      <div className="w-full h-full animate-pulse bg-gradient-to-br from-[#F8F6F1] via-[#E8E4DD] to-[#F8F6F1]" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#C9A96E] animate-spin" />
                        <p className="text-sm text-[#0F1D2C]/60 font-medium">
                          Generating simulation...
                        </p>
                      </div>
                    </motion.div>
                  ) : sim.error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4"
                    >
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <p className="text-sm text-red-500 text-center">{sim.error}</p>
                      <button
                        onClick={() => generateSimulation(panel.timeframe)}
                        className="text-xs text-[#C9A96E] hover:text-[#B8944D] underline font-medium"
                      >
                        Retry
                      </button>
                    </motion.div>
                  ) : sim.imageUrl ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sim.imageUrl}
                        alt={`Projected results at ${panel.label}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Hidden canvas for client-side filter fallback */}
                <canvas
                  ref={(el) => { canvasRefs.current[panel.timeframe] = el; }}
                  className="hidden"
                />
              </div>

              {/* Info area */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#C9A96E]" />
                  <h3
                    className="text-lg font-bold text-[#0F1D2C]"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {panel.label}
                  </h3>
                </div>
                <p className="text-sm text-[#0F1D2C]/60 mb-3 font-medium">
                  {panel.description}
                </p>

                {/* Key improvements */}
                <ul className="space-y-1.5">
                  {improvements.map((improvement, i) => (
                    <motion.li
                      key={improvement}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 + i * 0.1 + 0.3 }}
                      className="flex items-start gap-2 text-sm text-[#0F1D2C]/80"
                    >
                      <span className="text-[#C9A96E] mt-0.5 flex-shrink-0">&#10003;</span>
                      {improvement}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Skin Health Score Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-white rounded-2xl border border-[#0F1D2C]/10 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-[#C9A96E]" />
          <h3
            className="text-lg font-bold text-[#0F1D2C]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Projected Skin Health Score
          </h3>
        </div>

        <div className="flex items-end gap-4 h-48">
          {scoreData.map((item, i) => {
            const barHeight = (item.score / 100) * 100;
            const isCurrentScore = i === 0;
            const barColor = isCurrentScore
              ? '#0F1D2C'
              : `rgba(201, 169, 110, ${0.5 + (i / scoreData.length) * 0.5})`;

            return (
              <motion.div
                key={item.label}
                className="flex-1 flex flex-col items-center gap-2"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 1 + i * 0.15, duration: 0.5, ease: 'easeOut' }}
                style={{ transformOrigin: 'bottom' }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: isCurrentScore ? '#0F1D2C' : '#C9A96E' }}
                >
                  {item.score}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all relative"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: barColor,
                    minHeight: '20px',
                  }}
                >
                  {!isCurrentScore && i > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-green-600 font-semibold whitespace-nowrap">
                      +{item.score - currentScore}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[#0F1D2C]/60 font-medium text-center">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-[#0F1D2C]/40 mt-4 text-center italic">
          Scores are projected estimates based on typical treatment outcomes. Individual results may vary.
        </p>
      </motion.div>
    </div>
  );
}
