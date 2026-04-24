'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { CashFlowProjection, ConfidenceInterval } from '@/lib/revenue/forecasting-v2';

interface ForecastChartProps {
  projections: CashFlowProjection[];
  confidence: ConfidenceInterval;
  monthlyTarget: number;
}

export default function ForecastChart({ projections, confidence, monthlyTarget }: ForecastChartProps) {
  const chartData = projections.map((p, _i) => ({
    month: new Date(p.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: p.projectedRevenue,
    expenses: p.estimatedExpenses,
    net: p.netCashFlow,
    membership: p.membershipRecurring,
    target: monthlyTarget,
  }));

  return (
    <div className="space-y-4">
      {/* Confidence interval summary */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Worst Case (P10)', value: confidence.p10 },
          { label: 'Conservative (P25)', value: confidence.p25 },
          { label: 'Most Likely (P50)', value: confidence.p50 },
          { label: 'Optimistic (P75)', value: confidence.p75 },
          { label: 'Best Case (P90)', value: confidence.p90 },
        ].map((item, i) => (
          <div key={i} className={`text-center p-2 rounded-lg ${i === 2 ? 'bg-rani-cream border border-rani-gold/30' : 'bg-gray-50'}`}>
            <p className="text-[10px] font-body text-rani-muted">{item.label}</p>
            <p className="text-sm font-heading text-rani-navy mt-0.5">${(item.value / 1000).toFixed(1)}k</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={((val: number, name: string) => [`$${val.toLocaleString()}`, name]) as never}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <ReferenceLine y={monthlyTarget} stroke="#C9A96E" strokeDasharray="5 5" label={{ value: 'Target', fill: '#C9A96E', fontSize: 10 }} />
            <Area type="monotone" dataKey="revenue" stroke="#0F1D2C" fill="#0F1D2C" fillOpacity={0.1} name="Revenue" />
            <Area type="monotone" dataKey="membership" stroke="#C9A96E" fill="#C9A96E" fillOpacity={0.1} name="Membership MRR" />
            <Area type="monotone" dataKey="net" stroke="#10B981" fill="#10B981" fillOpacity={0.05} name="Net Cash Flow" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
