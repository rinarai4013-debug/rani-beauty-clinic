'use client';

import type { RFMMatrixCell, BehavioralSegment, SegmentMetrics } from '@/types/crm';
import { BEHAVIORAL_SEGMENT_LABELS, BEHAVIORAL_SEGMENT_COLORS } from '@/types/crm';

interface SegmentMatrixProps {
  metrics: SegmentMetrics;
}

function getCellColor(count: number, maxCount: number): string {
  if (count === 0) return 'bg-gray-50';
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  if (intensity > 0.7) return 'bg-green-500 text-white';
  if (intensity > 0.4) return 'bg-green-300 text-green-900';
  if (intensity > 0.2) return 'bg-green-100 text-green-800';
  return 'bg-green-50 text-green-700';
}

export default function SegmentMatrix({ metrics }: SegmentMatrixProps) {
  const { rfmMatrix, segmentDistribution, segmentRevenue, segmentAvgTicket } = metrics;

  const maxCount = Math.max(...rfmMatrix.map(c => c.clientCount), 1);

  // Segment distribution bars
  const segments = Object.entries(segmentDistribution)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]) as [BehavioralSegment, number][];

  const totalClients = segments.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* RFM Matrix Heatmap */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          RFM Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-[10px] text-rani-muted font-normal p-1" />
                {[1, 2, 3, 4, 5].map(f => (
                  <th key={f} className="text-[10px] text-rani-muted font-normal p-1 text-center">
                    F={f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(r => (
                <tr key={r}>
                  <td className="text-[10px] text-rani-muted font-normal p-1">R={r}</td>
                  {[1, 2, 3, 4, 5].map(f => {
                    const cell = rfmMatrix.find(c => c.recency === r && c.frequency === f);
                    const count = cell?.clientCount || 0;
                    return (
                      <td key={f} className="p-1">
                        <div
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${getCellColor(count, maxCount)}`}
                          title={cell ? `${count} clients, avg $${cell.avgMonetary} spend, ${BEHAVIORAL_SEGMENT_LABELS[cell.segment]}` : 'No clients'}
                        >
                          <span className="text-xs font-semibold">{count}</span>
                          {count > 0 && (
                            <span className="text-[8px] opacity-75">${cell?.avgMonetary || 0}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between mt-2 text-[10px] text-rani-muted">
            <span>← Less Frequent</span>
            <span>More Frequent →</span>
          </div>
        </div>
      </div>

      {/* Segment Distribution */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Segment Distribution
          <span className="text-rani-muted font-normal ml-2">({totalClients} total)</span>
        </h3>
        <div className="space-y-3">
          {segments.map(([segment, count]) => {
            const pct = totalClients > 0 ? Math.round((count / totalClients) * 100) : 0;
            const revenue = segmentRevenue[segment] || 0;
            const avgTicket = segmentAvgTicket[segment] || 0;

            return (
              <div key={segment}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${BEHAVIORAL_SEGMENT_COLORS[segment]}`}>
                      {BEHAVIORAL_SEGMENT_LABELS[segment]}
                    </span>
                    <span className="text-xs text-rani-muted">{count} clients</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-rani-muted">
                    <span>${revenue.toLocaleString()} rev</span>
                    <span>${avgTicket} avg</span>
                    <span className="font-medium text-rani-navy">{pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-rani-gold/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Movement Alerts */}
      {metrics.movementAlerts.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Segment Movements
          </h3>
          <div className="space-y-2">
            {metrics.movementAlerts.slice(0, 10).map((movement, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                  movement.significance === 'negative'
                    ? 'bg-red-50 border border-red-200'
                    : movement.significance === 'positive'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="font-medium text-rani-navy">{movement.clientName}</span>
                <span className="text-rani-muted">
                  {BEHAVIORAL_SEGMENT_LABELS[movement.from]} → {BEHAVIORAL_SEGMENT_LABELS[movement.to]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
