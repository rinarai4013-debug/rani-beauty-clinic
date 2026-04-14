'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics/events';
import {
  PEPTIDE_GOAL_OPTIONS,
  PEPTIDE_SYMPTOM_OPTIONS,
  type PeptideGoal,
  type PeptideSymptom,
} from '@/lib/metabolic/peptide-intake-schema';
import type { MetabolicTrack } from '@/lib/metabolic/matrix';
import type { MetabolicPackageOption } from '@/lib/metabolic/boomrx-matrix';
import type {
  PeptidePackageTier,
  PeptideRecommendation,
} from '@/lib/metabolic/peptide-tier-matrix';

type Fulfillment = 'clinic' | 'home';

const GOAL_LABELS: Record<PeptideGoal, string> = {
  recovery: 'Recovery',
  performance: 'Performance',
  longevity: 'Longevity',
  'body-recomposition': 'Body Recomposition',
  'gut-health': 'Gut Health',
  'skin-rejuvenation': 'Skin Rejuvenation',
  'injury-repair': 'Injury Repair',
  'immune-support': 'Immune Support',
};

const SYMPTOM_LABELS: Record<PeptideSymptom, string> = {
  'slow-recovery': 'Slow Recovery',
  inflammation: 'Inflammation',
  'gut-bloating': 'Gut Bloating',
  'poor-sleep': 'Poor Sleep',
  fatigue: 'Fatigue',
  'muscle-loss': 'Muscle Loss',
  'joint-pain': 'Joint Pain',
  'post-surgical-healing': 'Post-Surgical Healing',
  'tendon-injury': 'Tendon Injury',
  'skin-dullness': 'Skin Dullness',
  'hair-thinning': 'Hair Thinning',
  'immune-fragility': 'Immune Fragility',
};

const TRACK_LABELS: Record<MetabolicTrack, string> = {
  glp1: 'GLP-1',
  hormones: 'Hormones',
  peptides: 'Peptides',
  hybrid: 'Hybrid',
};

interface IntakeFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  goals: PeptideGoal[];
  symptoms: PeptideSymptom[];
  fulfillmentPreference: Fulfillment;
  currentMeds: string;
  pregnant: boolean;
  breastfeeding: boolean;
  activeCancer: boolean;
  organTransplant: boolean;
  autoimmuneSuppressed: boolean;
  activeInfection: boolean;
  bleedingDisorder: boolean;
  baselineLabsCompleted: boolean;
}

interface IntakeResponse {
  recommendation: PeptideRecommendation;
  dosage: {
    tier: string;
    fulfillment: string;
    doseLines: Array<{ compound: string; startingDose: string; cadence: string; cycleLength: string; escalationGate: string }>;
    holdCriteria: string[];
  };
  crossSellBundle?: {
    primaryTrack: MetabolicTrack;
    alternatives: Array<{
      track: MetabolicTrack;
      recommendation: {
        status: 'eligible' | 'provider-review-required' | 'ineligible';
        fulfillment: {
          recommended: Fulfillment;
          allowed: Fulfillment[];
        };
      };
      packages: MetabolicPackageOption[];
      checkout: {
        clinic: string;
        home: string;
      };
    }>;
  };
}

const INITIAL_STATE: IntakeFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  goals: [],
  symptoms: [],
  fulfillmentPreference: 'clinic',
  currentMeds: '',
  pregnant: false,
  breastfeeding: false,
  activeCancer: false,
  organTransplant: false,
  autoimmuneSuppressed: false,
  activeInfection: false,
  bleedingDisorder: false,
  baselineLabsCompleted: false,
};

const STEP_NAMES = ['identity', 'goals-symptoms', 'safety-fulfillment'] as const;

