'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const featureAdoption = [
  { feature: 'AI Intake', adoption: 92 },
  { feature: 'Churn Prediction', adoption: 78 },
  { feature: 'Schedule Optimizer', adoption: 85 },
  { feature: 'Dynamic Pricing', adoption: 64 },
  { feature: 'Social Engine', adoption: 71 },
  { feature: 'Meta Ads AI', adoption: 56 },
  { feature: 'Consult Co-pilot', adoption: 88 },
  { feature: 'Phone Agent', adoption: 42 },
  { feature: 'P&L Intelligence', adoption: 67 },
  { feature: 'Inventory Mgmt', adoption: 59 },
  { feature: 'Knowledge Base', adoption: 38 },
  { feature: 'Review Commander', adoption: 81 },
];

const aiEngineUsage = [
  { name: 'Intake Intelligence', calls: 42800, color: '#0F1D2C' },
  { name: 'Consult Co-pilot', calls: 38200, color: '#1A2A3C' },
  { name: 'Churn Prediction', calls: 28400, color: '#3B82F6' },
  { name: 'Schedule Optimizer', calls: 24100, color: '#059669' },
  { name: 'Social Engine', calls: 18600, color: '#F3D6BE' },
  { name: 'Dynamic Pricing', calls: 15200, color: '#7C3AED' },
  { name: 'Meta Ads AI', calls: 12800, color: '#F59E0B' },
  { name: 'Phone Agent', calls: 8400, color: '#EF4444' },
];

const engagementData = [
  { feature: 'Dashboard', value: 95 },
  { feature: 'AI Tools', value: 82 },
  { feature: 'Automation', value: 76 },
  { feature: 'Analytics', value: 68 },
  { feature: 'Settings', value: 45 },
  { feature: 'API', value: 32 },
];

const churnRiskDistribution = [
  { name: 'Low Risk', value: 30, color: '#059669' },
  { name: 'Medium Risk', value: 10, color: '#F59E0B' },
  { name: 'High Risk', value: 5, color: '#EF4444' },
  { name: 'Critical', value: 2, color: '#7F1D1D' },
];

const churnPredictions = [
  { tenant: 'Ethereal Med Aesthetics', score: 82, reason: 'Login frequency dropped 60% in 30 days', plan: 'Growth', mrr: 499 },
  { tenant: 'Aura Skin Clinic', score: 68, reason: 'Only using 2 of 12 available features', plan: 'Starter', mrr: 199 },
  { tenant: 'Nova Aesthetics', score: 61, reason: 'Support ticket escalations increased', plan: 'Growth', mrr: 499 },
  { tenant: 'Crystal Clear Clinic', score: 55, reason: 'Failed payment + no dashboard access in 14 days', plan: 'Starter', mrr: 199 },
  { tenant: 'Premier Skin Center', score: 48, reason: 'Downgrade inquiry submitted', plan: 'Growth', mrr: 499 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Feature adoption, engagement, and churn intelligence</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Feature Adoption', value: '68%', change: '+5%', positive: true },
          { label: 'Daily Active Tenants', value: '34/47', change: '72%', positive: true },
          { label: 'AI Calls This Month', value: '189K', change: '+31%', positive: true },
          { label: 'At-Risk Tenants', value: '7', change: '+2', positive: false },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <span className={`text-xs font-semibold ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Adoption + Engagement Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Adoption Rates</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={featureAdoption}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="feature"
                type="category"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Adoption']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="adoption" fill="#0F1D2C" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tenant Engagement Score</h3>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={engagementData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Radar
                name="Avg Engagement"
                dataKey="value"
                stroke="#0F1D2C"
                fill="#0F1D2C"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Engine Usage */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Used AI Engines (this month)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {aiEngineUsage.map((engine, i) => (
            <div key={engine.name} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                <span className="text-xs text-gray-500">{(engine.calls / 1000).toFixed(1)}K calls</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{engine.name}</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(engine.calls / aiEngineUsage[0].calls) * 100}%`,
                    backgroundColor: engine.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Churn Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={churnRiskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {churnRiskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} tenants`, name]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Churn Risks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Churn Risks</h3>
          <div className="space-y-3">
            {churnPredictions.map((tenant) => (
              <div key={tenant.tenant} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{tenant.tenant}</p>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                      {tenant.plan}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{tenant.reason}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">${tenant.mrr}/mo at risk</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                      tenant.score >= 70 ? 'bg-red-500' : tenant.score >= 50 ? 'bg-amber-500' : 'bg-amber-400'
                    }`}
                  >
                    {tenant.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
