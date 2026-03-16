'use client';

import { motion } from 'framer-motion';
import KPICard from '@/components/dashboard/cards/KPICard';
import ClinicScoreMeter from '@/components/dashboard/gamification/ClinicScoreMeter';
import DailyWinsBanner from '@/components/dashboard/gamification/DailyWinsBanner';
import AttentionPanel from '@/components/dashboard/panels/AttentionPanel';
import QuickActions from '@/components/dashboard/panels/QuickActions';
import RecentActivity from '@/components/dashboard/panels/RecentActivity';
import BossLevelMilestone from '@/components/dashboard/gamification/BossLevelMilestone';
import { useKPIs } from '@/hooks/useDashboardData';
import type { KPIData } from '@/types/dashboard';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ExecutiveHome() {
  const { data, isLoading } = useKPIs('today');
  const kpis = data as KPIData | undefined;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">Command Center</h1>
        <p className="text-sm font-body text-rani-muted mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Hero KPI Row */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        <motion.div variants={item}>
          <KPICard
            title="Revenue Today"
            value={kpis?.revenue.today ?? 0}
            prefix="$"
            trend={{
              value: 12.5,
              direction: 'up',
              label: 'vs yesterday',
            }}
            progress={{
              current: kpis?.revenue.today ?? 0,
              target: 4000,
              label: 'of $4K daily goal',
            }}
            sparklineData={kpis?.revenue.trend ?? [800, 1200, 950, 1800, 2200, 3100, kpis?.revenue.today ?? 0]}
            icon="dollar-sign"
            size="hero"
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={item}>
          <KPICard
            title="Appointments"
            value={kpis?.bookings.today ?? 0}
            trend={{
              value: 8,
              direction: 'up',
              label: 'vs last week',
            }}
            progress={{
              current: kpis?.bookings.utilization ?? 0,
              target: 100,
              label: 'utilization',
            }}
            sparklineData={kpis?.bookings.trend ?? [5, 7, 6, 8, 9, 7, kpis?.bookings.today ?? 0]}
            icon="calendar"
            size="hero"
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={item}>
          <KPICard
            title="Consult Close Rate"
            value={kpis?.consults.closeRate ?? 0}
            suffix="%"
            trend={{
              value: 5,
              direction: 'up',
              label: 'vs last month',
            }}
            sparklineData={kpis?.consults.trend ?? [55, 60, 58, 65, 70, 62, kpis?.consults.closeRate ?? 0]}
            icon="target"
            size="hero"
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={item}>
          <ClinicScoreMeter />
        </motion.div>
      </motion.div>

      {/* Wins + Boss Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyWinsBanner />
        </div>
        <BossLevelMilestone />
      </div>

      {/* Attention + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttentionPanel />
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
