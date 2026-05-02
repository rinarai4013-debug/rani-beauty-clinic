'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Search, CalendarDays, MapPin } from 'lucide-react';
import type { MastermindSession, MastermindTreatment, PlanModification } from '@/types/mastermind';
import { UNIFIED_CATALOG, SERVICE_CATEGORIES, type UnifiedService } from '@/data/services/unified-catalog';
import {
  buildTreatmentPlanCustomization,
  createCustomizationItemFromService,
  daysFromSubmission,
  formatTreatmentCategory,
  getTreatmentAreaOptions,
  summarizeTreatmentCustomization,
} from '@/lib/mastermind/treatment-customization';

interface PlanEditorProps {
  session: MastermindSession;
  onValidate: () => Promise<ValidationResult | null>;
  onDispatch: (action: any) => Promise<void>;
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
  const [serviceQuery, setServiceQuery] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);

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

  const allTreatments = useMemo(
    () => plan
      ? [
          ...plan.recommendations.primary.map((t) => ({ ...t, tier: 'Primary' as const })),
          ...plan.recommendations.complementary.map((t) => ({ ...t, tier: 'Complementary' as const })),
          ...plan.recommendations.maintenance.map((t) => ({ ...t, tier: 'Maintenance' as const })),
        ]
      : [],
    [plan],
  );

  const treatmentDetailById = useMemo(
    () => new Map<string, MastermindTreatment>(allTreatments.map((t) => [t.id, t])),
    [allTreatments],
  );

  const customization = useMemo(
    () => session ? buildTreatmentPlanCustomization(session) : null,
    [session],
  );

  const saveCustomization = useCallback(
    async (items: NonNullable<typeof customization>['items'], planNotes?: string) => {
      if (!customization) return;
      const next = summarizeTreatmentCustomization({
        ...customization,
        updatedAt: new Date().toISOString(),
        items,
        planNotes: planNotes ?? customization.planNotes,
      });
      await onDispatch({ type: 'SET_TREATMENT_PLAN_CUSTOMIZATION', customization: next });
    },
    [customization, onDispatch],
  );

  const updateItem = useCallback(
    async (
      itemId: string,
      patch: Partial<NonNullable<typeof customization>['items'][number]>,
    ) => {
      if (!customization) return;
      await saveCustomization(
        customization.items.map((item) => {
          if (item.id !== itemId) return item;
          const next = { ...item, ...patch };
          if (patch.scheduledDate) {
            next.scheduledDay = daysFromSubmission(customization.submissionDate, patch.scheduledDate);
          }
          if (patch.sessions || patch.perSession) {
            next.totalEstimate = Math.max(1, next.sessions) * Math.max(0, next.perSession);
          }
          return next;
        }),
      );
    },
    [customization, saveCustomization],
  );

  const addService = useCallback(
    async (service: UnifiedService) => {
      if (!customization) return;
      const item = createCustomizationItemFromService(
        service,
        session,
        customization.items.length,
      );
      await saveCustomization([...customization.items, item]);
      setServiceQuery('');
      setShowServicePicker(false);
      setExpandedTreatment(item.id);
    },
    [customization, saveCustomization, session],
  );

  const serviceOptions = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    const existingServiceIds = new Set(customization?.items.map((item) => item.serviceId).filter(Boolean));
    return UNIFIED_CATALOG
      .filter((service) => !existingServiceIds.has(service.id))
      .filter((service) => {
        if (!q) return true;
        return (
          service.name.toLowerCase().includes(q) ||
          service.category.toLowerCase().includes(q) ||
          service.description.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [customization?.items, serviceQuery]);

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

  const planItems = customization?.items || [];
  const selectedItems = planItems.filter((item) => item.selected);
  const totalCost = customization?.selectedTotal ?? allTreatments.reduce((sum, t) => sum + t.totalEstimate, 0);
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

      {/* Customization Summary */}
      {customization && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-[#0F1D2C] text-white">
            <p className="font-body text-[10px] uppercase tracking-wide text-white/50">Selected</p>
            <p className="font-body text-lg font-semibold">{selectedItems.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF]">
            <p className="font-body text-[10px] uppercase tracking-wide text-[#0F1D2C]/40">Sessions</p>
            <p className="font-body text-lg font-semibold text-[#0F1D2C]">{customization.selectedSessionCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20">
            <p className="font-body text-[10px] uppercase tracking-wide text-[#C9A96E]">Plan Total</p>
            <p className="font-body text-lg font-semibold text-[#0F1D2C]">${totalCost.toLocaleString()}</p>
          </div>
        </div>
      )}

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
                          {candidate.compound} - {candidate.targetIntent}
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

      {/* Add Treatment */}
      <div className="rounded-xl border border-[#E8E4DF] bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowServicePicker((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left hover:bg-[#F8F6F1]/60 transition-colors"
        >
          <span className="flex items-center gap-2 font-body text-sm font-semibold text-[#0F1D2C]">
            <Plus className="w-4 h-4 text-[#C9A96E]" />
            Add catalog treatment
          </span>
          {showServicePicker ? (
            <ChevronUp className="w-4 h-4 text-[#0F1D2C]/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#0F1D2C]/30" />
          )}
        </button>

        <AnimatePresence>
          {showServicePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[#E8E4DF]"
            >
              <div className="p-3 space-y-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F6F1] border border-[#E8E4DF]">
                  <Search className="w-4 h-4 text-[#0F1D2C]/35" />
                  <input
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    placeholder="Search HydraFacial, Botox, laser hair areas..."
                    className="w-full bg-transparent outline-none font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30"
                  />
                </label>

                {!serviceQuery && (
                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                    {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setServiceQuery(cat.label)}
                        className="shrink-0 px-2.5 py-1.5 rounded-full bg-[#F8F6F1] border border-[#E8E4DF] font-body text-[11px] text-[#0F1D2C]/60 hover:border-[#C9A96E]/40"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                  {serviceOptions.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => addService(service)}
                      className="p-3 rounded-lg border border-[#E8E4DF] text-left hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-body text-sm font-semibold text-[#0F1D2C]">{service.name}</p>
                          <p className="font-body text-xs text-[#0F1D2C]/45 mt-0.5">
                            {formatTreatmentCategory(service.category)} &middot; {service.sessions} session{service.sessions !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-body text-sm font-bold text-[#0F1D2C]">${service.price.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Treatment List */}
      <div className="space-y-2">
        {planItems.map((treatment) => {
          const isExpanded = expandedTreatment === treatment.id;
          const detail = treatment.treatmentId ? treatmentDetailById.get(treatment.treatmentId) : undefined;
          const areaOptions = getTreatmentAreaOptions(treatment);
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
              <div
                className={`w-full flex items-center gap-3 p-3 hover:bg-[#F8F6F1]/50 transition-colors ${!treatment.selected ? 'opacity-55' : ''}`}
              >
                <button
                  type="button"
                  aria-pressed={treatment.selected}
                  aria-label={`${treatment.selected ? 'Deselect' : 'Select'} ${treatment.treatmentName}`}
                  onClick={() => updateItem(treatment.id, { selected: !treatment.selected })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    treatment.selected
                      ? 'bg-[#059669] border-[#059669] text-white'
                      : 'bg-white border-[#D6D0C8] text-transparent'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedTreatment(isExpanded ? null : treatment.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className={`px-2 py-0.5 rounded-md font-body text-xs font-medium ${priorityColors[treatment.priority]}`}>
                    {treatment.priority === 'essential' ? 'E' : treatment.priority === 'recommended' ? 'R' : 'O'}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="block font-body text-sm font-medium text-[#0F1D2C] truncate">
                      {treatment.treatmentName}
                    </span>
                    <span className="block font-body text-xs text-[#0F1D2C]/40">
                      {formatTreatmentCategory(treatment.category)} &middot; {treatment.sessions} session{treatment.sessions !== 1 ? 's' : ''} &middot; Day {treatment.scheduledDay}
                    </span>
                  </span>

                  <span className="font-body text-sm font-semibold text-[#0F1D2C] shrink-0">
                    ${treatment.totalEstimate.toLocaleString()}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#0F1D2C]/30 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#0F1D2C]/30 shrink-0" />
                  )}
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
                      {detail?.aiReasoning && (
                        <p className="font-body text-xs text-[#0F1D2C]/60">
                          {detail.aiReasoning}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">Per Session</span>
                          <input
                            type="number"
                            min={0}
                            value={treatment.perSession}
                            onChange={(e) => updateItem(treatment.id, { perSession: Number(e.target.value) || 0 })}
                            className="w-full bg-transparent font-medium text-[#0F1D2C] outline-none"
                          />
                        </div>
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">Sessions</span>
                          <input
                            type="number"
                            min={1}
                            value={treatment.sessions}
                            onChange={(e) => updateItem(treatment.id, { sessions: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full bg-transparent font-medium text-[#0F1D2C] outline-none"
                          />
                        </div>
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            First Visit
                          </span>
                          <input
                            type="date"
                            value={treatment.scheduledDate}
                            onChange={(e) => updateItem(treatment.id, { scheduledDate: e.target.value })}
                            className="w-full bg-transparent font-medium text-[#0F1D2C] outline-none"
                          />
                        </div>
                        <div className="p-2 rounded-lg bg-[#F8F6F1]">
                          <span className="text-[#0F1D2C]/40">Line Total</span>
                          <p className="font-medium text-[#0F1D2C]">${treatment.totalEstimate.toLocaleString()}</p>
                        </div>
                      </div>

                      {areaOptions.length > 0 && (
                        <div className="space-y-2">
                          <p className="flex items-center gap-1.5 font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
                            <MapPin className="w-3.5 h-3.5 text-[#C9A96E]" />
                            Treatment Areas
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {areaOptions.map((area) => {
                              const selected = treatment.targetAreas.includes(area);
                              return (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => {
                                    const areas = selected
                                      ? treatment.targetAreas.filter((a) => a !== area)
                                      : [...treatment.targetAreas, area];
                                    updateItem(treatment.id, { targetAreas: areas });
                                  }}
                                  className={`px-2.5 py-1.5 rounded-full border font-body text-[11px] transition-colors ${
                                    selected
                                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#0F1D2C]'
                                      : 'border-[#E8E4DF] bg-white text-[#0F1D2C]/45 hover:border-[#C9A96E]/40'
                                  }`}
                                >
                                  {area}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <textarea
                        defaultValue={treatment.notes || ''}
                        onBlur={(e) => updateItem(treatment.id, { notes: e.target.value })}
                        placeholder="Provider-visible plan note: units, syringes, areas, sequencing reason..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-[#F8F6F1] border border-[#E8E4DF] font-body text-xs text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 outline-none focus:border-[#C9A96E] resize-none"
                      />

                      {/* Clinical Rationale */}
                      {detail?.clinicalRationale && (
                        <div className="p-2.5 rounded-lg bg-[#0F1D2C]/5 border border-[#0F1D2C]/10">
                          <p className="font-body text-xs text-[#0F1D2C]/50 italic">
                            {detail.clinicalRationale}
                          </p>
                        </div>
                      )}

                      {treatment.source === 'staff' && (
                        <button
                          type="button"
                          onClick={() => saveCustomization(planItems.filter((item) => item.id !== treatment.id))}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-body text-xs font-semibold hover:bg-red-100"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove added treatment
                        </button>
                      )}
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
