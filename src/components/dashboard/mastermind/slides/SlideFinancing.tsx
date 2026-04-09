'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

function TermButton({
  months,
  active,
  onClick,
}: {
  months: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
        active ? 'text-[#0F1D2C]' : 'text-white/50 hover:text-white/70'
      }`}
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {active && (
        <motion.div
          layoutId="termPill"
          className="absolute inset-0 rounded-full bg-[#C9A96E]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{months} months</span>
    </motion.button>
  );
}

interface SlideFinancingProps {
  packages: GeneratedPackage[];
  selectedTier: 'Start' | 'Transform' | 'Elite' | 'Essential' | null;
}

export default function SlideFinancing({ packages, selectedTier }: SlideFinancingProps) {
  const [term, setTerm] = useState(24);
  const terms = [6, 12, 24, 36];

  // Default to Transform if none selected
  const pkg = packages.find((p) => p.tier === (selectedTier || 'Transform')) || packages[0];

  // Simple financing calculation (0% APR promo simplification)
  // Must be called before any early return to satisfy Rules of Hooks
  const monthlyPayment = useMemo(() => {
    if (!pkg) return 0;
    if (term === 12) return pkg.monthlyPayment12;
    if (term === 24) return pkg.monthlyPayment24;
    // Approximate for other terms
    return Math.round(pkg.price / term);
  }, [pkg, term]);

  if (!pkg) return null;

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-8 py-10 overflow-hidden items-center justify-center">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.3), transparent 70%)' }}
      />

      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-2 text-center z-10"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Financing Made Easy
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-sm text-white/40 text-center mb-10 z-10"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Same incredible results, comfortable monthly payments
      </motion.p>

      {/* Package name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-center mb-8 z-10"
      >
        <h3 className="text-xl text-white font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
          {pkg.name}
        </h3>
        <p className="text-sm text-white/40 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Total: ${pkg.price.toLocaleString()}
        </p>
      </motion.div>

      {/* Term selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="flex gap-2 bg-white/[0.04] rounded-full p-1 border border-white/[0.08] mb-10 z-10"
      >
        {terms.map((t) => (
          <TermButton key={t} months={t} active={term === t} onClick={() => setTerm(t)} />
        ))}
      </motion.div>

      {/* Monthly payment - the hero number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-8 z-10"
      >
        <p className="text-sm text-white/40 uppercase tracking-wider mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          As low as
        </p>
        <motion.div
          key={term}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span
            className="text-6xl md:text-8xl font-bold"
            style={{
              color: '#C9A96E',
              fontFamily: 'Playfair Display, serif',
              textShadow: '0 0 40px rgba(201,169,110,0.3)',
            }}
          >
            ${monthlyPayment}
          </span>
          <span className="text-2xl text-[#C9A96E]/60 ml-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            /mo
          </span>
        </motion.div>
        <p className="text-sm text-white/30 mt-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {term}-month plan &middot; {pkg.sessions} total sessions
        </p>
      </motion.div>

      {/* Breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="grid grid-cols-3 gap-6 max-w-md w-full z-10"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-white tabular-nums" style={{ fontFamily: 'Playfair Display, serif' }}>
            ${pkg.price.toLocaleString()}
          </p>
          <p className="text-xs text-white/30 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Total Investment
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#7EC8A0] tabular-nums" style={{ fontFamily: 'Playfair Display, serif' }}>
            ${pkg.savingsVsStandalone.toLocaleString()}
          </p>
          <p className="text-xs text-white/30 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            You Save
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white tabular-nums" style={{ fontFamily: 'Playfair Display, serif' }}>
            {pkg.sessions}
          </p>
          <p className="text-xs text-white/30 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Sessions
          </p>
        </div>
      </motion.div>

      {/* Financing note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="text-xs text-white/20 mt-8 text-center z-10 max-w-sm"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Financing subject to credit approval. Ask about our 0% APR promotional options.
      </motion.p>
    </div>
  );
}
