'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface AuraScoreGaugeProps {
  score: number;
  grade: string;
  skinAge?: number;
  realAge?: number;
  animate?: boolean;
  size?: Size;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { svgSize: 160, strokeWidth: 8, fontSize: 28, gradeSize: 12, labelSize: 10, radius: 62 },
  md: { svgSize: 220, strokeWidth: 10, fontSize: 40, gradeSize: 15, labelSize: 12, radius: 86 },
  lg: { svgSize: 300, strokeWidth: 12, fontSize: 54, gradeSize: 18, labelSize: 14, radius: 118 },
  xl: { svgSize: 380, strokeWidth: 14, fontSize: 68, gradeSize: 22, labelSize: 16, radius: 150 },
} as const;

function getGradeColor(grade: string): string {
  const g = grade.toUpperCase();
  if (g === 'A+' || g === 'A') return '#C9A96E';
  if (g === 'A-' || g === 'B+') return '#E8D5A8';
  if (g === 'B' || g === 'B-') return '#d4a24e';
  if (g.startsWith('C')) return '#d97706';
  return '#dc2626';
}

function getScoreGradientId(score: number): string {
  return `aura-gradient-${score}`;
}

export default function AuraScoreGauge({
  score,
  grade,
  skinAge,
  realAge,
  animate = true,
  size = 'lg',
  className = '',
}: AuraScoreGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const shouldAnimate = animate && isInView;

  const config = SIZE_CONFIG[size];
  const { svgSize, strokeWidth, fontSize, gradeSize, labelSize, radius } = config;
  const center = svgSize / 2;

  // Arc calculations (270 degree arc, starting from bottom-left)
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const filledLength = (score / 100) * arcLength;
  const emptyLength = arcLength - filledLength;

  // Start angle: 135 degrees (bottom-left), sweep 270 degrees
  const startAngle = 135;
  const endAngle = startAngle + 270;
  const scoreAngle = startAngle + (score / 100) * 270;

  // Tick marks
  const tickCount = 36;
  const ticks = useMemo(() => {
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const angle = startAngle + (i / tickCount) * 270;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 9 === 0;
      const innerR = radius - (isMajor ? strokeWidth + 8 : strokeWidth + 4);
      const outerR = radius - strokeWidth - 1;
      return {
        x1: center + innerR * Math.cos(rad),
        y1: center + innerR * Math.sin(rad),
        x2: center + outerR * Math.cos(rad),
        y2: center + outerR * Math.sin(rad),
        isMajor,
        filled: (i / tickCount) * 100 <= score,
      };
    });
  }, [center, radius, strokeWidth, score, startAngle]);

  // Concentric decoration rings
  const decorRings = useMemo(() => {
    const rings = [];
    for (let i = 1; i <= 3; i++) {
      rings.push(radius - strokeWidth - 12 - i * 8);
    }
    return rings;
  }, [radius, strokeWidth]);

  const gradientId = getScoreGradientId(score);
  const glowId = `aura-glow-${score}`;
  const gradeColor = getGradeColor(grade);

  const skinAgeDiff = skinAge != null && realAge != null ? skinAge - realAge : null;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center gap-3 ${className}`}
    >
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={
            shouldAnimate
              ? {
                  boxShadow: [
                    '0 0 20px rgba(201, 169, 110, 0.15), 0 0 40px rgba(201, 169, 110, 0.05)',
                    '0 0 30px rgba(201, 169, 110, 0.25), 0 0 60px rgba(201, 169, 110, 0.1)',
                    '0 0 20px rgba(201, 169, 110, 0.15), 0 0 40px rgba(201, 169, 110, 0.05)',
                  ],
                }
              : {}
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="transform -rotate-0"
        >
          <defs>
            {/* Score arc gradient */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9A96E" />
              <stop offset="50%" stopColor="#E8D5A8" />
              <stop offset="100%" stopColor="#A08040" />
            </linearGradient>

            {/* Glow filter */}
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Inner shadow */}
            <radialGradient id={`${gradientId}-inner`} cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(201, 169, 110, 0.03)" />
            </radialGradient>
          </defs>

          {/* Concentric decoration rings */}
          {decorRings.map((r, i) => (
            <circle
              key={`decor-${i}`}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="rgba(201, 169, 110, 0.04)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          ))}

          {/* Inner glow circle */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth - 2}
            fill={`url(#${gradientId}-inner)`}
          />

          {/* Background arc (track) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(201, 169, 110, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-circumference * 0.625}
            transform={`rotate(0 ${center} ${center})`}
          />

          {/* Filled arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-circumference * 0.625}
            initial={shouldAnimate ? { strokeDasharray: `0 ${circumference}` } : undefined}
            animate={
              shouldAnimate
                ? {
                    strokeDasharray: `${filledLength} ${circumference - filledLength}`,
                    strokeDashoffset: -circumference * 0.625,
                  }
                : {
                    strokeDasharray: `${filledLength} ${circumference - filledLength}`,
                    strokeDashoffset: -circumference * 0.625,
                  }
            }
            transition={{ duration: 2, ease: [0.65, 0, 0.35, 1], delay: 0.3 }}
          />

          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <motion.line
              key={`tick-${i}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={
                tick.filled
                  ? 'rgba(201, 169, 110, 0.5)'
                  : 'rgba(201, 169, 110, 0.1)'
              }
              strokeWidth={tick.isMajor ? 1.5 : 0.5}
              initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: shouldAnimate ? 0.5 + i * 0.02 : 0 }}
            />
          ))}

          {/* Score text */}
          <text
            x={center}
            y={center - fontSize * 0.1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#C9A96E"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="var(--font-body), Montserrat, sans-serif"
            className="tabular-nums"
          >
            {shouldAnimate ? '' : score}
          </text>

          {/* "AURA SCORE" label */}
          <text
            x={center}
            y={center + fontSize * 0.55}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(201, 169, 110, 0.5)"
            fontSize={labelSize}
            fontWeight="500"
            fontFamily="var(--font-body), Montserrat, sans-serif"
            letterSpacing="2"
          >
            AURA SCORE
          </text>
        </svg>

        {/* Animated counter overlay (positioned over the SVG text area) */}
        {shouldAnimate && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ paddingBottom: fontSize * 0.4 }}
          >
            <AnimatedCounter
              value={score}
              duration={2000}
              decimals={0}
              className={`font-bold`}
              color="text-rani-gold-accessible"
              formatThousands={false}
              revealOnScroll={false}
              startFrom={0}
            />
            {/* We need to apply the font size via style since AnimatedCounter uses className */}
            <style jsx>{`
              div :global(.tabular-nums) {
                font-size: ${fontSize}px;
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Grade badge */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: shouldAnimate ? 1.5 : 0 }}
      >
        <motion.div
          className="px-4 py-1.5 rounded-full font-bold tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}dd)`,
            color: '#0F1D2C',
            fontSize: gradeSize,
            boxShadow: `0 0 20px ${gradeColor}40, 0 0 40px ${gradeColor}15`,
          }}
          animate={
            shouldAnimate
              ? {
                  boxShadow: [
                    `0 0 20px ${gradeColor}40, 0 0 40px ${gradeColor}15`,
                    `0 0 30px ${gradeColor}60, 0 0 60px ${gradeColor}25`,
                    `0 0 20px ${gradeColor}40, 0 0 40px ${gradeColor}15`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Grade: {grade}
        </motion.div>

        {/* Skin Age vs Real Age */}
        {skinAge != null && realAge != null && (
          <div className="flex items-center gap-4 mt-1">
            <div className="text-center">
              <div
                className="text-xs uppercase tracking-wider mb-0.5"
                style={{ color: 'rgba(201, 169, 110, 0.5)', fontSize: labelSize - 2 }}
              >
                Skin Age
              </div>
              <div
                className="font-semibold"
                style={{
                  color:
                    skinAgeDiff != null && skinAgeDiff < 0
                      ? '#34d399'
                      : skinAgeDiff != null && skinAgeDiff > 2
                        ? '#f87171'
                        : '#C9A96E',
                  fontSize: gradeSize,
                }}
              >
                {skinAge}
              </div>
            </div>

            <div
              className="w-px h-6"
              style={{ background: 'rgba(201, 169, 110, 0.2)' }}
            />

            <div className="text-center">
              <div
                className="text-xs uppercase tracking-wider mb-0.5"
                style={{ color: 'rgba(201, 169, 110, 0.5)', fontSize: labelSize - 2 }}
              >
                Real Age
              </div>
              <div
                className="font-semibold"
                style={{ color: '#C9A96E', fontSize: gradeSize }}
              >
                {realAge}
              </div>
            </div>

            {skinAgeDiff != null && (
              <>
                <div
                  className="w-px h-6"
                  style={{ background: 'rgba(201, 169, 110, 0.2)' }}
                />
                <div className="text-center">
                  <div
                    className="text-xs uppercase tracking-wider mb-0.5"
                    style={{ color: 'rgba(201, 169, 110, 0.5)', fontSize: labelSize - 2 }}
                  >
                    Diff
                  </div>
                  <div
                    className="font-semibold"
                    style={{
                      color: skinAgeDiff < 0 ? '#34d399' : skinAgeDiff > 2 ? '#f87171' : '#C9A96E',
                      fontSize: gradeSize,
                    }}
                  >
                    {skinAgeDiff > 0 ? '+' : ''}
                    {skinAgeDiff}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
