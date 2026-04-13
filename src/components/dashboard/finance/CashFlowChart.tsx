'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { CashFlowReport } from '@/lib/integrations/quickbooks/reports';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CashFlowChart() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  const { data, error, isLoading } = useSWR<CashFlowReport>(
    `/api/integrations/quickbooks/reports?report=cash-flow&period=${period}`,
    fetcher,
    { refreshInterval: 300000 },
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  // Waterfall chart data
  const waterfallData = data
    ? [
        {
          name: 'Operating',
          value: data.operatingActivities,
          fill: data.operatingActivities >= 0 ? '#2CA01C' : '#E74C3C',
        },
        {
          name: 'Investing',
          value: data.investingActivities,
          fill: data.investingActivities >= 0 ? '#2CA01C' : '#E74C3C',
        },
        {
          name: 'Financing',
          value: data.financingActivities,
          fill: data.financingActivities >= 0 ? '#2CA01C' : '#E74C3C',
        },
        {
          name: 'Net Change',
          value: data.netCashChange,
          fill: data.netCashChange >= 0 ? '#C9A96E' : '#E74C3C',
        },
      ]
    : [];

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F1D2C]">Cash Flow</h3>
        <div className="flex gap-2">
          {(['monthly', 'quarterly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-[#0F1D2C] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Operating', value: data.operatingActivities },
            { label: 'Investing', value: data.investingActivities },
            { label: 'Financing', value: data.financingActivities },
            { label: 'Net Change', value: data.netCashChange },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-[#F8F6F1] p-3 text-center">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`mt-1 text-sm font-bold ${
                item.value >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Waterfall Chart */}
      <div className="h-56">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading cash flow data...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            Failed to load cash flow
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={((value: number) => formatCurrency(value)) as never} />
              <ReferenceLine y={0} stroke="#9CA3AF" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Activity Details */}
      {data?.lineItems && data.lineItems.length > 0 && (
        <div className="mt-4 max-h-40 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 text-left">Activity</th>
                <th className="pb-2 text-left">Section</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-700">{item.label}</td>
                  <td className="py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                      item.section === 'operating'
                        ? 'bg-blue-50 text-blue-600'
                        : item.section === 'investing'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.section}
                    </span>
                  </td>
                  <td className={`py-1.5 text-right font-medium ${
                    item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
