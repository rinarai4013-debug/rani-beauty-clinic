'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type {
  MastermindSession,
  MastermindTreatment,
  PlanModification,
  MastermindPlan,
  FacialZone,
  MastermindSessionAction,
} from '@/types/mastermind';
import { UNIFIED_CATALOG, type UnifiedService } from '@/data/services/unified-catalog';

interface PlanEditorProps {
  session: MastermindSession;
  onValidate: () => Promise<ValidationResult | null>;
  onDispatch: (action: MastermindSessionAction) => Promise<void>;
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

type TreatmentBucket = 'primary' | 'complementary' | 'maintenance';

const PACKAGE_APR = 0.1499;

const BUCKET_META: Record<
  TreatmentBucket,
  {
    label: 'Primary' | 'Complementary' | 'Maintenance';
    priority: MastermindTreatment['priority'];
    urgency: MastermindTreatment['urgency'];
    phase: 1 | 2 | 3;
  }
> = {
  primary: {
    label: 'Primary',
    priority: 'essential',
    urgency: 'immediate',
    phase: 1,
  },
  complementary: {
    label: 'Complementary',
    priority: 'recommended',
    urgency: 'within-3-months',
    phase: 2,
  },
  maintenance: {
    label: 'Maintenance',
    priority: 'optional',
    urgency: 'when-ready',
    phase: 3,
  },
};

const PHASE_TIMELINE: Record<1 | 2 | 3, { duration: string; milestone: string; defaultWeek: number }> = {
  1: {
    duration: '0-4 weeks',
    milestone: 'Foundation established with visible early response.',
    defaultWeek: 1,
  },
  2: {
    duration: '4-12 weeks',
    milestone: 'Transformation phase active with measurable improvement.',
    defaultWeek: 5,
  },
  3: {
    duration: 'Ongoing',
    milestone: 'Maintenance phase to protect and extend results.',
    defaultWeek: 13,
  },
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function calculateMonthlyPayment(principal: number, apr: number, months: number): number {
  if (!Number.isFinite(principal) || principal <= 0 || months <= 0) return 0;
  if (apr <= 0) return Math.round(principal / months);

  const monthlyRate = apr / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  return Math.round(payment);
}

function recalculatePackage(pkg: MastermindPlan['packages'][number]): MastermindPlan['packages'][number] {
  if (!Array.isArray(pkg.lineItems) || pkg.lineItems.length === 0) {
    return {
      ...pkg,
      lineItems: [],
      originalPrice: 0,
      price: 0,
      totalPrice: 0,
      sessions: 0,
      monthlyPayment12: 0,
      monthlyPayment24: 0,
      savingsVsStandalone: 0,
    };
  }

  const originalPrice = Math.round(
    pkg.lineItems.reduce((sum, lineItem) => {
      const qty = Number.isFinite(lineItem.qty) ? lineItem.qty : 0;
      const unitPrice = Number.isFinite(lineItem.unitPrice) ? lineItem.unitPrice : 0;
      const total = Number.isFinite(lineItem.total) ? lineItem.total : qty * unitPrice;
      return sum + total;
    }, 0),
  );

  const discount = Number.isFinite(pkg.discount) ? Math.min(90, Math.max(0, pkg.discount)) : 0;
  const price = Math.round(originalPrice * (1 - discount / 100));
  const sessions = pkg.lineItems.reduce((sum, lineItem) => sum + (Number.isFinite(lineItem.qty) ? lineItem.qty : 0), 0);

  return {
    ...pkg,
    originalPrice,
    price,
    totalPrice: price,
    sessions,
    monthlyPayment12: calculateMonthlyPayment(price, PACKAGE_APR, 12),
    monthlyPayment24: calculateMonthlyPayment(price, PACKAGE_APR, 24),
    savingsVsStandalone: Math.max(0, originalPrice - price),
  };
}

function inferTargetZones(service: UnifiedService): FacialZone[] {
  const areas = service.bodyAreas.map((area) => area.toLowerCase());
  const zones: FacialZone[] = [];

  if (areas.some((area) => area.includes('face'))) {
    zones.push('forehead', 'cheeks_left', 'cheeks_right');
  }
  if (areas.some((area) => area.includes('neck'))) {
    zones.push('neck');
  }
  if (areas.some((area) => area.includes('chest') || area.includes('decollete'))) {
    zones.push('decolletage');
  }
  if (areas.some((area) => area.includes('jaw'))) {
    zones.push('jawline');
  }
  if (areas.some((area) => area.includes('chin'))) {
    zones.push('chin');
  }

  if (zones.length === 0) {
    zones.push('jawline');
  }

  return Array.from(new Set(zones)).slice(0, 3);
}

function ensurePrimaryCoverage(recommendations: MastermindPlan['recommendations']): MastermindPlan['recommendations'] {
  if (recommendations.primary.length > 0) return recommendations;

  if (recommendations.complementary.length > 0) {
    const promoted = { ...recommendations.complementary[0], priority: 'essential' as const };
    return {
      ...recommendations,
      primary: [promoted],
      complementary: recommendations.complementary.slice(1),
    };
  }

  if (recommendations.maintenance.length > 0) {
    const promoted = { ...recommendations.maintenance[0], priority: 'essential' as const };
    return {
      ...recommendations,
      primary: [promoted],
      maintenance: recommendations.maintenance.slice(1),
    };
  }

  return recommendations;
}

function getBucketByTreatmentId(plan: MastermindPlan, treatmentId: string): TreatmentBucket | null {
  if (plan.recommendations.primary.some((treatment) => treatment.id === treatmentId)) return 'primary';
  if (plan.recommendations.complementary.some((treatment) => treatment.id === treatmentId)) return 'complementary';
  if (plan.recommendations.maintenance.some((treatment) => treatment.id === treatmentId)) return 'maintenance';
  return null;
}

function buildTreatmentFromService(service: UnifiedService, bucket: TreatmentBucket): MastermindTreatment {
  const meta = BUCKET_META[bucket];
  const sessionsRequired = Math.max(1, service.sessions || 1);
  const now = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);

  return {
    id: `tx_custom_${service.id}_${now}_${random}`,
    treatmentName: service.name,
    category: service.category,
    targetConcerns: service.concerns.length > 0 ? service.concerns.slice(0, 3) : ['overall skin quality'],
    targetZones: inferTargetZones(service),
    sessionsRequired,
    intervalBetweenSessions: sessionsRequired > 1 ? '4-6 weeks' : 'As clinically indicated',
    expectedImprovement:
      service.results ||
      `Progressive improvement in ${service.concerns.slice(0, 2).join(', ') || 'skin quality'}`,
    timeToResults: service.results || '2-6 weeks',
    longevity: service.results || '3-6 months',
    perSession: service.price,
    totalEstimate: service.price * sessionsRequired,
    priority: meta.priority,
    urgency: meta.urgency,
    downtime: service.downtime || 'Minimal',
    riskLevel: 'low',
    contraindications: [],
    synergiesWith: [],
    aiConfidence: 88,
    aiReasoning: `Provider curated ${service.name} to strengthen the personalized treatment architecture.`,
    clinicalRationale:
      service.description ||
      `Added by provider after AI draft for enhanced protocol precision and better clinical fit.`,
  };
}

function matchesLineItemToTreatment(serviceName: string, treatment: MastermindTreatment): boolean {
  const normalizedLine = normalizeText(serviceName);
  const fullName = normalizeText(treatment.treatmentName);
  const baseName = normalizeText(treatment.treatmentName.split(/[-—]/)[0] || treatment.treatmentName);
  const category = normalizeText(treatment.category);

  const candidates = [fullName, baseName, category].filter((candidate) => candidate.length >= 3);
  return candidates.some(
    (candidate) => normalizedLine.includes(candidate) || candidate.includes(normalizedLine),
  );
}

function removeTreatmentFromPlan(
  plan: MastermindPlan,
  treatmentId: string,
): { plan: MastermindPlan; removed: MastermindTreatment; bucket: TreatmentBucket } | null {
  const next = JSON.parse(JSON.stringify(plan)) as MastermindPlan;
  const bucket = getBucketByTreatmentId(next, treatmentId);
  if (!bucket) return null;

  const bucketList = next.recommendations[bucket];
  const removed = bucketList.find((treatment) => treatment.id === treatmentId);
  if (!removed) return null;

  next.recommendations[bucket] = bucketList.filter((treatment) => treatment.id !== treatmentId);
  next.recommendations = ensurePrimaryCoverage(next.recommendations);

  next.sequencing = next.sequencing
    .map((sequenceItem) => ({
      ...sequenceItem,
      treatments: sequenceItem.treatments.filter(
        (sequenceTreatment) => sequenceTreatment.treatmentId !== treatmentId,
      ),
    }))
    .filter((sequenceItem) => sequenceItem.treatments.length > 0);

  next.aftercarePreview = next.aftercarePreview.filter(
    (aftercareItem) => aftercareItem.treatmentId !== treatmentId,
  );

  next.packages = next.packages.map((pkg) => {
    const updatedLineItems = pkg.lineItems.filter(
      (lineItem) => !matchesLineItemToTreatment(lineItem.service, removed),
    );

    if (updatedLineItems.length === pkg.lineItems.length) {
      return pkg;
    }

    return recalculatePackage({
      ...pkg,
      lineItems: updatedLineItems,
    });
  });

  return { plan: next, removed, bucket };
}

function addServiceToPlan(
  plan: MastermindPlan,
  service: UnifiedService,
  bucket: TreatmentBucket,
): { plan: MastermindPlan; added: MastermindTreatment } {
  const next = JSON.parse(JSON.stringify(plan)) as MastermindPlan;
  const added = buildTreatmentFromService(service, bucket);
  const meta = BUCKET_META[bucket];

  next.recommendations[bucket].push(added);
  next.recommendations = ensurePrimaryCoverage(next.recommendations);

  const phase = meta.phase;
  const existingPhase = next.sequencing.find((sequenceItem) => sequenceItem.phase === phase);
  const maxWeekInPhase = existingPhase
    ? existingPhase.treatments.reduce((max, item) => Math.max(max, item.week), 0)
    : 0;
  const nextWeek = maxWeekInPhase > 0 ? maxWeekInPhase + 2 : PHASE_TIMELINE[phase].defaultWeek;

  if (existingPhase) {
    existingPhase.treatments.push({
      treatmentId: added.id,
      week: nextWeek,
      sessionNumber: 1,
    });
  } else {
    next.sequencing.push({
      phase,
      phaseName: phase === 1 ? 'Foundation & Assessment' : phase === 2 ? 'Active Optimization' : 'Maintenance & Longevity',
      duration: PHASE_TIMELINE[phase].duration,
      treatments: [
        {
          treatmentId: added.id,
          week: nextWeek,
          sessionNumber: 1,
        },
      ],
      expectedMilestone: PHASE_TIMELINE[phase].milestone,
    });
    next.sequencing.sort((a, b) => a.phase - b.phase);
  }

  next.aftercarePreview.push({
    treatmentId: added.id,
    immediateAftercare: ['Follow your provider aftercare instructions for the first 24-48 hours.'],
    weekOneGuidance: ['Use broad-spectrum SPF daily and avoid aggressive actives unless cleared by provider.'],
    productsRecommended: [
      {
        product: 'SPF 50 Broad-Spectrum Sunscreen',
        reason: 'Protect post-treatment skin and preserve treatment outcomes.',
      },
    ],
  });

  const tiersToUpdate =
    bucket === 'primary'
      ? new Set(['Start', 'Transform', 'Elite', 'Essential'])
      : bucket === 'complementary'
        ? new Set(['Transform', 'Elite'])
        : new Set(['Elite']);

  next.packages = next.packages.map((pkg) => {
    if (!tiersToUpdate.has(pkg.tier)) return pkg;

    const existingIndex = pkg.lineItems.findIndex(
      (lineItem) => normalizeText(lineItem.service) === normalizeText(service.name),
    );

    const lineItems = [...pkg.lineItems];

    if (existingIndex >= 0) {
      const current = lineItems[existingIndex];
      const nextQty = current.qty + added.sessionsRequired;
      lineItems[existingIndex] = {
        ...current,
        qty: nextQty,
        unitPrice: service.price,
        total: nextQty * service.price,
      };
    } else {
      lineItems.push({
        service: service.name,
        qty: added.sessionsRequired,
        unitPrice: service.price,
        total: added.totalEstimate,
      });
    }

    return recalculatePackage({
      ...pkg,
      lineItems,
    });
  });

  return { plan: next, added };
}

function buildModification(type: PlanModification['type'], details: string, treatmentId?: string): PlanModification {
  return {
    id: `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    treatmentId,
    details,
    providerId: 'pending_auth',
  };
}

export default function PlanEditor({
  session,
  onValidate,
  onDispatch,
}: PlanEditorProps) {
  const canonicalPlan = session.mastermindPlan;
  const review = session.providerReview;

  const [workingPlan, setWorkingPlan] = useState<MastermindPlan | null>(canonicalPlan);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [addBucket, setAddBucket] = useState<TreatmentBucket>('complementary');

  useEffect(() => {
    setWorkingPlan(canonicalPlan);
  }, [canonicalPlan]);

  useEffect(() => {
    if (!review?.clinicalNotes?.length) return;
    setNoteInput(review.clinicalNotes.join('\n'));
  }, [review?.clinicalNotes]);

  useEffect(() => {
    if (!workingPlan) return;
    onValidate().then((result) => {
      if (result) setValidation(result);
    });
  }, [workingPlan, onValidate]);

  const allTreatments = useMemo(() => {
    if (!workingPlan) return [];

    return [
      ...workingPlan.recommendations.primary.map((treatment) => ({
        ...treatment,
        tierLabel: BUCKET_META.primary.label,
        tierKey: 'primary' as const,
      })),
      ...workingPlan.recommendations.complementary.map((treatment) => ({
        ...treatment,
        tierLabel: BUCKET_META.complementary.label,
        tierKey: 'complementary' as const,
      })),
      ...workingPlan.recommendations.maintenance.map((treatment) => ({
        ...treatment,
        tierLabel: BUCKET_META.maintenance.label,
        tierKey: 'maintenance' as const,
      })),
    ];
  }, [workingPlan]);

  const availableServices = useMemo(() => {
    const normalizedQuery = normalizeText(serviceQuery);

    return UNIFIED_CATALOG.filter((service) => {
      if (!normalizedQuery) return true;

      const haystack = normalizeText(
        [service.name, service.description, service.category, ...service.concerns].join(' '),
      );

      return haystack.includes(normalizedQuery);
    })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 18);
  }, [serviceQuery]);

  const persistPlanUpdate = useCallback(
    async (
      updatedPlan: MastermindPlan,
      modification: PlanModification,
    ) => {
      setWorkingPlan(updatedPlan);
      setIsSavingEdit(true);

      try {
        if (!session.providerReview) {
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

        await onDispatch({ type: 'SET_PLAN', plan: updatedPlan });
        await onDispatch({ type: 'ADD_MODIFICATION', modification });
        await onDispatch({ type: 'SET_PHASE', phase: 'provider_review' });

        if (session.providerReview) {
          await onDispatch({ type: 'SET_APPROVAL_STATUS', status: 'pending' });
        }

        const result = await onValidate();
        if (result) setValidation(result);
      } finally {
        setIsSavingEdit(false);
      }
    },
    [noteInput, onDispatch, onValidate, session.providerReview],
  );

  const handleRemoveTreatment = useCallback(
    async (treatmentId: string) => {
      if (!workingPlan || isSavingEdit) return;

      const removedResult = removeTreatmentFromPlan(workingPlan, treatmentId);
      if (!removedResult) return;

      await persistPlanUpdate(
        removedResult.plan,
        buildModification(
          'remove',
          `Removed ${removedResult.removed.treatmentName} from ${BUCKET_META[removedResult.bucket].label} recommendations.`,
          removedResult.removed.id,
        ),
      );
    },
    [isSavingEdit, persistPlanUpdate, workingPlan],
  );

  const handleAddService = useCallback(
    async (service: UnifiedService) => {
      if (!workingPlan || isSavingEdit) return;

      const addedResult = addServiceToPlan(workingPlan, service, addBucket);
      await persistPlanUpdate(
        addedResult.plan,
        buildModification(
          'add',
          `Added ${addedResult.added.treatmentName} to ${BUCKET_META[addBucket].label} recommendations.`,
          addedResult.added.id,
        ),
      );
      setServiceQuery('');
    },
    [addBucket, isSavingEdit, persistPlanUpdate, workingPlan],
  );

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
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

  if (!workingPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F8F6F1] flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-[#0F1D2C]/20" />
        </div>
        <h3 className="font-body text-sm font-medium text-[#0F1D2C]/60">
          No Treatment Plan Yet
        </h3>
        <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
          Generate a full AI plan first, then curate services in this panel.
        </p>
      </div>
    );
  }

  const totalCost = allTreatments.reduce((sum, treatment) => sum + treatment.totalEstimate, 0);
  const approvalStatus = review?.approvalStatus || 'pending';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0F1D2C]">
          Treatment Plan
        </h2>
        <div className="flex items-center gap-2">
          {isSavingEdit && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F1D2C]/10 text-[#0F1D2C]/70 font-body text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving edit...
            </span>
          )}
          {approvalStatus === 'approved' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#059669]/10 text-[#059669] font-body text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Approved
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#C9A96E]/25 bg-[#C9A96E]/5 p-4 space-y-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#0F1D2C]/65">
            Provider Curation
          </p>
          <p className="font-body text-xs text-[#0F1D2C]/55 mt-1">
            AI created the full plan first. Add or remove treatments here to finalize an elite, provider-led protocol.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#0F1D2C]/30" />
            <input
              value={serviceQuery}
              onChange={(event) => setServiceQuery(event.target.value)}
              placeholder="Search catalog to add treatment..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8E4DF] font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
            />
          </div>

          <select
            value={addBucket}
            onChange={(event) => setAddBucket(event.target.value as TreatmentBucket)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DF] font-body text-sm text-[#0F1D2C] outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
          >
            <option value="primary">Add to Primary</option>
            <option value="complementary">Add to Complementary</option>
            <option value="maintenance">Add to Maintenance</option>
          </select>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {availableServices.length === 0 ? (
            <p className="font-body text-xs text-[#0F1D2C]/40 py-2">No services match this search.</p>
          ) : (
            availableServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E4DF] bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-[#0F1D2C] truncate">{service.name}</p>
                  <p className="font-body text-xs text-[#0F1D2C]/45 truncate">
                    {service.category.replace(/-/g, ' ')} · ${service.price.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAddService(service)}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#0F1D2C]/15 text-[#0F1D2C]/75 font-body text-xs font-medium hover:bg-[#0F1D2C]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {validation && validation.warnings.length > 0 && (
        <div className="space-y-2">
          {validation.warnings.map((warning, index) => {
            const Icon =
              warning.severity === 'error'
                ? AlertTriangle
                : warning.severity === 'warning'
                  ? AlertTriangle
                  : Info;
            const colors =
              warning.severity === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : warning.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700';

            return (
              <motion.div
                key={`${warning.message}-${index}`}
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
              <div className="w-full flex items-center gap-2 p-3 hover:bg-[#F8F6F1]/50 transition-colors">
                <button
                  type="button"
                  onClick={() => setExpandedTreatment(isExpanded ? null : treatment.id)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left"
                >
                  <span className={`px-2 py-0.5 rounded-md font-body text-xs font-medium ${priorityColors[treatment.priority]}`}>
                    {treatment.priority === 'essential' ? 'E' : treatment.priority === 'recommended' ? 'R' : 'O'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-[#0F1D2C] truncate">
                      {treatment.treatmentName}
                    </p>
                    <p className="font-body text-xs text-[#0F1D2C]/40">
                      {treatment.tierLabel} · {treatment.sessionsRequired} session{treatment.sessionsRequired !== 1 ? 's' : ''}
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

                <button
                  type="button"
                  onClick={() => void handleRemoveTreatment(treatment.id)}
                  disabled={isSavingEdit}
                  className="w-7 h-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Remove treatment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

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

      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F1D2C]/5 border border-[#0F1D2C]/10">
        <span className="font-body text-sm font-medium text-[#0F1D2C]">Plan Total</span>
        <span className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#0F1D2C]">
          ${totalCost.toLocaleString()}
        </span>
      </div>

      {workingPlan.packages.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Package Options
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {workingPlan.packages.map((pkg) => (
              <div
                key={pkg.tier}
                className={`p-3 rounded-xl border text-center ${
                  pkg.highlighted ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#E8E4DF]'
                }`}
              >
                <p className="font-body text-xs font-semibold text-[#0F1D2C]">{pkg.tier}</p>
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#0F1D2C] mt-1">
                  ${pkg.price.toLocaleString()}
                </p>
                <p className="font-body text-xs text-[#0F1D2C]/40">{pkg.sessions} sessions</p>
                {pkg.discount > 0 && (
                  <p className="font-body text-xs text-[#059669] font-medium mt-1">Save {pkg.discount}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
          Clinical Notes
        </h3>
        <textarea
          value={noteInput}
          onChange={(event) => setNoteInput(event.target.value)}
          placeholder="Add clinical notes or modifications..."
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF] font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 resize-none"
        />
      </div>

      {approvalStatus !== 'approved' && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={isApproving || isSavingEdit || (validation?.errorCount ?? 0) > 0}
          className={`w-full py-3 rounded-xl font-body font-semibold text-sm transition-all ${
            isApproving || isSavingEdit || (validation?.errorCount ?? 0) > 0
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
