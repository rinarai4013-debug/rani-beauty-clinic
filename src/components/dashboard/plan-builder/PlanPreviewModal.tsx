'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, TrendingUp, CheckCircle, CreditCard, Calendar } from 'lucide-react';
import type { PlanData } from '@/lib/treatment-plan/parser';
import type { TreatmentPackage } from '@/lib/treatment-plan/parser';

interface PlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: PlanData;
  packages: TreatmentPackage[];
}

export default function PlanPreviewModal({
  isOpen,
  onClose,
  planData,
  packages,
}: PlanPreviewModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Parse phases from programPlan text
  const phases = parseProgramPlan(planData.programPlan || '');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Navy header */}
            <div className="bg-[#0F1D2C] px-8 py-6 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-[#C9A96E] text-xs font-medium tracking-widest uppercase mb-1">
                  Treatment Plan Preview
                </p>
                <h2 className="text-white text-xl font-bold">
                  {planData.firstName}&apos;s Personalized Plan
                </h2>
                {planData.skinConcerns.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {planData.skinConcerns.slice(0, 4).map((concern, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Skin Health Score */}
              {planData.skinHealthScore !== null && planData.projectedScore !== null && (
                <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1a2d40] rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-[#C9A96E]" />
                    <h3 className="text-lg font-bold">Skin Health Score</h3>
                  </div>
                  <div className="flex items-center justify-center gap-12">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#C9A96E] tabular-nums">
                        {planData.skinHealthScore}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Current</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-[#C9A96E]" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400 tabular-nums">
                        {planData.projectedScore}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Projected</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {planData.intakeSummary && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0F1D2C] mb-2">Your Personalized Assessment</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{planData.intakeSummary}</p>
                </div>
              )}

              {/* Phases */}
              {phases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0F1D2C] mb-4">Treatment Phases</h3>
                  <div className="space-y-4">
                    {phases.map((phase, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-[#C9A96E] text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-[#0F1D2C]">{phase.title}</h4>
                        </div>
                        {phase.weeks && (
                          <p className="text-xs text-gray-400 mb-2 ml-8">{phase.weeks}</p>
                        )}
                        <ul className="ml-8 space-y-1">
                          {phase.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {packages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0F1D2C] mb-4">Investment Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.tier}
                        className={`rounded-xl border-2 p-5 ${
                          pkg.highlight
                            ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-2 ring-[#C9A96E]/20'
                            : 'border-gray-200'
                        }`}
                      >
                        {pkg.highlight && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A96E] text-white mb-2">
                            Recommended
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-[#0F1D2C]">{pkg.name}</h4>
                        <p className="text-2xl font-bold text-[#0F1D2C] mt-2 tabular-nums">
                          ${pkg.price.toLocaleString()}
                        </p>
                        {pkg.savings && (
                          <p className="text-xs text-green-600 font-semibold mt-0.5">{pkg.savings}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 mb-3">
                          {pkg.sessions} sessions
                        </p>

                        <div className="space-y-1 mb-3">
                          {pkg.extras.map((extra, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                              <CheckCircle className="h-3 w-3 text-[#C9A96E] flex-shrink-0" />
                              <span>{extra}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex items-center gap-1.5 text-xs text-gray-500">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>
                            ${pkg.monthlyPayment}/mo <span className="text-gray-400">x 12</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {planData.timeline && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#C9A96E]" />
                    Timeline
                  </h3>
                  <div className="bg-[#F8F6F1] rounded-xl p-4">
                    {planData.timeline.split('\n').filter(Boolean).map((line, idx) => (
                      <p key={idx} className="text-xs text-gray-600 py-1 border-b border-gray-200 last:border-b-0">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Step */}
              {planData.suggestedNextStep && (
                <div className="bg-[#0F1D2C] rounded-xl p-6 text-center">
                  <h3 className="text-[#C9A96E] text-sm font-semibold mb-2">Your Next Step</h3>
                  <p className="text-white text-sm">{planData.suggestedNextStep}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Helpers ---

interface ParsedPhasePreview {
  title: string;
  weeks: string | null;
  items: string[];
}

function parseProgramPlan(text: string): ParsedPhasePreview[] {
  if (!text) return [];

  const phases: ParsedPhasePreview[] = [];
  let currentPhase: ParsedPhasePreview | null = null;

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## Phase') || trimmed.startsWith('**Phase')) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        title: trimmed.replace(/^##\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, ''),
        weeks: null,
        items: [],
      };
    } else if (trimmed.startsWith('Week') && currentPhase && !currentPhase.weeks) {
      currentPhase.weeks = trimmed;
    } else if (trimmed.startsWith('- ') && currentPhase) {
      currentPhase.items.push(trimmed.replace(/^- /, ''));
    }
  }
  if (currentPhase) phases.push(currentPhase);

  return phases;
}
