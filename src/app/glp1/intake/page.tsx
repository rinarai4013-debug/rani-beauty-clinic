'use client';

import { FormEvent, useMemo, useState } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics/events';
import {
  FULFILLMENT_OPTIONS,
  METABOLIC_TRACKS,
  METABOLIC_GOAL_OPTIONS,
  METABOLIC_SYMPTOM_OPTIONS,
  type MetabolicRecommendation,
  type FulfillmentOption,
  type MetabolicGoal,
  type MetabolicSymptom,
  type MetabolicTrack,
} from '@/lib/metabolic/matrix';
import type { MetabolicPackageOption, MetabolicTierKey } from '@/lib/metabolic/boomrx-matrix';
import type { DosagePlan } from '@/lib/metabolic/dosing-engine';
import type { TreatmentTrajectory } from '@/lib/metabolic/trajectory-engine';
import type { UnifiedIntakeDecisionBundle } from '@/lib/metabolic/unified-intake-engine';

const GOAL_LABELS: Record<MetabolicGoal, string> = {
  'weight-loss': 'Weight loss',
  'body-recomposition': 'Body recomposition',
  'metabolic-health': 'Metabolic health',
  'energy': 'Energy',
  'hormone-balance': 'Hormone balance',
  'recovery': 'Recovery',
  'longevity': 'Longevity',
  'performance': 'Performance',
};

const SYMPTOM_LABELS: Record<MetabolicSymptom, string> = {
  'appetite-dysregulation': 'Appetite dysregulation',
  'sugar-cravings': 'Sugar cravings',
  'weight-plateau': 'Weight plateau',
  'fatigue': 'Fatigue',
  'brain-fog': 'Brain fog',
  'low-libido': 'Low libido',
  'poor-sleep': 'Poor sleep',
  'mood-swings': 'Mood swings',
  'slow-recovery': 'Slow recovery',
  'inflammation': 'Inflammation',
  'muscle-loss': 'Muscle loss',
  'water-retention': 'Water retention',
  'gut-bloating': 'Gut bloating',
};

const FULFILLMENT_LABELS: Record<FulfillmentOption, string> = {
  clinic: 'In clinic',
  home: 'Ship to home',
};

const TRACK_LABELS: Record<MetabolicTrack, string> = {
  glp1: 'GLP-1',
  hormones: 'Hormones',
  peptides: 'Peptides',
  hybrid: 'Hybrid',
};

interface IntakeState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  goals: MetabolicGoal[];
  symptoms: MetabolicSymptom[];
  preferredTrack: MetabolicTrack | '';
  fulfillmentPreference: FulfillmentOption;
  timelineWeeks: string;
  currentMeds: string;
  notes: string;
  pregnant: boolean;
  breastfeeding: boolean;
  thyroidCancerHistory: boolean;
  pancreatitisHistory: boolean;
  baselineLabsCompleted: boolean;
}

interface IntakeResultPayload {
  recommendation: MetabolicRecommendation;
  packages: MetabolicPackageOption[];
  dosagePlan: DosagePlan;
  trajectory: TreatmentTrajectory;
  programBundle?: UnifiedIntakeDecisionBundle;
}

const initialState: IntakeState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  goals: [],
  symptoms: [],
  preferredTrack: '',
  fulfillmentPreference: 'clinic',
  timelineWeeks: '',
  currentMeds: '',
  notes: '',
  pregnant: false,
  breastfeeding: false,
  thyroidCancerHistory: false,
  pancreatitisHistory: false,
  baselineLabsCompleted: false,
};

