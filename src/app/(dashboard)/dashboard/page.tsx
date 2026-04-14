'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import useSWR from 'swr';
import KPICard from '@/components/dashboard/cards/KPICard';
import ClinicScoreMeter from '@/components/dashboard/gamification/ClinicScoreMeter';
import DailyWinsBanner from '@/components/dashboard/gamification/DailyWinsBanner';
import AttentionPanel from '@/components/dashboard/panels/AttentionPanel';
import ExecutiveBriefingPanel from '@/components/dashboard/panels/ExecutiveBriefingPanel';
import QuickActions from '@/components/dashboard/panels/QuickActions';
import RecentActivity from '@/components/dashboard/panels/RecentActivity';
import AtRiskClientsPanel from '@/components/dashboard/panels/AtRiskClientsPanel';
import RevenueHealthPanel from '@/components/dashboard/panels/RevenueHealthPanel';
import NoShowRiskPanel from '@/components/dashboard/panels/NoShowRiskPanel';
import SaveQueuePanel from '@/components/dashboard/panels/SaveQueuePanel';
import FunnelHealthPanel from '@/components/dashboard/panels/FunnelHealthPanel';
import MetabolicFunnelPanel from '@/components/dashboard/panels/MetabolicFunnelPanel';
import BossLevelMilestone from '@/components/dashboard/gamification/BossLevelMilestone';
import MorningBriefing from '@/components/dashboard/gamification/MorningBriefing';
import DailyChallenges from '@/components/dashboard/gamification/DailyChallenges';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
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

function useLastUpdated(data: unknown) {
  const lastUpdatedRef = useRef<Date | null>(null);
  useEffect(() => {
    if (data) lastUpdatedRef.current = new Date();
  }, [data]);
  return lastUpdatedRef.current;
}

const authFetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null);

export default function ExecutiveHome() {
  const { data, isLoading, error, mutate } = useKPIs('today');
  const kpis = data as KPIData | undefined;
  const lastUpdated = useLastUpdated(data);
  const { data: authData } = useSWR('/api/dashboard/auth/me', authFetcher, { revalidateOnFocus: false });
  const isCeo = authData?.user?.role === 'ceo';

  return (
    <DashboardErrorBoundary pageName="Command Center">
      <div className="space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Command Center</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-body text-rani-muted">
              <Clock className="w-3 h-3" />
              <span>Last updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Morning Briefing */}
        <MorningBriefing />

        {/* Executive Briefing */}
        <ExecutiveBriefingPanel />

        {/* Hero KPI Row */}
        {error ? (
          <InlineError message="Failed to load KPI data" onRetry={() => mutate()} />
        ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6"
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
        )}

        {/* Save Queue */}
        <SaveQueuePanel />

        {/* Wins + Challenges + Boss Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <DailyWinsBanner />
          <DailyChallenges />
          <BossLevelMilestone />
        </div>

        {/* Attention + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <AttentionPanel />
          <RecentActivity />
        </div>

        {/* Intelligence Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <RevenueHealthPanel />
          <NoShowRiskPanel />
          <div className="md:col-span-2 lg:col-span-1">
            <AtRiskClientsPanel />
          </div>
        </div>

        {/* Funnel + Metabolic Conversion Health - CEO Only */}
        {isCeo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <FunnelHealthPanel />
            <MetabolicFunnelPanel />
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardErrorBoundary>
  );
}
