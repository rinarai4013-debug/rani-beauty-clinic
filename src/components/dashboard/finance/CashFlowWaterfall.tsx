'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { CashFlowMonthProjection } from '@/lib/finance/cash-flow';

interface CashFlowWaterfallProps {
  projections: CashFlowMonthProjection[];
  height?: number;
}

export default function CashFlowWaterfall({ projections, height = 320 }: CashFlowWaterfallProps) {
  const data = projections.map(p => {
    const monthLabel = (() => {
      const [, m] = p.month.split('-');
      const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return names[parseInt(m, 10)] ?? p.month;
    })();

    return {
      month: monthLabel,
      inflow: p.projectedInflow,
      outflow: -p.projectedOutflow,
      net: p.netCashFlow,
      balance: p.endingBalance,
    };
  });

  const formatCurrency = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    return `$${v}`;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip
            formatter={(value, name) => {
              const amount = typeof value === 'number' ? value : Number(value ?? 0);
              const label = name === 'inflow' ? 'Inflow' : name === 'outflow' ? 'Outflow' : 'Net';
              return [`$${Math.abs(amount).toLocaleString()}`, label];
            }}
            contentStyle={{ background: '#0F1D2C', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 13 }}
          />
          <ReferenceLine y={0} stroke="#9CA3AF" />
          <Bar dataKey="inflow" name="Inflow" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={`in-${i}`} fill="#10B981" fillOpacity={0.8} />
            ))}
          </Bar>
          <Bar dataKey="outflow" name="Outflow" radius={[0, 0, 4, 4]}>
            {data.map((_, i) => (
              <Cell key={`out-${i}`} fill="#EF4444" fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
