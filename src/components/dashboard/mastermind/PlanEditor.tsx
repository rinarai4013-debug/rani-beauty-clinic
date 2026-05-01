'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import type {
  MastermindSession,
  MastermindSessionAction,
  MastermindTreatment,
  PlanModification,
} from '@/types/mastermind';

interface PlanEditorProps {
  session: MastermindSession;
  onValidate: () => Promise<ValidationResult | null>;
  onDispatch: (_action: MastermindSessionAction) => Promise<void>;
}

interface ValidationResult {
  warnings: PlanWarning[];
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

interface PlanWarning {
  severity: 'error' | 'warning' | 'info';
  message: string;
  type?: string;
  serviceName?: string;
  suggestion?: string;
}

export default function PlanEditor({
  session,
  onValidate,
  onDispatch,
}: PlanEditorProps) {
  const plan = session.mastermindPlan;
  const review = session.providerReview;
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [customRecommendation, setCustomRecommendation] = useState('');
  const [customRationale, setCustomRationale] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSavingModification, setIsSavingModification] = useState(false);

  // Run validation on mount and after edits
  useEffect(() => {
    if (plan) {
      onValidate().then((result) => {
        if (result) setValidation(result);
      });
    }
  }, [plan, onValidate]);

  const ensureProviderReview = useCallback(async () => {
    if (review) return;
    await onDispatch({
      type: 'SET_PROVIDER_REVIEW',
      review: {
        providerId: 'pending_auth',
        providerName: 'Provider',
        modifications: [],
        clinicalNotes: [],
        approvalStatus: 'pending',
      },
    });
  }, [onDispatch, review]);

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
      await ensureProviderReview();
      if (noteInput.trim()) {
        await onDispatch({
          type: 'ADD_MODIFICATION',
          modification: {
            id: `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            type: 'note',
            details: noteInput.trim(),
            providerId: 'pending_auth',
          },
        });
        setNoteInput('');
      }
      await onDispatch({ type: 'SET_APPROVAL_STATUS', status: 'approved' });
    } finally {
      setIsApproving(false);
    }
  }, [ensureProviderReview, noteInput, onDispatch]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F8F6F1] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#0F1D2C]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <h3 className="font-body text-sm font-medium text-[#0F1D2C]/60">
          No Treatment Plan Yet
        </h3>
        <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
          Generate a plan from the Aura Scan results first.
        </p>
      </div>
    );
  }

  const allTreatments = [
    ...plan.recommendations.primary.map((t) => ({ ...t, tier: 'Primary' as const })),
    ...plan.recommendations.complementary.map((t) => ({ ...t, tier: 'Complementary' as const })),
    ...plan.recommendations.maintenance.map((t) => ({ ...t, tier: 'Maintenance' as const })),
  ];

  const treatmentStatus = new Map<string, 'active' | 'excluded'>();
  for (const modification of review?.modifications || []) {
    if (!modification.treatmentId) continue;
    if (modification.type === 'remove') treatmentStatus.set(modification.treatmentId, 'excluded');
    if (modification.type === 'add') treatmentStatus.set(modification.treatmentId, 'active');
  }

  const isTreatmentExcluded = (treatmentId: string) => treatmentStatus.get(treatmentId) === 'excluded';
  const includedTreatments = allTreatments.filter((treatment) => !isTreatmentExcluded(treatment.id));
  const providerAdds = (review?.modifications || []).filter(
    (modification) => modification.type === 'add' && !modification.treatmentId,
  );
  const providerNotes = (review?.modifications || []).filter(
    (modification) => modification.type === 'note',
  );
  const totalCost = includedTreatments.reduce((sum, t) => sum + t.totalEstimate, 0);
  const approvalStatus = review?.approvalStatus || 'pending';

  const addModification = async (
    modification: Omit<PlanModification, 'id' | 'timestamp' | 'providerId'>,
  ) => {
    setIsSavingModification(true);
    try {
      await ensureProviderReview();
      await onDispatch({
        type: 'ADD_MODIFICATION',
        modification: {
          id: `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          providerId: 'pending_auth',
          ...modification,
        },
      });
    } finally {
      setIsSavingModification(false);
    }
  };

  const handleToggleTreatment = async (treatment: MastermindTreatment) => {
    const excluded = isTreatmentExcluded(treatment.id);
    await addModification({
      type: excluded ? 'add' : 'remove',
      treatmentId: treatment.id,
      details: excluded
        ? `Restored AI recommendation: ${treatment.treatmentName}`
        : `Excluded AI recommendation: ${treatment.treatmentName}`,
    });
  };

  const handleAddCustomRecommendation = async () => {
    const name = customRecommendation.trim();
    if (!name) return;
    await addModification({
      type: 'add',
      details: `${name}${customRationale.trim() ? ` — ${customRationale.trim()}` : ''}`,
    });
    setCustomRecommendation('');
    setCustomRationale('');
  };

  const handleSaveNote = async () => {
    const note = noteInput.trim();
    if (!note) return;
    await addModification({ type: 'note', details: note });
    setNoteInput('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0F1D2C]">
          Treatment Plan
        </h2>
        <div className="flex items-center gap-2">
          {approvalStatus === 'approved' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#059669]/10 text-[#059669] font-body text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Approved
            </span>
          )}
        </div>
      </div>

      {/* Validation Warnings */}
      {validation && validation.warnings.length > 0 && (
        <div className="space-y-2">
          {validation.warnings.map((warning, i) => {
            const Icon = warning.severity === 'error' ? AlertTriangle : warning.severity === 'warning' ? AlertTriangle : Info;
            const colors = warning.severity === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : warning.severity === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-blue-200 bg-blue-50 text-blue-700';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${colors}`}
              >
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-xs font-medium">{warning.message}</p>
                  {warning.suggestion && (
                    <p className="font-body text-xs opacity-70 mt-0.5">{warning.suggestion}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Medical / Peptide / BoomRx Optimization */}
      {plan.medicalOptimization && (
        <div className="rounded-2xl border border-[#0F1D2C]/10 bg-[#0F1D2C] text-white overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Provider-only medical optimization
                </p>
                <h3 className="font-[family-name:var(--font-heading)] text-lg mt-1">
                  {plan.medicalOptimization.recommendedTrack.toUpperCase()} pathway
                </h3>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[11px] font-bold ${
                  plan.medicalOptimization.status === 'eligible'
                    ? 'bg-[#059669]/20 text-emerald-100'
                    : plan.medicalOptimization.status === 'ineligible'
                      ? 'bg-red-500/20 text-red-100'
                      : 'bg-amber-400/20 text-amber-100'
                }`}
              >
                {plan.medicalOptimization.status.replace(/-/g, ' ')}
              </span>
            </div>

            <p className="font-body text-xs leading-relaxed text-white/70">
              {plan.medicalOptimization.providerSummary}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/8 p-3">
                <p className="font-body text-[11px] text-white/45">Tier</p>
                <p className="font-body text-sm font-semibold capitalize">
                  {plan.medicalOptimization.tierRecommendation.tier}
                </p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="font-body text-[11px] text-white/45">Projected retail</p>
                <p className="font-body text-sm font-semibold">
                  ${plan.medicalOptimization.projectedMonthlyRetail.toLocaleString()}/mo
                </p>
              </div>
            </div>

            {plan.medicalOptimization.riskFlags.length > 0 && (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3">
                <p className="font-body text-xs font-semibold text-amber-100">
                  Safety flags requiring provider review
                </p>
                <div className="mt-2 space-y-1.5">
                  {plan.medicalOptimization.riskFlags.slice(0, 3).map((flag) => (
                    <p key={flag} className="font-body text-xs leading-relaxed text-amber-50/80">
                      {flag}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {plan.medicalOptimization.dosageFramework.personalizedPeptidePlan && (
              <div className="rounded-xl bg-white/8 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-xs font-semibold">
                    Peptide match matrix
                  </p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-white/55">
                    {plan.medicalOptimization.dosageFramework.personalizedPeptidePlan.dataCompleteness} data
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {plan.medicalOptimization.dosageFramework.personalizedPeptidePlan.candidates
                    .slice(0, 3)
                    .map((candidate) => (
                      <div key={`${candidate.compound}-${candidate.targetIntent}`} className="rounded-lg bg-white/7 p-2">
                        <p className="font-body text-xs font-semibold text-white">
                          {candidate.compound} — {candidate.targetIntent}
                        </p>
                        <p className="font-body text-[11px] leading-relaxed text-white/60 mt-1">
                          {candidate.startDose}; {candidate.cadence}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white/8 p-3">
              <p className="font-body text-xs font-semibold">
                Top BoomRx product matches
              </p>
              <div className="mt-2 space-y-1.5">
                {plan.medicalOptimization.recommendedProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-body text-xs text-white/75">
                      {product.label}
                    </p>
                    <span className="shrink-0 font-body text-xs font-semibold text-white">
                      ${product.suggestedRetail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="font-body text-[11px] leading-relaxed text-white/45">
              Provider authorization required before prescribing, dispensing, or starting any peptide,
              GLP-1, hormone, or wellness protocol.
            </p>
          </div>
        </div>
      )}

      {/* Treatment List */}
      <div className="space-y-2">
        {allTreatments.map((treatment) => {
          const isExpanded = expandedTreatment === treatment.id;
          const excluded = isTreatmentExcluded(treatment.id);
          const priorityColors = {
            essential: 'bg-[#0F1D2C] text-white',
            recommended: 'bg-[#C9A96E] text-white',
            optional: 'bg-[#F8F6F1] text-[#0F1D2C]/60',
          };

          return (
            <motion.div
              key={treatment.id}
              layout
              className="rounded-xl border border-[#E8E4DF] bg-white overflow-hidden"
            >
              {/* Treatment Header */}
              <div className={`flex items-center gap-2 p-3 ${excluded ? 'bg-red-50/60' : ''}`}>
                <button
                  type="button"
                  onClick={() => setExpandedTreatment(isExpanded ? null : treatment.id)}
                  className="min-w-0 flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                >
                  <span className={`px-2 py-0.5 rounded-md font-body text-xs font-medium ${excluded ? 'bg-red-100 text-red-700' : priorityColors[treatment.priority]}`}>
                    {excluded ? 'OUT' : treatment.priority === 'essential' ? 'E' : treatment.priority === 'recommended' ? 'R' : 'O'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={`font-body text-sm font-medium truncate ${excluded ? 'text-[#0F1D2C]/45 line-through' : 'text-[#0F1D2C]'}`}>
                      {treatment.treatmentName}
                    </p>
                    <p className="font-body text-xs text-[#0F1D2C]/40">
                      {treatment.tier} &middot; {treatment.sessionsRequired} session{treatment.sessionsRequired !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <span className={`font-body text-sm font-semibold shrink-0 ${excluded ? 'text-[#0F1D2C]/30 line-through' : 'text-[#0F1D2C]'}`}>
                    ${treatment.totalEstimate.toLocaleString()}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#0F1D2C]/30 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#0F1D2C]/30 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleTreatment(treatment)}
                  disabled={isSavingModification || approvalStatus === 'approved'}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-body text-xs font-semibold transition-colors ${
                    excluded
                      ? 'bg-[#059669]/10 text-[#047857] hover:bg-[#059669]/15'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {excluded ? <Plus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {excluded ? 'Restore' : 'Remove'}
                </button>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[#E8E4DF]"
                  >
                    <div className="p-3 space-y-3">
                      <p className="font-body text-xs text-[#0F1D2C]/60">
                        {treatment.aiReasoning}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">Per Session</span>
                          <p className="font-medium text-[#0F1D2C]">${treatment.perSession}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">Downtime</span>
                          <p className="font-medium text-[#0F1D2C]">{treatment.downtime}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">Results In</span>
                          <p className="font-medium text-[#0F1D2C]">{treatment.timeToResults}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">AI Confidence</span>
                          <p className="font-medium text-[#0F1D2C]">{treatment.aiConfidence}%</p>
                        </div>
                      </div>

                      {/* Clinical Rationale */}
                      <div className="p-2.5 rounded-lg bg-[#0F1D2C]/5 border border-[#0F1D2C]/10">
                        <p className="font-body text-xs text-[#0F1D2C]/50 italic">
                          {treatment.clinicalRationale}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F1D2C]/5 border border-[#0F1D2C]/10">
        <span className="font-body text-sm font-medium text-[#0F1D2C]">
          Plan Total
        </span>
        <span className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#0F1D2C]">
          ${totalCost.toLocaleString()}
        </span>
      </div>

      {/* Packages */}
      {plan.packages.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Package Options
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {plan.packages.map((pkg) => (
              <div
                key={pkg.tier}
                className={`p-3 rounded-xl border text-center ${
                  pkg.highlighted
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5'
                    : 'border-[#E8E4DF]'
                }`}
              >
                <p className="font-body text-xs font-semibold text-[#0F1D2C]">{pkg.tier}</p>
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#0F1D2C] mt-1">
                  ${pkg.price.toLocaleString()}
                </p>
                <p className="font-body text-xs text-[#0F1D2C]/40">
                  {pkg.sessions} sessions
                </p>
                {pkg.discount > 0 && (
                  <p className="font-body text-xs text-[#059669] font-medium mt-1">
                    Save {pkg.discount}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider Additions / Removals */}
      <div className="space-y-3 rounded-2xl border border-[#E8E4DF] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Provider edits before sign-off
          </h3>
          <span className="font-body text-[11px] text-[#0F1D2C]/40">
            {includedTreatments.length}/{allTreatments.length} AI picks included
          </span>
        </div>

        <div className="grid gap-2">
          <input
            value={customRecommendation}
            onChange={(e) => setCustomRecommendation(e.target.value)}
            placeholder="Add service, product, peptide review, lab, or follow-up..."
            className="w-full rounded-xl border border-[#E8E4DF] bg-[#F8F6F1] px-3 py-2 font-body text-sm text-[#0F1D2C] outline-none placeholder:text-[#0F1D2C]/30 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
          />
          <textarea
            value={customRationale}
            onChange={(e) => setCustomRationale(e.target.value)}
            placeholder="Clinical reason, constraint, or patient preference..."
            rows={2}
            className="w-full rounded-xl border border-[#E8E4DF] bg-[#F8F6F1] px-3 py-2 font-body text-sm text-[#0F1D2C] outline-none placeholder:text-[#0F1D2C]/30 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 resize-none"
          />
          <button
            type="button"
            onClick={handleAddCustomRecommendation}
            disabled={!customRecommendation.trim() || isSavingModification || approvalStatus === 'approved'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A96E] px-3 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-[#B8944F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add to provider plan
          </button>
        </div>

        {(providerAdds.length > 0 || providerNotes.length > 0) && (
          <div className="space-y-2 border-t border-[#E8E4DF] pt-3">
            {[...providerAdds, ...providerNotes].slice(-6).reverse().map((modification) => (
              <div key={modification.id} className="flex items-start gap-2 rounded-xl bg-[#F8F6F1] p-2">
                <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A96E]" />
                <div className="min-w-0">
                  <p className="font-body text-xs font-semibold capitalize text-[#0F1D2C]">
                    {modification.type === 'note' ? 'Clinical note' : 'Provider addition'}
                  </p>
                  <p className="font-body text-xs leading-relaxed text-[#0F1D2C]/60">
                    {modification.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Notes */}
      <div className="space-y-2">
        <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
          Clinical Notes
        </h3>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Add clinical notes or modifications..."
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF] font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 resize-none"
        />
        <button
          type="button"
          onClick={handleSaveNote}
          disabled={!noteInput.trim() || isSavingModification || approvalStatus === 'approved'}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] px-3 py-2 font-body text-xs font-semibold text-[#0F1D2C]/70 transition-colors hover:bg-[#F8F6F1] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil className="h-3.5 w-3.5" />
          Save note
        </button>
      </div>

      {/* Approve Button */}
      {approvalStatus !== 'approved' && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={isApproving || (validation?.errorCount ?? 0) > 0}
          className={`w-full py-3 rounded-xl font-body font-semibold text-sm transition-all ${
            isApproving || (validation?.errorCount ?? 0) > 0
              ? 'bg-[#0F1D2C]/30 text-white cursor-not-allowed'
              : 'bg-[#0F1D2C] text-white hover:bg-[#0F1D2C]/90'
          }`}
        >
          {isApproving ? 'Approving...' : 'Approve Plan'}
        </button>
      )}
    </div>
  );
}
