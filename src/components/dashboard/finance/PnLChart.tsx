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
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PnLReport } from '@/lib/integrations/quickbooks/reports';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const COLORS = {
  income: '#2CA01C',
  cogs: '#E67E22',
  expense: '#E74C3C',
  netIncome: '#C9A96E',
};

export default function PnLChart() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [offset, setOffset] = useState(0);

  const { data, error, isLoading } = useSWR<PnLReport>(
    `/api/integrations/quickbooks/reports?report=pnl&period=${period}&offset=${offset}`,
    fetcher,
    { refreshInterval: 300000 },
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const chartData = data
    ? [
        { name: 'Revenue', amount: data.totalIncome, color: COLORS.income },
        { name: 'COGS', amount: -data.totalCOGS, color: COLORS.cogs },
        { name: 'Expenses', amount: -data.totalExpenses, color: COLORS.expense },
        { name: 'Net Income', amount: data.netIncome, color: COLORS.netIncome },
      ]
    : [];

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F1D2C]">Profit & Loss</h3>
        <div className="flex gap-2">
          {(['monthly', 'quarterly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setOffset(0); }}
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

      {data?.period && (
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <span>{data.period.start} to {data.period.end}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setOffset(o => o + 1)}
              className="rounded px-2 py-0.5 hover:bg-gray-100"
            >
              Prev
            </button>
            <button
              onClick={() => setOffset(o => Math.max(0, o - 1))}
              disabled={offset === 0}
              className="rounded px-2 py-0.5 hover:bg-gray-100 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Revenue', value: data.totalIncome, color: 'text-green-600' },
            { label: 'Gross Profit', value: data.grossProfit, color: 'text-blue-600' },
            { label: 'Expenses', value: data.totalExpenses, color: 'text-red-600' },
            { label: 'Net Income', value: data.netIncome, color: data.netIncome >= 0 ? 'text-green-600' : 'text-red-600' },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-[#F8F6F1] p-3 text-center">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`mt-1 text-lg font-bold ${item.color}`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart */}
      <div className="h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading P&L data...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            Failed to load P&L report
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Line Items */}
      {data?.lineItems && data.lineItems.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 text-left">Account</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-700">{item.label}</td>
                  <td className={`py-1.5 text-right font-medium ${
                    item.section === 'income' || item.section === 'other_income'
                      ? 'text-green-600'
                      : 'text-red-600'
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
