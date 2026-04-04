'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { AuraScore, AuraDeviceAnalysis } from '@/types/mastermind';

// ── SVG Gauge Arc ──
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const radius = 140;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const [displayScore, setDisplayScore] = useState(0);
  const [showGrade, setShowGrade] = useState(false);

  useEffect(() => {
    let frame: number;
    const duration = 2500;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setShowGrade(true);
      }
    };
    // Delay start for dramatic effect
    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, 600);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [score]);

  const dashOffset = circumference - (displayScore / 100) * circumference;

  const gradeColor = (() => {
    if (grade === 'A+' || grade === 'A') return '#C9A96E';
    if (grade === 'B') return '#7EC8A0';
    if (grade === 'C') return '#F5C842';
    return '#E8634F';
  })();

  return (
    <div className="relative flex items-center justify-center">
      <svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <motion.circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: 'drop-shadow(0 0 12px rgba(201,169,110,0.4))' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A96E" />
            <stop offset="100%" stopColor="#E8D5A8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-7xl md:text-8xl font-bold text-white tabular-nums"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {displayScore}
        </span>

        {showGrade && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl font-bold mt-2"
            style={{
              color: gradeColor,
              textShadow: `0 0 30px ${gradeColor}60`,
              fontFamily: 'Playfair Display, serif',
            }}
          >
            {grade}
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ── Category breakdown bar ──
function CategoryBar({
  label,
  score,
  maxScore,
  delay,
}: {
  label: string;
  score: number;
  maxScore: number;
  delay: number;
}) {
  const pct = Math.max(5, (score / maxScore) * 100);
  const severity = score <= 2 ? '#7EC8A0' : score <= 3 ? '#F5C842' : '#E8634F';

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="flex items-center gap-4"
    >
      <span className="text-sm text-white/60 w-28 text-right uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: severity }}
        />
      </div>
      <span className="text-sm text-white/80 w-8 tabular-nums" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {score.toFixed(1)}
      </span>
    </motion.div>
  );
}

interface SlideAuraScoreProps {
  auraScore: AuraScore;
  deviceAnalysis: AuraDeviceAnalysis;
}

export default function SlideAuraScore({ auraScore, deviceAnalysis }: SlideAuraScoreProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-[#0F1D2C] px-8 py-12 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.4), transparent 70%)' }}
      />

      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-8 z-10"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Your Aura Score
      </motion.h2>

      <div className="z-10">
        <ScoreGauge score={auraScore.overall} grade={auraScore.grade} />
      </div>

      {/* Age comparison */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 0.8 }}
        className="flex gap-8 mt-8 z-10"
      >
        <div className="text-center">
          <div className="text-sm text-white/50 uppercase tracking-wider mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Skin Age</div>
          <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{auraScore.skinAge}</div>
        </div>
        <div className="w-[1px] bg-white/20" />
        <div className="text-center">
          <div className="text-sm text-white/50 uppercase tracking-wider mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Real Age</div>
          <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{auraScore.chronologicalAge}</div>
        </div>
      </motion.div>

      {/* Percentile */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.6, duration: 0.6 }}
        className="text-sm text-white/50 mt-4 z-10"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Better than <span className="text-[#C9A96E] font-semibold">{auraScore.percentile}%</span> of people your age
      </motion.p>

      {/* 5-category breakdown */}
      <motion.div className="w-full max-w-lg mt-10 space-y-3 z-10">
        {deviceAnalysis.categories.map((cat, i) => (
          <CategoryBar
            key={cat.category}
            label={cat.label}
            score={cat.absoluteScore}
            maxScore={5}
            delay={3.8 + i * 0.3}
          />
        ))}
      </motion.div>
    </div>
  );
}