export default function PeptideIntakePage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<IntakeFormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedFulfillment, setSelectedFulfillment] = useState<Fulfillment>('clinic');
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);

  const startedAtRef = useRef(Date.now());
  const stepStartedAtRef = useRef(Date.now());
  const stepIndexRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    trackAnalyticsEvent('peptide_intake_started', {
      source: 'website-peptide-intake',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }, []);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    const startedAt = startedAtRef.current;
    return () => {
      if (!submittedRef.current) {
        trackAnalyticsEvent('peptide_intake_abandoned', {
          lastStep: stepIndexRef.current + 1,
          timeOnForm: Math.round((Date.now() - startedAt) / 1000),
        });
      }
    };
  }, []);

  const canContinue = useMemo(() => {
    if (stepIndex === 0) {
      return Boolean(form.firstName.trim() && form.lastName.trim() && form.email.trim());
    }
    if (stepIndex === 1) {
      return form.goals.length > 0 && form.symptoms.length > 0;
    }
    return true;
  }, [form, stepIndex]);

  const recommendationTiers: PeptidePackageTier[] = result?.recommendation?.tiers ?? [];
  const activeTier =
    recommendationTiers.find((tier) => tier.tier === selectedTier) ?? recommendationTiers[0] ?? null;
  const dosage = result?.dosage;

  useEffect(() => {
    if (!result) return;
    setSelectedTier(result.recommendation.recommendedTier);
    setSelectedFulfillment(result.recommendation.fulfillment.recommended);
    trackAnalyticsEvent('peptide_recommendation_viewed', {
      recommendedTier: result.recommendation.recommendedTier,
      status: result.recommendation.status,
      fulfillment: result.recommendation.fulfillment.recommended,
    });
  }, [result]);

  const moveStep = (next: number) => {
    if (next === stepIndex) return;
    trackAnalyticsEvent('peptide_intake_step_completed', {
      step: stepIndex + 1,
      stepName: STEP_NAMES[stepIndex],
      timeOnStep: Math.round((Date.now() - stepStartedAtRef.current) / 1000),
    });
    setStepIndex(next);
    stepStartedAtRef.current = Date.now();
  };

  function toggleGoal(goal: PeptideGoal) {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((item) => item !== goal)
        : [...prev.goals, goal],
    }));
  }

  function toggleSymptom(symptom: PeptideSymptom) {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((item) => item !== symptom)
        : [...prev.symptoms, symptom],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSelectionMessage(null);

    trackAnalyticsEvent('peptide_intake_submitted', {
      goals: form.goals.join(','),
      symptoms: form.symptoms.join(','),
      fulfillmentPreference: form.fulfillmentPreference,
    });

    try {
      const response = await fetch('/api/peptide/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          goals: form.goals,
          symptoms: form.symptoms,
          fulfillmentPreference: form.fulfillmentPreference,
          currentMeds: form.currentMeds,
          medicalFlags: {
            pregnant: form.pregnant,
            breastfeeding: form.breastfeeding,
            activeCancer: form.activeCancer,
            organTransplant: form.organTransplant,
            autoimmuneSuppressed: form.autoimmuneSuppressed,
            activeInfection: form.activeInfection,
            bleedingDisorder: form.bleedingDisorder,
          },
          labs: {
            baselineLabsCompleted: form.baselineLabsCompleted,
          },
          source: 'website-peptide-intake',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Unable to process intake right now');
      }

      submittedRef.current = true;
      setResult({
        recommendation: payload.data.recommendation as PeptideRecommendation,
        dosage: payload.data.dosage as IntakeResponse['dosage'],
        crossSellBundle: payload.data.crossSellBundle as IntakeResponse['crossSellBundle'],
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit form');
    } finally {
      setSubmitting(false);
    }
  }

  async function startCheckout(mode: Fulfillment) {
    if (!result || !activeTier) return;
    if (result.recommendation.status === 'ineligible') {
      setSelectionMessage('This protocol is ineligible from intake flags. A provider must review next steps.');
      return;
    }
    if (!activeTier.fulfillmentAllowed.includes(mode)) {
      const allowed = activeTier.fulfillmentAllowed.join(' or ');
      setSelectionMessage(
        `${mode === 'home' ? 'Home' : 'Clinic'} fulfillment is not available for this tier. Choose ${allowed} or submit for provider review.`,
      );
      return;
    }
    setSelectionLoading(true);
    setSelectionMessage(null);
    trackAnalyticsEvent('peptide_fulfillment_selected', {
      fulfillment: mode,
      wasRecommended: mode === result.recommendation.fulfillment.recommended,
    });

    try {
      const messageLines = [
        `Peptide Tier: ${activeTier.tier}`,
        `Compounds: ${activeTier.compounds.join(', ')}`,
        `Recommendation Status: ${result.recommendation.status}`,
        `Fulfillment: ${mode}`,
        dosage
          ? `Dose Start: ${dosage.doseLines.map((line) => `${line.compound}: ${line.startingDose}`).join(' | ')}`
          : null,
      ].filter(Boolean);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          service: `Peptide ${activeTier.tier} program`,
          message: messageLines.join('\n'),
          source: 'website-peptide-intake',
          recommendedTrack: 'peptides',
          protocolTier:
            activeTier.tier === 'foundation'
              ? 'start'
              : activeTier.tier === 'performance'
                ? 'transform'
                : 'elite',
          fulfillmentPreference: mode,
          homeDeliveryRequested: mode === 'home',
          goalsSummary: form.goals.join(', '),
          symptomsSummary: form.symptoms.join(', '),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Unable to submit checkout handoff');
      }

      if (result.recommendation.status === 'eligible') {
        trackAnalyticsEvent('peptide_checkout_started', {
          tier: activeTier.tier,
          fulfillment: mode,
          track: 'peptides',
        });
      } else if (result.recommendation.status === 'provider-review-required') {
        trackAnalyticsEvent('peptide_checkout_held_for_provider_review', {
          tier: activeTier.tier,
          fulfillment: mode,
          track: 'peptides',
        });
      }

      setSelectionMessage(
        result.recommendation.status === 'provider-review-required'
          ? 'Provider review request submitted. Checkout unlocks after clinical approval. Our provider team will contact you with next steps.'
          : mode === 'home'
            ? 'Home fulfillment handoff submitted. Provider team will finalize shipment steps.'
            : 'Clinic fulfillment handoff submitted. Concierge will schedule your onboarding.',
      );
    } catch (checkoutError) {
      setSelectionMessage(checkoutError instanceof Error ? checkoutError.message : 'Checkout handoff failed');
    } finally {
      setSelectionLoading(false);
    }
  }

  async function startCrossTrackCheckout(
    track: MetabolicTrack,
    option: MetabolicPackageOption,
    mode: Fulfillment,
    checkoutUrl: string,
    recommendationStatus: 'eligible' | 'provider-review-required' | 'ineligible',
  ) {
    if (recommendationStatus === 'ineligible') {
      setSelectionMessage(`${TRACK_LABELS[track]} is currently ineligible. Provider review is required.`);
      return;
    }
    if (!option.fulfillmentModes.includes(mode)) {
      const allowed = option.fulfillmentModes.join(' or ');
      setSelectionMessage(
        `${mode === 'home' ? 'Home' : 'Clinic'} fulfillment is not available for ${TRACK_LABELS[track]}. Choose ${allowed} or submit for provider review.`,
      );
      return;
    }
    setSelectionLoading(true);
    setSelectionMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          service: `${TRACK_LABELS[track]} ${option.tier.toUpperCase()} Program`,
          message: [
            `Track: ${TRACK_LABELS[track]}`,
            `Program: ${option.name}`,
            `Recommendation Status: ${recommendationStatus}`,
            `Fulfillment: ${mode}`,
            `Pulse Schedule: ${option.pulseSchedule}`,
            `Dose Framework: ${option.doseFramework}`,
            `Improvement Targets: ${option.improvementTargets.join(', ')}`,
          ].join('\n'),
          source: 'website-peptide-intake',
          recommendedTrack: track,
          protocolTier: option.tier,
          fulfillmentPreference: mode,
          homeDeliveryRequested: mode === 'home',
          goalsSummary: form.goals.join(', '),
          symptomsSummary: form.symptoms.join(', '),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Unable to submit cross-track handoff');
      }

      if (recommendationStatus === 'eligible') {
        setSelectionMessage(`Cross-track handoff submitted for ${TRACK_LABELS[track]}. Opening checkout...`);
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        setSelectionMessage(
          `${TRACK_LABELS[track]} request submitted for provider review. Checkout opens after approval, and our team will contact you with next steps.`,
        );
      }
    } catch (submitError) {
      setSelectionMessage(
        submitError instanceof Error ? submitError.message : 'Unable to submit cross-track request',
      );
    } finally {
      setSelectionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F1] py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-[#C9A96E]/30 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[#C9A96E]">Rani Peptide Matrix</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#0F1D2C]">Peptide Intake + Provider-Ready Protocol</h1>
          <p className="mt-2 text-sm text-[#0F1D2C]/70">
            Complete this intake to receive a safety-gated tier recommendation with clinic vs home fulfillment.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#0F1D2C]/10 bg-white p-6 space-y-6">
          {stepIndex === 0 && (
            <section className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl border p-3" placeholder="First name" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
              <input className="rounded-xl border p-3" placeholder="Last name" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
              <input className="rounded-xl border p-3" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              <input className="rounded-xl border p-3" placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </section>
          )}

          {stepIndex === 1 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[#0F1D2C]">Goals</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PEPTIDE_GOAL_OPTIONS.map((goal) => {
                    const active = form.goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                          active
                            ? 'bg-[#C9A96E] text-[#0F1D2C] border-[#C9A96E]'
                            : 'border-[#0F1D2C]/20 text-[#0F1D2C]/75'
                        }`}
                      >
                        {GOAL_LABELS[goal]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#0F1D2C]">Symptoms</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PEPTIDE_SYMPTOM_OPTIONS.map((symptom) => {
                    const active = form.symptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                          active
                            ? 'bg-[#C9A96E] text-[#0F1D2C] border-[#C9A96E]'
                            : 'border-[#0F1D2C]/20 text-[#0F1D2C]/75'
                        }`}
                      >
                        {SYMPTOM_LABELS[symptom]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {stepIndex === 2 && (
            <section className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 text-sm text-[#0F1D2C]/85">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.pregnant} onChange={(e) => setForm((prev) => ({ ...prev, pregnant: e.target.checked }))} /> Pregnant</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.breastfeeding} onChange={(e) => setForm((prev) => ({ ...prev, breastfeeding: e.target.checked }))} /> Breastfeeding</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.activeCancer} onChange={(e) => setForm((prev) => ({ ...prev, activeCancer: e.target.checked }))} /> Active cancer</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.organTransplant} onChange={(e) => setForm((prev) => ({ ...prev, organTransplant: e.target.checked }))} /> Organ transplant</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.autoimmuneSuppressed} onChange={(e) => setForm((prev) => ({ ...prev, autoimmuneSuppressed: e.target.checked }))} /> Autoimmune suppressed</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.activeInfection} onChange={(e) => setForm((prev) => ({ ...prev, activeInfection: e.target.checked }))} /> Active infection</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.bleedingDisorder} onChange={(e) => setForm((prev) => ({ ...prev, bleedingDisorder: e.target.checked }))} /> Bleeding disorder</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.baselineLabsCompleted} onChange={(e) => setForm((prev) => ({ ...prev, baselineLabsCompleted: e.target.checked }))} /> Baseline labs completed</label>
              </div>

              <label className="block text-sm text-[#0F1D2C]/80">
                Fulfillment preference
                <select
                  className="mt-1 w-full rounded-xl border p-3"
                  value={form.fulfillmentPreference}
                  onChange={(e) => setForm((prev) => ({ ...prev, fulfillmentPreference: e.target.value as Fulfillment }))}
                >
                  <option value="clinic">Clinic administration</option>
                  <option value="home">Home administration</option>
                </select>
              </label>

              <textarea
                className="w-full rounded-xl border p-3 text-sm"
                placeholder="Current medications (optional)"
                value={form.currentMeds}
                onChange={(e) => setForm((prev) => ({ ...prev, currentMeds: e.target.value }))}
                rows={3}
              />
            </section>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveStep(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
            >
              Back
            </button>
            {stepIndex < 2 ? (
              <button
                type="button"
                onClick={() => moveStep(stepIndex + 1)}
                disabled={!canContinue}
                className="px-5 py-2 rounded-lg bg-[#C9A96E] text-[#0F1D2C] text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !canContinue}
                className="px-5 py-2 rounded-lg bg-[#0F1D2C] text-white text-sm font-semibold disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Generate recommendation'}
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        {result && (
          <section className="rounded-2xl border border-[#0F1D2C]/10 bg-white p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#0F1D2C]">
                Recommended: {result.recommendation.recommendedTier.toUpperCase()} ({result.recommendation.status})
              </h2>
              <div className="inline-flex rounded-lg border border-[#0F1D2C]/15 overflow-hidden">
                {(['clinic', 'home'] as const).map((mode) => {
                  const allowed = result.recommendation.fulfillment.allowed.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={!allowed}
                      onClick={() => {
                        setSelectedFulfillment(mode);
                        trackAnalyticsEvent('peptide_fulfillment_selected', {
                          fulfillment: mode,
                          wasRecommended: mode === result.recommendation.fulfillment.recommended,
                        });
                      }}
                      className={`px-3 py-2 text-xs ${
                        !allowed
                          ? 'text-[#0F1D2C]/30 bg-[#F8F6F1]'
                          : selectedFulfillment === mode
                            ? 'bg-[#C9A96E] text-[#0F1D2C] font-semibold'
                            : 'bg-white text-[#0F1D2C]/70'
                      }`}
                    >
                      {mode === 'clinic' ? 'Clinic' : 'Home'}
                    </button>
                  );
                })}
              </div>
            </div>

            {result.recommendation.riskFlags.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {result.recommendation.riskFlags.map((flag) => (
                  <p key={flag}>• {flag}</p>
                ))}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              {recommendationTiers.map((tier) => {
                const selected = (selectedTier || result.recommendation.recommendedTier) === tier.tier;
                const available = tier.fulfillmentAllowed.includes(selectedFulfillment);
                return (
                  <button
                    key={tier.tier}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tier.tier);
                      trackAnalyticsEvent('peptide_tier_selected', {
                        tier: tier.tier,
                        monthlyEstimate: tier.monthlyEstimate,
                      });
                    }}
                    className={`text-left rounded-xl border p-4 ${
                      selected ? 'border-[#C9A96E] bg-[#C9A96E]/10' : 'border-[#0F1D2C]/10 bg-white'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-[#C9A96E]">{tier.tier}</p>
                    <p className="mt-1 font-semibold text-[#0F1D2C]">{tier.name}</p>
                    <p className="text-sm text-[#0F1D2C]/70">{tier.monthlyEstimate}</p>
                    {!available && (
                      <p className="text-xs text-red-600 mt-1">Not available for selected fulfillment</p>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTier && (
              <div className="rounded-xl border border-[#0F1D2C]/10 bg-[#F8F6F1] p-4 space-y-2">
                <p className="text-sm font-semibold text-[#0F1D2C]">Protocol summary</p>
                <p className="text-sm text-[#0F1D2C]/70">Compounds: {activeTier.compounds.join(', ')}</p>
                {dosage && (
                  <p className="text-sm text-[#0F1D2C]/70">
                    Dosing: {dosage.doseLines.map((line) => `${line.compound}: ${line.startingDose}`).join(' | ')}
                  </p>
                )}
              </div>
            )}

            {result.crossSellBundle && result.crossSellBundle.alternatives.length > 0 && (
              <div className="rounded-xl border border-[#0F1D2C]/10 bg-white p-4 space-y-3">
                <p className="text-sm font-semibold text-[#0F1D2C]">
                  Also eligible for these provider-reviewed tracks
                </p>
                <div className="grid gap-3 lg:grid-cols-3">
                  {result.crossSellBundle.alternatives.map((program) => (
                    <article key={program.track} className="rounded-lg border border-[#0F1D2C]/10 p-3 space-y-2">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#C9A96E]">
                        {TRACK_LABELS[program.track]}
                      </p>
                      <p className="text-xs text-[#0F1D2C]/70">
                        Status: {program.recommendation.status}
                      </p>
                      {program.packages.slice(0, 1).map((option) => (
                        <div key={option.id} className="space-y-2">
                          <p className="text-sm font-semibold text-[#0F1D2C]">{option.name}</p>
                          <p className="text-xs text-[#0F1D2C]/70">{option.monthlyEstimate}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-[#0F1D2C]/20 px-2 py-1 text-[11px] text-[#0F1D2C] disabled:opacity-40"
                              onClick={() =>
                                startCrossTrackCheckout(
                                  program.track,
                                  option,
                                  'clinic',
                                  program.checkout.clinic,
                                  program.recommendation.status,
                                )
                              }
                              disabled={
                                !option.fulfillmentModes.includes('clinic') ||
                                selectionLoading ||
                                program.recommendation.status === 'ineligible'
                              }
                            >
                              Clinic
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-[#0F1D2C] px-2 py-1 text-[11px] text-white disabled:opacity-40"
                              onClick={() =>
                                startCrossTrackCheckout(
                                  program.track,
                                  option,
                                  'home',
                                  program.checkout.home,
                                  program.recommendation.status,
                                )
                              }
                              disabled={
                                !option.fulfillmentModes.includes('home') ||
                                selectionLoading ||
                                program.recommendation.status === 'ineligible'
                              }
                            >
                              Home
                            </button>
                          </div>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startCheckout(selectedFulfillment)}
                disabled={selectionLoading || !activeTier}
                className="px-5 py-2 rounded-lg bg-[#059669] text-white text-sm font-semibold disabled:opacity-40"
              >
                {selectionLoading
                  ? 'Submitting...'
                  : selectedFulfillment === 'home'
                    ? 'Start home checkout'
                    : 'Start clinic checkout'}
              </button>
              {selectionMessage && <p className="text-sm text-[#0F1D2C]/70">{selectionMessage}</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
