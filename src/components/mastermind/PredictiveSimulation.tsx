'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type {
  SimulationComparison,
  AuraScanResult,
  MastermindPlan,
  MastermindTreatment,
} from '@/types/mastermind';
import {
  SIMULATION_SERVICE_SCOPES,
  generateSimulationComparison,
} from '@/lib/mastermind/simulation-engine';
import TimelineScrubber from './TimelineScrubber';
import SimulationMetrics from './SimulationMetrics';
import SimulationDisclaimer from '@/components/photo-simulation/SimulationDisclaimer';
import { trackAnalyticsEvent } from '@/lib/analytics/events';

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
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('all');
  const [scenarioMode, setScenarioMode] = useState<'conservative' | 'typical' | 'aggressive'>('typical');

  const selectableTreatments = useMemo(() => {
    if (!plan) return [] as MastermindTreatment[];
    const seen = new Set<string>();
    const combined = [
      ...(plan.recommendations.primary || []),
      ...(plan.recommendations.complementary || []),
      ...(plan.recommendations.maintenance || []),
    ];
    const unique: MastermindTreatment[] = [];
    for (const treatment of combined) {
      if (seen.has(treatment.id)) continue;
      seen.add(treatment.id);
      unique.push(treatment);
    }
    return unique;
  }, [plan]);

  const serviceScopeLabelMap = useMemo(
    () => new Map(SIMULATION_SERVICE_SCOPES.map((scope) => [scope.id, scope.label])),
    [],
  );

  const selectedTreatmentIds = selectedTreatmentId === 'all' ? undefined : [selectedTreatmentId];
  const isServiceScopeSelection = selectedTreatmentId.startsWith('preset:');
  const selectedTreatment = selectedTreatmentId === 'all'
    ? null
    : selectableTreatments.find((t) => t.id === selectedTreatmentId) || null;

  const hasContraindicationConflict = Boolean(
    !isServiceScopeSelection &&
    selectedTreatment &&
    selectedTreatment.contraindications?.length &&
    scanResult.medicalFlags?.some((flag) => {
      const related = (flag.relatedTreatments || []).map((t) => t.toLowerCase());
      const treatmentId = selectedTreatment.id.toLowerCase();
      const treatmentName = selectedTreatment.treatmentName.toLowerCase();
      return related.some((r) => treatmentId.includes(r) || treatmentName.includes(r) || r.includes(treatmentId));
    }),
  );

  // Generate simulation on mount and whenever the selected scope changes
  useEffect(() => {
    if (!sourcePhotoDataUrl) return;
    if (hasContraindicationConflict) {
      setComparison(null);
      setError(
        'Selected treatment is flagged by medical contraindications for this session. Switch to full-plan simulation or complete provider review.',
      );
      return;
    }

    (async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateSimulationComparison({
          sourceImageDataUrl: sourcePhotoDataUrl,
          scanResult,
          plan,
          selectedTreatmentIds,
          scenarioMode,
        });
        setComparison(result);
        setWithIndex(0);
        setWithoutIndex(0);
      } catch (err) {
        console.error('Simulation generation failed:', err);
        setError('Failed to generate simulation. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    })();
  }, [sourcePhotoDataUrl, scanResult, plan, selectedTreatmentId, scenarioMode, hasContraindicationConflict]);

  const handleRegenerate = useCallback(async () => {
    if (!sourcePhotoDataUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateSimulationComparison({
        sourceImageDataUrl: sourcePhotoDataUrl,
        scanResult,
        plan,
        selectedTreatmentIds,
        scenarioMode,
      });
      setComparison(result);
      setWithIndex(0);
      setWithoutIndex(0);
    } catch {
      setError('Regeneration failed.');
    } finally {
      setIsGenerating(false);
    }
  }, [sourcePhotoDataUrl, scanResult, plan, selectedTreatmentId, scenarioMode]);

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
          <Loader2 className="w-10 h-10 text-[#C9A96E] animate-spin" />
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

      {selectableTreatments.length > 0 && (
        <div className="rounded-xl border border-[#0F1D2C]/10 bg-white p-4">
          <label className="block text-xs uppercase tracking-[0.08em] text-[#0F1D2C]/60 mb-2">
            Simulation scope
          </label>
          <select
            value={selectedTreatmentId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTreatmentId(value);
              trackAnalyticsEvent('pricing_interaction', {
                interaction_type: 'simulation_scope_switch',
              service_name:
                value === 'all'
                  ? 'full-plan'
                  : serviceScopeLabelMap.get(value) || value,
              plan_id: plan?.planId,
            });
              if (value !== 'all') {
                trackAnalyticsEvent('plan_tier_selected', {
                  tier: scenarioMode,
                  service_name: value,
                  plan_id: plan?.planId,
                });
              }
            }}
            className="w-full rounded-lg border border-[#0F1D2C]/20 bg-[#F8F6F1] px-3 py-2 text-sm text-[#0F1D2C]"
          >
            <option value="all">Full plan (all selected treatments)</option>
            <optgroup label="Core service projections">
              {SIMULATION_SERVICE_SCOPES.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.label}
                </option>
              ))}
            </optgroup>
            {selectableTreatments.length > 0 && (
              <optgroup label="Current plan treatments">
                {selectableTreatments.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.treatmentName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="mt-2 text-xs text-[#0F1D2C]/50">
            Switch between full-plan simulation and single-treatment projection during consults.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[#0F1D2C]/10 bg-white p-4">
        <label className="block text-xs uppercase tracking-[0.08em] text-[#0F1D2C]/60 mb-2">
          Scenario mode
        </label>
        <select
          value={scenarioMode}
          onChange={(e) => {
            const mode = e.target.value as 'conservative' | 'typical' | 'aggressive';
            setScenarioMode(mode);
            trackAnalyticsEvent('pricing_interaction', {
              interaction_type: 'simulation_scenario_switch',
              tier: mode,
              service_name: selectedTreatmentId === 'all' ? 'full-plan' : selectedTreatmentId,
              plan_id: plan?.planId,
            });
          }}
          className="w-full rounded-lg border border-[#0F1D2C]/20 bg-[#F8F6F1] px-3 py-2 text-sm text-[#0F1D2C]"
        >
          <option value="conservative">Conservative (slower/safer trajectory)</option>
          <option value="typical">Typical (balanced trajectory)</option>
          <option value="aggressive">Aggressive (faster trajectory)</option>
        </select>
      </div>

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
              )}
            </AnimatePresence>

            {/* Timepoint badge */}
            {currentWithFrame && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#059669] text-white font-body text-xs font-medium">
                {currentWithFrame.timepoint}
              </div>
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
              )}
            </AnimatePresence>

            {/* Timepoint badge */}
            {currentWithoutFrame && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#DC2626] text-white font-body text-xs font-medium">
                {currentWithoutFrame.timepoint}
              </div>
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
