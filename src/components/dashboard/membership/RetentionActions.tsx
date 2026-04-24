'use client';

import { Phone, Gift, TrendingUp, Bell, Calendar, UserPlus, Heart, CreditCard, User } from 'lucide-react';
import type { RetentionAction, RetentionActionType } from '@/lib/membership/retention';

interface RetentionActionsProps {
  actions: RetentionAction[];
  onExecute?: (_actionId: string) => void;
}

const ACTION_ICONS: Record<RetentionActionType, typeof Phone> = {
  personal_outreach: Phone,
  save_offer: Gift,
  upgrade_incentive: TrendingUp,
  usage_reminder: Bell,
  event_invitation: Calendar,
  satisfaction_survey: Heart,
  win_back: UserPlus,
  referral_prompt: User,
  provider_check_in: Phone,
  credit_bonus: CreditCard,
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-red-500 bg-red-50/50',
  high: 'border-l-orange-400 bg-orange-50/30',
  medium: 'border-l-amber-400',
  low: 'border-l-gray-300',
};

export default function RetentionActions({ actions, onExecute }: RetentionActionsProps) {
  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-rani-navy">Retention Actions</h3>
        <span className="text-xs font-body text-rani-muted">{actions.length} pending</span>
      </div>

      <div className="space-y-2">
        {actions.slice(0, 8).map((action) => {
          const Icon = ACTION_ICONS[action.type] || Bell;
          return (
            <div
              key={action.id}
              className={`p-3 rounded-lg border-l-4 ${PRIORITY_STYLES[action.priority]} transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-white shadow-sm">
                  <Icon className="w-3.5 h-3.5 text-rani-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-body font-semibold text-rani-navy truncate">{action.title}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-body font-bold uppercase ${
                      action.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      action.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {action.priority}
                    </span>
                    {action.automated && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-body font-medium bg-blue-100 text-blue-600">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-body text-rani-muted mt-0.5 line-clamp-2">{action.description}</p>
                </div>
                {onExecute && (
                  <button
                    onClick={() => onExecute(action.id)}
                    className="text-xs font-body font-medium text-rani-gold hover:text-rani-gold/80 whitespace-nowrap"
                  >
                    Execute
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
