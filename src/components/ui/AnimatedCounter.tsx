'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  color?: string;
  revealOnScroll?: boolean;
  formatThousands?: boolean;
  startFrom?: number;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatNumber(num: number, decimals: number, formatThousands: boolean): string {
  const fixed = num.toFixed(decimals);
  if (!formatThousands) return fixed;

  const [intPart, decPart] = fixed.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
}

export default function AnimatedCounter({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  color,
  revealOnScroll = false,
  formatThousands = true,
  startFrom = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(startFrom);
  const [hasStarted, setHasStarted] = useState(!revealOnScroll);
  const elementRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const prevValueRef = useRef(startFrom);

  // IntersectionObserver for scroll reveal
  useEffect(() => {
    if (!revealOnScroll || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [revealOnScroll]);

  // Animation
  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const from = prevValueRef.current;
      const current = from + (value - from) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    },
    [value, duration]
  );

  useEffect(() => {
    if (!hasStarted) return;

    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      prevValueRef.current = displayValue;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hasStarted, animate]);

  const defaultColor = 'text-rani-gold-accessible';
  const colorClass = color || defaultColor;

  return (
    <span
      ref={elementRef}
      className={`tabular-nums font-semibold ${colorClass} ${className}`}
      aria-label={`${prefix}${formatNumber(value, decimals, formatThousands)}${suffix}`}
    >
      {prefix}
      {formatNumber(displayValue, decimals, formatThousands)}
      {suffix}
    </span>
  );
}
