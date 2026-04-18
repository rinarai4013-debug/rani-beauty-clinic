'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { CategoryScore, AuraConcern } from '@/types/mastermind';

interface ZoneDetailPanelProps {
  category: CategoryScore | null;
  relatedConcerns: AuraConcern[];
  onClose: () => void;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'mild': return '#059669';
    case 'moderate': return '#C9A96E';
    case 'severe': return '#DC2626';
    default: return '#6B7280';
  }
}

const TREATMENT_MAP: Record<string, string[]> = {
  wrinkles: ['Botox', 'RF Microneedling', 'Sofwave', 'Chemical Peel'],
  texture: ['HydraFacial', 'RF Microneedling', 'Chemical Peel', 'PRX-T33'],
  brownSpots: ['PicoWay Laser', 'VI Peel', 'HydraFacial', 'Chemical Peel'],
  redAreas: ['HydraFacial', 'Gentle Chemical Peel', 'LED Light Therapy'],
  pores: ['RF Microneedling', 'HydraFacial', 'Chemical Peel', 'PRX-T33'],
};

export default function ZoneDetailPanel({
  category,
  relatedConcerns,
  onClose,
}: ZoneDetailPanelProps) {
  const isOpen = category !== null;
  const treatments = category ? TREATMENT_MAP[category.category] || [] : [];

  return (
    <AnimatePresence>
      {isOpen && category && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#E8E4DF] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getSeverityColor(category.severity) }}
                />
                <h2 className="font-heading text-lg text-[#0F1D2C]">{category.label}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F8F6F1] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors"
              >
                <X className="w-4 h-4 text-[#0F1D2C]/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="font-body text-xs text-[#0F1D2C]/40">Absolute</p>
                  <p className="font-heading text-2xl font-bold text-[#0F1D2C]">
                    {category.absoluteScore.toFixed(1)}
                  </p>
                  <p className="font-body text-xs text-[#0F1D2C]/40">/ 5.0</p>
                </div>
                <div className="w-px h-12 bg-[#E8E4DF]" />
                <div className="text-center">
                  <p className="font-body text-xs text-[#0F1D2C]/40">vs Peers</p>
                  <p className="font-heading text-2xl font-bold" style={{ color: getSeverityColor(category.severity) }}>
                    {category.peerScore > 0 ? '+' : ''}{category.peerScore.toFixed(1)}
                  </p>
                  <p className="font-body text-xs text-[#0F1D2C]/40">
                    {category.peerScore <= 0 ? 'better' : 'worse'} than average
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF]">
                <p className="font-body text-sm text-[#0F1D2C]/70 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Severity Badge */}
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-[#0F1D2C]/40">Severity:</span>
                <span
                  className="px-3 py-1 rounded-full font-body text-xs font-semibold text-white"
                  style={{ backgroundColor: getSeverityColor(category.severity) }}
                >
                  {category.severity.charAt(0).toUpperCase() + category.severity.slice(1)}
                </span>
              </div>

              {/* Related Concerns */}
              {relatedConcerns.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-body text-sm font-semibold text-[#0F1D2C]">
                    Related Concerns
                  </h3>
                  {relatedConcerns.map((concern) => (
                    <div
                      key={concern.id}
                      className="p-3 rounded-xl border border-[#E8E4DF] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-medium text-[#0F1D2C]">
                          {concern.concern.replace(/_/g, ' ')}
                        </span>
                        <span
                          className="font-body text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: getSeverityColor(concern.severity) + '15',
                            color: getSeverityColor(concern.severity),
                          }}
                        >
                          {concern.urgency} priority
                        </span>
                      </div>
                      <p className="font-body text-xs text-[#0F1D2C]/50">
                        {concern.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Treatments */}
              <div className="space-y-3">
                <h3 className="font-body text-sm font-semibold text-[#0F1D2C]">
                  Recommended Treatments
                </h3>
                <div className="space-y-2">
                  {treatments.map((treatment, i) => (
                    <motion.div
                      key={treatment}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#C9A96E]/20 bg-[#C9A96E]/5 hover:border-[#C9A96E]/40 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center shrink-0">
                        <span className="font-body text-xs font-bold text-rani-gold-accessible">
                          {i + 1}
                        </span>
                      </div>
                      <span className="font-body text-sm text-[#0F1D2C]">{treatment}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
