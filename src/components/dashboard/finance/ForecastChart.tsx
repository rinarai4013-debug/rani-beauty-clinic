'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MonthlyProjection, ConfidenceInterval } from '@/lib/finance/forecasting';

interface ForecastChartProps {
  projections: MonthlyProjection[];
  confidenceIntervals?: ConfidenceInterval[];
  height?: number;
}

export default function ForecastChart({ projections, confidenceIntervals, height = 350 }: ForecastChartProps) {
  const data = projections.map((p, i) => ({
    month: p.month.slice(0, 7),
    expected: p.expected,
    optimistic: p.optimistic,
    conservative: p.conservative,
    p10: confidenceIntervals?.[i]?.p10,
    p90: confidenceIntervals?.[i]?.p90,
  }));

  const formatCurrency = (v: number) => `$${(v / 1000).toFixed(0)}K`;
  const formatMonth = (m: string) => {
    const [, month] = m.split('-');
    const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[parseInt(month, 10)] ?? m;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#C9A96E" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F1D2C" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#0F1D2C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip
            formatter={(value, name) => {
              const amount = typeof value === 'number' ? value : Number(value ?? 0);
              const label =
                name === 'expected' ? 'Expected'
                  : name === 'optimistic' ? 'Optimistic'
                  : name === 'conservative' ? 'Conservative'
                  : name;
              return [`$${amount.toLocaleString()}`, label];
            }}
            contentStyle={{ background: '#0F1D2C', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 13 }}
            labelFormatter={(label) => formatMonth(label as string)}
          />
          <Legend />
          {confidenceIntervals && (
            <Area type="monotone" dataKey="p90" stroke="none" fill="url(#confidenceGrad)" name="90th Pctl" />
          )}
          {confidenceIntervals && (
            <Area type="monotone" dataKey="p10" stroke="none" fill="url(#confidenceGrad)" name="10th Pctl" />
          )}
          <Area type="monotone" dataKey="optimistic" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Optimistic" />
          <Area type="monotone" dataKey="conservative" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Conservative" />
          <Area type="monotone" dataKey="expected" stroke="#C9A96E" strokeWidth={2.5} fill="url(#expectedGrad)" name="Expected" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
