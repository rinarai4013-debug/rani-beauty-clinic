'use client';

import { motion } from 'framer-motion';
import type { MastermindPlan } from '@/types/mastermind';

type ProductAction = 'keep' | 'replace' | 'add';

interface SkincareProduct {
  name: string;
  action: ProductAction;
  reason: string;
  time: 'am' | 'pm' | 'both';
}

// We derive skincare prescription from the plan's aftercare data
function deriveSkincareRx(plan: MastermindPlan): SkincareProduct[] {
  const products: SkincareProduct[] = [];
  const seen = new Set<string>();

  plan.aftercarePreview.forEach((ac) => {
    ac.productsRecommended.forEach((p) => {
      if (!seen.has(p.product)) {
        seen.add(p.product);
        // Heuristic: categorize by keywords
        const lower = p.product.toLowerCase();
        const isAM = lower.includes('spf') || lower.includes('sunscreen') || lower.includes('vitamin c') || lower.includes('moistur');
        const isPM = lower.includes('retinol') || lower.includes('retinoid') || lower.includes('peptide') || lower.includes('serum') || lower.includes('ghk');
        products.push({
          name: p.product,
          action: 'add',
          reason: p.reason,
          time: isAM && !isPM ? 'am' : isPM && !isAM ? 'pm' : 'both',
        });
      }
    });
  });

  return products;
}

function ActionIcon({ action }: { action: ProductAction }) {
  if (action === 'keep') {
    return (
      <div className="w-7 h-7 rounded-full bg-[#7EC8A0]/15 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7l3 3 5-5" stroke="#7EC8A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (action === 'replace') {
    return (
      <div className="w-7 h-7 rounded-full bg-[#F5C842]/15 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="#F5C842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 3v8M3 7h8" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ProductRow({ product, index }: { product: SkincareProduct; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.12, duration: 0.5, ease: 'easeOut' }}
      className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3.5 border border-white/[0.05]"
    >
      <ActionIcon action={product.action} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 font-medium" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {product.name}
        </p>
        <p className="text-xs text-white/40 mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {product.reason}
        </p>
      </div>
    </motion.div>
  );
}

interface SlideSkincareRxProps {
  plan: MastermindPlan;
}

export default function SlideSkincareRx({ plan }: SlideSkincareRxProps) {
  const products = deriveSkincareRx(plan);
  const amProducts = products.filter((p) => p.time === 'am' || p.time === 'both');
  const pmProducts = products.filter((p) => p.time === 'pm' || p.time === 'both');

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-8 py-10 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-2 text-center"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Your Skincare Prescription
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-sm text-white/40 text-center mb-8"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Based on our AI analysis of your skin profile
      </motion.p>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full overflow-y-auto hide-scrollbar">
        {/* AM Routine */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5C842]/20 to-[#C9A96E]/10 flex items-center justify-center border border-[#F5C842]/20">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="4" stroke="#F5C842" strokeWidth="1.5" />
                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg text-white font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                Morning Routine
              </h3>
              <p className="text-xs text-white/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>AM</p>
            </div>
          </motion.div>
          <div className="space-y-2">
            {amProducts.map((p, i) => (
              <ProductRow key={`am-${p.name}`} product={p} index={i} />
            ))}
            {amProducts.length === 0 && (
              <p className="text-sm text-white/30 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                No specific AM products identified
              </p>
            )}
          </div>
        </div>

        {/* PM Routine */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B7DB3]/20 to-[#4A5580]/10 flex items-center justify-center border border-[#6B7DB3]/20">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15 10.5A6.5 6.5 0 017.5 3a7.5 7.5 0 107.5 7.5z" stroke="#8B9DD3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg text-white font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                Evening Routine
              </h3>
              <p className="text-xs text-white/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>PM</p>
            </div>
          </motion.div>
          <div className="space-y-2">
            {pmProducts.map((p, i) => (
              <ProductRow key={`pm-${p.name}`} product={p} index={amProducts.length + i} />
            ))}
            {pmProducts.length === 0 && (
              <p className="text-sm text-white/30 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                No specific PM products identified
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="flex justify-center gap-6 mt-6"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <div className="w-2 h-2 rounded-full bg-[#7EC8A0]" /> Keep
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <div className="w-2 h-2 rounded-full bg-[#F5C842]" /> Replace
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <div className="w-2 h-2 rounded-full bg-[#C9A96E]" /> Add
        </div>
      </motion.div>
    </div>
  );
}
