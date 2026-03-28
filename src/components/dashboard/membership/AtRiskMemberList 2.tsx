'use client';

import { AlertTriangle, ChevronRight, Phone, Gift, Bell } from 'lucide-react';
import type { MemberRetentionProfile } from '@/lib/membership/retention';

interface AtRiskMemberListProps {
  members: MemberRetentionProfile[];
  onViewMember?: (memberId: string) => void;
  onTakeAction?: (memberId: string, actionType: string) => void;
  limit?: number;
}

export default function AtRiskMemberList({ members, onViewMember, onTakeAction, limit = 10 }: AtRiskMemberListProps) {
  const displayed = members.slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-heading font-semibold text-rani-navy">At-Risk Members</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-body font-bold bg-red-100 text-red-700">
          {members.length}
        </span>
      </div>

      <div className="space-y-2">
        {displayed.map((member) => (
          <div
            key={member.memberId}
            className={`p-3 rounded-lg border ${
              member.churnRisk === 'critical' ? 'border-red-200 bg-red-50/50' :
              'border-orange-200 bg-orange-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  member.churnRisk === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'
                }`} />
                <span className="text-sm font-body font-semibold text-rani-navy">{member.clientName}</span>
                <span className="text-[10px] font-body px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                  {member.tier}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-body font-bold ${
                  member.churnScore >= 75 ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {member.churnScore}
                </span>
                {onViewMember && (
                  <button
                    onClick={() => onViewMember(member.memberId)}
                    className="p-1 rounded hover:bg-white/80"
                  >
                    <ChevronRight className="w-4 h-4 text-rani-muted" />
                  </button>
                )}
              </div>
            </div>

            {/* Top risk factors */}
            <div className="flex flex-wrap gap-1 mb-2">
              {member.riskFactors
                .filter(f => f.severity === 'high')
                .slice(0, 3)
                .map((factor, idx) => (
                  <span key={idx} className="text-[10px] font-body px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                    {factor.factor}: {factor.detail}
                  </span>
                ))}
            </div>

            {/* Quick actions */}
            {onTakeAction && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => onTakeAction(member.memberId, 'call')}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-body font-medium bg-white border border-rani-border hover:bg-rani-cream transition-colors"
                >
                  <Phone className="w-3 h-3" /> Call
                </button>
                <button
                  onClick={() => onTakeAction(member.memberId, 'offer')}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-body font-medium bg-white border border-rani-border hover:bg-rani-cream transition-colors"
                >
                  <Gift className="w-3 h-3" /> Offer
                </button>
                <button
                  onClick={() => onTakeAction(member.memberId, 'remind')}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-body font-medium bg-white border border-rani-border hover:bg-rani-cream transition-colors"
                >
                  <Bell className="w-3 h-3" /> Remind
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {members.length > limit && (
        <p className="text-xs font-body text-rani-muted text-center mt-3">
          + {members.length - limit} more at-risk members
        </p>
      )}
    </div>
  );
}
