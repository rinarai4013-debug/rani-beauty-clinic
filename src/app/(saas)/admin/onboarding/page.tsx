'use client';

const ONBOARDING_STATS = [
  { label: 'Active Onboardings', value: '12', sublabel: 'in progress' },
  { label: 'Avg Completion Time', value: '4.2d', sublabel: 'target: 7d' },
  { label: 'Completion Rate', value: '87%', sublabel: '30-day window' },
  { label: 'Stalled', value: '3', sublabel: 'need nudge' },
];

const TENANTS_ONBOARDING = [
  { name: 'Glow Aesthetics', owner: 'Sarah M.', step: 4, pct: 57, daysActive: 3, status: 'active' },
  { name: 'Luxe Med Spa', owner: 'Jessica P.', step: 6, pct: 85, daysActive: 5, status: 'active' },
  { name: 'Zen Beauty', owner: 'Emily C.', step: 2, pct: 28, daysActive: 8, status: 'stalled' },
  { name: 'Pure Skin', owner: 'Amanda R.', step: 7, pct: 100, daysActive: 4, status: 'complete' },
  { name: 'Radiance Clinic', owner: 'Dr. Chen', step: 3, pct: 42, daysActive: 1, status: 'active' },
  { name: 'Bella Aesthetics', owner: 'Maria L.', step: 1, pct: 14, daysActive: 12, status: 'stalled' },
  { name: 'Aura MedSpa', owner: 'Priya K.', step: 5, pct: 71, daysActive: 6, status: 'active' },
];

const STEPS = [
  'Clinic Info',
  'Connect DB',
  'Import Services',
  'Add Team',
  'Branding',
  'Integrations',
  'Go Live',
];

export default function OnboardingTrackingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor tenant setup progress and identify stalled accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {ONBOARDING_STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Step Completion Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Step Completion Rate</h2>
        <div className="grid grid-cols-7 gap-2">
          {STEPS.map((step, i) => {
            const completionRate = [100, 94, 87, 72, 65, 58, 52][i];
            return (
              <div key={step} className="text-center">
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#0F1D2C] transition-all rounded-b-lg"
                    style={{ height: `${completionRate}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white z-10">
                    {completionRate}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">{step}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Active Onboardings</h2>
          <div className="flex items-center gap-2">
            {['all', 'active', 'stalled', 'complete'].map((filter) => (
              <button
                key={filter}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 capitalize"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Clinic</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Owner</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Progress</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Step</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Days</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {TENANTS_ONBOARDING.map((tenant) => (
              <tr key={tenant.name} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">{tenant.owner}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          tenant.pct === 100 ? 'bg-emerald-500' :
                          tenant.status === 'stalled' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${tenant.pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-8">{tenant.pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-600">{tenant.step}/7</td>
                <td className="px-3 py-3 text-xs text-gray-600">{tenant.daysActive}d</td>
                <td className="px-3 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    tenant.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                    tenant.status === 'stalled' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {tenant.status === 'stalled' && (
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-800">
                      Send Nudge
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
