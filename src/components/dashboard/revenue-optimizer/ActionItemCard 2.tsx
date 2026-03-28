'use client';

import { motion } from 'framer-motion';
import { Zap, Clock, Target, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { RevenueActionItem } from '@/lib/revenue/gap-finder';

interface ActionItemCardProps {
  action: RevenueActionItem;
  rank: number;
  onExecute?: (action: RevenueActionItem) => void;
}

export default function ActionItemCard({ action, rank, onExecute }: ActionItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const categoryColors: Record<string, string> = {
    'fill-slot': 'bg-blue-100 text-blue-700',
    'rebook-overdue': 'bg-amber-100 text-amber-700',
    'activate-membership': 'bg-purple-100 text-purple-700',
    'reactivate-vip': 'bg-rose-100 text-rose-700',
    'boost-service': 'bg-emerald-100 text-emerald-700',
    'optimize-day': 'bg-teal-100 text-teal-700',
  };

  const categoryLabels: Record<string, string> = {
    'fill-slot': 'Fill Slot',
    'rebook-overdue': 'Rebook',
    'activate-membership': 'Membership',
    'reactivate-vip': 'VIP Win-Back',
    'boost-service': 'Boost Service',
    'optimize-day': 'Optimize Day',
  };

  const effortBadge: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    high: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading ${
            rank <= 3 ? 'bg-rani-gold text-white' : 'bg-gray-100 text-rani-muted'
          }`}>
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-body ${categoryColors[action.category] || 'bg-gray-100 text-gray-600'}`}>
                {categoryLabels[action.category] || action.category}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border font-body ${effortBadge[action.effort]}`}>
                {action.effort} effort
              </span>
              <span className="text-xs font-body text-rani-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {action.timeToImpact}
              </span>
            </div>

            <h4 className="text-sm font-heading text-rani-navy">{action.title}</h4>
            <p className="text-xs font-body text-rani-muted mt-1 line-clamp-2">{action.description}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-base font-heading text-rani-navy">
              ${Math.round(action.estimatedRevenue).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Target className="w-3 h-3 text-rani-gold" />
              <span className="text-xs font-body text-rani-gold">{action.priority}/100</span>
            </div>
          </div>
        </div>

        {/* Expand/collapse */}
        {(action.suggestedScript || action.targetClients) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs font-body text-rani-gold hover:text-rani-navy transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 border-t border-gray-50"
        >
          {action.suggestedScript && (
            <div className="mt-3 p-3 rounded-lg bg-rani-cream/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-rani-gold" />
                <span className="text-xs font-body font-medium text-rani-navy">Suggested Script</span>
              </div>
              <p className="text-xs font-body text-rani-text italic leading-relaxed">
                &ldquo;{action.suggestedScript}&rdquo;
              </p>
            </div>
          )}

          {action.targetClients && action.targetClients.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-body font-medium text-rani-navy">Target Clients:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {action.targetClients.map((client, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-rani-text font-body">
                    {client}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onExecute && (
            <button
              onClick={() => onExecute(action)}
              className="mt-3 w-full py-2 rounded-lg bg-rani-gold text-white text-xs font-body font-medium hover:bg-rani-gold/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Execute Action
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
