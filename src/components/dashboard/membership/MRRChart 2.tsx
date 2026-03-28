'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MRRChartProps {
  data: { month: string; mrr: number; members: number }[];
  height?: number;
}

export default function MRRChart({ data, height = 300 }: MRRChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-rani-navy">MRR Trend</h3>
        {data.length > 1 && (
          <span className="text-xs font-body text-rani-muted">
            {formatMonth(data[0].month)} — {formatMonth(data[data.length - 1].month)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B7280' }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === 'mrr' ? formatCurrency(value) : value,
              name === 'mrr' ? 'MRR' : 'Members',
            ]}
            labelFormatter={formatMonth}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="mrr" stroke="#C9A96E" fill="url(#mrrGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
