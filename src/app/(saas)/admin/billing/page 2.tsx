'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const mrrByPlan = [
  { month: 'Oct', starter: 2400, growth: 5500, enterprise: 4000 },
  { month: 'Nov', starter: 2800, growth: 7200, enterprise: 5000 },
  { month: 'Dec', starter: 3000, growth: 8800, enterprise: 6000 },
  { month: 'Jan', starter: 3200, growth: 11200, enterprise: 8000 },
  { month: 'Feb', starter: 3600, growth: 14400, enterprise: 9000 },
  { month: 'Mar', starter: 3800, growth: 17600, enterprise: 10000 },
];

const revenueForecst = [
  { month: 'Apr', projected: 48500, low: 44000, high: 53000 },
  { month: 'May', projected: 55200, low: 49000, high: 61000 },
  { month: 'Jun', projected: 62800, low: 55000, high: 70000 },
  { month: 'Jul', projected: 71400, low: 62000, high: 80000 },
  { month: 'Aug', projected: 81000, low: 70000, high: 92000 },
  { month: 'Sep', projected: 92000, low: 78000, high: 105000 },
];

const failedPayments = [
  { tenant: 'Bella Vita Med Spa', amount: 499, plan: 'Growth', failedAt: '2026-03-22', attempts: 3, reason: 'Card declined' },
  { tenant: 'Luxe Skin Studio', amount: 199, plan: 'Starter', failedAt: '2026-03-20', attempts: 2, reason: 'Insufficient funds' },
  { tenant: 'Nova Aesthetics', amount: 499, plan: 'Growth', failedAt: '2026-03-18', attempts: 1, reason: 'Card expired' },
];

const upcomingRenewals = [
  { tenant: 'Glow Medical Spa', plan: 'Growth', mrr: 499, renewsAt: '2026-04-01', risk: 'low' as const },
  { tenant: 'Derma Elite Clinic', plan: 'Growth', mrr: 499, renewsAt: '2026-04-01', risk: 'low' as const },
  { tenant: 'Zen Medspa & Wellness', plan: 'Enterprise', mrr: 999, renewsAt: '2026-04-01', risk: 'low' as const },
  { tenant: 'Aura Skin Clinic', plan: 'Starter', mrr: 199, renewsAt: '2026-04-05', risk: 'medium' as const },
  { tenant: 'Bloom Med Spa', plan: 'Growth', mrr: 499, renewsAt: '2026-04-10', risk: 'low' as const },
  { tenant: 'Ethereal Med Aesthetics', plan: 'Growth', mrr: 499, renewsAt: '2026-04-15', risk: 'high' as const },
];

const riskColors = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

export default function BillingPage() {
  const totalMRR = 42800;
  const starterMRR = 3800;
  const growthMRR = 17600;
  const enterpriseMRR = 10000;
  const trialCount = 8;
  const failedTotal = failedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue metrics and payment management</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total MRR', value: `$${totalMRR.toLocaleString()}`, sub: '+23.7% MoM' },
          { label: 'Starter MRR', value: `$${starterMRR.toLocaleString()}`, sub: '15 clinics' },
          { label: 'Growth MRR', value: `$${growthMRR.toLocaleString()}`, sub: '22 clinics' },
          { label: 'Enterprise MRR', value: `$${enterpriseMRR.toLocaleString()}`, sub: '10 clinics' },
          { label: 'Failed Payments', value: `$${failedTotal.toLocaleString()}`, sub: `${failedPayments.length} pending`, alert: true },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white rounded-2xl border p-5 shadow-sm ${
              kpi.alert ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
            }`}
          >
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.alert ? 'text-red-600' : 'text-gray-900'}`}>{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.alert ? 'text-red-500' : 'text-gray-400'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* MRR Breakdown Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MRR Breakdown by Plan</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={mrrByPlan} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="starter" name="Starter" fill="#6B7280" radius={[4, 4, 0, 0]} stackId="mrr" />
            <Bar dataKey="growth" name="Growth" fill="#3B82F6" radius={[0, 0, 0, 0]} stackId="mrr" />
            <Bar dataKey="enterprise" name="Enterprise" fill="#7C3AED" radius={[4, 4, 0, 0]} stackId="mrr" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Failed Payments + Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failed Payments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Failed Payments</h3>
            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
              {failedPayments.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {failedPayments.map((payment, i) => (
              <div key={i} className="p-3 bg-red-50/30 border border-red-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.tenant}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {payment.plan} &middot; {payment.reason} &middot; {payment.attempts} attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">${payment.amount}</p>
                    <p className="text-[10px] text-gray-400">{new Date(payment.failedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 text-xs font-medium text-white bg-[#0F1D2C] rounded-lg hover:bg-[#1A2A3C]">
                    Retry
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Renewals</h3>
          <div className="space-y-2">
            {upcomingRenewals.map((renewal, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{renewal.tenant}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {renewal.plan} &middot; Renews {new Date(renewal.renewsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${riskColors[renewal.risk]}`}>
                    {renewal.risk.toUpperCase()} RISK
                  </span>
                  <span className="text-sm font-bold text-gray-900">${renewal.mrr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast (6 months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueForecst} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="high" name="Optimistic" stroke="#059669" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="projected" name="Projected" stroke="#0F1D2C" strokeWidth={2.5} dot={{ fill: '#0F1D2C', r: 4, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="low" name="Conservative" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
