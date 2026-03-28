'use client';

import { Zap, Play, Pause, BarChart3, Clock, DollarSign, FlaskConical } from 'lucide-react';
import type { AutomationRecipe, AutomationCategory } from '@/types/crm';

interface AutomationCardProps {
  automation: AutomationRecipe;
  onToggle?: (id: string, enabled: boolean) => void;
  onClick?: (automation: AutomationRecipe) => void;
}

const CATEGORY_COLORS: Record<AutomationCategory, string> = {
  lead_nurture: 'bg-purple-100 text-purple-700',
  post_treatment: 'bg-blue-100 text-blue-700',
  retention: 'bg-green-100 text-green-700',
  reactivation: 'bg-orange-100 text-orange-700',
  vip: 'bg-amber-100 text-amber-800',
  membership: 'bg-teal-100 text-teal-700',
  seasonal: 'bg-cyan-100 text-cyan-700',
  review: 'bg-pink-100 text-pink-700',
  referral: 'bg-indigo-100 text-indigo-700',
  operational: 'bg-slate-100 text-slate-700',
  birthday: 'bg-rose-100 text-rose-700',
  cross_sell: 'bg-emerald-100 text-emerald-700',
};

const CATEGORY_LABELS: Record<AutomationCategory, string> = {
  lead_nurture: 'Lead Nurture',
  post_treatment: 'Post-Treatment',
  retention: 'Retention',
  reactivation: 'Reactivation',
  vip: 'VIP',
  membership: 'Membership',
  seasonal: 'Seasonal',
  review: 'Reviews',
  referral: 'Referral',
  operational: 'Operational',
  birthday: 'Birthday',
  cross_sell: 'Cross-Sell',
};

export default function AutomationCard({ automation, onToggle, onClick }: AutomationCardProps) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${
        automation.isEnabled ? 'border-rani-border' : 'border-gray-200 opacity-60'
      }`}
      onClick={() => onClick?.(automation)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${automation.isEnabled ? 'bg-rani-gold/10' : 'bg-gray-100'}`}>
            <Zap className={`w-4 h-4 ${automation.isEnabled ? 'text-rani-gold' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-rani-navy leading-tight">{automation.name}</h4>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[automation.category]}`}>
              {CATEGORY_LABELS[automation.category]}
            </span>
          </div>
        </div>

        <button
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
            automation.isEnabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(automation.id, !automation.isEnabled);
          }}
        >
          {automation.isEnabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          {automation.isEnabled ? 'Active' : 'Paused'}
        </button>
      </div>

      <p className="text-xs text-rani-muted mb-3 line-clamp-2">{automation.description}</p>

      <div className="flex items-center justify-between text-[10px] text-rani-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {automation.executionCount} runs
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ${automation.avgRevenueGenerated.toLocaleString()}
          </span>
          {automation.successRate > 0 && (
            <span className={`font-medium ${automation.successRate >= 70 ? 'text-green-600' : automation.successRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {automation.successRate}% success
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {automation.abTest && (
            <span className="flex items-center gap-0.5 text-purple-600">
              <FlaskConical className="w-3 h-3" />
              A/B
            </span>
          )}
          {automation.lastExecutedAt && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {new Date(automation.lastExecutedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Action count indicator */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          {automation.actions.map((action, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-rani-gold/40"
              title={`Step ${i + 1}: ${action.type}`}
            />
          ))}
          <span className="text-[10px] text-rani-muted ml-1">{automation.actions.length} steps</span>
        </div>
      </div>
    </div>
  );
}
