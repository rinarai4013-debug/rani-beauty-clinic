'use client';

import { motion } from 'framer-motion';
import { DollarSign, Calendar, Star, Target, TrendingUp, Users } from 'lucide-react';
import { useProviderPerformance, useProviderGoals } from '@/hooks/useProviderData';
import { MetricGauge, ServiceMixChart, GoalProgressCard } from '@/components/dashboard/providers';

export default function ProviderDashboardPage() {
  // In production, providerId comes from session
  const providerId = 'current-provider';
  const { data: metrics, isLoading } = useProviderPerformance(providerId);
  const { data: goals } = useProviderGoals(providerId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-rani-navy">My Dashboard</h1>
        <p className="text-sm text-rani-muted font-body mt-1">Your performance overview</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      ) : metrics ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: `$${metrics.revenue.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#C9A96E' },
              { label: 'Appointments', value: metrics.appointmentsCompleted.toString(), icon: Calendar, color: '#0F1D2C' },
              { label: 'Avg Rating', value: `${metrics.avgReviewRating.toFixed(1)} ★`, icon: Star, color: '#F59E0B' },
              { label: 'Rebook Rate', value: `${metrics.rebookRate}%`, icon: Target, color: '#059669' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  <span className="text-xs text-rani-muted font-body">{stat.label}</span>
                </div>
                <p className="font-display font-bold text-xl text-rani-navy">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Performance Gauges */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">My Performance</h2>
            <div className="flex flex-wrap justify-around gap-4">
              <MetricGauge label="Utilization" value={metrics.utilizationRate} max={100} />
              <MetricGauge label="Rebook" value={metrics.rebookRate} max={100} color="#059669" />
              <MetricGauge label="Retention" value={metrics.clientRetentionRate} max={100} color="#3B82F6" />
              <MetricGauge label="Upsell" value={metrics.upsellRate} max={100} color="#7C3AED" />
            </div>
          </div>

          {/* Service Mix */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">My Service Mix</h2>
            <ServiceMixChart services={metrics.serviceMix.topServices} maxItems={6} />
          </div>
        </>
      ) : null}

      {/* Goals */}
      {goals?.goals && goals.goals.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-rani-navy mb-3">My Goals</h2>
          <div className="space-y-3">
            {goals.goals.slice(0, 3).map(goal => (
              <GoalProgressCard
                key={goal.id}
                title={goal.title}
                description={goal.description}
                currentValue={goal.currentValue}
                targetValue={goal.targetValue}
                unit={goal.unit}
                progressPercent={goal.progressPercent}
                status={goal.status}
                milestones={goal.milestones}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
