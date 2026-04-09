'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { MRRMovement } from '@/lib/membership/analytics';

interface MRRMovementChartProps {
  movements: MRRMovement[];
  height?: number;
}

export default function MRRMovementChart({ movements, height = 300 }: MRRMovementChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short' });
  };

  const chartData = movements.map(m => ({
    ...m,
    month: formatMonth(m.month),
    contractionMRR: -m.contractionMRR,
    churnedMRR: -m.churnedMRR,
  }));

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">MRR Movement</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B7280' }} />
          <Tooltip
            formatter={((value: number, name: string) => {
              const labels: Record<string, string> = {
                newMRR: 'New', expansionMRR: 'Expansion',
                reactivationMRR: 'Reactivation', contractionMRR: 'Contraction', churnedMRR: 'Churned',
              };
              return [formatCurrency(Math.abs(value)), labels[name] || name];
            }) as any}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
          />
          <Legend
            formatter={(value) => {
              const labels: Record<string, string> = {
                newMRR: 'New', expansionMRR: 'Expansion',
                reactivationMRR: 'Reactivation', contractionMRR: 'Contraction', churnedMRR: 'Churned',
              };
              return <span className="text-xs font-body">{labels[value] || value}</span>;
            }}
          />
          <ReferenceLine y={0} stroke="#374151" />
          <Bar dataKey="newMRR" stackId="positive" fill="#10B981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="expansionMRR" stackId="positive" fill="#C9A96E" radius={[2, 2, 0, 0]} />
          <Bar dataKey="reactivationMRR" stackId="positive" fill="#6366F1" radius={[2, 2, 0, 0]} />
          <Bar dataKey="contractionMRR" stackId="negative" fill="#F59E0B" radius={[0, 0, 2, 2]} />
          <Bar dataKey="churnedMRR" stackId="negative" fill="#EF4444" radius={[0, 0, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
