'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PredictiveMetrics, SimulationComparison } from '@/types/mastermind';

// ── Animated line chart ──
function TrajectoryChart({
  withTreatment,
  withoutTreatment,
  side,
}: {
  withTreatment: { month: number; score: number }[];
  withoutTreatment: { month: number; score: number }[];
  side: 'with' | 'without';
}) {
  const data = side === 'with' ? withTreatment : withoutTreatment;
  const color = side === 'with' ? '#C9A96E' : '#E8634F';

  // Chart dimensions
  const w = 400;
  const h = 200;
  const padX = 40;
  const padY = 30;

  const maxMonth = Math.max(...data.map((d) => d.month), 60);
  const minScore = Math.min(...withTreatment.map((d) => d.score), ...withoutTreatment.map((d) => d.score)) - 5;
  const maxScore = Math.max(...withTreatment.map((d) => d.score), ...withoutTreatment.map((d) => d.score)) + 5;

  const toX = (month: number) => padX + ((month / maxMonth) * (w - padX * 2));
  const toY = (score: number) => h - padY - ((score - minScore) / (maxScore - minScore)) * (h - padY * 2);

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.month)} ${toY(d.score)}`).join(' ');
  const pathLength = 800; // approximate

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Grid lines */}
      {[0, 12, 36, 60].map((m) => (
        <g key={m}>
          <line x1={toX(m)} y1={padY} x2={toX(m)} y2={h - padY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={toX(m)} y={h - 8} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" fontFamily="Montserrat, sans-serif">
            {m === 0 ? 'Now' : m === 12 ? '1Y' : m === 36 ? '3Y' : '5Y'}
          </text>
        </g>
      ))}

      {/* Animated path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={pathLength}
        initial={{ strokeDashoffset: pathLength }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ delay: 0.8, duration: 2, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />

      {/* End score label */}
      {data.length > 0 && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.5 }}
        >
          <text
            x={toX(data[data.length - 1].month) + 5}
            y={toY(data[data.length - 1].score) - 8}
            fill={color}
            fontSize="14"
            fontWeight="bold"
            fontFamily="Playfair Display, serif"
          >
            {data[data.length - 1].score}
          </text>
        </motion.g>
      )}
    </svg>
  );
}

interface SlideCostOfWaitingProps {
  predictiveMetrics: PredictiveMetrics;
  currentScore: number;
  simulationComparison: SimulationComparison | null;
}

export default function SlideCostOfWaiting({
  predictiveMetrics,
  currentScore,
  simulationComparison,
}: SlideCostOfWaitingProps) {
  const withTreatment = [
    { month: 0, score: currentScore },
    { month: 3, score: predictiveMetrics.withTreatment.threeMonths.auraScore },
    { month: 6, score: predictiveMetrics.withTreatment.sixMonths.auraScore },
    { month: 12, score: predictiveMetrics.withTreatment.oneYear.auraScore },
  ];

  const withoutTreatment = [
    { month: 0, score: currentScore },
    { month: 6, score: predictiveMetrics.withoutIntervention.sixMonths.auraScore },
    { month: 12, score: predictiveMetrics.withoutIntervention.oneYear.auraScore },
    { month: 36, score: predictiveMetrics.withoutIntervention.threeYears.auraScore },
    { month: 60, score: predictiveMetrics.withoutIntervention.fiveYears.auraScore },
  ];

  const costOfDelay = simulationComparison?.costOfDelay;

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-8 py-10 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-8 text-center"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        The Cost of Waiting
      </motion.h2>

      {/* Split screen charts */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
        {/* With Treatment */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/[0.03] border border-[#C9A96E]/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#C9A96E]" />
            <h3 className="text-lg text-white font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
              With Treatment
            </h3>
          </div>
          <TrajectoryChart withTreatment={withTreatment} withoutTreatment={withoutTreatment} side="with" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 0.6 }}
            className="text-sm text-[#C9A96E]/70 mt-3 text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Projected score in 1 year: <span className="text-[#C9A96E] font-bold text-lg">{predictiveMetrics.withTreatment.oneYear.auraScore}</span>
          </motion.p>
        </motion.div>

        {/* Without Treatment */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#E8634F]" />
            <h3 className="text-lg text-white font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
              Without Treatment
            </h3>
          </div>
          <TrajectoryChart withTreatment={withTreatment} withoutTreatment={withoutTreatment} side="without" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2, duration: 0.6 }}
            className="text-sm text-white/40 mt-3 text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Projected score in 5 years: <span className="text-[#E8634F] font-bold text-lg">{predictiveMetrics.withoutIntervention.fiveYears.auraScore}</span>
          </motion.p>
        </motion.div>
      </div>

      {/* Cost callout */}
      {costOfDelay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 0.8 }}
          className="mt-8 text-center max-w-2xl mx-auto"
        >
          <p className="text-base md:text-lg text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Waiting 1 year increases treatment costs by approximately
          </p>
          <p className="text-3xl md:text-4xl font-bold text-[#E8634F] mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            ${(costOfDelay.costIfDelayed1Year - costOfDelay.currentPlanCost).toLocaleString()}
          </p>
          <p className="text-sm text-white/40 mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {costOfDelay.reasoning}
          </p>
        </motion.div>
      )}
    </div>
  );
}
