'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAutomations } from '@/hooks/useCRMData';
import { AutomationCard, AutomationMetricsPanel } from '@/components/dashboard/crm';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { AutomationRecipe, AutomationMetrics, AutomationCategory } from '@/types/crm';

const CATEGORY_FILTERS: { value: AutomationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lead_nurture', label: 'Lead Nurture' },
  { value: 'post_treatment', label: 'Post-Treatment' },
  { value: 'retention', label: 'Retention' },
  { value: 'reactivation', label: 'Reactivation' },
  { value: 'vip', label: 'VIP' },
  { value: 'membership', label: 'Membership' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'review', label: 'Reviews' },
  { value: 'referral', label: 'Referral' },
  { value: 'cross_sell', label: 'Cross-Sell' },
  { value: 'operational', label: 'Operational' },
];

export default function AutomationsPage() {
  const { data, isLoading, error, mutate } = useAutomations();
  const automations = (data?.automations || []) as AutomationRecipe[];
  const metrics = data?.metrics as AutomationMetrics | undefined;
  const [categoryFilter, setCategoryFilter] = useState<AutomationCategory | 'all'>('all');
  const [showEnabled, setShowEnabled] = useState<'all' | 'active' | 'paused'>('all');

  const filtered = automations.filter(a => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (showEnabled === 'active' && !a.isEnabled) return false;
    if (showEnabled === 'paused' && a.isEnabled) return false;
    return true;
  });

  const handleToggle = (id: string, enabled: boolean) => {
    // TODO: API call to toggle automation
  };

  return (
    <DashboardErrorBoundary pageName="Automations">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Automation Library</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            30 pre-built automation recipes for your medical aesthetics practice
          </p>
        </div>

        {error ? (
          <InlineError message="Failed to load automations" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="space-y-6"><PanelSkeleton /><PanelSkeleton /></div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Metrics */}
            {metrics && <AutomationMetricsPanel metrics={metrics} />}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-1">
                {CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.value}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      categoryFilter === f.value
                        ? 'bg-rani-navy text-white'
                        : 'bg-gray-100 text-rani-muted hover:bg-gray-200'
                    }`}
                    onClick={() => setCategoryFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 ml-auto">
                {(['all', 'active', 'paused'] as const).map(status => (
                  <button
                    key={status}
                    className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-colors ${
                      showEnabled === status
                        ? 'bg-rani-gold/20 text-rani-navy'
                        : 'bg-gray-100 text-rani-muted hover:bg-gray-200'
                    }`}
                    onClick={() => setShowEnabled(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Automation Grid */}
            {filtered.length === 0 ? (
              <DashboardEmptyState title="No Automations" description="No automations match your filters." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(automation => (
                  <AutomationCard
                    key={automation.id}
                    automation={automation}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
