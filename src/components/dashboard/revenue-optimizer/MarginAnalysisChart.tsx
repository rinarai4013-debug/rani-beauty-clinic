'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MarginAnalysis } from '@/lib/revenue/pricing-optimizer';

interface MarginAnalysisChartProps {
  margins: MarginAnalysis[];
}

const STATUS_COLORS: Record<string, string> = {
  excellent: '#10B981',
  healthy: '#3B82F6',
  thin: '#F59E0B',
  'loss-leader': '#EF4444',
};

export default function MarginAnalysisChart({ margins }: MarginAnalysisChartProps) {
  const data = margins.slice(0, 10).map(m => ({
    service: m.service.length > 12 ? m.service.slice(0, 12) + '...' : m.service,
    fullName: m.service,
    margin: m.netMarginPercent,
    revenue: m.revenue,
    revenuePerMin: m.revenuePerMinute,
    status: m.status,
    color: STATUS_COLORS[m.status] || '#94a3b8',
  }));

  return (
    <div className="space-y-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="service" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(val: number) => [`${val}%`, 'Net Margin']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-body text-rani-muted capitalize">{status === 'loss-leader' ? 'Loss Leader' : status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
