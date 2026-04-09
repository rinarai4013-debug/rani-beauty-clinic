'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { HourlyRevenue } from '@/lib/booking/calendar';
import { formatRevenueChartData } from '@/lib/booking/calendar';

interface RevenueChartProps {
  hourlyRevenue: HourlyRevenue[];
}

export default function RevenueChart({ hourlyRevenue }: RevenueChartProps) {
  const data = formatRevenueChartData(hourlyRevenue);
  const totalRevenue = hourlyRevenue.reduce((sum, h) => sum + h.revenue, 0);
  const peakHour = hourlyRevenue.reduce((max, h) => h.revenue > max.revenue ? h : max, hourlyRevenue[0]);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
          Revenue by Hour
        </h3>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-[#6B7280]">Total: </span>
            <span className="font-bold text-[#C9A96E]">${totalRevenue.toLocaleString()}</span>
          </div>
          {peakHour && (
            <div>
              <span className="text-[#6B7280]">Peak: </span>
              <span className="font-bold text-[#0F1D2C]">{peakHour.hour}</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F8F6F1" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `$${v}`} />
            <Tooltip
              formatter={(value) => {
                const amount = typeof value === 'number' ? value : Number(value ?? 0);
                return [`$${amount}`, 'Revenue'];
              }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E8E4DF' }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Recharts Cell import
import { Cell } from 'recharts';
