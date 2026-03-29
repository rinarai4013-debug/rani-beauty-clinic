'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Save,
  Eye,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wand2,
  Send,
  Printer,
  BookTemplate,
} from 'lucide-react';

import { usePlanBuilder } from '@/hooks/usePlanBuilder';
import ClientSelector from '@/components/dashboard/plan-builder/ClientSelector';
import CatalogSearch from '@/components/dashboard/plan-builder/CatalogSearch';
import ServiceCatalogCard from '@/components/dashboard/plan-builder/ServiceCatalogCard';
import PhaseDropZone from '@/components/dashboard/plan-builder/PhaseDropZone';
import PlanTotals from '@/components/dashboard/plan-builder/PlanTotals';
import PackageCalculator from '@/components/dashboard/plan-builder/PackageCalculator';
import PlanEconomics from '@/components/dashboard/plan-builder/PlanEconomics';
import PlanPreviewModal from '@/components/dashboard/plan-builder/PlanPreviewModal';

import {
  UNIFIED_CATALOG,
  searchServices,
  getServicesByCategory,
} from '@/data/services/unified-catalog';
import type { UnifiedService } from '@/data/services/unified-catalog';
import { serializeToPlanData, convertToTreatmentPackages, serializeForAirtable } from '@/lib/plan-builder/plan-serializer';
import { recommendTreatmentPlan } from '@/lib/plan-builder/ai-recommender';
import ProviderNotes from '@/components/dashboard/plan-builder/ProviderNotes';

function parseFitzpatrick(skinType: string): 1 | 2 | 3 | 4 | 5 | 6 | undefined {
  if (!skinType) return undefined;
  const match = skinType.match(/(\d)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 6) return num as 1 | 2 | 3 | 4 | 5 | 6;
  }
  const lower = skinType.toLowerCase();
  if (lower.includes('fair') || lower.includes('light') || lower.includes('type i')) return 1;
  if (lower.includes('medium') || lower.includes('olive')) return 3;
  if (lower.includes('dark') || lower.includes('brown')) return 5;
  return undefined;
}

