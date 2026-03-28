'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { GapSummary } from '@/lib/revenue/gap-finder';

interface GapCategoryChartProps {
  summary: GapSummary;
}

const CATEGORY_LABELS: Record<string, string> = {
  emptySlots: 'Empty Slots',
  underperformingDays: 'Underperforming Days',
  decliningServices: 'Declining Services',
  overdueRebookings: 'Overdue Rebookings',
  membershipUnderutilization: 'Membership Gaps',
  dormantHighValue: 'Dormant VIPs',
};

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#C9A96E'];

export default function GapCategoryChart({ summary }: GapCategoryChartProps) {
  const data = Object.entries(summary.gapByCategory)
    .filter(([, v]) => v > 0)
    .map(([key, value], i) => ({
      name: CATEGORY_LABELS[key] || key,
      value: Math.round(value),
      color: COLORS[i % COLORS.length],
    }));

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-rani-muted text-sm font-body">
        No revenue gaps detected -- excellent!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={65}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => `$${val.toLocaleString()}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-body text-rani-text">{item.name}</span>
            </div>
            <span className="text-xs font-heading text-rani-navy">${item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
