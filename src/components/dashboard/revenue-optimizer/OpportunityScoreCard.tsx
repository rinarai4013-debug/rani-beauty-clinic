'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, Users, CreditCard, RefreshCw } from 'lucide-react';
import type { ScoredOpportunity, OpportunityCategory } from '@/lib/revenue/opportunity-scorer';

interface OpportunityScoreCardProps {
  opportunity: ScoredOpportunity;
  rank: number;
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<OpportunityCategory, { icon: React.ElementType; color: string; label: string }> = {
  'fill-empty-slot': { icon: Zap, color: 'text-blue-600 bg-blue-50', label: 'Fill Slot' },
  'upsell-existing': { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', label: 'Upsell' },
  'rebook-overdue': { icon: RefreshCw, color: 'text-amber-600 bg-amber-50', label: 'Rebook' },
  'reactivate-dormant': { icon: Users, color: 'text-purple-600 bg-purple-50', label: 'Reactivate' },
  'win-back-lapsed': { icon: Users, color: 'text-rose-600 bg-rose-50', label: 'Win Back' },
  'vip-retention': { icon: Target, color: 'text-rani-gold bg-amber-50', label: 'VIP' },
  'new-client-acquisition': { icon: Users, color: 'text-teal-600 bg-teal-50', label: 'New Client' },
  'price-optimization': { icon: CreditCard, color: 'text-indigo-600 bg-indigo-50', label: 'Pricing' },
  'package-conversion': { icon: CreditCard, color: 'text-cyan-600 bg-cyan-50', label: 'Package' },
  'membership-conversion': { icon: CreditCard, color: 'text-violet-600 bg-violet-50', label: 'Membership' },
};

export default function OpportunityScoreCard({ opportunity, rank, compact = false }: OpportunityScoreCardProps) {
  const config = CATEGORY_CONFIG[opportunity.category] || CATEGORY_CONFIG['fill-empty-slot'];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
        <span className={`text-xs font-heading w-6 h-6 rounded-full flex items-center justify-center ${
          rank <= 3 ? 'bg-rani-gold text-white' : 'bg-gray-100 text-rani-muted'
        }`}>
          {rank}
        </span>
        <div className={`p-1.5 rounded ${config.color.split(' ')[1]}`}>
          <Icon className={`w-3.5 h-3.5 ${config.color.split(' ')[0]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-rani-navy truncate">{opportunity.title}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-heading text-rani-navy">${Math.round(opportunity.expectedValue).toLocaleString()}</p>
          <p className="text-xs font-body text-rani-muted">{opportunity.score}pts</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.03 }}
      className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className={`text-sm font-heading w-7 h-7 rounded-full flex items-center justify-center ${
            rank <= 3 ? 'bg-rani-gold text-white' : 'bg-gray-100 text-rani-muted'
          }`}>
            {rank}
          </span>
          <div className={`p-2 rounded-lg ${config.color.split(' ')[1]}`}>
            <Icon className={`w-4 h-4 ${config.color.split(' ')[0]}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-body ${config.color}`}>
              {config.label}
            </span>
            {opportunity.tags.map((tag, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-rani-muted font-body">
                {tag}
              </span>
            ))}
          </div>

          <h4 className="text-sm font-heading text-rani-navy">{opportunity.title}</h4>
          <p className="text-xs font-body text-rani-muted mt-1">{opportunity.description}</p>

          {opportunity.targetClient && (
            <p className="text-xs font-body text-rani-gold mt-1">Client: {opportunity.targetClient}</p>
          )}

          {/* Score breakdown bar */}
          <div className="mt-3 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-100">
            <div className="bg-blue-400 rounded-l" style={{ width: `${opportunity.scoreBreakdown.revenueWeight * 0.35}%` }} />
            <div className="bg-emerald-400" style={{ width: `${opportunity.scoreBreakdown.effortWeight * 0.20}%` }} />
            <div className="bg-amber-400" style={{ width: `${opportunity.scoreBreakdown.timeWeight * 0.25}%` }} />
            <div className="bg-purple-400 rounded-r" style={{ width: `${opportunity.scoreBreakdown.probabilityWeight * 0.20}%` }} />
          </div>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-blue-500 font-body">Revenue</span>
            <span className="text-[10px] text-emerald-500 font-body">Effort</span>
            <span className="text-[10px] text-amber-500 font-body">Speed</span>
            <span className="text-[10px] text-purple-500 font-body">Probability</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {/* Score ring */}
          <div className="relative w-14 h-14 mx-auto">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke={opportunity.score >= 70 ? '#C9A96E' : opportunity.score >= 40 ? '#f59e0b' : '#94a3b8'}
                strokeWidth="4"
                strokeDasharray={`${(opportunity.score / 100) * 150.8} 150.8`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-heading text-rani-navy">
              {opportunity.score}
            </span>
          </div>

          <div className="mt-2">
            <p className="text-sm font-heading text-rani-navy">${Math.round(opportunity.expectedValue).toLocaleString()}</p>
            <p className="text-[10px] font-body text-rani-muted">expected value</p>
          </div>
        </div>
      </div>

      {opportunity.suggestedAction && (
        <div className="mt-3 p-2.5 rounded-lg bg-rani-cream/50 text-xs font-body text-rani-text">
          <span className="font-medium text-rani-navy">Action:</span> {opportunity.suggestedAction}
        </div>
      )}
    </motion.div>
  );
}