export default function Glp1IntakePage() {
  const [form, setForm] = useState<IntakeState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResultPayload | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [selectionLoading, setSelectionLoading] = useState<string | null>(null);
  const [timelineMonth, setTimelineMonth] = useState(3);

  const canSubmit = useMemo(() => {
    return Boolean(
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.goals.length > 0 &&
      form.symptoms.length > 0,
    );
  }, [form]);

  function toggleGoal(goal: MetabolicGoal) {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  }

  function toggleSymptom(symptom: MetabolicSymptom) {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/metabolic/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          goals: form.goals,
          symptoms: form.symptoms,
          preferredTrack: form.preferredTrack || undefined,
          fulfillmentPreference: form.fulfillmentPreference,
          timelineWeeks: form.timelineWeeks ? Number(form.timelineWeeks) : undefined,
          currentMeds: form.currentMeds,
          notes: form.notes,
          source: 'website-metabolic-intake',
          medicalFlags: {
            pregnant: form.pregnant,
            breastfeeding: form.breastfeeding,
            thyroidCancerHistory: form.thyroidCancerHistory,
            pancreatitisHistory: form.pancreatitisHistory,
          },
          labs: {
            baselineLabsCompleted: form.baselineLabsCompleted,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to process intake');
      }

      setSelectionMessage(null);
      const trajectory = json.data.trajectory as TreatmentTrajectory;
      setResult({
        recommendation: json.data.recommendation as MetabolicRecommendation,
        packages: Array.isArray(json.data.packages) ? (json.data.packages as MetabolicPackageOption[]) : [],
        dosagePlan: json.data.dosagePlan as DosagePlan,
        trajectory,
        programBundle: json.data.programBundle as UnifiedIntakeDecisionBundle | undefined,
      });
      trackAnalyticsEvent('metabolic_intake_submitted', {
        track: json.data.recommendation?.recommendedTrack || 'glp1',
        goalsCount: form.goals.length,
        symptomsCount: form.symptoms.length,
        fulfillmentPreference: form.fulfillmentPreference,
      });
      setTimelineMonth(Math.min(3, Math.max(1, trajectory?.horizonMonths ?? 6)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const selectedTrajectory = useMemo(() => {
    if (!result) return null;
    const month = Math.min(Math.max(1, timelineMonth), result.trajectory.horizonMonths);
    return {
      month,
      withProtocol: result.trajectory.withProtocol.find((point) => point.month === month),
      withoutProtocol: result.trajectory.withoutProtocol.find((point) => point.month === month),
    };
  }, [result, timelineMonth]);

  async function requestProgram(
    packageOption: MetabolicPackageOption,
    mode: FulfillmentOption,
    recommendationStatus: MetabolicRecommendation['status'],
  ) {
    if (!result) return;
    if (recommendationStatus === 'ineligible') {
      setSelectionMessage(`${TRACK_LABELS[packageOption.track]} is currently ineligible. Provider review is required.`);
      return;
    }
    if (!packageOption.fulfillmentModes.includes(mode)) return;

    setSelectionLoading(`${packageOption.id}:${mode}`);
    setSelectionMessage(null);
    trackAnalyticsEvent('metabolic_fulfillment_selected', {
      track: packageOption.track,
      tier: packageOption.tier,
      fulfillment: mode,
      wasRecommended: mode === result.recommendation.fulfillment.recommended,
    });

    const goalsSummary = form.goals.map((goal) => GOAL_LABELS[goal]).join(', ');
    const symptomsSummary = form.symptoms.map((symptom) => SYMPTOM_LABELS[symptom]).join(', ');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
              service: `${TRACK_LABELS[packageOption.track]} ${packageOption.tier.toUpperCase()} Program`,
          message: [
            `Program Selected: ${packageOption.name}`,
            `Recommendation Status: ${recommendationStatus}`,
            `Fulfillment: ${mode}`,
            `Pulse Schedule: ${packageOption.pulseSchedule}`,
            `Dose Framework: ${packageOption.doseFramework}`,
            `Improvement Targets: ${packageOption.improvementTargets.join(', ')}`,
          ].join('\n'),
              source: 'metabolic-intake',
              recommendedTrack: packageOption.track,
              primaryRecommendedTrack: result.recommendation.recommendedTrack,
              protocolTier: packageOption.tier as MetabolicTierKey,
              fulfillmentPreference: mode,
              homeDeliveryRequested: mode === 'home',
          goalsSummary,
          symptomsSummary,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || 'Unable to submit your selection');
      }

      if (recommendationStatus === 'eligible') {
        trackAnalyticsEvent('metabolic_checkout_started', {
          track: packageOption.track,
          tier: packageOption.tier,
          fulfillment: mode,
        });
      } else if (recommendationStatus === 'provider-review-required') {
        trackAnalyticsEvent('metabolic_checkout_held_for_provider_review', {
          track: packageOption.track,
          tier: packageOption.tier,
          fulfillment: mode,
        });
      }

      setSelectionMessage(
        recommendationStatus === 'provider-review-required'
          ? 'Provider review request submitted. Checkout will unlock after clinical approval.'
          : mode === 'home'
            ? 'Home-delivery request submitted. Provider team will finalize and send your shipment workflow.'
            : 'In-clinic program request submitted. Concierge team will contact you to schedule.',
      );
    } catch (err) {
      setSelectionMessage(err instanceof Error ? err.message : 'Unable to submit selection right now.');
    } finally {
      setSelectionLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F1] py-10 px-4">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border border-[#C9A96E]/25 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C9A96E]">Rani Metabolic Matrix</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#0F1D2C]">Hormones + GLP-1 + Peptides Intake</h1>
          <p className="mt-2 text-sm text-[#0F1D2C]/70">
            Complete this once. We’ll generate a provider-ready 3-tier protocol with clinic vs home fulfillment guidance.
          </p>
        </header>

        <form onSubmit={onSubmit} className="rounded-2xl border border-[#0F1D2C]/10 bg-white p-6 space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <input className="rounded-xl border p-3" placeholder="First name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
            <input className="rounded-xl border p-3" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0F1D2C]">Goals</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {METABOLIC_GOAL_OPTIONS.map((goal) => {
                const active = form.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`rounded-full px-4 py-2 text-sm border ${active ? 'bg-[#C9A96E] text-[#0F1D2C] border-[#C9A96E]' : 'border-[#0F1D2C]/20 text-[#0F1D2C]/80'}`}
                  >
                    {GOAL_LABELS[goal]}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0F1D2C]">Symptoms</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {METABOLIC_SYMPTOM_OPTIONS.map((symptom) => {
                const active = form.symptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`rounded-full px-4 py-2 text-sm border ${active ? 'bg-[#C9A96E] text-[#0F1D2C] border-[#C9A96E]' : 'border-[#0F1D2C]/20 text-[#0F1D2C]/80'}`}
                  >
                    {SYMPTOM_LABELS[symptom]}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[#0F1D2C]/80">
              Preferred program track (optional)
              <select
                className="mt-1 w-full rounded-xl border p-3"
                value={form.preferredTrack}
                onChange={(e) => setForm((p) => ({ ...p, preferredTrack: e.target.value as MetabolicTrack | '' }))}
              >
                <option value="">Use AI recommendation</option>
                {METABOLIC_TRACKS.map((track) => (
                  <option key={track} value={track}>{TRACK_LABELS[track]}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[#0F1D2C]/80">
              Fulfillment preference
              <select
                className="mt-1 w-full rounded-xl border p-3"
                value={form.fulfillmentPreference}
                onChange={(e) => setForm((p) => ({ ...p, fulfillmentPreference: e.target.value as FulfillmentOption }))}
              >
                {FULFILLMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{FULFILLMENT_LABELS[opt]}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[#0F1D2C]/80">
              Desired timeline (weeks)
              <input
                className="mt-1 w-full rounded-xl border p-3"
                type="number"
                min={1}
                max={104}
                value={form.timelineWeeks}
                onChange={(e) => setForm((p) => ({ ...p, timelineWeeks: e.target.value }))}
              />
            </label>
          </section>

          <section className="grid gap-2 sm:grid-cols-2 text-sm text-[#0F1D2C]/85">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.pregnant} onChange={(e) => setForm((p) => ({ ...p, pregnant: e.target.checked }))} /> Pregnant</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.breastfeeding} onChange={(e) => setForm((p) => ({ ...p, breastfeeding: e.target.checked }))} /> Breastfeeding</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.thyroidCancerHistory} onChange={(e) => setForm((p) => ({ ...p, thyroidCancerHistory: e.target.checked }))} /> Thyroid cancer history</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.pancreatitisHistory} onChange={(e) => setForm((p) => ({ ...p, pancreatitisHistory: e.target.checked }))} /> Pancreatitis history</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.baselineLabsCompleted} onChange={(e) => setForm((p) => ({ ...p, baselineLabsCompleted: e.target.checked }))} /> Baseline labs completed</label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <textarea className="rounded-xl border p-3" rows={3} placeholder="Current medications" value={form.currentMeds} onChange={(e) => setForm((p) => ({ ...p, currentMeds: e.target.value }))} />
            <textarea className="rounded-xl border p-3" rows={3} placeholder="Additional notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="rounded-xl bg-[#0F1D2C] px-5 py-3 text-white disabled:opacity-50"
            >
              {loading ? 'Building your matrix...' : 'Generate my protocol tiers'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </form>

        {result && (
          <section className="rounded-2xl border border-[#C9A96E]/25 bg-white p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[#C9A96E]">Recommendation</p>
              <h2 className="text-2xl font-semibold text-[#0F1D2C]">{result.recommendation.recommendedTrack.toUpperCase()} Track</h2>
              <p className="text-sm text-[#0F1D2C]/70 mt-1">Status: {result.recommendation.status}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {result.recommendation.tiers.map((tier) => (
                <article key={tier.tier} className="rounded-xl border border-[#0F1D2C]/10 p-4">
                  <p className="text-xs uppercase text-[#C9A96E]">{tier.tier}</p>
                  <h3 className="font-semibold text-[#0F1D2C] mt-1">{tier.title}</h3>
                  <p className="text-sm text-[#0F1D2C]/70">{tier.monthlyEstimate}</p>
                  <ul className="mt-3 space-y-1 text-sm text-[#0F1D2C]/80">
                    {tier.protocol.slice(0, 3).map((line) => <li key={line}>- {line}</li>)}
                  </ul>
                </article>
              ))}
            </div>

            {result.packages.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#0F1D2C]">Choose your package path</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.packages.map((option) => (
                    <article key={option.id} className="rounded-xl border border-[#0F1D2C]/10 p-4 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-[#C9A96E]">{option.tier}</p>
                        <h4 className="text-base font-semibold text-[#0F1D2C]">{option.name}</h4>
                        <p className="text-sm text-[#0F1D2C]/70">{option.monthlyEstimate}</p>
                      </div>
                      <p className="text-xs text-[#0F1D2C]/70"><strong>Pulse:</strong> {option.pulseSchedule}</p>
                      <p className="text-xs text-[#0F1D2C]/70"><strong>Dose:</strong> {option.doseFramework}</p>
                      <p className="text-xs text-[#0F1D2C]/70"><strong>Improvement:</strong> {option.improvementTargets.join(', ')}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-[#0F1D2C]/20 px-3 py-2 text-xs text-[#0F1D2C] disabled:opacity-40"
                          onClick={() => requestProgram(option, 'clinic', result.recommendation.status)}
                          disabled={!option.fulfillmentModes.includes('clinic') || Boolean(selectionLoading)}
                        >
                          {selectionLoading === `${option.id}:clinic` ? 'Submitting...' : 'Do in clinic'}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-[#0F1D2C] px-3 py-2 text-xs text-white disabled:opacity-40"
                          onClick={() => requestProgram(option, 'home', result.recommendation.status)}
                          disabled={!option.fulfillmentModes.includes('home') || Boolean(selectionLoading)}
                        >
                          {selectionLoading === `${option.id}:home` ? 'Submitting...' : 'Ship to home'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {selectionMessage && (
                  <p className="rounded-lg bg-[#F8F6F1] px-3 py-2 text-sm text-[#0F1D2C]/80">{selectionMessage}</p>
                )}
              </div>
            )}

            {result.programBundle && result.programBundle.alternatives.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#0F1D2C]">
                  Cross-track matrix (for provider-approved upsell paths)
                </p>
                <div className="grid gap-3 lg:grid-cols-3">
                  {result.programBundle.alternatives.map((program) => (
                    <article key={program.track} className="rounded-xl border border-[#0F1D2C]/10 p-4 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-[#C9A96E]">
                          {TRACK_LABELS[program.track]}
                        </p>
                        <p className="text-xs text-[#0F1D2C]/65">
                          Status: {program.recommendation.status} · Fulfillment: {program.recommendation.fulfillment.recommended}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {program.packages.slice(0, 2).map((option) => (
                          <div key={option.id} className="rounded-lg border border-[#0F1D2C]/10 p-3">
                            <p className="text-xs uppercase text-[#C9A96E]">{option.tier}</p>
                            <p className="text-sm font-semibold text-[#0F1D2C]">{option.name}</p>
                            <p className="text-xs text-[#0F1D2C]/70">{option.monthlyEstimate}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                className="rounded-lg border border-[#0F1D2C]/20 px-2 py-1 text-[11px] text-[#0F1D2C] disabled:opacity-40"
                                onClick={() => requestProgram(option, 'clinic', program.recommendation.status)}
                                disabled={
                                  !option.fulfillmentModes.includes('clinic') ||
                                  Boolean(selectionLoading) ||
                                  program.recommendation.status === 'ineligible'
                                }
                              >
                                Clinic
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-[#0F1D2C] px-2 py-1 text-[11px] text-white disabled:opacity-40"
                                onClick={() => requestProgram(option, 'home', program.recommendation.status)}
                                disabled={
                                  !option.fulfillmentModes.includes('home') ||
                                  Boolean(selectionLoading) ||
                                  program.recommendation.status === 'ineligible'
                                }
                              >
                                Home
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-xl border border-[#0F1D2C]/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#0F1D2C]">Progress trajectory simulation</p>
                <p className="text-xs text-[#0F1D2C]/60">
                  Month {selectedTrajectory?.month ?? 1} of {result.trajectory.horizonMonths}
                </p>
              </div>

              <input
                type="range"
                min={1}
                max={result.trajectory.horizonMonths}
                step={1}
                value={selectedTrajectory?.month ?? 1}
                onChange={(e) => setTimelineMonth(Number(e.target.value))}
                className="w-full"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <article className="rounded-xl border border-[#C9A96E]/35 bg-[#FDF8ED] p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#C9A96E]">If they follow treatment</p>
                  <p className="mt-2 text-sm text-[#0F1D2C]/80">
                    Body composition progress: <strong>{selectedTrajectory?.withProtocol?.bodyCompositionProgressPct ?? 0}%</strong>
                  </p>
                  <p className="text-sm text-[#0F1D2C]/80">
                    Symptom relief: <strong>{selectedTrajectory?.withProtocol?.symptomReliefPct ?? 0}%</strong>
                  </p>
                  <p className="text-sm text-[#0F1D2C]/80">
                    Metabolic stability: <strong>{selectedTrajectory?.withProtocol?.metabolicStabilityPct ?? 0}%</strong>
                  </p>
                  <p className="mt-2 text-xs text-[#0F1D2C]/70">{selectedTrajectory?.withProtocol?.narrative}</p>
                </article>

                <article className="rounded-xl border border-[#0F1D2C]/15 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#0F1D2C]/65">If they do nothing</p>
                  <p className="mt-2 text-sm text-[#0F1D2C]/80">
                    Body composition progress: <strong>{selectedTrajectory?.withoutProtocol?.bodyCompositionProgressPct ?? 0}%</strong>
                  </p>
                  <p className="text-sm text-[#0F1D2C]/80">
                    Symptom relief: <strong>{selectedTrajectory?.withoutProtocol?.symptomReliefPct ?? 0}%</strong>
                  </p>
                  <p className="text-sm text-[#0F1D2C]/80">
                    Metabolic stability: <strong>{selectedTrajectory?.withoutProtocol?.metabolicStabilityPct ?? 0}%</strong>
                  </p>
                  <p className="mt-2 text-xs text-[#0F1D2C]/70">{selectedTrajectory?.withoutProtocol?.narrative}</p>
                </article>
              </div>

              <p className="text-xs text-[#0F1D2C]/65">{result.trajectory.comparisonSummary}</p>
            </div>

            <div className="space-y-3 rounded-xl border border-[#0F1D2C]/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0F1D2C]">Provider dosage governance plan</p>
                <p className="text-xs text-[#0F1D2C]/65">{result.dosagePlan.track.toUpperCase()} · {result.dosagePlan.tier.toUpperCase()}</p>
              </div>
              <p className="text-xs text-[#0F1D2C]/70"><strong>Start dose:</strong> {result.dosagePlan.startDose}</p>
              <p className="text-xs text-[#0F1D2C]/70"><strong>Pulse cadence:</strong> {result.dosagePlan.pulseCadence}</p>
              <p className="text-xs text-[#0F1D2C]/70"><strong>Monitoring labs:</strong> {result.dosagePlan.monitoringLabs.join(', ')}</p>
              <p className="text-xs text-[#0F1D2C]/70"><strong>Safety:</strong> {result.dosagePlan.safetyNote}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {result.dosagePlan.checkpoints.map((checkpoint) => (
                  <article key={`${checkpoint.week}-${checkpoint.label}`} className="rounded-lg border border-[#0F1D2C]/10 p-3">
                    <p className="text-xs font-semibold text-[#0F1D2C]">Week {checkpoint.week}: {checkpoint.label}</p>
                    <p className="mt-1 text-xs text-[#0F1D2C]/70"><strong>Target dose:</strong> {checkpoint.targetDose}</p>
                    <p className="text-xs text-[#0F1D2C]/70"><strong>Escalation gate:</strong> {checkpoint.escalationGate}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F6F1] p-4 text-sm text-[#0F1D2C]/80">
              <p><strong>Fulfillment:</strong> {result.recommendation.fulfillment.recommended} (allowed: {result.recommendation.fulfillment.allowed.join(', ')})</p>
              <p className="mt-1"><strong>Reason:</strong> {result.recommendation.fulfillment.reason}</p>
              {result.recommendation.riskFlags.length > 0 && (
                <p className="mt-2"><strong>Risk Flags:</strong> {result.recommendation.riskFlags.join(' | ')}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
