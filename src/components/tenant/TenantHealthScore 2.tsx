/**
 * Tenant Health Score / Gamification Component
 */

'use client';

import type { ClinicHealthScore } from '@/lib/saas/tenant-dashboard/overview';

interface TenantHealthScoreProps {
  score?: ClinicHealthScore;
}

export function TenantHealthScore({ score }: TenantHealthScoreProps) {
  if (!score) return <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-28" />;

  const color = score.overall >= 75 ? 'text-green-600' : score.overall >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = score.overall >= 75 ? 'bg-green-50' : score.overall >= 50 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className={`rounded-xl border border-gray-200 p-5 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clinic Health</h3>
        <span className="text-xs font-medium text-gray-500">{score.level}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${color}`}>{score.overall}</span>
        <span className="text-sm text-gray-400 mb-1">/100</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {score.components.map((c) => (
          <div key={c.name} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">{c.name}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.score >= 75 ? 'bg-green-500' : c.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${c.score}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 w-8 text-right">{c.score}</span>
          </div>
        ))}
      </div>
      {score.nextLevel !== score.level && (
        <p className="text-xs text-gray-400 mt-2">
          {score.nextLevelThreshold - score.overall} points to {score.nextLevel}
        </p>
      )}
    </div>
  );
}
