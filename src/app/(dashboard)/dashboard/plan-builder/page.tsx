'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Save, Eye, Send, Sparkles, RotateCcw,
} from 'lucide-react';
import { usePlanBuilder } from '@/hooks/usePlanBuilder';
import {
  searchServices,
  getServicesByCategory,
  UNIFIED_CATALOG,
} from '@/data/services/unified-catalog';
import type { UnifiedService, ServiceCategory } from '@/data/services/unified-catalog';
import { serializeToPlanData, convertToTreatmentPackages, serializeForAirtable } from '@/lib/plan-builder/plan-serializer';
import CatalogSearch from '@/components/dashboard/plan-builder/CatalogSearch';
import ServiceCatalogCard from '@/components/dashboard/plan-builder/ServiceCatalogCard';
import PhaseDropZone from '@/components/dashboard/plan-builder/PhaseDropZone';
import PackageCalculator from '@/components/dashboard/plan-builder/PackageCalculator';
import PlanTotals from '@/components/dashboard/plan-builder/PlanTotals';
import PlanPreviewModal from '@/components/dashboard/plan-builder/PlanPreviewModal';
import ClientSelector from '@/components/dashboard/plan-builder/ClientSelector';

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

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Filtered catalog
  const filteredServices = useMemo(() => {
    let services: UnifiedService[];

    if (state.activeCategory !== 'all') {
      services = getServicesByCategory(state.activeCategory);
    } else {
      services = UNIFIED_CATALOG;
    }

    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.includes(query) ||
          s.concerns.some((c) => c.includes(query))
      );
    }

    return services;
  }, [state.activeCategory, state.searchQuery]);

  // Add service to the first non-empty-or-first phase
  const handleAddService = useCallback(
    (service: UnifiedService) => {
      // Default to Phase 1; if Phase 1 has items and Phase 2 is empty, suggest Phase 2
      let targetPhase: 1 | 2 | 3 = 1;
      if (state.phases[0].services.length > 0 && state.phases[1].services.length === 0) {
        targetPhase = 2;
      } else if (
        state.phases[0].services.length > 0 &&
        state.phases[1].services.length > 0 &&
        state.phases[2].services.length === 0
      ) {
        targetPhase = 3;
      }
      addService(service.id, service, targetPhase);
    },
    [addService, state.phases]
  );

  const handleReorder = useCallback(
    (phase: 1 | 2 | 3, fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER', phase, fromIndex, toIndex });
    },
    [dispatch]
  );

  // Preview data
  const previewPlanData = useMemo(() => serializeToPlanData(state), [state]);
  const previewPackages = useMemo(() => convertToTreatmentPackages(packages), [packages]);

  // Save draft
  async function handleSaveDraft() {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const airtableData = serializeForAirtable(state, packages);
      const res = await fetch('/api/dashboard/plan-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          planId: state.savedPlanId,
          data: airtableData,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.planId) {
          dispatch({ type: 'MARK_SAVED', planId: result.planId });
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  // Generate and send
  async function handleGenerateAndSend() {
    setIsSending(true);
    try {
      const airtableData = serializeForAirtable(state, packages);
      const res = await fetch('/api/dashboard/plan-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          planId: state.savedPlanId,
          data: {
            ...airtableData,
            Status: 'Sent',
          },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.planId) {
          dispatch({ type: 'MARK_SAVED', planId: result.planId });
        }
      }
    } catch {
      // Error handling
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#0F1D2C] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#C9A96E]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0F1D2C]">Treatment Plan Builder</h1>
                <p className="text-xs text-gray-400">Create personalized treatment plans</p>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200 mx-2" />

            {/* Client selector */}
            <ClientSelector
              selected={state.client}
              onSelect={(client) => dispatch({ type: 'SET_CLIENT', client })}
            />

            <div className="h-8 w-px bg-gray-200 mx-2" />

            {/* Plan name */}
            <input
              type="text"
              value={state.planName}
              onChange={(e) => dispatch({ type: 'SET_PLAN_NAME', name: e.target.value })}
              placeholder="Plan name..."
              className="w-48 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#0F1D2C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-colors"
            />
          </div>

          {/* Reset */}
          {state.isDirty && (
            <button
              onClick={() => dispatch({ type: 'CLEAR' })}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Body — two columns */}
      <div className="flex gap-6 p-6 max-w-[1600px] mx-auto">
        {/* Left column — Service Catalog (60%) */}
        <div className="w-[60%] space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#C9A96E]" />
              <h2 className="text-sm font-semibold text-[#0F1D2C]">Service Catalog</h2>
              <span className="text-xs text-gray-400 ml-1">
                {filteredServices.length} services
              </span>
            </div>

            <CatalogSearch
              query={state.searchQuery}
              category={state.activeCategory}
              onSearch={(q) => dispatch({ type: 'SET_SEARCH', query: q })}
              onCategoryChange={(cat) => dispatch({ type: 'SET_CATEGORY', category: cat })}
            />

            {/* Service grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
              {filteredServices.map((service) => (
                <ServiceCatalogCard
                  key={service.id}
                  service={service}
                  onAdd={handleAddService}
                />
              ))}
              {filteredServices.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  <p className="text-sm">No services match your search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — Plan Builder (40%) */}
        <div className="w-[40%] space-y-4">
          {/* Phase drop zones */}
          <div className="space-y-3">
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
          </div>

          {/* Plan Totals */}
          <PlanTotals
            totalServices={totalServices}
            totalValue={totalValue}
            packages={packages}
          />

          {/* Package Calculator */}
          <PackageCalculator packages={packages} />
        </div>
      </div>

      {/* Bottom actions bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-40"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.isDirty && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                Unsaved changes
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                Draft saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                Save failed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Save Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || totalServices === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#0F1D2C] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>

            {/* Preview */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              disabled={totalServices === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C9A96E] text-sm font-medium text-[#C9A96E] hover:bg-[#C9A96E]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            {/* Generate & Send */}
            <button
              onClick={handleGenerateAndSend}
              disabled={isSending || totalServices === 0 || !state.client}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F1D2C] text-sm font-medium text-white hover:bg-[#1a2d40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Generating...' : 'Generate & Send'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <PlanPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        planData={previewPlanData}
        packages={previewPackages}
      />
    </div>
  );
}
