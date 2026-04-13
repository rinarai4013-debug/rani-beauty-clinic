'use client';

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
} from 'recharts';
import type { PayrollSummary as PayrollSummaryType } from '@/lib/integrations/quickbooks/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PayrollSummary() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const { data, error, isLoading } = useSWR<PayrollSummaryType>(
    `/api/integrations/quickbooks/reports?report=payroll&startDate=${startDate}&endDate=${endDate}`,
    fetcher,
    { refreshInterval: 300000 },
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const chartData = data?.providers.map(p => ({
    name: p.providerName,
    baseSalary: p.baseSalary,
    commission: p.commissionEarned,
    revenue: p.serviceRevenue,
  })) || [];

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-[#0F1D2C]">Provider Compensation</h3>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-[#F8F6F1] p-3 text-center">
            <p className="text-xs text-gray-500">Total Payroll</p>
            <p className="mt-1 text-lg font-bold text-[#0F1D2C]">{formatCurrency(data.totalPayroll)}</p>
          </div>
          <div className="rounded-lg bg-[#F8F6F1] p-3 text-center">
            <p className="text-xs text-gray-500">Commissions</p>
            <p className="mt-1 text-lg font-bold text-[#C9A96E]">{formatCurrency(data.totalCommissions)}</p>
          </div>
          <div className="rounded-lg bg-[#F8F6F1] p-3 text-center">
            <p className="text-xs text-gray-500">Benefits + Tax</p>
            <p className="mt-1 text-lg font-bold text-[#0F1D2C]">
              {formatCurrency(data.totalBenefits + data.payrollTaxEstimate)}
            </p>
          </div>
          <div className="rounded-lg bg-[#F8F6F1] p-3 text-center">
            <p className="text-xs text-gray-500">Labor Cost Ratio</p>
            <p className={`mt-1 text-lg font-bold ${
              data.laborCostRatio <= 35 ? 'text-green-600' :
              data.laborCostRatio <= 45 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {data.laborCostRatio.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Provider Comparison Chart */}
      <div className="h-56">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading payroll data...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            Failed to load payroll data
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No provider data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={((value: number) => formatCurrency(value)) as never} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="revenue" name="Service Revenue" fill="#2CA01C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="baseSalary" name="Base Salary" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="Commission" fill="#C9A96E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Provider Details Table */}
      {data?.providers && data.providers.length > 0 && (
        <div className="mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 text-left">Provider</th>
                <th className="pb-2 text-right">Revenue</th>
                <th className="pb-2 text-right">Compensation</th>
                <th className="pb-2 text-right">$/Hour</th>
                <th className="pb-2 text-right">Cost Ratio</th>
              </tr>
            </thead>
            <tbody>
              {data.providers.map(p => (
                <tr key={p.providerId} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-700">{p.providerName}</td>
                  <td className="py-2 text-right text-green-600">{formatCurrency(p.serviceRevenue)}</td>
                  <td className="py-2 text-right text-[#0F1D2C]">{formatCurrency(p.totalCompensation)}</td>
                  <td className="py-2 text-right text-[#C9A96E]">{formatCurrency(p.revenuePerHour)}</td>
                  <td className="py-2 text-right">
                    <span className={`rounded-full px-2 py-0.5 ${
                      p.laborCostRatio <= 35 ? 'bg-green-50 text-green-600' :
                      p.laborCostRatio <= 45 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {p.laborCostRatio.toFixed(1)}%
                    </span>
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
