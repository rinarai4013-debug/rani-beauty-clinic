'use client';

const HEALTH_OVERVIEW = [
  { label: 'Excellent', count: 18, color: 'bg-emerald-500', pct: 38 },
  { label: 'Good', count: 15, color: 'bg-blue-500', pct: 32 },
  { label: 'At Risk', count: 9, color: 'bg-amber-500', pct: 19 },
  { label: 'Critical', count: 5, color: 'bg-red-500', pct: 11 },
];

const CUSTOMERS = [
  { name: 'Radiance Aesthetics', score: 92, grade: 'excellent', trend: 'improving', logins: 24, features: 11, tickets: 0, billing: 'current' },
  { name: 'Glow Medical Spa', score: 85, grade: 'good', trend: 'stable', logins: 18, features: 8, tickets: 1, billing: 'current' },
  { name: 'Zen MedSpa', score: 78, grade: 'good', trend: 'improving', logins: 15, features: 7, tickets: 0, billing: 'current' },
  { name: 'Pure Aesthetics', score: 62, grade: 'good', trend: 'declining', logins: 10, features: 5, tickets: 2, billing: 'current' },
  { name: 'Luxe Beauty Clinic', score: 45, grade: 'at_risk', trend: 'declining', logins: 4, features: 3, tickets: 3, billing: 'past_due' },
  { name: 'Bella Med', score: 38, grade: 'at_risk', trend: 'declining', logins: 2, features: 2, tickets: 4, billing: 'current' },
  { name: 'Skin Theory', score: 22, grade: 'critical', trend: 'declining', logins: 0, features: 1, tickets: 5, billing: 'past_due' },
  { name: 'Derma One', score: 18, grade: 'critical', trend: 'declining', logins: 0, features: 1, tickets: 2, billing: 'failed' },
];

const NPS_DATA = {
  score: 52,
  promoters: 28,
  passives: 11,
  detractors: 8,
  responses: 47,
};

export default function HealthDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customer Health</h1>
        <p className="text-sm text-gray-500 mt-1">Health scores, churn risk, and customer success metrics</p>
      </div>

      {/* Health Distribution */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {HEALTH_OVERVIEW.map((bucket) => (
          <div key={bucket.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${bucket.color}`} />
              <p className="text-xs font-medium text-gray-500">{bucket.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{bucket.count}</p>
            <p className="text-xs text-gray-400">{bucket.pct}% of customers</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* NPS Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">NPS Score</h2>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-[#0F1D2C]">{NPS_DATA.score}</p>
            <p className="text-xs text-gray-500 mt-1">Based on {NPS_DATA.responses} responses</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Promoters (9-10)</span>
              <span className="text-xs font-medium text-emerald-600">{NPS_DATA.promoters}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Passives (7-8)</span>
              <span className="text-xs font-medium text-amber-600">{NPS_DATA.passives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Detractors (0-6)</span>
              <span className="text-xs font-medium text-red-600">{NPS_DATA.detractors}</span>
            </div>
          </div>
        </div>

        {/* Churn Risk Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Churn Risk</h2>
          <div className="space-y-3">
            {[
              { label: 'Critical Risk', count: 5, value: '$4,995', color: 'bg-red-500' },
              { label: 'High Risk', count: 4, value: '$2,796', color: 'bg-amber-500' },
              { label: 'Medium Risk', count: 9, value: '$4,491', color: 'bg-yellow-500' },
            ].map((risk) => (
              <div key={risk.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${risk.color}`} />
                  <span className="text-sm text-gray-700">{risk.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{risk.count} accounts</p>
                  <p className="text-xs text-gray-500">{risk.value} MRR at risk</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Total at-risk MRR: $12,282</p>
        </div>

        {/* Save Offers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Active Save Offers</h2>
          <div className="space-y-3">
            {[
              { clinic: 'Skin Theory', offer: 'Free month', status: 'Sent', sent: '2d ago' },
              { clinic: 'Derma One', offer: '50% off 3mo', status: 'Sent', sent: '1d ago' },
              { clinic: 'Luxe Beauty', offer: 'Strategy call', status: 'Accepted', sent: '4d ago' },
              { clinic: 'Bella Med', offer: 'Downgrade option', status: 'Pending', sent: 'Today' },
            ].map((offer, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{offer.clinic}</p>
                  <p className="text-xs text-gray-500">{offer.offer}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                    offer.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{offer.status}</span>
                  <p className="text-xs text-gray-400 mt-1">{offer.sent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Health Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">All Customers</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Clinic</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Score</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Trend</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Logins/30d</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Features</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Tickets</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Billing</th>
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((c) => (
              <tr key={c.name} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.grade === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                    c.grade === 'good' ? 'bg-blue-100 text-blue-700' :
                    c.grade === 'at_risk' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>{c.score}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={`text-xs ${
                    c.trend === 'improving' ? 'text-emerald-600' :
                    c.trend === 'stable' ? 'text-gray-500' : 'text-red-600'
                  }`}>
                    {c.trend === 'improving' ? '↑' : c.trend === 'stable' ? '→' : '↓'} {c.trend}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">{c.logins}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{c.features}/12</td>
                <td className="px-3 py-3 text-sm text-gray-600">{c.tickets}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs font-medium ${
                    c.billing === 'current' ? 'text-emerald-600' :
                    c.billing === 'past_due' ? 'text-amber-600' : 'text-red-600'
                  }`}>{c.billing}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
