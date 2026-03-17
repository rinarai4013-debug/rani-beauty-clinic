'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, DollarSign, Target, Zap } from 'lucide-react';
import { useClientRecommendations } from '@/hooks/useDashboardData';

interface Recommendation {
  service: string;
  category: string;
  reason: string;
  strategy: 'pathway' | 'category_gap' | 'goal_based' | 'timing' | 'membership_upsell';
  confidence: number;
  estimatedPrice: number;
  priority: number;
  maintenanceDays?: number;
  isOverdue?: boolean;
}

interface RecommendationData {
  recommendations: Recommendation[];
  clientId: string;
  clientName: string;
}

const STRATEGY_CONFIG = {
  pathway: { icon: ArrowRight, label: 'Next Step', color: 'text-blue-600 bg-blue-50' },
  category_gap: { icon: Target, label: 'New Category', color: 'text-purple-600 bg-purple-50' },
  goal_based: { icon: Sparkles, label: 'Goal Match', color: 'text-rani-gold bg-rani-gold/10' },
  timing: { icon: Clock, label: 'Overdue', color: 'text-orange-600 bg-orange-50' },
  membership_upsell: { icon: Zap, label: 'Membership', color: 'text-green-600 bg-green-50' },
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function RecommendationsPanel({ clientId }: { clientId: string }) {
  const { data, isLoading } = useClientRecommendations(clientId);
  const recData = data as RecommendationData | undefined;
  const recommendations = recData?.recommendations || [];

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-rani-gold" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            AI Recommendations
          </h3>
        </div>
        <p className="text-sm font-body text-rani-muted py-4 text-center">
          Not enough treatment history to generate recommendations yet.
        </p>
      </div>
    );
  }

  const totalPotential = recommendations.reduce((sum, r) => sum + r.estimatedPrice, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5 lg:col-span-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rani-gold" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            AI Recommendations
          </h3>
        </div>
        <span className="text-xs font-body text-rani-muted">
          {formatCurrency(totalPotential)} potential
        </span>
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.slice(0, 6).map((rec, i) => {
          const config = STRATEGY_CONFIG[rec.strategy] || STRATEGY_CONFIG.pathway;
          const StrategyIcon = config.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className={`p-4 rounded-xl border border-rani-border hover:border-rani-gold/30 hover:shadow-sm transition-all ${
                rec.isOverdue ? 'bg-orange-50/50' : 'bg-white/50'
              }`}
            >
              {/* Strategy Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${config.color}`}>
                  <StrategyIcon className="w-2.5 h-2.5" />
                  {config.label}
                </span>
                {rec.isOverdue && (
                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-body font-semibold">
                    OVERDUE
                  </span>
                )}
              </div>

              {/* Service */}
              <h4 className="text-sm font-body font-semibold text-rani-navy mb-1">{rec.service}</h4>
              <p className="text-xs font-body text-rani-muted mb-3 line-clamp-2">{rec.reason}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-rani-border/50">
                <span className="flex items-center gap-1 text-xs font-body text-rani-navy font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(rec.estimatedPrice)}
                </span>
                <span className="text-[10px] font-body text-rani-muted">{rec.category}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
