'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle,
  CreditCard,
  Star,
  Crown,
  Check,
  Shield,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Phone,
  Lock,
} from 'lucide-react';

import PhotoSimulation from '@/components/photo-simulation/PhotoSimulation';
import { clinicInfo } from '@/data/clinic-info';
import { getCareInstructions } from '@/lib/plan-builder/aftercare-map';
import {
  parseProgramPlan,
  parseCostBreakdown,
  parseTimeline,
  buildPackagesFromAI,
  buildFallbackPackages,
  extractTotalValue,
} from '@/lib/treatment-plan/parser';
import type { PlanData, TreatmentPackage } from '@/lib/treatment-plan/parser';

interface TreatmentPlanClientProps {
  planId: string;
}

type ViewState =
  | { status: 'loading' }
  | { status: 'code_required' }
  | { status: 'error'; message: string }
  | { status: 'expired'; message: string }
  | { status: 'ready'; plan: PlanData; packages: TreatmentPackage[] };

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function TreatmentPlanClient({ planId }: TreatmentPlanClientProps) {
  const [viewState, setViewState] = useState<ViewState>({ status: 'loading' });
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const trackAction = (action: string) => {
    fetch(`/api/plan/${planId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, action, code: accessCode }),
    }).catch(() => {}); // fire and forget
  };

  const fetchPlan = async (code?: string) => {
    setViewState({ status: 'loading' });
    try {
      const url = code
        ? `/api/plan/${planId}?code=${encodeURIComponent(code)}`
        : `/api/plan/${planId}`;
      const res = await fetch(url);

      if (res.status === 403) {
        setViewState({ status: 'code_required' });
        if (code) setCodeError(true);
        return;
      }
      if (res.status === 410) {
        const data = await res.json();
        setViewState({ status: 'expired', message: data.message });
        return;
      }
      if (!res.ok) throw new Error('Failed to load');

      const data = await res.json();
      const plan = data.plan as PlanData;

      let packages: TreatmentPackage[];
      try {
        packages = buildPackagesFromAI(plan);
        if (packages.length === 0) packages = buildFallbackPackages(plan);
      } catch {
        packages = buildFallbackPackages(plan);
      }

      setViewState({ status: 'ready', plan, packages });
    } catch {
      setViewState({ status: 'error', message: 'Unable to load your treatment plan. Please try again or contact us.' });
    }
  };

  useEffect(() => {
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(false);
    fetchPlan(accessCode);
  };

  // Access Code Screen
  if (viewState.status === 'code_required') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
        <motion.div {...fadeIn} className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-[#C9A96E]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#0F1D2C] mb-2">
            Your Treatment Plan
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter the 6-digit access code sent to your email or phone to view your personalized plan.
          </p>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={accessCode}
              onChange={(e) => { setAccessCode(e.target.value.replace(/\D/g, '')); setCodeError(false); }}
              placeholder="000000"
              className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border-2 rounded-xl outline-none font-mono ${
                codeError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#C9A96E]'
              }`}
              aria-label="Access code"
              autoFocus
            />
            {codeError && (
              <p className="text-sm text-red-500">Invalid code. Please check and try again.</p>
            )}
            <button
              type="submit"
              disabled={accessCode.length !== 6}
              className="w-full py-3 bg-[#0F1D2C] text-white rounded-xl font-medium hover:bg-[#1A2A3C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              View My Plan
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-4">
            Questions? Call us at{' '}
            <a href={clinicInfo.phoneTel} className="text-[#C9A96E] hover:underline">
              {clinicInfo.phone}
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (viewState.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your treatment plan...</p>
        </div>
      </div>
    );
  }

  // Error / Expired
  if (viewState.status === 'error' || viewState.status === 'expired') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
        <motion.div {...fadeIn} className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold text-[#0F1D2C] mb-2">
            {viewState.status === 'expired' ? 'Plan Expired' : 'Something Went Wrong'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">{viewState.message}</p>
          <a
            href={clinicInfo.phoneTel}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1D2C] text-white rounded-xl font-medium hover:bg-[#1A2A3C] transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call {clinicInfo.phone}
          </a>
        </motion.div>
      </div>
    );
  }

  const { plan, packages } = viewState;
  const totalValue = extractTotalValue(plan);
  const parsedPhases = plan.programPlan ? parseProgramPlan(plan.programPlan) : null;
  const parsedTimeline = plan.timeline ? parseTimeline(plan.timeline) : [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] print:bg-white">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0F1D2C] to-[#1A2A3C] text-white py-12 px-4 print:bg-[#0F1D2C] print:py-6">
        <motion.div {...fadeIn} className="max-w-3xl mx-auto text-center">
          <p className="text-[#C9A96E] text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            {clinicInfo.name}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
            Your Personalized Treatment Plan
          </h1>
          <p className="text-white/70 text-lg mb-4">
            Crafted for{' '}
            <span className="text-[#C9A96E] font-semibold">
              {plan.firstName || plan.clientName}
            </span>
          </p>
          {plan.skinConcerns && plan.skinConcerns.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {plan.skinConcerns.map((concern) => (
                <span
                  key={concern}
                  className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/80"
                >
                  {concern}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10 print:space-y-6">
        {/* Photo Simulation */}
        <motion.section {...fadeIn} className="print:hidden">
          <button
            onClick={() => setShowSimulation(!showSimulation)}
            className="w-full flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#C9A96E]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#0F1D2C]">See Your Transformation</p>
                <p className="text-xs text-gray-500">Upload a selfie to preview your results</p>
              </div>
            </div>
            {showSimulation ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showSimulation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 bg-white rounded-xl border border-gray-200 p-6 overflow-hidden"
            >
              <PhotoSimulation mode="full" />
            </motion.div>
          )}
        </motion.section>

        {/* Skin Health Score */}
        {plan.skinHealthScore && plan.projectedScore && (
          <motion.section {...fadeIn} className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-6 text-white">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C9A96E] mb-4">
              Skin Health Score
            </h2>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-[#C9A96E]">{plan.skinHealthScore}</p>
                <p className="text-xs text-white/60 mt-1">Current</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-400" />
              <div className="text-center">
                <p className="text-4xl font-bold text-green-400">{plan.projectedScore}</p>
                <p className="text-xs text-white/60 mt-1">Projected</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Assessment */}
        {plan.intakeSummary && (
          <motion.section {...fadeIn} className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-heading text-lg font-bold text-[#0F1D2C] mb-3">
              Your Personalized Assessment
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{plan.intakeSummary}</p>
          </motion.section>
        )}

        {/* Treatment Phases */}
        {parsedPhases && parsedPhases.phases.length > 0 && (
          <motion.section {...fadeIn}>
            <h2 className="font-heading text-lg font-bold text-[#0F1D2C] mb-4">
              Your Treatment Journey
            </h2>
            <div className="space-y-4">
              {parsedPhases.phases.map((phase, idx) => {
                const colors = [
                  { border: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
                  { border: 'border-amber-200', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
                  { border: 'border-green-200', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
                ][idx] || { border: 'border-gray-200', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' };

                return (
                  <div key={idx} className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                        Phase {idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F1D2C]">{phase.title}</h3>
                    </div>
                    {phase.description && (
                      <p className="text-xs text-gray-500 mb-3">{phase.description}</p>
                    )}
                    <ul className="space-y-2">
                      {phase.treatments.map((treatment: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Before & After Care Instructions */}
        {parsedPhases && parsedPhases.phases.length > 0 && (
          <motion.section {...fadeIn} className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-heading text-lg font-bold text-[#0F1D2C] mb-4">
              Care Instructions
            </h2>
            <div className="space-y-4">
              {parsedPhases.phases.flatMap((phase) => phase.treatments).filter((t, i, arr) => arr.indexOf(t) === i).map((treatment: string) => {
                const care = getCareInstructions(treatment);
                if (!care) return null;
                return (
                  <div key={treatment} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-[#0F1D2C] mb-2">{treatment}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {care.preCare.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#C9A96E] uppercase tracking-wider mb-1">Before Treatment</p>
                          <ul className="space-y-1">
                            {care.preCare.map((item, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <Check className="h-3 w-3 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {care.postCare.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">After Treatment</p>
                          <ul className="space-y-1">
                            {care.postCare.map((item, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {care.expectedDowntime && (
                      <p className="text-xs text-gray-400 mt-2">Expected downtime: {care.expectedDowntime}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Investment Options */}
        {packages.length > 0 && (
          <motion.section {...fadeIn} className="print:break-before-page">
            <h2 className="font-heading text-lg font-bold text-[#0F1D2C] mb-4">
              Investment Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isHighlighted = pkg.highlight;
                const tierIcon = pkg.tier === 'Start' ? (
                  <Star className="h-4 w-4 text-[#C9A96E]" />
                ) : pkg.tier === 'Transform' ? (
                  <Sparkles className="h-4 w-4 text-[#C9A96E]" />
                ) : (
                  <Crown className="h-4 w-4 text-[#C9A96E]" />
                );
                return (
                  <div
                    key={pkg.tier}
                    className={`rounded-2xl border-2 p-5 transition-all ${
                      isHighlighted
                        ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-2 ring-[#C9A96E]/20 shadow-md'
                        : pkg.tier === 'Elite'
                          ? 'border-[#0F1D2C] bg-[#0F1D2C]/5'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Tier header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {tierIcon}
                        <span className="text-sm font-bold text-[#0F1D2C]">{pkg.name}</span>
                      </div>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A96E] text-white">
                          Most Popular
                        </span>
                      )}
                    </div>

                    {/* Subtitle */}
                    {pkg.subtitle && (
                      <p className="text-[11px] text-gray-500 mb-3 ml-6">{pkg.subtitle}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-[#0F1D2C]">
                        ${pkg.price.toLocaleString()}
                      </span>
                      {pkg.savings && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                          {pkg.savings}
                        </span>
                      )}
                    </div>

                    {/* Savings dollar amount */}
                    {pkg.savingsVsStandalone && pkg.savingsVsStandalone > 0 && (
                      <p className="text-[11px] text-green-600 font-medium mb-2">
                        Save ${pkg.savingsVsStandalone.toLocaleString()}
                      </p>
                    )}

                    {/* Result intensity */}
                    {pkg.resultIntensity && (
                      <p className="text-xs text-[#0F1D2C] font-medium capitalize mb-1">
                        Expected: {pkg.resultIntensity}
                      </p>
                    )}

                    {/* Best for */}
                    {pkg.bestFor && (
                      <p className="text-[11px] text-gray-500 italic mb-3">
                        {pkg.bestFor}
                      </p>
                    )}

                    {/* Why best callout — Transform only */}
                    {pkg.whyBest && (
                      <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-lg p-2.5 mb-3">
                        <p className="text-[11px] text-[#0F1D2C] font-medium leading-relaxed">
                          {pkg.whyBest}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mb-3">
                      {pkg.sessions} session{pkg.sessions !== 1 ? 's' : ''}
                    </p>

                    {/* Line items */}
                    <div className="space-y-1 mb-3">
                      {pkg.lineItems.map((li, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-600 truncate mr-2">{li.service}</span>
                          <span className="text-gray-500 tabular-nums flex-shrink-0">
                            {li.qty}x ${li.unitPrice}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Extras */}
                    {pkg.extras.length > 0 && (
                      <div className="border-t border-gray-100 pt-3 mb-3 space-y-1.5">
                        {pkg.extras.map((extra, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Check className="h-3 w-3 text-[#C9A96E] flex-shrink-0" />
                            <span>{extra}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Financing */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500">
                        or{' '}
                        <span className="font-semibold text-[#0F1D2C]">
                          ${pkg.monthlyPayment}/mo
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Financing Options */}
        <motion.section {...fadeIn} className="bg-white rounded-2xl border border-gray-100 p-6 print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#0F1D2C]">Flexible Financing</h2>
              <p className="text-xs text-gray-500">No impact to your credit score</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={clinicInfo.financing.cherry.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAction('financing_clicked')}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#C9A96E] hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[#C9A96E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E] transition-colors">
                  Apply with Cherry
                </p>
                <p className="text-xs text-gray-500">Plans as low as $50/mo</p>
              </div>
            </a>
            <a
              href={clinicInfo.financing.patientfi.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAction('financing_clicked')}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#C9A96E] hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[#C9A96E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E] transition-colors">
                  Apply with PatientFi
                </p>
                <p className="text-xs text-gray-500">Flexible payment plans</p>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5" />
            <span>HSA & FSA cards accepted for eligible treatments</span>
          </div>
        </motion.section>

        {/* Timeline */}
        {parsedTimeline.length > 0 && (
          <motion.section {...fadeIn}>
            <h2 className="font-heading text-lg font-bold text-[#0F1D2C] mb-4">
              Treatment Timeline
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="space-y-4">
                {parsedTimeline.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-[#C9A96E]" />
                      </div>
                      {idx < parsedTimeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-100 mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-semibold text-[#C9A96E]">{item.week}</p>
                      <p className="text-sm text-gray-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.section {...fadeIn} className="text-center py-8 print:hidden">
          <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-8">
            <h2 className="font-heading text-2xl font-bold text-white mb-2">
              Ready to Begin Your Transformation?
            </h2>
            <p className="text-white/60 text-sm mb-6">
              {plan.suggestedNextStep || 'Book your consultation to get started on your personalized treatment journey.'}
            </p>
            <a
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAction('booking_clicked')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A96E] text-white rounded-xl font-semibold hover:bg-[#B8944F] transition-colors text-lg"
            >
              Book Your Consultation
            </a>
            <p className="text-white/40 text-xs mt-4">
              or call us at{' '}
              <a href={clinicInfo.phoneTel} className="text-[#C9A96E] hover:underline">
                {clinicInfo.phone}
              </a>
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-gray-100">
          <p className="font-heading text-sm font-semibold text-[#0F1D2C]">{clinicInfo.name}</p>
          <p className="text-xs text-gray-400 mt-1">{clinicInfo.address.full}</p>
          <p className="text-xs text-gray-400">{clinicInfo.phone}</p>
          <p className="text-[10px] text-gray-300 mt-3 max-w-md mx-auto">
            This treatment plan is a personalized recommendation based on your consultation.
            Results may vary. All treatments are performed under medical supervision.
            Photo simulations are for illustrative purposes only and do not guarantee specific outcomes.
          </p>
        </footer>
      </div>
    </div>
  );
}
