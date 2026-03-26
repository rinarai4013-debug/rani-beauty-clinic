'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MRRDataPoint {
  month: string;
  mrr: number;
  newMRR: number;
  churnedMRR: number;
  expansionMRR: number;
}

interface MRRChartProps {
  data: MRRDataPoint[];
  height?: number;
}

const defaultData: MRRDataPoint[] = [
  { month: 'Sep 2025', mrr: 12400, newMRR: 2800, churnedMRR: 600, expansionMRR: 400 },
  { month: 'Oct 2025', mrr: 15800, newMRR: 4200, churnedMRR: 800, expansionMRR: 600 },
  { month: 'Nov 2025', mrr: 19600, newMRR: 4800, churnedMRR: 1000, expansionMRR: 800 },
  { month: 'Dec 2025', mrr: 23200, newMRR: 4600, churnedMRR: 1000, expansionMRR: 1200 },
  { month: 'Jan 2026', mrr: 28400, newMRR: 6200, churnedMRR: 1000, expansionMRR: 1400 },
  { month: 'Feb 2026', mrr: 34600, newMRR: 7400, churnedMRR: 1200, expansionMRR: 1600 },
  { month: 'Mar 2026', mrr: 42800, newMRR: 9800, churnedMRR: 1600, expansionMRR: 2000 },
];

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1D2C] border border-[#1A2A3C] rounded-xl p-4 shadow-xl">
      <p className="text-[#F3D6BE] font-semibold mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm text-white/80">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium text-white">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MRRChart({ data = defaultData, height = 360 }: MRRChartProps) {
  const [activeView, setActiveView] = useState<'total' | 'breakdown'>('total');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Recurring Revenue</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Current MRR:{' '}
            <span className="text-[#0F1D2C] font-bold">
              ${data[data.length - 1]?.mrr.toLocaleString() ?? '0'}
            </span>
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('total')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'total'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Total MRR
          </button>
          <button
            onClick={() => setActiveView('breakdown')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'breakdown'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Breakdown
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {activeView === 'total' ? (
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F1D2C" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0F1D2C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mrr"
              name="Total MRR"
              stroke="#0F1D2C"
              strokeWidth={2.5}
              fill="url(#mrrGradient)"
              dot={{ fill: '#0F1D2C', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#F3D6BE' }}
            />
          </AreaChart>
        ) : (
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="newMRR"
              name="New MRR"
              stackId="1"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="expansionMRR"
              name="Expansion"
              stackId="1"
              stroke="#0F1D2C"
              fill="#0F1D2C"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="churnedMRR"
              name="Churned"
              stackId="2"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.4}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
