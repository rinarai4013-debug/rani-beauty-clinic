'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

function CountUpPrice({ target, delay }: { target: number; delay: number }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    const start = performance.now();
    let frame: number;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, target]);

  return <span className="tabular-nums">${value.toLocaleString()}</span>;
}

function PackageCard({
  pkg,
  index,
  isHighlighted,
  onSelect,
}: {
  pkg: GeneratedPackage;
  index: number;
  isHighlighted: boolean;
  onSelect: () => void;
}) {
  const tierColors: Record<string, { border: string; glow: string; badge: string }> = {
    Start: { border: '#7EC8A0', glow: 'rgba(126,200,160,0.1)', badge: '#7EC8A0' },
    Transform: { border: '#C9A96E', glow: 'rgba(201,169,110,0.15)', badge: '#C9A96E' },
    Elite: { border: '#E8D5A8', glow: 'rgba(232,213,168,0.12)', badge: '#E8D5A8' },
  };

  const colors = tierColors[pkg.tier] || tierColors.Transform;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.4 + index * 0.2,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`relative rounded-2xl border backdrop-blur-sm flex flex-col ${
        isHighlighted ? 'md:scale-105 md:-translate-y-2' : ''
      }`}
      style={{
        borderColor: `${colors.border}${isHighlighted ? '40' : '20'}`,
        background: `linear-gradient(180deg, ${colors.glow}, rgba(15,29,44,0.9))`,
        boxShadow: isHighlighted ? `0 8px 40px ${colors.glow}` : 'none',
      }}
      onClick={onSelect}
    >
      {/* Most Popular badge */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            className="px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{
              background: colors.badge,
              color: '#0F1D2C',
              fontFamily: 'Montserrat, sans-serif',
            }}
            animate={{ boxShadow: [`0 0 0px ${colors.badge}00`, `0 0 20px ${colors.badge}40`, `0 0 0px ${colors.badge}00`] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Most Popular
          </motion.div>
        </motion.div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-5">
          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            {pkg.name}
          </h3>
          <p className="text-xs text-white/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {pkg.subtitle}
          </p>
        </div>

        {/* Price */}
        <div className="text-center mb-5">
          <div className="text-sm text-white/30 line-through mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            ${pkg.originalPrice.toLocaleString()}
          </div>
          <div className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            <CountUpPrice target={pkg.price} delay={0.8 + index * 0.2} />
          </div>
          <div className="text-xs text-white/40 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Save {pkg.discount}% &middot; ${pkg.savingsVsStandalone.toLocaleString()} off
          </div>
        </div>

        {/* Line items */}
        <div className="flex-1 space-y-2 mb-5">
          {pkg.lineItems.map((item) => (
            <div key={item.service} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <path d="M3 7l3 3 5-5" stroke={colors.badge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-white/60 flex-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {item.service} {item.qty > 1 ? `x${item.qty}` : ''}
              </span>
            </div>
          ))}
          {pkg.extras.map((extra) => (
            <div key={extra} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <path d="M7 3v8M3 7h8" stroke={colors.badge} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-sm text-white/50 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {extra}
              </span>
            </div>
          ))}
        </div>

        {/* Monthly payment */}
        <div className="border-t border-white/[0.06] pt-4 text-center">
          <p className="text-xs text-white/40 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Or as low as
          </p>
          <p className="text-xl font-bold" style={{ color: colors.badge, fontFamily: 'Playfair Display, serif' }}>
            ${pkg.monthlyPayment24}/mo
          </p>
          <p className="text-[10px] text-white/30" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            24-month financing
          </p>
        </div>

        {/* Best for */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/30 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Best for: {pkg.bestFor}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface SlidePackagesProps {
  packages: GeneratedPackage[];
  onSelectPackage: (tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => void;
}

export default function SlidePackages({ packages, onSelectPackage }: SlidePackagesProps) {
  // Sort: Start, Transform, Elite
  const tierOrder: Record<string, number> = { Start: 0, Essential: 0, Transform: 1, Elite: 2 };
  const sorted = [...packages].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-6 py-10 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-2 text-center"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Your Packages
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-sm text-white/40 text-center mb-8"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Three pathways to your best skin
      </motion.p>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto w-full items-start overflow-y-auto hide-scrollbar">
        {sorted.map((pkg, i) => (
          <PackageCard
            key={pkg.tier}
            pkg={pkg}
            index={i}
            isHighlighted={pkg.highlighted || pkg.tier === 'Transform'}
            onSelect={() => onSelectPackage(pkg.tier)}
          />
        ))}
      </div>
    </div>
  );
}
