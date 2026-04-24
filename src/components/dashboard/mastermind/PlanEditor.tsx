'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import type { MastermindSession, MastermindTreatment, PlanModification } from '@/types/mastermind';

interface PlanEditorProps {
  session: MastermindSession;
  onValidate: () => Promise<ValidationResult | null>;
  onDispatch: (_action: any) => Promise<void>;
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
  const [isApproving, setIsApproving] = useState(false);

  // Run validation on mount and after edits
  useEffect(() => {
    if (plan) {
      onValidate().then((result) => {
        if (result) setValidation(result);
      });
    }
  }, [plan, onValidate]);

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
      // Set up provider review if not exists
      // Provider identity is injected server-side by the PATCH route
      // using the authenticated session. We send placeholder values
      // that get overridden when auth is available.
      if (!review) {
        await onDispatch({
          type: 'SET_PROVIDER_REVIEW',
          review: {
            providerId: 'pending_auth',
            providerName: 'Provider',
            modifications: [],
            clinicalNotes: noteInput ? [noteInput] : [],
            approvalStatus: 'pending',
          },
        });
      }
      await onDispatch({ type: 'SET_APPROVAL_STATUS', status: 'approved' });
    } finally {
      setIsApproving(false);
    }
  }, [onDispatch, review, noteInput]);

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

  const totalCost = allTreatments.reduce((sum, t) => sum + t.totalEstimate, 0);
  const approvalStatus = review?.approvalStatus || 'pending';

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

      {/* Treatment List */}
      <div className="space-y-2">
        {allTreatments.map((treatment) => {
          const isExpanded = expandedTreatment === treatment.id;
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
              <button
                type="button"
                onClick={() => setExpandedTreatment(isExpanded ? null : treatment.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#F8F6F1]/50 transition-colors"
              >
                <span className={`px-2 py-0.5 rounded-md font-body text-xs font-medium ${priorityColors[treatment.priority]}`}>
                  {treatment.priority === 'essential' ? 'E' : treatment.priority === 'recommended' ? 'R' : 'O'}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-[#0F1D2C] truncate">
                    {treatment.treatmentName}
                  </p>
                  <p className="font-body text-xs text-[#0F1D2C]/40">
                    {treatment.tier} &middot; {treatment.sessionsRequired} session{treatment.sessionsRequired !== 1 ? 's' : ''}
                  </p>
                </div>

                <span className="font-body text-sm font-semibold text-[#0F1D2C] shrink-0">
                  ${treatment.totalEstimate.toLocaleString()}
                </span>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#0F1D2C]/30 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0F1D2C]/30 shrink-0" />
                )}
              </button>

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
