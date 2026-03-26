'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Send, Users, Calendar, Clock,
  BarChart3, Eye, MousePointerClick, DollarSign,
  CheckCheck, AlertTriangle, Beaker,
} from 'lucide-react';
import StatCard, { StatCardRow } from '@/components/dashboard/shared/StatCard';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import { useCampaignDetail } from '@/hooks/useDashboardData';
import type { Campaign } from '@/types/communications';

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-600' },
  sending: { label: 'Sending', bg: 'bg-amber-50', text: 'text-amber-600' },
  sent: { label: 'Sent', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  paused: { label: 'Paused', bg: 'bg-orange-50', text: 'text-orange-600' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error, mutate } = useCampaignDetail(id);

  const campaign = (data as { campaign: Campaign } | undefined)?.campaign;

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Campaign Detail">
        <InlineError message="Failed to load campaign" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  if (isLoading || !campaign) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 bg-gray-100 rounded w-48" />
        <div className="animate-pulse grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft;
  const m = campaign.metrics;

  return (
    <DashboardErrorBoundary pageName="Campaign Detail">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/communications/campaigns"
            className="flex items-center gap-1.5 text-xs font-body font-medium text-rani-muted hover:text-rani-navy transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Campaigns
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">{campaign.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-body font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
            {campaign.abTest?.enabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-purple-50 text-purple-600">
                <Beaker className="w-3 h-3" />
                A/B Test
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs font-body text-rani-muted">
            <span className="capitalize">{campaign.type}</span>
            <span className="text-rani-border">|</span>
            <span>{campaign.channel === 'both' ? 'SMS + Email' : campaign.channel.toUpperCase()}</span>
            <span className="text-rani-border">|</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {campaign.audienceSize.toLocaleString()} recipients
            </span>
            {campaign.sentAt && (
              <>
                <span className="text-rani-border">|</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Sent {new Date(campaign.sentAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Performance KPIs */}
        <StatCardRow columns={4}>
          <StatCard
            title="Total Sent"
            value={m.totalSent}
            format="number"
            icon={Send}
          />
          <StatCard
            title="Open Rate"
            value={m.openRate}
            format="percent"
            icon={Eye}
            trend={m.openRate > 25
              ? { value: m.openRate - 25, direction: 'up' as const, label: 'vs 25% avg' }
              : { value: 25 - m.openRate, direction: 'down' as const, label: 'vs 25% avg' }
            }
          />
          <StatCard
            title="Click Rate"
            value={m.clickRate}
            format="percent"
            icon={MousePointerClick}
          />
          <StatCard
            title="Revenue"
            value={m.revenueAttributed}
            format="currency"
            icon={DollarSign}
          />
        </StatCardRow>

        {/* Delivery Funnel */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy mb-4">Delivery Funnel</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[
              { label: 'Sent', value: m.totalSent, color: 'text-blue-600' },
              { label: 'Delivered', value: m.delivered, color: 'text-emerald-600' },
              { label: 'Opened', value: m.opened, color: 'text-purple-600' },
              { label: 'Clicked', value: m.clicked, color: 'text-indigo-600' },
              { label: 'Bounced', value: m.bounced, color: 'text-amber-600' },
              { label: 'Unsub', value: m.unsubscribed, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-body font-bold ${color}`}>{value.toLocaleString()}</p>
                <p className="text-[10px] font-body text-rani-muted">{label}</p>
                {m.totalSent > 0 && (
                  <p className="text-[10px] font-body text-rani-muted">
                    {((value / m.totalSent) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* A/B Test Results */}
        {campaign.abTest?.enabled && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy mb-4 flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              A/B Test Results
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg border p-4 ${campaign.abTest.winner === 'A' ? 'border-emerald-300 bg-emerald-50/50' : 'border-rani-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-body font-semibold text-rani-navy">
                    {campaign.abTest.variantA.label}
                  </span>
                  {campaign.abTest.winner === 'A' && (
                    <span className="text-[10px] font-body font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Winner
                    </span>
                  )}
                </div>
                <p className="text-xs font-body text-rani-text line-clamp-2">{campaign.abTest.variantA.body}</p>
              </div>
              <div className={`rounded-lg border p-4 ${campaign.abTest.winner === 'B' ? 'border-emerald-300 bg-emerald-50/50' : 'border-rani-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-body font-semibold text-rani-navy">
                    {campaign.abTest.variantB.label}
                  </span>
                  {campaign.abTest.winner === 'B' && (
                    <span className="text-[10px] font-body font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Winner
                    </span>
                  )}
                </div>
                <p className="text-xs font-body text-rani-text line-clamp-2">{campaign.abTest.variantB.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message Preview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy mb-3">Message Content</h3>
          {campaign.subject && (
            <p className="text-xs font-body font-semibold text-rani-text mb-2">
              Subject: {campaign.subject}
            </p>
          )}
          <div className="rounded-lg bg-gray-50 border border-rani-border p-4">
            <p className="text-sm font-body text-rani-text whitespace-pre-wrap">{campaign.body}</p>
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
