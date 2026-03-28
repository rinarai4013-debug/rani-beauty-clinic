'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, Crown, AlertTriangle, TrendingUp, Heart } from 'lucide-react';
import { useCRM360 } from '@/hooks/useCRMData';
import { ClientTimeline, LifecycleJourney, NoteComposer } from '@/components/dashboard/crm';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import type { CRM360Data } from '@/types/crm';
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS, BEHAVIORAL_SEGMENT_LABELS, BEHAVIORAL_SEGMENT_COLORS } from '@/types/crm';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function CRMClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, mutate } = useCRM360(id || null);
  const client360 = data as CRM360Data | undefined;

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Client CRM">
        <InlineError message="Failed to load client data" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  if (isLoading) {
    return (
      <DashboardErrorBoundary pageName="Client CRM">
        <div className="space-y-6"><PanelSkeleton /><PanelSkeleton /><PanelSkeleton /></div>
      </DashboardErrorBoundary>
    );
  }

  if (!client360) return null;

  const { client, pipeline, segment, timeline, tasks, milestones } = client360;

  return (
    <DashboardErrorBoundary pageName="Client CRM">
      <div className="space-y-6">
        {/* Back button + Header */}
        <div>
          <button
            className="flex items-center gap-1 text-xs text-rani-muted hover:text-rani-navy mb-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">{client.clientName}</h1>
              <div className="flex items-center gap-2 mt-1">
                {pipeline && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PIPELINE_STAGE_COLORS[pipeline.stage]}`}>
                    {PIPELINE_STAGE_LABELS[pipeline.stage]}
                  </span>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${BEHAVIORAL_SEGMENT_COLORS[segment.segment]}`}>
                  {BEHAVIORAL_SEGMENT_LABELS[segment.segment]}
                </span>
                {client.hasMembership && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    <Crown className="w-3 h-3" />
                    {client.membershipTier || 'Member'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
          <div className="bg-white/80 rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1 text-[10px] text-rani-muted mb-1">
              <DollarSign className="w-3 h-3" />
              Total Invested
            </div>
            <p className="text-sm font-heading text-rani-navy">{formatCurrency(client.totalSpend)}</p>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1 text-[10px] text-rani-muted mb-1">
              <TrendingUp className="w-3 h-3" />
              Projected LTV
            </div>
            <p className="text-sm font-heading text-rani-navy">{formatCurrency(client.projectedLTV)}</p>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1 text-[10px] text-rani-muted mb-1">
              <Calendar className="w-3 h-3" />
              Total Visits
            </div>
            <p className="text-sm font-heading text-rani-navy">{client.totalVisits}</p>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1 text-[10px] text-rani-muted mb-1">
              <DollarSign className="w-3 h-3" />
              Avg Ticket
            </div>
            <p className="text-sm font-heading text-rani-navy">{formatCurrency(client.avgTicket)}</p>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1 text-[10px] text-rani-muted mb-1">
              <AlertTriangle className="w-3 h-3" />
              Retention Risk
            </div>
            <p className={`text-sm font-heading ${
              client.retentionRiskScore > 60 ? 'text-red-600' : client.retentionRiskScore > 30 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {client.retentionRiskScore}/100
            </p>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1 text-[10px] text-rani-muted mb-1">
              <Heart className="w-3 h-3" />
              RFM Score
            </div>
            <p className="text-sm font-heading text-rani-navy font-mono">{segment.rfm.combined}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Lifecycle + Service Affinities */}
          <div className="xl:col-span-1 space-y-6">
            <LifecycleJourney client={client} />

            {/* Service Affinities */}
            {segment.serviceAffinities.length > 0 && (
              <div className="bg-white/80 rounded-xl border border-rani-border p-4">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-3">
                  Service Preferences
                </h3>
                <div className="space-y-2">
                  {segment.serviceAffinities.slice(0, 5).map((aff, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-rani-navy">{aff.serviceName}</span>
                        <span className="text-rani-muted">{aff.visitCount} visits</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-rani-gold/60" style={{ width: `${aff.affinityScore}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tasks */}
            {tasks.length > 0 && (
              <div className="bg-white/80 rounded-xl border border-rani-border p-4">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-3">
                  Active Tasks
                </h3>
                <div className="space-y-2">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                    <div key={task.id} className={`p-2 rounded-lg text-xs ${task.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <span className="font-medium text-rani-navy">{task.title}</span>
                      <p className="text-[10px] text-rani-muted mt-0.5">Due: {task.dueDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Timeline + Notes */}
          <div className="xl:col-span-2 space-y-6">
            <NoteComposer clientId={id || ''} clientName={client.clientName} />
            <ClientTimeline timeline={timeline} />
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
