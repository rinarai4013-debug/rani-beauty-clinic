'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Coins } from 'lucide-react';

interface PointsCounterProps {
  points: number;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export default function PointsCounter({
  points,
  label = 'Points',
  showIcon = true,
  size = 'md',
}: PointsCounterProps) {
  const countRef = useRef<HTMLSpanElement>(null);
  const prevPoints = useRef(0);

  useEffect(() => {
    const node = countRef.current;
    if (!node) return;

    const from = prevPoints.current;
    const to = points;
    prevPoints.current = points;

    const duration = Math.min(Math.abs(to - from) * 2, 1500);
    const start = performance.now();

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / Math.max(duration, 1), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      if (node) node.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [points]);

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className="w-8 h-8 rounded-full bg-[#C9A96E]/15 flex items-center justify-center">
          <Coins size={16} className="text-rani-gold-accessible" />
        </div>
      )}
      <div>
        <span
          ref={countRef}
          className={`${sizeClasses[size]} font-heading font-bold text-rani-navy`}
        >
          {points.toLocaleString()}
        </span>
        <span className="text-xs text-rani-muted font-body ml-1.5">{label}</span>
      </div>
    </div>
  );
}
