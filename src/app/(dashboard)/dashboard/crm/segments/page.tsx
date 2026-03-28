'use client';

import { motion } from 'framer-motion';
import { useSegmentAnalysis, useClientSegments } from '@/hooks/useCRMData';
import { SegmentMatrix } from '@/components/dashboard/crm';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { SegmentMetrics, ClientSegment } from '@/types/crm';
import { BEHAVIORAL_SEGMENT_LABELS, BEHAVIORAL_SEGMENT_COLORS } from '@/types/crm';

export default function SegmentsPage() {
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, mutate } = useSegmentAnalysis();
  const { data: clientsData, isLoading: clientsLoading } = useClientSegments();
  const metrics = metricsData as SegmentMetrics | undefined;
  const clients = (clientsData || []) as ClientSegment[];

  return (
    <DashboardErrorBoundary pageName="Segments">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Client Segmentation</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            RFM analysis and behavioral segments for targeted engagement
          </p>
        </div>

        {metricsError ? (
          <InlineError message="Failed to load segment data" onRetry={() => mutate()} />
        ) : metricsLoading ? (
          <div className="space-y-6"><PanelSkeleton /><PanelSkeleton /></div>
        ) : !metrics ? (
          <DashboardEmptyState title="No Segment Data" description="Add clients to begin segmentation analysis." />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <SegmentMatrix metrics={metrics} />

            {/* Client List by Segment */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                Client Segments
                <span className="text-rani-muted font-normal ml-1">({clients.length})</span>
              </h3>
              {clientsLoading ? (
                <PanelSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-rani-muted font-normal">Client</th>
                        <th className="text-left py-2 text-rani-muted font-normal">Segment</th>
                        <th className="text-right py-2 text-rani-muted font-normal">R</th>
                        <th className="text-right py-2 text-rani-muted font-normal">F</th>
                        <th className="text-right py-2 text-rani-muted font-normal">M</th>
                        <th className="text-right py-2 text-rani-muted font-normal">Total Spend</th>
                        <th className="text-right py-2 text-rani-muted font-normal">Visits</th>
                        <th className="text-right py-2 text-rani-muted font-normal">Last Visit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.slice(0, 20).map(client => (
                        <tr key={client.clientId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 font-medium text-rani-navy">{client.clientName}</td>
                          <td className="py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${BEHAVIORAL_SEGMENT_COLORS[client.segment]}`}>
                              {BEHAVIORAL_SEGMENT_LABELS[client.segment]}
                            </span>
                          </td>
                          <td className="py-2 text-right font-mono">{client.rfm.recency}</td>
                          <td className="py-2 text-right font-mono">{client.rfm.frequency}</td>
                          <td className="py-2 text-right font-mono">{client.rfm.monetary}</td>
                          <td className="py-2 text-right">${client.totalSpend.toLocaleString()}</td>
                          <td className="py-2 text-right">{client.visitCount}</td>
                          <td className="py-2 text-right text-rani-muted">{client.daysSinceLastVisit}d ago</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
