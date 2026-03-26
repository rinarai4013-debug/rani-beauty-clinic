'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Sparkles,
  Brain,
  TrendingUp,
  Share2,
  Download,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import PhotoUploadZone from './PhotoUploadZone';
import SimulationCanvas from './SimulationCanvas';
import SimulationDisclaimer from './SimulationDisclaimer';
import {
  TREATMENT_PRESETS,
  CATEGORY_TO_PRESETS,
} from '@/lib/photo-simulation/filter-presets';
import type { ServiceCategory } from '@/data/services/unified-catalog';

import type { SkinAnalysisResult } from '@/lib/photo-simulation/skin-analysis';

// Lazy-load heavy components
import dynamic from 'next/dynamic';
const TimelineProgression = dynamic(() => import('./TimelineProgression'), {
  ssr: false,
  loading: () => <ProgressionSkeleton />,
});
const ShareableResult = dynamic(() => import('./ShareableResult'), {
  ssr: false,
});

interface PhotoSimulationEmbedProps {
  treatmentInterests?: string[];
  skinConcerns?: string[];
  clientName?: string;
}

type SimulationPhase = 'upload' | 'analyzing' | 'results' | 'timeline' | 'share';

function ProgressionSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#F8F6F1] rounded-xl h-48 animate-pulse" />
      ))}
    </div>
  );
}

