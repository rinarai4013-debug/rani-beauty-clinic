/**
 * Tenant Dashboard — AI Engines Hub Page
 */

'use client';

import { useState } from 'react';
import { useTenantAIHub, useTenantChurnPredictions, useTenantDynamicPricing } from '@/hooks/useTenantDashboard';

export default function TenantAIPage() {
  const [activeEngine, setActiveEngine] = useState<string | null>(null);
  const { data: hub, isLoading } = useTenantAIHub();
  const { data: churn } = useTenantChurnPredictions();
  const { data: pricing } = useTenantDynamicPricing();

  if (isLoading) return <div className="animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-200" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Engines</h2>
          <p className="text-sm text-gray-500 mt-1">
            {hub?.engines?.filter(e => e.enabled).length ?? 0} active engines | {hub?.tier} tier
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            AI Credits: <span className="font-bold text-gray-900">{hub?.usedAICredits ?? 0}</span> / {hub?.totalAICredits?.toLocaleString() ?? 0}
          </div>
        </div>
      </div>

      {/* Engine Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hub?.engines?.map((engine) => (
          <div key={engine.id}
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
              engine.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
            } ${activeEngine === engine.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setActiveEngine(activeEngine === engine.id ? null : engine.id)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{engine.name}</h3>
              <span className={`w-2 h-2 rounded-full ${
                engine.status === 'active' ? 'bg-green-500' :
                engine.status === 'error' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
            </div>
            <p className="text-xs text-gray-500 mb-3">{engine.description}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                engine.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {engine.enabled ? 'Active' : `Requires ${engine.requiredTier}`}
              </span>
              {engine.enabled && (
                <span className="text-xs text-gray-400">{engine.usage.current}/{engine.usage.limit} {engine.usage.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Churn Prediction Dashboard */}
      {activeEngine === 'churn' && churn && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Prediction Dashboard</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-500">Total At Risk</p><p className="text-2xl font-bold text-red-600">{churn.summary.totalAtRisk}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-500">Critical</p><p className="text-2xl font-bold text-red-700">{churn.summary.criticalCount}</p></div>
            <div className="p-3 bg-orange-50 rounded-lg"><p className="text-xs text-gray-500">High</p><p className="text-2xl font-bold text-orange-600">{churn.summary.highCount}</p></div>
            <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-xs text-gray-500">Moderate</p><p className="text-2xl font-bold text-yellow-600">{churn.summary.moderateCount}</p></div>
          </div>
          <div className="space-y-2">
            {churn.predictions.slice(0, 10).map((p) => (
              <div key={p.clientId} className={`flex items-center justify-between p-3 rounded-lg ${
                p.risk === 'critical' ? 'bg-red-50' : p.risk === 'high' ? 'bg-orange-50' : 'bg-yellow-50'
              }`}>
                <div>
                  <span className="text-sm font-medium text-gray-900">{p.clientName}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{p.suggestedAction}</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${p.risk === 'critical' ? 'text-red-600' : p.risk === 'high' ? 'text-orange-600' : 'text-yellow-600'}`}>{p.score}%</span>
                  {p.automationAvailable && <p className="text-xs text-blue-600">Auto-action available</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Pricing */}
      {activeEngine === 'pricing' && pricing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dynamic Pricing Suggestions</h3>
          <p className="text-sm text-gray-500 mb-4">Overall Revenue Impact: <span className="font-bold text-green-600">${pricing.overallImpact.toLocaleString()}</span></p>
          <div className="space-y-3">
            {pricing.suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">{s.service}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{s.reasoning}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">${s.currentPrice}</span>
                    <span className="text-sm font-bold text-gray-900">${s.suggestedPrice}</span>
                  </div>
                  <span className={`text-xs font-medium ${s.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {s.changePercent > 0 ? '+' : ''}{s.changePercent}%
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{s.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
