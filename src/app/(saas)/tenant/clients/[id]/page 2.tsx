/**
 * Tenant Dashboard — Client 360 View
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTenantClient360 } from '@/hooks/useTenantDashboard';

export default function Client360Page() {
  const params = useParams();
  const clientId = params.id as string;
  const { data: client, isLoading, error } = useTenantClient360(clientId);

  if (isLoading) return <Client360Skeleton />;
  if (error || !client) return <div className="p-8 text-center text-gray-500">Client not found</div>;

  const { profile, riskScore, segment, treatments, visits, transactions, communications, loyalty, memberships, recommendations } = client;

  return (
    <div className="space-y-6">
      {/* Back Link + Header */}
      <div className="flex items-center gap-4">
        <Link href="/tenant/clients" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Clients</Link>
      </div>

      {/* Client Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
              <p className="text-sm text-gray-500">{profile.email} | {profile.phone}</p>
              <div className="flex gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">{profile.status}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">{segment.segment.replace(/_/g, ' ')}</span>
                {loyalty.tier && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">{loyalty.tier} Member</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800">Send Message</button>
            <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Book Appointment</button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard label="Lifetime Value" value={`$${profile.ltv.toLocaleString()}`} />
        <MetricCard label="Total Visits" value={String(profile.visitCount)} />
        <MetricCard label="Avg/Visit" value={`$${profile.avgSpendPerVisit.toLocaleString()}`} />
        <MetricCard label="Loyalty Points" value={loyalty.points.toLocaleString()} />
        <MetricCard label="Churn Risk" value={`${riskScore.score}%`} alert={riskScore.risk === 'high' || riskScore.risk === 'critical'} />
        <MetricCard label="RFM Score" value={`${segment.score}/15`} />
      </div>

      {/* Churn Risk Detail */}
      {riskScore.risk !== 'low' && (
        <div className={`rounded-xl border p-5 ${riskScore.risk === 'critical' ? 'bg-red-50 border-red-200' : riskScore.risk === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className="text-sm font-semibold text-gray-900">Churn Risk: {riskScore.risk.toUpperCase()}</h3>
          <p className="text-sm text-gray-600 mt-1">{riskScore.recommendation}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
            {riskScore.factors.map((f) => (
              <div key={f.name} className="text-xs">
                <span className="text-gray-500">{f.name}</span>
                <span className="block font-bold text-gray-900">{f.score}/100 ({f.weight}%)</span>
                <span className="text-gray-500">{f.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">{rec.service}</span>
                  <span className="text-xs text-gray-500 ml-2">{rec.reason}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">${rec.estimatedPrice}</span>
                  <span className="block text-xs text-blue-600">{rec.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Visits, Transactions, Treatments, Communications, Memberships */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Treatment History</h3>
          <div className="space-y-2">
            {treatments.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-900">{t.service}</span>
                  <span className="text-xs text-gray-500 ml-2">{t.count}x</span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>${t.totalSpend.toLocaleString()} total</div>
                  {t.nextDue && <div className="text-orange-600">Due: {new Date(t.nextDue).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
            {treatments.length === 0 && <p className="text-sm text-gray-400">No treatments yet</p>}
          </div>
        </div>

        {/* Recent Visits */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Visits</h3>
          <div className="space-y-2">
            {visits.slice(0, 10).map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-900">{v.service}</span>
                  <span className="text-xs text-gray-500 ml-2">with {v.provider}</span>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-900 font-medium">${v.amount}</div>
                  <div className="text-gray-500">{new Date(v.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {visits.length === 0 && <p className="text-sm text-gray-400">No visits yet</p>}
          </div>
        </div>

        {/* Communication History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Communication History</h3>
          <div className="space-y-2">
            {communications.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${c.direction === 'inbound' ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <span className="text-sm text-gray-900">{c.preview.slice(0, 50)}{c.preview.length > 50 ? '...' : ''}</span>
                </div>
                <div className="text-xs text-gray-500">{c.type} | {new Date(c.date).toLocaleDateString()}</div>
              </div>
            ))}
            {communications.length === 0 && <p className="text-sm text-gray-400">No communications yet</p>}
          </div>
        </div>

        {/* Loyalty & Memberships */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Loyalty & Memberships</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Loyalty Tier: <span className="font-semibold capitalize">{loyalty.tier}</span></span>
              <span className="text-gray-600">{loyalty.points.toLocaleString()} points</span>
            </div>
            {loyalty.pointsToNextTier > 0 && (
              <p className="text-xs text-gray-500 mt-1">{loyalty.pointsToNextTier.toLocaleString()} points to next tier</p>
            )}
          </div>
          <div className="space-y-2">
            {memberships.map((m) => (
              <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">{m.plan}</span>
                  <span className={`text-xs font-medium ${m.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{m.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">${m.monthlyRate}/mo | Since {new Date(m.startDate).toLocaleDateString()}</p>
              </div>
            ))}
            {memberships.length === 0 && <p className="text-sm text-gray-400">No active memberships</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function Client360Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-white rounded-xl border border-gray-200" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-200" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white rounded-xl border border-gray-200" />)}
      </div>
    </div>
  );
}