export default function PhotoSimulationEmbed({
  treatmentInterests = [],
  skinConcerns = [],
  clientName = '',
}: PhotoSimulationEmbedProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [phase, setPhase] = useState<SimulationPhase>('upload');
  const [analysis, setAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [intensity, setIntensity] = useState(0.6);

  // Auto-select presets based on analysis or client data
  const autoPresets = useMemo(() => {
    const presetSet = new Set<string>();

    // If we have AI analysis, use detected concerns
    if (analysis?.concerns) {
      const concernMapping: Record<string, string[]> = {
        'acne': ['acne-improvement', 'pore-refinement'],
        'aging-skin': ['anti-aging', 'collagen-boost', 'skin-tightening'],
        'hyperpigmentation': ['pigmentation-reduction', 'tone-correction'],
        'skin-laxity': ['skin-tightening', 'collagen-boost'],
        'dull-skin': ['overall-glow', 'brightening-hydration'],
        'sun-damage': ['pigmentation-reduction', 'tone-correction'],
        'large-pores': ['pore-refinement', 'skin-rejuvenation'],
        'body-contouring': ['body-contouring'],
        'unwanted-hair': ['skin-rejuvenation'],
        'fine-lines': ['anti-aging', 'collagen-boost'],
        'redness': ['tone-correction', 'skin-rejuvenation'],
        'texture': ['pore-refinement', 'scar-improvement'],
        'wrinkles': ['anti-aging', 'skin-tightening'],
        'scarring': ['scar-improvement', 'collagen-boost'],
      };

      for (const concern of analysis.concerns) {
        const mapped = concernMapping[concern.id];
        if (mapped) mapped.forEach((p) => presetSet.add(p));
      }
    }

    // Fallback: use treatment interests
    if (presetSet.size === 0) {
      for (const interest of treatmentInterests) {
        const categoryPresets = CATEGORY_TO_PRESETS[interest as ServiceCategory];
        if (categoryPresets) categoryPresets.forEach((p) => presetSet.add(p));
      }
    }

    // Fallback: use skin concerns
    if (presetSet.size === 0) {
      const concernMapping: Record<string, string[]> = {
        'acne': ['acne-improvement'],
        'aging-skin': ['anti-aging'],
        'hyperpigmentation': ['pigmentation-reduction'],
        'dull-skin': ['overall-glow'],
      };
      for (const concern of skinConcerns) {
        const mapped = concernMapping[concern];
        if (mapped) mapped.forEach((p) => presetSet.add(p));
      }
    }

    if (presetSet.size === 0) {
      presetSet.add('overall-glow');
      presetSet.add('skin-rejuvenation');
    }

    return Array.from(presetSet);
  }, [analysis, treatmentInterests, skinConcerns]);

  // Run AI skin analysis
  const runAnalysis = useCallback(async (photo: File) => {
    setPhase('analyzing');
    setAnalysisError('');

    try {
      // Convert to base64
      const buffer = await photo.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const res = await fetch('/api/skin-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: `data:${photo.type};base64,${base64}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data);
      setPhase('results');
    } catch {
      // Graceful fallback - show simulation without AI analysis
      setAnalysis(null);
      setPhase('results');
      setAnalysisError('AI analysis unavailable - showing visual simulation.');
    }
  }, []);

  // Handle photo upload
  const handlePhotosChange = useCallback(
    (newPhotos: File[]) => {
      setPhotos(newPhotos);
      if (newPhotos.length > 0 && phase === 'upload') {
        runAnalysis(newPhotos[0]);
      }
    },
    [phase, runAnalysis]
  );

  const resetSimulation = useCallback(() => {
    setPhotos([]);
    setAnalysis(null);
    setPhase('upload');
    setAnalysisError('');
  }, []);

  // ─── Upload Phase ───
  if (phase === 'upload') {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/5 flex items-center justify-center">
          <Camera className="w-8 h-8 text-[#C9A96E]" />
        </div>
        <div>
          <h3 className="font-heading text-xl text-[#0F1D2C] mb-2">
            AI-Powered Skin Analysis
          </h3>
          <p className="font-body text-[#0F1D2C]/60 text-sm max-w-md mx-auto">
            Upload a front-facing photo and our AI will analyze your skin, detect areas of opportunity, and show you projected results from your recommended treatments.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          <div className="p-3 rounded-xl bg-[#F8F6F1]">
            <Brain className="w-5 h-5 text-[#C9A96E] mx-auto mb-1" />
            <p className="text-[10px] text-[#0F1D2C]/50 font-medium">AI Skin Analysis</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F6F1]">
            <Sparkles className="w-5 h-5 text-[#C9A96E] mx-auto mb-1" />
            <p className="text-[10px] text-[#0F1D2C]/50 font-medium">Visual Simulation</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F6F1]">
            <TrendingUp className="w-5 h-5 text-[#C9A96E] mx-auto mb-1" />
            <p className="text-[10px] text-[#0F1D2C]/50 font-medium">Timeline Preview</p>
          </div>
        </div>

        <PhotoUploadZone
          photos={photos}
          onPhotosChange={handlePhotosChange}
          maxPhotos={1}
        />
        <SimulationDisclaimer />
      </div>
    );
  }

  // ─── Analyzing Phase ───
  if (phase === 'analyzing') {
    return (
      <div className="text-center space-y-6 py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="mx-auto w-16 h-16 rounded-full border-2 border-[#C9A96E] border-t-transparent flex items-center justify-center"
        >
          <Brain className="w-6 h-6 text-[#C9A96E]" />
        </motion.div>
        <div>
          <h3 className="font-heading text-xl text-[#0F1D2C]">Analyzing Your Skin</h3>
          <p className="text-sm text-[#0F1D2C]/50 mt-2">Our AI is evaluating your skin health across 9 dimensions...</p>
        </div>
        <div className="max-w-xs mx-auto space-y-2">
          {['Detecting skin concerns', 'Measuring skin health score', 'Matching treatments', 'Generating simulation'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 1.2 }}
              className="flex items-center gap-3 text-left"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 1.2 + 0.8 }}
              >
                <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
              </motion.div>
              <span className="text-sm text-[#0F1D2C]/60">{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Results Phase ───
  return (
    <div className="space-y-8">
      {/* Analysis Results Header */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Skin Score */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-[#0F1D2C]/40 mb-1">Current Score</p>
              <p className="font-heading text-4xl text-[#0F1D2C]">{analysis.overallScore}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-[#C9A96E]" />
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-[#C9A96E] mb-1">Projected Score</p>
              <p className="font-heading text-4xl text-[#C9A96E]">{analysis.projectedScore}</p>
            </div>
          </div>

          {/* AI Summary */}
          <p className="text-center text-[#0F1D2C]/70 text-sm max-w-lg mx-auto italic">
            &ldquo;{analysis.summary}&rdquo;
          </p>

          {/* Detected Concerns */}
          <div className="flex flex-wrap gap-2 justify-center">
            {analysis.concerns.map((concern) => (
              <span
                key={concern.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  concern.severity === 'significant'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : concern.severity === 'moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {concern.label}
                <span className="opacity-60">({concern.score})</span>
              </span>
            ))}
          </div>

          {/* Recommended Treatments */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-[#0F1D2C]/40 text-center">
                AI-Recommended Treatments
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.recommendations.slice(0, 4).map((rec, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      rec.priority === 'primary'
                        ? 'bg-[#C9A96E]/5 border-[#C9A96E]/20'
                        : 'bg-[#F8F6F1] border-[#0F1D2C]/5'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      rec.priority === 'primary' ? 'bg-[#C9A96E]/15' : 'bg-[#0F1D2C]/5'
                    }`}>
                      <Sparkles className={`w-3 h-3 ${
                        rec.priority === 'primary' ? 'text-[#C9A96E]' : 'text-[#0F1D2C]/40'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F1D2C] truncate">{rec.service.name}</p>
                      <p className="text-xs text-[#0F1D2C]/50 line-clamp-2">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {analysisError && (
        <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {analysisError}
        </p>
      )}

      {/* Active filter presets */}
      <div className="flex flex-wrap gap-2 justify-center">
        {autoPresets.slice(0, 6).map((presetId) => {
          const preset = TREATMENT_PRESETS[presetId];
          if (!preset) return null;
          return (
            <span
              key={presetId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-full text-xs font-medium text-[#0F1D2C]/70"
            >
              <Sparkles className="w-3 h-3 text-[#C9A96E]" />
              {preset.label}
            </span>
          );
        })}
      </div>

      {/* Phase Tabs */}
      <div className="flex justify-center gap-1 bg-[#F8F6F1] rounded-xl p-1">
        {[
          { id: 'results' as const, label: 'Before / After', icon: Sparkles },
          { id: 'timeline' as const, label: 'Timeline', icon: TrendingUp },
          { id: 'share' as const, label: 'Share', icon: Share2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPhase(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              phase === tab.id
                ? 'bg-[#0F1D2C] text-white shadow-sm'
                : 'text-[#0F1D2C]/50 hover:text-[#0F1D2C]/80'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SimulationCanvas
              photo={photos[0]}
              selectedPresets={autoPresets}
              intensity={intensity}
            />

            {/* Intensity slider */}
            <div className="max-w-xs mx-auto mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#0F1D2C]/50">
                <span>Subtle</span>
                <span className="font-medium text-[#0F1D2C]/70">Effect Strength</span>
                <span>Dramatic</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={intensity * 100}
                onChange={(e) => setIntensity(Number(e.target.value) / 100)}
                className="w-full h-1.5 bg-[#C9A96E]/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C9A96E] [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
          </motion.div>
        )}

        {phase === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TimelineProgression
              photo={photos[0]}
              treatments={analysis?.recommendations.map((r) => r.service.name) || []}
              skinAnalysis={analysis || undefined}
            />
          </motion.div>
        )}

        {phase === 'share' && (
          <motion.div
            key="share"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ShareableResult
              originalPhoto={photos[0]}
              simulatedPhoto=""
              clientName={clientName}
              concerns={(analysis?.concerns || []).map((c) => ({
                name: c.label,
                severity: c.score,
                area: c.areas?.[0],
              }))}
              recommendations={(analysis?.recommendations || []).map((r) => ({
                name: r.service.name,
                description: r.reason,
                price: `$${r.service.price}`,
              }))}
              skinScore={{
                current: analysis?.overallScore || 62,
                projected: analysis?.projectedScore || 89,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={resetSimulation}
          className="text-xs text-[#0F1D2C]/40 hover:text-[#0F1D2C]/70 font-medium transition-colors"
        >
          Upload different photo
        </button>
      </div>

      <SimulationDisclaimer />
    </div>
  );
}
