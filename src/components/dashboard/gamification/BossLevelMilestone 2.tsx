'use client';

import { motion } from 'framer-motion';
import ProgressBar from '../charts/ProgressBar';
import { formatCurrency } from '@/lib/utils/formatters';
import { BOSS_LEVELS, getCurrentBossLevel } from '@/lib/gamification/engine';

interface BossLevelMilestoneProps {
  monthlyRevenue?: number;
}

export default function BossLevelMilestone({ monthlyRevenue = 32000 }: BossLevelMilestoneProps) {
  const { current, progress } = getCurrentBossLevel(monthlyRevenue);

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(15, 29, 44, 0.08)' }}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{current.icon}</span>
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy">
            {current.name}
          </h3>
          <p className="text-[10px] font-body text-rani-muted">Monthly Boss Battle</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-end justify-between mb-1">
          <span className="text-xl font-body font-bold text-rani-navy">
            {formatCurrency(monthlyRevenue, true)}
          </span>
          <span className="text-xs font-body text-rani-muted">
            / {formatCurrency(current.target, true)}
          </span>
        </div>
        <ProgressBar
          current={monthlyRevenue}
          target={current.target}
          colorMode="gold"
          showPercentage={false}
          height={8}
        />
      </div>

      {/* Milestone markers */}
      <div className="flex justify-between mt-4">
        {BOSS_LEVELS.slice(0, 4).map((boss) => {
          const isReached = monthlyRevenue >= boss.target;
          const isCurrent = boss.id === current.id;
          return (
            <div
              key={boss.id}
              className={`flex flex-col items-center gap-0.5 ${
                isCurrent ? 'opacity-100' : isReached ? 'opacity-60' : 'opacity-30'
              }`}
            >
              <span className={`text-sm ${isCurrent ? 'scale-125' : ''}`}>{boss.icon}</span>
              <span className="text-[9px] font-body text-rani-muted">
                {formatCurrency(boss.target, true)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