export default function PlanBuilderPage() {
  const {
    state,
    dispatch,
    addService,
    removeService,
    setQuantity,
    setNotes,
    moveToPhase,
    packages,
    totalServices,
    totalValue,
  } = usePlanBuilder();

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filteredServices = useMemo(() => {
    let results: UnifiedService[];
    if (state.searchQuery) {
      results = searchServices(state.searchQuery);
    } else if (state.activeCategory !== 'all') {
      results = getServicesByCategory(state.activeCategory);
    } else {
      results = UNIFIED_CATALOG;
    }
    if (state.searchQuery && state.activeCategory !== 'all') {
      results = results.filter((s) => s.category === state.activeCategory);
    }
    return results;
  }, [state.searchQuery, state.activeCategory]);

  const handleSave = useCallback(async () => {
    if (!state.client) {
      toast.error('Please select a client first');
      return;
    }
    if (totalServices === 0) {
      toast.error('Add at least one service to the plan');
      return;
    }

    setSaving(true);
    try {
      const airtableData = serializeForAirtable(state, packages);
      const method = state.savedPlanId ? 'PATCH' : 'POST';
      const body = state.savedPlanId
        ? {
            id: state.savedPlanId,
            planTier: airtableData['Plan Tier'],
            planValue: airtableData['Plan Value'],
            planName: airtableData['Plan Name'],
            servicesIncluded: airtableData['Services Included'],
          }
        : {
            client: airtableData['Client'],
            clientName: airtableData['Client Name'],
            planName: airtableData['Plan Name'],
            planTier: airtableData['Plan Tier'],
            planValue: airtableData['Plan Value'],
            servicesIncluded: airtableData['Services Included'],
            intakeRecordId: state.client.intakeId,
          };

      const res = await fetch('/api/dashboard/plan-builder', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const planId = data.id || state.savedPlanId;
      dispatch({ type: 'MARK_SAVED', planId });
      toast.success(state.savedPlanId ? 'Plan updated' : 'Plan saved');
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  }, [state, packages, totalServices, dispatch]);

  const handlePreview = useCallback(() => {
    if (totalServices === 0) {
      toast.error('Add services to preview the plan');
      return;
    }
    setShowPreview(true);
  }, [totalServices]);

  const handleClear = useCallback(() => {
    if (state.isDirty) {
      const ok = window.confirm('Discard unsaved changes?');
      if (!ok) return;
    }
    dispatch({ type: 'CLEAR' });
    toast.success('Plan cleared');
  }, [state.isDirty, dispatch]);

  const handleReorder = useCallback(
    (phase: 1 | 2 | 3, fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER', phase, fromIndex, toIndex });
    },
    [dispatch]
  );

  const handleAISuggest = useCallback(async () => {
    if (!state.client) {
      toast.error('Select a client first to get AI recommendations');
      return;
    }

    let concerns = state.client.skinConcerns || [];
    let interests = state.client.treatmentInterests || [];

    // Always try to enrich from intake/intelligence data (includes Aura scan results)
    try {
      const res = await fetch(`/api/dashboard/clients/${state.client.id}?full=true`);
      if (res.ok) {
        const data = await res.json();
        // Pull concerns from intake data (Aura scan populates these)
        const intakeConcerns = data.intake?.skinConcerns
          || data.intake?.['Top Skin Concerns']
          || data.intelligence?.concerns
          || [];
        const intakeInterests = data.intake?.treatmentInterests
          || data.intake?.['Treatment Interests']
          || [];

        if (concerns.length === 0) {
          concerns = Array.isArray(intakeConcerns) ? intakeConcerns : [intakeConcerns];
        }
        if (interests.length === 0) {
          interests = Array.isArray(intakeInterests) ? intakeInterests : [intakeInterests];
        }

        // Pull Aura scan intelligence for richer recommendations
        const skinType = data.intake?.['Skin Type'] || data.intelligence?.fitzpatrickType;
        const fitzpatrick = skinType ? parseFitzpatrick(skinType) : undefined;

        if (concerns.length > 0 || interests.length > 0) {
          const recs = recommendTreatmentPlan({
            skinConcerns: concerns.filter(Boolean),
            treatmentInterests: interests.filter(Boolean),
            fitzpatrickType: fitzpatrick,
            previousTreatments: data.treatments?.map((t: { service: string }) => t.service) || [],
          });
          if (recs.length > 0) {
            if (totalServices > 0) {
              const ok = window.confirm(`Replace current plan with ${recs.length} AI-recommended treatments?`);
              if (!ok) return;
            }
            dispatch({ type: 'CLEAR' });
            dispatch({ type: 'SET_CLIENT', client: state.client });
            for (const rec of recs) {
              addService(rec.service.id, rec.service, rec.phase);
            }
            const quickWin = recs.find((r) => r.quickWin);
            const anchor = recs.find((r) => r.anchorTreatment);
            let msg = `Added ${recs.length} AI-recommended treatments`;
            if (quickWin) msg += ` — Quick win: ${quickWin.service.name}`;
            toast.success(msg);
            return;
          }
        }
      }
    } catch {
      // Fall through to direct concern matching
    }

    if (concerns.length === 0 && interests.length === 0) {
      toast.error('No skin concerns or Aura scan data found for this client');
      return;
    }

    const recs = recommendTreatmentPlan({ skinConcerns: concerns, treatmentInterests: interests });
    if (recs.length === 0) {
      toast.error('No matching treatments found for this client\'s concerns');
      return;
    }

    // If plan already has services, confirm before replacing
    if (totalServices > 0) {
      const ok = window.confirm(`Replace current plan with ${recs.length} AI-recommended treatments?`);
      if (!ok) return;
    }

    dispatch({ type: 'CLEAR' });
    dispatch({ type: 'SET_CLIENT', client: state.client });
    for (const rec of recs) {
      addService(rec.service.id, rec.service, rec.phase);
    }
    toast.success(`Added ${recs.length} AI-recommended treatments across 3 phases`);
  }, [state.client, totalServices, dispatch, addService]);

  const handleSendToClient = useCallback(async () => {
    if (!state.savedPlanId || !state.client) {
      toast.error('Save the plan first, then send to client');
      return;
    }
    if (!state.client.email) {
      toast.error('Client email is required to send the plan');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/dashboard/plan-builder/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: state.savedPlanId,
          clientEmail: state.client.email,
          clientName: state.client.name,
          clientPhone: state.client.phone,
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      toast.success('Plan sent to client!');
    } catch {
      toast.error('Failed to send plan');
    } finally {
      setSending(false);
    }
  }, [state.savedPlanId, state.client]);

  const handleExportPDF = useCallback(async () => {
    if (totalServices === 0) {
      toast.error('Add services before exporting');
      return;
    }
    try {
      const res = await fetch('/api/dashboard/plan-builder/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planData: serializeToPlanData(state),
          packages: packages.map((p) => ({
            tier: p.tier, name: p.name, price: p.price,
            originalPrice: p.originalPrice, discount: p.discount,
            sessions: p.sessions, lineItems: p.lineItems, extras: p.extras,
            monthlyPayment12: p.monthlyPayment12, monthlyPayment24: p.monthlyPayment24,
          })),
        }),
      });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch {
      toast.error('Failed to generate PDF');
    }
  }, [state, packages, totalServices]);

  const previewPlanData = useMemo(() => serializeToPlanData(state), [state]);
  const previewPackages = useMemo(() => convertToTreatmentPackages(packages), [packages]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#C9A96E]" />
              <h1 className="text-lg font-heading font-semibold text-[#0F1D2C] hidden sm:block">
                Treatment Plan Builder
              </h1>
            </div>
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Plan name..."
                value={state.planName}
                onChange={(e) => dispatch({ type: 'SET_PLAN_NAME', name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A96E]/30 focus:border-[#C9A96E] outline-none"
                aria-label="Plan name"
              />
            </div>
            <div className="max-w-[240px]">
              <ClientSelector
                selected={state.client}
                onSelect={(client) => dispatch({ type: 'SET_CLIENT', client })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.isDirty && (
              <span className="text-xs text-amber-600 font-medium hidden sm:block">Unsaved</span>
            )}
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear plan"
              aria-label="Clear plan"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleAISuggest}
              disabled={!state.client}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#C9A96E] bg-[#C9A96E]/10 rounded-lg hover:bg-[#C9A96E]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Auto-populate plan with AI-recommended treatments based on client concerns"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">AI Suggest</span>
            </button>
            <button
              onClick={handlePreview}
              disabled={totalServices === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0F1D2C] bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || totalServices === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[#0F1D2C] rounded-lg hover:bg-[#1A2A3C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left sidebar — Service Catalog */}
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="w-80 space-y-3">
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h2 className="text-sm font-semibold text-[#0F1D2C] mb-3">Service Catalog</h2>
                    <CatalogSearch
                      query={state.searchQuery}
                      category={state.activeCategory}
                      onSearch={(q) => dispatch({ type: 'SET_SEARCH', query: q })}
                      onCategoryChange={(cat) => dispatch({ type: 'SET_CATEGORY', category: cat })}
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-2">
                      {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredServices.map((service) => (
                        <ServiceCatalogCard
                          key={service.id}
                          service={service}
                          onAdd={(svc) => addService(svc.id, svc)}
                        />
                      ))}
                      {filteredServices.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">
                          No services match your search
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex-shrink-0 self-start mt-4 p-1 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            aria-label={sidebarCollapsed ? 'Show catalog' : 'Hide catalog'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* Center — Phase Drop Zones */}
          <main className="flex-1 min-w-0 space-y-4">
            {state.phases.map((phase) => (
              <PhaseDropZone
                key={phase.id}
                phase={phase}
                onRemove={removeService}
                onSetQty={setQuantity}
                onSetNotes={setNotes}
                onMoveToPhase={moveToPhase}
                onReorder={handleReorder}
              />
            ))}
          </main>

          {/* Right sidebar — Summary */}
          <aside className="hidden xl:block flex-shrink-0 w-72 space-y-4">
            <PlanTotals
              totalServices={totalServices}
              totalValue={totalValue}
              packages={packages}
            />
            <PackageCalculator packages={packages} />
            <PlanEconomics
              packages={packages}
              totalServices={totalServices}
              totalValue={totalValue}
            />
            <ProviderNotes
              phases={state.phases}
              client={state.client}
              packages={packages}
            />

            {state.savedPlanId && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Client Link</p>
                  <a
                    href={`/plan/${state.savedPlanId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#C9A96E] hover:underline break-all"
                  >
                    /plan/{state.savedPlanId}
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendToClient}
                    disabled={sending || !state.client?.email}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#C9A96E] rounded-lg hover:bg-[#B8944F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Send to Client
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F1D2C] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Print / Export PDF"
                  >
                    <Printer className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Export button (even before save) */}
            {!state.savedPlanId && totalServices > 0 && (
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F1D2C] bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Preview
              </button>
            )}
          </aside>
        </div>

        {/* Mobile summary */}
        <div className="xl:hidden mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanTotals
            totalServices={totalServices}
            totalValue={totalValue}
            packages={packages}
          />
          <PackageCalculator packages={packages} />
        </div>
      </div>

      {/* Preview Modal */}
      <PlanPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        planData={previewPlanData}
        packages={previewPackages}
      />
    </div>
  );
}
