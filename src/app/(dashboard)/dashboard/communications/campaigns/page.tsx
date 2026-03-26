'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { CampaignList, CampaignBuilder } from '@/components/dashboard/communications';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import { useCampaigns } from '@/hooks/useDashboardData';
import { useRouter } from 'next/navigation';
import type { Campaign } from '@/types/communications';

export default function CampaignsPage() {
  const { data, isLoading, error, mutate } = useCampaigns();
  const [showBuilder, setShowBuilder] = useState(false);
  const router = useRouter();

  const campaignData = data as { campaigns: Campaign[] } | undefined;
  const campaigns = campaignData?.campaigns ?? [];

  const handleCreateCampaign = useCallback(async (campaign: Partial<Campaign>) => {
    try {
      await fetch('/api/dashboard/communications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      setShowBuilder(false);
      mutate();
    } catch {
      // Error handling
    }
  }, [mutate]);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      await fetch(`/api/dashboard/communications/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', campaignId: id }),
      });
      mutate();
    } catch {
      // Error handling
    }
  }, [mutate]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/dashboard/communications/campaigns`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id }),
      });
      mutate();
    } catch {
      // Error handling
    }
  }, [mutate]);

  return (
    <DashboardErrorBoundary pageName="Campaigns">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Campaigns
          </h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Create, schedule, and track marketing campaigns
          </p>
        </div>

        {/* Campaign Builder */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CampaignBuilder
                onSubmit={handleCreateCampaign}
                onCancel={() => setShowBuilder(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campaign List */}
        {error ? (
          <InlineError message="Failed to load campaigns" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-rani-border p-4">
                <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-72" />
              </div>
            ))}
          </div>
        ) : (
          <CampaignList
            campaigns={campaigns}
            onCreateNew={() => setShowBuilder(true)}
            onEdit={(id) => router.push(`/dashboard/communications/campaigns/${id}`)}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onViewDetails={(id) => router.push(`/dashboard/communications/campaigns/${id}`)}
          />
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
